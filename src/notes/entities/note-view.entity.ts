import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  Unique,
  JoinColumn,
} from "typeorm";
import { NotesEntity } from "./notes.entity";
import { ProfileEntity } from "../../profile/entities/profile.entity";

@Entity("note_views")
@Unique(["note", "viewer"])
export class NoteViewEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => NotesEntity, (note) => note.views, { onDelete: "CASCADE" })
  @JoinColumn({ name: "noteId" }) // ✅ FK ustun aniq nom bilan
  note: NotesEntity;

  @ManyToOne(() => ProfileEntity, (profile) => profile.viewedNotes, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "viewerId" }) // ✅ FK ustun aniq nom bilan
  viewer: ProfileEntity;

  @CreateDateColumn()
  createdAt: Date;
}
