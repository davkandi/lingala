import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name } = body;
    
    // Try to manually call signUp
    console.log('Attempting sign up with:', { email, name });
    
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });
    
    console.log('Sign up result:', result);
    
    return NextResponse.json({ 
      success: true,
      result 
    });
  } catch (error: any) {
    console.error('Debug error:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message,
      stack: error.stack,
      cause: error.cause
    }, { status: 500 });
  }
}
