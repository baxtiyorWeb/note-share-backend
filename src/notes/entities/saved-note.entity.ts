import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  Unique,
} from "typeorm";
import { ProfileEntity } from "./../../profile/entities/profile.entity";
import { NotesEntity } from "./notes.entity";

@Entity("saved_notes")
@Unique(["profile", "note"])
export class SavedNoteEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ProfileEntity, (profile) => profile.savedNotes, {
    onDelete: "CASCADE",
    eager: true,
  })
  profile: ProfileEntity;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;
  @ManyToOne(() => NotesEntity, (note) => note.savedBy, {
    onDelete: "CASCADE",
    eager: true,
  })
  note: NotesEntity;
}