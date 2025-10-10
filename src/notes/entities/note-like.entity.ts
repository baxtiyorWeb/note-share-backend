import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, Unique } from "typeorm";
import { NotesEntity } from "./notes.entity";
import { ProfileEntity } from "./../../profile/entities/profile.entity";

@Entity("note_likes")
@Unique(["note", "profile"])
export class NoteLikeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => NotesEntity, note => note.likes, { onDelete: "CASCADE" })
  note: NotesEntity;

  @ManyToOne(() => ProfileEntity, { onDelete: "CASCADE" })
  profile: ProfileEntity;

  @CreateDateColumn()
  createdAt: Date;
}
