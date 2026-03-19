import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { config } from 'dotenv';

config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  // ✅ GLOBAL VALIDATION (THIS MAKES DTOs WORK)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // removes unknown fields
      forbidNonWhitelisted: true, // throws error if extra fields are sent
      transform: true, // auto-transform types
    }),
  );

  // Swagger setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Plattar API')
    .setDescription(
      'API documentation for plattar backend services (Version 1.0) - Authentication, User Management, Vendor & Delivery System',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 5000);
}

bootstrap();