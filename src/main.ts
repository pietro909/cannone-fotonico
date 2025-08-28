import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as dotenv from "dotenv";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { hashes } from "@noble/secp256k1";
import { sha256 } from "@noble/hashes/sha2";

dotenv.config();

// CRITICAL: Set up the hash function for secp256k1
hashes.sha256 = sha256;

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
		}),
	);
	app.useGlobalFilters(new HttpExceptionFilter());

	const config = new DocumentBuilder()
		.setTitle("ARK Escrow API")
		.setDescription("Custom header auth: `Authentication: Bearer <jwt>`")
		.setVersion("0.0.2")
		.addBearerAuth(
			{ type: "http", scheme: "bearer", bearerFormat: "JWT", in: "header" },
			"bearer",
		)
		.build();
	const doc = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup("docs", app, doc);

	const port = parseInt(process.env.PORT ?? "3000", 10);
	await app.listen(port, "0.0.0.0");
	// eslint-disable-next-line no-console
	console.log(`API listening on http://0.0.0.0:${port}`);
}

bootstrap();
