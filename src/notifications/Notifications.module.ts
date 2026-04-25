import { Module } from "@nestjs/common";
import { NotificationsController } from "./Notifications.controller";
import { NotificationsService } from "./Notifications.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
