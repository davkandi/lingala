import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/db';
import { lessonMaterials } from '@/db/postgres-schema';
import { eq } from 'drizzle-orm';
import { validateAdmin } from '@/lib/admin-validation';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const headersList = await headers();
    const validation = await validateAdmin(headersList);
    
    if (validation.error) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const id = params.id;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID' 
      }, { status: 400 });
    }

    const materialId = parseInt(id);

    const existingMaterial = await db.select()
      .from(lessonMaterials)
      .where(eq(lessonMaterials.id, materialId))
      .limit(1);

    if (existingMaterial.length === 0) {
      return NextResponse.json({ 
        error: 'Lesson material not found',
        code: 'MATERIAL_NOT_FOUND' 
      }, { status: 404 });
    }

    const deleted = await db.delete(lessonMaterials)
      .where(eq(lessonMaterials.id, materialId))
      .returning();

    return NextResponse.json({
      message: 'Lesson material deleted successfully',
      material: deleted[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}