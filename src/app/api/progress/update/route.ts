import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/db';
import { lessons, userProgress } from '@/db/postgres-schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication check
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const { lessonId, status, positionSeconds = 0 } = body;

    // Validate required fields
    if (!lessonId || typeof lessonId !== 'number') {
      return NextResponse.json(
        { error: 'Valid lessonId is required', code: 'MISSING_LESSON_ID' },
        { status: 400 }
      );
    }

    if (!status || typeof status !== 'string') {
      return NextResponse.json(
        { error: 'Status is required', code: 'MISSING_STATUS' },
        { status: 400 }
      );
    }

    // Validate status value
    if (status !== 'started' && status !== 'completed') {
      return NextResponse.json(
        { 
          error: 'Status must be either "started" or "completed"', 
          code: 'INVALID_STATUS' 
        },
        { status: 400 }
      );
    }

    // Validate positionSeconds
    if (typeof positionSeconds !== 'number') {
      return NextResponse.json(
        { error: 'positionSeconds must be a number', code: 'INVALID_POSITION' },
        { status: 400 }
      );
    }

    // 3. Verify lesson exists
    const lesson = await db.select()
      .from(lessons)
      .where(eq(lessons.id, lessonId))
      .limit(1);

    if (lesson.length === 0) {
      return NextResponse.json(
        { error: 'Lesson not found', code: 'LESSON_NOT_FOUND' },
        { status: 404 }
      );
    }

    // 4. Check if progress record exists
    const existingProgress = await db.select()
      .from(userProgress)
      .where(
        and(
          eq(userProgress.userId, session.user.id),
          eq(userProgress.lessonId, lessonId)
        )
      )
      .limit(1);

    const now = new Date().toISOString();
    const completed = status === 'completed';
    const completedAt = completed ? now : null;

    let progressRecord;

    if (existingProgress.length > 0) {
      // 5. UPDATE existing progress
      const updated = await db.update(userProgress)
        .set({
          lastPositionSeconds: positionSeconds,
          completed,
          completedAt,
          updatedAt: now
        })
        .where(
          and(
            eq(userProgress.userId, session.user.id),
            eq(userProgress.lessonId, lessonId)
          )
        )
        .returning();

      progressRecord = updated[0];
    } else {
      // 6. INSERT new progress record
      const inserted = await db.insert(userProgress)
        .values({
          userId: session.user.id,
          lessonId,
          lastPositionSeconds: positionSeconds,
          completed,
          completedAt,
          createdAt: now,
          updatedAt: now
        })
        .returning();

      progressRecord = inserted[0];
    }

    // 7. Return the progress record
    return NextResponse.json(progressRecord, { status: 200 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}