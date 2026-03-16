'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell, Search, LogOut, ChevronDown, X,
  LayoutDashboard, Building2, Landmark, Code2,
  Database, ShieldCheck, BarChart2, Server,
  ScrollText, Settings, Bell as BellIcon, AlertTriangle,
  Shield, Lock, Eye,
} from 'lucide-react';
import {
  AdminUser, PermissionModule,
  canView, isSuperAdmin, getMockAdminUser,
  MODULE_LABELS, accessLevelLabel,
} from '@/lib/admin-rbac';

// ─────────────────────────────────────────────────────────────
//  ROUTE → PAGE TITLE MAP
// ─────────────────────────────────────────────────────────────

const ROUTE_TITLES: Record<string, string> = {
  '/admin':                  'Dashboard',
  '/admin/businesses':       'Businesses',
  '/admin/financers':        'Financers',
  '/admin/developers':       'Developers',
  '/admin/financial-data':   'Financial Data',
  '/admin/verifications':    'Verifications',
  '/admin/disputes':         'Disputes',
  '/admin/reports':          'Reports',
  '/admin/notifications':    'Notifications',
  '/admin/system':           'System',
  '/admin/audit-logs':       'Audit Logs',
  '/admin/settings':         'Settings',
};

// ─────────────────────────────────────────────────────────────
//  SEARCH LINK CONFIG
// ─────────────────────────────────────────────────────────────

interface SearchLink {
  label: string;
  href: string;
  icon: React.ReactNode;
  module?: PermissionModule;
}

const ALL_SEARCH_LINKS: SearchLink[] = [
  { label: 'Dashboard',      href: '/admin',                icon: <LayoutDashboard size={14} /> },
  { label: 'Businesses',     href: '/admin/businesses',     icon: <Building2 size={14} />,   module: 'businesses' },
  { label: 'Financers',      href: '/admin/financers',      icon: <Landmark size={14} />,    module: 'financers' },
  { label: 'Developers',     href: '/admin/developers',     icon: <Code2 size={14} />,       module: 'developers' },
  { label: 'Financial Data', href: '/admin/financial-data', icon: <Database size={14} />,    module: 'financial_data' },
  { label: 'Verifications',  href: '/admin/verifications',  icon: <ShieldCheck size={14} />, module: 'verifications' },
  { label: 'Disputes',       href: '/admin/disputes',       icon: <AlertTriangle size={14} />, module: 'verifications' },
  { label: 'Reports',        href: '/admin/reports',        icon: <BarChart2 size={14} />,   module: 'reports' },
  { label: 'Notifications',  href: '/admin/notifications',  icon: <BellIcon size={14} />,    module: 'notifications' },
  { label: 'System',         href: '/admin/system',         icon: <Server size={14} />,      module: 'system' },
  { label: 'Audit Logs',     href: '/admin/audit-logs',     icon: <ScrollText size={14} />,  module: 'audit_logs' },
  { label: 'Settings',       href: '/admin/settings',       icon: <Settings size={14} />,    module: 'settings' },
];

// ─────────────────────────────────────────────────────────────
//  PERMISSION INDICATOR — shows admin's scope in the topnav
// ─────────────────────────────────────────────────────────────

function ScopeIndicator({ user }: { user: AdminUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  if (isSuperAdmin(user)) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '4px 10px', borderRadius: 9999,
        background: 'rgba(0,212,255,0.08)',
        border: '1px solid rgba(0,212,255,0.2)',
        fontSize: 11, fontWeight: 700,
        color: '#00D4FF', letterSpacing: '0.04em',
        cursor: 'default',
      }}>
        <Shield size={10} strokeWidth={2.5} />
        SUPER ADMIN
      </div>
    );
  }

  // Scoped admin — show a clickable pill that expands permission details
  const MODULES: PermissionModule[] = [
    'businesses', 'financers', 'developers', 'financial_data',
    'verifications', 'reports', 'system', 'audit_logs',
    'notifications', 'settings',
  ];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '4px 10px', borderRadius: 9999,
          background: open ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.07)',
          border: `1px solid ${open ? 'rgba(245,158,11,0.35)' : 'rgba(245,158,11,0.2)'}`,
          fontSize: 11, fontWeight: 700,
          color: '#F59E0B', letterSpacing: '0.04em',
          cursor: 'pointer', transition: 'all 0.12s',
        }}
      >
        <Lock size={10} strokeWidth={2.5} />
        SCOPED ADMIN
        <ChevronDown
          size={10}
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
        />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 34, left: '50%',
          transform: 'translateX(-50%)',
          background: 'white', border: '1px solid #E5E7EB',
          borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          width: 260, zIndex: 200, overflow: 'hidden',
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#0A2540', marginBottom: 2 }}>
              Permission Scope
            </p>
            <p style={{ fontSize: 11, color: '#9CA3AF' }}>
              Your access is restricted to the modules below.
            </p>
          </div>
          <div style={{ padding: '8px 0', maxHeight: 320, overflowY: 'auto' }}>
            {MODULES.map((mod) => {
              const level = accessLevelLabel(user, mod);
              const hasAccess = level !== 'No access';
              return (
                <div key={mod} style={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 16px',
                  opacity: hasAccess ? 1 : 0.4,
                }}>
                  <span style={{ fontSize: 12, color: '#374151', fontWeight: hasAccess ? 500 : 400 }}>
                    {MODULE_LABELS[mod]}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    padding: '2px 7px', borderRadius: 9999,
                    color: level === 'Full' ? '#10B981'
                      : level === 'View only' ? '#6B7280'
                      : '#D1D5DB',
                    background: level === 'Full' ? '#ECFDF5'
                      : level === 'View only' ? '#F3F4F6'
                      : 'transparent',
                  }}>
                    {level === 'View only' && <Eye size={8} style={{ marginRight: 3, display: 'inline' }} />}
                    {level}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  TOP NAV
// ─────────────────────────────────────────────────────────────

export function AdminTopNav() {
  const pathname = usePathname();
  const router = useRouter();

  // TODO: replace with real session hook
  const user = getMockAdminUser();

  // Derive page title — match most-specific route prefix
  const title = Object.entries(ROUTE_TITLES)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([route]) => pathname === route || pathname.startsWith(route + '/'))?.[1]
    ?? 'Admin Portal';

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter search links by permission
  const permittedLinks = ALL_SEARCH_LINKS.filter(
    (l) => !l.module || canView(user, l.module)
  );

  const filtered = query.trim()
    ? permittedLinks.filter((l) =>
        l.label.toLowerCase().includes(query.toLowerCase())
      )
    : permittedLinks;

  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 50);
    else setQuery('');
  }, [searchOpen]);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setSearchOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header style={{
      height: 64,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      background: 'white',
      borderBottom: '1px solid #E5E7EB',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      gap: 16,
    }}>

      {/* Page title */}
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: 16,
        color: '#0A2540',
        letterSpacing: '-0.02em',
        margin: 0,
        flexShrink: 0,
      }}>
        {title}
      </h1>

      {/* Centre — scope indicator */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <ScopeIndicator user={user} />
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>

        {/* Search */}
        <div ref={searchRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setSearchOpen((v) => !v)}
            style={{
              width: 34, height: 34, borderRadius: 8,
              border: `1px solid ${searchOpen ? '#0A2540' : '#E5E7EB'}`,
              background: searchOpen ? '#F9FAFB' : 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: searchOpen ? '#0A2540' : '#6B7280',
              transition: 'all 0.12s',
            }}
            aria-label="Search"
          >
            <Search size={14} />
          </button>

          {searchOpen && (
            <div style={{
              position: 'absolute', top: 42, right: 0,
              background: 'white', border: '1px solid #E5E7EB',
              borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              width: 280, overflow: 'hidden', zIndex: 200,
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', borderBottom: '1px solid #F3F4F6',
              }}>
                <Search size={13} style={{ color: '#9CA3AF', flexShrink: 0 }} />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && filtered.length > 0) {
                      router.push(filtered[0].href);
                      setSearchOpen(false);
                    }
                    if (e.key === 'Escape') setSearchOpen(false);
                  }}
                  placeholder="Go to page…"
                  style={{
                    flex: 1, border: 'none', outline: 'none',
                    fontSize: 13, color: '#0A2540', background: 'transparent',
                  }}
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#9CA3AF', display: 'flex', padding: 0,
                    }}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              <div style={{ maxHeight: 280, overflowY: 'auto', padding: '6px 0' }}>
                {filtered.length === 0 ? (
                  <p style={{ padding: '12px 16px', fontSize: 13, color: '#9CA3AF' }}>
                    No pages match.
                  </p>
                ) : (
                  filtered.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '9px 16px', textDecoration: 'none',
                        fontSize: 13,
                        fontWeight: pathname.startsWith(link.href) ? 600 : 400,
                        color: pathname.startsWith(link.href) ? '#0A2540' : '#374151',
                        background: pathname.startsWith(link.href) ? '#F9FAFB' : 'transparent',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={(e) => {
                        if (!pathname.startsWith(link.href))
                          (e.currentTarget as HTMLElement).style.background = '#F9FAFB';
                      }}
                      onMouseLeave={(e) => {
                        if (!pathname.startsWith(link.href))
                          (e.currentTarget as HTMLElement).style.background = 'transparent';
                      }}
                    >
                      <span style={{ color: '#9CA3AF' }}>{link.icon}</span>
                      {link.label}
                      {pathname.startsWith(link.href) && link.href !== '/admin' && (
                        <span style={{ marginLeft: 'auto', fontSize: 10, color: '#9CA3AF' }}>
                          Current
                        </span>
                      )}
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <Link
          href="/admin/notifications"
          style={{
            width: 34, height: 34, borderRadius: 8,
            border: '1px solid #E5E7EB', background: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#6B7280', transition: 'all 0.12s',
            position: 'relative', textDecoration: 'none',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = '#0A2540';
            (e.currentTarget as HTMLElement).style.color = '#0A2540';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB';
            (e.currentTarget as HTMLElement).style.color = '#6B7280';
          }}
          aria-label="Notifications"
        >
          <Bell size={14} />
          {/* Dot indicator */}
          <span style={{
            position: 'absolute', top: 7, right: 7,
            width: 6, height: 6, borderRadius: '50%',
            background: '#EF4444', border: '1.5px solid white',
          }} />
        </Link>

        {/* Divider */}
        <div style={{ width: 1, height: 22, background: '#E5E7EB', margin: '0 4px' }} />

        {/* Avatar + dropdown */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '4px 8px 4px 4px', borderRadius: 8,
              border: `1px solid ${menuOpen ? '#0A2540' : '#E5E7EB'}`,
              background: menuOpen ? '#F9FAFB' : 'white',
              cursor: 'pointer', transition: 'all 0.12s',
            }}
          >
            <div style={{
              width: 26, height: 26, borderRadius: 6, flexShrink: 0,
              background: isSuperAdmin(user)
                ? 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,212,255,0.3))'
                : 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.3))',
              border: `1px solid ${isSuperAdmin(user)
                ? 'rgba(0,212,255,0.25)'
                : 'rgba(245,158,11,0.3)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700,
              color: isSuperAdmin(user) ? '#0A5060' : '#92400E',
            }}>
              {initials}
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0A2540' }}>
              {user.name.split(' ')[0]}
            </span>
            <ChevronDown
              size={13}
              style={{
                color: '#9CA3AF',
                transform: menuOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.15s',
              }}
            />
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div style={{
              position: 'absolute', top: 42, right: 0,
              background: 'white', border: '1px solid #E5E7EB',
              borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              minWidth: 220, overflow: 'hidden', zIndex: 200,
            }}>
              {/* User info */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #F3F4F6' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#0A2540', marginBottom: 2 }}>
                  {user.name}
                </p>
                <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 6 }}>
                  {user.email}
                </p>
                {/* Role pill */}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 9, fontWeight: 700,
                  letterSpacing: '0.07em', textTransform: 'uppercase',
                  padding: '2px 7px', borderRadius: 9999,
                  color: isSuperAdmin(user) ? '#00D4FF' : '#F59E0B',
                  background: isSuperAdmin(user)
                    ? 'rgba(0,212,255,0.08)'
                    : 'rgba(245,158,11,0.08)',
                  border: `1px solid ${isSuperAdmin(user)
                    ? 'rgba(0,212,255,0.2)'
                    : 'rgba(245,158,11,0.2)'}`,
                }}>
                  <Shield size={8} strokeWidth={2.5} />
                  {isSuperAdmin(user) ? 'Super Admin' : 'Admin'}
                </span>
              </div>

              {/* Settings link */}
              {canView(user, 'settings') && (
                <div style={{ padding: '6px 0' }}>
                  <Link href="/admin/settings" style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 16px', fontSize: 13, fontWeight: 500,
                    color: '#374151', textDecoration: 'none',
                    transition: 'background 0.1s',
                  }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F9FAFB')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Settings size={13} style={{ color: '#9CA3AF' }} />
                    Settings
                  </Link>
                </div>
              )}

              {/* Sign out */}
              <div style={{ borderTop: '1px solid #F3F4F6', padding: '6px 0' }}>
                <button
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '9px 16px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 500, color: '#EF4444',
                    textAlign: 'left', transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#FEF2F2')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  onClick={() => {
                    // TODO: Keycloak logout → clear session → redirect /admin/login
                  }}
                >
                  <LogOut size={13} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
