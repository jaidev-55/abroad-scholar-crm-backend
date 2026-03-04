import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { ApiBearerAuth, ApiOperation, ApiParam } from "@nestjs/swagger";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { UpdateUserDto } from "./dto/update-user.dto";

@ApiBearerAuth()
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}
  // Register endpoint
  @Post("register")
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }
  // Login endpoint
  @Post("login")
  login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  //List Users
  @Get("users")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiOperation({ summary: "Get all users (Admin only)" })
  getUsers() {
    return this.authService.getUsers();
  }

  // Update user
  @Patch("user/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiOperation({ summary: "Update user (Admin only)" })
  @ApiParam({ name: "id", description: "User ID" })
  updateUser(@Param("id") id: string, @Body() dto: UpdateUserDto) {
    return this.authService.updateUser(id, dto);
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
}
