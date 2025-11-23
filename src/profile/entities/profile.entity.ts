// src/profile/entities/profile.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { NotesEntity } from '../../notes/entities/notes.entity';
import { SavedNoteEntity } from '../../notes/entities/saved-note.entity';
import { NoteLikeEntity } from '../../notes/entities/note-like.entity';
import { NoteCommentEntity } from '../../notes/entities/note-comment.entity';
import { NoteViewEntity } from '../../notes/entities/note-view.entity';
import { NoteReactionEntity } from '../../notes/entities/note-reaction.entity';
import { NotificationEntity } from '../../notification/entities/notification.entity';
import { randomUUID } from 'crypto';
import { PinnedNoteEntity } from './pinned-note.entity';
import { PaymentEntity } from 'src/payment/entities/payment.entity';

@Entity('profiles')
export class ProfileEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ unique: true, nullable: true })
  username: string;

  @Column({ unique: true, nullable: true })
  slug: string; // SEO: /@john_doe

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ nullable: true })
  coverImage?: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ type: 'jsonb', nullable: true })
  customLinks: { title: string; url: string }[];

  @Column({ nullable: true })
  pinnedNoteId: number;

  @Column({ type: 'jsonb', default: {} })
  theme: {
    primary?: string;
    background?: string;
    gradient?: boolean;
  };

  @Column({ default: false })
  isPremium: boolean;

  @Column({ default: false })
  allowTips: boolean;

  @Column({ type: 'decimal', default: 0 })
  tipBalance: string;

  @Column({ nullable: true })
  bioSummary: string; // AI generatsiya qiladi

  @OneToMany(() => PinnedNoteEntity, (p) => p.profile)
  pinnedNotes: PinnedNoteEntity[];

  @OneToMany(() => PaymentEntity, (p) => p.buyer)
  payments: PaymentEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => UserEntity, (user) => user.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column({ name: 'userId' })
  userId: number;

  @OneToMany(() => NotesEntity, (note) => note.profile)
  notes: NotesEntity[];

  @OneToMany(() => SavedNoteEntity, (saved) => saved.profile)
  savedNotes: SavedNoteEntity[];

  @OneToMany(() => NoteLikeEntity, (like) => like.profile)
  likes: NoteLikeEntity[];

  @OneToMany(() => NoteCommentEntity, (comment) => comment.author)
  comments: NoteCommentEntity[];

  @OneToMany(() => NoteViewEntity, (view) => view.viewer)
  viewedNotes: NoteViewEntity[];

  @OneToMany(() => NoteReactionEntity, (reaction) => reaction.profile)
  reactions: NoteReactionEntity[];

  @OneToMany(() => NotificationEntity, (n) => n.recipient)
  receivedNotifications: NotificationEntity[];

  @OneToMany(() => NotificationEntity, (n) => n.sender)
  sentNotifications: NotificationEntity[];

  @ManyToMany(() => ProfileEntity, (profile) => profile.followers)
  @JoinTable({
    name: 'profile_follows',
    joinColumn: { name: 'followerId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'followingId', referencedColumnName: 'id' },
  })
  following: ProfileEntity[];

  @ManyToMany(() => ProfileEntity, (profile) => profile.following)
  followers: ProfileEntity[];

  @BeforeInsert()
  generateUsernameAndSlug() {
    if (!this.username) {
      const base = `${this.firstName || ''}${this.lastName || ''}`.trim();
      this.username = base ? base.toLowerCase().replace(/\s+/g, '_') : `user_${randomUUID().slice(0, 8)}`;
    }
    this.slug = this.username.toLowerCase().replace(/[^a-z0-9_]/g, '');
  }
}