import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/db';
import { quizQuestions } from '@/db/postgres-schema';
import { eq } from 'drizzle-orm';
import { validateAdmin } from '@/lib/admin-validation';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const headersList = await headers();
    const adminValidation = await validateAdmin(headersList);
    
    if (adminValidation.error) {
      return NextResponse.json(
        { error: adminValidation.error },
        { status: adminValidation.status }
      );
    }

    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid question ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { questionText, questionType, correctAnswer, options, orderIndex } = body;

    const existingQuestion = await db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.id, parseInt(id)))
      .limit(1);

    if (existingQuestion.length === 0) {
      return NextResponse.json(
        { error: 'Question not found', code: 'QUESTION_NOT_FOUND' },
        { status: 404 }
      );
    }

    const updates: any = {};

    if (questionText !== undefined) {
      if (typeof questionText !== 'string' || questionText.trim() === '') {
        return NextResponse.json(
          { error: 'Question text must be a non-empty string', code: 'INVALID_QUESTION_TEXT' },
          { status: 400 }
        );
      }
      updates.questionText = questionText.trim();
    }

    if (questionType !== undefined) {
      if (typeof questionType !== 'string' || questionType.trim() === '') {
        return NextResponse.json(
          { error: 'Question type must be a non-empty string', code: 'INVALID_QUESTION_TYPE' },
          { status: 400 }
        );
      }
      updates.questionType = questionType.trim();
    }

    if (correctAnswer !== undefined) {
      if (typeof correctAnswer !== 'string' || correctAnswer.trim() === '') {
        return NextResponse.json(
          { error: 'Correct answer must be a non-empty string', code: 'INVALID_CORRECT_ANSWER' },
          { status: 400 }
        );
      }
      updates.correctAnswer = correctAnswer.trim();
    }

    if (options !== undefined) {
      if (typeof options === 'object' && options !== null) {
        updates.options = JSON.stringify(options);
      } else if (typeof options === 'string') {
        updates.options = options;
      } else {
        return NextResponse.json(
          { error: 'Options must be an object or string', code: 'INVALID_OPTIONS' },
          { status: 400 }
        );
      }
    }

    if (orderIndex !== undefined) {
      if (typeof orderIndex !== 'number' || orderIndex < 0) {
        return NextResponse.json(
          { error: 'Order index must be a non-negative number', code: 'INVALID_ORDER_INDEX' },
          { status: 400 }
        );
      }
      updates.orderIndex = orderIndex;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields provided for update', code: 'NO_UPDATE_FIELDS' },
        { status: 400 }
      );
    }

    const updatedQuestion = await db
      .update(quizQuestions)
      .set(updates)
      .where(eq(quizQuestions.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedQuestion[0], { status: 200 });
  } catch (error: any) {
    console.error('PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const headersList = await headers();
    const adminValidation = await validateAdmin(headersList);
    
    if (adminValidation.error) {
      return NextResponse.json(
        { error: adminValidation.error },
        { status: adminValidation.status }
      );
    }

    const { id } = params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid question ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const existingQuestion = await db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.id, parseInt(id)))
      .limit(1);

    if (existingQuestion.length === 0) {
      return NextResponse.json(
        { error: 'Question not found', code: 'QUESTION_NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(quizQuestions)
      .where(eq(quizQuestions.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Question deleted successfully',
        deleted: deleted[0]
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}