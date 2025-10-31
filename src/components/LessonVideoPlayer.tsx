"use client";

import { useEffect, useState } from 'react';
import { VideoPlayer } from './VideoPlayer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, Play, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface LessonVideoPlayerProps {
  lessonId: number;
  videoAssetId?: string;
  title: string;
  description?: string;
  onComplete?: () => void;
  className?: string;
}

interface VideoAsset {
  id: string;
  status: string;
  hlsPlaylistUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
}

interface LessonProgress {
  currentTime: number;
  duration: number;
  progressPercentage: number;
  isCompleted: boolean;
}

export function LessonVideoPlayer({
  lessonId,
  videoAssetId,
  title,
  description,
  onComplete,
  className
}: LessonVideoPlayerProps) {
  const [videoAsset, setVideoAsset] = useState<VideoAsset | null>(null);
  const [progress, setProgress] = useState<LessonProgress>({
    currentTime: 0,
    duration: 0,
    progressPercentage: 0,
    isCompleted: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastProgressUpdate, setLastProgressUpdate] = useState(0);

  // Fetch video asset and progress data
  useEffect(() => {
    if (!lessonId) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch lesson progress
        const progressResponse = await fetch(`/api/lessons/${lessonId}/progress`);
        if (progressResponse.ok) {
          const progressData = await progressResponse.json();
          setProgress({
            currentTime: progressData.currentTime || 0,
            duration: progressData.duration || 0,
            progressPercentage: progressData.progressPercentage || 0,
            isCompleted: progressData.isCompleted || false,
          });
        }

        // Fetch video asset if available
        if (videoAssetId) {
          const videoResponse = await fetch(`/api/admin/upload/video?id=${videoAssetId}`);
          if (videoResponse.ok) {
            const videoData = await videoResponse.json();
            setVideoAsset(videoData.videoAsset);
          }
        }

      } catch (error) {
        console.error('Failed to fetch lesson data:', error);
        setError('Failed to load lesson data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [lessonId, videoAssetId]);

  // Handle video progress updates
  const handleProgress = async (currentTime: number, duration: number) => {
    // Only update progress every 5 seconds to avoid too many API calls
    const now = Date.now();
    if (now - lastProgressUpdate < 5000) {
      return;
    }
    setLastProgressUpdate(now);

    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
    const isCompleted = progressPercentage >= 90;

    // Update local state immediately for better UX
    setProgress(prev => ({
      ...prev,
      currentTime,
      duration,
      progressPercentage,
      isCompleted: isCompleted || prev.isCompleted,
    }));

    try {
      // Update progress on server
      await fetch(`/api/lessons/${lessonId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentTime,
          duration,
          completed: isCompleted,
          watchTimeSeconds: currentTime,
        }),
      });

      // Trigger completion callback if lesson just completed
      if (isCompleted && !progress.isCompleted && onComplete) {
        onComplete();
        toast.success('Lesson completed! 🎉');
      }

    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  // Handle video completion
  const handleVideoComplete = async () => {
    try {
      await fetch(`/api/lessons/${lessonId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentTime: progress.duration,
          duration: progress.duration,
          completed: true,
        }),
      });

      setProgress(prev => ({ ...prev, isCompleted: true }));
      
      if (onComplete) {
        onComplete();
      }
      
      toast.success('Lesson completed! 🎉');
    } catch (error) {
      console.error('Failed to mark lesson complete:', error);
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2 animate-pulse" />
            <p className="text-sm text-muted-foreground">Loading lesson...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show message if video is not ready yet
  if (!videoAsset || !videoAsset.hlsPlaylistUrl) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                {title}
              </CardTitle>
              {description && (
                <CardDescription className="mt-1">{description}</CardDescription>
              )}
            </div>
            {progress.isCompleted && (
              <Badge variant="success" className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Completed
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-48 bg-muted rounded-lg">
            <AlertCircle className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground text-center">
              Video is being processed or not available yet.
              <br />
              Please check back later.
            </p>
          </div>
          
          {progress.progressPercentage > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-muted-foreground mb-1">
                <span>Progress</span>
                <span>{Math.round(progress.progressPercentage)}%</span>
              </div>
              <Progress value={progress.progressPercentage} />
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5" />
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="mt-1">{description}</CardDescription>
            )}
          </div>
          {progress.isCompleted && (
            <Badge variant="success" className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Completed
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <VideoPlayer
          src={videoAsset.hlsPlaylistUrl}
          poster={videoAsset.thumbnailUrl}
          lessonId={lessonId}
          onProgress={handleProgress}
          onComplete={handleVideoComplete}
          initialTime={progress.currentTime}
          autoPlay={false}
          className="w-full"
        />
        
        {/* Progress Information */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Lesson Progress</span>
            <span>{Math.round(progress.progressPercentage)}%</span>
          </div>
          <Progress value={progress.progressPercentage} />
          
          {progress.progressPercentage > 0 && progress.progressPercentage < 100 && (
            <p className="text-xs text-muted-foreground">
              Your progress is automatically saved. You can continue where you left off anytime.
            </p>
          )}
        </div>

        {/* Completion Message */}
        {progress.isCompleted && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Lesson Completed!</span>
            </div>
            <p className="text-xs text-green-700 mt-1">
              Great job! You can now move on to the next lesson.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}