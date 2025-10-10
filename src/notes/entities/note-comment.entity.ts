import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm";
import { NotesEntity } from "./notes.entity";
import { ProfileEntity } from "./../../profile/entities/profile.entity";

@Entity("note_comments")
export class NoteCommentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  text: string;

  @ManyToOne(() => NotesEntity, note => note.comments, { onDelete: "CASCADE" })
  note: NotesEntity;

  @ManyToOne(() => ProfileEntity, { onDelete: "CASCADE" })
  author: ProfileEntity;

  @CreateDateColumn()
  createdAt: Date;
}
