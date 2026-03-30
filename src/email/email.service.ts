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

  //  Common send method
  async sendMail(to: string, subject: string, html: string) {
    if (!to) return;

    await this.transporter.sendMail({
      from: `"Abroad Scholars CRM" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  }

  //  Counselor Email (NO SOURCE)
  async sendLeadAssignedToCounselor(
    counselor: { email?: string; name?: string },
    lead: any,
  ) {
    if (!counselor?.email) return;

    const leadUrl = `${process.env.FRONTEND_URL}/admin/leads/${lead.id}`;

    const html = `
  <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
    <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08);">

      <div style="background:#4CAF50; color:white; padding:16px; font-size:18px; font-weight:bold;">
        🎯 New Lead Assigned
      </div>

      <div style="padding:20px;">
        <p>Hi ${counselor.name ?? "Counselor"} 👋,</p>

        <p style="color:#555;">
          A new lead has been assigned to you. Please follow up quickly.
        </p>

        <div style="margin:20px 0; padding:15px; background:#f9fafb; border-radius:8px;">
          <p><b>👤 Name:</b> ${lead.fullName}</p>
          <p><b>📞 Phone:</b> ${lead.phone}</p>
          <p><b>🌍 Country:</b> ${lead.country}</p>
          <p><b>🔥 Priority:</b> ${lead.priority}</p>
        </div>

        <a href="${leadUrl}" 
          style="display:block; text-align:center; background:#4CAF50; color:white; padding:12px; border-radius:6px; text-decoration:none; font-weight:bold;">
          View Lead
        </a>

        <p style="margin-top:15px; font-size:12px; color:#999;">
          Please take action as soon as possible.
        </p>
      </div>

    </div>
  </div>
  `;

    await this.sendMail(counselor.email, "🎯 New Lead Assigned to You", html);
  }

  //  Admin Email (WITH SOURCE)
  async sendLeadCreatedToAdmins(
    admins: { email?: string; name?: string }[],
    lead: any,
  ) {
    const leadUrl = `${process.env.FRONTEND_URL}/admin/leads/${lead.id}`;

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

            <p style="color:#555;">
              A new lead has been added to the CRM.
            </p>

            <div style="margin:20px 0; padding:15px; background:#f9fafb; border-radius:8px;">
              <p><b>👤 Name:</b> ${lead.fullName}</p>
              <p><b>📞 Phone:</b> ${lead.phone}</p>
              <p><b>🌍 Country:</b> ${lead.country}</p>
              <p><b>🔥 Priority:</b> ${lead.priority}</p>
              <p><b>📢 Source:</b> ${lead.source}</p>
            </div>

            <a href="${leadUrl}" 
              style="display:block; text-align:center; background:#1E88E5; color:white; padding:12px; border-radius:6px; text-decoration:none; font-weight:bold;">
              View Lead
            </a>

            <p style="margin-top:15px; font-size:12px; color:#999;">
              Track this lead’s progress in CRM dashboard.
            </p>
          </div>

        </div>
      </div>
      `;

        return this.sendMail(admin.email!, "📊 New Lead Created", html);
      }),
    );
  }
}
