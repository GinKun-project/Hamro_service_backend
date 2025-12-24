import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config';
import { UserRepository } from '../repositories/UserRepository';
import { ApiError } from '../errors/ApiError';

const SALT_ROUNDS = 10;

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, SALT_ROUNDS);
  }

  private async comparePassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  private generateToken(userId: string): string {
    return jwt.sign({ userId }, config.JWT_SECRET, {
      expiresIn: '7d',
    });
  }

  async signup(userData: {
    email: string;
    password: string;
    name?: string;
  }): Promise<{ user: { id: string; email: string; name?: string }; token: string }> {
    const { email, password, name } = userData;

    const passwordHash = await this.hashPassword(password);

    const user = await this.userRepository.create({
      email,
      passwordHash,
      name,
    });

    const token = this.generateToken(user._id.toString());

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
      token,
    };
  }

  async login(
    email: string,
    password: string
  ): Promise<{ user: { id: string; email: string; name?: string }; token: string }> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new ApiError(401, 'Invalid credentials');
    }

    const isPasswordValid = await this.comparePassword(
      password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid credentials');
    }

    const token = this.generateToken(user._id.toString());

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
      token,
    };
  }

  async forgotPassword(email: string): Promise<{ message: string; resetUrl?: string }> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      return { message: 'If that email exists, a reset link has been sent.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    const resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.userRepository.update(user._id.toString(), {
      resetPasswordToken,
      resetPasswordExpires,
    });

    const resetUrl = `${config.FRONTEND_URL}/reset-password?token=${resetToken}`;

    console.log('Password Reset URL:', resetUrl);
    console.log('In production, send this via email to:', email);

    return {
      message: 'If that email exists, a reset link has been sent.',
      resetUrl, // Only for development - remove in production
    };
  }

  async resetPassword(
    token: string,
    password: string
  ): Promise<{ message: string }> {
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await this.userRepository.findByResetToken(resetPasswordToken);

    if (!user) {
      throw new ApiError(400, 'Invalid or expired reset token');
    }

    if (user.resetPasswordExpires && user.resetPasswordExpires < new Date()) {
      throw new ApiError(400, 'Reset token has expired');
    }

    const passwordHash = await this.hashPassword(password);

    await this.userRepository.update(user._id.toString(), {
      passwordHash,
      resetPasswordToken: undefined,
      resetPasswordExpires: undefined,
    });

    return { message: 'Password has been reset successfully' };
  }
}

