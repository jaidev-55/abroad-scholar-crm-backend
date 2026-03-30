import { Module } from "@nestjs/common";
import { LeadsService } from "./leads.service";
import { LeadsController } from "./leads.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { EmailModule } from "../email/email.module";

@Module({
  imports: [PrismaModule, AuthModule, EmailModule],
  providers: [LeadsService],
  controllers: [LeadsController],
})
export class LeadsModule {}
