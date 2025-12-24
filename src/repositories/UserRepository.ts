import { User, IUser } from '../models/User.js';
import { ApiError } from '../errors/ApiError.js';

export class UserRepository {
  async create(userData: {
    email: string;
    passwordHash: string;
    name?: string;
  }): Promise<IUser> {
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new ApiError(409, 'Email already exists');
    }

    const user = await User.create({
      email: userData.email,
      passwordHash: userData.passwordHash,
      name: userData.name || undefined,
    });

    return user;
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email });
  }

  async findById(id: string): Promise<IUser | null> {
    return await User.findById(id);
  }

  async findByResetToken(resetToken: string): Promise<IUser | null> {
    return await User.findOne({
      resetPasswordToken: resetToken,
      resetPasswordExpires: { $gt: new Date() },
    });
  }

  async update(
    userId: string,
    updateData: {
      passwordHash?: string;
      resetPasswordToken?: string | undefined;
      resetPasswordExpires?: Date | undefined;
    }
  ): Promise<IUser | null> {
    return await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );
  }
}

