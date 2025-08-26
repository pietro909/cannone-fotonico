import {ValidationPipe} from "@nestjs/common";
import {NestFactory} from "@nestjs/core";
import {DocumentBuilder, SwaggerModule} from "@nestjs/swagger";
import * as dotenv from "dotenv";
import {AppModule} from "./app.module";
import {HttpExceptionFilter} from "./common/filters/http-exception.filter";

dotenv.config();

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
        .addBearerAuth()
        .addApiKey(
            {type: "apiKey", name: "Authentication", in: "header"},
            "Authentication",
        )
        .build();
    const doc = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("docs", app, doc);

    const port = process.env.PORT || 3000;
    await app.listen(port as number);
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${port}`);
}

bootstrap();
