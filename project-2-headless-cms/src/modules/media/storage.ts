import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { pipeline } from 'stream/promises';
import { prisma } from '../../db/prisma.js';
import { env } from '../../config/env.js';

export interface FileUploadStream {
  filename: string;
  mimetype: string;
  file: NodeJS.ReadableStream;
}

export class MediaService {
  private static uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);

  static ensureUploadDir() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  static async saveFile(upload: FileUploadStream, altText?: string) {
    this.ensureUploadDir();

    const ext = path.extname(upload.filename);
    const randomHex = crypto.randomBytes(16).toString('hex');
    const storedFilename = `${Date.now()}_${randomHex}${ext}`;
    const filePath = path.join(this.uploadDir, storedFilename);

    let bytesWritten = 0;
    const writeStream = fs.createWriteStream(filePath);

    upload.file.on('data', (chunk) => {
      bytesWritten += chunk.length;
    });

    await pipeline(upload.file, writeStream);

    const publicUrl = `${env.BASE_URL}/uploads/${storedFilename}`;

    return prisma.asset.create({
      data: {
        filename: storedFilename,
        originalName: upload.filename,
        mimeType: upload.mimetype,
        size: bytesWritten,
        url: publicUrl,
        path: filePath,
        altText: altText || null,
      },
    });
  }

  static async getAssets(limit: number = 50, skip: number = 0) {
    return prisma.asset.findMany({
      take: limit,
      skip,
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getAssetById(id: string) {
    return prisma.asset.findUnique({
      where: { id },
    });
  }

  static async deleteAsset(id: string) {
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) return null;

    if (fs.existsSync(asset.path)) {
      try {
        fs.unlinkSync(asset.path);
      } catch (err) {
        console.error('Failed to remove asset from disk:', err);
      }
    }

    return prisma.asset.delete({ where: { id } });
  }
}
