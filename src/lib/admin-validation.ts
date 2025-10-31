import { auth } from '@/lib/auth';

export async function validateAdmin(headersList: Headers) {
  const session = await auth.api.getSession({ headers: headersList });
  if (!session?.user) {
    return { error: 'Unauthorized', status: 401 };
  }
  
  // Check if user has admin privileges from better-auth session
  // @ts-ignore - isAdmin is a custom field added to better-auth user
  if (!session.user.isAdmin) {
    return { error: 'Forbidden - Admin access required', status: 403 };
  }
  
  return { user: session.user, status: 200 };
}
