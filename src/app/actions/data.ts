'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getErrorMessage, isValidationError } from '@/lib/errors';
import { requireOrgContext } from '@/lib/session';
import { createTrip, deleteTrip, getTrip, updateTrip } from '@/lib/trips';
import {
  createVehicle,
  updateVehicle,
  archiveVehicle,
  deleteVehicle,
  getVehicle,
  upsertOdometerReading,
} from '@/lib/vehicles';

export interface ActionResult {
  ok: boolean;
  error?: string;
  id?: number;
}

export async function createTripAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const { organizationId } = await requireOrgContext();
    const trip = await createTrip(prisma, organizationId, {
      tripDateRaw: formData.get('trip_date')?.toString(),
      origin: formData.get('origin')?.toString(),
      destination: formData.get('destination')?.toString(),
      businessPurpose: formData.get('business_purpose')?.toString(),
      milesRaw: formData.get('miles')?.toString(),
      categoryIdRaw: formData.get('category_id')?.toString(),
      vehicleIdRaw: formData.get('vehicle_id')?.toString(),
      odometerStartRaw: formData.get('odometer_start')?.toString(),
      odometerEndRaw: formData.get('odometer_end')?.toString(),
    });
    redirect(`/trips/${trip.id}`);
  } catch (err) {
    if (typeof err === 'object' && err !== null && 'digest' in err) throw err;
    return { ok: false, error: getErrorMessage(err) };
  }
}

export async function updateTripAction(
  tripId: number,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { organizationId } = await requireOrgContext();
    const trip = await getTrip(prisma, organizationId, tripId);
    if (!trip) return { ok: false, error: 'Trip not found.' };

    await updateTrip(prisma, organizationId, trip, {
      tripDateRaw: formData.get('trip_date')?.toString(),
      origin: formData.get('origin')?.toString(),
      destination: formData.get('destination')?.toString(),
      businessPurpose: formData.get('business_purpose')?.toString(),
      milesRaw: formData.get('miles')?.toString(),
      categoryIdRaw: formData.get('category_id')?.toString(),
      vehicleIdRaw: formData.get('vehicle_id')?.toString(),
      odometerStartRaw: formData.get('odometer_start')?.toString(),
      odometerEndRaw: formData.get('odometer_end')?.toString(),
    });
    redirect(`/trips/${tripId}`);
  } catch (err) {
    if (typeof err === 'object' && err !== null && 'digest' in err) throw err;
    return { ok: false, error: getErrorMessage(err) };
  }
}

export async function deleteTripAction(tripId: number): Promise<void> {
  try {
    const { organizationId } = await requireOrgContext();
    const trip = await getTrip(prisma, organizationId, tripId);
    if (!trip) {
      redirect(`/trips/${tripId}?error=${encodeURIComponent('Trip not found.')}`);
    }
    await deleteTrip(prisma, trip);
    redirect('/trips');
  } catch (err) {
    if (typeof err === 'object' && err !== null && 'digest' in err) throw err;
    redirect(`/trips/${tripId}?error=${encodeURIComponent(getErrorMessage(err))}`);
  }
}

export async function createVehicleAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const { organizationId } = await requireOrgContext();
    const vehicle = await createVehicle(
      prisma,
      organizationId,
      formData.get('display_name')?.toString() ?? '',
      formData.get('description')?.toString() ?? ''
    );
    redirect(`/vehicles/${vehicle.id}`);
  } catch (err) {
    if (typeof err === 'object' && err !== null && 'digest' in err) throw err;
    if (isValidationError(err)) return { ok: false, error: err.message };
    return { ok: false, error: getErrorMessage(err) };
  }
}

export async function updateVehicleAction(
  vehicleId: number,
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { organizationId } = await requireOrgContext();
    const vehicle = await getVehicle(prisma, organizationId, vehicleId);
    if (!vehicle) return { ok: false, error: 'Vehicle not found.' };

    await updateVehicle(
      prisma,
      vehicle,
      formData.get('display_name')?.toString() ?? '',
      formData.get('description')?.toString() ?? ''
    );
    redirect(`/vehicles/${vehicleId}`);
  } catch (err) {
    if (typeof err === 'object' && err !== null && 'digest' in err) throw err;
    return { ok: false, error: getErrorMessage(err) };
  }
}

export async function archiveVehicleAction(vehicleId: number): Promise<void> {
  try {
    const { organizationId } = await requireOrgContext();
    const vehicle = await getVehicle(prisma, organizationId, vehicleId);
    if (!vehicle) {
      redirect(`/vehicles/${vehicleId}?error=${encodeURIComponent('Vehicle not found.')}`);
    }
    await archiveVehicle(prisma, vehicle);
    redirect('/vehicles');
  } catch (err) {
    if (typeof err === 'object' && err !== null && 'digest' in err) throw err;
    redirect(`/vehicles/${vehicleId}?error=${encodeURIComponent(getErrorMessage(err))}`);
  }
}

export async function deleteVehicleAction(vehicleId: number): Promise<void> {
  try {
    const { organizationId } = await requireOrgContext();
    const vehicle = await getVehicle(prisma, organizationId, vehicleId);
    if (!vehicle) {
      redirect(`/vehicles/${vehicleId}?error=${encodeURIComponent('Vehicle not found.')}`);
    }
    await deleteVehicle(prisma, vehicle);
    redirect('/vehicles');
  } catch (err) {
    if (typeof err === 'object' && err !== null && 'digest' in err) throw err;
    redirect(`/vehicles/${vehicleId}?error=${encodeURIComponent(getErrorMessage(err))}`);
  }
}

export async function upsertOdometerAction(vehicleId: number, formData: FormData): Promise<void> {
  try {
    const { organizationId } = await requireOrgContext();
    const vehicle = await getVehicle(prisma, organizationId, vehicleId);
    if (!vehicle) {
      redirect(`/vehicles/${vehicleId}?error=${encodeURIComponent('Vehicle not found.')}`);
    }

    const taxYear = parseInt(formData.get('tax_year')?.toString() ?? '', 10);
    await upsertOdometerReading(
      prisma,
      vehicle,
      taxYear,
      formData.get('odometer_year_start')?.toString(),
      formData.get('odometer_year_end')?.toString()
    );
    redirect(`/vehicles/${vehicleId}`);
  } catch (err) {
    if (typeof err === 'object' && err !== null && 'digest' in err) throw err;
    redirect(`/vehicles/${vehicleId}?error=${encodeURIComponent(getErrorMessage(err))}`);
  }
}
