import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "./auth/auth.module";
import { User } from "./users/user.entity";
import { HealthModule } from "./health.module";

const isTest = process.env.NODE_ENV === "test";

@Module({
	imports: [
		TypeOrmModule.forRootAsync({
			useFactory: () => ({
				type: "sqlite",
				database: isTest
					? ":memory:"
					: (process.env.SQLITE_DB_PATH ?? "./data/ark-escrow.sqlite"),
				entities: [User],
				synchronize: true,
			}),
		}),
		AuthModule,
		HealthModule,
	],
})
export class AppModule {}
