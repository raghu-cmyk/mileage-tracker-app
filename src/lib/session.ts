import 'server-only';

import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import type { Organization, User } from '@prisma/client';
import { ROLES, SESSION_TTL_SECONDS } from './constants';
import { prisma } from './db';
import { AuthError } from './errors';
import { sessionOptions, type SessionData } from './session-config';

export { sessionOptions, type SessionData } from './session-config';

export interface OrgContext {
  user: User;
  organizationId: number;
  organization: Organization;
}

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

export async function establishSession(user: Pick<User, 'id' | 'role' | 'organizationId'>): Promise<void> {
  const session = await getSession();
  session.userId = user.id;
  session.role = user.role;
  session.organizationId = user.organizationId ?? null;
  session.expiresAt = Date.now() / 1000 + SESSION_TTL_SECONDS;
  await session.save();
}

export async function clearSession(): Promise<void> {
  const session = await getSession();
  session.destroy();
}

export async function getCurrentUserId(): Promise<number | null> {
  const session = await getSession();
  if (session.userId == null || session.expiresAt == null) {
    return null;
  }
  if (Date.now() / 1000 > session.expiresAt) {
    await session.destroy();
    return null;
  }
  return session.userId;
}

export async function requireAuthenticatedUser(): Promise<User> {
  const userId = await getCurrentUserId();
  if (userId == null) {
    throw new AuthError('Authentication required.', 401);
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    await clearSession();
    throw new AuthError('Authentication required.', 401);
  }
  return user;
}

/**
 * Resolve the tenant context for a normal application request. Enforces that the
 * caller belongs to an active organization. Platform admins (no organization)
 * are rejected here — they belong in the /admin portal.
 */
export async function requireOrgContext(): Promise<OrgContext> {
  const user = await requireAuthenticatedUser();
  if (user.organizationId == null) {
    throw new AuthError('No organization is associated with this account.', 403);
  }
  const organization = await prisma.organization.findUnique({
    where: { id: user.organizationId },
  });
  if (!organization) {
    await clearSession();
    throw new AuthError('Organization not found.', 403);
  }
  if (!organization.isActive) {
    throw new AuthError('This organization has been suspended. Contact your administrator.', 403);
  }
  return { user, organizationId: organization.id, organization };
}

export async function requirePlatformAdmin(): Promise<User> {
  const user = await requireAuthenticatedUser();
  if (user.role !== ROLES.PLATFORM_ADMIN) {
    throw new AuthError('Platform administrator access required.', 403);
  }
  return user;
}

export function isPlatformAdmin(user: Pick<User, 'role'>): boolean {
  return user.role === ROLES.PLATFORM_ADMIN;
}

export function isOrgAdmin(user: Pick<User, 'role'>): boolean {
  return user.role === ROLES.ORG_ADMIN;
}
