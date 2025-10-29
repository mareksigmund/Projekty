import * as Joi from 'joi';

export const envSchema = Joi.object({
  PORT: Joi.number().default(4001),
  MONGODB_URI: Joi.string().uri().required(),

  // JWT
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES: Joi.string().default('7d'),

  // Webhook delivery
  WEBHOOK_ENC_KEY_BASE64: Joi.string().base64().required(),
  WEBHOOK_KEY_ID: Joi.string().default('k1'),
  WEBHOOK_TIMEOUT_MS: Joi.number().default(5000),
  WEBHOOK_RETRY_SCHEDULE: Joi.string().default('10,30,120'),
  WEBHOOK_USER_AGENT: Joi.string().default('MockBank/1.0'),

  // CORS i rate limit
  CORS_ORIGINS: Joi.string().allow(''), // CSV originów; puste = wszystko (MVP)
  RATE_TTL: Joi.number().default(60), // okno w sekundach
  RATE_LIMIT: Joi.number().default(100), // żądań na IP / okno
});
