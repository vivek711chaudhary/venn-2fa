import { Request, Response, NextFunction } from 'express';
import { ExternalDetectorRequestBodySchema } from "./schemas";
import { z } from 'zod';

// Validation middleware
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
    try {
        ExternalDetectorRequestBodySchema.parse(req.body);
        next();
    } catch (error) {
        res.status(400).json({
            error: true,
            message: 'Invalid request body',
            details: error instanceof z.ZodError ? error.errors : undefined,
        });
    }
};