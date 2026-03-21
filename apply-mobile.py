#!/usr/bin/env python3
"""
Apply mobile-responsive className additions to all business portal pages.
Run from: /home/greene/Documents/Creditlinker/Web
    python3 apply-mobile.py
"""

import os, sys

BASE = "app/(business)"

def patch(rel_path, replacements):
    path = os.path.join(BASE, rel_path)
    if not os.path.exists(path):
        print(f"  SKIP (not found): {path}")
        return
    with open(path, "r") as f:
        src = f.read()
    original = src
    for old, new in replacements:
        src = src.replace(old, new)
    if src == original:
        print(f"  WARN (no changes): {path}")
    else:
        with open(path, "w") as f:
            f.write(src)
        count = sum(1 for _, new in replacements if new != _ and new in src)
        print(f"  OK: {path}")

print("Applying mobile classNames to business portal pages...\n")

# ── financial-analysis/page.tsx ──
patch("financial-analysis/page.tsx", [
    (
        'style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>\n              <Card>\n                <CardHeader\n                  title="Revenue vs Expenses"',
        'className="fa-charts-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>\n              <Card>\n                <CardHeader\n                  title="Revenue vs Expenses"',
    ),
    (
        'style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>\n            <Card>\n              <CardHeader title="Expense Breakdown"',
        'className="fa-expense-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>\n            <Card>\n              <CardHeader title="Expense Breakdown"',
    ),
    (
        '<div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #F3F4F6" }}>',
        '<div className="cl-table-scroll"><div className="fa-contrib-table" style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #F3F4F6" }}>',
    ),
    (
        '          {unlinkedFranchises.length > 0 && (',
        '          </div>\n          {unlinkedFranchises.length > 0 && (',
    ),
])

# ── transactions/page.tsx ──
patch("transactions/page.tsx", [
    (
        'style={{ display: "grid", gridTemplateColumns: "36px 1fr 160px 110px 120px 106px 76px", padding: "10px 20px", borderBottom: "1px solid #F3F4F6",',
        'className="tx-table-row" style={{ display: "grid", gridTemplateColumns: "36px 1fr 160px 110px 120px 106px 76px", padding: "10px 20px", borderBottom: "1px solid #F3F4F6",',
    ),
    (
        'style={{ display: "grid", gridTemplateColumns: "36px 1fr 160px 110px 120px 106px 76px", padding: "13px 20px",',
        'className="tx-table-row" style={{ display: "grid", gridTemplateColumns: "36px 1fr 160px 110px 120px 106px 76px", padding: "13px 20px",',
    ),
])

# ── documents/page.tsx ──
patch("documents/page.tsx", [
    (
        'style={{ display: "grid", gridTemplateColumns: "28px 1fr 80px 110px auto", alignItems: "center", gap: 14, padding: "12px 24px", transition: "background 0.1s" }}',
        'className="doc-table-row" style={{ display: "grid", gridTemplateColumns: "28px 1fr 80px 110px auto", alignItems: "center", gap: 14, padding: "12px 24px", transition: "background 0.1s" }}',
    ),
    (
        'style={{ display: "grid", gridTemplateColumns: "28px 1fr 80px 110px auto", gap: 14, padding: "6px 24px 8px", background: "white", borderBottom: "1px solid #F3F4F6" }}',
        'className="doc-table-row" style={{ display: "grid", gridTemplateColumns: "28px 1fr 80px 110px auto", gap: 14, padding: "6px 24px 8px", background: "white", borderBottom: "1px solid #F3F4F6" }}',
    ),
])

# ── financers/page.tsx ──
patch("financers/page.tsx", [
    (
        'style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}',
        'className="fnc-four-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}',
    ),
])

# ── financing/page.tsx ──
patch("financing/page.tsx", [
    (
        'style={{ display: "grid", gridTemplateColumns: "1fr 1fr",',
        'className="fin-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr",',
    ),
])

# ── reports/page.tsx ──
patch("reports/page.tsx", [
    (
        'style={{ display: "grid", gridTemplateColumns: "1fr 80px 110px 80px auto", gap: 14, padding: "6px 24px 10px", borderBottom: "1px solid #F3F4F6" }}',
        'className="rep-table-row" style={{ display: "grid", gridTemplateColumns: "1fr 80px 110px 80px auto", gap: 14, padding: "6px 24px 10px", borderBottom: "1px solid #F3F4F6" }}',
    ),
    (
        'style={{ display: "grid", gridTemplateColumns: "1fr 80px 110px 80px auto", gap: 14, padding: "13px 24px",',
        'className="rep-table-row" style={{ display: "grid", gridTemplateColumns: "1fr 80px 110px 80px auto", gap: 14, padding: "13px 24px",',
    ),
])

# ── settings/page.tsx ──
patch("settings/page.tsx", [
    (
        'style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}',
        'className="set-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}',
    ),
])

# ── messages/page.tsx ──
patch("messages/page.tsx", [
    (
        'style={{ display: "grid", gridTemplateColumns: "300px 1fr", background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden", height: "calc(100vh - 210px)", minHeight: 560 }}',
        'className="msg-split-grid" style={{ display: "grid", gridTemplateColumns: "300px 1fr", background: "white", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden", height: "calc(100vh - 210px)", minHeight: 560 }}',
    ),
])

# ── business-profile/page.tsx ──
patch("business-profile/page.tsx", [
    (
        'style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 7 }}',
        'className="bp-three-col" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 7 }}',
    ),
    (
        'style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}',
        'className="bp-two-col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}',
    ),
    (
        'style={{ display: "grid", gridTemplateColumns: "1fr 80px 70px 100px 60px", gap: 14, padding: "6px 24px 10px", borderBottom: "1px solid #F3F4F6" }}',
        'className="bp-inv-table" style={{ display: "grid", gridTemplateColumns: "1fr 80px 70px 100px 60px", gap: 14, padding: "6px 24px 10px", borderBottom: "1px solid #F3F4F6" }}',
    ),
    (
        'style={{ display: "grid", gridTemplateColumns: "1fr 80px 70px 100px 60px", gap: 14, padding: "12px 24px",',
        'className="bp-inv-table" style={{ display: "grid", gridTemplateColumns: "1fr 80px 70px 100px 60px", gap: 14, padding: "12px 24px",',
    ),
])

# ── data-sources/page.tsx ──
patch("data-sources/page.tsx", [
    (
        'style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: "1.5px solid #E5E7EB", borderRadius: 9, overflow: "hidden" }}',
        'className="ds-map-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: "1.5px solid #E5E7EB", borderRadius: 9, overflow: "hidden" }}',
    ),
    (
        'style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 24 }}',
        'className="ds-three-col" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 24 }}',
    ),
    (
        'style={{ display: "grid", gridTemplateColumns: "32px 1fr 120px 90px 100px 80px", padding: "6px 24px 10px", borderBottom: "1px solid #F3F4F6" }}',
        'className="ds-ledger-row" style={{ display: "grid", gridTemplateColumns: "32px 1fr 120px 90px 100px 80px", padding: "6px 24px 10px", borderBottom: "1px solid #F3F4F6" }}',
    ),
    (
        'style={{ display: "grid", gridTemplateColumns: "32px 1fr 120px 90px 100px 80px", padding: "13px 24px",',
        'className="ds-ledger-row" style={{ display: "grid", gridTemplateColumns: "32px 1fr 120px 90px 100px 80px", padding: "13px 24px",',
    ),
    (
        'style={{ display: "grid", gridTemplateColumns: "32px 1fr 80px 100px 90px 100px 80px", padding: "6px 24px 10px", borderBottom: "1px solid #F3F4F6" }}',
        'className="ds-statement-row" style={{ display: "grid", gridTemplateColumns: "32px 1fr 80px 100px 90px 100px 80px", padding: "6px 24px 10px", borderBottom: "1px solid #F3F4F6" }}',
    ),
    (
        'style={{ display: "grid", gridTemplateColumns: "32px 1fr 80px 100px 90px 100px 80px", padding: "13px 24px",',
        'className="ds-statement-row" style={{ display: "grid", gridTemplateColumns: "32px 1fr 80px 100px 90px 100px 80px", padding: "13px 24px",',
    ),
    (
        'style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: "8px 14px", background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}',
        'className="ds-map-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: "8px 14px", background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}',
    ),
    (
        'style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: "10px 14px", alignItems: "center",',
        'className="ds-map-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: "10px 14px", alignItems: "center",',
    ),
])

print("\nDone. All business portal pages updated.")
print("You can delete this file: apply-mobile.py")
