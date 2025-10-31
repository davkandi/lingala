import { NextRequest, NextResponse } from 'next/server';
import { deleteAdminSession } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 400 }
      );
    }

    const token = authHeader.substring(7);
    await deleteAdminSession(token);

    return NextResponse.json({ message: 'Logged out successfully' });

  } catch (error) {
    console.error('Admin logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}