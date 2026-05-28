import { Module } from "@nestjs/common";
import { IeltsController } from "./ielts.controller";
import { IeltsService } from "./ielts.service";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [IeltsController],
  providers: [IeltsService],
})
export class IeltsModule {}
