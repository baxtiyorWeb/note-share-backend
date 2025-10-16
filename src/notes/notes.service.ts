import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { NotesEntity } from "./entities/notes.entity";
import { ProfileEntity } from "./../profile/entities/profile.entity";
import { CreateNoteDto } from "./dto/note-create-dto";
import { UpdateNoteDto } from "./dto/not-update-dto";
import { UserEntity } from "./../users/entities/user.entity";

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(NotesEntity)
    private noteRepo: Repository<NotesEntity>,
    @InjectRepository(ProfileEntity)
    private profileRepo: Repository<ProfileEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>
  ) { }

  async create(profileId: number, dto: CreateNoteDto) {
    const profile = await this.profileRepo.findOne({ where: { id: profileId } });

    if (!profile) {
      throw new NotFoundException("Profile not found");
    }

    const note = this.noteRepo.create({
      ...dto,
    });

    return await this.noteRepo.save(note);
  }

  async findAllMyNotes(userId: number) {
    // 1️⃣ Avval userni profil bilan birga topamiz
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ["profile"],
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (!user.profile) {
      throw new NotFoundException("Profile not found for this user");
    }

    // 2️⃣ Endi shu profil ID orqali note larni olamiz
    const notes = await this.noteRepo.find({
      where: { profile: { id: user.profile.id } },
      relations: [
        "profile",
        "views",
        "views.viewer",
        "likes",
        "likes.profile",
        "comments",
        "comments.author",
      ],
      order: { createdAt: "DESC" },
    });

    // 3️⃣ Qo‘shimcha statistika qo‘shish (ixtiyoriy)
    return notes.map(note => ({
      ...note,
      totalViews: note.views?.length || 0,
      totalLikes: note.likes?.length || 0,
      totalComments: note.comments?.length || 0,
    }));
  }



  async sharedWithMe(profileId: number) {
    const notes = await this.noteRepo
      .createQueryBuilder("note")
      .leftJoinAndSelect("note.profile", "profile")
      .leftJoinAndSelect("note.sharedWith", "sharedWith")
      .leftJoinAndSelect("note.likes", "likes")
      .leftJoinAndSelect("note.views", "views")
      .leftJoinAndSelect("note.comments", "comments")
      .where("sharedWith.id = :profileId", { profileId })
      .orderBy("note.createdAt", "DESC")
      .getMany();

    // Har bir note uchun count qo‘shamiz
    return notes.map((note) => ({
      ...note,
      totalLikes: note.likes?.length || 0,
      totalViews: note.views?.length || 0,
      totalComments: note.comments?.length || 0,
    }));
  }

  async findOne(userId: number, noteId: number) {
    // 1. Userni olish
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['profile'],
    });

    if (!user) throw new NotFoundException('User not found');

    // 2. Agar profil yo‘q bo‘lsa — yaratish
    let profile = user.profile;
    if (!profile) {
      profile = this.profileRepo.create({ user });
      await this.profileRepo.save(profile);

      user.profile = profile;
      await this.userRepo.save(user);
    }

    // 3. Note’ni olish
    const note = await this.noteRepo.findOne({
      where: { id: noteId },
      relations: ['profile', 'sharedWith'],
    });

    if (!note) throw new NotFoundException('Note not found');

    // 💡 4. Agar note.profile mavjud bo‘lmasa, uni ham user profili bilan bog‘lab qo‘yamiz
    if (!note.profile) {
      note.profile = profile;
      await this.noteRepo.save(note);
    }

    // 5. Huquqni tekshirish
    const isOwner = note.profile?.id === profile.id;
    const isShared = note.sharedWith.some((p) => p.id === profile.id);

    if (!isOwner && !isShared) {
      throw new ForbiddenException('You do not have access to this note');
    }

    return note;
  }


  async getExploreNotes(sort?: string, search?: string, page = 1, size = 10) {
    const query = this.noteRepo
      .createQueryBuilder('note')
      .leftJoinAndSelect('note.profile', 'profile')
      .leftJoinAndSelect('note.likes', 'likes')
      .leftJoinAndSelect('note.comments', 'comments')
      .leftJoinAndSelect('note.views', 'views')
      .where('note.isPublic = :isPublic', { isPublic: true });

    // 🔍 Qidiruv
    if (search) {
      query.andWhere(
        '(note.title ILIKE :search OR note.content ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // 🔽 Saralash
    if (sort === 'popular') {
      query
        .loadRelationCountAndMap('note.likesCount', 'note.likes')
        .orderBy('likesCount', 'DESC');
    } else if (sort === 'commented') {
      query
        .loadRelationCountAndMap('note.commentsCount', 'note.comments')
        .orderBy('commentsCount', 'DESC');
    } else {
      query.orderBy('note.createdAt', 'DESC');
    }

    // 🔢 Count-larni har doim yuklash
    query
      .loadRelationCountAndMap('note.likesCount', 'note.likes')
      .loadRelationCountAndMap('note.commentsCount', 'note.comments')
      .loadRelationCountAndMap('note.viewsCount', 'note.views');

    // 📄 Pagination logikasi
    const skip = (page - 1) * size;

    const [notes, total] = await query
      .skip(skip)
      .take(size)
      .getManyAndCount();

    return {
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
      notes,
    };
  }



  async update(profileId: number, id: number, dto: UpdateNoteDto) {
    const note = await this.noteRepo.findOne({
      where: { id },
      relations: ["profile"],
    });
    if (!note) throw new NotFoundException("Note not found");
    if (note.profile.id !== profileId)
      throw new ForbiddenException("You cannot edit this note");

    Object.assign(note, dto);
    return this.noteRepo.save(note);
  }
  async remove(userId: number, noteId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ["profile"],
    });
    if (!user) throw new NotFoundException("User not found");

    const profile = await this.profileRepo.findOne({
      where: { user: { id: userId } },
    });

    const note = await this.noteRepo.findOne({
      where: { id: noteId },
      relations: ["profile"],
    });
    if (!note) throw new NotFoundException("Note not found");

    console.log(note?.profile?.id);
    console.log(profile?.id);

    if (note.profile.id !== profile?.id) {
      throw new ForbiddenException("You cannot delete this note");
    }

    return this.noteRepo.remove(note);
  }


  async shareNote(
    noteId: number,
    targetProfileId: number,
    ownerProfileId: number,
  ) {
    const note = await this.noteRepo.findOne({
      where: { id: noteId },
      relations: ['profile', 'sharedWith'],
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    if (note.profile.id !== ownerProfileId) {
      throw new ForbiddenException('You can only share your own notes');
    }

    const filteredSharedWith = note.sharedWith.filter(
      (p) => p.id !== note.profile.id,
    );

    if (filteredSharedWith.length !== note.sharedWith.length) {
      note.sharedWith = filteredSharedWith;
      await this.noteRepo.save(note);
      console.log('⚙️ Auto-cleaned self-shared note for profile:', note.profile.id);
    }

    if (note.profile.id === targetProfileId) {
      throw new BadRequestException('You cannot share a note with yourself');
    }

    const targetProfile = await this.profileRepo.findOne({
      where: { id: targetProfileId },
    });

    if (!targetProfile) {
      throw new NotFoundException('Target profile not found');
    }

    const alreadyShared = note.sharedWith.some(
      (p) => p.id === targetProfile.id,
    );

    if (alreadyShared) {
      throw new ConflictException('Note already shared with this profile');
    }

    note.sharedWith.push(targetProfile);
    await this.noteRepo.save(note);

    return {
      message: 'Note shared successfully',
      sharedWith: note.sharedWith.map((p) => ({
        id: p.id,
        username: p.username,
      })),
    };
  }



}
