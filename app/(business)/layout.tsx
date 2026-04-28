import { BusinessSidebar } from '@/components/layout/BusinessSidebar';
import { BusinessTopNav } from '@/components/layout/BusinessTopNav';
import { BusinessProvider } from '@/lib/business-context';
import { MobileNavProvider } from '@/lib/mobile-nav-context';
import { MessageCountProvider } from '@/lib/message-count-context';
import AuthGuard from '@/components/AuthGuard';

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredAccountType="business">
      <BusinessProvider>
        <MessageCountProvider>
        <MobileNavProvider>
        <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F7FA' }}>

          {/* Sidebar (becomes overlay on mobile) */}
          <BusinessSidebar />

          {/* Main — offset by sidebar on desktop, full-width on mobile */}
          <div
            className="cl-main"
            style={{
              flex: 1,
              marginLeft: 240,
              display: 'flex',
              flexDirection: 'column',
              minHeight: '100vh',
              minWidth: 0,
            }}
          >
            <BusinessTopNav />

            <main
              className="cl-main-content"
              style={{
                flex: 1,
                padding: '28px 28px',
                maxWidth: 1200,
                width: '100%',
                boxSizing: 'border-box' as const,
                minWidth: 0,
              }}
            >
              {children}
            </main>
          </div>

        </div>
        </MobileNavProvider>
        </MessageCountProvider>
      </BusinessProvider>
    </AuthGuard>
  );
}
