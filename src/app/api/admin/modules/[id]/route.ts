import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { modules, lessons, lessonMaterials } from '@/db/postgres-schema';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '@/lib/admin-auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin(request);

    const id = params.id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid module ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const moduleId = parseInt(id);
    
    const existingModule = await db
      .select()
      .from(modules)
      .where(eq(modules.id, moduleId))
      .limit(1);

    if (existingModule.length === 0) {
      return NextResponse.json(
        { error: 'Module not found', code: 'MODULE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { title, description, orderIndex } = body;

    const updates: any = {};
    
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return NextResponse.json(
          { error: 'Title must be a non-empty string', code: 'INVALID_TITLE' },
          { status: 400 }
        );
      }
      updates.title = title.trim();
    }

    if (description !== undefined) {
      if (typeof description !== 'string') {
        return NextResponse.json(
          { error: 'Description must be a string', code: 'INVALID_DESCRIPTION' },
          { status: 400 }
        );
      }
      updates.description = description.trim();
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

    const updatedModule = await db
      .update(modules)
      .set(updates)
      .where(eq(modules.id, moduleId))
      .returning();

    return NextResponse.json(updatedModule[0], { status: 200 });

  } catch (error: any) {
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 }
      );
    }
    
    console.error('PATCH module error:', error);
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
    const admin = await requireAdmin(request);

    const id = params.id;
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid module ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const moduleId = parseInt(id);
    
    const existingModule = await db
      .select()
      .from(modules)
      .where(eq(modules.id, moduleId))
      .limit(1);

    if (existingModule.length === 0) {
      return NextResponse.json(
        { error: 'Module not found', code: 'MODULE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const moduleLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.moduleId, moduleId));

    let deletedMaterialsCount = 0;
    for (const lesson of moduleLessons) {
      const deletedMaterials = await db
        .delete(lessonMaterials)
        .where(eq(lessonMaterials.lessonId, lesson.id))
        .returning();
      
      deletedMaterialsCount += deletedMaterials.length;
    }

    const deletedLessons = await db
      .delete(lessons)
      .where(eq(lessons.moduleId, moduleId))
      .returning();

    const deletedModule = await db
      .delete(modules)
      .where(eq(modules.id, moduleId))
      .returning();

    return NextResponse.json({
      message: 'Module and related content deleted successfully',
      deleted: {
        modules: deletedModule.length,
        lessons: deletedLessons.length,
        materials: deletedMaterialsCount
      },
      module: deletedModule[0]
    }, { status: 200 });

  } catch (error: any) {
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 }
      );
    }
    
    console.error('DELETE module error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}