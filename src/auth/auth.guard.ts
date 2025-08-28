import {
	type CanActivate,
	type ExecutionContext,
	Injectable,
	UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Repository } from "typeorm";
import { User } from "../users/user.entity";
import {InjectRepository} from "@nestjs/typeorm";

/**
 * Includes validation against pending challenges.
 */
@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		private readonly jwt: JwtService,
        @InjectRepository(User) private readonly users: Repository<User>,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        const header: string | undefined = req.headers.authorization;
        if (!header)
            throw new UnauthorizedException("Missing Authentication header");

        const [scheme, token] = header.split(" ");
        if (!scheme || scheme.toLowerCase() !== "bearer" || !token)
            throw new UnauthorizedException("Invalid Authentication format");

        const payload = this.jwt.verify<{ sub: string }>(token);
        const user = await this.users.findOne({where: {id: payload.sub}});
        if (!user || user.pendingChallenge) {
            throw new UnauthorizedException("User has pending challenge");
        }
        req.user = {userId: payload.sub, publicKey: user.publicKey};
        return true;
	}
}
