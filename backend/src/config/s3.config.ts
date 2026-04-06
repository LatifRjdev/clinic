import { S3Client } from '@aws-sdk/client-s3';

export const createS3Client = (): S3Client => {
  return new S3Client({
    endpoint: `http://${process.env.S3_ENDPOINT || 'localhost'}:${process.env.S3_PORT || '9000'}`,
    region: 'us-east-1',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
      secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
    },
    forcePathStyle: true,
  });
};

export const S3_BUCKET = process.env.S3_BUCKET || 'clinic-files';
