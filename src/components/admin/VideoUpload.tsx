"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Video, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2,
  Play,
  AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';

interface VideoUploadProps {
  lessonId: number;
  onUploadComplete?: (videoAsset: any) => void;
  maxSize?: number; // in MB
}

interface VideoAsset {
  id: string;
  filename: string;
  s3Key: string;
  size: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processingJobId?: string;
  hlsPlaylistUrl?: string;
  thumbnailUrl?: string;
}

export function VideoUpload({ lessonId, onUploadComplete, maxSize = 500 }: VideoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoAsset, setVideoAsset] = useState<VideoAsset | null>(null);
  const [processingStatus, setProcessingStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/avi', 'video/mov', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload MP4, WebM, AVI, or MOV files.');
      return;
    }

    // Validate file size
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`File too large. Maximum size is ${maxSize}MB.`);
      return;
    }

    await uploadVideo(file);
  };

  const uploadVideo = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    setVideoAsset(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('lessonId', lessonId.toString());

      const token = localStorage.getItem('admin_token');
      if (!token) {
        throw new Error('Admin authentication required');
      }

      const response = await fetch('/api/admin/upload/video', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      setVideoAsset(result.videoAsset);
      
      if (result.videoAsset.status === 'processing') {
        toast.success('Video uploaded successfully! Processing started.');
        startPollingProcessingStatus(result.videoAsset.id);
      } else if (result.videoAsset.status === 'failed') {
        toast.warning(result.warning || 'Video uploaded but processing failed.');
      }

      onUploadComplete?.(result.videoAsset);

    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Upload failed');
      toast.error('Failed to upload video');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const startPollingProcessingStatus = (videoAssetId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch(`/api/admin/upload/video?id=${videoAssetId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setProcessingStatus(data.processingJob);
          setVideoAsset(data.videoAsset);

          // Stop polling if completed or failed
          if (data.processingJob?.status === 'COMPLETE') {
            clearInterval(pollInterval);
            toast.success('Video processing completed!');
          } else if (data.processingJob?.status === 'ERROR') {
            clearInterval(pollInterval);
            toast.error('Video processing failed');
          }
        }
      } catch (error) {
        console.error('Status polling error:', error);
      }
    }, 5000); // Poll every 5 seconds

    // Stop polling after 30 minutes
    setTimeout(() => clearInterval(pollInterval), 30 * 60 * 1000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'processing':
      case 'PROGRESSING':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed':
      case 'COMPLETE':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
      case 'ERROR':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: 'Pending', variant: 'secondary' as const },
      processing: { label: 'Processing', variant: 'default' as const },
      PROGRESSING: { label: 'Processing', variant: 'default' as const },
      completed: { label: 'Complete', variant: 'success' as const },
      COMPLETE: { label: 'Complete', variant: 'success' as const },
      failed: { label: 'Failed', variant: 'destructive' as const },
      ERROR: { label: 'Failed', variant: 'destructive' as const },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || { 
      label: status, 
      variant: 'secondary' as const 
    };

    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="w-5 h-5" />
          Video Upload
        </CardTitle>
        <CardDescription>
          Upload video content for this lesson. Videos will be automatically processed for optimal streaming.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!videoAsset && (
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/avi,video/mov,video/quicktime"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
            <div className="flex flex-col items-center">
              {uploading ? (
                <>
                  <Loader2 className="w-8 h-8 text-primary mb-2 animate-spin" />
                  <p className="text-sm font-medium">Uploading video...</p>
                  <Progress value={uploadProgress} className="w-full max-w-xs mt-2" />
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Select Video File
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    MP4, WebM, AVI, MOV up to {maxSize}MB
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {videoAsset && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Video className="w-8 h-8 text-primary" />
                  <div>
                    <h4 className="font-medium">{videoAsset.filename}</h4>
                    <p className="text-sm text-muted-foreground">
                      {(videoAsset.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                    {processingStatus && (
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusIcon(processingStatus.status)}
                        <span className="text-sm">
                          {processingStatus.progress ? `${processingStatus.progress}%` : 'Processing...'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(processingStatus?.status || videoAsset.status)}
                  {videoAsset.hlsPlaylistUrl && (
                    <Button size="sm" variant="outline">
                      <Play className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                  )}
                </div>
              </div>

              {processingStatus?.progress && (
                <Progress value={processingStatus.progress} className="mt-3" />
              )}

              {processingStatus?.errorMessage && (
                <Alert variant="destructive" className="mt-3">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>{processingStatus.errorMessage}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        <div className="text-xs text-muted-foreground">
          <p>• Videos are automatically processed into multiple qualities (480p, 720p, 1080p)</p>
          <p>• HLS streaming format is generated for optimal playback</p>
          <p>• Thumbnails are automatically extracted</p>
          <p>• Processing may take several minutes depending on video length</p>
        </div>
      </CardContent>
    </Card>
  );
}