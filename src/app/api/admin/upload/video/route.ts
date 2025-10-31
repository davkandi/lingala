import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { validateAWSConfig } from '@/lib/aws-config';
import { uploadToS3, generateS3Key } from '@/lib/s3-utils';
import { createVideoProcessingJob, getVideoProcessingStatus } from '@/lib/mediaconvert-utils';
import { db } from '@/db';
import { videoAssets, videoProcessingJobs } from '@/db/postgres-schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const admin = await requireAdmin(request);

    // Validate AWS configuration
    if (!validateAWSConfig()) {
      return NextResponse.json(
        { error: 'AWS configuration incomplete. Video upload not available.' },
        { status: 503 }
      );
    }

    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;
    const lessonId = data.get('lessonId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!lessonId) {
      return NextResponse.json({ error: 'Lesson ID is required' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/avi', 'video/mov', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: 'Invalid file type. Allowed: MP4, WebM, AVI, MOV'
      }, { status: 400 });
    }

    // Validate file size (500MB max for video)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      return NextResponse.json({
        error: 'File too large. Maximum size is 500MB'
      }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate S3 key for the video
    const s3Key = generateS3Key(file.name, 'videos/raw');

    // Upload to S3
    const uploadResult = await uploadToS3(buffer, s3Key, {
      contentType: file.type,
      metadata: {
        originalName: file.name,
        uploadedBy: admin.id,
        lessonId: lessonId,
      },
    });

    // Create video asset record
    const videoAssetResult = await db.insert(videoAssets).values({
      lessonId: parseInt(lessonId),
      originalFilename: file.name,
      s3Key: uploadResult.key,
      fileSize: file.size,
      status: 'pending',
      uploadedBy: admin.id,
    }).returning();

    const videoAsset = videoAssetResult[0];

    // Start video processing job
    try {
      const outputPrefix = `videos/processed/${videoAsset.id}`;
      const jobId = await createVideoProcessingJob(uploadResult.key, outputPrefix, {
        generateThumbnails: true,
        createHLS: true,
        outputQualities: ['480p', '720p', '1080p'],
      });

      // Create processing job record
      await db.insert(videoProcessingJobs).values({
        videoAssetId: videoAsset.id,
        mediaConvertJobId: jobId,
        status: 'submitted',
        inputS3Key: uploadResult.key,
        outputS3Prefix: outputPrefix,
      });

      // Update video asset with processing job ID
      await db.update(videoAssets)
        .set({
          processingJobId: jobId,
          status: 'processing',
          updatedAt: new Date(),
        })
        .where(eq(videoAssets.id, videoAsset.id));

      return NextResponse.json({
        success: true,
        videoAsset: {
          id: videoAsset.id,
          filename: file.name,
          s3Key: uploadResult.key,
          size: file.size,
          status: 'processing',
          processingJobId: jobId,
        },
        message: 'Video uploaded successfully and processing started',
      });

    } catch (processingError) {
      console.error('Video processing error:', processingError);

      // Update status to failed
      await db.update(videoAssets)
        .set({
          status: 'failed',
          updatedAt: new Date(),
        })
        .where(eq(videoAssets.id, videoAsset.id));

      return NextResponse.json({
        success: true,
        videoAsset: {
          id: videoAsset.id,
          filename: file.name,
          s3Key: uploadResult.key,
          size: file.size,
          status: 'failed',
        },
        warning: 'Video uploaded but processing failed. Please try again.',
      }, { status: 206 }); // 206 Partial Content
    }

  } catch (error) {
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 }
      );
    }

    console.error('Video upload error:', error);
    return NextResponse.json({
      error: 'Failed to upload video'
    }, { status: 500 });
  }
}

// Get video processing status
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const videoAssetId = searchParams.get('id');

    if (!videoAssetId) {
      return NextResponse.json({ error: 'Video asset ID required' }, { status: 400 });
    }

    // Get video asset with processing job
    const result = await db.select({
      videoAsset: videoAssets,
      processingJob: videoProcessingJobs,
    })
    .from(videoAssets)
    .leftJoin(videoProcessingJobs, eq(videoAssets.id, videoProcessingJobs.videoAssetId))
    .where(eq(videoAssets.id, videoAssetId))
    .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: 'Video asset not found' }, { status: 404 });
    }

    const { videoAsset, processingJob } = result[0];

    // If processing job exists, get current status from MediaConvert
    if (processingJob?.mediaConvertJobId) {
      try {
        const jobStatus = await getVideoProcessingStatus(processingJob.mediaConvertJobId);
        
        // Update local status if changed
        if (jobStatus.status !== processingJob.status) {
          await db.update(videoProcessingJobs)
            .set({
              status: jobStatus.status,
              progress: jobStatus.progress || 0,
              errorMessage: jobStatus.errorMessage,
              startedAt: jobStatus.status === 'PROGRESSING' ? new Date() : processingJob.startedAt,
              completedAt: ['COMPLETE', 'ERROR', 'CANCELED'].includes(jobStatus.status) ? new Date() : processingJob.completedAt,
              updatedAt: new Date(),
            })
            .where(eq(videoProcessingJobs.id, processingJob.id));
        }

        return NextResponse.json({
          videoAsset,
          processingJob: {
            ...processingJob,
            status: jobStatus.status,
            progress: jobStatus.progress,
            errorMessage: jobStatus.errorMessage,
          },
        });
      } catch (error) {
        console.error('Error getting MediaConvert job status:', error);
      }
    }

    return NextResponse.json({
      videoAsset,
      processingJob,
    });

  } catch (error) {
    console.error('Video status error:', error);
    return NextResponse.json({
      error: 'Failed to get video status'
    }, { status: 500 });
  }
}