/**
 * (auth) layout
 * Minimal — no sidebar, no topnav. Used for:
 *   /select-business  — choose which business to operate
 *   /new-business     — create a new business entity
 *
 * The left panel branding is embedded in each page directly
 * so each screen can customise its copy.
 *
 * BusinessProvider is required here so that select-business can
 * call useActiveBusiness() to read memberships and switch context.
 */
import { BusinessProvider } from '@/lib/business-context';

export default function AuthStepLayout({ children }: { children: React.ReactNode }) {
  return (
    <BusinessProvider>
      <div style={{ minHeight: '100vh', background: '#fff' }}>
        {children}
      </div>
    </BusinessProvider>
  );
}
