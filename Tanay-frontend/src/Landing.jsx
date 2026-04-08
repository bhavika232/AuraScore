import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Dither from "./Dither";

const GRAPE   = "#8238B3";
const GOLD    = "#D7AC28";
const BRONZE  = "#C78D17";
const PALE    = "#EFD9F7";

const STATS = [
  { value: "98.4%", label: "ACCURACY RATE" },
  { value: "100K+",  label: "SESSIONS ANALYZED" },
  { value: "5★",  label: "USER RATING" },
  { value: "<2s",   label: "ANALYSIS SPEED" },
];

const MODULES = [
  { icon: "◎", color: GRAPE,  label: "Voice Analysis",    desc: "Tone · Pace · Fillers" },
  { icon: "◈", color: GOLD,   label: "Body Language",     desc: "Posture · Movement" },
  { icon: "◉", color: GRAPE,  label: "Eye Contact",       desc: "Gaze · Expression" },
  { icon: "◆", color: GOLD,   label: "Confidence Score",  desc: "Real-time scoring" },
  { icon: "◇", color: BRONZE, label: "Practice Mode",     desc: "Mock interviews" },
  { icon: "◈", color: GRAPE,  label: "AI Coaching",       desc: "Personalised tips" },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) { navigate("/dashboard"); return; }
  }, [user]);



  return (
    <div style={S.page}>
      {/* Dither WebGL background — Indigo/Grape tones */}
      <div style={S.ditherWrap}>
        <Dither
          waveColor={[0.19, 0.14, 0.40]}
          waveSpeed={0.04}
          waveFrequency={2.5}
          waveAmplitude={0.35}
          colorNum={4}
          pixelSize={2}
          enableMouseInteraction={true}
          mouseRadius={0.3}
        />
      </div>

      {/* Vignette overlay */}
      <div style={S.vignette} />

      {/* HERO */}
      <section style={S.hero}>
        <div style={S.eyebrow}>
          <span style={S.eyebrowDot} />
          AI-POWERED INTERVIEW INTELLIGENCE
          <span style={S.eyebrowDot} />
        </div>

        <h1 style={S.title}>
          <span style={S.titleLine1}>MASTER YOUR</span>
          <br />
          <span style={S.titleLine2}>INTERVIEW AURA</span>
        </h1>

        <p style={S.subtitle}>
          Real-time analysis of voice, posture, eye contact, and confidence.<br />
          Know exactly how you present — before the stakes are real.
        </p>

        <div style={S.ctas}>
          <button style={S.btnPrimary} onClick={() => navigate("/signup")}>
            <span>BEGIN ANALYSIS</span>
            <span style={S.btnArrow}>→</span>
          </button>
          <button style={S.btnSecondary} onClick={() => navigate("/login")}>
            SIGN IN
          </button>
        </div>

        {/* Stats strip */}
        <div style={S.stats}>
          {STATS.map((s) => (
            <div key={s.label} style={S.stat}>
              <div style={S.statValue}>{s.value}</div>
              <div style={S.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* MODULES PREVIEW */}
      <section style={S.modulesSection}>
        <div style={S.sectionHeader}>
          <div style={S.sectionTag}>CAPABILITIES</div>
          <h2 style={S.sectionTitle}>WHAT WE ANALYSE</h2>
        </div>
        <div style={S.modulesGrid}>
          {MODULES.map((m, i) => (
            <div key={m.label} style={{ ...S.moduleCard, animationDelay: `${i * 0.08}s` }}>
              <div style={S.hudCornerTL} />
              <div style={S.hudCornerBR} />
              <span style={{ ...S.moduleIcon, color: m.color }}>{m.icon}</span>
              <div style={S.moduleLabel}>{m.label}</div>
              <div style={S.moduleDesc}>{m.desc}</div>
              <div style={{ ...S.moduleGlow, background: `radial-gradient(circle at 50% 100%, ${m.color}18, transparent 70%)` }} />
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={S.howSection}>
        <div style={S.sectionHeader}>
          <div style={S.sectionTag}>PROTOCOL</div>
          <h2 style={S.sectionTitle}>HOW IT WORKS</h2>
        </div>
        <div style={S.steps}>
          {[
            { n: "01", title: "RECORD", desc: "Start a session and answer mock interview questions. Your camera and mic capture everything." },
            { n: "02", title: "ANALYSE", desc: "Our AI processes your video in real-time — voice, posture, gaze, and expression simultaneously." },
            { n: "03", title: "IMPROVE", desc: "Get a detailed breakdown with timeline markers, scores, and actionable coaching feedback." },
          ].map((step) => (
            <div key={step.n} style={S.step}>
              <div style={S.stepNum}>{step.n}</div>
              <div style={S.stepTitle}>{step.title}</div>
              <div style={S.stepDesc}>{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" style={S.aboutSection}>
        <div style={S.aboutInner}>
          <div style={S.sectionTag}>ABOUT AURASCORE</div>
          <h2 style={{ ...S.sectionTitle, marginBottom: 20 }}>BUILT FOR HUMAN PERFORMANCE</h2>
          <p style={S.aboutText}>
            AuraScore combines computer vision, natural language processing, and behavioral science
            to give candidates an unfair advantage. We believe everyone deserves to know how they
            truly present under pressure — not just how they think they do.
          </p>
          <p style={{ ...S.aboutText, marginTop: 16 }}>
            Built by a team obsessed with human communication, AuraScore has helped thousands of
            candidates land roles at top companies by turning vague interview anxiety into
            clear, actionable data.
          </p>
          <button style={{ ...S.btnPrimary, marginTop: 36 }} onClick={() => navigate("/signup")}>
            <span>START FREE TODAY</span>
            <span style={S.btnArrow}>→</span>
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={S.footer}>
        <span style={S.footerLogo}>◈ AURASCORE</span>
        <span style={S.footerText}>© 2025 AuraScore. All rights reserved.</span>
      </footer>
    </div>
  );
}

const S = {
  page: { minHeight: "100vh", background: "#1a0033", position: "relative", overflowX: "hidden" },
  ditherWrap: {
    position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
    width: "100%", height: "100%",
  },
  vignette: {
    position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none",
    background: "radial-gradient(ellipse at center, transparent 30%, rgba(26,0,51,0.85) 80%, #1a0033 100%)",
  },

  hero: {
    position: "relative", zIndex: 2, minHeight: "100vh",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    textAlign: "center", padding: "120px 24px 80px",
  },
  eyebrow: {
    display: "flex", alignItems: "center", gap: 12,
    fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.25em",
    color: GRAPE, marginBottom: 32, opacity: 0.8,
  },
  eyebrowDot: { width: 4, height: 4, borderRadius: "50%", background: GRAPE, display: "inline-block", animation: "pulse-cyan 2s infinite" },
  title: { lineHeight: 1.05, marginBottom: 28 },
  titleLine1: {
    display: "block", fontFamily: "'Orbitron', monospace", fontSize: "clamp(36px, 7vw, 80px)",
    fontWeight: 900, color: PALE, letterSpacing: "0.06em",
  },
  titleLine2: {
    display: "block", fontFamily: "'Orbitron', monospace", fontSize: "clamp(36px, 7vw, 80px)",
    fontWeight: 900, letterSpacing: "0.06em",
    background: `linear-gradient(90deg, ${GRAPE}, ${GOLD})`,
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  },
  subtitle: {
    fontFamily: "'Rajdhani', sans-serif", fontSize: "clamp(15px, 2vw, 18px)",
    color: "rgba(239,217,247,0.6)", maxWidth: 520, lineHeight: 1.7, marginBottom: 44,
  },
  ctas: { display: "flex", gap: 16, marginBottom: 72, flexWrap: "wrap", justifyContent: "center" },
  btnPrimary: {
    display: "flex", alignItems: "center", gap: 10,
    background: `linear-gradient(135deg, rgba(130,56,179,0.20), rgba(130,56,179,0.07))`,
    border: `1px solid ${GRAPE}`, color: PALE,
    padding: "14px 32px", borderRadius: 4,
    fontFamily: "'Orbitron', monospace", fontSize: 12, fontWeight: 600, letterSpacing: "0.12em",
    cursor: "pointer", transition: "all 0.2s",
    boxShadow: `0 0 20px rgba(130,56,179,0.2), inset 0 0 20px rgba(130,56,179,0.04)`,
  },
  btnArrow: { fontSize: 16, transition: "transform 0.2s" },
  btnSecondary: {
    background: "transparent", border: `1px solid rgba(239,217,247,0.25)`,
    color: "rgba(239,217,247,0.6)", padding: "14px 32px", borderRadius: 4,
    fontFamily: "'Orbitron', monospace", fontSize: 12, fontWeight: 600, letterSpacing: "0.12em",
    cursor: "pointer", transition: "all 0.2s",
  },
  stats: {
    display: "flex", gap: 48, flexWrap: "wrap", justifyContent: "center",
    paddingTop: 48, borderTop: `1px solid rgba(130,56,179,0.15)`,
  },
  stat: { textAlign: "center" },
  statValue: {
    fontFamily: "'Orbitron', monospace", fontSize: 28, fontWeight: 700, color: GOLD,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.2em", color: "rgba(239,217,247,0.35)",
  },

  modulesSection: { position: "relative", zIndex: 2, padding: "100px 24px", maxWidth: 1100, margin: "0 auto" },
  sectionHeader: { textAlign: "center", marginBottom: 56 },
  sectionTag: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.3em", color: GRAPE,
    marginBottom: 12, opacity: 0.8,
  },
  sectionTitle: {
    fontFamily: "'Orbitron', monospace", fontSize: "clamp(22px, 4vw, 36px)", fontWeight: 700,
    color: PALE, letterSpacing: "0.08em",
  },
  modulesGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16,
  },
  moduleCard: {
    position: "relative", background: "#280055", border: `1px solid rgba(130,56,179,0.15)`,
    borderRadius: 8, padding: "32px 20px 28px", textAlign: "center",
    overflow: "hidden", animation: "fadeUp 0.5s ease both",
    transition: "border-color 0.2s, transform 0.2s",
    cursor: "default",
  },
  hudCornerTL: { position: "absolute", top: 6, left: 6, width: 10, height: 10, borderTop: `1px solid rgba(130,56,179,0.5)`, borderLeft: `1px solid rgba(130,56,179,0.5)` },
  hudCornerBR: { position: "absolute", bottom: 6, right: 6, width: 10, height: 10, borderBottom: `1px solid rgba(130,56,179,0.5)`, borderRight: `1px solid rgba(130,56,179,0.5)` },
  moduleIcon: { fontSize: 28, display: "block", marginBottom: 12, lineHeight: 1 },
  moduleLabel: { fontFamily: "'Orbitron', monospace", fontSize: 10, fontWeight: 600, color: PALE, letterSpacing: "0.08em", marginBottom: 6 },
  moduleDesc: { fontFamily: "'Rajdhani', sans-serif", fontSize: 12, color: "rgba(239,217,247,0.35)", letterSpacing: "0.06em" },
  moduleGlow: { position: "absolute", inset: 0, pointerEvents: "none" },

  howSection: { position: "relative", zIndex: 2, padding: "100px 24px", maxWidth: 900, margin: "0 auto" },
  steps: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 32, marginTop: 0 },
  step: { borderLeft: `2px solid rgba(130,56,179,0.25)`, paddingLeft: 24 },
  stepNum: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: GOLD, letterSpacing: "0.15em", marginBottom: 8, opacity: 0.8 },
  stepTitle: { fontFamily: "'Orbitron', monospace", fontSize: 14, fontWeight: 700, color: PALE, letterSpacing: "0.1em", marginBottom: 10 },
  stepDesc: { fontFamily: "'Rajdhani', sans-serif", fontSize: 15, color: "rgba(239,217,247,0.6)", lineHeight: 1.6 },

  aboutSection: {
    position: "relative", zIndex: 2, padding: "100px 24px",
    background: "rgba(130,56,179,0.04)", borderTop: `1px solid rgba(130,56,179,0.08)`, borderBottom: `1px solid rgba(130,56,179,0.08)`,
  },
  aboutInner: { maxWidth: 680, margin: "0 auto", textAlign: "center" },
  aboutText: { fontFamily: "'Rajdhani', sans-serif", fontSize: 16, color: "rgba(239,217,247,0.6)", lineHeight: 1.8 },

  footer: {
    position: "relative", zIndex: 2, padding: "32px 24px",
    display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
    borderTop: `1px solid rgba(130,56,179,0.08)`,
  },
  footerLogo: { fontFamily: "'Orbitron', monospace", fontSize: 12, fontWeight: 700, color: GRAPE, letterSpacing: "0.15em" },
  footerText: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(239,217,247,0.35)", letterSpacing: "0.1em" },
};
