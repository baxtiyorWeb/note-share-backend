// src/notes/entities/note-reaction.entity.ts
import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn } from 'typeorm';
import { NotesEntity } from './notes.entity';
import { ProfileEntity } from '../../profile/entities/profile.entity';

@Entity('note_reactions')
export class NoteReactionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry' | 'insightful';

  @ManyToOne(() => NotesEntity, (note) => note.reactions, { onDelete: 'CASCADE' })
  note: NotesEntity;

  @ManyToOne(() => ProfileEntity, { onDelete: 'CASCADE' })
  profile: ProfileEntity;

  @CreateDateColumn()
  createdAt: Date;
}