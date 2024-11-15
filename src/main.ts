import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as fs from 'fs';


dotenv.config();
async function bootstrap() {
  const httpsOptions = {
    key: fs.readFileSync('./secrets/cert.key'),
    cert: fs.readFileSync('./secrets/cert.crt'),
  };
  const app = await NestFactory.create(AppModule, {
    httpsOptions,
  });
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
