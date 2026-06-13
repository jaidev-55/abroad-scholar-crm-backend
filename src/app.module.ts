import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { PrismaModule } from "./prisma/prisma.module";
import { LeadsModule } from "./leads/leads.module";
import { EmailTemplatesModule } from "./email-templates/email-templates.module";
import { EmailModule } from "./email/email.module";
import { AppController } from "./app.controller";
import { WebhooksModule } from "./webhooks/webhooks.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { NotificationsModule } from "./notifications/Notifications.module";
import { CallOutcomesModule } from "./dashboard/Call outcomes.module";
import { LostLeadsModule } from "./leads/lost-leads/lost-leads.module";
import { IeltsModule } from "./ielts/ielts.module";
import { EnrolledModule } from "./enrolled/Enrolled.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    LeadsModule,
    LostLeadsModule,
    EmailTemplatesModule,
    DashboardModule,
    CallOutcomesModule,
    NotificationsModule,
    EmailModule,
    WebhooksModule,
    IeltsModule,
    EnrolledModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
