import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { BadRequestError } from '@/errors/AppErrors.js';

type ValidationTarget = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
    return (req: Request, _res: Response, next: NextFunction): void => {
        try {
            req[target] = schema.parse(req[target]);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const message = error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
                throw new BadRequestError(message);
            }
            throw error;
        }
    };
}
