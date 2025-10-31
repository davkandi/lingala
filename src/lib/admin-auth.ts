import bcrypt from 'bcryptjs';
import { db } from '@/db';
import { admins, adminSessions } from '@/db/postgres-schema';
import { eq, and, gte } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import crypto from 'crypto';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
}

export interface AdminSession {
  id: string;
  adminId: string;
  token: string;
  expiresAt: Date;
  admin?: AdminUser;
}

// Hash password for admin registration
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

// Verify password for admin login
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate secure session token
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Create admin user
export async function createAdmin(data: {
  email: string;
  name: string;
  password: string;
  role?: string;
}): Promise<AdminUser> {
  const passwordHash = await hashPassword(data.password);
  
  const result = await db.insert(admins).values({
    email: data.email,
    name: data.name,
    passwordHash,
    role: data.role || 'admin',
  }).returning();

  const admin = result[0];
  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role!,
    avatarUrl: admin.avatarUrl || undefined,
    isActive: admin.isActive!,
    lastLoginAt: admin.lastLoginAt || undefined,
    createdAt: admin.createdAt,
  };
}

// Authenticate admin with email and password
export async function authenticateAdmin(email: string, password: string): Promise<AdminUser | null> {
  const result = await db.select()
    .from(admins)
    .where(and(
      eq(admins.email, email),
      eq(admins.isActive, true)
    ))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const admin = result[0];
  const isValid = await verifyPassword(password, admin.passwordHash);
  
  if (!isValid) {
    return null;
  }

  // Update last login time
  await db.update(admins)
    .set({ lastLoginAt: new Date() })
    .where(eq(admins.id, admin.id));

  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role!,
    avatarUrl: admin.avatarUrl || undefined,
    isActive: admin.isActive!,
    lastLoginAt: new Date(),
    createdAt: admin.createdAt,
  };
}

// Create admin session
export async function createAdminSession(
  adminId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<string> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await db.insert(adminSessions).values({
    adminId,
    token,
    expiresAt,
    ipAddress,
    userAgent,
  });

  return token;
}

// Get admin session by token
export async function getAdminSession(token: string): Promise<AdminSession | null> {
  const result = await db.select({
    id: adminSessions.id,
    adminId: adminSessions.adminId,
    token: adminSessions.token,
    expiresAt: adminSessions.expiresAt,
    admin: {
      id: admins.id,
      email: admins.email,
      name: admins.name,
      role: admins.role,
      avatarUrl: admins.avatarUrl,
      isActive: admins.isActive,
      lastLoginAt: admins.lastLoginAt,
      createdAt: admins.createdAt,
    }
  })
  .from(adminSessions)
  .innerJoin(admins, eq(adminSessions.adminId, admins.id))
  .where(and(
    eq(adminSessions.token, token),
    gte(adminSessions.expiresAt, new Date()),
    eq(admins.isActive, true)
  ))
  .limit(1);

  if (result.length === 0) {
    return null;
  }

  const session = result[0];
  return {
    id: session.id,
    adminId: session.adminId,
    token: session.token,
    expiresAt: session.expiresAt,
    admin: {
      id: session.admin.id,
      email: session.admin.email,
      name: session.admin.name,
      role: session.admin.role!,
      avatarUrl: session.admin.avatarUrl || undefined,
      isActive: session.admin.isActive!,
      lastLoginAt: session.admin.lastLoginAt || undefined,
      createdAt: session.admin.createdAt,
    }
  };
}

// Delete admin session (logout)
export async function deleteAdminSession(token: string): Promise<void> {
  await db.delete(adminSessions)
    .where(eq(adminSessions.token, token));
}

// Get admin from request headers
export async function getAdminFromRequest(request: NextRequest): Promise<AdminUser | null> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const session = await getAdminSession(token);
  
  return session?.admin || null;
}

// Middleware helper for admin authentication
export async function requireAdmin(request: NextRequest): Promise<AdminUser> {
  const admin = await getAdminFromRequest(request);
  
  if (!admin) {
    throw new Error('Admin authentication required');
  }
  
  return admin;
}

// Check if admin has specific role
export function hasRole(admin: AdminUser, role: string): boolean {
  return admin.role === role || admin.role === 'super_admin';
}