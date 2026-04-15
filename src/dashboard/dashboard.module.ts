import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import {
  DashboardController,
  LeadsTrendController,
} from "./dashboard.controller";

import { AuthModule } from "../auth/auth.module";
import { DashboardService, LeadsTrendService } from "./dashboard.service";
import { LeadSourcesController } from "./Lead sources.controller";
import { LeadSourcesService } from "./Lead sources.service";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [
    DashboardController,
    LeadsTrendController,
    LeadSourcesController,
  ],
  providers: [DashboardService, LeadsTrendService, LeadSourcesService],
})
export class DashboardModule {}
