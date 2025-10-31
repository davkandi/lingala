import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/db';
import { quizzes, quizQuestions } from '@/db/postgres-schema';
import { eq, desc } from 'drizzle-orm';
import { validateAdmin } from '@/lib/admin-validation';

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const adminCheck = await validateAdmin(headersList);
    
    if (adminCheck.error) {
      return NextResponse.json(
        { error: adminCheck.error, code: adminCheck.status === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN' },
        { status: adminCheck.status }
      );
    }

    const body = await request.json();
    const { quizId, questionText, questionType, correctAnswer, options, orderIndex } = body;

    // Validate required fields
    if (!quizId) {
      return NextResponse.json(
        { error: 'Quiz ID is required', code: 'MISSING_QUIZ_ID' },
        { status: 400 }
      );
    }

    if (!questionText || typeof questionText !== 'string' || questionText.trim() === '') {
      return NextResponse.json(
        { error: 'Question text is required', code: 'MISSING_QUESTION_TEXT' },
        { status: 400 }
      );
    }

    if (!questionType || typeof questionType !== 'string' || questionType.trim() === '') {
      return NextResponse.json(
        { error: 'Question type is required', code: 'MISSING_QUESTION_TYPE' },
        { status: 400 }
      );
    }

    if (!correctAnswer || typeof correctAnswer !== 'string' || correctAnswer.trim() === '') {
      return NextResponse.json(
        { error: 'Correct answer is required', code: 'MISSING_CORRECT_ANSWER' },
        { status: 400 }
      );
    }

    // Validate quizId is a valid integer
    const parsedQuizId = parseInt(quizId.toString());
    if (isNaN(parsedQuizId)) {
      return NextResponse.json(
        { error: 'Valid quiz ID is required', code: 'INVALID_QUIZ_ID' },
        { status: 400 }
      );
    }

    // Verify quiz exists
    const quiz = await db.select()
      .from(quizzes)
      .where(eq(quizzes.id, parsedQuizId))
      .limit(1);

    if (quiz.length === 0) {
      return NextResponse.json(
        { error: 'Quiz not found', code: 'QUIZ_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Handle options - convert to JSON string if object
    let optionsValue: string | null = null;
    if (options !== undefined && options !== null) {
      if (typeof options === 'string') {
        optionsValue = options;
      } else if (typeof options === 'object') {
        try {
          optionsValue = JSON.stringify(options);
        } catch (e) {
          return NextResponse.json(
            { error: 'Invalid options format', code: 'INVALID_OPTIONS' },
            { status: 400 }
          );
        }
      }
    }

    // Determine order index
    let finalOrderIndex = orderIndex;
    if (finalOrderIndex === undefined || finalOrderIndex === null) {
      // Get max order_index for this quiz
      const maxOrderQuery = await db.select()
        .from(quizQuestions)
        .where(eq(quizQuestions.quizId, parsedQuizId))
        .orderBy(desc(quizQuestions.orderIndex))
        .limit(1);

      if (maxOrderQuery.length > 0 && maxOrderQuery[0].orderIndex !== null) {
        finalOrderIndex = maxOrderQuery[0].orderIndex + 1;
      } else {
        finalOrderIndex = 1;
      }
    }

    // Insert new quiz question
    const newQuestion = await db.insert(quizQuestions)
      .values({
        quizId: parsedQuizId,
        questionText: questionText.trim(),
        questionType: questionType.trim(),
        correctAnswer: correctAnswer.trim(),
        options: optionsValue,
        orderIndex: finalOrderIndex,
        createdAt: new Date().toISOString()
      })
      .returning();

    return NextResponse.json(newQuestion[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}