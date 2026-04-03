import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const GRAPE  = "#8238B3";
const GOLD   = "#D7AC28";
const BRONZE = "#C78D17";
const PALE   = "#EFD9F7";

const MODULES = [
  {
    id: "voice",
    route: "/voice",
    icon: "◎",
    color: GRAPE,
    title: "VOICE ANALYSIS",
    desc: "Tone, pace, filler words, and speech clarity scored in real time.",
    tag: "AUDIO",
    stat: "82",
    statLabel: "AVG SCORE",
  },
  {
    id: "body",
    route: "/body",
    icon: "◈",
    color: GOLD,
    title: "BODY LANGUAGE",
    desc: "Posture alignment, movement patterns, and professional presence.",
    tag: "VISUAL",
    stat: "74",
    statLabel: "AVG SCORE",
  },
  {
    id: "eye-contact",
    route: "/eye-contact",
    icon: "◉",
    color: GRAPE,
    title: "EYE CONTACT",
    desc: "Gaze direction, facial expression, and engagement metrics.",
    tag: "VISUAL",
    stat: "68",
    statLabel: "AVG SCORE",
  },
  {
    id: "confidence",
    route: "/confidence",
    icon: "◆",
    color: GOLD,
    title: "CONFIDENCE SCORE",
    desc: "Composite real-time confidence index across all signal channels.",
    tag: "COMPOSITE",
    stat: "71",
    statLabel: "OVERALL",
  },
  {
    id: "history",
    route: "/history",
    icon: "◇",
    color: BRONZE,
    title: "SESSION HISTORY",
    desc: "Review past interview sessions with full replay and analysis.",
    tag: "ARCHIVE",
    stat: "12",
    statLabel: "SESSIONS",
  },
  {
    id: "practice",
    route: "/practice",
    icon: "▷",
    color: GRAPE,
    title: "PRACTICE MODE",
    desc: "AI-generated mock questions tailored to your target role.",
    tag: "TRAINING",
    stat: "3",
    statLabel: "COMPLETED",
  },
  {
    id: "tips",
    route: "/tips",
    icon: "◈",
    color: GOLD,
    title: "TIPS & COACHING",
    desc: "Personalised AI coaching based on your analysis history.",
    tag: "COACHING",
    stat: "8",
    statLabel: "TIPS READY",
  },
];

const TOP_STATS = [
  { label: "TOTAL SESSIONS", value: "12" },
  { label: "AVG OVERALL SCORE", value: "74" },
  { label: "BEST MODULE", value: "VOICE" },
  { label: "STREAK", value: "3 DAYS" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "GOOD MORNING" : hour < 18 ? "GOOD AFTERNOON" : "GOOD EVENING";

  return (
    <div style={S.page}>
      {/* Grid bg */}
      <div style={S.grid} />

      <div style={S.inner}>
        {/* Header */}
        <div style={S.header}>
          <div>
            <div style={S.greeting}>{greeting}, {user?.name?.toUpperCase()}</div>
            <h1 style={S.title}>MISSION CONTROL</h1>
          </div>
          <button style={S.startBtn} onClick={() => navigate("/interview")}>
            <span style={S.startDot} />
            START SESSION
          </button>
        </div>

        {/* Stats strip */}
        <div style={S.statsStrip}>
          {TOP_STATS.map(s => (
            <div key={s.label} style={S.statBox}>
              <div style={S.statCornerTL} />
              <div style={S.statCornerBR} />
              <div style={S.statValue}>{s.value}</div>
              <div style={S.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Section label */}
        <div style={S.sectionLabel}>
          <span style={S.sectionLine} />
          <span style={S.sectionText}>ANALYSIS MODULES</span>
          <span style={S.sectionLine} />
        </div>

        {/* Module cards */}
        <div style={S.grid7}>
          {MODULES.map((m, i) => (
            <ModuleCard key={m.id} mod={m} index={i} onClick={() => navigate(m.route)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ModuleCard({ mod, index, onClick }) {
  return (
    <div
      style={{ ...S.card, animationDelay: `${index * 0.06}s`, borderColor: "rgba(130,56,179,0.12)" }}
      onClick={onClick}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = mod.color + "66";
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.background = "#3d007f";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "rgba(130,56,179,0.12)";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.background = "#300066";
      }}
    >
      {/* HUD corners */}
      <div style={{ ...S.cardCorner, top: 6, left: 6, borderTopColor: mod.color, borderLeftColor: mod.color }} />
      <div style={{ ...S.cardCorner, bottom: 6, right: 6, borderBottomColor: mod.color, borderRightColor: mod.color }} />

      {/* Glow */}
      <div style={{ ...S.cardGlow, background: `radial-gradient(ellipse at 50% 0%, ${mod.color}16, transparent 65%)` }} />

      {/* Tag */}
      <div style={{ ...S.cardTag, color: mod.color, borderColor: mod.color + "44", background: mod.color + "11" }}>
        {mod.tag}
      </div>

      {/* Icon */}
      <div style={{ ...S.cardIcon, color: mod.color }}>{mod.icon}</div>

      {/* Title */}
      <div style={S.cardTitle}>{mod.title}</div>

      {/* Desc */}
      <div style={S.cardDesc}>{mod.desc}</div>

      {/* Bottom stat */}
      <div style={S.cardBottom}>
        <div style={S.cardStat}>
          <span style={{ ...S.cardStatValue, color: mod.color }}>{mod.stat}</span>
          <span style={S.cardStatLabel}>{mod.statLabel}</span>
        </div>
        <div style={{ ...S.cardArrow, color: mod.color }}>→</div>
      </div>
    </div>
  );
}

const S = {
  page: { minHeight: "100vh", background: "#1a0033", paddingTop: 64 },
  grid: {
    position: "fixed", inset: 0, pointerEvents: "none",
    backgroundImage: "linear-gradient(rgba(130,56,179,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(130,56,179,0.03) 1px, transparent 1px)",
    backgroundSize: "60px 60px",
  },
  inner: { position: "relative", zIndex: 1, maxWidth: 1280, margin: "0 auto", padding: "48px 24px 80px" },

  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 40, flexWrap: "wrap", gap: 20 },
  greeting: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(239,217,247,0.35)", letterSpacing: "0.2em", marginBottom: 6 },
  title: { fontFamily: "'Orbitron', monospace", fontSize: "clamp(22px, 4vw, 36px)", fontWeight: 700, color: PALE, letterSpacing: "0.1em" },
  startBtn: {
    display: "flex", alignItems: "center", gap: 10,
    background: "rgba(215,172,40,0.10)", border: `1px solid ${GOLD}`,
    color: GOLD, padding: "12px 28px", borderRadius: 4,
    fontFamily: "'Orbitron', monospace", fontSize: 11, fontWeight: 600, letterSpacing: "0.12em",
    cursor: "pointer", transition: "all 0.2s",
    boxShadow: "0 0 20px rgba(215,172,40,0.12)",
  },
  startDot: { width: 8, height: 8, borderRadius: "50%", background: GOLD, animation: "pulse-cyan 1.5s infinite", display: "inline-block" },

  statsStrip: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 48 },
  statBox: {
    position: "relative", background: "#280055", border: "1px solid rgba(130,56,179,0.14)",
    borderRadius: 8, padding: "20px 20px 16px", textAlign: "center",
  },
  statCornerTL: { position: "absolute", top: 6, left: 6, width: 8, height: 8, borderTop: `1px solid rgba(130,56,179,0.5)`, borderLeft: `1px solid rgba(130,56,179,0.5)` },
  statCornerBR: { position: "absolute", bottom: 6, right: 6, width: 8, height: 8, borderBottom: `1px solid rgba(130,56,179,0.5)`, borderRight: `1px solid rgba(130,56,179,0.5)` },
  statValue: { fontFamily: "'Orbitron', monospace", fontSize: 22, fontWeight: 700, color: GRAPE, marginBottom: 4 },
  statLabel: { fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.2em", color: "rgba(239,217,247,0.35)" },

  sectionLabel: { display: "flex", alignItems: "center", gap: 16, marginBottom: 28 },
  sectionLine: { flex: 1, height: 1, background: "rgba(130,56,179,0.12)" },
  sectionText: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.25em", color: "rgba(239,217,247,0.35)" },

  grid7: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 },

  card: {
    position: "relative", background: "#300066", border: "1px solid",
    borderRadius: 10, padding: "28px 24px 20px",
    cursor: "pointer", transition: "all 0.2s",
    overflow: "hidden", animation: "fadeUp 0.4s ease both",
  },
  cardCorner: {
    position: "absolute", width: 10, height: 10,
    borderStyle: "solid", borderWidth: 0,
    borderTopWidth: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderRightWidth: 0,
  },
  cardGlow: { position: "absolute", inset: 0, pointerEvents: "none" },
  cardTag: {
    display: "inline-block", padding: "3px 9px", borderRadius: 3,
    fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.18em",
    border: "1px solid", marginBottom: 16,
  },
  cardIcon: { fontSize: 30, marginBottom: 12, display: "block", lineHeight: 1 },
  cardTitle: {
    fontFamily: "'Orbitron', monospace", fontSize: 12, fontWeight: 600, letterSpacing: "0.1em",
    color: PALE, marginBottom: 10,
  },
  cardDesc: { fontFamily: "'Rajdhani', sans-serif", fontSize: 13, color: "rgba(239,217,247,0.55)", lineHeight: 1.65, marginBottom: 20 },
  cardBottom: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  cardStat: { display: "flex", flexDirection: "column" },
  cardStatValue: { fontFamily: "'Orbitron', monospace", fontSize: 18, fontWeight: 700, lineHeight: 1 },
  cardStatLabel: { fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: "rgba(239,217,247,0.35)", letterSpacing: "0.15em", marginTop: 3 },
  cardArrow: { fontSize: 18, transition: "transform 0.2s" },
};
