import 'server-only';

import { hash, verify } from '@node-rs/argon2';
import type { Organization, User } from '@prisma/client';
import type { DbClient } from './db';
import { AuthError } from './errors';

import { MAX_LOGIN_ATTEMPTS, LOGIN_WINDOW_SECONDS, ROLES } from './constants';

interface LoginAttemptTracker {
  attempts: number[];
}

const loginAttempts = new Map<string, LoginAttemptTracker>();

function getTracker(clientKey: string): LoginAttemptTracker {
  let tracker = loginAttempts.get(clientKey);
  if (!tracker) {
    tracker = { attempts: [] };
    loginAttempts.set(clientKey, tracker);
  }
  return tracker;
}

function pruneAttempts(tracker: LoginAttemptTracker, now: number): number[] {
  const cutoff = now - LOGIN_WINDOW_SECONDS;
  tracker.attempts = tracker.attempts.filter((t) => t >= cutoff);
  return tracker.attempts;
}

export function isRateLimited(clientKey: string, now: number = Date.now() / 1000): boolean {
  const tracker = getTracker(clientKey);
  const recent = pruneAttempts(tracker, now);
  return recent.length >= MAX_LOGIN_ATTEMPTS;
}

function recordFailure(clientKey: string, now: number): void {
  const tracker = getTracker(clientKey);
  tracker.attempts.push(now);
  pruneAttempts(tracker, now);
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, {
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
    outputLen: 32,
  });
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

export async function getUserCount(db: DbClient): Promise<number> {
  return db.user.count();
}

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'org';
}

async function uniqueSlug(db: DbClient, name: string): Promise<string> {
  const base = slugify(name);
  let candidate = base;
  let suffix = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await db.organization.findUnique({ where: { slug: candidate } })) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}

function validateCredentials(username: string, password: string): string {
  const trimmed = username.trim();
  if (!trimmed) {
    throw new AuthError('Username is required.', 400);
  }
  if (!password || password.length < 8) {
    throw new AuthError('Password must be at least 8 characters.', 400);
  }
  return trimmed;
}

/**
 * Tenant onboarding: create a new organization and its first user as the
 * organization administrator. This is the public SaaS sign-up path.
 */
export async function createOrganizationWithAdmin(
  db: DbClient,
  organizationName: string,
  username: string,
  password: string
): Promise<{ organization: Organization; user: User }> {
  const orgName = organizationName.trim();
  if (!orgName) {
    throw new AuthError('Organization name is required.', 400);
  }
  const trimmedUser = validateCredentials(username, password);

  const existing = await db.user.findUnique({ where: { username: trimmedUser } });
  if (existing) {
    throw new AuthError('Username already taken.', 409);
  }

  const slug = await uniqueSlug(db, orgName);
  const passwordHash = await hashPassword(password);

  const organization = await db.organization.create({
    data: { name: orgName, slug },
  });

  const user = await db.user.create({
    data: {
      username: trimmedUser,
      passwordHash,
      role: ROLES.ORG_ADMIN,
      organizationId: organization.id,
    },
  });

  return { organization, user };
}

/**
 * Add a member to an existing organization (used by an org admin).
 */
export async function createOrgMember(
  db: DbClient,
  organizationId: number,
  username: string,
  password: string,
  role: string = ROLES.MEMBER
): Promise<User> {
  const trimmedUser = validateCredentials(username, password);
  if (role !== ROLES.MEMBER && role !== ROLES.ORG_ADMIN) {
    throw new AuthError('Invalid role.', 400);
  }

  const existing = await db.user.findUnique({ where: { username: trimmedUser } });
  if (existing) {
    throw new AuthError('Username already taken.', 409);
  }

  return db.user.create({
    data: {
      username: trimmedUser,
      passwordHash: await hashPassword(password),
      role,
      organizationId,
    },
  });
}

export async function authenticateUser(
  db: DbClient,
  username: string,
  password: string,
  clientKey: string
): Promise<User> {
  const now = Date.now() / 1000;
  if (isRateLimited(clientKey, now)) {
    throw new AuthError('Too many failed login attempts. Try again in a few minutes.', 429);
  }

  const user = await db.user.findUnique({ where: { username: username.trim() } });
  if (!user || !(await verifyPassword(user.passwordHash, password))) {
    recordFailure(clientKey, now);
    throw new AuthError('Invalid username or password.', 401);
  }

  getTracker(clientKey).attempts = [];
  return user;
}

export async function getUserById(db: DbClient, userId: number): Promise<User | null> {
  return db.user.findUnique({ where: { id: userId } });
}

export function getClientKey(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return headers.get('x-real-ip') ?? 'unknown';
}
