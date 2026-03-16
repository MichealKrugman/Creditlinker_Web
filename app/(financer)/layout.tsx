import { FinancerSidebar } from '@/components/layout/FinancerSidebar';
import { FinancerTopNav } from '@/components/layout/FinancerTopNav';

export default function FinancerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F7FA' }}>

      {/* Sidebar */}
      <FinancerSidebar />

      {/* Main — offset by sidebar width */}
      <div style={{
        flex: 1,
        marginLeft: 240,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        minWidth: 0,
      }}>
        <FinancerTopNav />

        <main style={{
          flex: 1,
          padding: '28px 28px',
          maxWidth: 1200,
          width: '100%',
        }}>
          {children}
        </main>
      </div>

    </div>
  );
}
