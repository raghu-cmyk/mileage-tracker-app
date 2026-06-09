import { NextResponse } from 'next/server';
import { createOrganizationWithAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { AuthError } from '@/lib/errors';
import { establishSession } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const organizationName = String(body.organization_name ?? body.organizationName ?? '');
    const username = String(body.username ?? '');
    const password = String(body.password ?? '');

    const { organization, user } = await createOrganizationWithAdmin(
      prisma,
      organizationName,
      username,
      password
    );
    await establishSession(user);

    return NextResponse.json(
      { ok: true, userId: user.id, organizationId: organization.id },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Registration failed.' }, { status: 500 });
  }
}
