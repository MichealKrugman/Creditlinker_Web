"use client";

import Link from "next/link";
import {
  Key, Webhook, FlaskConical, Activity,
  ArrowUpRight, Code2, Copy, CheckCircle2,
  BookOpen, Package, ChevronRight, Zap,
  Clock, TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

/* ─────────────────────────────────────────────────────────
   MOCK DATA
───────────────────────────────────────────────────────── */
const STATS = [
  { label: "API Requests",    value: "12,847",  sub: "Last 30 days",    icon: Activity,     trend: "+18%" },
  { label: "Success Rate",    value: "99.4%",   sub: "Last 30 days",    icon: CheckCircle2, trend: "Stable" },
  { label: "Avg Latency",     value: "142ms",   sub: "p50 response",    icon: Zap,          trend: "-8ms" },
  { label: "Webhooks Sent",   value: "3,214",   sub: "Last 30 days",    icon: Webhook,      trend: "+24%" },
];

const RECENT_EVENTS = [
  { event: "score.updated",        id: "evt_01HX2K",  time: "2 min ago",   status: "delivered" },
  { event: "consent.granted",      id: "evt_01HX2J",  time: "14 min ago",  status: "delivered" },
  { event: "pipeline.completed",   id: "evt_01HX2H",  time: "1 hr ago",    status: "delivered" },
  { event: "consent.revoked",      id: "evt_01HX2G",  time: "3 hrs ago",   status: "failed"    },
  { event: "financing.granted",    id: "evt_01HX2F",  time: "5 hrs ago",   status: "delivered" },
];

const QUICK_LINKS = [
  { label: "API Keys",        href: "/developers/api-keys",     icon: Key,         desc: "Create and manage keys" },
  { label: "API Reference",   href: "/developers/api-reference",icon: Code2,       desc: "Browse all endpoints" },
  { label: "Webhooks",        href: "/developers/webhooks",     icon: Webhook,     desc: "Configure event delivery" },
  { label: "Sandbox",         href: "/developers/sandbox",      icon: FlaskConical,desc: "Test without real data" },
  { label: "SDKs",            href: "/developers/sdks",         icon: Package,     desc: "Node, Python, Go" },
  { label: "Docs",            href: "/developers/docs",         icon: BookOpen,    desc: "Integration guides" },
];

const BASE_URL = "https://api.creditlinker.io";

const CODE_SNIPPET = `curl -X GET ${BASE_URL}/business/score \\
  -H "Authorization: Bearer sk_test_••••••••" \\
  -H "Content-Type: application/json"`;

/* ─────────────────────────────────────────────────────────
   SHARED CARD SHELL
───────────────────────────────────────────────────────── */
function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, ...style }}>
      {children}
    </div>
  );
}

function CardHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px 0" }}>
      <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540", letterSpacing: "-0.02em" }}>
        {title}
      </p>
      {action}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   COPY BUTTON
───────────────────────────────────────────────────────── */
function CopyButton({ text }: { text: string }) {
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
      {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────
   METRIC CARD
───────────────────────────────────────────────────────── */
function MetricCard({
  label, value, sub, icon: Icon, trend,
}: { label: string; value: string; sub: string; icon: React.ComponentType<{ size?: number }>; trend: string }) {
  const isPositive = trend.startsWith("+") || trend === "Stable";
  return (
    <Card style={{ padding: "20px 22px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9,
          background: "#F3F4F6",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#6B7280",
        }}>
          <Icon size={16} />
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700,
          color: isPositive ? "#10B981" : "#EF4444",
          background: isPositive ? "#ECFDF5" : "#FEF2F2",
          padding: "2px 8px", borderRadius: 9999,
        }}>
          {trend}
        </span>
      </div>
      <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 24, color: "#0A2540", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 4 }}>
        {value}
      </p>
      <p style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 11, color: "#9CA3AF" }}>{sub}</p>
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function DeveloperOverviewPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>
            Developer Overview
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Badge variant="warning">Sandbox</Badge>
            <span style={{ fontSize: 13, color: "#6B7280" }}>API v1 · Free plan</span>
            <span style={{ color: "#E5E7EB" }}>·</span>
            <span style={{ fontSize: 13, color: "#6B7280" }}>Last request 2 min ago</span>
          </div>
        </div>
        <div className="dev-ov-btns" style={{ display: "flex", gap: 8 }}>
          <style>{`@media (max-width: 480px) { .dev-ov-btns { display: none !important; } }`}</style>
          <Button variant="outline" size="sm" href="/developers/docs" style={{ gap: 6 }}>
            <BookOpen size={13} /> Read the docs
          </Button>
          <Button variant="primary" size="sm" href="/developers/sandbox" style={{ gap: 6 }}>
            <FlaskConical size={13} /> Open sandbox
          </Button>
        </div>
      </div>

      {/* ── METRICS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        {STATS.map(s => (
          <MetricCard key={s.label} {...s} />
        ))}
      </div>

      {/* ── MAIN GRID ── */}
      <style>{`@media (max-width: 768px) { .dev-ov-grid { grid-template-columns: 1fr !important; } }`}</style>
      <div className="dev-ov-grid" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 14, alignItems: "start" }}>

        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Quick start */}
          <Card style={{
            background: "linear-gradient(135deg, #0A2540 0%, #0d3465 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}>
            <div style={{ padding: "22px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <Zap size={15} style={{ color: "#00D4FF" }} />
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "white" }}>
                  Quick Start
                </p>
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 18, lineHeight: 1.6 }}>
                Make your first authenticated request to the Creditlinker API.
              </p>

              {/* Steps */}
              {[
                { n: "1", text: "Create an API key below" },
                { n: "2", text: "Set Authorization: Bearer <key> header" },
                { n: "3", text: "Call any endpoint — start with /business/score" },
              ].map(step => (
                <div key={step.n} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                    background: "rgba(0,212,255,0.15)", border: "1px solid rgba(0,212,255,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 800, color: "#00D4FF",
                  }}>
                    {step.n}
                  </span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{step.text}</span>
                </div>
              ))}

              {/* Code block */}
              <div style={{
                marginTop: 18,
                background: "rgba(0,0,0,0.35)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10,
                overflow: "hidden",
              }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)", letterSpacing: "0.05em" }}>
                    BASH
                  </span>
                  <CopyButton text={CODE_SNIPPET} />
                </div>
                <pre style={{
                  padding: "14px 16px", margin: 0,
                  fontSize: 12, lineHeight: 1.7,
                  color: "rgba(255,255,255,0.75)",
                  fontFamily: "var(--font-mono, 'Courier New', monospace)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                }}>
                  {CODE_SNIPPET}
                </pre>
              </div>

              <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                <Button variant="accent" size="sm" href="/developers/api-keys" style={{ gap: 5 }}>
                  <Key size={13} /> Create API Key
                </Button>
                <Button variant="ghost-dark" size="sm" href="/developers/api-reference" style={{ gap: 5 }}>
                  <Code2 size={13} /> Browse endpoints
                </Button>
              </div>
            </div>
          </Card>

          {/* Recent webhook events */}
          <Card>
            <CardHeader
              title="Recent Events"
              action={
                <Link href="/developers/logs" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#0A2540", textDecoration: "none" }}>
                  View all <ChevronRight size={13} />
                </Link>
              }
            />
            <div style={{ padding: "10px 0 8px" }}>
              {RECENT_EVENTS.map((ev, i) => (
                <div key={ev.id} style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "10px 22px",
                  borderBottom: i < RECENT_EVENTS.length - 1 ? "1px solid #F3F4F6" : "none",
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                    background: ev.status === "delivered" ? "#10B981" : "#EF4444",
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", marginBottom: 2, fontFamily: "var(--font-mono, monospace)" }}>
                      {ev.event}
                    </p>
                    <p style={{ fontSize: 11, color: "#9CA3AF" }}>{ev.id}</p>
                  </div>
                  <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                    <Badge variant={ev.status === "delivered" ? "success" : "destructive"} style={{ fontSize: 10, marginBottom: 2 }}>
                      {ev.status}
                    </Badge>
                    <p style={{ fontSize: 10, color: "#9CA3AF" }}>{ev.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

        </div>

        {/* RIGHT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Quick links */}
          <Card>
            <CardHeader title="Developer Tools" />
            <div style={{ padding: "12px 0 8px" }}>
              {QUICK_LINKS.map((link, i) => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 22px",
                    borderBottom: i < QUICK_LINKS.length - 1 ? "1px solid #F3F4F6" : "none",
                    textDecoration: "none",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#F9FAFB"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: "#F3F4F6",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#6B7280",
                  }}>
                    <link.icon size={14} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", marginBottom: 1 }}>{link.label}</p>
                    <p style={{ fontSize: 11, color: "#9CA3AF" }}>{link.desc}</p>
                  </div>
                  <ArrowUpRight size={13} style={{ color: "#D1D5DB", flexShrink: 0 }} />
                </Link>
              ))}
            </div>
          </Card>

          {/* API status */}
          <Card style={{ padding: "18px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>
                API Status
              </p>
              <Badge variant="success">All systems operational</Badge>
            </div>
            {[
              { name: "REST API",       latency: "138ms",  status: "operational" },
              { name: "Webhooks",       latency: "44ms",   status: "operational" },
              { name: "Pipeline",       latency: "2.1s",   status: "operational" },
              { name: "Mono Connect",   latency: "610ms",  status: "operational" },
            ].map(svc => (
              <div key={svc.name} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                paddingBottom: 10, marginBottom: 10,
                borderBottom: "1px solid #F3F4F6",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#10B981" }} />
                  <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{svc.name}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 3 }}>
                    <Clock size={10} /> {svc.latency}
                  </span>
                </div>
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
              <TrendingUp size={12} style={{ color: "#10B981" }} />
              <span style={{ fontSize: 11, color: "#10B981", fontWeight: 600 }}>99.97% uptime last 90 days</span>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
