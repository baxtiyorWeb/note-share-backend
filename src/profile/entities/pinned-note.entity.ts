import { CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ProfileEntity } from "./profile.entity";
import { NotesEntity } from "./../../notes/entities/notes.entity";

// src/notes/entities/pinned-note.entity.ts
@Entity('pinned_notes')
export class PinnedNoteEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ProfileEntity, (p) => p.pinnedNotes, { onDelete: 'CASCADE' })
  profile: ProfileEntity;

  @ManyToOne(() => NotesEntity, { onDelete: 'CASCADE' })
  note: NotesEntity;

  @CreateDateColumn()
  pinnedAt: Date;
}