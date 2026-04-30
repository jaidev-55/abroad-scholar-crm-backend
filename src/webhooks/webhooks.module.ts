import { Module } from "@nestjs/common";
import { WebhooksController } from "./webhooks.controller";
import { WebhooksService } from "./webhooks.service";
import { PrismaModule } from "../prisma/prisma.module";
import { EmailModule } from "../email/email.module";
import { ScheduleModule } from "@nestjs/schedule";
import { LeadsModule } from "../leads/leads.module";

@Module({
  imports: [PrismaModule, EmailModule, ScheduleModule.forRoot(), LeadsModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule {}
