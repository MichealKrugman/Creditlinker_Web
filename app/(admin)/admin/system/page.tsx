"use client";

import {
  Server, Activity, Database, Cpu, HardDrive,
  CheckCircle2, XCircle, AlertTriangle, RefreshCw,
  Zap, Clock, Globe, ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getMockAdminUser, isSuperAdmin } from "@/lib/admin-rbac";

// ─────────────────────────────────────────────────────────────
//  MOCK DATA — replace with platform monitoring endpoints
//  GET /admin/system/health
//  GET /admin/system/services
// ─────────────────────────────────────────────────────────────

const SERVICES = [
  { name: "API Gateway",         status: "healthy",  uptime: "99.98%", latency_ms: 38,   region: "af-south-1" },
  { name: "Auth (Keycloak)",     status: "healthy",  uptime: "99.97%", latency_ms: 62,   region: "af-south-1" },
  { name: "Pipeline Engine",     status: "degraded", uptime: "99.91%", latency_ms: 1840, region: "af-south-1" },
  { name: "Data Ingestion",      status: "healthy",  uptime: "99.99%", latency_ms: 142,  region: "af-south-1" },
  { name: "Feature Store",       status: "healthy",  uptime: "99.95%", latency_ms: 88,   region: "af-south-1" },
  { name: "Scoring Engine",      status: "degraded", uptime: "99.82%", latency_ms: 2100, region: "af-south-1" },
  { name: "Risk Engine",         status: "healthy",  uptime: "99.96%", latency_ms: 204,  region: "af-south-1" },
  { name: "Notification Service",status: "healthy",  uptime: "99.99%", latency_ms: 24,   region: "af-south-1" },
  { name: "Mono Integration",    status: "healthy",  uptime: "99.88%", latency_ms: 310,  region: "external" },
  { name: "Webhook Dispatcher",  status: "healthy",  uptime: "99.94%", latency_ms: 51,   region: "af-south-1" },
  { name: "Audit Log Service",   status: "healthy",  uptime: "100%",   latency_ms: 18,   region: "af-south-1" },
  { name: "Database (Primary)",  status: "healthy",  uptime: "99.99%", latency_ms: 4,    region: "af-south-1" },
  { name: "Database (Replica)",  status: "healthy",  uptime: "99.99%", latency_ms: 5,    region: "af-south-1" },
  { name: "Object Storage",      status: "healthy",  uptime: "100%",   latency_ms: 29,   region: "af-south-1" },
];

const INFRASTRUCTURE = [
  { label: "CPU Utilization",    value: "38%",  sub: "4 of 8 vCPUs active",     bar: 38,  color: "#10B981", icon: <Cpu size={14} /> },
  { label: "Memory",             value: "62%",  sub: "9.9 GB / 16 GB",          bar: 62,  color: "#F59E0B", icon: <HardDrive size={14} /> },
  { label: "DB Connections",     value: "47",   sub: "of 100 max",               bar: 47,  color: "#38BDF8", icon: <Database size={14} /> },
  { label: "API Req / min",      value: "2,840",sub: "Peak today: 4,210",        bar: 67,  color: "#818CF8", icon: <Activity size={14} /> },
];

const RECENT_INCIDENTS = [
  { id: "INC-2025-004", title: "Scoring Engine High Latency",    severity: "warning", status: "investigating", started: "Today, 11:20",     resolved: null },
  { id: "INC-2025-003", title: "API Gateway 502 Spike",          severity: "error",   status: "resolved",      started: "Jan 8, 09:45",      resolved: "Jan 8, 10:12" },
  { id: "INC-2025-002", title: "Mono Webhook Delivery Delay",    severity: "warning", status: "resolved",      started: "Jan 4, 14:00",      resolved: "Jan 4, 15:30" },
  { id: "INC-2025-001", title: "Pipeline Batch Timeout",         severity: "error",   status: "resolved",      started: "Dec 29, 03:10",     resolved: "Dec 29, 04:02" },
];

function statusDot(status: string) {
  const color = status === "healthy" ? "#10B981" : status === "degraded" ? "#F59E0B" : "#EF4444";
  return <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />;
}

function incidentSeverityBadge(s: string) {
  if (s === "error")   return <Badge variant="destructive" style={{ fontSize: 10 }}>Critical</Badge>;
  if (s === "warning") return <Badge variant="warning"     style={{ fontSize: 10 }}>Warning</Badge>;
  return                      <Badge variant="secondary"   style={{ fontSize: 10 }}>Info</Badge>;
}

export default function AdminSystemPage() {
  const user = getMockAdminUser();

  const degraded = SERVICES.filter(s => s.status === "degraded").length;
  const down     = SERVICES.filter(s => s.status === "down").length;
  const activeIncidents = RECENT_INCIDENTS.filter(i => i.status !== "resolved").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>System</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {down > 0
              ? <Badge variant="destructive">{down} service down</Badge>
              : degraded > 0
              ? <Badge variant="warning">{degraded} degraded</Badge>
              : <Badge variant="success">All systems operational</Badge>}
            {activeIncidents > 0 && <Badge variant="warning">{activeIncidents} active incident</Badge>}
          </div>
        </div>
      </div>

      {/* ACTIVE INCIDENT BANNER */}
      {activeIncidents > 0 && (
        <div style={{ background: "#FFFBEB", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 12 }}>
          <AlertTriangle size={15} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#92400E", marginBottom: 2 }}>
              {RECENT_INCIDENTS.find(i => i.status !== "resolved")?.title}
            </p>
            <p style={{ fontSize: 12, color: "#B45309" }}>
              Started {RECENT_INCIDENTS.find(i => i.status !== "resolved")?.started} · Engineering team is investigating.
            </p>
          </div>
          <Badge variant="warning" style={{ flexShrink: 0 }}>Investigating</Badge>
        </div>
      )}

      {/* INFRA METRICS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        {INFRASTRUCTURE.map((m) => (
          <div key={m.label} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7280" }}>{m.icon}</div>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 20, color: m.bar > 80 ? "#EF4444" : m.bar > 60 ? "#F59E0B" : "#0A2540", letterSpacing: "-0.03em" }}>{m.value}</p>
            </div>
            <div style={{ height: 5, borderRadius: 9999, background: "#F3F4F6", marginBottom: 8 }}>
              <div style={{ height: "100%", width: `${m.bar}%`, background: m.bar > 80 ? "#EF4444" : m.bar > 60 ? "#F59E0B" : m.color, borderRadius: 9999, transition: "width 0.6s ease" }} />
            </div>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 1 }}>{m.label}</p>
            <p style={{ fontSize: 11, color: "#9CA3AF" }}>{m.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, alignItems: "start" }}>

        {/* SERVICES TABLE */}
        <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid #F3F4F6" }}>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>Service Status</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 90px 90px 100px", padding: "8px 22px", background: "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
            {["Service", "", "Latency", "Uptime", "Region"].map((h) => (
              <p key={h} style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</p>
            ))}
          </div>
          {SERVICES.map((svc, i) => (
            <div key={svc.name}
              style={{ display: "grid", gridTemplateColumns: "1fr 80px 90px 90px 100px", padding: "11px 22px", borderBottom: i < SERVICES.length - 1 ? "1px solid #F9FAFB" : "none", alignItems: "center" }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#0A2540" }}>{svc.name}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {statusDot(svc.status)}
                <span style={{ fontSize: 11, fontWeight: 600, color: svc.status === "healthy" ? "#10B981" : svc.status === "degraded" ? "#F59E0B" : "#EF4444", textTransform: "capitalize" }}>{svc.status}</span>
              </div>
              <p style={{ fontSize: 12, color: svc.latency_ms > 1000 ? "#F59E0B" : "#374151" }}>
                {svc.latency_ms >= 1000 ? `${(svc.latency_ms / 1000).toFixed(2)}s` : `${svc.latency_ms}ms`}
              </p>
              <p style={{ fontSize: 12, fontWeight: 600, color: parseFloat(svc.uptime) >= 99.95 ? "#10B981" : "#F59E0B" }}>{svc.uptime}</p>
              <p style={{ fontSize: 11, color: "#9CA3AF" }}>{svc.region}</p>
            </div>
          ))}
        </div>

        {/* INCIDENTS */}
        <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid #F3F4F6" }}>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>Recent Incidents</p>
          </div>
          <div>
            {RECENT_INCIDENTS.map((inc, i) => (
              <div key={inc.id} style={{ padding: "14px 22px", borderBottom: i < RECENT_INCIDENTS.length - 1 ? "1px solid #F9FAFB" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  {inc.status === "resolved"
                    ? <CheckCircle2 size={13} style={{ color: "#10B981", flexShrink: 0 }} />
                    : <AlertTriangle size={13} style={{ color: "#F59E0B", flexShrink: 0 }} />}
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540", flex: 1 }}>{inc.title}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: 21 }}>
                  {incidentSeverityBadge(inc.severity)}
                  <span style={{ fontSize: 11, color: "#9CA3AF" }}>{inc.started}</span>
                  {inc.resolved && <span style={{ fontSize: 11, color: "#10B981" }}>→ {inc.resolved}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SUPER ADMIN NOTE */}
      {!isSuperAdmin(user) && (
        <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 12, padding: "14px 18px", display: "flex", gap: 10, alignItems: "center" }}>
          <ShieldCheck size={14} style={{ color: "#9CA3AF", flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: "#9CA3AF" }}>System configuration and service restarts are restricted to Super Admins only. You are viewing in read-only mode.</p>
        </div>
      )}
    </div>
  );
}
