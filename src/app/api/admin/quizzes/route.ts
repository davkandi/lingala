import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/db';
import { lessons, quizzes } from '@/db/postgres-schema';
import { eq } from 'drizzle-orm';
import { validateAdmin } from '@/lib/admin-validation';

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const adminValidation = await validateAdmin(headersList);
    
    if (adminValidation.error) {
      return NextResponse.json(
        { error: adminValidation.error, code: adminValidation.status === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN' },
        { status: adminValidation.status }
      );
    }

    const body = await request.json();
    const { lessonId, title, description, passingScore } = body;

    // Validate required fields
    if (!lessonId) {
      return NextResponse.json(
        { error: 'Lesson ID is required', code: 'MISSING_LESSON_ID' },
        { status: 400 }
      );
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required and must be a non-empty string', code: 'MISSING_TITLE' },
        { status: 400 }
      );
    }

    if (passingScore === undefined || passingScore === null) {
      return NextResponse.json(
        { error: 'Passing score is required', code: 'MISSING_PASSING_SCORE' },
        { status: 400 }
      );
    }

    // Validate passingScore is a positive number
    const parsedPassingScore = parseInt(passingScore);
    if (isNaN(parsedPassingScore) || parsedPassingScore <= 0) {
      return NextResponse.json(
        { error: 'Passing score must be a positive number', code: 'INVALID_PASSING_SCORE' },
        { status: 400 }
      );
    }

    // Verify lesson exists
    const lesson = await db.select()
      .from(lessons)
      .where(eq(lessons.id, parseInt(lessonId)))
      .limit(1);

    if (lesson.length === 0) {
      return NextResponse.json(
        { error: 'Lesson not found', code: 'LESSON_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Insert quiz
    const newQuiz = await db.insert(quizzes)
      .values({
        lessonId: parseInt(lessonId),
        title: title.trim(),
        description: description ? description.trim() : null,
        passingScore: parsedPassingScore,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newQuiz[0], { status: 201 });

  } catch (error) {
    console.error('POST /api/admin/quizzes error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}