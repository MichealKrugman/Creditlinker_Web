"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Search, Clock, X } from "lucide-react";
import {
  getAllPosts, getFeaturedPost, getPostsByCategory,
  getCategoryCounts, formatDate,
  CATEGORY_CONFIG, BlogCategory, BlogPost,
} from "@/lib/blog";

// ─────────────────────────────────────────────────────────────
//  POST CARD
// ─────────────────────────────────────────────────────────────

function PostCard({ post }: { post: BlogPost }) {
  const cat = CATEGORY_CONFIG[post.category];
  return (
    <Link
      href={`/blog/${post.slug}`}
      style={{ textDecoration: "none", display: "flex", flexDirection: "column" }}
    >
      <article
        style={{
          background: "white",
          border: "1px solid #E5E7EB",
          borderRadius: 16,
          padding: 24,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          transition: "border-color 0.15s, box-shadow 0.15s",
          cursor: "pointer",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = "#D1D5DB";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.07)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB";
          (e.currentTarget as HTMLElement).style.boxShadow = "none";
        }}
      >
        {/* Category pill */}
        <span style={{
          display: "inline-flex", alignSelf: "flex-start",
          fontSize: 11, fontWeight: 700,
          color: cat.color, background: cat.bg,
          padding: "3px 10px", borderRadius: 9999,
        }}>
          {cat.label}
        </span>

        {/* Title */}
        <h2 style={{
          fontFamily: "var(--font-display)", fontWeight: 700,
          fontSize: 17, color: "#0A2540", lineHeight: 1.3,
          letterSpacing: "-0.02em", flex: 1,
        }}>
          {post.title}
        </h2>

        {/* Excerpt */}
        <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7 }}>
          {post.excerpt}
        </p>

        {/* Meta */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 8, borderTop: "1px solid #F3F4F6" }}>
          {/* Author avatar */}
          <div style={{
            width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
            background: post.author.color,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 700, color: "white",
          }}>
            {post.author.initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{post.author.name}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#9CA3AF", flexShrink: 0 }}>
            <Clock size={11} />
            {post.reading_time_mins} min read
          </div>
        </div>
      </article>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────
//  FEATURED HERO POST
// ─────────────────────────────────────────────────────────────

function FeaturedPost({ post }: { post: BlogPost }) {
  const cat = CATEGORY_CONFIG[post.category];
  return (
    <Link href={`/blog/${post.slug}`} style={{ textDecoration: "none" }}>
      <article
        style={{
          background: "#0A2540",
          borderRadius: 20,
          padding: "48px 52px",
          position: "relative",
          overflow: "hidden",
          cursor: "pointer",
          transition: "box-shadow 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 24px 80px rgba(10,37,64,0.3)"}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "none"}
      >
        {/* Grid bg */}
        <div aria-hidden style={{
          pointerEvents: "none", position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }} />

        <div style={{ position: "relative", maxWidth: 680 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <span style={{
              fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase",
              color: "#0A2540", background: "#00D4FF",
              padding: "3px 10px", borderRadius: 9999,
            }}>
              Featured
            </span>
            <span style={{
              fontSize: 11, fontWeight: 600, color: cat.color, background: cat.bg,
              padding: "3px 10px", borderRadius: 9999,
            }}>
              {cat.label}
            </span>
          </div>

          <h2 style={{
            fontFamily: "var(--font-display)", fontWeight: 800, color: "white",
            fontSize: "clamp(22px, 3vw, 34px)", lineHeight: 1.15,
            letterSpacing: "-0.03em", marginBottom: 16,
          }}>
            {post.title}
          </h2>

          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.55)", lineHeight: 1.75, marginBottom: 28, maxWidth: 560 }}>
            {post.excerpt}
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: post.author.color,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, color: "white",
              }}>
                {post.author.initials}
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "white" }}>{post.author.name}</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{post.author.role}</p>
              </div>
            </div>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>·</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: 4 }}>
              <Clock size={11} /> {post.reading_time_mins} min read
            </span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{formatDate(post.published_at)}</span>
            <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 600, color: "#00D4FF" }}>
              Read <ArrowRight size={13} />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────
//  PAGE
// ─────────────────────────────────────────────────────────────

const ALL_CATEGORIES = Object.keys(CATEGORY_CONFIG) as BlogCategory[];

export default function BlogIndexPage() {
  const [activeCategory, setActiveCategory] = useState<BlogCategory | "all">("all");
  const [searchQuery,    setSearchQuery]    = useState("");

  const featured    = getFeaturedPost();
  const allPosts    = getAllPosts();
  const catCounts   = getCategoryCounts();

  const filteredPosts = useMemo(() => {
    let posts = activeCategory === "all"
      ? allPosts
      : getPostsByCategory(activeCategory);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      posts = posts.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q)) ||
        CATEGORY_CONFIG[p.category].label.toLowerCase().includes(q)
      );
    }

    // Don't show featured in the grid when showing "all" without search
    if (activeCategory === "all" && !searchQuery.trim() && featured) {
      return posts.filter(p => p.slug !== featured.slug);
    }

    return posts;
  }, [activeCategory, searchQuery, allPosts, featured]);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 32px 96px" }}>

      {/* Header */}
      <div style={{ marginBottom: 56, maxWidth: 640 }}>
        <p style={{
          fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
          color: "#00A8CC", marginBottom: 12,
        }}>
          Creditlinker Blog
        </p>
        <h1 style={{
          fontFamily: "var(--font-display)", fontWeight: 800,
          fontSize: "clamp(32px, 4vw, 52px)", color: "#0A2540",
          letterSpacing: "-0.04em", lineHeight: 1.08, marginBottom: 16,
        }}>
          Financial education.<br />
          Real business stories.
        </h1>
        <p style={{ fontSize: 17, color: "#4B5563", lineHeight: 1.75 }}>
          Insights on financial identity, capital access, and what it really takes for African
          businesses to access the funding they deserve.
        </p>
      </div>

      {/* Featured post */}
      {featured && activeCategory === "all" && !searchQuery && (
        <div style={{ marginBottom: 56 }}>
          <FeaturedPost post={featured} />
        </div>
      )}

      {/* Filters row */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        flexWrap: "wrap", marginBottom: 36,
      }}>
        {/* Category tabs */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flex: 1 }}>
          <button
            onClick={() => setActiveCategory("all")}
            style={{
              padding: "6px 14px", borderRadius: 9999,
              border: `1.5px solid ${activeCategory === "all" ? "#0A2540" : "#E5E7EB"}`,
              background: activeCategory === "all" ? "#0A2540" : "white",
              color: activeCategory === "all" ? "white" : "#6B7280",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              transition: "all 0.12s",
            }}
          >
            All ({allPosts.length})
          </button>
          {ALL_CATEGORIES.map(cat => {
            const cfg = CATEGORY_CONFIG[cat];
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: "6px 14px", borderRadius: 9999,
                  border: `1.5px solid ${active ? cfg.color : "#E5E7EB"}`,
                  background: active ? cfg.bg : "white",
                  color: active ? cfg.color : "#6B7280",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                  transition: "all 0.12s",
                }}
              >
                {cfg.label} ({catCounts[cat] ?? 0})
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <Search size={13} style={{
            position: "absolute", left: 12, top: "50%",
            transform: "translateY(-50%)", color: "#9CA3AF", pointerEvents: "none",
          }} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search articles…"
            style={{
              height: 38, paddingLeft: 34, paddingRight: searchQuery ? 32 : 12,
              border: "1.5px solid #E5E7EB", borderRadius: 9999,
              fontSize: 13, color: "#0A2540", outline: "none",
              width: 200, transition: "border-color 0.12s, width 0.2s",
            }}
            onFocus={e => { e.target.style.borderColor = "#0A2540"; e.target.style.width = "240px"; }}
            onBlur={e => { e.target.style.borderColor = "#E5E7EB"; e.target.style.width = "200px"; }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", color: "#9CA3AF",
                display: "flex", padding: 0,
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {filteredPosts.length === 0 ? (
        <div style={{
          padding: "64px 24px", textAlign: "center",
          background: "white", borderRadius: 16, border: "1px solid #E5E7EB",
        }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: "#0A2540", marginBottom: 8 }}>No articles found</p>
          <p style={{ fontSize: 14, color: "#9CA3AF" }}>
            Try adjusting your search or{" "}
            <button onClick={() => { setSearchQuery(""); setActiveCategory("all"); }} style={{ background: "none", border: "none", color: "#0A2540", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>
              clear filters
            </button>
          </p>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 20,
        }}>
          {filteredPosts.map(post => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
