import { FinancerSidebar } from '@/components/layout/FinancerSidebar';
import { FinancerTopNav } from '@/components/layout/FinancerTopNav';
import { MobileNavProvider } from '@/lib/mobile-nav-context';
import AuthGuard from '@/components/AuthGuard';

export default function FinancerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredAccountType="financer">
      <MobileNavProvider>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F7FA' }}>

        <FinancerSidebar />

        {/* cl-main gives margin-left:240px on desktop, 0 on mobile via globals.css */}
        <div className="cl-main" style={{
          flex: 1,
          marginLeft: 240,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          minWidth: 0,
        }}>
          <FinancerTopNav />

          {/* cl-main-content gives 28px padding on desktop, 16px on mobile via globals.css */}
          <main className="cl-main-content" style={{
            flex: 1,
            padding: '28px 28px',
            maxWidth: 1200,
            width: '100%',
            boxSizing: 'border-box',
          }}>
            {children}
          </main>
        </div>

      </div>
      </MobileNavProvider>
    </AuthGuard>
  );
}
