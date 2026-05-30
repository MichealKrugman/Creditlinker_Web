"use client";

import { useState, useEffect } from "react";
import {
  Plus, Tag, Edit2, Trash2, ChevronDown, Info, X, Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/lib/session-context";
import { getMyInstitutionId } from "@/lib/institution";

/* ─────────────────────────────────────────────────────────
   TYPES — financer_criteria_profiles schema
───────────────────────────────────────────────────────── */
type CriteriaProfile = {
  criteria_id:          string;
  institution_id:       string;
  profile_name:         string;
  capital_category:     string;
  sectors:              string[];
  min_months_of_data:   number;
  dimension_thresholds: Record<string, number>;
  profile_criteria: {
    amount_range?: string;
    rate?:         string;
    tenure?:       string;
    turnaround?:   string;
    min_score?:    number;
    notes?:        string;
    [key: string]: unknown;
  };
  is_active:  boolean;
  created_at: string;
};

/* ─────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────── */
const CAPITAL_CATEGORIES = [
  "Working Capital", "Asset Financing", "Revenue Advance",
  "Trade Finance", "Equipment Financing", "Invoice Financing",
  "Business Expansion", "Microfinance",
];

const ALL_SECTORS = [
  "Food & Beverage", "Logistics", "Technology", "Retail",
  "Agriculture", "Healthcare", "Manufacturing", "Finance",
  "Real Estate", "Education", "Media",
];

const DIMENSIONS = [
  { key: "revenue_stability",        label: "Revenue Stability" },
  { key: "cashflow_predictability",  label: "Cashflow Predictability" },
  { key: "expense_discipline",       label: "Expense Discipline" },
  { key: "liquidity_strength",       label: "Liquidity Strength" },
  { key: "financial_consistency",    label: "Financial Consistency" },
  { key: "risk_profile",             label: "Risk Profile" },
];

/* ─────────────────────────────────────────────────────────
   CREATE / EDIT MODAL
───────────────────────────────────────────────────────── */
function OfferModal({
  initial,
  institutionId,
  onClose,
  onSaved,
}: {
  initial?: CriteriaProfile | null;
  institutionId: string;
  onClose: () => void;
  onSaved: (p: CriteriaProfile) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  const [form, setForm] = useState({
    profile_name:       initial?.profile_name       ?? "",
    capital_category:   initial?.capital_category   ?? CAPITAL_CATEGORIES[0],
    sectors:            initial?.sectors             ?? [] as string[],
    min_months_of_data: initial?.min_months_of_data ?? 6,
    amount_range:       initial?.profile_criteria?.amount_range ?? "",
    rate:               initial?.profile_criteria?.rate         ?? "",
    tenure:             initial?.profile_criteria?.tenure       ?? "",
    notes:              initial?.profile_criteria?.notes        ?? "",
    is_active:          initial?.is_active ?? true,
    thresholds: DIMENSIONS.reduce((acc, d) => ({
      ...acc,
      [d.key]: initial?.dimension_thresholds?.[d.key] ?? 60,
    }), {} as Record<string, number>),
  });

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const toggleSector = (s: string) =>
    setForm(f => ({
      ...f,
      sectors: f.sectors.includes(s) ? f.sectors.filter(x => x !== s) : [...f.sectors, s],
    }));

  async function handleSave(isActive: boolean) {
    if (!form.profile_name.trim()) { setError("Profile name is required."); return; }
    setSaving(true);
    setError(null);

    const payload = {
      institution_id:       institutionId,
      profile_name:         form.profile_name.trim(),
      capital_category:     form.capital_category,
      sectors:              form.sectors,
      min_months_of_data:   form.min_months_of_data,
      dimension_thresholds: form.thresholds,
      profile_criteria: {
        amount_range: form.amount_range || undefined,
        rate:         form.rate         || undefined,
        tenure:       form.tenure       || undefined,
        notes:        form.notes        || undefined,
      },
      is_active: isActive,
    };

    const { data, error: err } = initial
      ? await supabase.from("financer_criteria_profiles")
          .update(payload)
          .eq("criteria_id", initial.criteria_id)
          .select()
          .single()
      : await supabase.from("financer_criteria_profiles")
          .insert(payload)
          .select()
          .single();

    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved(data as CriteriaProfile);
    onClose();
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", height: 38, padding: "0 12px",
    borderRadius: 8, border: "1px solid #E5E7EB",
    fontSize: 13, color: "#0A2540", outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 12, fontWeight: 600,
    color: "#374151", marginBottom: 6,
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(10,37,64,0.5)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{
        background: "white", borderRadius: 16, width: "100%", maxWidth: 580,
        boxShadow: "0 24px 80px rgba(0,0,0,0.2)",
        maxHeight: "90vh", display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #F3F4F6", flexShrink: 0 }}>
          <div>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0A2540" }}>
              {initial ? "Edit Criteria Profile" : "Create Criteria Profile"}
            </p>
            <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
              Define your matching criteria. Businesses that meet these thresholds will appear in your discovery feed.
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}>
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: "20px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Name */}
          <div>
            <label style={labelStyle}>Profile Name</label>
            <input value={form.profile_name} onChange={e => set("profile_name", e.target.value)}
              placeholder="e.g. SME Working Capital Facility" style={inputStyle} />
          </div>

          {/* Capital category */}
          <div>
            <label style={labelStyle}>Capital Category</label>
            <div style={{ position: "relative" }}>
              <select value={form.capital_category} onChange={e => set("capital_category", e.target.value)}
                style={{ ...inputStyle, appearance: "none", paddingRight: 30, cursor: "pointer" }}>
                {CAPITAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={12} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none" }} />
            </div>
          </div>

          {/* Sectors */}
          <div>
            <label style={labelStyle}>Target Sectors <span style={{ color: "#9CA3AF", fontWeight: 400 }}>(leave empty = all sectors)</span></label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {ALL_SECTORS.map(s => {
                const active = form.sectors.includes(s);
                return (
                  <button key={s} onClick={() => toggleSector(s)} style={{
                    padding: "4px 10px", borderRadius: 9999, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    border: `1px solid ${active ? "#0A2540" : "#E5E7EB"}`,
                    background: active ? "#0A2540" : "white",
                    color: active ? "white" : "#6B7280",
                  }}>
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Terms */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={labelStyle}>Amount Range</label><input value={form.amount_range} onChange={e => set("amount_range", e.target.value)} placeholder="e.g. ₦5M – ₦50M" style={inputStyle} /></div>
            <div><label style={labelStyle}>Interest Rate</label><input value={form.rate} onChange={e => set("rate", e.target.value)} placeholder="e.g. 18% p.a." style={inputStyle} /></div>
            <div><label style={labelStyle}>Tenure</label><input value={form.tenure} onChange={e => set("tenure", e.target.value)} placeholder="e.g. 6 – 12 months" style={inputStyle} /></div>
            <div>
              <label style={labelStyle}>Min. Months of Data</label>
              <input type="number" value={form.min_months_of_data} onChange={e => set("min_months_of_data", Number(e.target.value))}
                min={1} max={60} style={inputStyle} />
            </div>
          </div>

          {/* Dimension thresholds */}
          <div>
            <label style={{ ...labelStyle, marginBottom: 10 }}>Minimum Dimension Scores</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {DIMENSIONS.map(d => (
                <div key={d.key}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: "#6B7280" }}>{d.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#0A2540" }}>{form.thresholds[d.key]}</span>
                  </div>
                  <input
                    type="range" min={0} max={100} value={form.thresholds[d.key]}
                    onChange={e => setForm(f => ({ ...f, thresholds: { ...f.thresholds, [d.key]: Number(e.target.value) } }))}
                    style={{ width: "100%", accentColor: "#0A2540" }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Notes <span style={{ color: "#9CA3AF", fontWeight: 400 }}>(optional)</span></label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
              placeholder="Additional criteria, constraints, or comments"
              rows={3} style={{ ...inputStyle, height: "auto", padding: "9px 12px", resize: "vertical", fontFamily: "inherit" }} />
          </div>

          {/* Info */}
          <div style={{ display: "flex", gap: 7, padding: "10px 12px", background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 8 }}>
            <Info size={13} style={{ color: "#00A8CC", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: "#0A5060", lineHeight: 1.6 }}>
              The discovery engine uses these thresholds to score and rank matching businesses. Tighter thresholds = fewer but higher-quality matches.
            </p>
          </div>

          {error && <p style={{ fontSize: 12, color: "#EF4444" }}>{error}</p>}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #F3F4F6", display: "flex", gap: 8, flexShrink: 0 }}>
          <button onClick={() => handleSave(false)} disabled={saving} style={{
            flex: 1, height: 40, borderRadius: 8, border: "1px solid #E5E7EB", background: "white",
            fontSize: 13, fontWeight: 600, color: "#6B7280", cursor: saving ? "not-allowed" : "pointer",
          }}>
            Save as Draft
          </button>
          <button onClick={() => handleSave(true)} disabled={saving} style={{
            flex: 1, height: 40, borderRadius: 8, border: "none",
            background: saving ? "#6B7280" : "#0A2540", color: "white",
            fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            {saving ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Saving…</> : "Publish Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PROFILE CARD
───────────────────────────────────────────────────────── */
function ProfileCard({
  profile,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  profile: CriteriaProfile;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}) {
  const topDims = Object.entries(profile.dimension_thresholds)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <div style={{
      background: "white", border: `1px solid ${profile.is_active ? "#E5E7EB" : "#F3F4F6"}`,
      borderRadius: 14, overflow: "hidden",
      opacity: profile.is_active ? 1 : 0.7,
      transition: "box-shadow 0.15s",
    }}
      onMouseEnter={e => profile.is_active && ((e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.07)")}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.boxShadow = "none")}
    >
      {/* Header */}
      <div style={{ padding: "16px 18px", borderBottom: "1px solid #F3F4F6" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: profile.is_active ? "#0A2540" : "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Tag size={14} color={profile.is_active ? "#00D4FF" : "#9CA3AF"} />
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, color: "#0A2540", letterSpacing: "-0.02em" }}>
                {profile.profile_name}
              </p>
              <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>
                {profile.capital_category} · Created {new Date(profile.created_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
              </p>
            </div>
          </div>
          <Badge variant={profile.is_active ? "success" : "secondary"} style={{ flexShrink: 0 }}>
            {profile.is_active ? "Active" : "Draft"}
          </Badge>
        </div>
      </div>

      {/* Terms */}
      <div style={{ padding: "14px 18px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 12 }}>
        {[
          { label: "Amount",    value: profile.profile_criteria?.amount_range ?? "—" },
          { label: "Rate",      value: profile.profile_criteria?.rate         ?? "—" },
          { label: "Tenure",    value: profile.profile_criteria?.tenure       ?? "—" },
          { label: "Min. Data", value: `${profile.min_months_of_data} months` },
        ].map(r => (
          <div key={r.label}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 3 }}>{r.label}</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540" }}>{r.value}</p>
          </div>
        ))}
      </div>

      {/* Sectors + dim scores */}
      <div style={{ padding: "0 18px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
        {profile.sectors.length > 0 && (
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {profile.sectors.map(s => (
              <span key={s} style={{
                fontSize: 10, fontWeight: 600, color: "#6B7280", padding: "2px 7px",
                borderRadius: 9999, background: "#F3F4F6", border: "1px solid #E5E7EB",
              }}>{s}</span>
            ))}
          </div>
        )}
        {topDims.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {topDims.map(([k, v]) => {
              const label = DIMENSIONS.find(d => d.key === k)?.label ?? k;
              return (
                <span key={k} style={{ fontSize: 10, color: "#9CA3AF" }}>
                  {label}: <span style={{ fontWeight: 700, color: "#374151" }}>≥{v}</span>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding: "10px 18px", borderTop: "1px solid #F3F4F6", display: "flex", gap: 8 }}>
        <button onClick={onEdit} style={{
          flex: 1, height: 34, borderRadius: 7, border: "1px solid #E5E7EB", background: "white",
          fontSize: 12, fontWeight: 600, color: "#0A2540", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
        }}>
          <Edit2 size={12} /> Edit
        </button>
        <button onClick={onToggleActive} style={{
          height: 34, padding: "0 12px", borderRadius: 7,
          border: "1px solid #E5E7EB", background: "white",
          fontSize: 12, fontWeight: 600, color: "#6B7280", cursor: "pointer",
        }}>
          {profile.is_active ? "Pause" : "Activate"}
        </button>
        <button onClick={onDelete} style={{
          width: 34, height: 34, borderRadius: 7,
          border: "1px solid #FEE2E2", background: "#FEF2F2",
          color: "#EF4444", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function FinancerOffers() {
  const { user } = useSession();

  const [profiles,     setProfiles]     = useState<CriteriaProfile[]>([]);
  const [institutionId, setInstitutionId] = useState<string | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [showModal,    setShowModal]    = useState(false);
  const [editTarget,   setEditTarget]   = useState<CriteriaProfile | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);

      const instId = await getMyInstitutionId(user.id);

      if (!instId) { setError("No institution found."); setLoading(false); return; }
      setInstitutionId(instId);

      const { data, error: err } = await supabase
        .from("financer_criteria_profiles")
        .select("*")
        .eq("institution_id", instId)
        .order("created_at", { ascending: false });

      if (err) { setError(err.message); } else { setProfiles((data ?? []) as CriteriaProfile[]); }
      setLoading(false);
    })();
  }, [user]);

  async function handleDelete(criteriaId: string) {
    await supabase.from("financer_criteria_profiles").delete().eq("criteria_id", criteriaId);
    setProfiles(p => p.filter(x => x.criteria_id !== criteriaId));
  }

  async function handleToggleActive(profile: CriteriaProfile) {
    const { data } = await supabase
      .from("financer_criteria_profiles")
      .update({ is_active: !profile.is_active })
      .eq("criteria_id", profile.criteria_id)
      .select().single();
    if (data) setProfiles(p => p.map(x => x.criteria_id === profile.criteria_id ? data as CriteriaProfile : x));
  }

  function handleSaved(p: CriteriaProfile) {
    setProfiles(prev => {
      const exists = prev.find(x => x.criteria_id === p.criteria_id);
      return exists ? prev.map(x => x.criteria_id === p.criteria_id ? p : x) : [p, ...prev];
    });
  }

  const activeCount = profiles.filter(p => p.is_active).length;

  return (
    <>
      {(showModal || editTarget) && institutionId && (
        <OfferModal
          initial={editTarget}
          institutionId={institutionId}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          onSaved={handleSaved}
        />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>
              Criteria Profiles
            </h2>
            <p style={{ fontSize: 13, color: "#6B7280" }}>
              {loading ? "Loading…" : `${activeCount} active profile${activeCount !== 1 ? "s" : ""} · ${profiles.length} total`}
            </p>
          </div>
          <button onClick={() => { setEditTarget(null); setShowModal(true); }} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", height: 36, borderRadius: 8,
            border: "none", background: "#0A2540", color: "white",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>
            <Plus size={13} /> New Profile
          </button>
        </div>

        {error && (
          <div style={{ padding: "14px 18px", borderRadius: 10, background: "#FEF2F2", border: "1px solid #FECACA", fontSize: 13, color: "#B91C1C" }}>{error}</div>
        )}

        {/* How it works */}
        <div style={{ display: "flex", flexWrap: "wrap", background: "white", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
          {[
            { step: "1", label: "Define thresholds",  sub: "Set minimum dimension scores, sectors, and data requirements" },
            { step: "2", label: "Discovery runs",      sub: "The engine scores all active businesses against your criteria" },
            { step: "3", label: "Matches surface",     sub: "Businesses that pass your thresholds appear in your feed" },
            { step: "4", label: "Request access",      sub: "Shortlist businesses and request their financial profile" },
          ].map((s, i, arr) => (
            <div key={s.step} style={{
              flex: "1 1 140px", padding: "14px 18px",
              borderRight: i < arr.length - 1 ? "1px solid #F3F4F6" : "none",
              borderBottom: "1px solid #F3F4F6",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#0A2540", color: "white", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{s.step}</span>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#0A2540" }}>{s.label}</p>
              </div>
              <p style={{ fontSize: 11, color: "#9CA3AF", lineHeight: 1.5 }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ padding: "60px 24px", textAlign: "center" as const, background: "white", borderRadius: 14, border: "1px solid #E5E7EB" }}>
            <Loader2 size={28} style={{ color: "#D1D5DB", marginBottom: 12, animation: "spin 1s linear infinite" }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: "#0A2540" }}>Loading profiles…</p>
          </div>
        ) : profiles.length === 0 ? (
          <div style={{ padding: "60px 24px", textAlign: "center" as const, background: "white", borderRadius: 14, border: "1px solid #E5E7EB" }}>
            <Tag size={32} style={{ color: "#E5E7EB", marginBottom: 12 }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: "#0A2540", marginBottom: 4 }}>No criteria profiles yet</p>
            <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 16 }}>Create your first profile to start receiving discovery matches.</p>
            <button onClick={() => setShowModal(true)} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#0A2540", color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              New Profile
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: 14 }}>
            {profiles.map(p => (
              <ProfileCard
                key={p.criteria_id}
                profile={p}
                onEdit={() => setEditTarget(p)}
                onDelete={() => handleDelete(p.criteria_id)}
                onToggleActive={() => handleToggleActive(p)}
              />
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
