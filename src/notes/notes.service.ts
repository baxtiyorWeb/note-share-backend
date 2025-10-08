import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { NotesEntity } from "./entities/notes.entity";
import { ProfileEntity } from "src/profile/entities/profile.entity";
import { CreateNoteDto } from "./dto/note-create-dto";
import { UpdateNoteDto } from "./dto/not-update-dto";
import { ShareNoteDto } from "./dto/note-share-dto";
import { UserEntity } from "src/users/entities/user.entity";

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

  async findAll(profileId: number) {
    const notes = await this.noteRepo.find({
      where: [
        { profile: { id: profileId } },
        { sharedWith: { id: profileId } },
      ],
      relations: [
        "profile",
        "sharedWith",
        "views",
        "views.viewer",
        "likes",
        "likes.profile",
        "comments",
        "comments.author",
      ],
      order: {
        createdAt: "DESC",
        comments: { createdAt: "DESC" },
      },
    });

    return notes.map((note) => ({
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

  async remove(profileId: number, id: number) {
    const note = await this.noteRepo.findOne({
      where: { id },
      relations: ["profile"],
    });
    if (!note) throw new NotFoundException("Note not found");
    if (note.profile.id !== profileId)
      throw new ForbiddenException("You cannot delete this note");

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
