import { createVehicleAction } from '@/app/actions/data';
import { PageHeader } from '@/components/PageHeader';
import { VehicleForm } from '@/components/VehicleForm';
import { requireOrgContext } from '@/lib/session';

export default async function NewVehiclePage() {
  await requireOrgContext();

  return (
    <>
      <PageHeader title="Add vehicle" description="Register a vehicle for mileage tracking." />
      <VehicleForm action={createVehicleAction} submitLabel="Create vehicle" />
    </>
  );
}
