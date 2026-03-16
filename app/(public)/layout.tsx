import { Navbar, Footer } from '@/components/layout';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1, paddingTop: 'var(--header-height)' }}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
