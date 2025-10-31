import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/db';
import { lessons } from '@/db/postgres-schema';
import { eq } from 'drizzle-orm';
import { validateAdmin } from '@/lib/admin-validation';

export async function PATCH(request: NextRequest) {
  try {
    const headersList = await headers();
    const adminValidation = await validateAdmin(headersList);
    
    if (adminValidation.error) {
      return NextResponse.json(
        { error: adminValidation.error },
        { status: adminValidation.status }
      );
    }

    const body = await request.json();
    const { updates } = body;

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json(
        { 
          error: 'Updates must be provided as an array',
          code: 'INVALID_FORMAT'
        },
        { status: 400 }
      );
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { 
          error: 'Updates array cannot be empty',
          code: 'EMPTY_ARRAY'
        },
        { status: 400 }
      );
    }

    for (const update of updates) {
      if (!update.id || typeof update.id !== 'number') {
        return NextResponse.json(
          { 
            error: 'Each update must have a valid numeric id',
            code: 'INVALID_ID'
          },
          { status: 400 }
        );
      }

      if (typeof update.orderIndex !== 'number') {
        return NextResponse.json(
          { 
            error: 'Each update must have a valid numeric orderIndex',
            code: 'INVALID_ORDER_INDEX'
          },
          { status: 400 }
        );
      }
    }

    let updatedCount = 0;

    for (const update of updates) {
      const result = await db.update(lessons)
        .set({ orderIndex: update.orderIndex })
        .where(eq(lessons.id, update.id))
        .returning();

      if (result.length > 0) {
        updatedCount++;
      }
    }

    return NextResponse.json(
      {
        message: 'Lessons reordered successfully',
        updatedCount
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}