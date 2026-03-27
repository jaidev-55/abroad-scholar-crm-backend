import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { RegisterDto } from "./dto/register.dto";
import * as nodemailer from "nodemailer";
import { generateOtp } from "../utils/generate-otp";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // Send OTP email for account verification
  async sendOtpEmail(email: string, otp: string) {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Abroad Scholars CRM" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify Your Email - Abroad Scholars CRM",
      html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        
        <h2 style="color:#2c3e50;">Email Verification</h2>

        <p>Hello,</p>

        <p>
          Thank you for registering with <strong>Abroad Scholars CRM</strong>.
          Please use the verification code below to complete your account setup.
        </p>

        <div style="
          font-size: 28px;
          font-weight: bold;
          letter-spacing: 4px;
          background: #f4f6f8;
          padding: 12px 20px;
          display: inline-block;
          border-radius: 6px;
          margin: 15px 0;
        ">
          ${otp}
        </div>

        <p>This OTP is valid for <strong>5 minutes</strong>.</p>

        <p>If you did not request this verification, please ignore this email.</p>

        <br/>

        <p style="font-size: 14px; color:#777;">
          Regards,<br/>
          Abroad Scholars Team
        </p>

      </div>
    `,
    });
  }

  // Register a new user and send OTP for email verification
  async register(data: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) throw new BadRequestException("User already exists");

    // Hash user password
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const otp = generateOtp();
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 5);

    // Remove any previous OTP records for this email
    await this.prisma.otpVerification.deleteMany({
      where: { email: data.email },
    });

    // Store user details temporarily with OTP
    await this.prisma.otpVerification.create({
      data: {
        email: data.email,
        otp,
        name: data.name,
        password: hashedPassword,
        role: data.role ?? "COUNSELOR",
        expiresAt: expiry,
      },
    });

    // Send OTP to user's email
    await this.sendOtpEmail(data.email, otp);
    return { message: "OTP sent to email" };
  }

  // Verify OTP and create user
  async verifyOtp(email: string, otp: string) {
    // Get latest OTP record for the email
    const record = await this.prisma.otpVerification.findFirst({
      where: { email, otp },
      orderBy: { createdAt: "desc" },
    });

    if (!record) throw new BadRequestException("Invalid OTP");
    // Check if OTP has expired
    if (record.expiresAt < new Date())
      throw new BadRequestException("OTP expired");

    // Create user account using stored registration data
    await this.prisma.user.create({
      data: {
        email: record.email,
        name: record.name,
        password: record.password,
        role: record.role as any,
      },
    });

    // Remove OTP records after successful verification
    await this.prisma.otpVerification.deleteMany({ where: { email } });

    return { message: "Email verified successfully" };
  }

  // Resend OTP to user
  async resendOtp(email: string) {
    const existingOtp = await this.prisma.otpVerification.findFirst({
      where: { email },
      orderBy: { createdAt: "desc" },
    });

    // prevent OTP spam (60 seconds cooldown)
    if (existingOtp) {
      const now = new Date().getTime();
      const lastOtpTime = new Date(existingOtp.createdAt).getTime();

      const diff = (now - lastOtpTime) / 1000;

      if (diff < 60) {
        throw new BadRequestException(
          `Please wait ${Math.ceil(60 - diff)} seconds before requesting another OTP`,
        );
      }
    }

    // generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 5);

    // delete previous OTPs
    await this.prisma.otpVerification.deleteMany({
      where: { email },
    });

    // save new OTP
    await this.prisma.otpVerification.create({
      data: {
        email,
        otp,
        expiresAt: expiry,
      },
    });

    // send email
    await this.sendOtpEmail(email, otp);

    return {
      message: "OTP resent successfully",
    };
  }

  // Login existing user

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // JWT payload
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      message: "Login successful",
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
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

  // Send OTP to user's email for password reset
  async forgotPassword(dto: ForgotPasswordDto) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // OTP expires in 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Save OTP in database
    await this.prisma.passwordReset.create({
      data: {
        email: dto.email,
        otp,
        expiresAt,
      },
    });

    // Create email transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Send OTP email
    await transporter.sendMail({
      from: `"Abroad Scholars" <${process.env.EMAIL_USER}>`,
      to: dto.email,
      subject: "Password Reset OTP",
      html: `
      <h3>Password Reset Request</h3>
      <p>Your OTP is:</p>
      <h2>${otp}</h2>
      <p>This OTP is valid for 10 minutes.</p>
    `,
    });

    return {
      message: "OTP sent to your email",
    };
  }

  // Reset password using OTP
  async resetPassword(dto: ResetPasswordDto) {
    // Find OTP record
    const record = await this.prisma.passwordReset.findFirst({
      where: {
        otp: dto.otp,
      },
    });

    if (!record) {
      throw new BadRequestException("Invalid OTP");
    }

    // Check OTP expiry
    if (record.expiresAt < new Date()) {
      throw new BadRequestException("OTP expired");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    // Update user's password
    await this.prisma.user.update({
      where: { email: record.email },
      data: { password: hashedPassword },
    });

    // Delete OTP after successful reset
    await this.prisma.passwordReset.delete({
      where: { id: record.id },
    });

    return {
      message: "Password reset successful",
    };
  }
}
