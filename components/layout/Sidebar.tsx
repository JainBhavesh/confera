'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import type { PublicUser } from '@/services/user.service';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

interface NavLinkDef {
  href: string;
  label: string;
  icon: ReactNode;
  badge?: number;
}

const WORKSPACE_LINKS: NavLinkDef[] = [
  {
    href: '/dashboard',
    label: 'Home',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px]">
        <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
      </svg>
    )
  },
  {
    href: '/meetings',
    label: 'Meetings',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px]">
        <path d="m16 10 5-3v10l-5-3z" />
        <rect x="3" y="6" width="13" height="12" rx="1" />
      </svg>
    )
  },
  {
    href: '/schedule',
    label: 'Schedule',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px]">
        <rect x="3" y="5" width="18" height="16" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </svg>
    )
  },
  {
    href: '/livestreams',
    label: 'Livestreams',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px]">
        <circle cx="12" cy="12" r="2.5" />
        <path d="M7.5 7.5a6.4 6.4 0 0 0 0 9M16.5 16.5a6.4 6.4 0 0 0 0-9M4.5 4.5a10.6 10.6 0 0 0 0 15M19.5 19.5a10.6 10.6 0 0 0 0-15" />
      </svg>
    )
  }
];

const KNOWLEDGE_LINKS: (openActions: number) => NavLinkDef[] = (openActions) => [
  {
    href: '/search',
    label: 'Search notes',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px]">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    )
  },
  {
    href: '/action-items',
    label: 'Action items',
    badge: openActions > 0 ? openActions : undefined,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px]">
        <path d="M9 11l2.5 2.5L20 5" />
        <path d="M20 12v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h10" />
      </svg>
    )
  },
  {
    href: '/recordings',
    label: 'Recordings',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px]">
        <rect x="3" y="4" width="18" height="16" />
        <path d="M7 4v16M17 4v16M3 12h18M3 8h4M3 16h4M17 8h4M17 16h4" />
      </svg>
    )
  }
];

const ADMIN_LINKS: NavLinkDef[] = [
  {
    href: '/admin',
    label: 'Usage analytics',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px]">
        <path d="M4 20V10M9.3 20V5M14.7 20v-8M20 20V8" />
      </svg>
    )
  },
  {
    href: '/admin/users',
    label: 'Members',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px]">
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3 19c0-3.3 2.7-5.6 6-5.6s6 2.3 6 5.6" />
        <path d="M16 5.4a3 3 0 0 1 0 5.6M17.5 13.6c2.1.6 3.5 2.5 3.5 5" />
      </svg>
    )
  },
  {
    href: '/admin/meetings',
    label: 'All meetings',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px]">
        <path d="m16 10 5-3v10l-5-3z" />
        <rect x="3" y="6" width="13" height="12" rx="1" />
      </svg>
    )
  },
  {
    href: '/admin/livestreams',
    label: 'All livestreams',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px]">
        <circle cx="12" cy="12" r="2.5" />
        <path d="M7.5 7.5a6.4 6.4 0 0 0 0 9M16.5 16.5a6.4 6.4 0 0 0 0-9M4.5 4.5a10.6 10.6 0 0 0 0 15M19.5 19.5a10.6 10.6 0 0 0 0-15" />
      </svg>
    )
  },
  {
    href: '/admin/action-items',
    label: 'All action items',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px]">
        <path d="M9 11l2.5 2.5L20 5" />
        <path d="M20 12v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h10" />
      </svg>
    )
  },
  {
    href: '/admin/analytics',
    label: 'Analytics',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px]">
        <path d="M3 3v18h18M7 15.75V12M11.25 15.75V8.25M15.5 15.75v-5.5M19.75 15.75V6" />
      </svg>
    )
  },
  {
    href: '/admin/settings',
    label: 'Settings',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[17px] w-[17px]">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </svg>
    )
  }
];

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-5 pb-2 pt-5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">{children}</div>
  );
}

// Routes with sibling sub-routes of their own (/admin/users, /admin/settings, ...)
// need an exact match here — a plain startsWith would keep them lit on every
// other admin page too, since they're all nested under the same prefix.
const EXACT_MATCH_ONLY = new Set(['/dashboard', '/admin']);

function NavItem({ link }: { link: NavLinkDef }) {
  const pathname = usePathname();
  const active = EXACT_MATCH_ONLY.has(link.href) ? pathname === link.href : pathname?.startsWith(link.href);

  return (
    <Link
      href={link.href}
      className={`flex items-center gap-[11px] border-l-[3px] px-5 py-2.5 text-sm transition ${
        active
          ? 'border-primary bg-white/10 font-semibold text-white'
          : 'border-transparent text-white/62 hover:bg-white/5'
      }`}
    >
      {link.icon}
      {link.label}
      {link.badge ? (
        <span className="ml-auto flex h-[18px] min-w-[18px] items-center justify-center bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
          {link.badge}
        </span>
      ) : null}
    </Link>
  );
}

export function Sidebar({ user, openActionItemsCount }: { user: PublicUser; openActionItemsCount: number }) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="sticky top-0 flex h-screen flex-col bg-[#201e1d] text-[#f3f2f2]">
      <Link href="/dashboard" className="flex items-center gap-2.5 border-b border-white/16 px-5 py-6">
        <div className="h-7 w-7 bg-primary" />
        <span className="font-heading text-base font-extrabold tracking-tight">CONFERA</span>
      </Link>

      <div className="flex-1 overflow-y-auto pb-4">
        <SectionLabel>Workspace</SectionLabel>
        <nav className="flex flex-col">
          {WORKSPACE_LINKS.map((link) => (
            <NavItem key={link.href} link={link} />
          ))}
        </nav>

        <SectionLabel>Knowledge</SectionLabel>
        <nav className="flex flex-col">
          {KNOWLEDGE_LINKS(openActionItemsCount).map((link) => (
            <NavItem key={link.href} link={link} />
          ))}
        </nav>

        {user.role === 'ADMIN' ? (
          <>
            <SectionLabel>Administration</SectionLabel>
            <nav className="flex flex-col">
              {ADMIN_LINKS.map((link) => (
                <NavItem key={link.href} link={link} />
              ))}
            </nav>
          </>
        ) : null}
      </div>

      <div className="mt-auto flex items-center gap-2.5 border-t border-white/16 px-5 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-primary text-xs font-extrabold text-primary-foreground">
          {initials(user.name) || 'U'}
        </div>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[13px] font-semibold">{user.name}</p>
          <Link href="/profile" className="truncate text-[11px] text-white/50 hover:text-white/80">
            View profile
          </Link>
        </div>
        <div className="ml-auto flex items-center gap-1 text-white/55">
          <ThemeToggle className="flex h-8 w-8 items-center justify-center text-white/55 transition hover:bg-white/10 hover:text-white" />
          <button
            type="button"
            onClick={handleLogout}
            title="Log out"
            aria-label="Log out"
            className="flex h-8 w-8 items-center justify-center transition hover:text-white"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
              <path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4" />
              <path d="M16 8l4 4-4 4M20 12H9" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
