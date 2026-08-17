import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';

export function requestId(req: Request, _res: Response, next: NextFunction): void {
    req.headers['x-request-id'] = req.headers['x-request-id'] || randomUUID();
    next();
}
