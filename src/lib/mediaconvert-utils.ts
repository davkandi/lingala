import {
  CreateJobCommand,
  GetJobCommand,
  ListJobsCommand,
  CancelJobCommand,
  JobStatus,
} from '@aws-sdk/client-mediaconvert';
import { mediaConvertClient, AWS_CONFIG } from './aws-config';

export interface VideoProcessingJob {
  id: string;
  status: JobStatus;
  inputS3Key: string;
  outputS3Prefix: string;
  createdAt?: Date;
  completedAt?: Date;
  progress?: number;
  errorMessage?: string;
}

export interface VideoOutput {
  quality: '720p' | '1080p' | '480p';
  s3Key: string;
  url: string;
  bitrate?: number;
  fileSize?: number;
}

export interface VideoProcessingResult {
  jobId: string;
  status: JobStatus;
  outputs: VideoOutput[];
  thumbnails: string[];
  hlsPlaylistUrl?: string;
}

// Create video processing job
export async function createVideoProcessingJob(
  inputS3Key: string,
  outputPrefix: string,
  options: {
    generateThumbnails?: boolean;
    createHLS?: boolean;
    outputQualities?: Array<'480p' | '720p' | '1080p'>;
  } = {}
): Promise<string> {
  const {
    generateThumbnails = true,
    createHLS = true,
    outputQualities = ['480p', '720p', '1080p'],
  } = options;

  const inputUri = `s3://${AWS_CONFIG.s3.videosBucket}/${inputS3Key}`;
  const outputUri = `s3://${AWS_CONFIG.s3.videosBucket}/${outputPrefix}/`;

  // Build output groups
  const outputGroups = [];

  // MP4 outputs for different qualities
  const mp4OutputGroup = {
    Name: 'MP4 Group',
    OutputGroupSettings: {
      Type: 'FILE_GROUP_SETTINGS',
      FileGroupSettings: {
        Destination: outputUri + 'mp4/',
      },
    },
    Outputs: outputQualities.map((quality) => {
      const settings = getVideoSettings(quality);
      return {
        NameModifier: `_${quality}`,
        ContainerSettings: {
          Container: 'MP4',
          Mp4Settings: {},
        },
        VideoDescription: {
          CodecSettings: {
            Codec: 'H_264',
            H264Settings: {
              RateControlMode: 'CBR',
              Bitrate: settings.bitrate,
              MaxBitrate: settings.maxBitrate,
            },
          },
          Width: settings.width,
          Height: settings.height,
        },
        AudioDescriptions: [
          {
            CodecSettings: {
              Codec: 'AAC',
              AacSettings: {
                Bitrate: 128000,
                SampleRate: 48000,
              },
            },
          },
        ],
      };
    }),
  };

  outputGroups.push(mp4OutputGroup);

  // HLS output for adaptive streaming
  if (createHLS) {
    const hlsOutputGroup = {
      Name: 'HLS Group',
      OutputGroupSettings: {
        Type: 'HLS_GROUP_SETTINGS',
        HlsGroupSettings: {
          Destination: outputUri + 'hls/',
          SegmentLength: 6,
          ManifestDurationFormat: 'INTEGER',
          StreamInfResolution: 'INCLUDE',
          ProgramDateTimePeriod: 600,
        },
      },
      Outputs: outputQualities.map((quality) => {
        const settings = getVideoSettings(quality);
        return {
          NameModifier: `_${quality}`,
          ContainerSettings: {
            Container: 'M3U8',
          },
          VideoDescription: {
            CodecSettings: {
              Codec: 'H_264',
              H264Settings: {
                RateControlMode: 'CBR',
                Bitrate: settings.bitrate,
                MaxBitrate: settings.maxBitrate,
              },
            },
            Width: settings.width,
            Height: settings.height,
          },
          AudioDescriptions: [
            {
              CodecSettings: {
                Codec: 'AAC',
                AacSettings: {
                  Bitrate: 128000,
                  SampleRate: 48000,
                },
              },
            },
          ],
        };
      }),
    };

    outputGroups.push(hlsOutputGroup);
  }

  // Thumbnail output
  if (generateThumbnails) {
    const thumbnailOutputGroup = {
      Name: 'Thumbnail Group',
      OutputGroupSettings: {
        Type: 'FILE_GROUP_SETTINGS',
        FileGroupSettings: {
          Destination: outputUri + 'thumbnails/',
        },
      },
      Outputs: [
        {
          NameModifier: '_thumbnail_%05d',
          ContainerSettings: {
            Container: 'RAW',
          },
          VideoDescription: {
            CodecSettings: {
              Codec: 'FRAME_CAPTURE',
              FrameCaptureSettings: {
                FramerateNumerator: 1,
                FramerateDenominator: 10, // One frame every 10 seconds
                MaxCaptures: 10,
                Quality: 80,
              },
            },
            Width: 1280,
            Height: 720,
          },
        },
      ],
    };

    outputGroups.push(thumbnailOutputGroup);
  }

  const jobParams = {
    Role: AWS_CONFIG.mediaConvert.roleArn,
    Queue: AWS_CONFIG.mediaConvert.queue,
    Settings: {
      Inputs: [
        {
          FileInput: inputUri,
          VideoSelector: {},
          AudioSelectors: {
            'Audio Selector 1': {
              DefaultSelection: 'DEFAULT',
            },
          },
        },
      ],
      OutputGroups: outputGroups,
    },
    UserMetadata: {
      inputKey: inputS3Key,
      outputPrefix,
      createdAt: new Date().toISOString(),
    },
  };

  try {
    const command = new CreateJobCommand(jobParams);
    const response = await mediaConvertClient.send(command);
    
    if (!response.Job?.Id) {
      throw new Error('No job ID returned from MediaConvert');
    }

    return response.Job.Id;
  } catch (error) {
    console.error('MediaConvert job creation error:', error);
    throw new Error(`Failed to create MediaConvert job: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get video processing job status
export async function getVideoProcessingStatus(jobId: string): Promise<VideoProcessingJob> {
  try {
    const command = new GetJobCommand({ Id: jobId });
    const response = await mediaConvertClient.send(command);
    
    if (!response.Job) {
      throw new Error('Job not found');
    }

    const job = response.Job;
    const inputKey = job.UserMetadata?.inputKey || '';
    const outputPrefix = job.UserMetadata?.outputPrefix || '';

    return {
      id: jobId,
      status: job.Status!,
      inputS3Key: inputKey,
      outputS3Prefix: outputPrefix,
      createdAt: job.CreatedAt,
      completedAt: job.Timing?.FinishTime,
      progress: job.JobPercentComplete,
      errorMessage: job.ErrorMessage,
    };
  } catch (error) {
    console.error('MediaConvert job status error:', error);
    throw new Error(`Failed to get job status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Cancel video processing job
export async function cancelVideoProcessingJob(jobId: string): Promise<void> {
  try {
    const command = new CancelJobCommand({ Id: jobId });
    await mediaConvertClient.send(command);
  } catch (error) {
    console.error('MediaConvert job cancellation error:', error);
    throw new Error(`Failed to cancel job: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get video settings based on quality
function getVideoSettings(quality: '480p' | '720p' | '1080p') {
  const settings = {
    '480p': {
      width: 854,
      height: 480,
      bitrate: 1000000, // 1 Mbps
      maxBitrate: 1500000,
    },
    '720p': {
      width: 1280,
      height: 720,
      bitrate: 2500000, // 2.5 Mbps
      maxBitrate: 3000000,
    },
    '1080p': {
      width: 1920,
      height: 1080,
      bitrate: 5000000, // 5 Mbps
      maxBitrate: 6000000,
    },
  };

  return settings[quality];
}

// List recent jobs
export async function listRecentJobs(maxResults = 20) {
  try {
    const command = new ListJobsCommand({
      MaxResults: maxResults,
      Order: 'DESCENDING',
    });

    const response = await mediaConvertClient.send(command);
    return response.Jobs || [];
  } catch (error) {
    console.error('MediaConvert list jobs error:', error);
    throw new Error(`Failed to list jobs: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
