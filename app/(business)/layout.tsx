import { BusinessSidebar } from '@/components/layout/BusinessSidebar';
import { BusinessTopNav } from '@/components/layout/BusinessTopNav';

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F7FA' }}>

      {/* Sidebar */}
      <BusinessSidebar />

      {/* Main — offset by sidebar width */}
      <div style={{
        flex: 1,
        marginLeft: 240,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        minWidth: 0,
      }}>
        <BusinessTopNav />

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
