import { S3Client } from '@aws-sdk/client-s3';
import { MediaConvertClient } from '@aws-sdk/client-mediaconvert';

// AWS Configuration
export const AWS_CONFIG = {
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  s3: {
    bucketName: process.env.AWS_S3_BUCKET_NAME || 'lingala-learning-platform',
    videosBucket: process.env.AWS_S3_VIDEOS_BUCKET || 'lingala-videos',
    cloudfrontDomain: process.env.AWS_CLOUDFRONT_DOMAIN,
  },
  mediaConvert: {
    endpoint: process.env.AWS_MEDIACONVERT_ENDPOINT,
    roleArn: process.env.AWS_MEDIACONVERT_ROLE_ARN,
    queue: process.env.AWS_MEDIACONVERT_QUEUE,
  },
};

// Validate required environment variables
export function validateAWSConfig(): boolean {
  const required = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_S3_BUCKET_NAME',
    'AWS_REGION',
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`Missing AWS environment variables: ${missing.join(', ')}`);
    return false;
  }
  
  return true;
}

// S3 Client
export const s3Client = new S3Client({
  region: AWS_CONFIG.region,
  credentials: {
    accessKeyId: AWS_CONFIG.accessKeyId!,
    secretAccessKey: AWS_CONFIG.secretAccessKey!,
  },
});

// MediaConvert Client
export const mediaConvertClient = new MediaConvertClient({
  region: AWS_CONFIG.region,
  credentials: {
    accessKeyId: AWS_CONFIG.accessKeyId!,
    secretAccessKey: AWS_CONFIG.secretAccessKey!,
  },
  endpoint: AWS_CONFIG.mediaConvert.endpoint,
});