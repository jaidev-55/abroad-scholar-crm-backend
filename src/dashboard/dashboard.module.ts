import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";

import {
  DashboardController,
  LeadsTrendController,
} from "./dashboard.controller";
import { DashboardService, LeadsTrendService } from "./dashboard.service";

import { PipelineService } from "./pipeline.service";

import { TopCounselorsController } from "./top-counselors.controller";
import { TopCounselorsService } from "./top-counselors.service";
import { LeadSourcesController } from "./Lead sources.controller";
import { RecentLeadsController } from "./Recent leads.controller";
import { LeadSourcesService } from "./Lead sources.service";
import { RecentLeadsService } from "./Recent leads.service";
import { PipelineController } from "./pipeline.controller";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [
    DashboardController,
    LeadsTrendController,
    LeadSourcesController,
    PipelineController,
    TopCounselorsController,
    RecentLeadsController,
  ],
  providers: [
    DashboardService,
    LeadsTrendService,
    LeadSourcesService,
    PipelineService,
    TopCounselorsService,
    RecentLeadsService,
  ],
})
export class DashboardModule {}
