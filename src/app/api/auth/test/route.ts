import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    // Try to access the auth instance
    const authInstance = auth;
    
    return NextResponse.json({ 
      success: true,
      message: 'Auth instance loaded successfully',
      hasApi: !!authInstance.api,
      hasDatabase: !!authInstance.options.database
    });
  } catch (error: any) {
    console.error('Auth test error:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
