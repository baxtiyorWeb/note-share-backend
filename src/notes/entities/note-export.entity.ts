import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { NotesEntity } from "./notes.entity";

// src/notes/entities/note-export.entity.ts
@Entity('note_exports')
export class NoteExportEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => NotesEntity, (n) => n.exports)
  note: NotesEntity;

  @Column()
  format: 'pdf' | 'json';

  @Column()
  url: string;

  @CreateDateColumn()
  createdAt: Date;
}