import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { RegisterDto } from "./dto/register.dto";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // Register new user
  async register(data: RegisterDto) {
    // Hash password before saving to DB
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user in database
    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role || "COUNSELOR",
      },
    });
    return {
      message: "User registered successfully",
      userId: user.id,
    };
  }

  // Login existing user
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid credentails");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException("Invalid credentails");
    }
    // Data to store inside JWT
    const payload = {
      userId: user.id,
      role: user.role,
    };

    // Generate JWT token
    return {
      message: "Login successful",
      access_token: this.jwtService.sign(payload),
    };
  }
}
