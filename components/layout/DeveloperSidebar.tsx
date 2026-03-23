'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Key, Package, BookOpen,
  Code2, Webhook, FlaskConical, Activity,
  ScrollText, LifeBuoy, Settings, ChevronRight,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────
   NAV CONFIG
───────────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { label: 'Overview',      route: '/developers/overview',       icon: LayoutDashboard },
  { label: 'API Keys',      route: '/developers/api-keys',       icon: Key },
  { label: 'SDKs',          route: '/developers/sdks',           icon: Package },
  { label: 'Documentation', route: '/developers/docs',           icon: BookOpen },
  { label: 'API Reference', route: '/developers/api-reference',  icon: Code2 },
  { label: 'Webhooks',      route: '/developers/webhooks',       icon: Webhook },
  { label: 'Sandbox',       route: '/developers/sandbox',        icon: FlaskConical, accent: true },
  { label: 'Usage',         route: '/developers/usage',          icon: Activity },
  { label: 'Logs',          route: '/developers/logs',           icon: ScrollText },
];

const BOTTOM_ITEMS = [
  { label: 'Support',  route: '/developers/support',  icon: LifeBuoy },
  { label: 'Settings', route: '/developers/settings', icon: Settings },
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
  label, route, icon: Icon, active, accent, onClick,
}: {
  label: string; route: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  active: boolean; accent?: boolean; onClick?: () => void;
}) {
  return (
    <Link
      href={route}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 12px',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: active ? 600 : 500,
        color: active ? 'white' : 'rgba(255,255,255,0.5)',
        background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
        textDecoration: 'none',
        transition: 'all 0.12s ease',
        position: 'relative',
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
      {/* Active indicator */}
      {active && (
        <span style={{
          position: 'absolute',
          left: 0, top: '50%',
          transform: 'translateY(-50%)',
          width: 3, height: 16,
          borderRadius: '0 2px 2px 0',
          background: accent ? '#00D4FF' : 'rgba(255,255,255,0.6)',
        }} />
      )}

      <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
      <span style={{ flex: 1 }}>{label}</span>

      {/* Accent pill for Sandbox */}
      {accent && active && (
        <span style={{
          fontSize: 9, fontWeight: 700,
          letterSpacing: '0.06em',
          color: '#00D4FF',
          background: 'rgba(0,212,255,0.1)',
          border: '1px solid rgba(0,212,255,0.2)',
          padding: '2px 6px',
          borderRadius: 9999,
          textTransform: 'uppercase',
        }}>
          Test
        </span>
      )}
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────────────────────── */
export function DeveloperSidebar({ isOpen = false, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();

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
      transform: isOpen ? 'translateX(0)' : undefined,
      transition: 'transform 0.25s ease',
    }}
      className="dev-sidebar"
    >
      <style>{`
        @media (max-width: 768px) {
          .dev-sidebar { transform: ${isOpen ? 'translateX(0)' : 'translateX(-100%)'}; }
        }
      `}</style>

      {/* Logo */}
      <div style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <Link href="/developers/overview" style={{
          display: 'flex', alignItems: 'center', gap: 9,
          textDecoration: 'none',
        }}>
          <LogoMark />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 15,
              color: 'white',
              letterSpacing: '-0.03em',
              lineHeight: 1,
            }}>
              Creditlinker
            </span>
            <span style={{
              fontSize: 9,
              fontWeight: 700,
              color: '#00D4FF',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}>
              Developers
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
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.route}
            {...item}
            active={pathname === item.route}
            onClick={onClose}
          />
        ))}
      </nav>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 12px' }} />

      {/* Bottom nav */}
      <div style={{ padding: '12px 12px' }}>
        {BOTTOM_ITEMS.map((item) => (
          <NavItem
            key={item.route}
            {...item}
            active={pathname === item.route}
          />
        ))}
      </div>

      {/* Developer account strip */}
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
          <div style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,212,255,0.3))',
            border: '1px solid rgba(0,212,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: '#00D4FF',
          }}>
            D
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              dev@mycompany.io
            </p>
            <p style={{
              fontSize: 11, color: 'rgba(255,255,255,0.3)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              Developer account · Free plan
            </p>
          </div>
          <ChevronRight size={13} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
        </div>
      </div>
    </aside>
  );
}
