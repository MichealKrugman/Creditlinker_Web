"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const poem = [
  { text: "Before first light in Lagos", indent: false },
  { text: "numbers are counted in silence", indent: false },
  { text: "hands move, goods turn, trust circulates", indent: false },
  { text: "yet no one writes it down", indent: false },
  { text: "", indent: false },
  { text: "They asked for land", indent: false },
  { text: "for papers stamped in distant offices", indent: false },
  { text: "for names that open doors", indent: false },
  { text: "and where none of that existed", indent: false },
  { text: "the answer closed like iron", indent: false },
  { text: "", indent: false },
  { text: "Still the truth kept moving", indent: false },
  { text: "in quiet cycles", indent: false },
  { text: "money in, money out", indent: false },
  { text: "promises kept", indent: false },
  { text: "days repeated with precision", indent: false },
  { text: "a discipline no form could read", indent: false },
  { text: "", indent: false },
  { text: "Then something listened", indent: true },
  { text: "", indent: false },
  { text: "Not to stories", indent: true },
  { text: "to movement", indent: true },
  { text: "", indent: false },
  { text: "Six months of life", indent: false },
  { text: "captured in flow", indent: false },
  { text: "rent paid, stock returned, wages settled", indent: false },
  { text: "a pattern forming", indent: false },
  { text: "a signal without permission", indent: false },
  { text: "", indent: false },
  { text: "A voice without a mouth", indent: false },
  { text: "saying this one stands", indent: false },
  { text: "this one builds", indent: false },
  { text: "this one does not disappear", indent: false },
  { text: "", indent: false },
  { text: "And so it began", indent: true },
  { text: "", indent: false },
  { text: "Not loudly", indent: false },
  { text: "not announced", indent: false },
  { text: "but as a settling of an old imbalance", indent: false },
  { text: "", indent: false },
  { text: "Creditlinker", indent: true },
  { text: "", indent: false },
  { text: "Not a score", indent: false },
  { text: "something deeper", indent: false },
  { text: "a way to be seen without asking", indent: false },
  { text: "a record that speaks before you enter the room", indent: false },
  { text: "", indent: false },
  { text: "The doors shifted", indent: false },
  { text: "", indent: false },
  { text: "Not all", indent: false },
  { text: "never all at once", indent: false },
  { text: "but enough", indent: false },
  { text: "", indent: false },
  { text: "Capital started to look differently", indent: false },
  { text: "not at what could be seized", indent: false },
  { text: "but at what could be trusted", indent: false },
  { text: "", indent: false },
  { text: "Soon a woman in Kano will touch her phone", indent: false },
  { text: "and the answer will already be waiting", indent: false },
  { text: "not begged for", indent: false },
  { text: "not negotiated", indent: false },
  { text: "earned", indent: true },
  { text: "", indent: false },
  { text: "Soon many will become one", indent: false },
  { text: "and one will be enough", indent: false },
  { text: "", indent: false },
  { text: "Soon this thing will travel", indent: false },
  { text: "because truth does not stay in one place", indent: false },
  { text: "", indent: false },
  { text: "And when it is fully understood", indent: false },
  { text: "no one will ask what you own", indent: false },
  { text: "", indent: false },
  { text: "they will ask what your pattern says", indent: true },
  { text: "", indent: false },
  { text: "For now it runs quietly", indent: false },
  { text: "beneath notice", indent: false },
  { text: "inside the flow of things", indent: false },
  { text: "", indent: false },
  { text: "building a memory that does not forget", indent: false },
  { text: "", indent: false },
  { text: "Read it well", indent: false },
  { text: "it is already writing you", indent: true },
];

export default function LorePage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap');

        .lore-page {
          min-height: 100vh;
          background: #06080F;
          position: relative;
          overflow: hidden;
        }

        .lore-stars {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }

        .star {
          position: absolute;
          border-radius: 50%;
          background: white;
          animation: star-twinkle var(--duration, 4s) ease-in-out infinite;
          animation-delay: var(--delay, 0s);
          opacity: var(--base-opacity, 0.4);
        }

        @keyframes star-twinkle {
          0%, 100% { opacity: var(--base-opacity, 0.4); transform: scale(1); }
          50% { opacity: calc(var(--base-opacity, 0.4) * 2.5); transform: scale(1.3); }
        }

        .lore-grain {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1;
          opacity: 0.035;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 256px 256px;
        }

        .lore-glow {
          position: fixed;
          width: 700px;
          height: 700px;
          border-radius: 50%;
          background: radial-gradient(ellipse, rgba(180, 130, 40, 0.07) 0%, transparent 70%);
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
          z-index: 0;
          animation: glow-breathe 8s ease-in-out infinite;
        }

        @keyframes glow-breathe {
          0%, 100% { opacity: 0.7; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
        }

        .lore-content {
          position: relative;
          z-index: 2;
          max-width: 640px;
          margin: 0 auto;
          padding: 72px 32px 120px;
          box-sizing: border-box;
        }

        .lore-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: rgba(200, 160, 60, 0.4);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          text-decoration: none;
          margin-bottom: 64px;
          transition: color 0.2s;
        }

        .lore-back:hover {
          color: rgba(200, 160, 60, 0.8);
        }

        .lore-title {
          font-family: 'EB Garamond', Georgia, serif;
          font-size: clamp(30px, 5.5vw, 54px);
          font-weight: 400;
          font-style: italic;
          background: linear-gradient(135deg, #B8801A 0%, #E8C96A 35%, #F0D878 55%, #C8902A 75%, #A06820 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gold-shimmer 7s linear infinite;
          margin-bottom: 10px;
          line-height: 1.1;
        }

        @keyframes gold-shimmer {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }

        .lore-subtitle {
          font-family: 'EB Garamond', Georgia, serif;
          font-size: 12px;
          font-weight: 400;
          letter-spacing: 0.28em;
          color: rgba(200, 160, 60, 0.3);
          text-transform: uppercase;
          margin-bottom: 56px;
        }

        .lore-divider {
          width: 40px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(200, 160, 60, 0.35), transparent);
          margin: 0 auto 64px;
        }

        .lore-poem {
          font-family: 'EB Garamond', Georgia, serif;
          font-size: clamp(17px, 2.2vw, 20px);
          line-height: 2;
          color: rgba(235, 220, 190, 0.78);
          text-align: center;
        }

        .lore-line {
          display: block;
          animation: line-appear 1s ease forwards;
          opacity: 0;
        }

        .lore-line:hover {
          color: rgba(235, 220, 190, 1);
          transition: color 0.25s;
        }

        .lore-line.indent {
          font-style: italic;
          color: rgba(210, 168, 68, 0.7);
        }

        .lore-line.blank {
          line-height: 0.9;
        }

        @keyframes line-appear {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .lore-colophon {
          margin-top: 80px;
          text-align: center;
        }

        .lore-colophon-mark {
          display: block;
          font-size: 18px;
          margin-bottom: 14px;
          background: linear-gradient(135deg, #B8801A, #E8C96A, #B8801A);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gold-shimmer 7s linear infinite;
        }

        .lore-colophon-text {
          font-family: 'EB Garamond', Georgia, serif;
          font-size: 11px;
          letter-spacing: 0.22em;
          color: rgba(200, 160, 60, 0.22);
          text-transform: uppercase;
        }

        @media (max-width: 600px) {
          .lore-content { padding: 48px 24px 96px; }
          .lore-back { margin-bottom: 48px; }
          .lore-subtitle { margin-bottom: 40px; }
          .lore-divider { margin-bottom: 48px; }
        }
      `}</style>

      <div className="lore-page">

        {/* Stars */}
        <div className="lore-stars" aria-hidden>
          {[
            [8.3,12.4,1.2,4.1,1.8,0.18],[92.1,7.6,0.7,6.2,2.4,0.12],[45.7,3.2,1.5,3.8,0.6,0.22],
            [23.9,88.1,1.0,5.5,1.2,0.15],[67.4,45.3,1.8,4.8,3.1,0.20],[14.2,62.7,0.6,7.1,0.3,0.10],
            [78.6,28.9,1.3,3.4,2.8,0.25],[35.1,74.5,0.9,6.7,1.5,0.13],[55.8,91.2,1.6,5.0,0.9,0.19],
            [90.3,55.8,0.8,4.3,2.2,0.16],[3.7,39.6,1.1,7.8,1.7,0.14],[72.5,18.3,1.4,3.1,0.4,0.23],
            [48.9,81.7,0.7,5.9,2.6,0.11],[19.6,6.4,1.7,4.6,1.1,0.21],[85.2,72.1,1.0,6.3,3.3,0.17],
            [61.4,34.8,0.5,7.5,0.7,0.09],[29.8,48.2,1.9,3.7,2.0,0.26],[40.3,95.6,0.8,5.2,1.4,0.12],
            [96.7,22.4,1.2,4.9,2.9,0.20],[11.5,67.3,1.5,6.1,0.5,0.18],[53.2,13.8,0.6,7.3,1.8,0.13],
            [76.9,58.5,1.3,3.3,2.4,0.22],[32.4,83.9,1.0,5.7,1.0,0.15],[88.1,41.2,0.9,4.4,3.0,0.19],
            [5.6,76.8,1.6,6.8,0.8,0.10],[42.7,29.1,0.7,3.9,2.1,0.24],[64.3,52.7,1.4,7.0,1.6,0.16],
            [17.8,93.4,1.1,5.3,0.3,0.21],[80.5,15.6,0.8,4.1,2.7,0.14],[26.1,70.2,1.7,6.5,1.3,0.17],
            [58.4,37.9,0.5,3.6,2.5,0.23],[37.9,8.7,1.2,7.2,0.6,0.11],[94.2,84.3,1.5,4.7,1.9,0.20],
            [50.6,60.4,0.9,5.8,2.3,0.13],[7.3,46.1,1.8,3.2,1.0,0.25],[70.1,24.5,0.6,6.9,2.8,0.16],
            [44.8,78.6,1.3,4.5,0.4,0.19],[83.7,10.3,1.0,5.1,1.7,0.12],[21.4,56.9,0.7,7.6,2.2,0.22],
            [33.6,40.7,1.6,3.5,1.2,0.15],[68.9,89.4,0.8,6.0,3.1,0.18],[15.3,21.8,1.4,4.8,0.7,0.24],
            [57.1,65.3,1.1,7.4,2.6,0.10],[25.7,97.8,0.5,3.8,1.5,0.21],[86.4,32.1,1.9,5.5,2.0,0.14],
            [39.5,50.6,0.8,4.2,0.9,0.17],[73.8,75.9,1.2,6.6,2.4,0.20],[10.9,14.5,1.5,3.0,1.3,0.23],
            [62.6,43.2,0.9,7.9,2.9,0.11],[47.3,87.4,0.7,5.4,0.5,0.19],[91.8,61.7,1.6,4.0,1.8,0.16],
            [28.4,26.3,1.3,6.3,2.7,0.13],[54.7,11.9,1.0,3.4,1.1,0.22],[79.2,49.8,0.6,7.1,2.2,0.15],
            [16.8,80.5,1.8,5.6,0.6,0.25],[43.1,35.4,0.8,4.3,3.0,0.10],[69.5,69.1,1.5,6.8,1.4,0.18],
            [6.2,53.7,1.1,3.7,2.5,0.21],[87.9,7.2,0.7,5.0,0.8,0.14],[31.7,92.6,1.4,7.7,1.9,0.17],
            [56.4,17.8,0.9,4.6,2.3,0.23],[22.3,44.9,1.2,6.2,1.0,0.12],[75.6,79.3,0.5,3.1,2.8,0.20],
            [49.2,30.7,1.7,5.8,0.4,0.15],[13.5,66.4,1.0,7.4,1.6,0.19],[84.3,23.6,0.8,4.1,2.1,0.24],
            [38.8,57.1,1.3,6.5,1.3,0.11],[65.1,42.8,0.6,3.8,2.6,0.17],[9.4,85.2,1.6,5.3,0.9,0.22],
            [77.4,4.9,1.1,7.0,3.2,0.13],[24.6,73.6,0.9,4.4,1.7,0.20],[52.9,19.3,1.4,6.7,0.3,0.16],
            [41.5,96.1,0.7,3.5,2.4,0.23],[89.7,38.4,1.8,5.1,1.2,0.10],[18.2,59.7,0.5,7.8,2.9,0.18],
            [63.8,27.5,1.2,4.7,1.5,0.21],[34.4,82.3,1.5,6.4,2.0,0.14],[71.2,47.6,0.8,3.3,0.6,0.25],
            [46.6,13.1,1.0,5.9,1.8,0.12],[95.3,71.8,0.7,7.2,2.7,0.17],[27.9,33.9,1.3,4.0,1.1,0.22],
            [60.7,86.7,1.6,6.1,3.3,0.15],[4.8,20.4,0.9,3.6,0.7,0.19],[82.6,64.5,1.1,5.7,2.2,0.24],
            [36.2,8.1,0.6,7.5,1.4,0.11],[59.9,51.3,1.7,4.3,2.8,0.20],[12.1,77.9,1.4,6.8,0.5,0.16],
            [74.5,36.2,0.8,3.2,1.9,0.23],[30.3,62.8,1.5,5.4,2.5,0.13],[66.8,90.7,1.2,7.6,1.0,0.18],
            [2.5,48.5,0.5,4.2,3.1,0.21],[81.4,16.9,1.9,6.3,0.8,0.14],[45.3,72.4,0.7,3.9,2.3,0.25],
            [20.9,31.6,1.3,5.5,1.6,0.10],[97.6,55.3,1.0,7.3,2.0,0.17],[55.5,98.4,0.8,4.6,0.4,0.22],
          ].map(([x, y, size, duration, delay, opacity], i) => (
            <span
              key={i}
              className="star"
              style={{
                width: size,
                height: size,
                left: `${x}%`,
                top: `${y}%`,
                ["--duration" as string]: `${duration}s`,
                ["--delay" as string]: `${delay}s`,
                ["--base-opacity" as string]: opacity,
              }}
            />
          ))}
        </div>

        {/* Grain */}
        <div className="lore-grain" aria-hidden />

        {/* Glow */}
        <div className="lore-glow" aria-hidden />

        {/* Content */}
        <div className="lore-content">

          <Link href="/home" className="lore-back">
            <ArrowLeft size={11} />
            Back
          </Link>

          <div style={{ textAlign: "center" }}>
            <h1 className="lore-title">The Ledger of Light</h1>
            <p className="lore-subtitle">The Lore of Creditlinker</p>
          </div>

          <div className="lore-divider" />

          <div className="lore-poem">
            {poem.map((line, i) => (
              <span
                key={i}
                className={`lore-line${line.indent ? " indent" : ""}${line.text === "" ? " blank" : ""}`}
                style={{ animationDelay: `${i * 0.042}s` }}
              >
                {line.text || "\u00A0"}
              </span>
            ))}
          </div>

          <div className="lore-colophon">
            <span className="lore-colophon-mark">✦</span>
            <p className="lore-colophon-text">Creditlinker · Lagos</p>
          </div>

        </div>
      </div>
    </>
  );
}
