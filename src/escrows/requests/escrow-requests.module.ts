import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { User } from "@/users/user.entity";
import { AuthModule } from "@/auth/auth.module";
import { EscrowRequest } from "./escrow-request.entity";
import { EscrowRequestsService } from "./escrow-requests.service";
import { EscrowRequestsController } from "./escrow-requests.controller";

@Module({
	imports: [
		ConfigModule.forFeature(() => ({})),
		TypeOrmModule.forFeature([EscrowRequest, User]),
		AuthModule,
	],
	providers: [EscrowRequestsService],
	controllers: [EscrowRequestsController],
	exports: [EscrowRequestsService],
})
export class EscrowRequestsModule {}
