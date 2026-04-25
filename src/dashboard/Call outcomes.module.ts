import { Module } from "@nestjs/common";
import { CallOutcomesService } from "./call-outcomes.service";
import { PrismaModule } from "../prisma/prisma.module";
import { CallOutcomesController } from "./Call outcomes.controller";

@Module({
  imports: [PrismaModule],
  controllers: [CallOutcomesController],
  providers: [CallOutcomesService],
})
export class CallOutcomesModule {}
