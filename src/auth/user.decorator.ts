import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const UserFromJwt = createParamDecorator(
	(key: string | undefined, ctx: ExecutionContext) => {
		const req = ctx.switchToHttp().getRequest();
		// Assuming JwtAuthGuard attaches user: { userId: string, ... }
		return key ? req.user?.[key] : req.user;
	},
);
