"use client";

import { VideoPlayer } from "@/components/VideoPlayer";
import { LessonVideoPlayer } from "@/components/LessonVideoPlayer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestVideoPage() {
  // Test video URLs - you can replace these with your own test videos
  const testVideos = [
    {
      title: "Sample MP4 Video",
      src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      poster: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg"
    },
    {
      title: "Sample HLS Stream",
      src: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
      poster: "https://mango.blender.org/wp-content/uploads/2013/05/01_thom_celia_bridge.jpg"
    }
  ];

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-4">Video Player Testing</h1>
        <p className="text-muted-foreground">
          Test the video player components with different video sources.
        </p>
      </div>

      {testVideos.map((video, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle>{video.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <VideoPlayer
              src={video.src}
              poster={video.poster}
              lessonId={1}
              onProgress={(currentTime, duration) => {
                console.log(`Progress: ${currentTime}s / ${duration}s`);
              }}
              onComplete={() => {
                console.log('Video completed!');
              }}
              className="w-full max-w-4xl"
            />
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle>Lesson Video Player Component</CardTitle>
        </CardHeader>
        <CardContent>
          <LessonVideoPlayer
            lessonId={4}
            title="Test Lesson: Welcome"
            description="This is a test lesson to demonstrate the video player functionality."
            onComplete={() => {
              console.log('Lesson completed!');
            }}
            className="w-full max-w-4xl"
          />
        </CardContent>
      </Card>
    </div>
  );
}