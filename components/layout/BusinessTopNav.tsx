'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell, Search, Settings, LogOut, User, Menu,
  Building2, ChevronDown, FileText, X,
  LayoutDashboard, ShieldCheck, TrendingUp,
  ArrowLeftRight, Database, Banknote, Handshake,
  BarChart2, Bell as BellIcon, Scale, ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { useActiveBusiness } from '@/lib/business-context';
import { useMobileNav } from '@/lib/mobile-nav-context';

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard':          'Dashboard',
  '/financial-identity': 'Financial Identity',
  '/financial-analysis': 'Financial Analysis',
  '/transactions':       'Transactions',
  '/data-sources':       'Data Sources',
  '/documents':          'Documents',
  '/business-profile':   'Business Profile',
  '/financing':          'Financing',
  '/financers':          'Financers',
  '/reports':            'Reports',
  '/notifications':      'Notifications',
  '/disputes':           'Disputes',
  '/settings':           'Settings',
};

const SEARCH_LINKS = [
  { label: 'Dashboard',          href: '/dashboard',          icon: <LayoutDashboard size={14} /> },
  { label: 'Financial Identity', href: '/financial-identity', icon: <ShieldCheck size={14} /> },
  { label: 'Financial Analysis', href: '/financial-analysis', icon: <TrendingUp size={14} /> },
  { label: 'Transactions',       href: '/transactions',       icon: <ArrowLeftRight size={14} /> },
  { label: 'Data Sources',       href: '/data-sources',       icon: <Database size={14} /> },
  { label: 'Documents',          href: '/documents',          icon: <FileText size={14} /> },
  { label: 'Business Profile',   href: '/business-profile',   icon: <Building2 size={14} /> },
  { label: 'Financing',          href: '/financing',          icon: <Banknote size={14} /> },
  { label: 'Financers',          href: '/financers',          icon: <Handshake size={14} /> },
  { label: 'Reports',            href: '/reports',            icon: <BarChart2 size={14} /> },
  { label: 'Notifications',      href: '/notifications',      icon: <BellIcon size={14} /> },
  { label: 'Disputes',           href: '/disputes',           icon: <Scale size={14} /> },
  { label: 'Settings',           href: '/settings',           icon: <Settings size={14} /> },
];

export function BusinessTopNav() {
  const pathname = usePathname();
  const router   = useRouter();
  const title    = ROUTE_TITLES[pathname] ?? 'Business Portal';

  const { activeBusiness, currentUser, switchBusiness } = useActiveBusiness();
  const { toggle: toggleSidebar } = useMobileNav();

  const [menuOpen,   setMenuOpen]   = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query,      setQuery]      = useState('');

  const menuRef   = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  const filtered = query.trim()
    ? SEARCH_LINKS.filter(l => l.label.toLowerCase().includes(query.toLowerCase()))
    : SEARCH_LINKS;

  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 50);
    else setQuery('');
  }, [searchOpen]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (menuRef.current  && !menuRef.current.contains(e.target as Node))  setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => { setMenuOpen(false); setSearchOpen(false); }, [pathname]);

  const scoreColor = activeBusiness.cl_score
    ? activeBusiness.cl_score >= 700 ? '#059669'
    : activeBusiness.cl_score >= 600 ? '#D97706'
    : '#EF4444'
    : '#9CA3AF';

  return (
    <header style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', background: 'white', borderBottom: '1px solid #E5E7EB', position: 'sticky', top: 0, zIndex: 40, gap: 12 }}>

      {/* Hamburger — hidden on desktop, shown on mobile via CSS */}
      <button
        className="cl-hamburger"
        onClick={toggleSidebar}
        aria-label="Open navigation menu"
      >
        <Menu size={18} />
      </button>

      {/* Page title + business context crumb */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, minWidth: 0 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: '#0A2540', letterSpacing: '-0.02em', margin: 0, lineHeight: 1 }}>{title}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: activeBusiness.avatarGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 7, fontWeight: 800, color: 'white' }}>{activeBusiness.initials.slice(0, 1)}</span>
          </div>
          <p style={{ fontSize: 11, color: '#9CA3AF', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeBusiness.name}</p>
          {activeBusiness.cl_score && (
            <><span style={{ fontSize: 10, color: '#D1D5DB', flexShrink: 0 }}>·</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: scoreColor, flexShrink: 0 }}>CL {activeBusiness.cl_score}</span></>
          )}
        </div>
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>

        {/* Search */}
        <div ref={searchRef} style={{ position: 'relative' }}>
          <button onClick={() => setSearchOpen(v => !v)}
            style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${searchOpen ? '#0A2540' : '#E5E7EB'}`, background: searchOpen ? '#F9FAFB' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: searchOpen ? '#0A2540' : '#6B7280', transition: 'all 0.12s' }}
            aria-label="Search">
            <Search size={14} />
          </button>
          {searchOpen && (
            <div style={{ position: 'absolute' as const, top: 42, right: 0, background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', width: 280, overflow: 'hidden', zIndex: 100 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid #F3F4F6' }}>
                <Search size={13} style={{ color: '#9CA3AF', flexShrink: 0 }} />
                <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="Search pages…"
                  style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#0A2540', background: 'transparent' }} />
                {query && <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex' }}><X size={12} /></button>}
              </div>
              <div style={{ maxHeight: 280, overflowY: 'auto' as const }}>
                {filtered.length === 0
                  ? <p style={{ padding: '14px 16px', fontSize: 13, color: '#9CA3AF' }}>No results</p>
                  : filtered.map(link => (
                    <Link key={link.href} href={link.href}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', textDecoration: 'none', fontSize: 13, fontWeight: pathname === link.href ? 600 : 400, color: pathname === link.href ? '#0A2540' : '#374151', background: pathname === link.href ? '#F9FAFB' : 'transparent', transition: 'background 0.1s' }}
                      onMouseEnter={e => { if (pathname !== link.href) (e.currentTarget as HTMLElement).style.background = '#F9FAFB'; }}
                      onMouseLeave={e => { if (pathname !== link.href) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                      <span style={{ color: '#9CA3AF' }}>{link.icon}</span>
                      {link.label}
                      {pathname === link.href && <span style={{ marginLeft: 'auto', fontSize: 10, color: '#9CA3AF' }}>Current</span>}
                    </Link>
                  ))
                }
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <Link href="/notifications"
          style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #E5E7EB', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6B7280', transition: 'all 0.12s', position: 'relative' as const, textDecoration: 'none' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#0A2540'; (e.currentTarget as HTMLElement).style.color = '#0A2540'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'; (e.currentTarget as HTMLElement).style.color = '#6B7280'; }}>
          <Bell size={14} />
          <span style={{ position: 'absolute' as const, top: 7, right: 7, width: 6, height: 6, borderRadius: '50%', background: '#00D4FF', border: '1.5px solid white' }} />
        </Link>

        <div style={{ width: 1, height: 22, background: '#E5E7EB', margin: '0 4px' }} />

        {/* Avatar + dropdown */}
        <div ref={menuRef} style={{ position: 'relative' as const }}>
          <button onClick={() => setMenuOpen(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px 4px 4px', borderRadius: 8, border: `1px solid ${menuOpen ? '#0A2540' : '#E5E7EB'}`, background: menuOpen ? '#F9FAFB' : 'white', cursor: 'pointer', transition: 'all 0.12s' }}>
            <div style={{ width: 26, height: 26, borderRadius: 6, background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,212,255,0.3))', border: '1px solid rgba(0,212,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#0A5060', flexShrink: 0 }}>
              {currentUser.initials}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#0A2540', lineHeight: 1 }}>{currentUser.full_name.split(' ')[0]}</span>
              <span style={{ fontSize: 10, color: '#9CA3AF', lineHeight: 1.2 }}>{activeBusiness.initials}</span>
            </div>
            <ChevronDown size={13} style={{ color: '#9CA3AF', transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
          </button>

          {menuOpen && (
            <div style={{ position: 'absolute' as const, top: 42, right: 0, background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.1)', minWidth: 260, overflow: 'hidden', zIndex: 100 }}>

              {/* Active business section */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6', background: '#F9FAFB' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 8 }}>Current business</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: activeBusiness.avatarGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: 'white', flexShrink: 0 }}>
                    {activeBusiness.initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#0A2540', marginBottom: 1 }}>{activeBusiness.name}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, color: '#6B7280', textTransform: 'capitalize' as const }}>{activeBusiness.role}</span>
                      {activeBusiness.cl_score && (
                        <><span style={{ fontSize: 10, color: '#D1D5DB' }}>·</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: scoreColor }}>CL {activeBusiness.cl_score}</span></>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Business actions */}
              <div style={{ padding: '6px 0', borderBottom: '1px solid #F3F4F6' }}>
                {[{ href: '/business-profile', icon: <Building2 size={13} />, label: 'Business Profile' }, { href: '/documents', icon: <FileText size={13} />, label: 'Documents' }].map(item => (
                  <Link key={item.href} href={item.href}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', fontSize: 13, fontWeight: 500, color: pathname === item.href ? '#0A2540' : '#374151', background: pathname === item.href ? '#F9FAFB' : 'transparent', textDecoration: 'none', transition: 'background 0.1s' }}
                    onMouseEnter={e => { if (pathname !== item.href) (e.currentTarget as HTMLElement).style.background = '#F9FAFB'; }}
                    onMouseLeave={e => { if (pathname !== item.href) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                    <span style={{ color: '#9CA3AF' }}>{item.icon}</span> {item.label}
                  </Link>
                ))}
                <Link href="/select-business"
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', fontSize: 13, fontWeight: 600, color: '#0A2540', background: 'transparent', textDecoration: 'none', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F9FAFB'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                  <RefreshCw size={13} style={{ color: '#9CA3AF' }} />
                  <span style={{ flex: 1 }}>Switch business</span>
                  <ArrowRight size={12} style={{ color: '#D1D5DB' }} />
                </Link>
              </div>

              {/* User section */}
              <div style={{ padding: '10px 16px', borderBottom: '1px solid #F3F4F6', background: '#FAFAFA' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 6 }}>Your account</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, rgba(0,212,255,0.12), rgba(0,212,255,0.22))', border: '1px solid rgba(0,212,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#0A5060', flexShrink: 0 }}>
                    {currentUser.initials}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#0A2540', marginBottom: 1 }}>{currentUser.full_name}</p>
                    <p style={{ fontSize: 11, color: '#9CA3AF' }}>{currentUser.email}</p>
                  </div>
                </div>
              </div>

              <div style={{ padding: '6px 0' }}>
                <Link href="/settings"
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', fontSize: 13, fontWeight: 500, color: pathname === '/settings' ? '#0A2540' : '#374151', background: pathname === '/settings' ? '#F9FAFB' : 'transparent', textDecoration: 'none', transition: 'background 0.1s' }}
                  onMouseEnter={e => { if (pathname !== '/settings') (e.currentTarget as HTMLElement).style.background = '#F9FAFB'; }}
                  onMouseLeave={e => { if (pathname !== '/settings') (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                  <Settings size={13} style={{ color: '#9CA3AF' }} /> Account Settings
                </Link>
              </div>

              <div style={{ borderTop: '1px solid #F3F4F6', padding: '6px 0' }}>
                <button
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#EF4444', textAlign: 'left' as const, transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#FEF2F2')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                  <LogOut size={13} /> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
