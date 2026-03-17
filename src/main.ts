import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('My API')
    .setDescription('API documentation for my NestJS project')
    .setVersion('1.0')
    .addBearerAuth() // Optional if you use JWT
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // Swagger available at http://localhost:5000/api

  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();