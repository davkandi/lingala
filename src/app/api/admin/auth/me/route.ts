import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request);
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        avatarUrl: admin.avatarUrl,
        lastLoginAt: admin.lastLoginAt,
        createdAt: admin.createdAt,
      }
    });

  } catch (error) {
    console.error('Admin me error:', error);
    return NextResponse.json(
      { error: 'Failed to get admin info' },
      { status: 500 }
    );
  }
}