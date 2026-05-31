import type { Request, Response, NextFunction } from 'express';
export declare class AppError extends Error {
    statusCode: number;
    code: string;
    details?: Record<string, unknown> | undefined;
    constructor(statusCode: number, code: string, message: string, details?: Record<string, unknown> | undefined);
}
export declare function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void;
