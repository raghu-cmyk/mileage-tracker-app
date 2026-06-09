'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { authenticateUser, createOrganizationWithAdmin, getClientKey } from '@/lib/auth';
import { ROLES } from '@/lib/constants';
import { prisma } from '@/lib/db';
import { AuthError, getErrorMessage } from '@/lib/errors';
import { establishSession } from '@/lib/session';

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function registerAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const organizationName = String(formData.get('organization_name') ?? '');
    const username = String(formData.get('username') ?? '');
    const password = String(formData.get('password') ?? '');
    const confirm = String(formData.get('confirm_password') ?? '');

    if (password !== confirm) {
      return { ok: false, error: 'Passwords do not match.' };
    }

    const { user } = await createOrganizationWithAdmin(
      prisma,
      organizationName,
      username,
      password
    );
    await establishSession(user);
    redirect('/dashboard');
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message };
    }
    if (typeof err === 'object' && err !== null && 'digest' in err) {
      throw err;
    }
    return { ok: false, error: getErrorMessage(err) };
  }
}

export async function loginAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  let destination = '/dashboard';
  try {
    const username = String(formData.get('username') ?? '');
    const password = String(formData.get('password') ?? '');
    const headersList = await headers();
    const clientKey = getClientKey(headersList);

    const user = await authenticateUser(prisma, username, password, clientKey);
    await establishSession(user);
    destination = user.role === ROLES.PLATFORM_ADMIN ? '/admin' : '/dashboard';
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message };
    }
    if (typeof err === 'object' && err !== null && 'digest' in err) {
      throw err;
    }
    return { ok: false, error: getErrorMessage(err) };
  }
  redirect(destination);
}

// Public SaaS sign-up is always open: anyone can create a new organization.
export async function getRegistrationOpen(): Promise<boolean> {
  return true;
}
