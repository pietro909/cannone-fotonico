import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "./auth/auth.module";
import { User } from "./users/user.entity";
import { HealthModule } from "./health.module";
import { EscrowRequestsModule } from "./escrows/requests/escrow-requests.module";
import { EscrowRequest } from "./escrows/requests/escrow-request.entity";
import { ConfigModule } from "@nestjs/config";
import { UsersModule } from "@/users/users.module";

const isTest = process.env.NODE_ENV === "test";

@Module({
	imports: [
		ConfigModule.forRoot(),
		TypeOrmModule.forRootAsync({
			useFactory: () => ({
				type: "sqlite",
				database: isTest
					? ":memory:"
					: (process.env.SQLITE_DB_PATH ?? "./data/ark-escrow.sqlite"),
				entities: [User, EscrowRequest],
				synchronize: true,
			}),
		}),
		AuthModule,
		EscrowRequestsModule,
		UsersModule,
		HealthModule,
	],
})
export class AppModule {}
