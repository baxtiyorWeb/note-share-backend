import { Controller, Post, Body, Req, UseGuards, Param, UploadedFile, UseInterceptors } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { ChatService } from "./chat.service";
import { JwtAuthGuard } from "../common/jwt-strategy/jwt-guards";
import { FileInterceptor } from "@nestjs/platform-express";

@ApiTags("Chat")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("chat")
export class ChatController {
  constructor(private chat: ChatService) { }

  @Post("create")
  create(@Req() req, @Body() dto: { isGroup: boolean; title?: string; participants: number[] }) {
    return this.chat.createChat(req.user.sub, dto.isGroup, dto.participants, dto.title);
  }

  @Post(":id/send")
  send(@Req() req, @Param("id") chatId: number, @Body("text") text: string) {
    return this.chat.sendMessage(req.user.sub, chatId, text);
  }

  @Post(":id/read/:messageId")
  read(@Req() req, @Param("id") chatId: number, @Param("messageId") messageId: number) {
    return this.chat.markRead(req.user.sub, chatId, messageId);
  }
  @Post(":id/media")
  @UseInterceptors(FileInterceptor("file"))
  sendMedia(
    @Req() req,
    @Param("id") chatId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body("text") text?: string,
  ) {
    return this.chat.sendMediaMessage(req.user.sub, chatId, file, text);
  }

  @Post("edit/:messageId")
  edit(@Req() req, @Param("messageId") messageId: number, @Body("text") text: string) {
    return this.chat.editMessage(req.user.sub, messageId, text);
  }

  @Post("delete/:messageId")
  delete(@Req() req, @Param("messageId") messageId: number) {
    return this.chat.deleteMessage(req.user.sub, messageId);
  }

  @Post(":chatId/reply/:replyToId")
  reply(
    @Req() req,
    @Param("chatId") chatId: number,
    @Param("replyToId") replyToId: number,
    @Body("text") text: string,
  ) {
    return this.chat.replyMessage(req.user.sub, chatId, replyToId, text);
  }

  @Post("forward/:chatId/:messageId")
  forward(
    @Req() req,
    @Param("chatId") targetChatId: number,
    @Param("messageId") messageId: number,
  ) {
    return this.chat.forwardMessage(req.user.sub, targetChatId, messageId);
  }
}
