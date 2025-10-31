import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/db';
import { userEnrollments, userProgress } from '@/db/postgres-schema';
import { eq } from 'drizzle-orm';
import { validateAdmin } from '@/lib/admin-validation';
import { authDb } from '@/lib/auth';
import { user as authUser } from '@/db/auth-postgres-schema';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const headersList = await headers();
    const validation = await validateAdmin(headersList);
    
    if (validation.error) {
      return NextResponse.json({ 
        error: validation.error,
        code: validation.status === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN'
      }, { status: validation.status });
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json({ 
        error: 'User ID is required',
        code: 'MISSING_USER_ID'
      }, { status: 400 });
    }

    const userRecord = await authDb.select({
      id: authUser.id,
      email: authUser.email,
      name: authUser.name,
      image: authUser.image,
      emailVerified: authUser.emailVerified,
      isAdmin: authUser.isAdmin,
      createdAt: authUser.createdAt,
      updatedAt: authUser.updatedAt,
      preferredLanguage: authUser.preferredLanguage,
    })
      .from(authUser)
      .where(eq(authUser.id, id))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      }, { status: 404 });
    }

    return NextResponse.json(userRecord[0], { status: 200 });
  } catch (error) {
    console.error('GET user error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const headersList = await headers();
    const validation = await validateAdmin(headersList);
    
    if (validation.error) {
      return NextResponse.json({ 
        error: validation.error,
        code: validation.status === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN'
      }, { status: validation.status });
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json({ 
        error: 'User ID is required',
        code: 'MISSING_USER_ID'
      }, { status: 400 });
    }

    const body = await request.json();
    const { name, email, is_admin } = body;

    const existingUser = await authDb.select()
      .from(authUser)
      .where(eq(authUser.id, id))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      }, { status: 404 });
    }

    if (email && email.trim() === '') {
      return NextResponse.json({ 
        error: 'Email cannot be empty',
        code: 'INVALID_EMAIL'
      }, { status: 400 });
    }

    if (email) {
      const emailExists = await authDb.select()
        .from(authUser)
        .where(eq(authUser.email, email.trim().toLowerCase()))
        .limit(1);

      if (emailExists.length > 0 && emailExists[0].id !== id) {
        return NextResponse.json({ 
          error: 'Email already in use',
          code: 'EMAIL_EXISTS'
        }, { status: 400 });
      }
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) {
      updateData.name = name ? name.trim() : null;
    }

    if (email !== undefined) {
      updateData.email = email.trim().toLowerCase();
    }

    if (is_admin !== undefined) {
      updateData.isAdmin = !!is_admin;
    }

    const updatedUser = await authDb.update(authUser)
      .set(updateData)
      .where(eq(authUser.id, id))
      .returning({
        id: authUser.id,
        email: authUser.email,
        name: authUser.name,
        image: authUser.image,
        emailVerified: authUser.emailVerified,
        isAdmin: authUser.isAdmin,
        createdAt: authUser.createdAt,
        updatedAt: authUser.updatedAt,
        preferredLanguage: authUser.preferredLanguage,
      });

    if (updatedUser.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to update user',
        code: 'UPDATE_FAILED'
      }, { status: 500 });
    }

    return NextResponse.json(updatedUser[0], { status: 200 });
  } catch (error) {
    console.error('PATCH user error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const headersList = await headers();
    const validation = await validateAdmin(headersList);
    
    if (validation.error) {
      return NextResponse.json({ 
        error: validation.error,
        code: validation.status === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN'
      }, { status: validation.status });
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json({ 
        error: 'User ID is required',
        code: 'MISSING_USER_ID'
      }, { status: 400 });
    }

    const existingUser = await authDb.select()
      .from(authUser)
      .where(eq(authUser.id, id))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      }, { status: 404 });
    }

    await db.delete(userProgress)
      .where(eq(userProgress.userId, id));

    await db.delete(userEnrollments)
      .where(eq(userEnrollments.userId, id));

    const deletedUser = await authDb.delete(authUser)
      .where(eq(authUser.id, id))
      .returning({
        id: authUser.id,
        email: authUser.email,
        name: authUser.name,
      });

    if (deletedUser.length === 0) {
      return NextResponse.json({ 
        error: 'Failed to delete user',
        code: 'DELETE_FAILED'
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'User deleted successfully',
      user: deletedUser[0]
    }, { status: 200 });
  } catch (error) {
    console.error('DELETE user error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}
