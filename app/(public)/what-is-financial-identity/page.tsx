import Link from "next/link";
import { ArrowRight } from "lucide-react";

/* ─────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────── */
const DIMENSIONS = [
  {
    number: "01",
    name: "Revenue Stability",
    body: "How consistent and predictable your revenue inflows are over time.",
    color: "#10B981",
  },
  {
    number: "02",
    name: "Cashflow Predictability",
    body: "How reliably your business generates positive operating cashflow.",
    color: "#38BDF8",
  },
  {
    number: "03",
    name: "Expense Discipline",
    body: "How well you control operating costs relative to what you earn.",
    color: "#818CF8",
  },
  {
    number: "04",
    name: "Liquidity Strength",
    body: "The depth of your cash reserves and financial buffers.",
    color: "#F59E0B",
  },
  {
    number: "05",
    name: "Financial Consistency",
    body: "The completeness and regularity of your financial activity over time.",
    color: "#00D4FF",
  },
  {
    number: "06",
    name: "Risk Profile",
    body: "Detected anomalies, irregular patterns, and financial risk signals.",
    color: "#F472B6",
  },
];

const PIPELINE = [
  {
    step: "01",
    label: "Connect",
    body: "Link your bank accounts or upload statements directly.",
  },
  {
    step: "02",
    label: "Normalize",
    body: "Transactions are categorised, cleaned, and structured for analysis.",
  },
  {
    step: "03",
    label: "Score",
    body: "Six financial dimensions are computed independently from your data.",
  },
  {
    step: "04",
    label: "Verify",
    body: "Your financial identity is sealed, versioned, and ready to share.",
  },
];

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function FinancialIdentityPage() {
  return (
    <div style={{ background: "white" }}>

      {/* ── HERO ── */}
      <section style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "96px 24px 80px",
        textAlign: "center",
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "5px 14px",
          border: "1px solid #E5E7EB",
          borderRadius: 9999,
          fontSize: 12, fontWeight: 600,
          color: "#6B7280", letterSpacing: "0.04em",
          textTransform: "uppercase",
          marginBottom: 32,
        }}>
          Financial Identity
        </div>

        <h1 style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: "clamp(34px, 5vw, 52px)",
          color: "#0A2540",
          letterSpacing: "-0.04em",
          lineHeight: 1.05,
          marginBottom: 24,
        }}>
          Not a score.<br />A full picture.
        </h1>

        <p style={{
          fontSize: 17,
          color: "#6B7280",
          lineHeight: 1.7,
          maxWidth: 520,
          margin: "0 auto 40px",
        }}>
          A financial identity is a verified, multidimensional profile of how your business actually operates, built from real transaction data, not credit history.
        </p>

        <Link
          href="/register"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "13px 28px", borderRadius: 10,
            background: "#0A2540", color: "white",
            fontWeight: 700, fontSize: 14,
            letterSpacing: "-0.01em",
            textDecoration: "none",
          }}
        >
          Build yours <ArrowRight size={14} />
        </Link>
      </section>

      {/* ── WHAT IT ISN'T ── */}
      <section style={{
        background: "#0A2540",
        padding: "72px 24px",
      }}>
        <div style={{
          maxWidth: 800,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 1,
          background: "rgba(255,255,255,0.08)",
          borderRadius: 16,
          overflow: "hidden",
        }}
          className="fi-compare-grid"
        >
          <style>{`
            @media (max-width: 640px) {
              .fi-compare-grid { grid-template-columns: 1fr !important; }
            }
          `}</style>

          {/* Left */}
          <div style={{ background: "#0A2540", padding: "44px 40px" }}>
            <p style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
              textTransform: "uppercase", color: "rgba(255,255,255,0.25)",
              marginBottom: 20,
            }}>
              Traditional credit
            </p>
            {[
              "A single number",
              "Based on borrowing history",
              "Opaque methodology",
              "Controlled by bureaus",
              "Slow to change",
            ].map((t) => (
              <div key={t} style={{
                display: "flex", alignItems: "center", gap: 10,
                marginBottom: 14,
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: "50%",
                  border: "1.5px solid rgba(255,255,255,0.15)",
                  flexShrink: 0,
                }} />
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>{t}</span>
              </div>
            ))}
          </div>

          {/* Right */}
          <div style={{ background: "#0d2f4f", padding: "44px 40px" }}>
            <p style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
              textTransform: "uppercase", color: "#00D4FF",
              marginBottom: 20,
            }}>
              Financial identity
            </p>
            {[
              "Six independent dimensions",
              "Built from your own transactions",
              "Full data provenance",
              "Owned and controlled by you",
              "Updates with every pipeline run",
            ].map((t) => (
              <div key={t} style={{
                display: "flex", alignItems: "center", gap: 10,
                marginBottom: 14,
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: "50%",
                  background: "rgba(0,212,255,0.15)",
                  border: "1.5px solid rgba(0,212,255,0.4)",
                  flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00D4FF" }} />
                </div>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SIX DIMENSIONS ── */}
      <section style={{ padding: "96px 24px", background: "white" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>

          <div style={{ maxWidth: 480, marginBottom: 56 }}>
            <p style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
              textTransform: "uppercase", color: "#9CA3AF", marginBottom: 14,
            }}>
              The six dimensions
            </p>
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800, fontSize: "clamp(26px,4vw,36px)",
              color: "#0A2540", letterSpacing: "-0.04em",
              lineHeight: 1.15, marginBottom: 16,
            }}>
              Each dimension scored independently.
            </h2>
            <p style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.7 }}>
              Capital providers see the full shape of your business — not a compressed number that hides more than it reveals.
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 1,
            background: "#E5E7EB",
            border: "1px solid #E5E7EB",
            borderRadius: 16,
            overflow: "hidden",
          }}
            className="fi-dim-grid"
          >
            <style>{`
              @media (max-width: 760px) {
                .fi-dim-grid { grid-template-columns: 1fr 1fr !important; }
              }
              @media (max-width: 480px) {
                .fi-dim-grid { grid-template-columns: 1fr !important; }
              }
            `}</style>

            {DIMENSIONS.map((d) => (
              <div key={d.number} style={{
                background: "white",
                padding: "32px 28px",
              }}>
                <div style={{
                  display: "flex", alignItems: "center",
                  justifyContent: "space-between", marginBottom: 20,
                }}>
                  <span style={{
                    fontSize: 11, fontWeight: 800, color: "#D1D5DB",
                    letterSpacing: "0.06em",
                  }}>
                    {d.number}
                  </span>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: d.color,
                  }} />
                </div>
                <p style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700, fontSize: 15,
                  color: "#0A2540", letterSpacing: "-0.02em",
                  marginBottom: 8,
                }}>
                  {d.name}
                </p>
                <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>
                  {d.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT'S BUILT ── */}
      <section style={{
        background: "#F9FAFB",
        borderTop: "1px solid #E5E7EB",
        borderBottom: "1px solid #E5E7EB",
        padding: "96px 24px",
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>

          <div style={{ maxWidth: 480, marginBottom: 56 }}>
            <p style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
              textTransform: "uppercase", color: "#9CA3AF", marginBottom: 14,
            }}>
              How it's built
            </p>
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800, fontSize: "clamp(26px,4vw,36px)",
              color: "#0A2540", letterSpacing: "-0.04em",
              lineHeight: 1.15,
            }}>
              From raw data to verified identity.
            </h2>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 24,
          }}
            className="fi-pipeline-grid"
          >
            <style>{`
              @media (max-width: 760px) {
                .fi-pipeline-grid { grid-template-columns: 1fr 1fr !important; }
              }
              @media (max-width: 480px) {
                .fi-pipeline-grid { grid-template-columns: 1fr !important; }
              }
            `}</style>

            {PIPELINE.map((p, i) => (
              <div key={p.step} style={{ position: "relative" }}>
                {/* Connector line */}
                {i < PIPELINE.length - 1 && (
                  <div style={{
                    position: "absolute",
                    top: 18, left: "calc(100% - 8px)",
                    width: "calc(24px + 16px)",
                    height: 1,
                    background: "#E5E7EB",
                    zIndex: 0,
                  }}
                    className="fi-connector"
                  />
                )}
                <style>{`.fi-connector { display: block; } @media (max-width: 760px) { .fi-connector { display: none !important; } }`}</style>

                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "#0A2540",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 16, position: "relative", zIndex: 1,
                }}>
                  <span style={{
                    fontSize: 11, fontWeight: 800, color: "#00D4FF",
                    letterSpacing: "0.04em",
                  }}>
                    {p.step}
                  </span>
                </div>
                <p style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700, fontSize: 15,
                  color: "#0A2540", letterSpacing: "-0.02em",
                  marginBottom: 8,
                }}>
                  {p.label}
                </p>
                <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "96px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800, fontSize: "clamp(26px,4vw,36px)",
            color: "#0A2540", letterSpacing: "-0.04em",
            lineHeight: 1.15, marginBottom: 16,
          }}>
            Your data is already telling a story.
          </h2>
          <p style={{
            fontSize: 15, color: "#6B7280",
            lineHeight: 1.7, marginBottom: 36,
          }}>
            Connect your bank account and see your financial identity in minutes.
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            <Link
              href="/register"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "13px 28px", borderRadius: 10,
                background: "#0A2540", color: "white",
                fontWeight: 700, fontSize: 14,
                letterSpacing: "-0.01em", textDecoration: "none",
              }}
            >
              Get started <ArrowRight size={14} />
            </Link>
            <Link
              href="/how-it-works"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "13px 24px", borderRadius: 10,
                border: "1.5px solid #E5E7EB",
                color: "#374151", fontWeight: 600,
                fontSize: 14, textDecoration: "none",
              }}
            >
              How it works
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
