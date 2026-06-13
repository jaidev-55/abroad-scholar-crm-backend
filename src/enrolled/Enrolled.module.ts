import { Module } from "@nestjs/common";
import { EnrolledController } from "./Enrolled.controller";
import { EnrolledService } from "./Enrolled.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [EnrolledController],
  providers: [EnrolledService],
  exports: [EnrolledService],
})
export class EnrolledModule {}
