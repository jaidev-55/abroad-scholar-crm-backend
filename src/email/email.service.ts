import { Injectable } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import { Transporter } from "nodemailer";

@Injectable()
export class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  // ── Common send method ────────────────────────────────────────────────────
  async sendMail(to: string, subject: string, html: string) {
    if (!to) return;
    await this.transporter.sendMail({
      from: `"Abroad Scholars CRM" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  }

  // ── Counselor: Lead Assigned ──────────────────────────────────────────────
  async sendLeadAssignedToCounselor(
    counselor: { email?: string; name?: string },
    lead: any,
  ) {
    if (!counselor?.email) return;

    const leadUrl = `https://crm.abroadscholars.in/admin/leads-pipeline?leadId=${lead.id}`;

    const html = `
  <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
    <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08);">
      <div style="background:#4CAF50; color:white; padding:16px; font-size:18px; font-weight:bold;">
        🎯 New Lead Assigned
      </div>
      <div style="padding:20px;">
        <p>Hi ${counselor.name ?? "Counselor"} 👋,</p>
        <p style="color:#555;">A new lead has been assigned to you. Please follow up quickly.</p>
        <div style="margin:20px 0; padding:15px; background:#f9fafb; border-radius:8px;">
          <p><b>👤 Name:</b> ${lead.fullName}</p>
          <p><b>📞 Phone:</b> ${lead.phone}</p>
          <p><b>🌍 Country:</b> ${lead.country}</p>
          <p><b>🔥 Priority:</b> ${lead.priority}</p>
          <p><b>📚 Category:</b> ${lead.category ?? "—"}</p>
        </div>
        <a href="${leadUrl}" style="display:block; text-align:center; background:#4CAF50; color:white; padding:12px; border-radius:6px; text-decoration:none; font-weight:bold;">
          View Lead
        </a>
      </div>
    </div>
  </div>`;

    await this.sendMail(counselor.email, "🎯 New Lead Assigned to You", html);
  }

  // ── Admin: Lead Created ───────────────────────────────────────────────────
  async sendLeadCreatedToAdmins(
    admins: { email?: string; name?: string }[],
    lead: any,
  ) {
    const leadUrl = `https://crm.abroadscholars.in/admin/leads-pipeline?leadId=${lead.id}`;
    const validAdmins = admins.filter((a) => a.email);
    if (validAdmins.length === 0) return;

    await Promise.all(
      validAdmins.map((admin) => {
        const html = `
      <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
        <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08);">
          <div style="background:#1E88E5; color:white; padding:16px; font-size:18px; font-weight:bold;">
            📊 New Lead Created
          </div>
          <div style="padding:20px;">
            <p>Hi ${admin.name ?? "Admin"} 👋,</p>
            <p style="color:#555;">A new lead has been added to the CRM.</p>
            <div style="margin:20px 0; padding:15px; background:#f9fafb; border-radius:8px;">
              <p><b>👤 Name:</b> ${lead.fullName}</p>
              <p><b>📞 Phone:</b> ${lead.phone}</p>
              <p><b>🌍 Country:</b> ${lead.country}</p>
              <p><b>🔥 Priority:</b> ${lead.priority}</p>
              <p><b>📢 Source:</b> ${lead.source}</p>
              <p><b>📚 Category:</b> ${lead.category ?? "—"}</p>
            </div>
            <a href="${leadUrl}" style="display:block; text-align:center; background:#1E88E5; color:white; padding:12px; border-radius:6px; text-decoration:none; font-weight:bold;">
              View Lead
            </a>
          </div>
        </div>
      </div>`;
        return this.sendMail(admin.email!, "📊 New Lead Created", html);
      }),
    );
  }

  // ── Counselor: Follow-up Digest (Today's follow-ups) ─────────────────────
  async sendFollowUpReminderDigest(
    counselor: { email?: string; name?: string },
    leads: any[],
  ) {
    if (!counselor?.email || leads.length === 0) return;

    const todayStr = new Date().toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const leadRows = leads
      .map((lead) => {
        const url = `https://crm.abroadscholars.in/admin/leads-pipeline?leadId=${lead.id}`;
        const priorityColor =
          lead.priority === "HOT"
            ? "#ef4444"
            : lead.priority === "WARM"
              ? "#f59e0b"
              : "#3b82f6";

        return `
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:12px 8px;">
            <a href="${url}" style="font-weight:bold; color:#1e40af; text-decoration:none;">
              ${lead.fullName}
            </a>
            <div style="font-size:12px; color:#64748b;">${lead.country ?? ""}</div>
          </td>
          <td style="padding:12px 8px; font-size:13px; color:#334155;">${lead.phone}</td>
          <td style="padding:12px 8px;">
            <span style="background:${priorityColor}20; color:${priorityColor}; padding:2px 8px; border-radius:4px; font-size:12px; font-weight:bold;">
              ${lead.priority}
            </span>
          </td>
          <td style="padding:12px 8px;">
            <span style="background:#f0f9ff; color:#0284c7; padding:2px 8px; border-radius:4px; font-size:12px;">
              ${lead.category ?? "—"}
            </span>
          </td>
          <td style="padding:12px 8px;">
            <a href="${url}" style="background:#2563eb; color:white; padding:5px 12px; border-radius:5px; text-decoration:none; font-size:12px; font-weight:bold;">
              Follow Up →
            </a>
          </td>
        </tr>`;
      })
      .join("");

    const html = `
  <div style="font-family: -apple-system, Arial, sans-serif; background:#f8fafc; padding:24px;">
    <div style="max-width:640px; margin:auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.08);">

      <!-- Header -->
      <div style="background:linear-gradient(135deg, #2563eb, #7c3aed); color:white; padding:24px;">
        <div style="font-size:28px; margin-bottom:4px;">📅</div>
        <h1 style="margin:0; font-size:20px; font-weight:bold;">Today's Follow-up Reminders</h1>
        <p style="margin:6px 0 0; opacity:0.85; font-size:14px;">${todayStr}</p>
      </div>

      <!-- Greeting -->
      <div style="padding:20px 24px 0;">
        <p style="font-size:15px; color:#1e293b; margin:0;">
          Hi <strong>${counselor.name ?? "Counselor"}</strong> 👋
        </p>
        <p style="font-size:14px; color:#64748b; margin:8px 0 0;">
          You have <strong style="color:#2563eb;">${leads.length} lead${leads.length > 1 ? "s" : ""}</strong> scheduled for follow-up today.
          Please make sure to reach out to each of them.
        </p>
      </div>

      <!-- Table -->
      <div style="padding:16px 24px;">
        <table style="width:100%; border-collapse:collapse; font-size:13px;">
          <thead>
            <tr style="background:#f8fafc; text-align:left;">
              <th style="padding:10px 8px; color:#64748b; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Student</th>
              <th style="padding:10px 8px; color:#64748b; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Phone</th>
              <th style="padding:10px 8px; color:#64748b; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Priority</th>
              <th style="padding:10px 8px; color:#64748b; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Category</th>
              <th style="padding:10px 8px; color:#64748b; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${leadRows}
          </tbody>
        </table>
      </div>

      <!-- CTA -->
      <div style="padding:8px 24px 24px;">
        <a href="https://crm.abroadscholars.in/admin/leads-pipeline"
          style="display:block; text-align:center; background:linear-gradient(135deg, #2563eb, #7c3aed); color:white; padding:14px; border-radius:8px; text-decoration:none; font-weight:bold; font-size:15px;">
          Open Lead Pipeline →
        </a>
      </div>

      <!-- Footer -->
      <div style="background:#f8fafc; padding:16px 24px; text-align:center; border-top:1px solid #e2e8f0;">
        <p style="font-size:11px; color:#94a3b8; margin:0;">
          Abroad Scholars CRM · This is an automated reminder sent at 8:00 AM IST
        </p>
      </div>

    </div>
  </div>`;

    await this.sendMail(
      counselor.email,
      `📅 ${leads.length} Follow-up${leads.length > 1 ? "s" : ""} Due Today — ${todayStr}`,
      html,
    );
  }

  // ── Counselor: Overdue Digest ─────────────────────────────────────────────
  async sendOverdueReminderDigest(
    counselor: { email?: string; name?: string },
    leads: any[],
  ) {
    if (!counselor?.email || leads.length === 0) return;

    const leadRows = leads
      .map((lead) => {
        const url = `https://crm.abroadscholars.in/admin/leads-pipeline?leadId=${lead.id}`;
        const dueDate = lead.followUpDate
          ? new Date(lead.followUpDate).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "—";

        const daysOverdue = lead.followUpDate
          ? Math.floor(
              (Date.now() - new Date(lead.followUpDate).getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : 0;

        return `
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:12px 8px;">
            <a href="${url}" style="font-weight:bold; color:#1e40af; text-decoration:none;">
              ${lead.fullName}
            </a>
            <div style="font-size:12px; color:#64748b;">${lead.country ?? ""}</div>
          </td>
          <td style="padding:12px 8px; font-size:13px; color:#334155;">${lead.phone}</td>
          <td style="padding:12px 8px;">
            <span style="background:#fef2f2; color:#ef4444; padding:2px 8px; border-radius:4px; font-size:12px; font-weight:bold;">
              ${dueDate}
            </span>
          </td>
          <td style="padding:12px 8px;">
            <span style="background:#fef2f2; color:#dc2626; padding:2px 8px; border-radius:4px; font-size:12px; font-weight:bold;">
              ${daysOverdue}d overdue
            </span>
          </td>
          <td style="padding:12px 8px;">
            <a href="${url}" style="background:#ef4444; color:white; padding:5px 12px; border-radius:5px; text-decoration:none; font-size:12px; font-weight:bold;">
              Act Now →
            </a>
          </td>
        </tr>`;
      })
      .join("");

    const html = `
  <div style="font-family: -apple-system, Arial, sans-serif; background:#f8fafc; padding:24px;">
    <div style="max-width:640px; margin:auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.08);">

      <!-- Header -->
      <div style="background:linear-gradient(135deg, #ef4444, #dc2626); color:white; padding:24px;">
        <div style="font-size:28px; margin-bottom:4px;">⚠️</div>
        <h1 style="margin:0; font-size:20px; font-weight:bold;">Overdue Follow-ups Alert</h1>
        <p style="margin:6px 0 0; opacity:0.85; font-size:14px;">These leads need immediate attention</p>
      </div>

      <!-- Greeting -->
      <div style="padding:20px 24px 0;">
        <p style="font-size:15px; color:#1e293b; margin:0;">
          Hi <strong>${counselor.name ?? "Counselor"}</strong> 👋
        </p>
        <p style="font-size:14px; color:#64748b; margin:8px 0 0;">
          You have <strong style="color:#ef4444;">${leads.length} overdue lead${leads.length > 1 ? "s" : ""}</strong> that missed their follow-up date.
          Please prioritise these immediately to avoid losing them.
        </p>
      </div>

      <!-- Table -->
      <div style="padding:16px 24px;">
        <table style="width:100%; border-collapse:collapse; font-size:13px;">
          <thead>
            <tr style="background:#fff5f5; text-align:left;">
              <th style="padding:10px 8px; color:#64748b; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Student</th>
              <th style="padding:10px 8px; color:#64748b; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Phone</th>
              <th style="padding:10px 8px; color:#64748b; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Was Due</th>
              <th style="padding:10px 8px; color:#64748b; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Overdue By</th>
              <th style="padding:10px 8px; color:#64748b; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.05em;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${leadRows}
          </tbody>
        </table>
      </div>

      <!-- CTA -->
      <div style="padding:8px 24px 24px;">
        <a href="https://crm.abroadscholars.in/admin/leads-pipeline"
          style="display:block; text-align:center; background:linear-gradient(135deg, #ef4444, #dc2626); color:white; padding:14px; border-radius:8px; text-decoration:none; font-weight:bold; font-size:15px;">
          Review Overdue Leads →
        </a>
      </div>

      <!-- Footer -->
      <div style="background:#f8fafc; padding:16px 24px; text-align:center; border-top:1px solid #e2e8f0;">
        <p style="font-size:11px; color:#94a3b8; margin:0;">
          Abroad Scholars CRM · Overdue alert sent at 9:00 AM IST daily
        </p>
      </div>

    </div>
  </div>`;

    await this.sendMail(
      counselor.email,
      `⚠️ ${leads.length} Overdue Follow-up${leads.length > 1 ? "s" : ""} — Action Required`,
      html,
    );
  }
}
