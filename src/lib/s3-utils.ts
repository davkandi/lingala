import { 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand,
  HeadObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import { s3Client, AWS_CONFIG } from './aws-config';
import crypto from 'crypto';

export interface S3UploadResult {
  key: string;
  url: string;
  bucket: string;
  etag?: string;
  size?: number;
}

export interface PresignedUrlOptions {
  key: string;
  bucket?: string;
  expiresIn?: number;
  contentType?: string;
}

// Generate unique S3 key for uploaded files
export function generateS3Key(filename: string, prefix = 'uploads'): string {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = filename.split('.').pop();
  const cleanName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  return `${prefix}/${timestamp}_${randomString}_${cleanName}`;
}

// Upload file to S3 using multipart upload for large files
export async function uploadToS3(
  file: Buffer | Uint8Array | string,
  key: string,
  options: {
    bucket?: string;
    contentType?: string;
    metadata?: Record<string, string>;
  } = {}
): Promise<S3UploadResult> {
  const bucket = options.bucket || AWS_CONFIG.s3.bucketName;
  
  try {
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: bucket,
        Key: key,
        Body: file,
        ContentType: options.contentType,
        Metadata: options.metadata,
      },
    });

    // Monitor upload progress
    upload.on('httpUploadProgress', (progress) => {
      if (progress.loaded && progress.total) {
        const percentage = (progress.loaded / progress.total) * 100;
        console.log(`Upload progress: ${percentage.toFixed(2)}%`);
      }
    });

    const result = await upload.done();
    
    return {
      key,
      url: `https://${bucket}.s3.${AWS_CONFIG.region}.amazonaws.com/${key}`,
      bucket,
      etag: result.ETag,
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error(`Failed to upload to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Generate presigned URL for uploads
export async function generatePresignedUploadUrl(
  options: PresignedUrlOptions
): Promise<string> {
  const { key, bucket = AWS_CONFIG.s3.bucketName, expiresIn = 3600, contentType } = options;
  
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

// Generate presigned URL for downloads
export async function generatePresignedDownloadUrl(
  key: string,
  bucket = AWS_CONFIG.s3.bucketName,
  expiresIn = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

// Delete file from S3
export async function deleteFromS3(
  key: string,
  bucket = AWS_CONFIG.s3.bucketName
): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error('S3 delete error:', error);
    throw new Error(`Failed to delete from S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Check if file exists in S3
export async function fileExistsInS3(
  key: string,
  bucket = AWS_CONFIG.s3.bucketName
): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    return false;
  }
}

// Get file metadata from S3
export async function getS3FileMetadata(
  key: string,
  bucket = AWS_CONFIG.s3.bucketName
) {
  try {
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await s3Client.send(command);
    
    return {
      size: response.ContentLength,
      lastModified: response.LastModified,
      contentType: response.ContentType,
      etag: response.ETag,
      metadata: response.Metadata,
    };
  } catch (error) {
    console.error('S3 metadata error:', error);
    throw new Error(`Failed to get S3 metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}