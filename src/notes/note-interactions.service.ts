import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotesEntity } from "./entities/notes.entity";
import { ProfileEntity } from "../profile/entities/profile.entity";
import { NoteViewEntity } from "./entities/note-view.entity";
import { NoteLikeEntity } from "./entities/note-like.entity";
import { NoteCommentEntity } from "./entities/note-comment.entity";

@Injectable()
export class NoteInteractionsService {
  constructor(
    @InjectRepository(NotesEntity)
    private readonly noteRepo: Repository<NotesEntity>,

    @InjectRepository(ProfileEntity)
    private readonly profileRepo: Repository<ProfileEntity>,

    @InjectRepository(NoteViewEntity)
    private readonly viewRepo: Repository<NoteViewEntity>,

    @InjectRepository(NoteLikeEntity)
    private readonly likeRepo: Repository<NoteLikeEntity>,

    @InjectRepository(NoteCommentEntity)
    private readonly commentRepo: Repository<NoteCommentEntity>,
  ) { }

  // ✅ Helper: Get or create profile by userId
  private async getOrCreateProfile(userId: number): Promise<ProfileEntity> {
    let profile = await this.profileRepo.findOne({ where: { user: { id: userId } } });
    if (!profile) {
      const username = `user_${userId}_${Math.floor(Math.random() * 10000)}`;
      profile = this.profileRepo.create({ userId, username });
      profile = await this.profileRepo.save(profile);
    }
    return profile;
  }

  // ✅ Add view
  async addView(noteId: number, userId: number) {
    const note = await this.noteRepo.findOne({ where: { id: noteId } });
    if (!note) throw new NotFoundException("Note not found");

    const profile = await this.getOrCreateProfile(userId);

    const exists = await this.viewRepo.findOne({
      where: { note: { id: noteId }, viewer: { id: profile.id } },
    });

    if (!exists) {
      const view = this.viewRepo.create({ note, viewer: profile });
      await this.viewRepo.save(view);
    }

    const totalViews = await this.viewRepo.count({
      where: { note: { id: noteId } },
    });

    return { message: "View counted", totalViews };
  }

  // ✅ Toggle like
  async toggleLike(noteId: number, userId: number) {
    const note = await this.noteRepo.findOne({ where: { id: noteId } });
    if (!note) throw new NotFoundException("Note not found");

    const profile = await this.getOrCreateProfile(userId);

    const existing = await this.likeRepo.findOne({
      where: { note: { id: noteId }, profile: { id: profile.id } },
    });

    if (existing) {
      await this.likeRepo.remove(existing);
      const totalLikes = await this.likeRepo.count({ where: { note: { id: noteId } } });
      return { liked: false, totalLikes };
    }

    const like = this.likeRepo.create({ note, profile });
    await this.likeRepo.save(like);

    const totalLikes = await this.likeRepo.count({ where: { note: { id: noteId } } });
    return { liked: true, totalLikes };
  }

  // ✅ Add comment
  async addComment(noteId: number, userId: number, text: string) {
    const note = await this.noteRepo.findOne({ where: { id: noteId } });
    if (!note) throw new NotFoundException("Note not found");

    const profile = await this.getOrCreateProfile(userId);

    const comment = this.commentRepo.create({
      note,
      author: profile,
      text,
    });
    await this.commentRepo.save(comment);

    return {
      message: "Comment added",
      comment: {
        id: comment.id,
        text: comment.text,
        createdAt: comment.createdAt,
        author: {
          id: profile.id,
          username: profile.username,
        },
      },
    };
  }

  // ✅ Get all comments
  async getComments(noteId: number) {
    const note = await this.noteRepo.findOne({ where: { id: noteId } });
    if (!note) throw new NotFoundException("Note not found");

    return this.commentRepo.find({
      where: { note: { id: noteId } },
      relations: ["author"],
      order: { createdAt: "ASC" },
    });
  }

  // ✅ Delete comment
  async deleteComment(commentId: number, userId: number) {
    const profile = await this.getOrCreateProfile(userId);

    const comment = await this.commentRepo.findOne({
      where: { id: commentId },
      relations: ["author"],
    });
    if (!comment) throw new NotFoundException("Comment not found");

    if (comment.author.id !== profile.id)
      throw new ConflictException("You can only delete your own comment");

    await this.commentRepo.remove(comment);
    return { message: "Comment deleted successfully" };
  }
}
