import { NextResponse } from 'next/server';
import { renderTripLogCsv } from '@/lib/exports';
import { prisma } from '@/lib/db';
import { getErrorMessage } from '@/lib/errors';
import { requireOrgContext } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const { organizationId } = await requireOrgContext();
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') ?? '', 10);
    if (Number.isNaN(year)) {
      return NextResponse.json({ error: 'Invalid year.' }, { status: 400 });
    }

    const csv = await renderTripLogCsv(prisma, organizationId, year);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="mileage-log-${year}.csv"`,
      },
    });
  } catch (err) {
    const message = getErrorMessage(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
