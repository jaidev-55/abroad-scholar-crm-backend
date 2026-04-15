import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Query,
  Body,
  Param,
  BadRequestException,
  HttpCode,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { WebhooksService } from "./webhooks.service";
import { Public } from "../auth/decorators/public.decorator";
import { CreateWebhookConfigDto } from "./dto/webhook-config.dto";

@ApiTags("Webhooks")
@Controller("webhooks")
export class WebhooksController {
  constructor(private webhooksService: WebhooksService) {}

  // ─── META: Verification (GET) ───
  @Public()
  @Get("meta")
  @ApiOperation({ summary: "Meta webhook verification endpoint" })
  verifyMeta(
    @Query("hub.mode") mode: string,
    @Query("hub.verify_token") token: string,
    @Query("hub.challenge") challenge: string,
  ) {
    return this.webhooksService.verifyMetaWebhook(mode, token, challenge);
  }

  // ─── META: Receive Leads (POST) ───
  @Public()
  @Post("meta")
  @HttpCode(200)
  @ApiOperation({ summary: "Receive leads from Meta Lead Ads" })
  async handleMetaLead(@Body() body: any) {
    return this.webhooksService.processMetaLead(body);
  }

  // ─── GOOGLE: Receive Leads (POST) ───
  @Public()
  @Post("google")
  @HttpCode(200)
  @ApiOperation({ summary: "Receive leads from Google Ads Lead Forms" })
  async handleGoogleLead(@Body() body: any, @Query("token") token: string) {
    if (!this.webhooksService.verifyGoogleToken(token)) {
      throw new BadRequestException("Invalid webhook token");
    }
    return this.webhooksService.processGoogleLead(body);
  }

  // ─── GET all webhook configs (Admin only) ───
  @Get("config")
  @ApiOperation({ summary: "Get all webhook form configurations" })
  async getConfigs() {
    return this.webhooksService.getAllConfigs();
  }

  // ─── ADD new form config (auto-syncs past leads) ───
  @Post("config")
  @ApiOperation({
    summary: "Add a new ad form to CRM (auto-imports past leads)",
  })
  async addConfig(@Body() dto: CreateWebhookConfigDto) {
    return this.webhooksService.addConfig(dto);
  }

  // ─── MANUAL SYNC past leads from a form ───
  @Post("config/:id/sync")
  @ApiOperation({ summary: "Manually sync past leads from a form" })
  async syncLeads(@Param("id") id: string) {
    const config = await this.webhooksService.getConfigById(id);
    return this.webhooksService.syncMetaLeads(config.formId);
  }

  // ─── TOGGLE form active/inactive ───
  @Patch("config/:id/toggle")
  @ApiOperation({ summary: "Enable or disable a form" })
  async toggleConfig(@Param("id") id: string) {
    return this.webhooksService.toggleConfig(id);
  }

  // ─── DELETE form config ───
  @Delete("config/:id")
  @ApiOperation({ summary: "Remove a form from CRM" })
  async deleteConfig(@Param("id") id: string) {
    return this.webhooksService.deleteConfig(id);
  }
}
