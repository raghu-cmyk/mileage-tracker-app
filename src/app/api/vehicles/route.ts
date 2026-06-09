import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getErrorMessage } from '@/lib/errors';
import { requireOrgContext } from '@/lib/session';
import { createVehicle } from '@/lib/vehicles';

export async function POST(request: Request) {
  try {
    const { organizationId } = await requireOrgContext();
    const body = await request.json();
    const vehicle = await createVehicle(
      prisma,
      organizationId,
      String(body.display_name ?? body.displayName ?? ''),
      String(body.description ?? '')
    );
    return NextResponse.json({ ok: true, id: vehicle.id }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 400 });
  }
}
