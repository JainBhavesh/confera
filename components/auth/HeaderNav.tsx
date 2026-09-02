'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import type { PublicUser } from '@/services/user.service';

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== '/' && pathname?.startsWith(href));

  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
        active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      {children}
    </Link>
  );
}

export function HeaderNav({ user }: { user: PublicUser | null }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  if (!user) {
    return <p className="text-sm text-muted-foreground">Secure video meetings</p>;
  }

  return (
    <div className="flex items-center gap-2">
      <nav className="hidden items-center gap-1 sm:flex">
        {user.role === 'ADMIN' ? (
          <NavLink href="/admin">Admin</NavLink>
        ) : (
          <>
            <NavLink href="/dashboard">Dashboard</NavLink>
            <NavLink href="/meetings">My meetings</NavLink>
            <NavLink href="/livestreams">Livestreams</NavLink>
          </>
        )}
      </nav>

      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          aria-label="Account menu"
        >
          {initials(user.name) || 'U'}
        </button>
        {menuOpen ? (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-border bg-card p-2 shadow-popover">
              <div className="border-b border-border px-3 py-2">
                <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted"
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-destructive hover:bg-muted"
              >
                Log out
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
