import 'dotenv/config';
import { z } from "zod";

//схема
const envSchema = z.object({
    DATABASE_URL: z.string().url(),
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    JWT_SECRET: z.string().min(32),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    GOOGLE_CALLBACK_URL: z.string().url(),
    FRONTEND_URL: z.string().url(),
    ALLOWED_DOMAINS: z.string().min(1),
    LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info')
})

//Парсинг + экспорт
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
}

export const env = parsed.data;


// z.coerce.number() — автоматически конвертирует строку из .env в число
// z.string().url() — проверяет что строка является валидным URL
// z.string().min(32) — JWT_SECRET должен быть минимум 32 символа
// safeParse — не кидает ошибку, а возвращает результат
// process.exit(1) — падаем сразу если конфиг невалидный