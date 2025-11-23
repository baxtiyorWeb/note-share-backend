import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThan } from "typeorm";
import { ChatEntity } from "./entities/chat.entity";
import { MessageEntity } from "./entities/message.entity";
import { ParticipantEntity } from "./entities/participant.entity";
import { MessageReadEntity } from "./entities/message-read.entity";
import { ProfileEntity } from "../profile/entities/profile.entity";
import { UploadService } from "src/file/uploadService";

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatEntity) private chatRepo: Repository<ChatEntity>,
    @InjectRepository(MessageEntity) private msgRepo: Repository<MessageEntity>,
    @InjectRepository(ParticipantEntity) private partRepo: Repository<ParticipantEntity>,
    @InjectRepository(MessageReadEntity) private readRepo: Repository<MessageReadEntity>,
    @InjectRepository(ProfileEntity) private profileRepo: Repository<ProfileEntity>,
    private readonly uploadService: UploadService,
  ) { }

  private async ensureProfile(userId: number) {
    const profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException("Profile not found");
    return profile;
  }

  /** 🔹 Create 1-to-1 or Group Chat */
  async createChat(userId: number, isGroup: boolean, participantIds: number[], title?: string) {
    const me = await this.ensureProfile(userId);
    const ids = [...new Set(participantIds)];

    if (!isGroup && ids.length !== 1)
      throw new BadRequestException("Direct chat requires one target profile");

    if (!isGroup) {
      const key = [me.id, ids[0]].sort().join("-");
      let chat = await this.chatRepo.findOne({ where: { dmKey: key } });
      if (chat) return chat;
      chat = this.chatRepo.create({ dmKey: key, isGroup: false });
      chat = await this.chatRepo.save(chat);

      await this.partRepo.save([
        this.partRepo.create({ chat, profile: me }),
        this.partRepo.create({ chat, profile: { id: ids[0] } as any }),
      ]);
      return chat;
    }

    const chat = await this.chatRepo.save(
      this.chatRepo.create({ isGroup: true, title: title ?? null }),
    );
    const all = await this.profileRepo.findByIds([userId, ...ids]);
    await this.partRepo.save(all.map((p) => this.partRepo.create({ chat, profile: p })));
    return chat;
  }

  /** 💬 Send Message */
  async sendMessage(userId: number, chatId: number, text: string) {
    const me = await this.ensureProfile(userId);
    const part = await this.partRepo.findOne({
      where: { chat: { id: chatId }, profile: { id: me.id } },
    });
    if (!part) throw new ForbiddenException("Not a participant");

    const msg = this.msgRepo.create({ chat: { id: chatId } as any, sender: me, text });
    const saved = await this.msgRepo.save(msg);
    await this.readRepo.save(this.readRepo.create({ message: saved, reader: me }));
    part.lastReadAt = saved.createdAt;
    await this.partRepo.save(part);
    return saved;
  }

  /** 📖 Mark Read */
  async markRead(userId: number, chatId: number, messageId: number) {
    const me = await this.ensureProfile(userId);
    const msg = await this.msgRepo.findOne({ where: { id: messageId, chat: { id: chatId } } });
    if (!msg) throw new NotFoundException("Message not found");
    const exist = await this.readRepo.findOne({
      where: { message: { id: msg.id }, reader: { id: me.id } },
    });
    if (!exist) await this.readRepo.save(this.readRepo.create({ message: msg, reader: me }));
    return { message: "Marked as read" };
  }

  async getParticipants(chatId: number) {
    return this.partRepo.find({ where: { chat: { id: chatId } }, relations: ["profile"] });
  }


  async sendMediaMessage(
    userId: number,
    chatId: number,
    file: Express.Multer.File,
    text?: string,
  ) {
    const me = await this.ensureProfile(userId);
    const participant = await this.partRepo.findOne({
      where: { chat: { id: chatId }, profile: { id: me.id } },
    });
    if (!participant) throw new ForbiddenException("Not a participant");

    const url = await this.uploadService.uploadFile(file);

    let type: "image" | "video" | "audio" | null = null;
    if (file.mimetype.startsWith("image")) type = "image";
    else if (file.mimetype.startsWith("video")) type = "video";
    else if (file.mimetype.startsWith("audio")) type = "audio";

    const msg = this.msgRepo.create({
      chat: { id: chatId } as any,
      sender: me,
      text: text as string,
      mediaUrl: url,
      mediaType: type,
      isDelivered: true,
    });
    const saved = await this.msgRepo.save(msg);
    return saved;
  }
  async editMessage(userId: number, messageId: number, newText: string) {
    const me = await this.ensureProfile(userId);
    const msg = await this.msgRepo.findOne({ where: { id: messageId }, relations: ["sender"] });
    if (!msg) throw new NotFoundException("Message not found");
    if (msg.sender.id !== me.id) throw new ForbiddenException("You can only edit your messages");

    msg.text = newText;
    return this.msgRepo.save(msg);
  }
  async deleteMessage(userId: number, messageId: number) {
    const me = await this.ensureProfile(userId);
    const msg = await this.msgRepo.findOne({ where: { id: messageId }, relations: ["sender"] });
    if (!msg) throw new NotFoundException("Message not found");
    if (msg.sender.id !== me.id) throw new ForbiddenException("You can only delete your messages");

    msg.isDeleted = true;
    msg.text = "Message deleted";
    msg.mediaUrl = null;
    return this.msgRepo.save(msg);
  }

  async replyMessage(userId: number, chatId: number, replyToId: number, text: string) {
    const me = await this.ensureProfile(userId);
    const replyTo = await this.msgRepo.findOne({ where: { id: replyToId } });
    if (!replyTo) throw new NotFoundException("Replied message not found");

    const msg = this.msgRepo.create({
      chat: { id: chatId } as any,
      sender: me,
      text,
      replyTo,
      isDelivered: true,
    });
    return await this.msgRepo.save(msg);
  }

  async forwardMessage(userId: number, targetChatId: number, originalId: number) {
    const me = await this.ensureProfile(userId);
    const original = await this.msgRepo.findOne({ where: { id: originalId } });
    if (!original) throw new NotFoundException("Original message not found");

    const forwarded = this.msgRepo.create({
      chat: { id: targetChatId } as any,
      sender: me,
      text: original.text,
      mediaUrl: original.mediaUrl,
      mediaType: original.mediaType,
      isForwarded: true,
      isDelivered: true,
    });
    return await this.msgRepo.save(forwarded);
  }


}
