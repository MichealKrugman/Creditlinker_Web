'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'For Businesses', href: '/for-businesses' },
  { label: 'For Financers', href: '/for-financers' },
  { label: 'For Developers', href: '/for-developers' },
  { label: 'Pricing', href: '/pricing' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const AUTH_ROUTES = ['/login', '/register'];
  const isAuthPage = AUTH_ROUTES.includes(pathname);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  if (isAuthPage) return null;

  return (
    <>
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: 'var(--header-height)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 var(--space-8)',
          transition: 'background var(--transition-base), box-shadow var(--transition-base), border-color var(--transition-base)',
          background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          boxShadow: scrolled ? 'var(--shadow-sm)' : 'none',
          borderBottom: scrolled ? '1px solid var(--color-border)' : '1px solid transparent',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            maxWidth: 'var(--max-width-content)',
            margin: '0 auto',
          }}
        >
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', textDecoration: 'none' }}>
            <LogoMark />
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: 'var(--text-lg)',
                color: 'var(--color-primary)',
                letterSpacing: '-0.03em',
              }}
            >
              Creditlinker
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }} className="desktop-nav">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  padding: 'var(--space-2) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 500,
                  color: pathname === link.href ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  background: pathname === link.href ? 'var(--color-accent-dim)' : 'transparent',
                  transition: 'all var(--transition-fast)',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (pathname !== link.href) {
                    (e.target as HTMLElement).style.color = 'var(--color-primary)';
                    (e.target as HTMLElement).style.background = 'var(--color-border-subtle)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (pathname !== link.href) {
                    (e.target as HTMLElement).style.color = 'var(--color-text-secondary)';
                    (e.target as HTMLElement).style.background = 'transparent';
                  }
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auth CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }} className="desktop-nav">
            <Link
              href="/login"
              style={{
                padding: 'var(--space-2) var(--space-4)',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                color: 'var(--color-text-secondary)',
                borderRadius: 'var(--radius-md)',
                transition: 'color var(--transition-fast)',
              }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = 'var(--color-primary)')}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'var(--color-text-secondary)')}
            >
              Log in
            </Link>
            <Link
              href="/register"
              style={{
                padding: 'var(--space-2) var(--space-5)',
                background: 'var(--color-primary)',
                color: 'var(--color-text-inverse)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                letterSpacing: '0.01em',
                transition: 'all var(--transition-fast)',
                boxShadow: 'var(--shadow-sm)',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = 'var(--color-primary-light)';
                (e.target as HTMLElement).style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = 'var(--color-primary)';
                (e.target as HTMLElement).style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            style={{
              display: 'none',
              flexDirection: 'column',
              gap: '5px',
              padding: 'var(--space-2)',
              borderRadius: 'var(--radius-md)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span style={{ display: 'block', width: 22, height: 2, background: 'var(--color-primary)', borderRadius: 2, transition: 'all var(--transition-fast)', transform: menuOpen ? 'rotate(45deg) translate(5px,5px)' : 'none' }} />
            <span style={{ display: 'block', width: 22, height: 2, background: 'var(--color-primary)', borderRadius: 2, transition: 'all var(--transition-fast)', opacity: menuOpen ? 0 : 1 }} />
            <span style={{ display: 'block', width: 22, height: 2, background: 'var(--color-primary)', borderRadius: 2, transition: 'all var(--transition-fast)', transform: menuOpen ? 'rotate(-45deg) translate(5px,-5px)' : 'none' }} />
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99,
            background: 'rgba(255,255,255,0.98)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            padding: 'calc(var(--header-height) + var(--space-8)) var(--space-8) var(--space-8)',
            gap: 'var(--space-2)',
          }}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              style={{
                padding: 'var(--space-4)',
                fontSize: 'var(--text-lg)',
                fontWeight: 600,
                fontFamily: 'var(--font-display)',
                color: 'var(--color-primary)',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              {link.label}
            </Link>
          ))}
          <div style={{ marginTop: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <Link href="/login" onClick={() => setMenuOpen(false)} style={{ padding: 'var(--space-4)', textAlign: 'center', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontWeight: 600, color: 'var(--color-primary)' }}>Log in</Link>
            <Link href="/register" onClick={() => setMenuOpen(false)} style={{ padding: 'var(--space-4)', textAlign: 'center', background: 'var(--color-primary)', borderRadius: 'var(--radius-md)', fontWeight: 600, color: '#fff' }}>Get Started</Link>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}

function LogoMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="28" height="28" rx="7" fill="#0A2540"/>
      <path d="M7 14C7 10.134 10.134 7 14 7V7C17.866 7 21 10.134 21 14V14" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round"/>
      <path d="M7 14C7 17.866 10.134 21 14 21H21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="14" cy="14" r="2.5" fill="#00D4FF"/>
    </svg>
  );
}
