import { DeveloperSidebar } from '@/components/layout/DeveloperSidebar';
import { DeveloperTopNav } from '@/components/layout/DeveloperTopNav';

export default function DeveloperLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F7FA' }}>

      {/* Sidebar */}
      <DeveloperSidebar />

      {/* Main — offset by sidebar width */}
      <div style={{
        flex: 1,
        marginLeft: 240,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        minWidth: 0,
      }}>
        <DeveloperTopNav />

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
