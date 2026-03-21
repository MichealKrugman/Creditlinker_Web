'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMobileNav } from '@/lib/mobile-nav-context';
import { X } from 'lucide-react';
import {
  LayoutDashboard, Building2, Inbox, Tag,
  PieChart, BarChart2, Settings, Bell,
  ChevronRight, Target, MessageSquare, Banknote, TrendingUp,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────
   NAV CONFIG
───────────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { label: 'Dashboard',          route: '/financer/dashboard',          icon: LayoutDashboard },
  { label: 'Businesses',         route: '/financer/businesses',         icon: Building2,      accent: true },
  { label: 'Messages',           route: '/financer/messages',           icon: MessageSquare },
  { label: 'Requests',           route: '/financer/requests',           icon: Inbox },
  { label: 'Offers',             route: '/financer/offers',             icon: Tag },
  { label: 'Financing',          route: '/financer/financing',          icon: Banknote },
  { label: 'Financial Analysis', route: '/financer/financial-analysis', icon: TrendingUp },
  { label: 'Portfolio',          route: '/financer/portfolio',          icon: PieChart },
  { label: 'Reports',            route: '/financer/reports',            icon: BarChart2 },
  { label: 'Alerts',             route: '/financer/alerts',             icon: Target },
  { label: 'Notifications',      route: '/financer/notifications',      icon: Bell },
];

const BOTTOM_ITEMS = [
  { label: 'Settings', route: '/financer/settings', icon: Settings },
];

/* ─────────────────────────────────────────────────────────
   LOGO
───────────────────────────────────────────────────────── */
function LogoMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="7" fill="rgba(255,255,255,0.08)" />
      <path d="M7 14C7 10.134 10.134 7 14 7C17.866 7 21 10.134 21 14" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 14C7 17.866 10.134 21 14 21H21" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <circle cx="14" cy="14" r="2.5" fill="#00D4FF" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────
   NAV ITEM
───────────────────────────────────────────────────────── */
function NavItem({
  label, route, icon: Icon, active, accent, badge,
}: {
  label: string;
  route: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  active: boolean;
  accent?: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={route}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px', borderRadius: 8,
        fontSize: 13, fontWeight: active ? 600 : 500,
        color: active ? 'white' : 'rgba(255,255,255,0.5)',
        background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
        textDecoration: 'none', transition: 'all 0.12s ease', position: 'relative',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.85)';
          (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)';
          (e.currentTarget as HTMLElement).style.background = 'transparent';
        }
      }}
    >
      {active && (
        <span style={{
          position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
          width: 3, height: 16, borderRadius: '0 2px 2px 0',
          background: accent ? '#00D4FF' : 'rgba(255,255,255,0.6)',
        }} />
      )}
      <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
      <span style={{ flex: 1 }}>{label}</span>
      {accent && active && (
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', color: '#00D4FF',
          background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)',
          padding: '2px 6px', borderRadius: 9999, textTransform: 'uppercase',
        }}>
          Core
        </span>
      )}
      {badge && badge > 0 && (
        <span style={{
          minWidth: 18, height: 18, borderRadius: 9999, background: '#EF4444',
          color: 'white', fontSize: 10, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
        }}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────────────────────── */
export function FinancerSidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useMobileNav();

  const BADGES: Record<string, number> = {
    '/financer/requests': 3,
    '/financer/messages': 1,
  };

  return (
    <>
      {/* Backdrop — uses existing .cl-sidebar-backdrop class from globals.css */}
      <div
        onClick={close}
        className={`cl-sidebar-backdrop${isOpen ? ' cl-sidebar-open' : ''}`}
      />

      {/* Sidebar — uses existing .cl-sidebar / .cl-sidebar-open from globals.css */}
      <aside
        className={`cl-sidebar${isOpen ? ' cl-sidebar-open' : ''}`}
        style={{
          width: 240, minHeight: '100vh', background: '#0A2540',
          display: 'flex', flexDirection: 'column',
          position: 'fixed', left: 0, top: 0, bottom: 0,
          zIndex: 50, borderRight: '1px solid rgba(255,255,255,0.06)',
        }}>
      {/* Logo */}
      <div style={{
        height: 64, display: 'flex', alignItems: 'center',
        padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
      }}>
        <Link href="/financer/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
          <LogoMark />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'white', letterSpacing: '-0.03em', lineHeight: 1 }}>
              Creditlinker
            </span>
            <span style={{ fontSize: 9, fontWeight: 600, color: 'rgba(0,212,255,0.7)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>
              Capital Provider
            </span>
          </div>
        </Link>
      </div>

      {/* Main nav */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.route}
            {...item}
            icon={item.icon}
            active={pathname === item.route || (item.route !== '/financer/dashboard' && pathname.startsWith(item.route))}
            badge={BADGES[item.route]}
          />
        ))}
      </nav>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 12px' }} />

      {/* Bottom nav */}
      <div style={{ padding: '12px 12px' }}>
        {BOTTOM_ITEMS.map((item) => (
          <NavItem key={item.route} {...item} icon={item.icon} active={pathname === item.route} />
        ))}
      </div>

      {/* Mobile close button — uses .cl-sidebar-close from globals.css (hidden on desktop) */}
      <button
        className="cl-sidebar-close"
        onClick={close}
        style={{
          position: 'absolute', top: 14, right: 14,
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8, width: 30, height: 30,
          alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'rgba(255,255,255,0.6)',
        }}
        aria-label="Close menu"
      >
        <X size={14} />
      </button>

      {/* Institution strip */}
      <div style={{ padding: '12px 16px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/financer/settings" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', transition: 'background 0.12s', textDecoration: 'none' }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
        >
          <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,212,255,0.3))', border: '1px solid rgba(0,212,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#00D4FF' }}>
            S
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Stanbic IBTC</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Capital provider</p>
          </div>
          <ChevronRight size={13} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
        </Link>
      </div>
    </aside>
    </>
  );
}
