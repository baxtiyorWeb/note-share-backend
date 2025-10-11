import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import express from 'express';
import 'dotenv/config';
import 'cors';
import { join } from 'path';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['http://localhost:3000', 'https://note-share-frontend-beryl.vercel.app'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  const config = new DocumentBuilder()
    .setTitle('Note Sharing API')
    .setDescription('API documentation for Note Sharing backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();


  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.use(
    '/api/docs',
    express.static(join(__dirname, '../node_modules/swagger-ui-dist')),
  );

  await app.listen(process.env.PORT ?? 8080);
  console.log(`🚀 Server running on: http://localhost:${process.env.PORT ?? 8080}`);
  console.log(`📘 Swagger docs: http://localhost:${process.env.PORT ?? 8080}/api/docs`);
}
bootstrap();
