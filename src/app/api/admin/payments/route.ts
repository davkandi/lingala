import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { db } from '@/db';
import { payments } from '@/db/postgres-schema';
import { desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // 1. Admin authentication check
    const admin = await requireAdmin(request);

    // 2. Fetch payments
    const allPayments = await db.select()
      .from(payments)
      .orderBy(desc(payments.createdAt))
      .limit(100); // Limit to most recent 100 payments

    return NextResponse.json({
      payments: allPayments,
      total: allPayments.length,
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Admin authentication required') {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 }
      );
    }
    
    console.error('GET admin payments error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}