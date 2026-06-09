'use server';

import { revalidatePath } from 'next/cache';
import { setOrganizationActive } from '@/lib/admin';
import { prisma } from '@/lib/db';
import { requirePlatformAdmin } from '@/lib/session';

export async function setOrgActiveAction(organizationId: number, isActive: boolean): Promise<void> {
  await requirePlatformAdmin();
  await setOrganizationActive(prisma, organizationId, isActive);
  revalidatePath('/admin');
  revalidatePath(`/admin/organizations/${organizationId}`);
}
