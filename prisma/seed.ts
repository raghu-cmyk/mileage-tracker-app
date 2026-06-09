import { hash } from '@node-rs/argon2';
import { PrismaClient } from '@prisma/client';
import { validateRateTable } from '../src/lib/rates';

const prisma = new PrismaClient();

const PLATFORM_ADMIN_USERNAME = process.env.PLATFORM_ADMIN_USERNAME ?? 'platform-admin';
const PLATFORM_ADMIN_PASSWORD = process.env.PLATFORM_ADMIN_PASSWORD ?? 'admin12345';

const DEFAULT_CATEGORIES = [
  { code: 'business', displayName: 'Business', isDeductible: true },
  { code: 'medical', displayName: 'Medical', isDeductible: true },
  { code: 'moving', displayName: 'Moving', isDeductible: true },
  { code: 'charitable', displayName: 'Charitable', isDeductible: true },
  { code: 'personal', displayName: 'Personal', isDeductible: false },
];

const DEFAULT_RATES = [
  {
    categoryCode: 'business',
    rateCentsPerMile: 725,
    effectiveStartDate: new Date('2026-01-01'),
    effectiveEndDate: new Date('2026-12-31'),
  },
  {
    categoryCode: 'medical',
    rateCentsPerMile: 205,
    effectiveStartDate: new Date('2026-01-01'),
    effectiveEndDate: new Date('2026-12-31'),
  },
  {
    categoryCode: 'moving',
    rateCentsPerMile: 205,
    effectiveStartDate: new Date('2026-01-01'),
    effectiveEndDate: new Date('2026-12-31'),
  },
  {
    categoryCode: 'charitable',
    rateCentsPerMile: 140,
    effectiveStartDate: new Date('2026-01-01'),
    effectiveEndDate: new Date('2026-12-31'),
  },
  {
    categoryCode: 'business',
    rateCentsPerMile: 700,
    effectiveStartDate: new Date('2025-01-01'),
    effectiveEndDate: new Date('2025-12-31'),
  },
];

async function main() {
  for (const cat of DEFAULT_CATEGORIES) {
    await prisma.tripCategory.upsert({
      where: { code: cat.code },
      update: {},
      create: cat,
    });
  }

  const existingRates = await prisma.mileageRate.findMany();
  const existingKeys = new Set(
    existingRates.map(
      (r) =>
        `${r.categoryCode}|${r.effectiveStartDate.toISOString()}|${r.effectiveEndDate.toISOString()}`
    )
  );

  for (const rate of DEFAULT_RATES) {
    const key = `${rate.categoryCode}|${rate.effectiveStartDate.toISOString()}|${rate.effectiveEndDate.toISOString()}`;
    if (!existingKeys.has(key)) {
      await prisma.mileageRate.create({ data: rate });
    }
  }

  await validateRateTable(prisma);

  const existingAdmin = await prisma.user.findUnique({
    where: { username: PLATFORM_ADMIN_USERNAME },
  });
  if (!existingAdmin) {
    const passwordHash = await hash(PLATFORM_ADMIN_PASSWORD, {
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
      outputLen: 32,
    });
    await prisma.user.create({
      data: {
        username: PLATFORM_ADMIN_USERNAME,
        passwordHash,
        role: 'PLATFORM_ADMIN',
        organizationId: null,
      },
    });
    console.log(`Seed: created platform admin '${PLATFORM_ADMIN_USERNAME}'.`);
  }

  console.log('Seed completed: categories, IRS mileage rates, and platform admin.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
