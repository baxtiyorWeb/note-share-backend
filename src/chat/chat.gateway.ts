import {
  WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { ChatService } from "./chat.service";
import { JwtService } from "@nestjs/jwt";

@WebSocketGateway({ cors: { origin: "*" } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private onlineUsers = new Map<number, string>(); // userId -> socketId

  constructor(private chatService: ChatService, private jwt: JwtService) { }

  async handleConnection(socket: Socket) {
    try {
      const token = socket.handshake.auth.token;
      const { sub } = this.jwt.verify(token);
      this.onlineUsers.set(sub, socket.id);
      socket.join(`user_${sub}`);
      this.server.emit("user_online", { userId: sub });
    } catch {
      socket.disconnect();
    }
  }

  handleDisconnect(socket: Socket) {
    for (const [userId, id] of this.onlineUsers.entries()) {
      if (id === socket.id) {
        this.onlineUsers.delete(userId);
        this.server.emit("user_offline", { userId });
      }
    }
  }

  @SubscribeMessage("send_message")
  async onSend(@MessageBody() data, @ConnectedSocket() socket: Socket) {
    const { sub } = this.jwt.verify(data.token);
    const msg = await this.chatService.sendMessage(sub, data.chatId, data.text);
    const participants = await this.chatService.getParticipants(data.chatId);
    for (const p of participants)
      this.server.to(`user_${p.profile.id}`).emit("new_message", msg);
  }

  @SubscribeMessage("typing")
  onTyping(@MessageBody() data) {
    const { sub } = this.jwt.verify(data.token);
    this.server.to(`chat_${data.chatId}`).emit("typing", { userId: sub, typing: data.typing });
  }

  @SubscribeMessage("mark_read")
  async onRead(@MessageBody() data) {
    const { sub } = this.jwt.verify(data.token);
    await this.chatService.markRead(sub, data.chatId, data.messageId);
    const parts = await this.chatService.getParticipants(data.chatId);
    for (const p of parts)
      this.server.to(`user_${p.profile.id}`).emit("read_update", {
        chatId: data.chatId,
        readerId: sub,
        messageId: data.messageId,
      });
  }

  @SubscribeMessage("delivered")
  onDelivered(@MessageBody() data) {
    this.server.to(`chat_${data.chatId}`).emit("delivered", {
      chatId: data.chatId,
      messageId: data.messageId,
      delivered: true,
    });
  }

  @SubscribeMessage("seen")
  onSeen(@MessageBody() data) {
    this.server.to(`chat_${data.chatId}`).emit("seen", {
      chatId: data.chatId,
      messageId: data.messageId,
      seen: true,
    });
  }

}
