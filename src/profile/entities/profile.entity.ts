import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  BeforeInsert,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { randomUUID } from "crypto";
import { UserEntity } from "../../users/entities/user.entity";
import { NotesEntity } from "../../notes/entities/notes.entity";
import { NoteViewEntity } from "../../notes/entities/note-view.entity";

@Entity("profiles")
export class ProfileEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true, unique: true })
  username: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ nullable: true })
  coverImage?: string;

  @OneToOne(() => UserEntity, (user) => user.profile, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: UserEntity;

  @Column({ nullable: true })
  userId?: number;

  // ✅ NoteViewEntity bilan ikki yo‘nalishli aloqa
  @OneToMany(() => NoteViewEntity, (view) => view.viewer)
  viewedNotes: NoteViewEntity[];

  @OneToMany(() => NotesEntity, (note) => note.profile, { cascade: true })
  notes: NotesEntity[];

  @BeforeInsert()
  generateUsername() {
    if (!this.firstName && !this.lastName) {
      this.username = "user_" + randomUUID().slice(0, 8);
    } else {
      const base = `${this.firstName ?? ""}${this.lastName ?? ""}`.toLowerCase();
      this.username = base || "user_" + randomUUID().slice(0, 8);
    }
  }
}
