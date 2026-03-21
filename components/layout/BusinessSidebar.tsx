'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard, ShieldCheck, TrendingUp, ArrowLeftRight,
  Database, FileText, Banknote, Handshake, BarChart2, Settings,
  Building2, Bell, Scale, ChevronRight, MessageSquare,
  Plus, Crown, Shield, Eye, Check, LogOut, User,
  ChevronUp, ChevronDown, X,
} from 'lucide-react';
import { useActiveBusiness, MEMBERSHIPS, type BusinessRole } from '@/lib/business-context';
import { useMobileNav } from '@/lib/mobile-nav-context';

/* ─────────────────────────────────────────────────────────
   NAV CONFIG
───────────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { label: 'Dashboard',          route: '/dashboard',          icon: LayoutDashboard },
  { label: 'Financial Identity', route: '/financial-identity', icon: ShieldCheck, accent: true },
  { label: 'Financial Analysis', route: '/financial-analysis', icon: TrendingUp },
  { label: 'Transactions',       route: '/transactions',       icon: ArrowLeftRight },
  { label: 'Data Sources',       route: '/data-sources',       icon: Database },
  { label: 'Documents',          route: '/documents',          icon: FileText },
  { label: 'Business Profile',   route: '/business-profile',   icon: Building2 },
  { label: 'Financing',          route: '/financing',          icon: Banknote },
  { label: 'Financers',          route: '/financers',          icon: Handshake },
  { label: 'Messages',           route: '/messages',           icon: MessageSquare },
  { label: 'Reports',            route: '/reports',            icon: BarChart2 },
  { label: 'Notifications',      route: '/notifications',      icon: Bell },
  { label: 'Disputes',           route: '/disputes',           icon: Scale },
];
const BOTTOM_ITEMS = [{ label: 'Settings', route: '/settings', icon: Settings }];

/* ─────────────────────────────────────────────────────────
   HELPERS
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

const ROLE_ICONS: Record<BusinessRole, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  owner:  Crown,
  admin:  Shield,
  viewer: Eye,
};
const ROLE_COLORS: Record<BusinessRole, string> = {
  owner: '#f97316', admin: '#60a5fa', viewer: 'rgba(255,255,255,0.3)',
};

function ScoreDot({ score }: { score?: number }) {
  if (!score) return null;
  const color = score >= 700 ? '#34d399' : score >= 600 ? '#fbbf24' : '#f87171';
  return <span style={{ fontSize: 9, fontWeight: 700, color, letterSpacing: '0.02em' }}>{score}</span>;
}

/* ─────────────────────────────────────────────────────────
   NAV ITEM
───────────────────────────────────────────────────────── */
function NavItem({
  label, route, icon: Icon, active, accent, badge,
}: {
  label: string; route: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  active: boolean; accent?: boolean; badge?: number;
}) {
  return (
    <Link href={route} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: active ? 600 : 500, color: active ? 'white' : 'rgba(255,255,255,0.5)', background: active ? 'rgba(255,255,255,0.08)' : 'transparent', textDecoration: 'none', transition: 'all 0.12s ease', position: 'relative' as const }}
      onMouseEnter={(e) => { if (!active) { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.85)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; } }}
      onMouseLeave={(e) => { if (!active) { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; } }}>
      {active && <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 16, borderRadius: '0 2px 2px 0', background: accent ? '#00D4FF' : 'rgba(255,255,255,0.6)' }} />}
      <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
      <span style={{ flex: 1 }}>{label}</span>
      {accent && active && <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', color: '#00D4FF', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', padding: '2px 6px', borderRadius: 9999, textTransform: 'uppercase' as const }}>Core</span>}
      {badge && badge > 0 && <span style={{ minWidth: 18, height: 18, borderRadius: 9999, background: '#EF4444', color: 'white', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{badge > 99 ? '99+' : badge}</span>}
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────
   BUSINESS SWITCHER
───────────────────────────────────────────────────────── */
function BusinessSwitcher() {
  const { activeBusiness, currentUser, switchBusiness, isSwitching } = useActiveBusiness();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSwitch = async (bizId: string) => {
    setOpen(false);
    await switchBusiness(bizId);
  };

  const RoleIcon = ROLE_ICONS[activeBusiness.role];

  return (
    <div ref={ref} style={{ position: 'relative' as const }}>

      {/* ── PANEL (open) ── */}
      {open && (
        <div style={{ position: 'absolute' as const, bottom: '100%', left: 0, right: 0, background: '#0d2d4a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px 12px 0 0', overflow: 'hidden', boxShadow: '0 -8px 32px rgba(0,0,0,0.3)', zIndex: 60 }}>

          <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Your businesses</p>
          </div>

          <div style={{ padding: '6px 0' }}>
            {MEMBERSHIPS.map(biz => {
              const isActive    = biz.business_id === activeBusiness.business_id;
              const isSw        = isSwitching && !isActive;
              const BizRoleIcon = ROLE_ICONS[biz.role];
              return (
                <button key={biz.business_id} onClick={() => handleSwitch(biz.business_id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', background: isActive ? 'rgba(0,212,255,0.06)' : 'transparent', border: 'none', cursor: isSw ? 'wait' : 'pointer', opacity: isSw ? 0.5 : 1, transition: 'all 0.12s', textAlign: 'left' as const }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: biz.avatarGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: 'white' }}>
                    {biz.initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, textAlign: 'left' as const }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: isActive ? 'white' : 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>{biz.shortName}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <BizRoleIcon size={8} style={{ color: ROLE_COLORS[biz.role] }} />
                      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>{biz.sector}</p>
                      {biz.cl_score && <><span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>·</span><ScoreDot score={biz.cl_score} /></>}
                    </div>
                  </div>
                  {isActive ? <Check size={12} style={{ color: '#00D4FF', flexShrink: 0 }} /> : null}
                </button>
              );
            })}
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 14px' }} />
          <div style={{ padding: '6px 0 4px' }}>
            <Link href="/new-business" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', textDecoration: 'none', transition: 'background 0.12s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
              <div style={{ width: 30, height: 30, borderRadius: 7, flexShrink: 0, background: 'rgba(255,255,255,0.06)', border: '1px dashed rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={13} style={{ color: 'rgba(255,255,255,0.4)' }} />
              </div>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Add a business</p>
            </Link>
            <Link href="/select-business" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', textDecoration: 'none', transition: 'background 0.12s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
              <div style={{ width: 30, height: 30, borderRadius: 7, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={12} style={{ color: 'rgba(255,255,255,0.3)' }} />
              </div>
              <p style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.35)' }}>Manage all businesses</p>
            </Link>
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 14px' }} />

          {/* User row */}
          <div style={{ padding: '10px 14px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#00D4FF' }}>
              {currentUser.initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.65)', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser.full_name}</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser.email}</p>
            </div>
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              <Link href="/settings" title="Account settings" style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'}>
                <User size={11} />
              </Link>
              <button title="Sign out"
                style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.15)'; (e.currentTarget as HTMLElement).style.color = '#f87171'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)'; }}>
                <LogOut size={11} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TRIGGER BUTTON ── */}
      <button onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', background: open ? 'rgba(255,255,255,0.06)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' as const, borderRadius: open ? 0 : 8, transition: 'all 0.12s' }}
        onMouseEnter={e => { if (!open) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
        onMouseLeave={e => { if (!open) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: activeBusiness.avatarGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: 'white', position: 'relative' as const }}>
          {activeBusiness.initials}
          {isSwitching && (
            <div style={{ position: 'absolute' as const, inset: 0, borderRadius: 8, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="12" height="12" viewBox="0 0 14 14" style={{ animation: 'spin 1s linear infinite' }}>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <circle cx="7" cy="7" r="5.5" stroke="white" strokeWidth="2" strokeDasharray="10 25" fill="none" />
              </svg>
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: isSwitching ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis', transition: 'color 0.15s' }}>
            {isSwitching ? 'Switching…' : activeBusiness.shortName}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <RoleIcon size={8} style={{ color: ROLE_COLORS[activeBusiness.role] }} />
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentUser.full_name.split(' ')[0]}
            </p>
          </div>
        </div>
        {open
          ? <ChevronDown size={13} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
          : <ChevronUp   size={13} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
        }
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────────────────────── */
export function BusinessSidebar() {
  const pathname  = usePathname();
  const { isOpen, close } = useMobileNav();
  const BADGES: Record<string, number> = { '/messages': 2 };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`cl-sidebar-backdrop${isOpen ? ' cl-sidebar-open' : ''}`}
        onClick={close}
        aria-hidden="true"
      />

      <aside
        className={`cl-sidebar${isOpen ? ' cl-sidebar-open' : ''}`}
        style={{
          width: 240,
          minHeight: '100vh',
          background: '#0A2540',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 50,
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Header row: logo + mobile close button */}
        <div style={{ height: 64, display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', flex: 1 }}>
            <LogoMark />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'white', letterSpacing: '-0.03em' }}>Creditlinker</span>
          </Link>
          {/* Close button — only visible on mobile via CSS */}
          <button
            className="cl-sidebar-close"
            onClick={close}
            aria-label="Close navigation"
            style={{
              width: 28, height: 28, borderRadius: 7,
              background: 'rgba(255,255,255,0.08)',
              border: 'none', cursor: 'pointer',
              alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.6)', flexShrink: 0,
            }}
          >
            <X size={14} />
          </button>
        </div>

        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' as const }}>
          {NAV_ITEMS.map(item => (
            <NavItem key={item.route} {...item} icon={item.icon} active={pathname === item.route} badge={BADGES[item.route]} />
          ))}
        </nav>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 12px' }} />
        <div style={{ padding: '12px 12px 0' }}>
          {BOTTOM_ITEMS.map(item => (
            <NavItem key={item.route} {...item} icon={item.icon} active={pathname === item.route} />
          ))}
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 4 }}>
          <BusinessSwitcher />
        </div>
      </aside>
    </>
  );
}
