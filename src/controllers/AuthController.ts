import { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { AuthService } from '../services/AuthService.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  signup = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, password, name } = req.body;

    const result = await this.authService.signup({ email, password, name });

    return res
      .status(201)
      .json(new ApiResponse(201, result, 'User created successfully'));
  });

  login = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, password } = req.body;

    const result = await this.authService.login(email, password);

    return res
      .status(200)
      .json(new ApiResponse(200, result, 'Login successful'));
  });

  getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user;

    return res
      .status(200)
      .json(new ApiResponse(200, user, 'User retrieved successfully'));
  });

  forgotPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email } = req.body;

    const result = await this.authService.forgotPassword(email);

    return res.status(200).json(new ApiResponse(200, result, result.message));
  });

  resetPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { token, password } = req.body;

    const result = await this.authService.resetPassword(token, password);

    return res.status(200).json(new ApiResponse(200, result, result.message));
  });
}

