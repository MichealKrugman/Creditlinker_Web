"use client";

import { useState } from "react";
import {
  AlertTriangle, CheckCircle2, XCircle, Clock,
  ChevronRight, Building2, Landmark, Eye, MessageSquare,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMockAdminUser, canManage } from "@/lib/admin-rbac";

// ─────────────────────────────────────────────────────────────
//  MOCK DATA — replace with GET /admin/disputes (paginated)
//  based on DisputeRecord model
// ─────────────────────────────────────────────────────────────

const DISPUTES = [
  {
    id: "DISP-2025-0098", financing_id: "fin_081",
    business: "NovaChem Industries",  business_id: "biz_008",
    financer: "Stanbic IBTC Bank",    institution_id: "inst_001",
    initiated_by: "business" as const,
    reason: "Financer claims settlement was not received. We have bank evidence of payment transfer dated Jan 4.",
    opened_at: "Jan 8, 2025", resolution: "pending" as const,
    severity: "high", amount_ngn: 12_500_000,
    direct_debit_triggered: false,
    evidence: ["bank_transfer_proof.pdf", "financer_claim.pdf"],
  },
  {
    id: "DISP-2025-0094", financing_id: "fin_074",
    business: "Arise Digital Agency", business_id: "biz_009",
    financer: "Lapo Microfinance",    institution_id: "inst_002",
    initiated_by: "financer" as const,
    reason: "Business has not made 3 consecutive repayments. Requesting direct debit authorization.",
    opened_at: "Jan 5, 2025", resolution: "pending" as const,
    severity: "high", amount_ngn: 2_800_000,
    direct_debit_triggered: false,
    evidence: ["repayment_schedule.pdf"],
  },
  {
    id: "DISP-2025-0091", financing_id: "fin_066",
    business: "Aduke Bakeries Ltd",  business_id: "biz_001",
    financer: "Trove Finance Ltd",    institution_id: "inst_005",
    initiated_by: "business" as const,
    reason: "Terms changed unilaterally after offer was accepted. Original offer stated 18% pa, now claiming 22%.",
    opened_at: "Dec 28, 2024", resolution: "resolved" as const,
    severity: "medium", amount_ngn: 5_000_000,
    direct_debit_triggered: false,
    evidence: ["original_offer.pdf", "revised_offer.pdf"],
    resolution_notes: "Reviewed both offer documents. Original terms confirmed at 18% pa. Financer instructed to honour original offer.",
  },
  {
    id: "DISP-2025-0088", financing_id: "fin_059",
    business: "SabiSabi Wholesale",  business_id: "biz_005",
    financer: "QuickCash Capital",   institution_id: "inst_003",
    initiated_by: "business" as const,
    reason: "Financer suspended. Business requesting release of escrowed settlement funds.",
    opened_at: "Dec 20, 2024", resolution: "resolved" as const,
    severity: "high", amount_ngn: 3_200_000,
    direct_debit_triggered: false,
    evidence: ["escrow_agreement.pdf"],
    resolution_notes: "Funds released to business following financer suspension. Financing record marked settled.",
  },
];

const OPEN = DISPUTES.filter(d => d.resolution === "pending");
const RESOLVED = DISPUTES.filter(d => d.resolution !== "pending");

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
  dispute: typeof DISPUTES[0];
  onResolve: (notes: string, triggerDebit: boolean) => void;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState("");
  const [triggerDebit, setTriggerDebit] = useState(false);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(10,37,64,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "white", borderRadius: 16, boxShadow: "0 24px 80px rgba(0,0,0,0.18)", width: "100%", maxWidth: 520, overflow: "auto", maxHeight: "90vh" }}>

        <div style={{ padding: "24px 24px 0", borderBottom: "1px solid #F3F4F6", paddingBottom: 18 }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, color: "#0A2540", marginBottom: 4 }}>Resolve Dispute</h3>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>{dispute.id} · {dispute.business} vs {dispute.financer}</p>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Context */}
          <div style={{ background: "#F9FAFB", borderRadius: 10, padding: "14px 16px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Dispute Reason</p>
            <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{dispute.reason}</p>
          </div>

          {/* Submitted evidence */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Evidence</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {dispute.evidence.map((e) => (
                <div key={e} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#F9FAFB", borderRadius: 8, border: "1px solid #F3F4F6" }}>
                  <span style={{ fontSize: 13, color: "#374151", flex: 1 }}>{e}</span>
                  <button style={{ fontSize: 11, fontWeight: 700, color: "#0A2540", background: "none", border: "1px solid #E5E7EB", borderRadius: 6, padding: "3px 8px", cursor: "pointer" }}>View</button>
                </div>
              ))}
            </div>
          </div>

          {/* Direct debit option (financer-initiated only) */}
          {dispute.initiated_by === "financer" && (
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

          {/* Resolution notes */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Resolution Notes <span style={{ color: "#EF4444" }}>*</span></label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Explain the resolution decision. This is recorded permanently in the dispute record…" rows={4}
              style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, fontSize: 13, color: "#0A2540", resize: "none", outline: "none", fontFamily: "var(--font-body)", boxSizing: "border-box" }}
              onFocus={(e) => (e.target.style.borderColor = "#0A2540")}
              onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")} />
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button variant="primary" size="sm" disabled={!notes.trim()} onClick={() => onResolve(notes.trim(), triggerDebit)}>
              <CheckCircle2 size={13} /> Mark Resolved
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
  const user = getMockAdminUser();
  const canAct = canManage(user, "verifications"); // disputes gated on verifications module
  const [selected, setSelected] = useState<typeof DISPUTES[0] | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* HEADER */}
      <div>
        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>Disputes</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {OPEN.length > 0
            ? <Badge variant="destructive">{OPEN.length} open disputes</Badge>
            : <Badge variant="success">No open disputes</Badge>}
          <span style={{ fontSize: 13, color: "#9CA3AF" }}>{RESOLVED.length} resolved all time</span>
        </div>
      </div>

      {/* STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
        {[
          { label: "Open",              value: OPEN.length,                                    color: "#EF4444" },
          { label: "High Severity",     value: OPEN.filter(d => d.severity === "high").length, color: "#F59E0B" },
          { label: "Resolved",          value: RESOLVED.length,                                color: "#10B981" },
          { label: "Total Value",       value: fmtNgn(OPEN.reduce((s, d) => s + d.amount_ngn, 0)), color: "#0A2540" },
        ].map((s) => (
          <div key={s.label} style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 12, padding: "14px 18px" }}>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: s.color, letterSpacing: "-0.03em", marginBottom: 2 }}>{s.value}</p>
            <p style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* OPEN DISPUTES */}
      {OPEN.length > 0 && (
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 12 }}>Open Disputes</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {OPEN.map((d) => (
              <div key={d.id} style={{ background: "white", border: "1.5px solid rgba(239,68,68,0.15)", borderRadius: 14, padding: "18px 22px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "#0A2540" }}>{d.id}</p>
                      <Badge variant={severityVariant(d.severity)} style={{ fontSize: 10, textTransform: "capitalize" }}>{d.severity}</Badge>
                      <Badge variant={d.initiated_by === "business" ? "secondary" : "warning"} style={{ fontSize: 10, textTransform: "capitalize" }}>
                        by {d.initiated_by}
                      </Badge>
                    </div>
                    <p style={{ fontSize: 12, color: "#9CA3AF" }}>Opened {d.opened_at} · {fmtNgn(d.amount_ngn)}</p>
                  </div>
                  {canAct && (
                    <Button variant="primary" size="sm" onClick={() => setSelected(d)} style={{ flexShrink: 0 }}>
                      Resolve
                    </Button>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                  {[
                    { icon: <Building2 size={13} />, label: "Business", value: d.business },
                    { icon: <Landmark size={13} />,  label: "Financer", value: d.financer },
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
                  "{d.reason}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RESOLVED DISPUTES */}
      {RESOLVED.length > 0 && (
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 12 }}>Resolved</p>
          <div style={{ background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden" }}>
            {RESOLVED.map((d, i) => (
              <div key={d.id} style={{ padding: "14px 22px", borderBottom: i < RESOLVED.length - 1 ? "1px solid #F9FAFB" : "none", display: "flex", alignItems: "center", gap: 14 }}>
                <CheckCircle2 size={16} style={{ color: "#10B981", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#0A2540" }}>{d.id}</p>
                    <Badge variant={severityVariant(d.severity)} style={{ fontSize: 10, textTransform: "capitalize" }}>{d.severity}</Badge>
                  </div>
                  <p style={{ fontSize: 12, color: "#9CA3AF" }}>{d.business} vs {d.financer} · {fmtNgn(d.amount_ngn)}</p>
                </div>
                <p style={{ fontSize: 12, color: "#9CA3AF", flexShrink: 0 }}>{d.opened_at}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {selected && (
        <ResolveModal
          dispute={selected}
          onResolve={(notes, debit) => {
            // TODO: POST /admin/financing/:financing_id/resolve-dispute
            //        { resolution_notes: notes, trigger_direct_debit: debit }
            console.log("Resolved:", selected.id, notes, debit);
            setSelected(null);
          }}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
