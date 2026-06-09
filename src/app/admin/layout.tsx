import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import { AuthError } from '@/lib/errors';
import { requirePlatformAdmin } from '@/lib/session';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let username = '';
  try {
    const admin = await requirePlatformAdmin();
    username = admin.username;
  } catch (err) {
    if (err instanceof AuthError && err.status === 401) {
      redirect('/login?next=/admin');
    }
    redirect('/dashboard');
  }

  return (
    <div className="page-shell">
      <header className="sticky top-0 z-50 border-b border-border bg-surface">
        <div className="mx-auto flex h-14 max-w-content items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-lg font-semibold text-text-primary">
              Mileage Tracker
            </Link>
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
              Platform Admin
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-text-secondary sm:inline">{username}</span>
            <ThemeToggle />
            <form action="/api/auth/logout" method="POST">
              <button type="submit" className="btn btn-secondary">
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="content-container">{children}</main>
    </div>
  );
}
