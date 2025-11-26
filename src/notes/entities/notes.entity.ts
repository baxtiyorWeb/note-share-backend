import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProfileEntity } from './../../profile/entities/profile.entity';
import { NoteViewEntity } from './note-view.entity';
import { NoteLikeEntity } from './note-like.entity';
import { NoteCommentEntity } from './note-comment.entity';
import { SavedNoteEntity } from './saved-note.entity';
import { NoteReactionEntity } from './note-reaction.entity';
import { NoteExportEntity } from './note-export.entity';
import { PaymentEntity } from 'src/payment/entities/payment.entity';
import { Category } from './../../category/entities/category.entity';

@Entity('notes')
export class NotesEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  title: string;

  @Column('text')
  content: string;

  @Column({ type: 'boolean', default: false })
  is_code_mode: boolean;

  @Column({ type: 'varchar', nullable: true })
  code_language: string | null;

  @Column({ type: 'timestamp', nullable: true })
  reminder_at: Date | null;

  @Column({
    type: 'varchar',
    default: 'public',
  })
  visibility: 'public' | 'private' | 'unlisted';

  @Column({ nullable: true })
  seo_slug?: string;

  @Column({ type: 'varchar', nullable: true })
  tags: string | null;

  @Column({ type: 'timestamp', nullable: true })
  scheduled_at?: Date;

  @Column({ default: false })
  is_paywall: boolean;

  @Column({ type: 'decimal', default: '0.00' })
  paywall_price?: string;

  @Column({ type: 'jsonb', nullable: true })
  reposts?: { profileId: number; createdAt: Date }[];

  @Column({ type: 'jsonb', nullable: true })
  mentions?: { profileId: number; position: number }[];

  @Column({ type: 'jsonb', nullable: true })
  hashtags?: { tag: string; position: number }[];

  @Column({ default: 'published' })
  status: 'draft' | 'published' | 'scheduled';

  @Column({ nullable: true })
  ai_summary?: string;

  @OneToMany(() => NoteExportEntity, (e) => e.note)
  exports: NoteExportEntity[];
  @Column({ type: 'boolean', default: true })
  allow_comments: boolean;

  @OneToMany(() => PaymentEntity, (p) => p.note)
  payments: PaymentEntity[];

  @Column({ type: 'boolean', default: false })
  share_to_twitter: boolean;

  @Column({ name: 'is_public', default: true })
  isPublic: boolean;

  @Column({
    type: 'varchar',
    default: 'note',
  })
  type: 'note' | 'news' | 'article' | 'repost';

  @CreateDateColumn()
  createdAt: string;

  @UpdateDateColumn()
  updatedAt: string;

  @ManyToOne(() => Category, (category) => category.notes)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ nullable: true })
  category_id?: number;
  @OneToMany(() => NoteViewEntity, (v) => v.note, { cascade: true })
  views: NoteViewEntity[];

  @OneToMany(() => NoteReactionEntity, (r) => r.note)
  reactions: NoteReactionEntity[];

  @OneToMany(() => NoteLikeEntity, (l) => l.note)
  likes: NoteLikeEntity[];

  @OneToMany(() => NoteCommentEntity, (c) => c.note)
  comments: NoteCommentEntity[];

  @ManyToOne(() => ProfileEntity, (profile) => profile.notes, {
    onDelete: 'CASCADE',
  })
  profile: ProfileEntity;

  @OneToMany(() => SavedNoteEntity, (savedNote) => savedNote.note)
  savedBy: SavedNoteEntity[];

  @ManyToMany(() => ProfileEntity)
  @JoinTable({
    name: 'note_shares',
    joinColumn: { name: 'note_id' },
    inverseJoinColumn: { name: 'profile_id' },
  })
  sharedWith: ProfileEntity[];
}
