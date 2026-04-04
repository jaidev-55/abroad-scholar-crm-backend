import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../email/email.service";
import { CreateWebhookConfigDto } from "./dto/webhook-config.dto";

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  // ─── META WEBHOOK VERIFICATION ───
  verifyMetaWebhook(mode: string, token: string, challenge: string): string {
    const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN;
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return challenge;
    }
    throw new BadRequestException("Invalid verification token");
  }

  // ─── GOOGLE TOKEN VERIFICATION ───
  verifyGoogleToken(token: string): boolean {
    return token === process.env.GOOGLE_WEBHOOK_SECRET;
  }

  // ─── PROCESS META LEAD ───
  async processMetaLead(body: any) {
    const activeConfigs = await this.prisma.webhookConfig.findMany({
      where: { platform: "META", isActive: true },
    });
    const allowedFormIds = activeConfigs.map((c) => c.formId);

    const entries = body?.entry ?? [];

    for (const entry of entries) {
      const changes = entry?.changes ?? [];
      for (const change of changes) {
        if (change.field !== "leadgen") continue;

        const formId = change.value?.form_id;

        if (allowedFormIds.length > 0 && !allowedFormIds.includes(formId)) {
          this.logger.log(`Skipping lead from unconfigured form: ${formId}`);
          continue;
        }

        const leadgenId = change.value?.leadgen_id;
        const adId = change.value?.ad_id;
        const leadData = await this.fetchMetaLeadData(leadgenId);

        if (!leadData) {
          this.logger.warn(`Failed to fetch Meta lead: ${leadgenId}`);
          continue;
        }

        const formConfig = activeConfigs.find((c) => c.formId === formId);

        await this.createLeadFromWebhook({
          fullName: leadData.fullName,
          phone: leadData.phone,
          email: leadData.email,
          country: leadData.country,
          source: "META_ADS",
          meta: {
            leadgenId,
            formId,
            adId,
            formName: formConfig?.formName ?? "Unknown",
          },
        });
      }
    }

    return { success: true };
  }

  // ─── FETCH LEAD DATA FROM META API ───
  private async fetchMetaLeadData(leadgenId: string) {
    try {
      const ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN;
      const response = await fetch(
        `https://graph.facebook.com/v19.0/${leadgenId}?access_token=${ACCESS_TOKEN}`,
      );
      const data = await response.json();
      if (!data?.field_data) return null;

      const fields = data.field_data;
      const getValue = (name: string) =>
        fields.find((f: any) => f.name === name)?.values?.[0] ?? null;

      return {
        fullName: getValue("full_name") ?? "Unknown",
        phone: getValue("phone_number"),
        email: getValue("email"),
        country: getValue("country"),
      };
    } catch (error) {
      this.logger.error("Meta API fetch error:", error);
      return null;
    }
  }

  // ─── PROCESS GOOGLE LEAD ───
  async processGoogleLead(body: any) {
    const leadData = body?.lead_form_submission;
    if (!leadData) {
      throw new BadRequestException("Invalid Google lead payload");
    }

    const columnData = leadData.column_data ?? [];
    const getValue = (name: string) =>
      columnData.find((c: any) => c.column_id === name)?.string_value ?? null;

    await this.createLeadFromWebhook({
      fullName: getValue("FULL_NAME") ?? "Unknown",
      phone: getValue("PHONE_NUMBER"),
      email: getValue("EMAIL"),
      country: getValue("COUNTRY"),
      source: "GOOGLE_ADS",
      meta: { campaignId: leadData.campaign_id, gclid: leadData.gclid },
    });

    return { success: true };
  }

  // ─── CREATE LEAD + ROUND-ROBIN ASSIGN ───
  private async createLeadFromWebhook(data: {
    fullName: string;
    phone: string;
    email?: string;
    country?: string;
    source: "META_ADS" | "GOOGLE_ADS";
    meta?: any;
  }) {
    if (!data.phone) {
      this.logger.warn(`Skipping lead without phone: ${data.fullName}`);
      return;
    }

    const cleanPhone = data.phone.replace(/\s+/g, "").replace(/^(\+)/, "$1");

    const existing = await this.prisma.lead.findUnique({
      where: { phone: cleanPhone },
    });

    if (existing) {
      this.logger.warn(`Duplicate lead skipped: ${cleanPhone}`);
      await this.prisma.leadActivity.create({
        data: {
          type: "NOTE",
          message: `Duplicate ${data.source} lead received - skipped`,
          leadId: existing.id,
          meta: data.meta,
        },
      });
      return;
    }

    const counselorId = await this.getNextCounselor();
    if (!counselorId) {
      this.logger.error("No counselors available for auto-assignment");
      return;
    }

    const newLead = await this.prisma.lead.create({
      data: {
        fullName: data.fullName,
        phone: cleanPhone,
        email: data.email ?? null,
        country: data.country ?? "Unknown",
        source: data.source,
        priority: "HOT",
        status: "NEW",
        counselorId,
      },
    });

    await this.prisma.leadActivity.create({
      data: {
        type: "EDIT",
        message: `Auto-created from ${data.source} webhook`,
        leadId: newLead.id,
        meta: data.meta,
      },
    });

    const counselor = await this.prisma.user.findUnique({
      where: { id: counselorId },
    });

    const admins = await this.prisma.user.findMany({
      where: { role: "ADMIN" },
    });

    if (counselor) {
      Promise.all([
        this.emailService.sendLeadAssignedToCounselor(counselor, newLead),
        this.emailService.sendLeadCreatedToAdmins(admins, newLead),
      ]).catch((err) => this.logger.error("Webhook email error:", err));
    }

    this.logger.log(
      `New ${data.source} lead: ${newLead.id} → Counselor: ${counselorId}`,
    );
    return newLead;
  }

  // ─── ROUND-ROBIN ───
  private async getNextCounselor(): Promise<string | null> {
    const counselors = await this.prisma.user.findMany({
      where: { role: "COUNSELOR" },
      orderBy: { createdAt: "asc" },
    });

    if (counselors.length === 0) return null;

    const lastLead = await this.prisma.lead.findFirst({
      where: { counselorId: { not: null } },
      orderBy: { createdAt: "desc" },
    });

    if (!lastLead) return counselors[0].id;

    const lastIndex = counselors.findIndex(
      (c) => c.id === lastLead.counselorId,
    );
    const nextIndex =
      lastIndex === -1 ? 0 : (lastIndex + 1) % counselors.length;
    return counselors[nextIndex].id;
  }

  // ─── WEBHOOK CONFIG METHODS ───

  // Get all form configurations
  async getAllConfigs() {
    return this.prisma.webhookConfig.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  // Add new form configuration
  async addConfig(dto: CreateWebhookConfigDto) {
    const existing = await this.prisma.webhookConfig.findUnique({
      where: { formId: dto.formId },
    });

    if (existing) {
      throw new BadRequestException("This form ID is already configured");
    }

    return this.prisma.webhookConfig.create({
      data: {
        platform: dto.platform,
        formId: dto.formId,
        formName: dto.formName,
        isActive: dto.isActive ?? true,
      },
    });
  }

  // Toggle form active/inactive
  async toggleConfig(id: string) {
    const config = await this.prisma.webhookConfig.findUnique({
      where: { id },
    });

    if (!config) {
      throw new NotFoundException("Config not found");
    }

    return this.prisma.webhookConfig.update({
      where: { id },
      data: { isActive: !config.isActive },
    });
  }

  // Delete form configuration
  async deleteConfig(id: string) {
    return this.prisma.webhookConfig.delete({
      where: { id },
    });
  }
}
