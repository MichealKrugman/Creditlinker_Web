"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  AlertTriangle, CheckCircle2, XCircle,
  Building2, Landmark, Loader2, RefreshCw, Download, Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { canManage } from "@/lib/admin-rbac";
import { useAdminUser } from "@/lib/admin-user-context";
import { callAdminFn, callEdgeFn } from "@/lib/admin-api";

const invokeFn = (name: string, body: object) => callEdgeFn(name, body);

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

function severityVariant(s: string): "destructive" | "warning" | "secondary" {
  if (s === "high")   return "destructive";
  if (s === "medium") return "warning";
  return "secondary";
}

function fmtNgn(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n}`;
}

// ─────────────────────────────────────────────────────────────
//  RESOLVE MODAL
// ─────────────────────────────────────────────────────────────

function ResolveModal({
  dispute, onResolve, onClose,
}: {
  dispute: any;
  onResolve: (notes: string, triggerDebit: boolean) => Promise<void>;
  onClose: () => void;
}) {
  const [notes,        setNotes]        = useState("");
  const [triggerDebit, setTriggerDebit] = useState(false);
  const [saving,       setSaving]       = useState(false);

  const evidence: string[] = dispute.evidence ?? [];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(10,37,64,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "white", borderRadius: 16, boxShadow: "0 24px 80px rgba(0,0,0,0.18)", width: "100%", maxWidth: 520, overflow: "auto", maxHeight: "90vh" }}>

        <div style={{ padding: "24px 24px 0", borderBottom: "1px solid #F3F4F6", paddingBottom: 18 }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, color: "#0A2540", marginBottom: 4 }}>Resolve Dispute</h3>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>{dispute.id} · {dispute.business ?? dispute.business_name ?? "—"} vs {dispute.financer ?? dispute.institution_name ?? "—"}</p>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>

          <div style={{ background: "#F9FAFB", borderRadius: 10, padding: "14px 16px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Dispute Reason</p>
            <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{dispute.reason ?? dispute.description ?? "No reason provided."}</p>
          </div>

          {evidence.length > 0 && (
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Evidence</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {evidence.map((e: string) => (
                  <div key={e} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#F9FAFB", borderRadius: 8, border: "1px solid #F3F4F6" }}>
                    <span style={{ fontSize: 13, color: "#374151", flex: 1 }}>{e}</span>
                    <button style={{ fontSize: 11, fontWeight: 700, color: "#0A2540", background: "none", border: "1px solid #E5E7EB", borderRadius: 6, padding: "3px 8px", cursor: "pointer" }}>View</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(dispute.initiated_by === "financer" || dispute.initiator === "financer") && (
            <div style={{ background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <input type="checkbox" id="triggerDebit" checked={triggerDebit} onChange={(e) => setTriggerDebit(e.target.checked)} style={{ marginTop: 2, cursor: "pointer" }} />
                <div>
                  <label htmlFor="triggerDebit" style={{ fontSize: 13, fontWeight: 700, color: "#991B1B", cursor: "pointer" }}>Trigger Direct Debit</label>
                  <p style={{ fontSize: 12, color: "#B91C1C", lineHeight: 1.5, marginTop: 2 }}>
                    Authorize the financer to recover outstanding repayment from the business's linked bank account. This is irreversible.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Resolution Notes <span style={{ color: "#EF4444" }}>*</span></label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Explain the resolution decision. This is recorded permanently in the dispute record…" rows={4}
              style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, color: "#0A2540", resize: "none", outline: "none", fontFamily: "var(--font-body)", boxSizing: "border-box" }}
              onFocus={(e) => (e.target.style.borderColor = "#0A2540")}
              onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")} />
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button variant="primary" size="sm" disabled={!notes.trim() || saving}
              onClick={async () => { setSaving(true); await onResolve(notes.trim(), triggerDebit); setSaving(false); }}>
              <CheckCircle2 size={13} /> {saving ? "Resolving…" : "Mark Resolved"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  PAGE
// ─────────────────────────────────────────────────────────────

export default function AdminDisputesPage() {
  const { adminUser } = useAdminUser();
  const canAct = canManage(adminUser, "disputes");

  const [disputes,    setDisputes]    = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [actionError, setActionError] = useState("");
  const [selected,    setSelected]    = useState<any | null>(null);

  function handleExport() {
    if (!disputes.length) return;
    const csv = [
      ["id", "business", "financer", "reason", "severity", "initiated_by", "amount_ngn", "opened_at", "resolution", "resolution_notes"].join(","),
      ...disputes.map((d: any) => [
        d.id,
        `"${(d.business ?? d.business_name ?? "").replace(/"/g, '""')}"`,
        `"${(d.financer ?? d.institution_name ?? "").replace(/"/g, '""')}"`,
        `"${(d.reason ?? d.description ?? "").replace(/"/g, '""')}"`,
        d.severity ?? "medium",
        d.initiated_by ?? d.initiator ?? "",
        d.amount_ngn ?? d.amount ?? 0,
        d.opened_at ?? d.created_at ?? "",
        d.resolution ?? d.status ?? "",
        `"${(d.resolution_notes ?? "").replace(/"/g, '""')}"`,
      ].join(",")),
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `disputes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await callAdminFn({ action: "get-disputes" });
      setDisputes(data.disputes ?? []);
    } catch (e) {
      console.error("[disputes] load failed", e instanceof Error ? e.message : e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const open     = disputes.filter((d: any) => d.resolution === "pending" || d.status === "open" || d.status === "pending");
  const resolved = disputes.filter((d: any) => d.resolution !== "pending" && d.status !== "open" && d.status !== "pending");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>Disputes</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {loading ? <Badge variant="secondary">Loading…</Badge>
              : open.length > 0
              ? <Badge variant="destructive">{open.length} open disputes</Badge>
              : <Badge variant="success">No open disputes</Badge>}
            {!loading && <span style={{ fontSize: 13, color: "#9CA3AF" }}>{resolved.length} resolved all time</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="outline" size="sm" style={{ gap: 6 }} onClick={load} disabled={loading}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </Button>
          <Button variant="outline" size="sm" style={{ gap: 6 }} onClick={handleExport} disabled={loading}>
            <Download size={13} /> Export
          </Button>
        </div>
      </div>

      {/* STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
        {[
          { label: "Open",          value: loading ? "—" : open.length,                                                      color: "#EF4444" },
          { label: "High Severity", value: loading ? "—" : open.filter((d: any) => d.severity === "high").length,            color: "#F59E0B" },
          { label: "Resolved",      value: loading ? "—" : resolved.length,                                                  color: "#10B981" },
          { label: "Total Value",   value: loading ? "—" : fmtNgn(open.reduce((s: number, d: any) => s + (d.amount_ngn ?? d.amount ?? 0), 0)), color: "#0A2540" },
        ].map((s) => (
          <div key={s.label} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: "14px 18px" }}>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: s.color, letterSpacing: "-0.03em", marginBottom: 2 }}>{s.value}</p>
            <p style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {loading && (
        <div style={{ padding: "40px 0", textAlign: "center" }}>
          <Loader2 size={20} style={{ color: "#9CA3AF", margin: "0 auto 8px" }} className="animate-spin" />
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>Loading disputes…</p>
        </div>
      )}

      {/* OPEN DISPUTES */}
      {!loading && open.length > 0 && (
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 12 }}>Open Disputes</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {open.map((d: any) => (
              <div key={d.id} style={{ background: "white", border: "1.5px solid rgba(239,68,68,0.15)", borderRadius: 14, padding: "18px 22px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>{d.id}</p>
                      <Badge variant={severityVariant(d.severity ?? "medium")} style={{ fontSize: 10, textTransform: "capitalize" }}>{d.severity ?? "medium"}</Badge>
                      <Badge variant={(d.initiated_by ?? d.initiator) === "business" ? "secondary" : "warning"} style={{ fontSize: 10, textTransform: "capitalize" }}>
                        by {d.initiated_by ?? d.initiator ?? "unknown"}
                      </Badge>
                    </div>
                    <p style={{ fontSize: 12, color: "#9CA3AF" }}>
                      Opened {d.opened_at ?? (d.created_at ? new Date(d.created_at).toLocaleDateString() : "—")} · {fmtNgn(d.amount_ngn ?? d.amount ?? 0)}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Link href={`/admin/disputes/${d.id}`}
                      style={{ width: 30, height: 30, borderRadius: 6, border: "1px solid #E5E7EB", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#6B7280", textDecoration: "none" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#0A2540"; (e.currentTarget as HTMLElement).style.color = "#0A2540"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLElement).style.color = "#6B7280"; }}>
                      <Eye size={13} />
                    </Link>
                    {canAct && (
                      <Button variant="primary" size="sm" onClick={() => setSelected(d)} style={{ flexShrink: 0 }}>
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                  {[
                    { icon: <Building2 size={13} />, label: "Business", value: d.business ?? d.business_name ?? "—" },
                    { icon: <Landmark size={13} />,  label: "Financer", value: d.financer ?? d.institution_name ?? "—" },
                  ].map(({ icon, label, value }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, background: "#F9FAFB", borderRadius: 8, padding: "10px 12px" }}>
                      <span style={{ color: "#9CA3AF" }}>{icon}</span>
                      <div>
                        <p style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 1 }}>{label}</p>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540" }}>{value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, background: "#F9FAFB", padding: "10px 14px", borderRadius: 8 }}>
                  "{d.reason ?? d.description ?? "No details provided."}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RESOLVED DISPUTES */}
      {!loading && resolved.length > 0 && (
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 12 }}>Resolved</p>
          <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
            {resolved.map((d: any, i: number) => (
              <div key={d.id} style={{ padding: "14px 22px", borderBottom: i < resolved.length - 1 ? "1px solid #F9FAFB" : "none", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}
                onClick={() => window.location.href = `/admin/disputes/${d.id}`}>
                <CheckCircle2 size={16} style={{ color: "#10B981", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{d.id}</p>
                    <Badge variant={severityVariant(d.severity ?? "medium")} style={{ fontSize: 10, textTransform: "capitalize" }}>{d.severity ?? "medium"}</Badge>
                  </div>
                  <p style={{ fontSize: 12, color: "#9CA3AF" }}>
                    {d.business ?? d.business_name ?? "—"} vs {d.financer ?? d.institution_name ?? "—"} · {fmtNgn(d.amount_ngn ?? d.amount ?? 0)}
                  </p>
                </div>
                <p style={{ fontSize: 12, color: "#9CA3AF", flexShrink: 0 }}>
                  {d.opened_at ?? (d.created_at ? new Date(d.created_at).toLocaleDateString() : "")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && disputes.length === 0 && (
        <div style={{ padding: "48px 22px", textAlign: "center", background: "white", border: "1px solid #E5E7EB", borderRadius: 14 }}>
          <CheckCircle2 size={22} style={{ color: "#10B981", margin: "0 auto 8px", display: "block" }} />
          <p style={{ fontSize: 14, color: "#6B7280" }}>No disputes on record.</p>
        </div>
      )}

      {actionError && <p style={{ fontSize: 13, color: "#EF4444", textAlign: "center" }}>{actionError}</p>}

      {selected && (
        <ResolveModal
          dispute={selected}
          onResolve={async (notes, triggerDebit) => {
            try {
              await invokeFn("resolve-dispute", {
                dispute_id:          selected.id,
                financing_id:        selected.financing_id,
                resolution_notes:    notes,
                trigger_direct_debit: triggerDebit,
              });
              setSelected(null);
              setActionError("");
              await load();
            } catch (e: any) {
              setActionError(e.message ?? "Resolution failed");
            }
          }}
          onClose={() => { setSelected(null); setActionError(""); }}
        />
      )}
    </div>
  );
}
