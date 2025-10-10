import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, Unique } from "typeorm";
import { NotesEntity } from "./notes.entity";
import { ProfileEntity } from "./../../profile/entities/profile.entity";

@Entity("note_views")
@Unique(["note", "viewer"])
export class NoteViewEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => NotesEntity, note => note.views, { onDelete: "CASCADE" })
  note: NotesEntity;

  @ManyToOne(() => ProfileEntity, { onDelete: "CASCADE" })
  viewer: ProfileEntity;

  @CreateDateColumn()
  createdAt: Date;
}
