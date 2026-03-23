'use client';

import { useState } from 'react';
import { DeveloperSidebar } from '@/components/layout/DeveloperSidebar';
import { DeveloperTopNav } from '@/components/layout/DeveloperTopNav';

export default function DeveloperLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F7FA' }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 49,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Sidebar */}
      <DeveloperSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main — offset by sidebar width on desktop only */}
      <div style={{
        flex: 1,
        marginLeft: 240,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        minWidth: 0,
      }}
        className="dev-main"
      >
        <style>{`
          @media (max-width: 768px) {
            .dev-main { margin-left: 0 !important; }
          }
        `}</style>

        <DeveloperTopNav onMenuToggle={() => setSidebarOpen(v => !v)} />

        <main style={{
          flex: 1,
          padding: '28px 28px',
          maxWidth: 1200,
          width: '100%',
          boxSizing: 'border-box',
        }}
          className="dev-main-pad"
        >
          <style>{`
            @media (max-width: 768px) {
              .dev-main-pad { padding: 16px !important; }
            }
          `}</style>
          {children}
        </main>
      </div>

    </div>
  );
}
