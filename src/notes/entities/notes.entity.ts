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

@Entity()
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

  @CreateDateColumn()
  createdAt: string;

  @UpdateDateColumn()
  updatedAt: string;

  @Column({ name: 'is_public', default: true })
  isPublic: boolean;

  @OneToMany(() => NoteViewEntity, (v) => v.note)
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
