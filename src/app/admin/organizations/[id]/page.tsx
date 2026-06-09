import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { getOrganizationDetail } from '@/lib/admin';
import { prisma } from '@/lib/db';
import { setOrgActiveAction } from '../../actions';

export const dynamic = 'force-dynamic';

interface OrgDetailPageProps {
  params: { id: string };
}

export default async function OrganizationDetailPage({ params }: OrgDetailPageProps) {
  const organizationId = parseInt(params.id, 10);
  if (Number.isNaN(organizationId)) notFound();

  const org = await getOrganizationDetail(prisma, organizationId);
  if (!org) notFound();

  return (
    <>
      <PageHeader
        title={org.name}
        description={`Tenant slug: ${org.slug}`}
        actions={
          <form action={setOrgActiveAction.bind(null, org.id, !org.isActive)}>
            <button
              type="submit"
              className={`btn ${org.isActive ? 'btn-destructive' : 'btn-primary'}`}
            >
              {org.isActive ? 'Suspend organization' : 'Reactivate organization'}
            </button>
          </form>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <p className="text-sm text-text-secondary">Status</p>
          <p className="mt-1">
            {org.isActive ? (
              <span className="badge-active">Active</span>
            ) : (
              <span className="badge-late">Suspended</span>
            )}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-text-secondary">Users</p>
          <p className="mt-1 text-2xl font-semibold">{org._count.users}</p>
        </div>
        <div className="card">
          <p className="text-sm text-text-secondary">Vehicles</p>
          <p className="mt-1 text-2xl font-semibold">{org._count.vehicles}</p>
        </div>
        <div className="card">
          <p className="text-sm text-text-secondary">Trips</p>
          <p className="mt-1 text-2xl font-semibold">{org._count.trips}</p>
        </div>
      </div>

      <div className="card mt-6">
        <h2 className="text-xl font-semibold text-text-primary">Members</h2>
        <div className="table-scroll mt-4">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Username</th>
                <th scope="col">Role</th>
                <th scope="col">Joined</th>
              </tr>
            </thead>
            <tbody>
              {org.users.map((user) => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.role}</td>
                  <td>{user.createdAt.toISOString().slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4">
        <Link href="/admin" className="text-primary hover:underline">
          ← Back to all organizations
        </Link>
      </p>
    </>
  );
}
