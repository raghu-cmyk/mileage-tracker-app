import 'server-only';

import type { DbClient } from './db';

export interface OrganizationStats {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: Date;
  userCount: number;
  vehicleCount: number;
  tripCount: number;
}

export interface PlatformStats {
  organizationCount: number;
  activeOrganizationCount: number;
  userCount: number;
  tripCount: number;
}

export async function getPlatformStats(db: DbClient): Promise<PlatformStats> {
  const [organizationCount, activeOrganizationCount, userCount, tripCount] = await Promise.all([
    db.organization.count(),
    db.organization.count({ where: { isActive: true } }),
    db.user.count({ where: { organizationId: { not: null } } }),
    db.trip.count(),
  ]);
  return { organizationCount, activeOrganizationCount, userCount, tripCount };
}

export async function listOrganizationsWithStats(db: DbClient): Promise<OrganizationStats[]> {
  const organizations = await db.organization.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { users: true, vehicles: true, trips: true } },
    },
  });

  return organizations.map((org) => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    isActive: org.isActive,
    createdAt: org.createdAt,
    userCount: org._count.users,
    vehicleCount: org._count.vehicles,
    tripCount: org._count.trips,
  }));
}

export async function getOrganizationDetail(db: DbClient, organizationId: number) {
  return db.organization.findUnique({
    where: { id: organizationId },
    include: {
      users: { orderBy: { createdAt: 'asc' } },
      _count: { select: { users: true, vehicles: true, trips: true } },
    },
  });
}

export async function setOrganizationActive(
  db: DbClient,
  organizationId: number,
  isActive: boolean
): Promise<void> {
  await db.organization.update({
    where: { id: organizationId },
    data: { isActive },
  });
}
