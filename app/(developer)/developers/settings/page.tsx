"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Settings, User, Bell, Shield, Key,
  Globe, Trash2, CheckCircle2, AlertCircle,
  Eye, EyeOff, Copy, Save,
} from "lucide-react";

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

function CardHeader({ title, desc }: { title: string; desc?: string }) {
  return (
    <div style={{ padding: "20px 24px 0" }}>
      <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0A2540", letterSpacing: "-0.02em", marginBottom: desc ? 4 : 0 }}>
        {title}
      </p>
      {desc && <p style={{ fontSize: 13, color: "#6B7280" }}>{desc}</p>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   FORM FIELD
───────────────────────────────────────────────────────── */
function Field({
  label, value, type = "text", placeholder, hint, readOnly = false,
}: {
  label: string; value: string; type?: string; placeholder?: string; hint?: string; readOnly?: boolean;
}) {
  const [val, setVal] = useState(value);
  const [show, setShow] = useState(false);
  const isPassword = type === "password";

  return (
    <div>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type={isPassword && !show ? "password" : "text"}
          value={val}
          onChange={e => !readOnly && setVal(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          style={{
            width: "100%",
            padding: isPassword ? "9px 40px 9px 12px" : "9px 12px",
            border: "1px solid #D1D5DB",
            borderRadius: 8,
            fontSize: 14,
            color: readOnly ? "#9CA3AF" : "#0A2540",
            background: readOnly ? "#F9FAFB" : "white",
            outline: "none",
            boxSizing: "border-box",
            fontFamily: "inherit",
            cursor: readOnly ? "default" : "text",
          }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: 0 }}
          >
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {hint && <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 5 }}>{hint}</p>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   TOGGLE ROW
───────────────────────────────────────────────────────── */
function ToggleRow({ label, desc, defaultOn = false }: { label: string; desc: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid #F3F4F6" }}>
      <div style={{ flex: 1, minWidth: 0, paddingRight: 24 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#0A2540", marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 12, color: "#6B7280" }}>{desc}</p>
      </div>
      <button
        type="button"
        onClick={() => setOn(!on)}
        aria-checked={on}
        role="switch"
        style={{
          width: 44, height: 24, borderRadius: 9999,
          background: on ? "#0A2540" : "#D1D5DB",
          border: "none", cursor: "pointer",
          position: "relative", flexShrink: 0,
          transition: "background 0.2s",
        }}
      >
        <span style={{
          position: "absolute", top: 3,
          left: on ? 23 : 3,
          width: 18, height: 18, borderRadius: "50%",
          background: "white",
          transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
        }} />
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SECTION NAV
───────────────────────────────────────────────────────── */
const SECTIONS = [
  { id: "profile",       label: "Profile",        icon: User     },
  { id: "account",       label: "Account",         icon: Settings },
  { id: "security",      label: "Security",        icon: Shield   },
  { id: "notifications", label: "Notifications",   icon: Bell     },
  { id: "api",           label: "API & Webhooks",  icon: Key      },
  { id: "advanced",      label: "Advanced",        icon: Globe    },
];

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function DeveloperSettingsPage() {
  const [active, setActive] = useState("profile");
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const webhookSecret = "whsec_cl_k3s9mPqLzXvNtRbWoYdAcFhGuJiE";

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function copySecret() {
    navigator.clipboard.writeText(webhookSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4 }}>
            Settings
          </h2>
          <p style={{ fontSize: 13, color: "#6B7280" }}>Manage your developer account, security, and API preferences.</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          style={{ gap: 6, minWidth: 120 }}
        >
          {saved ? <><CheckCircle2 size={13} /> Saved</> : <><Save size={13} /> Save changes</>}
        </Button>
      </div>

      {/* ── BODY: sidebar nav + content ── */}
      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 20, alignItems: "start" }}>

        {/* Section nav */}
        <nav aria-label="Settings sections">
          <Card style={{ padding: "8px 0" }}>
            {SECTIONS.map((s) => {
              const isActive = active === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActive(s.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 16px",
                    background: isActive ? "#F3F4F6" : "transparent",
                    border: "none", cursor: "pointer",
                    borderRadius: 8,
                    margin: "1px 6px",
                    width: "calc(100% - 12px)",
                    textAlign: "left",
                    transition: "background 0.12s",
                    color: isActive ? "#0A2540" : "#6B7280",
                  }}
                >
                  <s.icon size={14} />
                  <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500 }}>{s.label}</span>
                </button>
              );
            })}
          </Card>
        </nav>

        {/* Content panels */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* ── PROFILE ── */}
          {active === "profile" && (
            <>
              <Card>
                <CardHeader title="Developer profile" desc="Your public-facing developer identity on the platform." />
                <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Avatar row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 16, paddingBottom: 20, borderBottom: "1px solid #F3F4F6" }}>
                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#0A2540", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 22, fontWeight: 800, color: "#00D4FF", fontFamily: "var(--font-display)" }}>A</span>
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540", marginBottom: 4 }}>Ade Adesanya</p>
                      <p style={{ fontSize: 12, color: "#6B7280" }}>ade@techserve.ng · Developer account</p>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <Field label="First name" value="Ade" />
                    <Field label="Last name"  value="Adesanya" />
                  </div>
                  <Field label="Email address" value="ade@techserve.ng" type="email" readOnly hint="Contact support to change your email address." />
                  <Field label="Company / organisation" value="TechServe Solutions" placeholder="Your company name" />
                  <Field label="Website" value="https://techserve.ng" placeholder="https://" />
                </div>
              </Card>
            </>
          )}

          {/* ── ACCOUNT ── */}
          {active === "account" && (
            <>
              <Card>
                <CardHeader title="Plan and environment" desc="Your current API plan and active environment." />
                <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10 }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540", marginBottom: 2 }}>Free plan</p>
                      <p style={{ fontSize: 12, color: "#6B7280" }}>1,000 API requests / month · Sandbox only</p>
                    </div>
                    <Badge variant="warning">Sandbox</Badge>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {[
                      { label: "Requests used",  value: "847 / 1,000" },
                      { label: "Resets on",      value: "1 Apr 2026"  },
                      { label: "API version",    value: "v1"          },
                      { label: "Region",         value: "West Africa" },
                    ].map((m) => (
                      <div key={m.label} style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8, padding: "12px 14px" }}>
                        <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4 }}>{m.label}</p>
                        <p style={{ fontSize: 15, fontWeight: 700, color: "#0A2540", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>{m.value}</p>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" style={{ alignSelf: "flex-start" }}>
                    Upgrade to production
                  </Button>
                </div>
              </Card>

              <Card>
                <CardHeader title="Account ID" desc="Use this identifier when contacting support." />
                <div style={{ padding: "16px 24px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <code style={{ fontSize: 13, color: "#6B7280", background: "#F3F4F6", padding: "7px 12px", borderRadius: 7, fontFamily: "monospace", flex: 1 }}>
                      dev_01HX2K9QRMS4TNPWVBCZDYJFEA
                    </code>
                    <button
                      type="button"
                      onClick={() => { navigator.clipboard.writeText("dev_01HX2K9QRMS4TNPWVBCZDYJFEA"); }}
                      style={{ padding: "7px 10px", border: "1px solid #E5E7EB", borderRadius: 7, background: "white", cursor: "pointer", color: "#6B7280" }}
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* ── SECURITY ── */}
          {active === "security" && (
            <>
              <Card>
                <CardHeader title="Password" desc="Update your account password." />
                <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                  <Field label="Current password"  value="" type="password" placeholder="Enter current password" />
                  <Field label="New password"      value="" type="password" placeholder="Min 12 characters" />
                  <Field label="Confirm password"  value="" type="password" placeholder="Repeat new password" />
                  <Button variant="primary" size="sm" style={{ alignSelf: "flex-start" }}>Update password</Button>
                </div>
              </Card>

              <Card>
                <CardHeader title="Two-factor authentication" desc="Add an extra layer of security to your account." />
                <div style={{ padding: "20px 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px", background: "#FFFBEB", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, marginBottom: 16 }}>
                    <AlertCircle size={16} style={{ color: "#F59E0B", flexShrink: 0 }} />
                    <p style={{ fontSize: 13, color: "#92400E" }}>Two-factor authentication is not enabled. We recommend enabling it to protect your API keys.</p>
                  </div>
                  <Button variant="outline" size="sm">Enable two-factor authentication</Button>
                </div>
              </Card>

              <Card>
                <CardHeader title="Active sessions" desc="Devices currently signed into your developer account." />
                <div style={{ padding: "12px 0 8px" }}>
                  {[
                    { device: "Chrome · macOS",  location: "Lagos, NG",   time: "Now",        current: true  },
                    { device: "Firefox · Ubuntu", location: "Abuja, NG",   time: "2 days ago", current: false },
                  ].map((s, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", borderBottom: i === 0 ? "1px solid #F3F4F6" : "none" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#0A2540" }}>{s.device}</p>
                          {s.current && <Badge variant="success" style={{ fontSize: 10 }}>Current</Badge>}
                        </div>
                        <p style={{ fontSize: 12, color: "#9CA3AF" }}>{s.location} · {s.time}</p>
                      </div>
                      {!s.current && (
                        <button type="button" style={{ fontSize: 12, color: "#EF4444", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {/* ── NOTIFICATIONS ── */}
          {active === "notifications" && (
            <Card>
              <CardHeader title="Notification preferences" desc="Choose which platform events trigger email notifications." />
              <div style={{ padding: "16px 24px 20px" }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Pipeline</p>
                <ToggleRow label="Pipeline run completed"   desc="Get notified when a new identity snapshot is created."            defaultOn={true}  />
                <ToggleRow label="Risk flag raised"         desc="Get notified when a risk flag is detected in a business profile."  defaultOn={true}  />

                <p style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 20, marginBottom: 4 }}>Consent</p>
                <ToggleRow label="Consent granted"          desc="A business granted your institution data access."                  defaultOn={true}  />
                <ToggleRow label="Consent revoked"          desc="A business revoked your institution's access."                     defaultOn={true}  />
                <ToggleRow label="Consent expiring soon"    desc="A consent grant expires within 7 days."                           defaultOn={false} />

                <p style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 20, marginBottom: 4 }}>Financing</p>
                <ToggleRow label="Financing offer accepted" desc="A business accepted a financing offer."                           defaultOn={true}  />
                <ToggleRow label="Settlement confirmed"     desc="A repayment was verified against bank data."                      defaultOn={true}  />
                <ToggleRow label="Dispute opened"           desc="A financing dispute was initiated."                               defaultOn={true}  />

                <p style={{ fontSize: 12, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 20, marginBottom: 4 }}>Account</p>
                <ToggleRow label="API key created or rotated" desc="A new API key was generated for your account."                  defaultOn={true}  />
                <ToggleRow label="Usage threshold reached"  desc="Your API usage reaches 80% or 100% of the monthly limit."        defaultOn={true}  />
                <ToggleRow label="Platform announcements"   desc="Product updates, new features, and maintenance notices."          defaultOn={false} />
              </div>
            </Card>
          )}

          {/* ── API & WEBHOOKS ── */}
          {active === "api" && (
            <>
              <Card>
                <CardHeader title="Default environment" desc="Set the default environment for new API keys." />
                <div style={{ padding: "16px 24px 20px", display: "flex", gap: 10 }}>
                  {["Sandbox", "Production"].map((env) => (
                    <button
                      key={env}
                      type="button"
                      style={{
                        padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
                        border: env === "Sandbox" ? "1px solid #0A2540" : "1px solid #D1D5DB",
                        background: env === "Sandbox" ? "#0A2540" : "white",
                        color: env === "Sandbox" ? "white" : "#6B7280",
                      }}
                    >
                      {env}
                    </button>
                  ))}
                </div>
              </Card>

              <Card>
                <CardHeader title="Webhook signing secret" desc="Use this secret to verify webhook payloads from Creditlinker." />
                <div style={{ padding: "16px 24px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <code style={{ fontSize: 12, color: "#6B7280", background: "#F3F4F6", padding: "7px 12px", borderRadius: 7, fontFamily: "monospace", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {webhookSecret}
                    </code>
                    <button
                      type="button"
                      onClick={copySecret}
                      style={{ padding: "7px 12px", border: "1px solid #E5E7EB", borderRadius: 7, background: "white", cursor: "pointer", color: copied ? "#10B981" : "#6B7280", display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, flexShrink: 0 }}
                    >
                      {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <p style={{ fontSize: 12, color: "#9CA3AF" }}>
                    Verify incoming webhooks by checking the <code style={{ fontSize: 11, background: "#F3F4F6", padding: "1px 5px", borderRadius: 4 }}>X-Creditlinker-Signature</code> header against this secret.
                  </p>
                </div>
              </Card>

              <Card>
                <CardHeader title="API preferences" desc="Configure default behavior for your API integration." />
                <div style={{ padding: "16px 24px 20px" }}>
                  <ToggleRow label="Retry failed webhook deliveries" desc="Automatically retry failed webhook events up to 5 times over 24 hours."   defaultOn={true}  />
                  <ToggleRow label="Include raw transaction data"    desc="Include transaction-level detail in webhook payloads where consented."    defaultOn={false} />
                  <ToggleRow label="Verbose error responses"         desc="Return detailed error messages in API responses (recommended for dev)."   defaultOn={true}  />
                </div>
              </Card>
            </>
          )}

          {/* ── ADVANCED ── */}
          {active === "advanced" && (
            <>
              <Card>
                <CardHeader title="Data residency" desc="Region where your API data is stored and processed." />
                <div style={{ padding: "16px 24px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10 }}>
                    <Globe size={18} style={{ color: "#6B7280", flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#0A2540" }}>West Africa (Lagos)</p>
                      <p style={{ fontSize: 12, color: "#6B7280" }}>Data residency cannot be changed after account creation. Contact support if you need to migrate.</p>
                    </div>
                    <Badge variant="secondary" style={{ flexShrink: 0 }}>Locked</Badge>
                  </div>
                </div>
              </Card>

              <Card>
                <CardHeader title="CORS allowed origins" desc="Domains permitted to make requests to the Creditlinker API from a browser." />
                <div style={{ padding: "16px 24px 20px" }}>
                  <Field label="Allowed origins" value="https://techserve.ng, https://app.techserve.ng" placeholder="https://yourapp.com" hint="Comma-separated list of allowed origins. Use * to allow all (not recommended for production)." />
                </div>
              </Card>

              <Card style={{ border: "1px solid rgba(239,68,68,0.2)" }}>
                <div style={{ padding: "20px 24px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <Trash2 size={18} style={{ color: "#EF4444", flexShrink: 0, marginTop: 2 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0A2540", marginBottom: 4 }}>Delete developer account</p>
                      <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.65, marginBottom: 16 }}>
                        Permanently delete your developer account, all API keys, webhook configurations, and usage history. This action cannot be undone.
                      </p>
                      <button
                        type="button"
                        style={{ padding: "9px 18px", background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.25)", color: "#EF4444", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                      >
                        Delete account
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
