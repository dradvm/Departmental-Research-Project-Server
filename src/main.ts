import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './exceptions/global-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';
async function bootstrap() {
  const server = express();
  server.use('/api/test/webhook', express.raw({ type: 'application/json' }));
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  const config = new DocumentBuilder()
    .setTitle('API tài liệu')
    .setDescription('Mô tả API cho hệ thống của bạn')
    .setVersion('1.0')
    .addServer('/api')
    .addBearerAuth() // Nếu bạn dùng JWT
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  app.setGlobalPrefix('api', { exclude: [''] });
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true
  });

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true
    })
  );
  await app.listen(3001);
}
bootstrap();
