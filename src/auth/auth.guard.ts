import {
	type CanActivate,
	type ExecutionContext,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(private readonly jwt: JwtService) {}

	canActivate(context: ExecutionContext): boolean {
		const req = context.switchToHttp().getRequest();
		const header: string | undefined = req.headers.authorization;
		if (!header)
			throw new UnauthorizedException("Missing Authentication header");

		const [scheme, token] = header.split(" ");
		if (!scheme || scheme.toLowerCase() !== "bearer" || !token)
			throw new UnauthorizedException("Invalid Authentication format");

		try {
			const payload = this.jwt.verify(token);
			req.user = { userId: payload.sub };
			return true;
		} catch (e) {
			console.error(e);
			throw new UnauthorizedException("Invalid or expired token");
		}
	}
}
