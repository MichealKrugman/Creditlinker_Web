'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Building2, Landmark, Code2, Database,
  ShieldCheck, BarChart2, Server, ScrollText, Settings,
  Bell, ChevronRight, Shield, AlertTriangle,
} from 'lucide-react';
import {
  AdminUser, PermissionModule,
  canView, isSuperAdmin, describeScope, getMockAdminUser,
} from '@/lib/admin-rbac';

// ─────────────────────────────────────────────────────────────
//  NAV CONFIG
// ─────────────────────────────────────────────────────────────

interface NavConfig {
  label: string;
  route: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  module?: PermissionModule;  // undefined = always visible (dashboard)
  danger?: boolean;           // red accent for destructive/sensitive sections
}

const NAV_ITEMS: NavConfig[] = [
  { label: 'Dashboard',      route: '/admin',                  icon: LayoutDashboard },
  { label: 'Businesses',     route: '/admin/businesses',       icon: Building2,  module: 'businesses' },
  { label: 'Financers',      route: '/admin/financers',        icon: Landmark,   module: 'financers' },
  { label: 'Developers',     route: '/admin/developers',       icon: Code2,      module: 'developers' },
  { label: 'Financial Data', route: '/admin/financial-data',   icon: Database,   module: 'financial_data' },
  { label: 'Verifications',  route: '/admin/verifications',    icon: ShieldCheck,module: 'verifications' },
  { label: 'Disputes',       route: '/admin/disputes',         icon: AlertTriangle, module: 'verifications' },
  { label: 'Reports',        route: '/admin/reports',          icon: BarChart2,  module: 'reports' },
  { label: 'Notifications',  route: '/admin/notifications',    icon: Bell,       module: 'notifications' },
  { label: 'System',         route: '/admin/system',           icon: Server,     module: 'system', danger: true },
  { label: 'Audit Logs',     route: '/admin/audit-logs',       icon: ScrollText, module: 'audit_logs' },
];

const BOTTOM_ITEMS: NavConfig[] = [
  { label: 'Settings', route: '/admin/settings', icon: Settings, module: 'settings' },
];

// ─────────────────────────────────────────────────────────────
//  LOGO
// ─────────────────────────────────────────────────────────────

function LogoMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="7" fill="rgba(255,255,255,0.08)" />
      <path d="M7 14C7 10.134 10.134 7 14 7C17.866 7 21 10.134 21 14"
        stroke="#00D4FF" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 14C7 17.866 10.134 21 14 21H21"
        stroke="white" strokeWidth="2" strokeLinecap="round" />
      <circle cx="14" cy="14" r="2.5" fill="#00D4FF" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
//  NAV ITEM
// ─────────────────────────────────────────────────────────────

function NavItem({
  label, route, icon: Icon, active, danger,
}: {
  label: string;
  route: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  active: boolean;
  danger?: boolean;
}) {
  const activeColor = danger ? '#EF4444' : '#00D4FF';

  return (
    <Link
      href={route}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 12px',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: active ? 600 : 500,
        color: active
          ? 'white'
          : danger
            ? 'rgba(239,68,68,0.55)'
            : 'rgba(255,255,255,0.5)',
        background: active
          ? danger ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.08)'
          : 'transparent',
        textDecoration: 'none',
        transition: 'all 0.12s ease',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.color = danger
            ? 'rgba(239,68,68,0.8)'
            : 'rgba(255,255,255,0.85)';
          (e.currentTarget as HTMLElement).style.background = danger
            ? 'rgba(239,68,68,0.06)'
            : 'rgba(255,255,255,0.05)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.color = danger
            ? 'rgba(239,68,68,0.55)'
            : 'rgba(255,255,255,0.5)';
          (e.currentTarget as HTMLElement).style.background = 'transparent';
        }
      }}
    >
      {/* Active indicator bar */}
      {active && (
        <span style={{
          position: 'absolute',
          left: 0, top: '50%',
          transform: 'translateY(-50%)',
          width: 3, height: 16,
          borderRadius: '0 2px 2px 0',
          background: activeColor,
        }} />
      )}
      <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
      <span style={{ flex: 1 }}>{label}</span>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────
//  ROLE BADGE
// ─────────────────────────────────────────────────────────────

function RoleBadge({ user }: { user: AdminUser }) {
  const superAdmin = isSuperAdmin(user);
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: '0.07em',
      textTransform: 'uppercase',
      padding: '2px 7px',
      borderRadius: 9999,
      color: superAdmin ? '#00D4FF' : '#F59E0B',
      background: superAdmin ? 'rgba(0,212,255,0.1)' : 'rgba(245,158,11,0.1)',
      border: `1px solid ${superAdmin ? 'rgba(0,212,255,0.2)' : 'rgba(245,158,11,0.2)'}`,
    }}>
      <Shield size={8} strokeWidth={2.5} />
      {superAdmin ? 'Super Admin' : 'Admin'}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
//  SIDEBAR
// ─────────────────────────────────────────────────────────────

export function AdminSidebar() {
  const pathname = usePathname();

  // TODO: replace with real session hook
  const user = getMockAdminUser();

  // Filter nav items based on permission — absent module = invisible
  const visibleNav = NAV_ITEMS.filter(
    (item) => !item.module || canView(user, item.module)
  );
  const visibleBottom = BOTTOM_ITEMS.filter(
    (item) => !item.module || canView(user, item.module)
  );

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const scope = describeScope(user);

  return (
    <aside style={{
      width: 240,
      minHeight: '100vh',
      background: '#0A2540',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0, top: 0, bottom: 0,
      zIndex: 50,
      borderRight: '1px solid rgba(255,255,255,0.06)',
    }}>

      {/* Logo */}
      <div style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <Link href="/admin" style={{
          display: 'flex', alignItems: 'center', gap: 9,
          textDecoration: 'none',
        }}>
          <LogoMark />
          <div>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 14,
              color: 'white',
              letterSpacing: '-0.03em',
              display: 'block',
              lineHeight: 1.1,
            }}>
              Creditlinker
            </span>
            <span style={{
              fontSize: 9,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.3)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              Admin Portal
            </span>
          </div>
        </Link>
      </div>

      {/* Main nav */}
      <nav style={{
        flex: 1,
        padding: '16px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        overflowY: 'auto',
      }}>
        {visibleNav.map((item) => (
          <NavItem
            key={item.route}
            label={item.label}
            route={item.route}
            icon={item.icon}
            danger={item.danger}
            active={
              item.route === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.route)
            }
          />
        ))}
      </nav>

      {/* Divider */}
      {visibleBottom.length > 0 && (
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 12px' }} />
      )}

      {/* Bottom nav */}
      {visibleBottom.length > 0 && (
        <div style={{ padding: '12px 12px' }}>
          {visibleBottom.map((item) => (
            <NavItem
              key={item.route}
              label={item.label}
              route={item.route}
              icon={item.icon}
              danger={item.danger}
              active={pathname.startsWith(item.route)}
            />
          ))}
        </div>
      )}

      {/* User profile strip */}
      <div style={{
        padding: '12px 16px 16px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 10px',
          borderRadius: 8,
          cursor: 'pointer',
          transition: 'background 0.12s',
        }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          {/* Avatar */}
          <div style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            background: isSuperAdmin(user)
              ? 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,212,255,0.35))'
              : 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.35))',
            border: `1px solid ${isSuperAdmin(user) ? 'rgba(0,212,255,0.3)' : 'rgba(245,158,11,0.3)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700,
            color: isSuperAdmin(user) ? '#00D4FF' : '#F59E0B',
          }}>
            {initials}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              marginBottom: 3,
            }}>
              {user.name}
            </p>
            <RoleBadge user={user} />
          </div>
          <ChevronRight size={13} style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
        </div>

        {/* Scope summary — only for scoped admins */}
        {!isSuperAdmin(user) && (
          <p style={{
            fontSize: 10,
            color: 'rgba(255,255,255,0.2)',
            padding: '4px 10px 0',
            lineHeight: 1.5,
          }}>
            Access: {scope}
          </p>
        )}
      </div>
    </aside>
  );
}
