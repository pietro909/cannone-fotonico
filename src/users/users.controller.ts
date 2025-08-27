import {
	Controller,
	Delete,
	ForbiddenException,
	HttpCode,
	HttpStatus,
	Param,
	Post,
	Req,
	UseGuards,
} from "@nestjs/common";
import { ApiSecurity, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "../auth/auth.guard";
import { UsersService } from "./users.service";

@ApiTags("Users")
@Controller()
export class UsersController {
	constructor(private users: UsersService) {}

	// POST /signout (stateless JWT; no-op + 200 envelope)
	@Post("signout")
	@UseGuards(AuthGuard)
	@ApiSecurity("Authentication")
	@HttpCode(HttpStatus.OK)
	async signout() {
		// TODO: void JWT
		return { data: {} };
	}

	// DELETE /users/{user_id}
	@Delete("users/:user_id")
	@UseGuards(AuthGuard)
	@ApiSecurity("Authentication")
	async delete(@Param("user_id") userId: string, @Req() req: any) {
		const authUserId = (req as any).user?.userId ?? (req as any).userId;
		if (userId !== authUserId) throw new ForbiddenException("forbidden");
		await this.users.deleteById(userId);
		return { data: {} };
	}
}
