'use client';
import Link from 'next/link';

const GROUPS = [
  {
    heading: 'Product',
    links: [
      { label: 'How It Works',        href: '/how-it-works' },
      { label: 'Financial Identity',  href: '/what-is-financial-identity' },
      { label: 'Security',            href: '/security' },
      { label: 'Pricing',             href: '/pricing' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About',    href: '/about' },
      { label: 'Blog',     href: '/blog' },
      { label: 'Careers',  href: '/careers' },
      { label: 'Contact',  href: '/contact' },
    ],
  },
  {
    heading: 'Solutions',
    links: [
      { label: 'For Businesses',  href: '/for-businesses' },
      { label: 'For Financers',   href: '/for-financers' },
      { label: 'For Developers',  href: '/for-developers' },
      { label: 'Documentation',   href: '/docs' },
    ],
  },
];

export function Footer() {
  return (
    <footer style={{ background: 'var(--color-primary-dark)', color: 'white', marginTop: 'auto' }}>
      <style>{`
        .ft-inner {
          max-width: var(--max-width-content);
          margin: 0 auto;
          padding: 48px 40px 28px;
        }
        .ft-top {
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr 1fr;
          gap: 40px;
          padding-bottom: 32px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .ft-link {
          font-size: 13px;
          color: rgba(255,255,255,0.5);
          display: block;
          margin-bottom: 10px;
          transition: color 0.15s;
        }
        .ft-link:hover { color: white; }
        .ft-heading {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.3);
          margin-bottom: 14px;
        }
        .ft-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 20px;
          font-size: 12px;
          color: rgba(255,255,255,0.3);
        }
        .ft-legal { display: flex; gap: 20px; }
        .ft-legal a { color: rgba(255,255,255,0.3); transition: color 0.15s; }
        .ft-legal a:hover { color: rgba(255,255,255,0.6); }
        /* Desktop: link groups are direct children of the grid */
        .ft-links-grid { display: contents; }

        /* Tablet */
        @media (max-width: 860px) {
          .ft-inner { padding: 40px 24px 24px; }
          .ft-top {
            grid-template-columns: 1fr 1fr;
            gap: 28px;
          }
        }

        /* Mobile */
        @media (max-width: 600px) {
          .ft-inner { padding: 28px 20px 20px; }
          .ft-top {
            grid-template-columns: 1fr;
            gap: 0;
            padding-bottom: 20px;
          }
          /* Brand row: one line, then 3-col link grid immediately below */
          .ft-brand { margin-bottom: 20px; }
          .ft-brand-desc { display: none; }
          .ft-links-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0 8px;
          }
          .ft-heading { margin-bottom: 8px; font-size: 9px; }
          .ft-link { font-size: 12px; margin-bottom: 8px; }
          .ft-bottom {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
            padding-top: 16px;
            font-size: 11px;
          }
          .ft-legal { flex-wrap: wrap; gap: 8px 12px; }
        }
      `}</style>

      <div className="ft-inner">
        <div className="ft-top">

          {/* Brand */}
          <div className="ft-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <FooterLogo />
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, letterSpacing: '-0.03em' }}>
                Creditlinker
              </span>
            </div>
            <p className="ft-brand-desc" style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, marginBottom: 16, maxWidth: 260 }}>
              Financial identity infrastructure for African businesses.
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              {['Twitter', 'LinkedIn'].map((p) => (
                <a key={p} href="#" style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '5px 10px', transition: 'color 0.15s' }}>{p}</a>
              ))}
            </div>
          </div>

          {/* Link groups — desktop: individual columns, mobile: merged 3-col grid */}
          <div className="ft-links-grid">
            {GROUPS.map(({ heading, links }) => (
              <div key={heading}>
                <p className="ft-heading">{heading}</p>
                {links.map((l) => (
                  <Link key={l.href} href={l.href} className="ft-link">{l.label}</Link>
                ))}
              </div>
            ))}
          </div>

        </div>

        {/* Bottom */}
        <div className="ft-bottom">
          <span>© {new Date().getFullYear()} Creditlinker</span>
          <div className="ft-legal">
            {['Privacy', 'Terms', 'Cookies'].map((item) => (
              <a key={item} href="#">{item}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="7" fill="rgba(255,255,255,0.1)"/>
      <path d="M7 14C7 10.134 10.134 7 14 7C17.866 7 21 10.134 21 14" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round"/>
      <path d="M7 14C7 17.866 10.134 21 14 21H21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="14" cy="14" r="2.5" fill="#00D4FF"/>
    </svg>
  );
}
