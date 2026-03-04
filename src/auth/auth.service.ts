import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
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
  // show User List
  async getUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }
// update user Details
  async updateUser(id: string, dto: any) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name ?? user.name,
        email: dto.email ?? user.email,
        role: dto.role ?? user.role,
      },
    });

    return {
      message: "User updated successfully",
      user: updatedUser,
    };
  }
  // Delete existing user
  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return {
      message: "User deleted successfully",
      userId: id,
    };
  }
}
