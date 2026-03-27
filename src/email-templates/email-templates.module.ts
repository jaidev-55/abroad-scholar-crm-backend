import { Module } from "@nestjs/common";
import { EmailTemplatesController } from "./email-templates.controller";
import { EmailTemplatesService } from "./email-templates.service";
import { PrismaService } from "../prisma/prisma.service";

@Module({
  controllers: [EmailTemplatesController],
  providers: [EmailTemplatesService, PrismaService],
})
export class EmailTemplatesModule {}
