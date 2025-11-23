import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChatEntity } from "./entities/chat.entity";
import { MessageEntity } from "./entities/message.entity";
import { ParticipantEntity } from "./entities/participant.entity";
import { MessageReadEntity } from "./entities/message-read.entity";
import { ChatService } from "./chat.service";
import { ChatController } from "./chat.controller";
import { ChatGateway } from "./chat.gateway";
import { JwtService } from "@nestjs/jwt";
import { ProfileEntity } from "../profile/entities/profile.entity";
import { UploadService } from "./../file/uploadService";

@Module({
  imports: [TypeOrmModule.forFeature([ChatEntity, MessageEntity, ParticipantEntity, MessageReadEntity, ProfileEntity])],
  providers: [ChatService, ChatGateway, JwtService, UploadService],
  controllers: [ChatController],
  exports: [ChatService],
})
export class ChatModule { }
