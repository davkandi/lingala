import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userProgress, lessons } from '@/db/postgres-schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/auth-utils';

// Update lesson progress
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const lessonId = parseInt(params.id);
    if (isNaN(lessonId)) {
      return NextResponse.json({ error: 'Invalid lesson ID' }, { status: 400 });
    }

    const body = await request.json();
    const { 
      currentTime, 
      duration, 
      completed = false,
      watchTimeSeconds = 0 
    } = body;

    if (typeof currentTime !== 'number' || typeof duration !== 'number') {
      return NextResponse.json({ 
        error: 'currentTime and duration are required' 
      }, { status: 400 });
    }

    // Check if lesson exists
    const lesson = await db.select()
      .from(lessons)
      .where(eq(lessons.id, lessonId))
      .limit(1);

    if (lesson.length === 0) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    // Calculate progress percentage
    const progressPercentage = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;
    
    // Consider lesson completed if watched 90% or explicitly marked complete
    const isCompleted = completed || progressPercentage >= 90;

    // Check if progress record exists
    const existingProgress = await db.select()
      .from(userProgress)
      .where(and(
        eq(userProgress.lessonId, lessonId),
        eq(userProgress.userId, user.id)
      ))
      .limit(1);

    if (existingProgress.length > 0) {
      // Update existing progress
      const result = await db.update(userProgress)
        .set({
          currentTime,
          duration,
          progressPercentage: Math.round(progressPercentage),
          isCompleted,
          watchTimeSeconds: watchTimeSeconds,
          updatedAt: new Date(),
          completedAt: isCompleted ? new Date() : existingProgress[0].completedAt,
        })
        .where(and(
          eq(userProgress.lessonId, lessonId),
          eq(userProgress.userId, user.id)
        ))
        .returning();

      return NextResponse.json({
        success: true,
        progress: result[0],
      });
    } else {
      // Create new progress record
      const result = await db.insert(userProgress)
        .values({
          lessonId,
          userId: user.id,
          currentTime,
          duration,
          progressPercentage: Math.round(progressPercentage),
          isCompleted,
          watchTimeSeconds,
          completedAt: isCompleted ? new Date() : null,
        })
        .returning();

      return NextResponse.json({
        success: true,
        progress: result[0],
      });
    }

  } catch (error) {
    console.error('Progress update error:', error);
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}

// Get lesson progress
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const lessonId = parseInt(params.id);
    if (isNaN(lessonId)) {
      return NextResponse.json({ error: 'Invalid lesson ID' }, { status: 400 });
    }

    // Get lesson progress
    const progress = await db.select()
      .from(userProgress)
      .where(and(
        eq(userProgress.lessonId, lessonId),
        eq(userProgress.userId, user.id)
      ))
      .limit(1);

    if (progress.length === 0) {
      return NextResponse.json({
        progress: null,
        currentTime: 0,
        duration: 0,
        progressPercentage: 0,
        isCompleted: false,
      });
    }

    return NextResponse.json({
      progress: progress[0],
      currentTime: progress[0].currentTime || 0,
      duration: progress[0].duration || 0,
      progressPercentage: progress[0].progressPercentage || 0,
      isCompleted: progress[0].isCompleted || false,
    });

  } catch (error) {
    console.error('Progress fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    );
  }
}