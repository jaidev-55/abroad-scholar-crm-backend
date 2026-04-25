import { Module } from "@nestjs/common";
import { NotificationsController } from "./Notifications.controller";
import { NotificationsService } from "./Notifications.service";
import { NotificationsGateway } from "./notifications.gateway";
import { PrismaModule } from "../prisma/prisma.module";
import { JwtModule } from "@nestjs/jwt";

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({ secret: process.env.JWT_SECRET }),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
