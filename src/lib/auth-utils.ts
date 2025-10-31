import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

export async function getUser(request: NextRequest) {
  try {
    // Get session from Better Auth
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      return null;
    }

    return session.user;
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

export async function requireAuth(request: NextRequest) {
  const user = await getUser(request);
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
}