"use client";

import { Package, Terminal, Copy, CheckCircle2, ArrowUpRight, Github } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

/* ─────────────────────────────────────────────────────────
   SDK CATALOGUE
───────────────────────────────────────────────────────── */
const SDKS = [
  {
    name: "Node.js / TypeScript",
    lang: "typescript",
    badge: "Official",
    version: "v1.2.0",
    stable: true,
    install: "npm install @creditlinker/node",
    snippet: `import { CreditlinkerClient } from '@creditlinker/node';

const client = new CreditlinkerClient({
  apiKey: process.env.CL_API_KEY,
  environment: 'sandbox', // or 'production'
});

// Get a business score
const score = await client.business.getScore();
console.log(score.dimensions.revenue_stability); // 85`,
    docs_href: "/developers/docs",
    github_href: "#",
  },
  {
    name: "Python",
    lang: "python",
    badge: "Official",
    version: "v1.1.0",
    stable: true,
    install: "pip install creditlinker",
    snippet: `from creditlinker import CreditlinkerClient

client = CreditlinkerClient(
    api_key=os.environ["CL_API_KEY"],
    environment="sandbox"
)

# Get a business score
score = client.business.get_score()
print(score["dimensions"]["revenue_stability"])  # 85`,
    docs_href: "/developers/docs",
    github_href: "#",
  },
  {
    name: "Go",
    lang: "go",
    badge: "Beta",
    version: "v0.9.1",
    stable: false,
    install: "go get github.com/creditlinker/creditlinker-go",
    snippet: `import cl "github.com/creditlinker/creditlinker-go"

client := cl.NewClient(cl.Config{
    APIKey:      os.Getenv("CL_API_KEY"),
    Environment: cl.Sandbox,
})

score, err := client.Business.GetScore(ctx)
if err != nil { log.Fatal(err) }
fmt.Println(score.Dimensions.RevenueStability) // 85`,
    docs_href: "/developers/docs",
    github_href: "#",
  },
  {
    name: "REST / cURL",
    lang: "bash",
    badge: "Direct",
    version: "v1",
    stable: true,
    install: "No installation needed",
    snippet: `curl -X GET https://api.creditlinker.io/business/score \\
  -H "Authorization: Bearer $CL_API_KEY" \\
  -H "Content-Type: application/json"`,
    docs_href: "/developers/api-reference",
    github_href: null,
  },
];

/* ─────────────────────────────────────────────────────────
   COPY BUTTON
───────────────────────────────────────────────────────── */
function CopyBtn({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "5px 10px", borderRadius: 6,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.06)",
        color: copied ? "#10B981" : "rgba(255,255,255,0.55)",
        fontSize: 11, fontWeight: 600, cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      {copied ? <CheckCircle2 size={11} /> : <Copy size={11} />}
      {copied ? "Copied!" : (label ?? "Copy")}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────
   SDK CARD
───────────────────────────────────────────────────────── */
function SdkCard({ sdk }: { sdk: typeof SDKS[number] }) {
  return (
    <div style={{
      background: "white", border: "1px solid #E5E7EB",
      borderRadius: 14, overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ padding: "18px 22px 14px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 9,
            background: sdk.stable ? "#F0FDFF" : "#FFFBEB",
            border: `1px solid ${sdk.stable ? "rgba(0,212,255,0.2)" : "rgba(245,158,11,0.2)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Package size={16} style={{ color: sdk.stable ? "#0A5060" : "#92400E" }} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540" }}>{sdk.name}</p>
              <Badge variant={sdk.badge === "Official" ? "secondary" : sdk.badge === "Beta" ? "warning" : "outline"} style={{ fontSize: 9 }}>
                {sdk.badge}
              </Badge>
            </div>
            <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{sdk.version}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {sdk.github_href && (
            <a href={sdk.github_href} target="_blank" rel="noreferrer" style={{
              width: 30, height: 30, borderRadius: 7, border: "1px solid #E5E7EB",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#6B7280", textDecoration: "none",
            }}>
              <Github size={13} />
            </a>
          )}
          <Button variant="outline" size="sm" href={sdk.docs_href} style={{ height: 30, fontSize: 12, gap: 4 }}>
            Docs <ArrowUpRight size={11} />
          </Button>
        </div>
      </div>

      {/* Install */}
      <div style={{
        margin: "0 22px 14px",
        background: "#0A2540", borderRadius: 9,
        overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "7px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <Terminal size={11} style={{ color: "rgba(255,255,255,0.35)" }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Install
            </span>
          </div>
          <CopyBtn text={sdk.install} label="Copy" />
        </div>
        <pre style={{
          margin: 0, padding: "10px 14px",
          fontSize: 12, color: "#00D4FF",
          fontFamily: "var(--font-mono, monospace)",
          letterSpacing: "0.02em",
        }}>
          {sdk.install}
        </pre>
      </div>

      {/* Code snippet */}
      <div style={{
        margin: "0 22px 22px",
        background: "#0A2540", borderRadius: 9,
        overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "7px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {sdk.lang}
          </span>
          <CopyBtn text={sdk.snippet} />
        </div>
        <pre style={{
          margin: 0, padding: "14px 16px",
          fontSize: 12, lineHeight: 1.7,
          color: "rgba(255,255,255,0.75)",
          fontFamily: "var(--font-mono, monospace)",
          whiteSpace: "pre-wrap", wordBreak: "break-word",
          overflowX: "auto",
        }}>
          {sdk.snippet}
        </pre>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function SdksPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── HEADER ── */}
      <div>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>
          SDKs & Libraries
        </h2>
        <p style={{ fontSize: 14, color: "#6B7280" }}>
          Official and community-maintained libraries for integrating with Creditlinker.
        </p>
      </div>

      {/* SDK cards */}
      <div className="dev-sdk-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(440px, 1fr))", gap: 16 }}>
      <style>{`@media (max-width: 600px) { .dev-sdk-grid { grid-template-columns: 1fr !important; } }`}</style>
        {SDKS.map(sdk => <SdkCard key={sdk.name} sdk={sdk} />)}
      </div>

      {/* Community banner */}
      <div style={{
        padding: "20px 24px",
        background: "linear-gradient(135deg, #0A2540, #0d3465)",
        borderRadius: 14, display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 16, flexWrap: "wrap",
      }}>
        <div>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "white", marginBottom: 4 }}>
            Building a community SDK?
          </p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
            We'd love to feature it here. Reach out via our developer support channel.
          </p>
        </div>
        <Button variant="accent" size="sm" href="/developers/support">Contact Developer Support</Button>
      </div>
    </div>
  );
}
