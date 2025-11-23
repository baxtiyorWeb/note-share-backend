// src/notes/notes.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, In, LessThanOrEqual } from 'typeorm';
import { NotesEntity } from './entities/notes.entity';
import { ProfileEntity } from '../profile/entities/profile.entity';
import { UserEntity } from '../users/entities/user.entity';
import { SavedNoteEntity } from './entities/saved-note.entity';
import { NoteLikeEntity } from './entities/note-like.entity';
import { NoteViewEntity } from './entities/note-view.entity';
import { NoteCommentEntity } from './entities/note-comment.entity';
import { NoteExportEntity } from './entities/note-export.entity';
import { PaymentEntity } from '../payment/entities/payment.entity';
import { CreateNoteDto } from './dto/note-create-dto';
import { UpdateNoteDto } from './dto/not-update-dto';
import { ReminderService } from './reminder.service';
import { ExportService } from './../export/export.service';
import { AiService } from './../notification/ai.service';
import { NotificationService } from '../notification/notification.service';
import { PaymentService } from './../payment/payment.service';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(NotesEntity)
    private readonly noteRepo: Repository<NotesEntity>,

    @InjectRepository(ProfileEntity)
    private readonly profileRepo: Repository<ProfileEntity>,

    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,

    @InjectRepository(SavedNoteEntity)
    private readonly savedNoteRepo: Repository<SavedNoteEntity>,

    @InjectRepository(NoteLikeEntity)
    private readonly likeRepo: Repository<NoteLikeEntity>,

    @InjectRepository(NoteViewEntity)
    private readonly viewRepo: Repository<NoteViewEntity>,

    @InjectRepository(NoteCommentEntity)
    private readonly commentRepo: Repository<NoteCommentEntity>,

    @InjectRepository(NoteExportEntity)
    private readonly exportRepo: Repository<NoteExportEntity>,

    @InjectRepository(PaymentEntity)
    private readonly paymentRepo: Repository<PaymentEntity>,

    private readonly reminderService: ReminderService,
    private readonly exportService: ExportService,
    private readonly aiService: AiService,
    private readonly notificationService: NotificationService,
  ) { }

  // === HELPER: Ensure profile ===
  public async ensureProfile(userId: number): Promise<ProfileEntity> {
    let profile = await this.profileRepo.findOne({ where: { user: { id: userId } } });
    if (!profile) {
      const username = `user_${userId}_${Math.floor(Math.random() * 10000)}`;
      profile = this.profileRepo.create({ userId, username });
      profile = await this.profileRepo.save(profile);
    }
    return profile;
  }

  // === HELPER: Get owned note ===
  private async getOwnedNote(userId: number, noteId: number): Promise<NotesEntity> {
    const note = await this.noteRepo.findOne({
      where: { id: noteId },
      relations: ['profile', 'profile.user'],
    });
    if (!note) throw new NotFoundException('Note not found');
    if (note.profile.user.id !== userId) throw new ForbiddenException('Not your note');
    return note;
  }

  // === CREATE NOTE ===
  async create(userId: number, dto: CreateNoteDto): Promise<NotesEntity> {
    const profile = await this.ensureProfile(userId);
    const { mentions, hashtags } = this.extractMentionsAndHashtags(dto.content || '');

    const note = this.noteRepo.create({
      ...dto,
      profile,
      status: dto.status || 'published',
      seo_slug: dto.seo_slug || this.generateSlug(dto.title),
      mentions: mentions.map(m => ({ profileId: 0, position: m.position })),
      hashtags: hashtags.map(h => ({ tag: h.tag, position: h.position })),
    });

    const saved = await this.noteRepo.save(note);

    // Resolve mentions
    for (const m of mentions) {
      const target = await this.profileRepo.findOne({ where: { username: m.username } });
      if (target) {
        await this.notificationService.create(
          'MENTION',
          profile.id,
          target.id,
          saved.id,
          `@${profile.username} mentioned you in a note`,
        );
      }
    }

    // Schedule reminder
    if (dto.reminder_at) {
      await this.reminderService.scheduleReminder(
        saved.id,
        new Date(dto.reminder_at),
        saved.title || 'Reminder',
        userId,
      );
    }

    return saved;
  }



  // === SCHEDULED POST ===
  async schedule(userId: number, dto: CreateNoteDto): Promise<NotesEntity> {
    const profile = await this.ensureProfile(userId);
    if (!dto.scheduled_at) throw new BadRequestException('scheduled_at is required');

    const note = this.noteRepo.create({
      ...dto,
      profile,
      status: 'scheduled',
      scheduled_at: new Date(dto.scheduled_at),
      seo_slug: dto.seo_slug || this.generateSlug(dto.title),
    });

    return this.noteRepo.save(note);
  }

  // === DRAFTS ===
  async getDrafts(userId: number) {
    const profile = await this.ensureProfile(userId);
    return this.noteRepo.find({
      where: { profile: { id: profile.id }, status: 'draft' },
      order: { updatedAt: 'DESC' },
    });
  }

  // === FIND ALL MY NOTES ===
  async findAllMyNotes(userId: number) {
    const profile = await this.ensureProfile(userId);
    const notes = await this.noteRepo.find({
      where: { profile: { id: profile.id } },
      relations: ['likes', 'comments', 'views', 'savedBy'],
      order: { createdAt: 'DESC' },
    });

    return notes.map(n => this.enrichNote(n, profile.id));
  }

  // === FIND ONE ===
  async findOne(userId: number, noteId: number) {
    const profile = await this.ensureProfile(userId);
    const note = await this.noteRepo.findOne({
      where: { id: noteId },
      relations: ['profile', 'sharedWith', 'savedBy', 'likes', 'comments', 'views'],
    });
    if (!note) throw new NotFoundException('Note not found');

    const isOwner = note.profile.id === profile.id;
    const isShared = note.sharedWith?.some(p => p.id === profile.id);
    const canView = note.visibility === 'public' || isOwner || isShared;

    if (!canView && note.status !== 'published') throw new ForbiddenException('Access denied');
    if (note.is_paywall && !(await this.checkPaywallAccess(userId, note))) {
      throw new ForbiddenException('Paywall: purchase required');
    }

    return this.enrichNote(note, profile.id);
  }

  // === UPDATE ===
  async update(userId: number, noteId: number, dto: UpdateNoteDto) {
    const note = await this.getOwnedNote(userId, noteId);
    const oldReminder = note.reminder_at?.toISOString();

    Object.assign(note, dto);
    if (dto.title) note.seo_slug = this.generateSlug(dto.title);

    const updated = await this.noteRepo.save(note);

    if (dto.reminder_at && dto.reminder_at !== oldReminder) {
      await this.reminderService.scheduleReminder(
        updated.id,
        new Date(dto.reminder_at),
        updated.title || 'Reminder',
        userId,
      );
    }

    return updated;
  }

  // === DELETE ===
  async remove(userId: number, noteId: number) {
    const note = await this.getOwnedNote(userId, noteId);
    await this.noteRepo.remove(note);
    return { message: 'Note deleted successfully' };
  }

  // === EXPLORE (PUBLIC FEED) ===
  // src/notes/notes.service.ts (faqat bu funksiya o‘zgartirildi)

  async getExploreNotes(
    sort?: string,
    search?: string,
    page = 1,
    size = 10,
    type: 'note' | 'news' = 'note',
  ) {
    const qb = this.noteRepo
      .createQueryBuilder('note')
      .leftJoinAndSelect('note.profile', 'profile')
      .leftJoin('note.likes', 'likes')
      .leftJoin('note.comments', 'comments')
      .leftJoin('note.views', 'views')
      .where('note.visibility = :visibility', { visibility: 'public' })
      .andWhere('note.status = :status', { status: 'published' })
      .andWhere('note.type = :type', { type });

    // SEARCH WITH pg_trgm + similarity
    if (search) {
      const normalized = search.trim();

      qb.andWhere(
        new Brackets((sub) => {
          sub
            .where(`similarity(note.title, :s) > 0.2`)
            .orWhere(`similarity(note.content, :s) > 0.1`)
            .orWhere(`similarity(profile.username, :s) > 0.3`)
            .orWhere(`similarity(profile.firstName, :s) > 0.3`)
            .orWhere(`similarity(profile.lastName, :s) > 0.3`);
        }),
      ).setParameter('s', normalized);
    }

    // Hisob-kitoblar
    qb.addSelect('COUNT(DISTINCT likes.id)', 'likesCount')
      .addSelect('COUNT(DISTINCT comments.id)', 'commentsCount')
      .addSelect('COUNT(DISTINCT views.id)', 'viewsCount');

    // Agar search bo‘lsa — relevance bo‘yicha tartiblash
    if (search) {
      qb.addSelect(
        `(similarity(note.title, :s) * 3 + similarity(note.content, :s))`,
        'relevance',
      ).setParameter('s', search);
    }

    qb.groupBy('note.id')
      .addGroupBy('profile.id');

    // Tartiblash
    if (search) {
      qb.addOrderBy('relevance', 'DESC');
    } else if (sort === 'popular') {
      qb.addOrderBy('likesCount', 'DESC');
    } else if (sort === 'commented') {
      qb.addOrderBy('commentsCount', 'DESC');
    } else {
      qb.addOrderBy('note.createdAt', 'DESC');
    }

    // Pagination
    const skip = (page - 1) * size;
    const [notes, total] = await qb.skip(skip).take(size).getManyAndCount();

    return {
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
      nextPage: page * size < total ? page + 1 : null,
      notes: notes.map(n => this.enrichNote(n)),
    };
  }

  // === SHARE NOTE ===
  async shareNote(noteId: number, targetProfileId: number, ownerProfileId: number) {
    const note = await this.noteRepo.findOne({
      where: { id: noteId },
      relations: ['profile', 'sharedWith'],
    });
    if (!note) throw new NotFoundException('Note not found');
    if (note.profile.id !== ownerProfileId) throw new ForbiddenException('Only owner can share');

    if (note.sharedWith?.some(p => p.id === targetProfileId))
      throw new ConflictException('Already shared');

    const target = await this.profileRepo.findOne({ where: { id: targetProfileId } });
    if (!target) throw new NotFoundException('Target profile not found');

    note.sharedWith = [...(note.sharedWith || []), target];
    await this.noteRepo.save(note);

    await this.notificationService.create(
      'SHARE',
      ownerProfileId,
      target.id,
      noteId,
      `@${note.profile.username} shared a note with you`,
    );

    return { message: 'Shared successfully' };
  }

  // === SHARED WITH ME ===
  async sharedWithMe(userId: number) {
    const profile = await this.ensureProfile(userId);
    const notes = await this.noteRepo
      .createQueryBuilder('note')
      .leftJoinAndSelect('note.profile', 'owner')
      .leftJoinAndSelect('note.sharedWith', 'sharedWith')
      .where('sharedWith.id = :pid', { pid: profile.id })
      .orderBy('note.createdAt', 'DESC')
      .getMany();

    return notes.map(n => this.enrichNote(n, profile.id));
  }

  // === SAVE / UNSAVE ===
  async saveNote(userId: number, noteId: number) {
    const profile = await this.ensureProfile(userId);
    const note = await this.noteRepo.findOne({ where: { id: noteId } });
    if (!note) throw new NotFoundException();

    const exists = await this.savedNoteRepo.findOne({
      where: { profile: { id: profile.id }, note: { id: noteId } },
    });
    if (exists) throw new ConflictException('Already saved');

    const saved = this.savedNoteRepo.create({ profile, note });
    await this.savedNoteRepo.save(saved);
    return { message: 'Saved', isSaved: true };
  }

  async unsaveNote(userId: number, noteId: number) {
    const profile = await this.ensureProfile(userId);
    const exists = await this.savedNoteRepo.findOne({
      where: { profile: { id: profile.id }, note: { id: noteId } },
    });
    if (!exists) throw new NotFoundException('Not saved');
    await this.savedNoteRepo.remove(exists);
    return { message: 'Unsaved', isSaved: false };
  }

  async findAllSavedNotes(userId: number) {
    const profile = await this.ensureProfile(userId);
    const rows = await this.savedNoteRepo.find({
      where: { profile: { id: profile.id } },
      relations: ['note', 'note.profile', 'note.likes', 'note.comments', 'note.views'],
      order: { createdAt: 'DESC' },
    });
    return rows.map(s => this.enrichNote(s.note, profile.id, s.createdAt));
  }

  // === TOGGLE LIKE ===
  async toggleLike(userId: number, noteId: number) {
    const profile = await this.ensureProfile(userId);
    const note = await this.noteRepo.findOne({ where: { id: noteId } });
    if (!note) throw new NotFoundException();

    const existing = await this.likeRepo.findOne({
      where: { profile: { id: profile.id }, note: { id: noteId } },
    });

    if (existing) {
      await this.likeRepo.remove(existing);
      return { liked: false };
    } else {
      const like = this.likeRepo.create({ profile, note });
      await this.likeRepo.save(like);
      return { liked: true };
    }
  }

  // === PAYWALL ===
  async setPaywall(userId: number, noteId: number, price: string) {
    const note = await this.getOwnedNote(userId, noteId);
    note.is_paywall = true;
    note.paywall_price = price;
    return this.noteRepo.save(note);
  }

  async checkPaywallAccess(userId: number, note: NotesEntity): Promise<boolean> {
    if (!note.is_paywall) return true;
    const profile = await this.ensureProfile(userId);
    const paid = await this.paymentRepo.findOne({
      where: { note: { id: note.id }, buyer: { id: profile.id } },
    });
    return !!paid;
  }

  // === REPOST / QUOTE ===
  async repost(userId: number, noteId: number, quote?: string) {
    const profile = await this.ensureProfile(userId);
    const original = await this.noteRepo.findOne({ where: { id: noteId } });
    if (!original) throw new NotFoundException();

    const repostNote = this.noteRepo.create({
      title: `Repost: ${original.title}`,
      content: quote ? `${quote}\n\n---\n${original.content}` : original.content,
      profile,
      type: 'repost',
      reposts: [{ profileId: profile.id, createdAt: new Date() }],
    });

    return this.noteRepo.save(repostNote);
  }

  // === MENTIONS & HASHTAGS ===
  private extractMentionsAndHashtags(content: string) {
    const mentionRegex = /@(\w+)/g;
    const hashtagRegex = /#(\w+)/g;
    const mentions = [...(content.matchAll(mentionRegex) || [])].map(m => ({
      username: m[1],
      position: m.index,
    }));
    const hashtags = [...(content.matchAll(hashtagRegex) || [])].map(m => ({
      tag: m[1],
      position: m.index,
    }));
    return { mentions, hashtags };
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  // === AI SUMMARY ===
  async generateAISummary(noteId: number) {
    const note = await this.noteRepo.findOne({ where: { id: noteId } });
    if (!note) throw new NotFoundException();

    const summary = await this.aiService.summarize(note.content);
    note.ai_summary = summary;
    return this.noteRepo.save(note);
  }

  // === ANALYTICS ===
  async getAnalytics(userId: number, noteId: number) {
    const note = await this.getOwnedNote(userId, noteId);
    const [views, likes, comments] = await Promise.all([
      this.viewRepo.count({ where: { note: { id: noteId } } }),
      this.likeRepo.count({ where: { note: { id: noteId } } }),
      this.commentRepo.count({ where: { note: { id: noteId } } }),
    ]);

    return {
      views,
      likes,
      comments,
      engagement: views > 0 ? ((likes + comments) / views).toFixed(2) : '0',
    };
  }

  // === EXPORT ===
  async exportNote(userId: number, noteId: number, format: 'pdf' | 'json') {
    const note = await this.getOwnedNote(userId, noteId);
    const url = await this.exportService.generate(note, format);
    const exportRecord = this.exportRepo.create({ note, format, url });
    await this.exportRepo.save(exportRecord);
    return { url, format };
  }

  // === GET BY SLUG ===
  async getBySlug(slug: string) {
    const note = await this.noteRepo.findOne({
      where: { seo_slug: slug, visibility: 'public', status: 'published' },
      relations: ['profile'],
    });
    if (!note) throw new NotFoundException('Note not found');
    return note;
  }

  // === ENRICH NOTE ===
  private enrichNote(note: NotesEntity, viewerProfileId?: number, savedAt?: Date) {
    return {
      ...note,
      totalLikes: note.likes?.length || 0,
      totalComments: note.comments?.length || 0,
      totalViews: note.views?.length || 0,
      isLiked: viewerProfileId ? note.likes?.some(l => l.profile.id === viewerProfileId) : false,
      isSaved: viewerProfileId ? note.savedBy?.some(s => s.profile.id === viewerProfileId) : false,
      savedAt,
    };
  }
}