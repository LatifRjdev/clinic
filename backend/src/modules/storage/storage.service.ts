import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createS3Client, S3_BUCKET } from '../../config/s3.config';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

export interface UploadResult {
  key: string;
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
}

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private s3: S3Client;
  private bucket = S3_BUCKET;

  async onModuleInit() {
    this.s3 = createS3Client();
    await this.ensureBucket();
  }

  private async ensureBucket(): Promise<void> {
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`Bucket "${this.bucket}" exists`);
    } catch {
      try {
        await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket }));
        this.logger.log(`Bucket "${this.bucket}" created`);
      } catch (err) {
        this.logger.warn(`Could not create bucket "${this.bucket}": ${err}`);
      }
    }
  }

  async upload(
    file: Express.Multer.File,
    folder: string = 'general',
  ): Promise<UploadResult> {
    const ext = path.extname(file.originalname);
    const key = `${folder}/${uuidv4()}${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentLength: file.size,
      }),
    );

    return {
      key,
      url: await this.getPresignedUrl(key),
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  async uploadBuffer(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    folder: string = 'general',
  ): Promise<UploadResult> {
    const ext = path.extname(filename);
    const key = `${folder}/${uuidv4()}${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        ContentLength: buffer.length,
      }),
    );

    return {
      key,
      url: await this.getPresignedUrl(key),
      originalName: filename,
      mimeType,
      size: buffer.length,
    };
  }

  async getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.s3, command, { expiresIn });
  }

  async getPresignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn = 600,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.s3, command, { expiresIn });
  }

  async delete(key: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  async listFiles(prefix: string): Promise<string[]> {
    const result = await this.s3.send(
      new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
      }),
    );
    return (result.Contents || []).map((obj) => obj.Key!).filter(Boolean);
  }
}
