import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { JwtService } from "@nestjs/jwt";
import { NotificationsService } from "./Notifications.service";

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL || "*" },
  namespace: "/notifications",
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  constructor(
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(" ")[1];

      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      client.data.user = { id: payload.sub, role: payload.role };
      client.join(`user-${payload.sub}`);

      // Send current notifications on connect
      const notifications = await this.notificationsService.getNotifications(
        client.data.user,
      );
      client.emit("notifications:init", notifications);
      console.log(`WS connected: ${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`WS disconnected: ${client.id}`);
  }

  // Push to specific user
  pushToUser(userId: string, notification: any) {
    this.server.to(`user-${userId}`).emit("notification:new", notification);
  }

  // Push to all connected users (admins)
  pushToAll(notification: any) {
    this.server.emit("notification:new", notification);
  }
}
