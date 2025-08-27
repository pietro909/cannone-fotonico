import { Body, Controller, Headers, Post } from "@nestjs/common";
import {
	ApiBadRequestResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
} from "@nestjs/swagger";
// biome-ignore lint/style/useImportType: it used for Dependency Injection
import { AuthService } from "./auth.service";
import type { RequestChallengeDto } from "./dto/request-challenge.dto";
import type { VerifySignupDto } from "./dto/verify-signup.dto";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
	constructor(private readonly auth: AuthService) {}

	@Post("signup/challenge")
	@ApiOperation({
		summary: "Start signup by requesting a challenge for a given public key",
	})
	@ApiOkResponse({
		schema: {
			type: "object",
			properties: {
				challenge: { type: "object" },
				challengeId: { type: "string" },
				hashToSignHex: { type: "string" },
				expiresAt: { type: "string", format: "date-time" },
			},
		},
	})
	async challenge(
		@Body() dto: RequestChallengeDto,
		@Headers("origin") origin?: string,
	) {
		const effectiveOrigin =
			origin ?? process.env.AUTH_CHALLENGE_ORIGIN ?? "https://api.local";
		return this.auth.createSignupChallenge(dto.publicKey, effectiveOrigin);
	}

	@Post("signup/verify")
	@ApiOperation({ summary: "Verify the signed challenge and receive a JWT" })
	@ApiOkResponse({
		schema: {
			type: "object",
			properties: {
				accessToken: { type: "string" },
				userId: { type: "string" },
				publicKey: { type: "string" },
			},
		},
	})
	@ApiBadRequestResponse()
	@ApiUnauthorizedResponse()
	async verify(
		@Body() dto: VerifySignupDto,
		@Headers("origin") origin?: string,
	) {
		const effectiveOrigin =
			origin ?? process.env.AUTH_CHALLENGE_ORIGIN ?? "https://api.local";
		return this.auth.verifySignup(
			dto.publicKey,
			dto.signature,
			dto.challengeId,
			effectiveOrigin,
		);
	}
}
