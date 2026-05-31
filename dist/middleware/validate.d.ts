import type { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
interface ValidationSchemas {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
}
export declare function validate(schemas: ValidationSchemas): (req: Request, res: Response, next: NextFunction) => void;
export {};
