import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { authenticateUser, getClientKey } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { AuthError } from '@/lib/errors';
import { establishSession } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = String(body.username ?? '');
    const password = String(body.password ?? '');
    const headersList = await headers();
    const clientKey = getClientKey(headersList);

    const user = await authenticateUser(prisma, username, password, clientKey);
    await establishSession(user);

    return NextResponse.json(
      { ok: true, userId: user.id, role: user.role, organizationId: user.organizationId },
      { status: 200 }
    );
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: 'Login failed.' }, { status: 500 });
  }
}
