import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from "@nestjs/websockets";
import { Server } from "socket.io";

@WebSocketGateway({
  cors: { origin: "*" },
})
export class NotificationGateway {
  @WebSocketServer()
  server: Server;

  sendNotification(recipientId: number, payload: any) {
    this.server.to(`user_${recipientId}`).emit("notification", payload);
  }

  @SubscribeMessage("join")
  handleJoin(@MessageBody() userId: number) {
    const socketRoom = `user_${userId}`;
    this.server.socketsJoin(socketRoom);
    return { message: `Joined room ${socketRoom}` };
  }
}
