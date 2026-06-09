import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { getPlatformStats, listOrganizationsWithStats } from '@/lib/admin';
import { prisma } from '@/lib/db';
import { setOrgActiveAction } from './actions';

export const dynamic = 'force-dynamic';

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card">
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-text-primary">{value}</p>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const [stats, organizations] = await Promise.all([
    getPlatformStats(prisma),
    listOrganizationsWithStats(prisma),
  ]);

  return (
    <>
      <PageHeader
        title="Platform overview"
        description="Manage every tenant organization on the platform."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Organizations" value={stats.organizationCount} />
        <StatCard label="Active organizations" value={stats.activeOrganizationCount} />
        <StatCard label="Users" value={stats.userCount} />
        <StatCard label="Trips logged" value={stats.tripCount} />
      </div>

      <div className="card mt-6">
        <h2 className="text-xl font-semibold text-text-primary">Tenant organizations</h2>
        {organizations.length === 0 ? (
          <p className="mt-4 text-text-secondary">No organizations have signed up yet.</p>
        ) : (
          <div className="table-scroll mt-4">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Organization</th>
                  <th scope="col">Users</th>
                  <th scope="col">Vehicles</th>
                  <th scope="col">Trips</th>
                  <th scope="col">Created</th>
                  <th scope="col">Status</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((org) => (
                  <tr key={org.id}>
                    <td>
                      <Link
                        href={`/admin/organizations/${org.id}`}
                        className="text-primary hover:underline"
                      >
                        {org.name}
                      </Link>
                      <span className="block text-xs text-text-secondary">{org.slug}</span>
                    </td>
                    <td className="font-mono">{org.userCount}</td>
                    <td className="font-mono">{org.vehicleCount}</td>
                    <td className="font-mono">{org.tripCount}</td>
                    <td>{org.createdAt.toISOString().slice(0, 10)}</td>
                    <td>
                      {org.isActive ? (
                        <span className="badge-active">Active</span>
                      ) : (
                        <span className="badge-late">Suspended</span>
                      )}
                    </td>
                    <td>
                      <form action={setOrgActiveAction.bind(null, org.id, !org.isActive)}>
                        <button
                          type="submit"
                          className={`btn ${org.isActive ? 'btn-destructive' : 'btn-primary'}`}
                        >
                          {org.isActive ? 'Suspend' : 'Reactivate'}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
