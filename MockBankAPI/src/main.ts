import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger:
      process.env.NODE_ENV === 'production'
        ? ['error', 'warn', 'log']
        : ['debug', 'error', 'warn', 'log', 'verbose'],
  });

  // Bezpieczeństwo HTTP
  app.use(helmet());
  app.use(compression());

  // Limity body (np. 1MB)
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true, limit: '1mb' }));

  // Walidacja DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS whitelist z env (CSV). Puste => wszystkie originy (MVP).
  const config = app.get(ConfigService);
  const originsCsv = config.get<string>('CORS_ORIGINS') || '';
  const whitelist = originsCsv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  app.enableCors({
    origin: (origin, cb) => {
      if (!origin || whitelist.length === 0 || whitelist.includes(origin))
        return cb(null, true);
      return cb(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
  });

  const port = config.get<number>('PORT') ?? 4001;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`MockBank API listening on http://localhost:${port}`);
}
bootstrap();
