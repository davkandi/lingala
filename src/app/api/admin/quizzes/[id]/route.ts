import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/db';
import { quizzes, quizQuestions } from '@/db/postgres-schema';
import { eq, asc } from 'drizzle-orm';
import { validateAdmin } from '@/lib/admin-validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const headersList = await headers();
    const validation = await validateAdmin(headersList);
    
    if (validation.error) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const { id } = await params;
    const quizId = parseInt(id);

    if (!quizId || isNaN(quizId)) {
      return NextResponse.json({ 
        error: "Valid quiz ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const quiz = await db.select()
      .from(quizzes)
      .where(eq(quizzes.id, quizId))
      .limit(1);

    if (quiz.length === 0) {
      return NextResponse.json({ 
        error: 'Quiz not found',
        code: 'QUIZ_NOT_FOUND' 
      }, { status: 404 });
    }

    const questions = await db.select()
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, quizId))
      .orderBy(asc(quizQuestions.orderIndex));

    return NextResponse.json({
      ...quiz[0],
      questions: questions
    });

  } catch (error: any) {
    console.error('GET quiz error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const headersList = await headers();
    const validation = await validateAdmin(headersList);
    
    if (validation.error) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const { id } = await params;
    const quizId = parseInt(id);

    if (!quizId || isNaN(quizId)) {
      return NextResponse.json({ 
        error: "Valid quiz ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const body = await request.json();
    const { title, description, passingScore } = body;

    const existingQuiz = await db.select()
      .from(quizzes)
      .where(eq(quizzes.id, quizId))
      .limit(1);

    if (existingQuiz.length === 0) {
      return NextResponse.json({ 
        error: 'Quiz not found',
        code: 'QUIZ_NOT_FOUND' 
      }, { status: 404 });
    }

    const updateData: any = {};

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return NextResponse.json({ 
          error: "Title must be a non-empty string",
          code: "INVALID_TITLE" 
        }, { status: 400 });
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      if (typeof description !== 'string') {
        return NextResponse.json({ 
          error: "Description must be a string",
          code: "INVALID_DESCRIPTION" 
        }, { status: 400 });
      }
      updateData.description = description.trim();
    }

    if (passingScore !== undefined) {
      if (typeof passingScore !== 'number' || passingScore < 0 || passingScore > 100) {
        return NextResponse.json({ 
          error: "Passing score must be a number between 0 and 100",
          code: "INVALID_PASSING_SCORE" 
        }, { status: 400 });
      }
      updateData.passingScore = passingScore;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ 
        error: "No valid fields provided for update",
        code: "NO_UPDATE_FIELDS" 
      }, { status: 400 });
    }

    const updatedQuiz = await db.update(quizzes)
      .set(updateData)
      .where(eq(quizzes.id, quizId))
      .returning();

    return NextResponse.json(updatedQuiz[0]);

  } catch (error: any) {
    console.error('PATCH quiz error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const headersList = await headers();
    const validation = await validateAdmin(headersList);
    
    if (validation.error) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const { id } = await params;
    const quizId = parseInt(id);

    if (!quizId || isNaN(quizId)) {
      return NextResponse.json({ 
        error: "Valid quiz ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const existingQuiz = await db.select()
      .from(quizzes)
      .where(eq(quizzes.id, quizId))
      .limit(1);

    if (existingQuiz.length === 0) {
      return NextResponse.json({ 
        error: 'Quiz not found',
        code: 'QUIZ_NOT_FOUND' 
      }, { status: 404 });
    }

    const deletedQuestions = await db.delete(quizQuestions)
      .where(eq(quizQuestions.quizId, quizId))
      .returning();

    const deletedQuiz = await db.delete(quizzes)
      .where(eq(quizzes.id, quizId))
      .returning();

    return NextResponse.json({
      message: 'Quiz deleted successfully',
      quiz: deletedQuiz[0],
      deletedQuestionsCount: deletedQuestions.length
    });

  } catch (error: any) {
    console.error('DELETE quiz error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}