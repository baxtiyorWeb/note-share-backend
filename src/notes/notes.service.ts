import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Brackets } from "typeorm";
import { NotesEntity } from "./entities/notes.entity";
import { ProfileEntity } from "../profile/entities/profile.entity";
import { UserEntity } from "../users/entities/user.entity";
import { CreateNoteDto } from "./dto/note-create-dto";
import { UpdateNoteDto } from "./dto/not-update-dto";
import { ReminderService } from "./reminder.service";

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(NotesEntity)
    private readonly noteRepo: Repository<NotesEntity>,
    @InjectRepository(ProfileEntity)
    private readonly profileRepo: Repository<ProfileEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly reminderService: ReminderService,
  ) { }

  // ✅ Create a note
  async create(userId: number, dto: CreateNoteDto) {
    const profile = await this.profileRepo.findOne({
      where: { user: { id: userId } },
      relations: ["user"],
    });
    if (!profile) throw new NotFoundException("Profile not found");

    const note = this.noteRepo.create({
      ...dto,
      profile,
    });

    const saved = await this.noteRepo.save(note);

    // 🕒 Reminder
    if (dto.reminder_at) {
      await this.reminderService.scheduleReminder(
        saved.id,
        new Date(dto.reminder_at),
        saved.title || "No title",
        profile.user.id,
      );
    }

    return saved;
  }

  // ✅ Get all notes for current user
  async findAllMyNotes(userId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ["profile"],
    });
    if (!user) throw new NotFoundException("User not found");

    const profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException("Profile not found");

    const notes = await this.noteRepo.find({
      where: { profile: { id: profile.id } },
      relations: [
        "profile",
        "views",
        "views.viewer",
        "likes",
        "likes.profile",
        "comments",
        "comments.author",
        "sharedWith",
      ],
      order: { createdAt: "DESC" },
    });

    return notes.map((note) => ({
      ...note,
      totalViews: note.views?.length || 0,
      totalLikes: note.likes?.length || 0,
      totalComments: note.comments?.length || 0,
    }));
  }

  // ✅ Explore notes (public only)
  async getExploreNotes(sort?: string, search?: string, page = 1, size = 10) {
    const query = this.noteRepo
      .createQueryBuilder("note")
      .leftJoinAndSelect("note.profile", "profile")
      .leftJoin("note.likes", "likes")
      .leftJoin("note.comments", "comments")
      .leftJoin("note.views", "views")
      .leftJoin("comments.author", "commentAuthor")
      .where("note.visibility = :visibility", { visibility: "public" })
      .groupBy("note.id")
      .addGroupBy("profile.id")
      .addGroupBy("commentAuthor.id");

    if (search) {
      const normalized = search.trim().toLowerCase();
      query.andWhere(
        new Brackets((qb) => {
          qb.where(`similarity(LOWER(note.title), :search) > 0.1`)
            .orWhere(`similarity(LOWER(note.content), :search) > 0.1`)
            .orWhere(`LOWER(profile.username) LIKE :likeSearch`)
            .orWhere(`LOWER(profile.firstName) LIKE :likeSearch`)
            .orWhere(`LOWER(profile.lastName) LIKE :likeSearch`);
        }),
      )
        .setParameters({ search: normalized, likeSearch: `%${normalized}%` });
    }

    query
      .addSelect("COUNT(DISTINCT likes.id)", "likesCount")
      .addSelect("COUNT(DISTINCT comments.id)", "commentsCount")
      .addSelect("COUNT(DISTINCT views.id)", "viewsCount");

    if (sort === "popular") {
      query.addOrderBy("likesCount", "DESC");
    } else if (sort === "commented") {
      query.addOrderBy("commentsCount", "DESC");
    } else {
      query.addOrderBy("note.createdAt", "DESC");
    }

    const skip = (page - 1) * size;
    const [notes, total] = await query.skip(skip).take(size).getManyAndCount();

    const totalPages = Math.ceil(total / size);
    return {
      total,
      page,
      size,
      totalPages,
      nextPage: page < totalPages ? page + 1 : null,
      notes,
    };
  }

  // ✅ Shared notes with current profile
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

  // ✅ Find a single note (with access validation)
  async findOne(userId: number, noteId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ["profile"],
    });
    if (!user) throw new NotFoundException("User not found");

    // ensure profile exists
    await this.profileRepo.upsert(
      { userId: user.id, username: `user_${user.id}` },
      ["userId"],
    );

    const profile = await this.profileRepo.findOne({
      where: { userId: user.id },
    });
    if (!profile) throw new InternalServerErrorException("Profile not found");

    const note = await this.noteRepo.findOne({
      where: { id: noteId },
      relations: ["profile", "sharedWith"],
    });
    if (!note) throw new NotFoundException("Note not found");

    const isOwner = note.profile?.id === profile.id;
    const isShared = note.sharedWith?.some((p) => p.id === profile.id);

    if (!isOwner && !isShared)
      throw new ForbiddenException("You do not have access to this note");

    return note;
  }

  // ✅ Update note
  async update(userId: number, noteId: number, dto: UpdateNoteDto) {
    const note = await this.noteRepo.findOne({
      where: { id: noteId },
      relations: ["profile", "profile.user"],
    });
    if (!note) throw new NotFoundException("Note not found");

    if (note.profile.user.id !== userId)
      throw new ForbiddenException("You cannot edit this note");

    const profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException("Profile not found");

    const oldReminder = note.reminder_at?.toISOString();
    Object.assign(note, dto);
    note.profile = profile;

    const updated = await this.noteRepo.save(note);

    // update reminder if changed
    if (dto.reminder_at && dto.reminder_at !== oldReminder) {
      await this.reminderService.scheduleReminder(
        updated.id,
        new Date(dto.reminder_at),
        updated.title || "No title",
        userId,
      );
    }

    return updated;
  }

  // ✅ Delete note
  async remove(userId: number, noteId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ["profile"],
    });
    if (!user) throw new NotFoundException("User not found");

    const note = await this.noteRepo.findOne({
      where: { id: noteId },
      relations: ["profile"],
    });
    if (!note) throw new NotFoundException("Note not found");

    if (note.profile.id !== user.profile.id)
      throw new ForbiddenException("You cannot delete this note");

    await this.noteRepo.remove(note);
    return { message: "Note deleted successfully" };
  }

  // ✅ Share a note with another profile
  async shareNote(noteId: number, targetProfileId: number, ownerProfileId: number) {
    const note = await this.noteRepo.findOne({
      where: { id: noteId },
      relations: ["profile", "sharedWith"],
    });
    if (!note) throw new NotFoundException("Note not found");
    if (note.profile.id !== ownerProfileId)
      throw new ForbiddenException("You can only share your own notes");

    if (note.sharedWith?.some((p) => p.id === targetProfileId))
      throw new ConflictException("Already shared with this profile");

    const targetProfile = await this.profileRepo.findOne({
      where: { id: targetProfileId },
    });
    if (!targetProfile) throw new NotFoundException("Target profile not found");

    note.sharedWith.push(targetProfile);
    await this.noteRepo.save(note);

    return {
      message: "Note shared successfully",
      sharedWith: note.sharedWith.map((p) => ({
        id: p.id,
        username: p.username,
      })),
    };
  }
}
