"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock, Calendar, Info, AlertTriangle, Lightbulb, Quote } from "lucide-react";
import {
  getPostBySlug, getRelatedPosts, formatDate,
  CATEGORY_CONFIG, ContentBlock, BlogPost,
} from "@/lib/blog";

// ─────────────────────────────────────────────────────────────
//  BODY RENDERER
//  Renders the portable ContentBlock[] format to React elements.
//  When you connect a CMS, replace this with your CMS's rich-text
//  renderer (PortableText, rich-text-html, etc.).
// ─────────────────────────────────────────────────────────────

function renderBlock(block: ContentBlock, i: number): React.ReactNode {
  switch (block.type) {
    case "h2":
      return (
        <h2 key={i} style={{
          fontFamily: "var(--font-display)", fontWeight: 800,
          fontSize: "clamp(20px, 2.5vw, 26px)", color: "#0A2540",
          letterSpacing: "-0.03em", lineHeight: 1.2,
          marginTop: 44, marginBottom: 16,
        }}>
          {block.text}
        </h2>
      );

    case "h3":
      return (
        <h3 key={i} style={{
          fontFamily: "var(--font-display)", fontWeight: 700,
          fontSize: 18, color: "#0A2540",
          letterSpacing: "-0.02em", lineHeight: 1.3,
          marginTop: 28, marginBottom: 10,
        }}>
          {block.text}
        </h3>
      );

    case "p":
      return (
        <p key={i} style={{
          fontSize: 17, color: "#374151", lineHeight: 1.85,
          marginBottom: 20,
        }}>
          {block.text}
        </p>
      );

    case "ul":
      return (
        <ul key={i} style={{ marginBottom: 20, paddingLeft: 0, listStyle: "none" }}>
          {block.items.map((item, j) => (
            <li key={j} style={{
              display: "flex", gap: 12, alignItems: "flex-start",
              marginBottom: 10, fontSize: 16, color: "#374151", lineHeight: 1.7,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "#00D4FF", flexShrink: 0, marginTop: 10,
              }} />
              {item}
            </li>
          ))}
        </ul>
      );

    case "ol":
      return (
        <ol key={i} style={{ marginBottom: 20, paddingLeft: 0, listStyle: "none", counterReset: "ol-counter" }}>
          {block.items.map((item, j) => (
            <li key={j} style={{
              display: "flex", gap: 14, alignItems: "flex-start",
              marginBottom: 10, fontSize: 16, color: "#374151", lineHeight: 1.7,
            }}>
              <span style={{
                width: 22, height: 22, borderRadius: "50%",
                background: "#0A2540", color: "white",
                fontSize: 11, fontWeight: 700, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginTop: 3,
              }}>
                {j + 1}
              </span>
              {item}
            </li>
          ))}
        </ol>
      );

    case "callout": {
      const CALLOUT_CONFIG = {
        info:    { icon: <Info size={15} />,         color: "#0891B2", bg: "#F0FDFF", border: "rgba(8,145,178,0.2)"    },
        warning: { icon: <AlertTriangle size={15} />, color: "#F59E0B", bg: "#FFFBEB", border: "rgba(245,158,11,0.25)" },
        tip:     { icon: <Lightbulb size={15} />,    color: "#10B981", bg: "#ECFDF5", border: "rgba(16,185,129,0.2)"  },
      };
      const cfg = CALLOUT_CONFIG[block.variant];
      return (
        <div key={i} style={{
          display: "flex", gap: 14, alignItems: "flex-start",
          background: cfg.bg, border: `1px solid ${cfg.border}`,
          borderRadius: 12, padding: "16px 18px", marginBottom: 24,
        }}>
          <span style={{ color: cfg.color, flexShrink: 0, marginTop: 1 }}>{cfg.icon}</span>
          <p style={{ fontSize: 15, color: "#374151", lineHeight: 1.75, margin: 0 }}>{block.text}</p>
        </div>
      );
    }

    case "quote":
      return (
        <blockquote key={i} style={{
          borderLeft: "3px solid #00D4FF",
          paddingLeft: 24, marginLeft: 0, marginBottom: 24,
        }}>
          <p style={{
            fontSize: 18, color: "#0A2540", lineHeight: 1.7,
            fontStyle: "italic", fontWeight: 500, marginBottom: 8,
          }}>
            "{block.text}"
          </p>
          {block.attribution && (
            <p style={{ fontSize: 13, color: "#9CA3AF", fontWeight: 600 }}>
              — {block.attribution}
            </p>
          )}
        </blockquote>
      );

    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────
//  RELATED POST CARD
// ─────────────────────────────────────────────────────────────

function RelatedCard({ post }: { post: BlogPost }) {
  const cat = CATEGORY_CONFIG[post.category];
  return (
    <Link href={`/blog/${post.slug}`} style={{ textDecoration: "none" }}>
      <div
        style={{
          background: "white", border: "1px solid #E5E7EB", borderRadius: 14,
          padding: "20px 22px", display: "flex", flexDirection: "column", gap: 10,
          transition: "border-color 0.15s, box-shadow 0.15s", cursor: "pointer",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = "#D1D5DB";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.06)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = "#E5E7EB";
          (e.currentTarget as HTMLElement).style.boxShadow = "none";
        }}
      >
        <span style={{ fontSize: 10, fontWeight: 700, color: cat.color, background: cat.bg, padding: "2px 8px", borderRadius: 9999, alignSelf: "flex-start" }}>
          {cat.label}
        </span>
        <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "#0A2540", lineHeight: 1.3, letterSpacing: "-0.02em" }}>
          {post.title}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#9CA3AF" }}>
          <Clock size={10} />
          {post.reading_time_mins} min read
        </div>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────
//  PAGE
// ─────────────────────────────────────────────────────────────

export default function BlogArticlePage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  const cat          = CATEGORY_CONFIG[post.category];
  const relatedPosts = getRelatedPosts(post.related_slugs);

  return (
    <>
      <style>{`
        .article-grid {
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: 64px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .article-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
          .article-sidebar { order: -1; }
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 32px 96px" }}>

        {/* Back */}
        <Link
          href="/blog"
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 13, fontWeight: 600, color: "#6B7280",
            textDecoration: "none", marginBottom: 40,
            transition: "color 0.12s",
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#0A2540"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#6B7280"}
        >
          <ArrowLeft size={14} /> Back to Blog
        </Link>

        <div className="article-grid">

          {/* ── ARTICLE ── */}
          <div>
            {/* Category + meta */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" as const }}>
              <span style={{
                fontSize: 12, fontWeight: 700, color: cat.color, background: cat.bg,
                padding: "4px 12px", borderRadius: 9999,
              }}>
                {cat.label}
              </span>
              <span style={{ fontSize: 12, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 4 }}>
                <Calendar size={11} /> {formatDate(post.published_at)}
              </span>
              <span style={{ fontSize: 12, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 4 }}>
                <Clock size={11} /> {post.reading_time_mins} min read
              </span>
            </div>

            {/* Title */}
            <h1 style={{
              fontFamily: "var(--font-display)", fontWeight: 800, color: "#0A2540",
              fontSize: "clamp(26px, 3.5vw, 42px)", letterSpacing: "-0.04em",
              lineHeight: 1.1, marginBottom: 20,
            }}>
              {post.title}
            </h1>

            {/* Excerpt / lead */}
            <p style={{
              fontSize: 19, color: "#4B5563", lineHeight: 1.7,
              marginBottom: 32, paddingBottom: 32, borderBottom: "1px solid #E5E7EB",
              fontWeight: 400,
            }}>
              {post.excerpt}
            </p>

            {/* Author byline */}
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              marginBottom: 40, paddingBottom: 40, borderBottom: "1px solid #E5E7EB",
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: post.author.color,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 700, color: "white", flexShrink: 0,
              }}>
                {post.author.initials}
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#0A2540" }}>{post.author.name}</p>
                <p style={{ fontSize: 12, color: "#6B7280" }}>{post.author.role}</p>
              </div>
            </div>

            {/* Body */}
            <div>
              {post.body.map((block, i) => renderBlock(block, i))}
            </div>

            {/* Tags */}
            {post.tags.length > 0 && (
              <div style={{
                display: "flex", gap: 8, flexWrap: "wrap" as const,
                marginTop: 48, paddingTop: 32, borderTop: "1px solid #E5E7EB",
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#9CA3AF", alignSelf: "center" }}>Tags:</span>
                {post.tags.map(tag => (
                  <span key={tag} style={{
                    fontSize: 12, fontWeight: 500, color: "#374151",
                    background: "#F3F4F6", border: "1px solid #E5E7EB",
                    padding: "3px 10px", borderRadius: 9999,
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Related posts */}
            {relatedPosts.length > 0 && (
              <div style={{ marginTop: 64 }}>
                <h2 style={{
                  fontFamily: "var(--font-display)", fontWeight: 700,
                  fontSize: 20, color: "#0A2540", marginBottom: 20,
                  letterSpacing: "-0.02em",
                }}>
                  Related articles
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
                  {relatedPosts.map(p => <RelatedCard key={p.slug} post={p} />)}
                </div>
              </div>
            )}
          </div>

          {/* ── SIDEBAR ── */}
          <aside className="article-sidebar" style={{ position: "sticky", top: 88 }}>

            {/* CTA card */}
            <div style={{
              background: "#0A2540", borderRadius: 16,
              padding: "24px", marginBottom: 20,
              position: "relative", overflow: "hidden",
            }}>
              <div aria-hidden style={{
                pointerEvents: "none", position: "absolute", inset: 0,
                backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)",
                backgroundSize: "32px 32px",
              }} />
              <div style={{ position: "relative" }}>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, color: "white", marginBottom: 8, lineHeight: 1.3, letterSpacing: "-0.02em" }}>
                  Build your financial identity
                </p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, marginBottom: 18 }}>
                  Connect your bank accounts and get a verified Creditlinker ID in minutes.
                </p>
                <Link
                  href="/register"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    background: "#00D4FF", color: "#0A2540",
                    padding: "11px 0", borderRadius: 8,
                    fontWeight: 700, fontSize: 14, textDecoration: "none",
                    width: "100%",
                  }}
                >
                  Get started free <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* Category description */}
            <div style={{
              background: "white", border: "1px solid #E5E7EB",
              borderRadius: 14, padding: "18px 20px",
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                In this category
              </p>
              <span style={{
                display: "inline-flex", fontSize: 12, fontWeight: 700,
                color: cat.color, background: cat.bg,
                padding: "4px 12px", borderRadius: 9999, marginBottom: 10,
              }}>
                {cat.label}
              </span>
              <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6, marginBottom: 12 }}>
                {cat.description}
              </p>
              <Link
                href={`/blog?category=${post.category}`}
                style={{
                  fontSize: 13, fontWeight: 600, color: "#0A2540",
                  textDecoration: "none", display: "flex", alignItems: "center", gap: 4,
                  transition: "gap 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.gap = "8px"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.gap = "4px"}
              >
                More in {cat.label} <ArrowRight size={12} />
              </Link>
            </div>
          </aside>

        </div>
      </div>
    </>
  );
}
