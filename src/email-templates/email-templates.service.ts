import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateEmailTemplateDto } from "./dto/create-email-template.dto";

@Injectable()
export class EmailTemplatesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateEmailTemplateDto, file?: Express.Multer.File) {
    let attachmentPath = null;

    if (file) {
      attachmentPath = file.filename;
    }

    return this.prisma.emailTemplate.create({
      data: {
        name: dto.name,
        subject: dto.subject,
        content: dto.content,
        attachment: attachmentPath,
      },
    });
  }

  async findAll() {
    return this.prisma.emailTemplate.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    return this.prisma.emailTemplate.findUnique({
      where: { id },
    });
  }

  async delete(id: string) {
    return this.prisma.emailTemplate.delete({
      where: { id },
    });
  }
}
