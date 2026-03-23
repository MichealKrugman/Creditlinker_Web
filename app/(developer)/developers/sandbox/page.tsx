"use client";

import { useState } from "react";
import {
  FlaskConical, Send, Copy, CheckCircle2,
  ChevronDown, ChevronRight, AlertCircle, Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/* ─────────────────────────────────────────────────────────
   ENDPOINT CATALOGUE
───────────────────────────────────────────────────────── */
type HttpMethod = "GET" | "POST" | "PATCH" | "PUT";

type Endpoint = {
  method: HttpMethod;
  path: string;
  label: string;
  body?: string;
};

const ENDPOINTS: { group: string; items: Endpoint[] }[] = [
  {
    group: "Business — Score & Identity",
    items: [
      { method: "GET",  path: "/business/score",    label: "Get score" },
      { method: "GET",  path: "/business/profile",  label: "Get profile" },
      { method: "GET",  path: "/business/readiness",label: "Get readiness assessments" },
      { method: "GET",  path: "/business/snapshots",label: "Get identity snapshots" },
    ],
  },
  {
    group: "Business — Data Sources",
    items: [
      { method: "POST", path: "/business/mono/initiate", label: "Initiate Mono link",    body: '{}' },
      { method: "POST", path: "/business/mono/callback", label: "Exchange Mono token",   body: '{\n  "code": "mono_auth_code_here"\n}' },
      { method: "POST", path: "/business/upload/csv",    label: "Upload CSV transactions", body: '{\n  "csv_content": "date,amount,...",\n  "column_map": {}\n}' },
    ],
  },
  {
    group: "Business — Consent",
    items: [
      { method: "GET",  path: "/business/consent",           label: "List consents" },
      { method: "POST", path: "/business/consent/grant",     label: "Grant consent",  body: '{\n  "institution_id": "inst_xxx",\n  "permissions": {\n    "can_view_score": true,\n    "can_view_identity": true\n  },\n  "duration_days": 30\n}' },
      { method: "POST", path: "/business/consent/revoke",    label: "Revoke consent", body: '{\n  "consent_id": "con_xxx"\n}' },
    ],
  },
  {
    group: "Business — Financing",
    items: [
      { method: "GET",  path: "/business/financing",           label: "List financing records" },
      { method: "POST", path: "/business/financing/{consent_id}/grant", label: "Grant financing", body: '{\n  "terms": {\n    "amount": 5000000,\n    "currency": "NGN"\n  }\n}' },
    ],
  },
  {
    group: "Institution",
    items: [
      { method: "GET",  path: "/institution/discovery",          label: "Get discovery matches" },
      { method: "POST", path: "/institution/discovery/criteria", label: "Set matching criteria", body: '{\n  "capital_category": "working_capital",\n  "min_revenue_stability": 70\n}' },
      { method: "GET",  path: "/institution/financing",          label: "List financing records" },
    ],
  },
  {
    group: "Health",
    items: [
      { method: "GET",  path: "/health", label: "Health check" },
    ],
  },
];

const METHOD_COLORS: Record<HttpMethod, { bg: string; text: string }> = {
  GET:   { bg: "#ECFDF5", text: "#059669" },
  POST:  { bg: "#EFF6FF", text: "#2563EB" },
  PATCH: { bg: "#FEF3C7", text: "#D97706" },
  PUT:   { bg: "#F5F3FF", text: "#7C3AED" },
};

const SAMPLE_RESPONSES: Record<string, string> = {
  "GET /health": `{
  "status": "ok"
}`,
  "GET /business/score": `{
  "score_id": "scr_01HX2K9mP",
  "business_id": "biz_01HX2K9mP",
  "computed_at": "2025-01-15T10:32:44Z",
  "dimensions": {
    "revenue_stability": { "score": 85, "label": "Strong" },
    "cashflow_predictability": { "score": 78, "label": "Good" },
    "expense_discipline": { "score": 81, "label": "Good" },
    "liquidity_strength": { "score": 74, "label": "Moderate" },
    "financial_consistency": { "score": 80, "label": "Good" },
    "risk_profile": { "score": 69, "label": "Moderate" }
  },
  "data_quality_score": 91,
  "data_months_analyzed": 24
}`,
  "GET /business/profile": `{
  "business_id": "biz_01HX2K9mP",
  "name": "Aduke Bakeries Ltd.",
  "sector": "Food & Beverage",
  "profile_status": "active",
  "open_to_financing": true,
  "selected_capital_categories": ["working_capital", "equipment_financing"],
  "data_coverage_start": "2023-01-01",
  "data_coverage_end": "2024-12-31"
}`,
};

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "4px 9px", borderRadius: 6,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.06)",
        color: copied ? "#10B981" : "rgba(255,255,255,0.5)",
        fontSize: 11, fontWeight: 600, cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      {copied ? <CheckCircle2 size={11} /> : <Copy size={11} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function MethodBadge({ method }: { method: HttpMethod }) {
  const c = METHOD_COLORS[method];
  return (
    <span style={{
      fontSize: 10, fontWeight: 800, letterSpacing: "0.06em",
      padding: "2px 7px", borderRadius: 5,
      background: c.bg, color: c.text,
      minWidth: 42, textAlign: "center" as const,
      fontFamily: "var(--font-mono, monospace)",
    }}>
      {method}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function SandboxPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint>(ENDPOINTS[0].items[0]);
  const [body, setBody] = useState(selectedEndpoint.body ?? "");
  const [apiKey, setApiKey] = useState("sk_test_Kd92mX0pLqNvT7bRsWcY4eAhJfUiOzP1");
  const [response, setResponse] = useState<{ status: number; body: string; time: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    "Business — Score & Identity": true,
  });

  const selectEndpoint = (ep: Endpoint) => {
    setSelectedEndpoint(ep);
    setBody(ep.body ?? "");
    setResponse(null);
  };

  const toggleGroup = (g: string) => setExpandedGroups(prev => ({ ...prev, [g]: !prev[g] }));

  const handleSend = () => {
    setLoading(true);
    setResponse(null);
    const key = `${selectedEndpoint.method} ${selectedEndpoint.path}`;
    const sampleBody = SAMPLE_RESPONSES[key] ?? `{
  "success": true,
  "message": "Sandbox response for ${selectedEndpoint.path}"
}`;
    setTimeout(() => {
      setResponse({
        status: 200,
        body: sampleBody,
        time: Math.floor(80 + Math.random() * 200),
      });
      setLoading(false);
    }, 600 + Math.random() * 600);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── HEADER ── */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em" }}>
            API Sandbox
          </h2>
          <Badge variant="warning">Sandbox</Badge>
        </div>
        <p style={{ fontSize: 14, color: "#6B7280" }}>
          Test Creditlinker API endpoints directly. No real data is affected.
        </p>
      </div>

      {/* ── API KEY BAR ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px 16px", borderRadius: 10,
        border: "1px solid #E5E7EB", background: "white",
        flexWrap: "wrap",
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", flexShrink: 0 }}>API Key</span>
        <input
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          style={{
            flex: 1, minWidth: 200,
            border: "none", outline: "none",
            fontSize: 12, fontFamily: "var(--font-mono, monospace)",
            color: "#374151", background: "transparent",
          }}
        />
        <Badge variant="warning" style={{ fontSize: 9 }}>sandbox</Badge>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <style>{`@media (max-width: 768px) { .dev-sb-grid { grid-template-columns: 1fr !important; } .dev-sb-picker { max-height: 200px !important; } }`}</style>
      <div className="dev-sb-grid" style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 14, alignItems: "start" }}>

        {/* LEFT — endpoint picker */}
        <div style={{
          background: "white", border: "1px solid #E5E7EB",
          borderRadius: 14, overflow: "hidden",
        }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #F3F4F6" }}>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 13, color: "#0A2540" }}>Endpoints</p>
          </div>
          <div className="dev-sb-picker" style={{ overflowY: "auto", maxHeight: "calc(100vh - 280px)" }}>
            {ENDPOINTS.map(group => (
              <div key={group.group}>
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(group.group)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    width: "100%", padding: "8px 16px",
                    background: "#F9FAFB", border: "none",
                    borderBottom: "1px solid #F3F4F6", cursor: "pointer",
                  }}
                >
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    {group.group}
                  </span>
                  {expandedGroups[group.group]
                    ? <ChevronDown size={11} style={{ color: "#9CA3AF" }} />
                    : <ChevronRight size={11} style={{ color: "#9CA3AF" }} />
                  }
                </button>

                {/* Items */}
                {expandedGroups[group.group] && group.items.map(ep => (
                  <button
                    key={ep.path + ep.method}
                    onClick={() => selectEndpoint(ep)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      width: "100%", padding: "9px 16px",
                      border: "none", borderBottom: "1px solid #F9FAFB",
                      background: selectedEndpoint.path === ep.path && selectedEndpoint.method === ep.method
                        ? "#F0FDFF"
                        : "white",
                      cursor: "pointer", textAlign: "left" as const,
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={e => { if (!(selectedEndpoint.path === ep.path && selectedEndpoint.method === ep.method)) (e.currentTarget as HTMLElement).style.background = "#F9FAFB"; }}
                    onMouseLeave={e => { if (!(selectedEndpoint.path === ep.path && selectedEndpoint.method === ep.method)) (e.currentTarget as HTMLElement).style.background = "white"; }}
                  >
                    <MethodBadge method={ep.method} />
                    <span style={{ fontSize: 12, color: "#374151", fontWeight: 500 }}>{ep.label}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — request + response */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Request panel */}
          <div style={{
            background: "#0A2540", borderRadius: 14,
            overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)",
          }}>
            {/* URL bar */}
            <div style={{
              display: "flex", alignItems: "center",
              padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.08)",
              flexWrap: "wrap", gap: 10,
            }}>
              <MethodBadge method={selectedEndpoint.method} />
              <code style={{
                flex: 1, fontSize: 12, fontFamily: "var(--font-mono, monospace)",
                color: "rgba(255,255,255,0.85)",
                wordBreak: "break-all", minWidth: 0,
              }}>
                https://api.creditlinker.io{selectedEndpoint.path}
              </code>
              <Button
                variant="accent" size="sm"
                onClick={handleSend}
                disabled={loading}
                style={{ gap: 5, flexShrink: 0 }}
              >
                {loading
                  ? <><Clock size={12} /> Sending…</>
                  : <><Send size={12} /> Send</>
                }
              </Button>
            </div>

            {/* Headers */}
            <div style={{ padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
                Headers
              </p>
              {[
                { key: "Authorization", value: `Bearer ${apiKey.slice(0, 16)}••••` },
                { key: "Content-Type",  value: "application/json" },
              ].map(h => (
                <div key={h.key} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                  <code style={{ fontSize: 12, color: "rgba(0,212,255,0.7)", fontFamily: "var(--font-mono, monospace)", minWidth: 130 }}>{h.key}</code>
                  <code style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-mono, monospace)" }}>{h.value}</code>
                </div>
              ))}
            </div>

            {/* Body */}
            {selectedEndpoint.method !== "GET" && (
              <div style={{ padding: "12px 18px" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
                  Body
                </p>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  rows={8}
                  style={{
                    width: "100%", background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8,
                    color: "rgba(255,255,255,0.75)", fontSize: 12,
                    fontFamily: "var(--font-mono, monospace)",
                    padding: "12px 14px", outline: "none", resize: "vertical",
                    lineHeight: 1.7, boxSizing: "border-box",
                  }}
                  spellCheck={false}
                />
              </div>
            )}
          </div>

          {/* Response panel */}
          {(response || loading) && (
            <div style={{
              background: "#0A2540", borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden",
            }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Response
                  </p>
                  {response && (
                    <>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 9999,
                        background: response.status === 200 ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                        color: response.status === 200 ? "#10B981" : "#EF4444",
                      }}>
                        {response.status} OK
                      </span>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", gap: 4 }}>
                        <Clock size={10} /> {response.time}ms
                      </span>
                    </>
                  )}
                </div>
                {response && <CopyBtn text={response.body} />}
              </div>
              <pre style={{
                padding: "16px 18px", margin: 0,
                fontSize: 12, lineHeight: 1.75,
                color: loading ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.8)",
                fontFamily: "var(--font-mono, monospace)",
                whiteSpace: "pre-wrap", wordBreak: "break-word",
                maxHeight: 360, overflowY: "auto",
              }}>
                {loading ? "Waiting for response…" : response?.body}
              </pre>
            </div>
          )}

          {/* Empty state */}
          {!response && !loading && (
            <div style={{
              background: "white", border: "1px solid #E5E7EB",
              borderRadius: 14, padding: "40px 24px", textAlign: "center" as const,
            }}>
              <FlaskConical size={28} style={{ color: "#D1D5DB", margin: "0 auto 12px" }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Ready to test</p>
              <p style={{ fontSize: 13, color: "#9CA3AF" }}>Select an endpoint and click Send to see the response.</p>
            </div>
          )}

          {/* Warning */}
          <div style={{
            display: "flex", gap: 10, alignItems: "flex-start",
            padding: "12px 16px", background: "#FFFBEB",
            border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10,
          }}>
            <AlertCircle size={13} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: "#92400E" }}>
              Sandbox requests use test data only. No real financial data is affected. Responses are mocked for demonstration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
