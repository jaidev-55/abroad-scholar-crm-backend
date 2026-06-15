import { PipeTransform, Injectable, BadRequestException } from "@nestjs/common";

@Injectable()
export class FileValidationPipe implements PipeTransform {
  private readonly allowedMimes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  private readonly maxSize = 10 * 1024 * 1024; // 10MB

  // Magic bytes to verify actual file type
  private readonly magicBytes: Record<string, number[]> = {
    "application/pdf": [0x25, 0x50, 0x44, 0x46], // %PDF
    "image/jpeg": [0xff, 0xd8, 0xff], // JPEG
    "image/png": [0x89, 0x50, 0x4e, 0x47], // PNG
    "image/webp": [0x52, 0x49, 0x46, 0x46], // RIFF
  };

  transform(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }

    // 1. Check size
    if (file.size > this.maxSize) {
      throw new BadRequestException(
        `File too large. Maximum size is ${this.maxSize / (1024 * 1024)}MB, got ${(file.size / (1024 * 1024)).toFixed(1)}MB`,
      );
    }

    // 2. Check MIME type
    if (!this.allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type "${file.mimetype}" not allowed. Accepted: PDF, JPG, PNG, WebP, DOC, DOCX`,
      );
    }

    // 3. Verify magic bytes (prevents extension spoofing)
    const expected = this.magicBytes[file.mimetype];
    if (expected && file.buffer) {
      const header = Array.from(
        new Uint8Array(file.buffer.slice(0, expected.length)),
      );
      const valid = expected.every((byte, i) => header[i] === byte);
      if (!valid) {
        throw new BadRequestException(
          "File content does not match its type. Possible file spoofing detected.",
        );
      }
    }

    // 4. Sanitize original filename
    file.originalname = file.originalname
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/\.{2,}/g, ".");

    return file;
  }
}
