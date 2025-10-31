import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/auth-schema';
import { eq, like, or, and } from 'drizzle-orm';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const role = searchParams.get('role');

    if (isNaN(limit) || limit < 1) {
      return NextResponse.json({ 
        error: 'Invalid limit parameter',
        code: 'INVALID_LIMIT'
      }, { status: 400 });
    }

    if (isNaN(offset) || offset < 0) {
      return NextResponse.json({ 
        error: 'Invalid offset parameter',
        code: 'INVALID_OFFSET'
      }, { status: 400 });
    }

    let query = db.select({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }).from(user);

    const conditions = [];

    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          like(user.email, searchTerm),
          like(user.name, searchTerm)
        )
      );
    }

    if (role !== null && role !== undefined) {
      const isAdminValue = role === 'admin' || role === '1' || role === 'true';
      conditions.push(eq(user.isAdmin, isAdminValue));
    }

    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 }
      );
    }
    
    console.error('GET /api/admin/users error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}