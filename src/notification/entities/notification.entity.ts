import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { ProfileEntity } from "src/profile/entities/profile.entity";
import { NotesEntity } from "src/notes/entities/notes.entity";

@Entity("notifications")
export class NotificationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: "varchar",
    length: 20,
  })
  type:
    | "LIKE"
    | "COMMENT"
    | "REPLY"
    | "FOLLOW"
    | "SHARE"
    | "MENTION";

  @Column({ type: "text", nullable: true })
  message: string | null;

  @Column({ type: "boolean", default: false })
  isRead: boolean;

  @Column({ type: "boolean", default: false })
  isSeen: boolean;

  @Column({ nullable: true })
  summaryText: string;

  @Column({ type: "boolean", default: false })
  isOpened: boolean;

  @ManyToOne(() => ProfileEntity, (profile) => profile.receivedNotifications, {
    onDelete: "CASCADE",
  })
  recipient: ProfileEntity;

  @ManyToOne(() => ProfileEntity, (profile) => profile.sentNotifications, {
    onDelete: "CASCADE",
  })
  sender: ProfileEntity;

  @ManyToOne(() => NotesEntity, { nullable: true, onDelete: "CASCADE" })
  note: NotesEntity | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
