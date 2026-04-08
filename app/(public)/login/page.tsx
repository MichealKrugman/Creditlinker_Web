'use client';

import React, { useState, useMemo } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// ── Theme ────────────────────────────────────────────────────────────────────
const C = {
  bgDark: '#0B0B0B',
  bgLight: '#FFFFFF',
  textPrimary: '#1A1A1A',
  textMuted: '#9E9E9E',
  border: '#EEEEEE',
  inputBg: '#FCFCFC',
};

const HERO_HEIGHT = 260;
const TILE = 50;

// ── Geometric SVG background pattern ─────────────────────────────────────────
function BackgroundPattern({ width }: { width: number }) {
  const cols = Math.ceil(width / TILE) + 1;
  const rows = 6;

  const shapes = useMemo(() => {
    const items: React.ReactNode[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * TILE;
        const y = r * TILE;
        const type = (r + c) % 4;
        if (type === 0) {
          items.push(
            <circle
              key={`${r}-${c}`}
              cx={x + 25}
              cy={y + 25}
              r={18}
              fill="#1A1A1A"
              fillOpacity={0.4}
            />
          );
        } else if (type === 1) {
          items.push(
            <path
              key={`${r}-${c}`}
              d={`M${x + 5} ${y + 5} Q${x + 25} ${y + 45} ${x + 45} ${y + 5}`}
              stroke="#1A1A1A"
              strokeWidth={2}
              fill="none"
              opacity={0.3}
            />
          );
        }
      }
    }
    return items;
  }, [cols]);

  return (
    <svg
      width={width}
      height={HERO_HEIGHT}
      style={{ position: 'absolute', inset: 0 }}
      aria-hidden
    >
      {shapes}
    </svg>
  );
}

// ── Creditlinker logo ─────────────────────────────────────────────────────────
function Logo() {
  return (
    <svg width={44} height={44} viewBox="0 0 88 88" aria-label="Creditlinker logo">
      <rect width={88} height={88} rx={20} fill="#0A2540" />
      <path
        d="M22 44C22 31.85 31.85 22 44 22C56.15 22 66 31.85 66 44"
        stroke="#00D4FF"
        strokeWidth={6.5}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M22 44C22 56.15 31.85 66 44 66H66"
        stroke="white"
        strokeWidth={6.5}
        strokeLinecap="round"
        fill="none"
      />
      <circle cx={44} cy={44} r={8} fill="#00D4FF" />
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Use a fixed width for SSR; the pattern is decorative so this is fine.
  const patternWidth = typeof window !== 'undefined' ? window.innerWidth : 390;

  return (
    <div
      style={{
        minHeight: '100dvh',
        backgroundColor: C.bgDark,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── HEADER ── */}
      <div
        style={{
          position: 'relative',
          height: HERO_HEIGHT,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <BackgroundPattern width={patternWidth} />

        {/* Logo card */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            marginTop: -20,
            width: 70,
            height: 70,
            backgroundColor: '#FFF',
            borderRadius: 20,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          }}
        >
          <Logo />
        </div>
      </div>

      {/* ── BODY (white card with big top-left curve) ── */}
      <div
        style={{
          flex: 1,
          backgroundColor: C.bgLight,
          borderTopLeftRadius: 100,
          marginTop: -40,
          padding: '50px 30px 40px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <h1
          style={{
            fontSize: 32,
            fontWeight: 500,
            color: C.textPrimary,
            textAlign: 'center',
            marginBottom: 8,
            letterSpacing: -0.5,
          }}
        >
          Login
        </h1>

        <p
          style={{
            fontSize: 13,
            color: C.textMuted,
            textAlign: 'center',
            marginBottom: 32,
            letterSpacing: 0.2,
          }}
        >
          Your business financial identity
        </p>

        {/* Email */}
        <div style={fieldWrap}>
          <label style={labelStyle} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Password */}
        <div style={fieldWrap}>
          <label style={labelStyle} htmlFor="password">
            Password
          </label>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <input
              id="password"
              type={showPass ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ ...inputStyle, flex: 1, border: 'none', background: 'transparent' }}
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              aria-label={showPass ? 'Hide password' : 'Show password'}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0 4px',
                color: C.textMuted,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Login button */}
        <button
          type="button"
          style={{
            backgroundColor: C.bgDark,
            color: '#FFF',
            height: 58,
            borderRadius: 16,
            border: 'none',
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            marginTop: 20,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          }}
        >
          Login
        </button>

        {/* Sign up link */}
        <p
          style={{
            marginTop: 40,
            textAlign: 'center',
            fontSize: 14,
            color: C.textMuted,
          }}
        >
          Don&apos;t have an account?{' '}
          <a
            href="/register"
            style={{ fontWeight: 700, color: C.textPrimary, textDecoration: 'none' }}
          >
            Sign Up
          </a>
        </p>
      </div>
    </div>
  );
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const fieldWrap: React.CSSProperties = {
  marginBottom: 20,
  border: `1px solid ${C.border}`,
  borderRadius: 16,
  padding: '10px 16px',
  backgroundColor: C.inputBg,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: C.textPrimary,
  marginBottom: 2,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  fontSize: 15,
  color: C.textPrimary,
  height: 24,
  padding: 0,
  border: 'none',
  outline: 'none',
  backgroundColor: 'transparent',
};
