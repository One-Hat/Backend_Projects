import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { prisma } from '../../db/prisma.js';
import { Role } from '@prisma/client';

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
  }

  static verifyToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    } catch {
      return null;
    }
  }

  static hashApiKey(plainKey: string): string {
    return crypto.createHash('sha256').update(plainKey).digest('hex');
  }

  static async generateApiKey(name: string, role: Role = Role.CONSUMER, expiresAt?: Date): Promise<{ apiKey: any; plainKey: string }> {
    const rawRandom = crypto.randomBytes(32).toString('hex');
    const plainKey = `cms_${rawRandom}`;
    const keyHash = this.hashApiKey(plainKey);

    const apiKey = await prisma.apiKey.create({
      data: {
        name,
        keyHash,
        role,
        expiresAt,
      },
    });

    return { apiKey, plainKey };
  }

  static async validateApiKey(plainKey: string) {
    const keyHash = this.hashApiKey(plainKey);
    const keyRecord = await prisma.apiKey.findUnique({
      where: { keyHash },
    });

    if (!keyRecord) return null;

    if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
      return null;
    }

    // Update lastUsedAt asynchronously
    prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: { lastUsedAt: new Date() },
    }).catch(() => {});

    return keyRecord;
  }
}
