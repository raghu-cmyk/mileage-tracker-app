import { Nav } from '@/components/Nav';
import { prisma } from '@/lib/db';
import { getCurrentUserId } from '@/lib/session';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return <>{children}</>;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { organization: true },
  });

  return (
    <div className="page-shell">
      <Nav
        organizationName={user?.organization?.name ?? null}
        username={user?.username ?? null}
        isPlatformAdmin={user?.role === 'PLATFORM_ADMIN'}
      />
      <main className="content-container">{children}</main>
    </div>
  );
}
