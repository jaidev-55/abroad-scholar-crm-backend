import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { PrismaModule } from "./prisma/prisma.module";
import { LeadsModule } from "./leads/leads.module";
import { EmailTemplatesModule } from "./email-templates/email-templates.module";
import { EmailModule } from "./email/email.module";
import { AppController } from "./app.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    LeadsModule,
    EmailTemplatesModule,
    EmailModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
