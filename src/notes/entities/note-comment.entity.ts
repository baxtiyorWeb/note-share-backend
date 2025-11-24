import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from "typeorm";
import { NotesEntity } from "./notes.entity";
import { ProfileEntity } from "../../profile/entities/profile.entity";

@Entity("note_comments")
export class NoteCommentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("text", {nullable: true})
  text: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => NotesEntity, (note) => note.comments, {
    onDelete: "CASCADE",
  })
  note: NotesEntity;

  @ManyToOne(() => ProfileEntity, (profile) => profile.comments, {
    onDelete: "CASCADE",
  })
  author: ProfileEntity;

  @ManyToOne(() => NoteCommentEntity, (comment) => comment.replies, {
    nullable: true,
    onDelete: "CASCADE",
  })
  parent: NoteCommentEntity | null;

  @OneToMany(() => NoteCommentEntity, (comment) => comment.parent, {
    cascade: true,
  })
  replies: NoteCommentEntity[];
}
