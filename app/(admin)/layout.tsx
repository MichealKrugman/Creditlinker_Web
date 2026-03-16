import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminTopNav } from '@/components/layout/AdminTopNav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F7FA' }}>

      {/* Sidebar — fixed 240px */}
      <AdminSidebar />

      {/* Main — offset by sidebar width */}
      <div style={{
        flex: 1,
        marginLeft: 240,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        minWidth: 0,
      }}>
        <AdminTopNav />

        <main style={{
          flex: 1,
          padding: '28px 28px',
          maxWidth: 1280,
          width: '100%',
        }}>
          {children}
        </main>
      </div>

    </div>
  );
}
