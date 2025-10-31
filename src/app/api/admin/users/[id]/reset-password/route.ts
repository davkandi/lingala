import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/db';
import { user, account } from '@/db/postgres-schema';
import { eq, and } from 'drizzle-orm';
import { validateAdmin } from '@/lib/admin-validation';
import bcrypt from 'bcrypt';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const headersList = await headers();
    const validation = await validateAdmin(headersList);
    
    if (validation.error) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      );
    }

    const { id: userId } = await params;
    if (!userId) {
      return NextResponse.json(
        { error: 'Valid user ID is required', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { newPassword } = body;

    if (!newPassword) {
      return NextResponse.json(
        { error: 'New password is required', code: 'MISSING_PASSWORD' },
        { status: 400 }
      );
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long', code: 'PASSWORD_TOO_SHORT' },
        { status: 400 }
      );
    }

    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db
      .update(user)
      .set({
        password: hashedPassword,
        updatedAt: new Date().toISOString()
      })
      .where(eq(user.id, userId));

    await db
      .update(account)
      .set({
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(and(eq(account.userId, userId), eq(account.providerId, 'credential')));

    return NextResponse.json(
      { message: 'Password reset successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}