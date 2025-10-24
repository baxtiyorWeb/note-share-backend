import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In, Brackets } from "typeorm";
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
    const profile = await this.profileRepo.findOne({ where: { user: { id: profileId } } });

    console.log(profile)

    if (!profile) {
      throw new NotFoundException("Profile not found");
    }

    const note = this.noteRepo.create({
      ...dto,
      profile
    });

    return await this.noteRepo.save(note);
  }

  async findAllMyNotes(userId: number) {
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

    return notes.map((note) => ({
      ...note,
      totalLikes: note.likes?.length || 0,
      totalViews: note.views?.length || 0,
      totalComments: note.comments?.length || 0,
    }));
  }

  async findOne(userId: number, noteId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['profile'],
    });

    if (!user) throw new NotFoundException('User not found');

    let profile = user.profile;
    if (!profile) {
      profile = this.profileRepo.create({ user });
      await this.profileRepo.save(profile);

      user.profile = profile;
      await this.userRepo.save(user);
    }

    const note = await this.noteRepo.findOne({
      where: { id: noteId },
      relations: ['profile', 'sharedWith'],
    });

    if (!note) throw new NotFoundException('Note not found');

    if (!note.profile) {
      note.profile = profile;
      await this.noteRepo.save(note);
    }

    const isOwner = note.profile?.id === profile.id;
    const isShared = note.sharedWith.some((p) => p.id === profile.id);

    if (!isOwner && !isShared) {
      throw new ForbiddenException('You do not have access to this note');
    }

    return note;
  }




  async getExploreNotes(sort?: string, search?: string, page = 1, size = 5) {
    const query = this.noteRepo
      .createQueryBuilder('note')
      .leftJoinAndSelect('note.profile', 'profile')

      .leftJoin('note.likes', 'likes')
      .leftJoin('note.comments', 'comments')
      .leftJoin('note.views', 'views')
      .leftJoin('comments.author', 'commentsAuthor')
      .where('note.isPublic = :isPublic', { isPublic: true })

      .groupBy('note.id')
      .addGroupBy('profile.id')
      .addGroupBy('commentsAuthor.id');

    if (search) {
      const normalized = search.trim().toLowerCase();

      if (normalized.includes('anonymous')) {
        query.andWhere('note.profileId IS NULL');
      } else {
        query.andWhere(
          new Brackets((qb) => {
            qb.where(`similarity(LOWER(note.title), :search) > 0.1`)
              .orWhere(`similarity(LOWER(note.content), :search) > 0.1`)
              .orWhere(`similarity(LOWER(COALESCE(profile.username, '')), :search) > 0.1`)
              .orWhere(`similarity(LOWER(COALESCE(profile.firstName, '')), :search) > 0.1`)
              .orWhere(`similarity(LOWER(COALESCE(profile.lastName, '')), :search) > 0.1`)
              .orWhere(`similarity(LOWER(COALESCE(comments.text, '')), :search) > 0.1`)
              .orWhere(`similarity(LOWER(COALESCE(commentsAuthor.username, '')), :search) > 0.1`)
              .orWhere(`similarity(LOWER(COALESCE(commentsAuthor.firstName, '')), :search) > 0.1`)
              .orWhere(`similarity(LOWER(COALESCE(commentsAuthor.lastName, '')), :search) > 0.1`)
          }),
        ).setParameter('search', normalized);
      }
    }

    query
      .addSelect('COUNT(DISTINCT likes.id)', 'likescount')     // KICHIK HARF
      .addSelect('COUNT(DISTINCT comments.id)', 'commentscount') // KICHIK HARF
      .addSelect('COUNT(DISTINCT views.id)', 'viewscount');   // KICHIK HARF


    if (sort === 'popular') {
      query.addOrderBy('likescount', 'DESC');
    } else if (sort === 'commented') {
      query.addOrderBy('commentscount', 'DESC');
    }

    if (!sort || sort === 'latest' || search) {
      query.addOrderBy('note.createdAt', 'DESC');
    }


    query
      .loadRelationCountAndMap('note.likesCount', 'note.likes')
      .loadRelationCountAndMap('note.commentsCount', 'note.comments')
      .loadRelationCountAndMap('note.viewsCount', 'note.views');


    const skip = (Number(page) - 1) * Number(size);
    const [notes, total] = await query.skip(skip).take(Number(size)).getManyAndCount();

    const totalPages = Math.ceil(total / Number(size));

    return {
      total,
      page: Number(page),
      size: Number(size),
      totalPages,
      nextPage: Number(page) < totalPages ? Number(page) + 1 : undefined,
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
