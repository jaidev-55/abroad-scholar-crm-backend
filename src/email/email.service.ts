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
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async sendMail(to: string, subject: string, html: string) {
    if (!to) return;

    await this.transporter.sendMail({
      from: `"Abroad Scholars CRM" <${process.env.MAIL_USER}>`,
      to,
      subject,
      html,
    });
  }

  // Counselor email (NO source)
  async sendLeadAssignedToCounselor(counselor: { email?: string }, lead: any) {
    if (!counselor?.email) return;

    const leadUrl = `${process.env.FRONTEND_URL}/admin/leads/${lead.id}`;

    await this.sendMail(
      counselor.email,
      "🎯 New Lead Assigned to You",
      `
      <h2>New Lead Assigned</h2>

      <p><b>Name:</b> ${lead.fullName}</p>
      <p><b>Phone:</b> ${lead.phone}</p>
      <p><b>Country:</b> ${lead.country}</p>
      <p><b>Priority:</b> ${lead.priority}</p>

      <a href="${leadUrl}">👉 View Lead</a>
      `,
    );
  }

  // Admin email (WITH source)
  async sendLeadCreatedToAdmins(admins: { email?: string }[], lead: any) {
    const leadUrl = `${process.env.FRONTEND_URL}/admin/leads/${lead.id}`;

    const emails = admins.map((a) => a.email).filter(Boolean) as string[];

    if (emails.length === 0) return;

    await Promise.all(
      emails.map((email) =>
        this.sendMail(
          email,
          "📊 New Lead Created",
          `
          <h2>New Lead Created</h2>

          <p><b>Name:</b> ${lead.fullName}</p>
          <p><b>Phone:</b> ${lead.phone}</p>
          <p><b>Country:</b> ${lead.country}</p>
          <p><b>Priority:</b> ${lead.priority}</p>

 
          <p><b>Source:</b> ${lead.source}</p>

          <a href="${leadUrl}">👉 View Lead</a>
          `,
        ),
      ),
    );
  }
}
