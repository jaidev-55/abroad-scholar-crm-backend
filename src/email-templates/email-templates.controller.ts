import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  BadRequestException,
} from "@nestjs/common";
import { EmailTemplatesService } from "./email-templates.service";
import { CreateEmailTemplateDto } from "./dto/create-email-template.dto";
import { ApiTags, ApiOperation, ApiConsumes } from "@nestjs/swagger";
import { UseInterceptors, UploadedFile } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path";
import { ApiBody } from "@nestjs/swagger";

@ApiTags("Email Templates")
@Controller("email-templates")
export class EmailTemplatesController {
  constructor(private service: EmailTemplatesService) {}

  // Create email template
  @Post()
  @ApiOperation({ summary: "Create email template" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          example: "Follow-up",
        },
        subject: {
          type: "string",
          example: "Follow-up Regarding Your Study Abroad Enquiry",
        },
        content: {
          type: "string",
          example: "Dear {{name}}, Greetings from Abroad Scholar!",
        },
        attachment: {
          type: "string",
          format: "binary",
          description: " PDF brochure (Max 10MB)",
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor("attachment", {
      storage: diskStorage({
        destination: "./assets/brochures",
        filename: (req, file, callback) => {
          const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
          callback(null, uniqueName + extname(file.originalname));
        },
      }),

      // Limit file size to 10MB
      limits: {
        fileSize: 10 * 1024 * 1024,
      },

      // Allow only PDF
      fileFilter: (req, file, callback) => {
        if (file.mimetype !== "application/pdf") {
          return callback(
            new BadRequestException(
              "Only PDF files are allowed (Max size: 10MB)",
            ),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  create(
    @Body() dto: CreateEmailTemplateDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.service.create(dto, file);
  }

  // Get all templates
  @Get()
  getTemplates() {
    return this.service.findAll();
  }

  // Get template
  @Get(":id")
  getTemplate(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  // Delete template
  @Delete(":id")
  deleteTemplate(@Param("id") id: string) {
    return this.service.delete(id);
  }
}
