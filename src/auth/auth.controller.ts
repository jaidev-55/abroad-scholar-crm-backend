import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { UpdateUserDto } from "./dto/update-user.dto";
import { VerifyOtpDto } from "./dto/verify-otp.dto";
import { ResendOtpDto } from "./dto/resend-otp.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { Request } from "express";
import { UserRole } from "@prisma/client";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";

@ApiBearerAuth()
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}
  // Register endpoint
  @Post("register")
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }
  // Verify Otp
  @Post("verify-otp")
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.email, dto.otp);
  }
  // Resend Otp
  @Post("resend-otp")
  resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto.email);
  }
  // Login endpoint
  @Post("login")
  login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  // Get logged-in user profile
  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get current logged-in user" })
  getCurrentUser(@Req() req: Request) {
    return req.user;
  }

  // List Users
  @Get("users")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "COUNSELOR")
  @ApiOperation({ summary: "Get users " })
  @ApiQuery({
    name: "role",
    required: false,
    enum: UserRole,
  })
  getUsers(@Query("role") role?: string) {
    if (role && !Object.values(UserRole).includes(role as UserRole)) {
      throw new BadRequestException("Invalid role");
    }

    return this.authService.getUsers(role as UserRole);
  }

  // Self-update — any logged-in user (name + email only, role never changes)
  @Patch("profile")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Update own profile (name & email only)" })
  updateProfile(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(
      (req.user as { sub: string }).sub,
      dto,
    );
  }

  // Admin-only — can update any user including their role
  @Patch("user/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiOperation({ summary: "Update any user (Admin only — can change role)" })
  @ApiParam({ name: "id", description: "User ID" })
  updateUser(@Param("id") id: string, @Body() dto: UpdateUserDto) {
    return this.authService.updateUser(id, dto);
  }

  // update password
  @Patch("change-password")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Change password for logged-in user" })
  changePassword(@Req() req: Request, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(
      (req.user as { sub: string }).sub,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  // Delete user
  @Delete("users/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiOperation({ summary: "Delete user (Admin only)" })
  @ApiParam({ name: "id", description: "User ID" })
  deleteUser(@Param("id") id: string) {
    return this.authService.deleteUser(id);
  }

  // Send OTP to user's email for password reset
  @Post("forgot-password")
  @ApiOperation({ summary: "Send forgot password OTP" })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  // Reset user password using the OTP received in email
  @Post("reset-password")
  @ApiOperation({ summary: "Reset password using OTP" })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
