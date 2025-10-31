"use client";

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  SkipBack,
  SkipForward,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  src: string; // HLS playlist URL or MP4 URL
  poster?: string; // Thumbnail image URL
  lessonId: number;
  onProgress?: (currentTime: number, duration: number) => void;
  onComplete?: () => void;
  autoPlay?: boolean;
  initialTime?: number; // Resume from this time
  className?: string;
}

interface VideoQuality {
  height: number;
  label: string;
  bandwidth: number;
}

export function VideoPlayer({
  src,
  poster,
  lessonId,
  onProgress,
  onComplete,
  autoPlay = false,
  initialTime = 0,
  className,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout>();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [qualities, setQualities] = useState<VideoQuality[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1); // -1 for auto
  const [playbackRate, setPlaybackRate] = useState(1);

  // Initialize video player
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setIsLoading(true);
    setHasError(false);

    // Check if the source is HLS
    if (src.includes('.m3u8')) {
      // HLS streaming
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 90,
        });

        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(video);

        // Handle HLS events
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
          
          // Extract quality levels
          const levels = hls.levels.map((level, index) => ({
            height: level.height,
            label: `${level.height}p`,
            bandwidth: level.bitrate,
          }));
          setQualities(levels);
          
          // Set initial time if provided
          if (initialTime > 0) {
            video.currentTime = initialTime;
          }
          
          if (autoPlay) {
            video.play().catch(console.error);
          }
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS Error:', data);
          if (data.fatal) {
            setHasError(true);
            setErrorMessage('Failed to load video. Please try refreshing the page.');
          }
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
          setCurrentQuality(data.level);
        });

      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        video.src = src;
        setIsLoading(false);
      } else {
        setHasError(true);
        setErrorMessage('HLS streaming is not supported in this browser.');
      }
    } else {
      // Regular MP4 video
      video.src = src;
      setIsLoading(false);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, autoPlay, initialTime]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      const current = video.currentTime;
      setCurrentTime(current);
      
      // Call progress callback
      if (onProgress) {
        onProgress(current, video.duration);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    
    const handleEnded = () => {
      setIsPlaying(false);
      if (onComplete) {
        onComplete();
      }
    };

    const handleError = () => {
      setHasError(true);
      setErrorMessage('Failed to load video.');
      setIsLoading(false);
    };

    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, [onProgress, onComplete]);

  // Auto-hide controls
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const resetTimeout = () => {
      clearTimeout(timeout);
      setShowControls(true);
      if (isPlaying) {
        timeout = setTimeout(() => setShowControls(false), 3000);
      }
    };

    const handleMouseMove = () => resetTimeout();
    const handleMouseLeave = () => {
      if (isPlaying) {
        setShowControls(false);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    resetTimeout();

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isPlaying]);

  // Player control functions
  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (isPlaying) {
        video.pause();
      } else {
        await video.play();
      }
    } catch (error) {
      console.error('Play error:', error);
    }
  };

  const seek = (time: number) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = time;
    }
  };

  const skipForward = () => {
    seek(Math.min(currentTime + 10, duration));
  };

  const skipBackward = () => {
    seek(Math.max(currentTime - 10, 0));
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = !video.muted;
    }
  };

  const changeVolume = (newVolume: number[]) => {
    const video = videoRef.current;
    if (video) {
      video.volume = newVolume[0];
    }
  };

  const changeQuality = (qualityIndex: string) => {
    const index = parseInt(qualityIndex);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = index;
      setCurrentQuality(index);
    }
  };

  const changePlaybackRate = (rate: string) => {
    const video = videoRef.current;
    const newRate = parseFloat(rate);
    if (video) {
      video.playbackRate = newRate;
      setPlaybackRate(newRate);
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await videoRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (hasError) {
    return (
      <Card className={cn("flex items-center justify-center h-64 bg-muted", className)}>
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("relative overflow-hidden bg-black", className)}>
      <div className="relative group">
        {/* Video Element */}
        <video
          ref={videoRef}
          className="w-full h-auto"
          poster={poster}
          preload="metadata"
          playsInline
          onClick={togglePlay}
        />

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}

        {/* Controls Overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent transition-opacity duration-300",
            showControls ? "opacity-100" : "opacity-0"
          )}
          onMouseEnter={() => setShowControls(true)}
        >
          {/* Center Play Button */}
          {!isPlaying && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                size="lg"
                variant="ghost"
                className="rounded-full bg-black/50 hover:bg-black/70 text-white"
                onClick={togglePlay}
              >
                <Play className="w-8 h-8" fill="currentColor" />
              </Button>
            </div>
          )}

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
            {/* Progress Bar */}
            <div className="group/progress">
              <Slider
                value={[currentTime]}
                max={duration}
                step={1}
                onValueChange={(value) => seek(value[0])}
                className="cursor-pointer"
              />
              <div className="flex justify-between text-xs text-white/70 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={togglePlay}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={skipBackward}
                >
                  <SkipBack className="w-4 h-4" />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={skipForward}
                >
                  <SkipForward className="w-4 h-4" />
                </Button>

                {/* Volume Control */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                    onClick={toggleMute}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </Button>
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    max={1}
                    step={0.1}
                    onValueChange={changeVolume}
                    className="w-20"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Playback Speed */}
                <Select value={playbackRate.toString()} onValueChange={changePlaybackRate}>
                  <SelectTrigger className="w-16 h-8 text-white border-white/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.5">0.5x</SelectItem>
                    <SelectItem value="0.75">0.75x</SelectItem>
                    <SelectItem value="1">1x</SelectItem>
                    <SelectItem value="1.25">1.25x</SelectItem>
                    <SelectItem value="1.5">1.5x</SelectItem>
                    <SelectItem value="2">2x</SelectItem>
                  </SelectContent>
                </Select>

                {/* Quality Selection */}
                {qualities.length > 0 && (
                  <Select value={currentQuality.toString()} onValueChange={changeQuality}>
                    <SelectTrigger className="w-20 h-8 text-white border-white/30">
                      <SelectValue placeholder="Auto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="-1">Auto</SelectItem>
                      {qualities.map((quality, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {quality.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={toggleFullscreen}
                >
                  <Maximize className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}