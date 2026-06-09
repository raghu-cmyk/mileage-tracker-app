import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createTripAction } from '@/app/actions/data';
import { PageHeader } from '@/components/PageHeader';
import { TripForm } from '@/components/TripForm';
import { prisma } from '@/lib/db';
import { requireOrgContext } from '@/lib/session';
import { listCategories } from '@/lib/trips';
import { listVehicles } from '@/lib/vehicles';

export default async function NewTripPage() {
  const { organizationId } = await requireOrgContext();
  const [categories, vehicles] = await Promise.all([
    listCategories(prisma),
    listVehicles(prisma, organizationId),
  ]);

  if (vehicles.length === 0) {
    redirect('/vehicles/new?message=Add+a+vehicle+before+logging+trips');
  }

  return (
    <>
      <PageHeader title="Log trip" description="Record a substantiated business trip." />
      <TripForm
        action={createTripAction}
        categories={categories}
        vehicles={vehicles}
        submitLabel="Create trip"
      />
    </>
  );
}
