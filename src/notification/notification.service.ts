import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotificationEntity } from "./entities/notification.entity";
import { ProfileEntity } from "../profile/entities/profile.entity";
import { NotesEntity } from "../notes/entities/notes.entity";

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepo: Repository<NotificationEntity>,
    @InjectRepository(ProfileEntity)
    private readonly profileRepo: Repository<ProfileEntity>,
    @InjectRepository(NotesEntity)
    private readonly noteRepo: Repository<NotesEntity>,
  ) { }

  /** Helper: Get Profile safely */
  private async ensureProfile(userId: number): Promise<ProfileEntity> {
    const profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException("Profile not found");
    return profile;
  }

  /** 🧠 Message generator */
  private generateMessage(
    type: NotificationEntity["type"],
    senderName: string,
  ): string {
    switch (type) {
      case "LIKE":
        return `${senderName} liked your post`;
      case "COMMENT":
        return `${senderName} commented on your note`;
      case "REPLY":
        return `${senderName} replied to your comment`;
      case "FOLLOW":
        return `${senderName} started following you`;
      case "SHARE":
        return `${senderName} shared your note`;
      case "MENTION":
        return `${senderName} mentioned you in a post`;
      default:
        return `${senderName} did something`;
    }
  }

  /** ✅ CREATE notification */
  async create(
    type: NotificationEntity["type"],
    senderId: number,
    recipientId: number,
    noteId?: number,
    customMessage?: string,
  ) {
    if (senderId === recipientId) return null; // o‘ziga yubormaslik

    const sender = await this.profileRepo.findOne({ where: { id: senderId } });
    const recipient = await this.profileRepo.findOne({
      where: { id: recipientId },
    });
    if (!sender || !recipient)
      throw new NotFoundException("Profiles not found");

    const note = noteId
      ? await this.noteRepo.findOne({ where: { id: noteId } })
      : null;

    const message = customMessage || this.generateMessage(type, sender.username);

    const notif = this.notificationRepo.create({
      type,
      message,
      sender,
      recipient,
      note,
    });

    await this.notificationRepo.save(notif);
    return { message: "Notification created successfully", notif };
  }

  /** ✅ GET all notifications */
  async getAll(userId: number) {
    const profile = await this.ensureProfile(userId);
    const notifications = await this.notificationRepo.find({
      where: { recipient: { id: profile.id } },
      relations: ["sender", "note"],
      order: { createdAt: "DESC" },
    });
    return notifications;
  }

  /** ✅ Mark single notification as read */
  async markAsRead(id: number, userId: number) {
    const profile = await this.ensureProfile(userId);
    const notif = await this.notificationRepo.findOne({
      where: { id, recipient: { id: profile.id } },
    });
    if (!notif) throw new NotFoundException("Notification not found");
    notif.isRead = true;
    notif.isSeen = true;
    await this.notificationRepo.save(notif);
    return { message: "Notification marked as read" };
  }

  /** ✅ Mark all as read */
  async markAllAsRead(userId: number) {
    const profile = await this.ensureProfile(userId);
    await this.notificationRepo.update(
      { recipient: { id: profile.id }, isRead: false },
      { isRead: true, isSeen: true },
    );
    return { message: "All notifications marked as read" };
  }

  /** ✅ Delete single notification */
  async deleteOne(id: number, userId: number) {
    const profile = await this.ensureProfile(userId);
    const notif = await this.notificationRepo.findOne({
      where: { id, recipient: { id: profile.id } },
    });
    if (!notif) throw new NotFoundException("Notification not found");
    await this.notificationRepo.remove(notif);
    return { message: "Notification deleted" };
  }

  /** ✅ Delete all notifications */
  async deleteAll(userId: number) {
    const profile = await this.ensureProfile(userId);
    await this.notificationRepo.delete({ recipient: { id: profile.id } });
    return { message: "All notifications deleted" };
  }
}
