'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell, Search, Settings, LogOut,
  ChevronDown, X,
  LayoutDashboard, Key, Package, BookOpen,
  Code2, Webhook, FlaskConical, Activity,
  ScrollText, LifeBuoy,
} from 'lucide-react';

const ROUTE_TITLES: Record<string, string> = {
  '/developers':                  'Overview',
  '/developers/api-keys':         'API Keys',
  '/developers/sdks':             'SDKs',
  '/developers/docs':             'Documentation',
  '/developers/api-reference':    'API Reference',
  '/developers/webhooks':         'Webhooks',
  '/developers/sandbox':          'Sandbox',
  '/developers/usage':            'Usage',
  '/developers/logs':             'Request Logs',
  '/developers/support':          'Developer Support',
  '/developers/settings':         'Settings',
};

const MENU_ITEMS = [
  { label: 'Settings', href: '/developers/settings', icon: <Settings size={13} /> },
  { label: 'Support',  href: '/developers/support',  icon: <LifeBuoy  size={13} /> },
];

const SEARCH_LINKS = [
  { label: 'Overview',      href: '/developers',                icon: <LayoutDashboard size={14} /> },
  { label: 'API Keys',      href: '/developers/api-keys',       icon: <Key             size={14} /> },
  { label: 'SDKs',          href: '/developers/sdks',           icon: <Package         size={14} /> },
  { label: 'Documentation', href: '/developers/docs',           icon: <BookOpen        size={14} /> },
  { label: 'API Reference', href: '/developers/api-reference',  icon: <Code2           size={14} /> },
  { label: 'Webhooks',      href: '/developers/webhooks',       icon: <Webhook         size={14} /> },
  { label: 'Sandbox',       href: '/developers/sandbox',        icon: <FlaskConical    size={14} /> },
  { label: 'Usage',         href: '/developers/usage',          icon: <Activity        size={14} /> },
  { label: 'Logs',          href: '/developers/logs',           icon: <ScrollText      size={14} /> },
  { label: 'Support',       href: '/developers/support',        icon: <LifeBuoy        size={14} /> },
  { label: 'Settings',      href: '/developers/settings',       icon: <Settings        size={14} /> },
];

export function DeveloperTopNav() {
  const pathname   = usePathname();
  const router     = useRouter();
  const title      = ROUTE_TITLES[pathname] ?? 'Developer Portal';

  const [open,       setOpen]       = useState(false);
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
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => { setOpen(false); setSearchOpen(false); }, [pathname]);

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
    }}>

      {/* Page title */}
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: 16,
        color: '#0A2540',
        letterSpacing: '-0.02em',
        margin: 0,
      }}>
        {title}
      </h1>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

        {/* Search */}
        <div ref={searchRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setSearchOpen(v => !v)}
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
              width: 280, overflow: 'hidden', zIndex: 100,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid #F3F4F6' }}>
                <Search size={13} style={{ color: '#9CA3AF', flexShrink: 0 }} />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => {
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
                  <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex', padding: 0 }}>
                    <X size={13} />
                  </button>
                )}
              </div>
              <div style={{ maxHeight: 280, overflowY: 'auto' as const, padding: '6px 0' }}>
                {filtered.length === 0 ? (
                  <p style={{ padding: '12px 16px', fontSize: 13, color: '#9CA3AF' }}>No pages match.</p>
                ) : (
                  filtered.map(link => (
                    <Link
                      key={link.href}
                      href={link.href}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '9px 16px', textDecoration: 'none',
                        fontSize: 13, fontWeight: pathname === link.href ? 600 : 400,
                        color: pathname === link.href ? '#0A2540' : '#374151',
                        background: pathname === link.href ? '#F9FAFB' : 'transparent',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => { if (pathname !== link.href) (e.currentTarget as HTMLElement).style.background = '#F9FAFB'; }}
                      onMouseLeave={e => { if (pathname !== link.href) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      <span style={{ color: '#9CA3AF' }}>{link.icon}</span>
                      {link.label}
                      {pathname === link.href && (
                        <span style={{ marginLeft: 'auto', fontSize: 10, color: '#9CA3AF' }}>Current</span>
                      )}
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <button style={{
          width: 34, height: 34, borderRadius: 8,
          border: '1px solid #E5E7EB', background: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#6B7280', transition: 'all 0.12s',
          position: 'relative',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#0A2540'; (e.currentTarget as HTMLElement).style.color = '#0A2540'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'; (e.currentTarget as HTMLElement).style.color = '#6B7280'; }}
          aria-label="Notifications"
        >
          <Bell size={14} />
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 22, background: '#E5E7EB', margin: '0 4px' }} />

        {/* Avatar + dropdown */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setOpen(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '4px 8px 4px 4px', borderRadius: 8,
              border: `1px solid ${open ? '#0A2540' : '#E5E7EB'}`,
              background: open ? '#F9FAFB' : 'white',
              cursor: 'pointer', transition: 'all 0.12s',
            }}
          >
            <div style={{
              width: 26, height: 26, borderRadius: 6,
              background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(0,212,255,0.3))',
              border: '1px solid rgba(0,212,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#0A5060', flexShrink: 0,
            }}>
              D
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0A2540' }}>
              dev@mycompany.io
            </span>
            <ChevronDown
              size={13}
              style={{
                color: '#9CA3AF',
                transform: open ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.15s',
              }}
            />
          </button>

          {open && (
            <div style={{
              position: 'absolute', top: 42, right: 0,
              background: 'white', border: '1px solid #E5E7EB',
              borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              minWidth: 220, overflow: 'hidden', zIndex: 100,
            }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #F3F4F6' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#0A2540', marginBottom: 2 }}>Developer Account</p>
                <p style={{ fontSize: 12, color: '#9CA3AF' }}>dev@mycompany.io</p>
                <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Free plan · Sandbox environment</p>
              </div>
              <div style={{ padding: '6px 0' }}>
                {MENU_ITEMS.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 16px', fontSize: 13, fontWeight: 500,
                      color: pathname === item.href ? '#0A2540' : '#374151',
                      background: pathname === item.href ? '#F9FAFB' : 'transparent',
                      textDecoration: 'none', transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => { if (pathname !== item.href) (e.currentTarget as HTMLElement).style.background = '#F9FAFB'; }}
                    onMouseLeave={e => { if (pathname !== item.href) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <span style={{ color: '#9CA3AF' }}>{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
              <div style={{ borderTop: '1px solid #F3F4F6', padding: '6px 0' }}>
                <button
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '9px 16px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 500, color: '#EF4444',
                    textAlign: 'left' as const, transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#FEF2F2')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
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
