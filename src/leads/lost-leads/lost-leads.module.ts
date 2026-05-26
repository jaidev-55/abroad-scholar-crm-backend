import { Module } from "@nestjs/common";
import { LostLeadsController } from "./lost-leads.controller";
import { PrismaModule } from "../../prisma/prisma.module";
import { AuthModule } from "../../auth/auth.module";
import { LostLeadService } from "./lost-leads.service";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [LostLeadsController],
  providers: [LostLeadService],
})
export class LostLeadsModule {}
