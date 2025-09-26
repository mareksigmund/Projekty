import * as argon2 from 'argon2';
import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Model } from 'mongoose';
import { MongoServerError } from 'mongodb';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async findByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase() }).lean();
  }

  async create(input: {
    email: string;
    passwordHash: string;
    fullName: string;
  }) {
    try {
      const created = await this.userModel.create({
        email: input.email.toLowerCase(),
        passwordHash: input.passwordHash,
        fullName: input.fullName,
      });
      return {
        id: created._id.toString(),
        email: created.email,
        fullName: created.fullName,
        createdAt: created.createdAt,
      };
    } catch (err: unknown) {
      if (err instanceof MongoServerError && err.code === 11000) {
        throw new ConflictException('Email already registered');
      }
      throw err;
    }
  }

  async updateRefreshHash(userId: string, refreshTokenHash: string) {
    await this.userModel.updateOne(
      { _id: userId },
      { $set: { refreshTokenHash } },
    );
  }

  async clearRefreshHash(userId: string) {
    await this.userModel.updateOne(
      { _id: userId },
      { $unset: { refreshTokenHash: 1 } },
    );
  }

  /**
   * Sprawdza, czy podane hasło jest poprawne dla usera.
   * Zwraca true/false (nie rzuca wyjątków).
   */
  async verifyPassword(userId: string, plain: string): Promise<boolean> {
    const user = await this.userModel.findById(userId).lean();
    // zakładam, że hash jest w polu "passwordHash"
    if (!user?.passwordHash) return false;

    try {
      return await argon2.verify(user.passwordHash, plain);
    } catch {
      return false;
    }
  }
}
