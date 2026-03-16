"use client";

import React, { useState, useMemo } from "react";
import {
  Search, ArrowDownLeft, ArrowUpRight, SlidersHorizontal,
  ChevronLeft, ChevronRight, RefreshCw, Download,
  Repeat2, ArrowLeftRight, X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/* ─────────────────────────────────────────────────────────
   MOCK DATA
   Replace with: GET /business/transactions (paginated)
   Shape: NormalizedTransaction[]
───────────────────────────────────────────────────────── */
const ALL_TRANSACTIONS = [
  { id: "tx_001", date: "2024-12-28", description: "Retail Sales — Lekki",        amount: 920000,  direction: "credit", category: "Revenue",    account: "Zenith Bank ****4821", is_recurring: false, is_internal_transfer: false, flags: [] },
  { id: "tx_002", date: "2024-12-28", description: "Flour Mills Nigeria",          amount: 480000,  direction: "debit",  category: "Supplier",   account: "Zenith Bank ****4821", is_recurring: true,  is_internal_transfer: false, flags: [] },
  { id: "tx_003", date: "2024-12-27", description: "Lagos State Tax",              amount: 125000,  direction: "debit",  category: "Tax",        account: "GTBank ****0034",      is_recurring: true,  is_internal_transfer: false, flags: [] },
  { id: "tx_004", date: "2024-12-27", description: "Jumia Food — Payout",         amount: 340000,  direction: "credit", category: "Revenue",    account: "Zenith Bank ****4821", is_recurring: false, is_internal_transfer: false, flags: [] },
  { id: "tx_005", date: "2024-12-26", description: "Staff Salaries — Dec",        amount: 1200000, direction: "debit",  category: "Payroll",    account: "GTBank ****0034",      is_recurring: true,  is_internal_transfer: false, flags: [] },
  { id: "tx_006", date: "2024-12-26", description: "Equipment Maintenance",       amount: 85000,   direction: "debit",  category: "Operations", account: "GTBank ****0034",      is_recurring: false, is_internal_transfer: false, flags: [] },
  { id: "tx_007", date: "2024-12-25", description: "Retail Sales — Victoria Is.", amount: 670000,  direction: "credit", category: "Revenue",    account: "Zenith Bank ****4821", is_recurring: false, is_internal_transfer: false, flags: [] },
  { id: "tx_008", date: "2024-12-24", description: "Account Transfer — Internal", amount: 300000,  direction: "debit",  category: "Transfer",   account: "Zenith Bank ****4821", is_recurring: false, is_internal_transfer: true,  flags: [] },
  { id: "tx_009", date: "2024-12-24", description: "Account Transfer — Internal", amount: 300000,  direction: "credit", category: "Transfer",   account: "GTBank ****0034",      is_recurring: false, is_internal_transfer: true,  flags: [] },
  { id: "tx_010", date: "2024-12-23", description: "Packaging Supplies",          amount: 56000,   direction: "debit",  category: "Supplier",   account: "GTBank ****0034",      is_recurring: false, is_internal_transfer: false, flags: [] },
  { id: "tx_011", date: "2024-12-22", description: "Retail Sales — Ikeja",        amount: 430000,  direction: "credit", category: "Revenue",    account: "Zenith Bank ****4821", is_recurring: false, is_internal_transfer: false, flags: [] },
  { id: "tx_012", date: "2024-12-21", description: "Diesel — Generator",          amount: 42000,   direction: "debit",  category: "Operations", account: "Zenith Bank ****4821", is_recurring: true,  is_internal_transfer: false, flags: ["high_frequency"] },
  { id: "tx_013", date: "2024-12-20", description: "Catering Contract — Dec",     amount: 850000,  direction: "credit", category: "Revenue",    account: "Zenith Bank ****4821", is_recurring: true,  is_internal_transfer: false, flags: [] },
  { id: "tx_014", date: "2024-12-19", description: "LAWMA Levy",                  amount: 18000,   direction: "debit",  category: "Tax",        account: "GTBank ****0034",      is_recurring: true,  is_internal_transfer: false, flags: [] },
  { id: "tx_015", date: "2024-12-18", description: "Cold Room Rental",            amount: 120000,  direction: "debit",  category: "Operations", account: "GTBank ****0034",      is_recurring: true,  is_internal_transfer: false, flags: [] },
  { id: "tx_016", date: "2024-12-17", description: "Wholesale — Kano Distributor",amount: 1450000, direction: "credit", category: "Revenue",    account: "Zenith Bank ****4821", is_recurring: false, is_internal_transfer: false, flags: [] },
  { id: "tx_017", date: "2024-12-16", description: "VAT Remittance — Nov",        amount: 95000,   direction: "debit",  category: "Tax",        account: "GTBank ****0034",      is_recurring: true,  is_internal_transfer: false, flags: [] },
  { id: "tx_018", date: "2024-12-15", description: "Raw Materials — Sugar",       amount: 220000,  direction: "debit",  category: "Supplier",   account: "Zenith Bank ****4821", is_recurring: false, is_internal_transfer: false, flags: [] },
  { id: "tx_019", date: "2024-12-14", description: "Catering Contract — Mid Dec", amount: 620000,  direction: "credit", category: "Revenue",    account: "Zenith Bank ****4821", is_recurring: false, is_internal_transfer: false, flags: [] },
  { id: "tx_020", date: "2024-12-13", description: "Internet & Utilities",        amount: 35000,   direction: "debit",  category: "Operations", account: "GTBank ****0034",      is_recurring: true,  is_internal_transfer: false, flags: [] },
];

const CATEGORIES = ["All", "Revenue", "Supplier", "Payroll", "Tax", "Operations", "Transfer"];
const DIRECTIONS = ["All", "Credit", "Debit"];
const PAGE_SIZE  = 10;

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function fmt(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n.toLocaleString()}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function categoryColor(cat: string): string {
  return ({
    Revenue:    "#10B981",
    Supplier:   "#818CF8",
    Payroll:    "#F59E0B",
    Tax:        "#EF4444",
    Operations: "#6B7280",
    Transfer:   "#38BDF8",
  } as Record<string, string>)[cat] ?? "#9CA3AF";
}

/* ─────────────────────────────────────────────────────────
   FILTER PILL
───────────────────────────────────────────────────────── */
function FilterPill({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "5px 14px",
        borderRadius: 9999,
        border: "1.5px solid",
        borderColor: active ? "#0A2540" : "#E5E7EB",
        background: active ? "#0A2540" : "white",
        color: active ? "white" : "#6B7280",
        fontSize: 12, fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.12s",
        whiteSpace: "nowrap" as const,
      }}
    >
      {label}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────
   SUMMARY STAT
───────────────────────────────────────────────────────── */
function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{
      background: "white", border: "1px solid #E5E7EB",
      borderRadius: 12, padding: "16px 20px",
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
        {label}
      </p>
      <p style={{
        fontFamily: "var(--font-display)", fontWeight: 800,
        fontSize: 20, letterSpacing: "-0.03em",
        color: color ?? "#0A2540",
      }}>
        {value}
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function TransactionsPage() {
  const [search,    setSearch]    = useState("");
  const [direction, setDirection] = useState("All");
  const [category,  setCategory]  = useState("All");
  const [page,      setPage]      = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  /* ── filtered + searched ── */
  const filtered = useMemo(() => {
    return ALL_TRANSACTIONS.filter((tx) => {
      const matchDir = direction === "All" || tx.direction === direction.toLowerCase();
      const matchCat = category  === "All" || tx.category === category;
      const matchSrc = search === "" ||
        tx.description.toLowerCase().includes(search.toLowerCase()) ||
        tx.category.toLowerCase().includes(search.toLowerCase()) ||
        tx.account.toLowerCase().includes(search.toLowerCase());
      return matchDir && matchCat && matchSrc;
    });
  }, [search, direction, category]);

  /* ── summary stats ── */
  const totalIn  = filtered.filter(t => t.direction === "credit").reduce((s, t) => s + t.amount, 0);
  const totalOut = filtered.filter(t => t.direction === "debit").reduce((s, t) => s + t.amount, 0);
  const netFlow  = totalIn - totalOut;

  /* ── pagination ── */
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetFilters = () => {
    setSearch(""); setDirection("All"); setCategory("All"); setPage(1);
  };

  const hasActiveFilters = search !== "" || direction !== "All" || category !== "All";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{
            fontFamily: "var(--font-display)", fontWeight: 800,
            fontSize: 22, color: "#0A2540", letterSpacing: "-0.03em", marginBottom: 4,
          }}>
            Transactions
          </h2>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>
            {ALL_TRANSACTIONS.length} normalised transactions · Jan 2023 – Dec 2024
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            variant="outline" size="sm" style={{ gap: 6 }}
            onClick={() => {
              // Export the currently filtered transactions as CSV
              const headers = ["Date", "Description", "Category", "Account", "Direction", "Amount (NGN)"];
              const rows = filtered.map(tx => [
                tx.date,
                `"${tx.description}"`,
                tx.category,
                tx.account,
                tx.direction,
                tx.amount,
              ]);
              const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url  = URL.createObjectURL(blob);
              const a    = document.createElement("a");
              a.href     = url;
              a.download = `creditlinker_transactions_${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download size={13} /> Export
          </Button>
          <Button
            variant="primary" size="sm" style={{ gap: 6 }}
            onClick={() => {
              // TODO: POST /business/mono/callback to re-sync
              // For now navigate to data sources to trigger sync
              window.location.href = "/data-sources";
            }}
          >
            <RefreshCw size={13} /> Sync
          </Button>
        </div>
      </div>

      {/* ── SUMMARY STATS ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: 12,
      }}>
        <Stat label="Total In"    value={fmt(totalIn)}   color="#10B981" />
        <Stat label="Total Out"   value={fmt(totalOut)}  color="#EF4444" />
        <Stat label="Net Flow"    value={fmt(Math.abs(netFlow))} color={netFlow >= 0 ? "#10B981" : "#EF4444"} />
        <Stat label="Transactions" value={String(filtered.length)} />
      </div>

      {/* ── SEARCH + FILTERS ── */}
      <div style={{
        background: "white", border: "1px solid #E5E7EB",
        borderRadius: 14, padding: "16px 20px",
        display: "flex", flexDirection: "column", gap: 14,
      }}>
        {/* Search row */}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={14} style={{
              position: "absolute", left: 12, top: "50%",
              transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none",
            }} />
            <Input
              placeholder="Search transactions…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ paddingLeft: 36, height: 38, fontSize: 13 }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer",
                color: "#9CA3AF", display: "flex", alignItems: "center",
              }}>
                <X size={13} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "0 14px", height: 38,
              border: "1.5px solid", borderRadius: 8,
              borderColor: showFilters ? "#0A2540" : "#E5E7EB",
              background: showFilters ? "#0A2540" : "white",
              color: showFilters ? "white" : "#6B7280",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              transition: "all 0.12s",
            }}
          >
            <SlidersHorizontal size={13} /> Filters
            {hasActiveFilters && (
              <span style={{
                width: 6, height: 6, borderRadius: "50%",
                background: showFilters ? "#00D4FF" : "#0A2540",
                flexShrink: 0,
              }} />
            )}
          </button>
          {hasActiveFilters && (
            <button onClick={resetFilters} style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: 12, fontWeight: 600, color: "#6B7280",
              background: "none", border: "none", cursor: "pointer", padding: 0,
            }}>
              <X size={12} /> Clear
            </button>
          )}
        </div>

        {/* Filter pills */}
        {showFilters && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", minWidth: 70 }}>
                Direction
              </span>
              {DIRECTIONS.map((d) => (
                <FilterPill
                  key={d} label={d} active={direction === d}
                  onClick={() => { setDirection(d); setPage(1); }}
                />
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", minWidth: 70 }}>
                Category
              </span>
              {CATEGORIES.map((c) => (
                <FilterPill
                  key={c} label={c} active={category === c}
                  onClick={() => { setCategory(c); setPage(1); }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── TABLE ── */}
      <div style={{
        background: "white", border: "1px solid #E5E7EB",
        borderRadius: 14, overflow: "hidden",
      }}>

        {/* Table header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "36px 1fr 120px 110px 120px 100px",
          padding: "10px 20px",
          borderBottom: "1px solid #F3F4F6",
          background: "#FAFAFA",
        }}>
          {["", "Description", "Category", "Account", "Date", "Amount"].map((h) => (
            <p key={h} style={{
              fontSize: 11, fontWeight: 700, color: "#9CA3AF",
              textTransform: "uppercase", letterSpacing: "0.06em",
            }}>
              {h}
            </p>
          ))}
        </div>

        {/* Rows */}
        {paginated.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#6B7280", marginBottom: 4 }}>
              No transactions found.
            </p>
            <p style={{ fontSize: 13, color: "#9CA3AF" }}>
              Try adjusting your filters or search query.
            </p>
          </div>
        ) : (
          paginated.map((tx, i) => (
            <div
              key={tx.id}
              style={{
                display: "grid",
                gridTemplateColumns: "36px 1fr 120px 110px 120px 100px",
                padding: "13px 20px",
                borderBottom: i < paginated.length - 1 ? "1px solid #F9FAFB" : "none",
                alignItems: "center",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAFA")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {/* Direction icon */}
              <div style={{
                width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: tx.direction === "credit" ? "#ECFDF5" : "#FEF2F2",
                color: tx.direction === "credit" ? "#10B981" : "#EF4444",
              }}>
                {tx.is_internal_transfer
                  ? <ArrowLeftRight size={12} style={{ color: "#38BDF8" }} />
                  : tx.direction === "credit"
                    ? <ArrowDownLeft size={12} />
                    : <ArrowUpRight size={12} />
                }
              </div>

              {/* Description */}
              <div style={{ minWidth: 0, paddingRight: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <p style={{
                    fontSize: 13, fontWeight: 600, color: "#0A2540",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {tx.description}
                  </p>
                  {tx.is_recurring && (
                    <Repeat2 size={11} style={{ color: "#9CA3AF", flexShrink: 0 }} title="Recurring" />
                  )}
                  {tx.is_internal_transfer && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, color: "#38BDF8",
                      background: "rgba(56,189,248,0.1)",
                      border: "1px solid rgba(56,189,248,0.2)",
                      padding: "1px 5px", borderRadius: 4,
                      flexShrink: 0,
                    }}>
                      Internal
                    </span>
                  )}
                </div>
              </div>

              {/* Category */}
              <div>
                <span style={{
                  display: "inline-flex", alignItems: "center",
                  gap: 5, fontSize: 11, fontWeight: 600,
                  color: categoryColor(tx.category),
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: categoryColor(tx.category), flexShrink: 0,
                  }} />
                  {tx.category}
                </span>
              </div>

              {/* Account */}
              <p style={{
                fontSize: 11, color: "#9CA3AF",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {tx.account.split(" ")[0]}
              </p>

              {/* Date */}
              <p style={{ fontSize: 12, color: "#6B7280" }}>
                {fmtDate(tx.date)}
              </p>

              {/* Amount */}
              <p style={{
                fontSize: 13, fontWeight: 700, textAlign: "right",
                color: tx.direction === "credit" ? "#10B981" : "#0A2540",
              }}>
                {tx.direction === "credit" ? "+" : "−"}{fmt(tx.amount)}
              </p>
            </div>
          ))
        )}
      </div>

      {/* ── PAGINATION ── */}
      {totalPages > 1 && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 12,
        }}>
          <p style={{ fontSize: 13, color: "#9CA3AF" }}>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                width: 34, height: 34, borderRadius: 8,
                border: "1px solid #E5E7EB", background: "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: page === 1 ? "not-allowed" : "pointer",
                color: page === 1 ? "#D1D5DB" : "#374151",
              }}
            >
              <ChevronLeft size={15} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{
                  width: 34, height: 34, borderRadius: 8,
                  border: "1.5px solid",
                  borderColor: page === p ? "#0A2540" : "#E5E7EB",
                  background: page === p ? "#0A2540" : "white",
                  color: page === p ? "white" : "#374151",
                  fontSize: 13, fontWeight: 600,
                  cursor: "pointer", transition: "all 0.12s",
                }}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                width: 34, height: 34, borderRadius: 8,
                border: "1px solid #E5E7EB", background: "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: page === totalPages ? "not-allowed" : "pointer",
                color: page === totalPages ? "#D1D5DB" : "#374151",
              }}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
