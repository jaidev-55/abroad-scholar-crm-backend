import { Injectable, ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "./decorators/public.decorator";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private reflector: Reflector) {
    super();
  }

  // Check if the route is public or requires JWT authentication
  canActivate(context: ExecutionContext) {
    // Check if @Public() decorator is applied to the route
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Skip JWT auth for public routes (health check, webhooks, etc.)
    if (isPublic) return true;

    // Otherwise, enforce JWT authentication
    return super.canActivate(context);
  }
}
