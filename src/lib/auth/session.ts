import { auth } from './auth';
import { redirect } from 'next/navigation';

export async function getSession() {
  return await auth();
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }
  return session;
}

export async function requireRole(allowedRoles: Array<'USER' | 'MODERATOR' | 'ADMIN'>) {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.user.role)) {
    redirect('/');
  }
  return session;
}
