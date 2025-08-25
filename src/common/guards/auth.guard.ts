import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const header: string | undefined = req.headers['authentication'];
    if (!header) throw new UnauthorizedException('Missing Authentication header');

    const [scheme, token] = header.split(' ');
    if (!scheme || scheme.toLowerCase() !== 'bearer' || !token)
      throw new UnauthorizedException('Invalid Authentication format');

    try {
      const payload = this.jwt.verify(token, { secret: process.env.JWT_SECRET! });
      req.user = { userId: payload.userId };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}