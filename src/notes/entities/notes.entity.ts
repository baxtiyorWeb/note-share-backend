import {
  Column,
  CreateDateColumn,
  Entity,
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

  @Column({ type: 'varchar', nullable: true })
  seo_slug: string | null;

  @Column({ type: 'varchar', nullable: true })
  tags: string | null;

  @Column({
    type: 'varchar',
    default: 'public',
  })
  visibility: 'public' | 'private' | 'unlisted';

  @Column({ type: 'boolean', default: true })
  allow_comments: boolean;

  @Column({ type: 'boolean', default: false })
  share_to_twitter: boolean;

  @Column({ name: 'is_public', default: true })
  isPublic: boolean;

  @CreateDateColumn()
  createdAt: string;

  @UpdateDateColumn()
  updatedAt: string;

  @OneToMany(() => NoteViewEntity, (v) => v.note, { cascade: true })
  views: NoteViewEntity[];

  @OneToMany(() => NoteLikeEntity, (l) => l.note)
  likes: NoteLikeEntity[];

  @OneToMany(() => NoteCommentEntity, (c) => c.note)
  comments: NoteCommentEntity[];

  @ManyToOne(() => ProfileEntity, (profile) => profile.notes, {
    onDelete: 'CASCADE',
  })
  profile: ProfileEntity;

  @ManyToMany(() => ProfileEntity)
  @JoinTable({
    name: 'note_shares',
    joinColumn: { name: 'note_id' },
    inverseJoinColumn: { name: 'profile_id' },
  })
  sharedWith: ProfileEntity[];
}
