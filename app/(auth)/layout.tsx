/**
 * (auth) layout
 * Minimal — no sidebar, no topnav. Used for:
 *   /select-business  — choose which business to operate
 *   /new-business     — create a new business entity
 *
 * The left panel branding is embedded in each page directly
 * so each screen can customise its copy.
 */
export default function AuthStepLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      {children}
    </div>
  );
}
