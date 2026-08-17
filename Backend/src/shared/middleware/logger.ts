import { Request, Response, NextFunction } from 'express';

export function logger(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const requestId = req.headers['x-request-id'] || '-';
        const log = `[${requestId}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;

        if (res.statusCode >= 400) {
            console.error(log);
        } else {
            console.log(log);
        }
    });

    next();
}
