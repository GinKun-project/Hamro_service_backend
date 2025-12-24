import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { ApiError } from '../errors/ApiError.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Unauthorized - No token provided');
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, config.JWT_SECRET) as { userId: string };

    const userRepository = new UserRepository();
    const user = await userRepository.findById(decoded.userId);

    if (!user) {
      throw new ApiError(401, 'Unauthorized - User not found');
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new ApiError(401, 'Unauthorized - Invalid token'));
    }
    next(error);
  }
};

