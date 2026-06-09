'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ThemeToggle } from './ThemeToggle';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/trips', label: 'Trips' },
  { href: '/vehicles', label: 'Vehicles' },
  { href: '/reports', label: 'Reports' },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-link ${active ? 'nav-link-active' : ''}`}
            onClick={onNavigate}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

interface NavProps {
  organizationName?: string | null;
  username?: string | null;
  isPlatformAdmin?: boolean;
}

export function Nav({ organizationName, username, isPlatformAdmin }: NavProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface">
      <div className="mx-auto flex h-14 max-w-content items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-lg font-semibold text-text-primary">
            Mileage Tracker
          </Link>
          {organizationName && (
            <span className="hidden rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary sm:inline-block">
              {organizationName}
            </span>
          )}
          <nav className="hidden items-center gap-1 md:flex">
            <NavLinks />
            {isPlatformAdmin && (
              <Link href="/admin" className="nav-link">
                Admin
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {username && (
            <span className="hidden text-sm text-text-secondary lg:inline">{username}</span>
          )}
          <ThemeToggle />
          <form action="/api/auth/logout" method="POST" className="hidden md:block">
            <button type="submit" className="btn btn-secondary">
              Logout
            </button>
          </form>
          <button
            type="button"
            className="btn btn-secondary min-w-[44px] px-3 md:hidden"
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            ☰
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-border bg-surface px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-2">
            <NavLinks onNavigate={() => setMenuOpen(false)} />
            <form action="/api/auth/logout" method="POST">
              <button type="submit" className="btn btn-secondary w-full">
                Logout
              </button>
            </form>
          </nav>
        </div>
      )}
    </header>
  );
}
