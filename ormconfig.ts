import * as dotenv from "dotenv";
import { DataSource } from "typeorm";
import { User } from "./src/users/user.entity";

dotenv.config();

export default new DataSource({
	type: "sqlite",
	database: process.env.SQLITE_DB_PATH || "./data/ark-escrow.sqlite",
	entities: [User],
	synchronize: true, // dev only; turn off in prod and use migrations
	logging: false,
});
