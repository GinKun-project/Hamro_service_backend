import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ApiError } from '../errors/ApiError';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error: any) {
      if (error.errors) {
        const message = error.errors.map((err: any) => err.message).join(', ');
        return next(new ApiError(400, message));
      }
      next(new ApiError(400, 'Validation error'));
    }
  };
};

