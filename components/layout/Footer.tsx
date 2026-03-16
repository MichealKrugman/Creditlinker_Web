'use client';
import Link from 'next/link';

const FOOTER_LINKS = {
  Product: [
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'Financial Identity', href: '/financial-identity' },
    { label: 'Security', href: '/security' },
    { label: 'Pricing', href: '/pricing' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Careers', href: '/careers' },
    { label: 'Contact', href: '/contact' },
  ],
  Solutions: [
    { label: 'For Businesses', href: '/for-businesses' },
    { label: 'For Financers', href: '/for-financers' },
    { label: 'For Developers', href: '/for-developers' },
    { label: 'Documentation', href: '/docs' },
  ],
};

export function Footer() {
  return (
    <footer
      style={{
        background: 'var(--color-primary-dark)',
        color: 'var(--color-text-inverse)',
        padding: 'var(--space-20) var(--space-8) var(--space-12)',
        marginTop: 'auto',
      }}
    >
      <div
        style={{
          maxWidth: 'var(--max-width-content)',
          margin: '0 auto',
        }}
      >
        {/* Top row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr repeat(3, auto)',
            gap: 'var(--space-16)',
            paddingBottom: 'var(--space-16)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
          className="footer-grid"
        >
          {/* Brand */}
          <div style={{ maxWidth: 300 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
              <FooterLogo />
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-lg)', letterSpacing: '-0.03em' }}>
                Creditlinker
              </span>
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: 'var(--space-6)' }}>
              Financial identity infrastructure for businesses. Build a verified financial identity from your real transaction data.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              {['Twitter', 'LinkedIn'].map((platform) => (
                <a
                  key={platform}
                  href="#"
                  style={{
                    padding: 'var(--space-2) var(--space-3)',
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.5)',
                    transition: 'all var(--transition-fast)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {platform}
                </a>
              ))}
            </div>
          </div>

          {/* Link groups */}
          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group}>
              <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 'var(--space-5)' }}>
                {group}
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      style={{ fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,0.55)', transition: 'color var(--transition-fast)' }}
                      onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#fff')}
                      onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.55)')}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 'var(--space-8)',
            fontSize: 'var(--text-xs)',
            color: 'rgba(255,255,255,0.3)',
          }}
        >
          <span>© {new Date().getFullYear()} Creditlinker. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 'var(--space-6)' }}>
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item) => (
              <a key={item} href="#" style={{ color: 'rgba(255,255,255,0.3)', transition: 'color var(--transition-fast)' }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.7)')}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.3)')}>
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: var(--space-10) !important;
          }
        }
        @media (max-width: 600px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  );
}

function FooterLogo() {
  return (
    <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="7" fill="rgba(255,255,255,0.1)"/>
      <path d="M7 14C7 10.134 10.134 7 14 7C17.866 7 21 10.134 21 14" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round"/>
      <path d="M7 14C7 17.866 10.134 21 14 21H21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="14" cy="14" r="2.5" fill="#00D4FF"/>
    </svg>
  );
}
