import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Radar, Line } from "react-chartjs-2";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

// ─── Fallback mock data (if navigated directly) ───────────────────────────────
const FALLBACK = {
  score: 78,
  verdict: "Moderate Confidence",
  feedback:
    "You showed good structure and articulate responses. Some nervous signals detected around 0:25 — eye contact briefly dropped and speech pace increased. Overall a strong performance with room to sharpen under pressure.",
  metrics: { eye_contact: 70, voice_stability: 75, posture: 68, expression: 80 },
  timeline: [
    { time: 0, confidence: 60 }, { time: 5, confidence: 68 },
    { time: 10, confidence: 75 }, { time: 15, confidence: 72 },
    { time: 20, confidence: 65 }, { time: 25, confidence: 58 },
    { time: 30, confidence: 70 }, { time: 35, confidence: 78 },
    { time: 40, confidence: 82 }, { time: 45, confidence: 76 },
    { time: 50, confidence: 79 }, { time: 55, confidence: 74 },
  ],
  events: [
    { time: 10, type: "good", msg: "Strong eye contact maintained" },
    { time: 25, type: "warning", msg: "Looking away — possible distraction" },
    { time: 38, type: "warning", msg: "Speech pace increased slightly" },
    { time: 48, type: "good", msg: "Confident tone — clear articulation" },
  ],
};

// ─── Verdict helpers ──────────────────────────────────────────────────────────
const getVerdict = (score) => {
  if (score > 85) return { label: "Highly Confident", color: "#4edea3", glow: "rgba(78,222,163,0.3)" };
  if (score > 60) return { label: "Moderate Confidence", color: "#ffb95f", glow: "rgba(255,185,95,0.3)" };
  return { label: "Needs Improvement", color: "#ff6b6b", glow: "rgba(255,107,107,0.3)" };
};

// ─── Animated counter ─────────────────────────────────────────────────────────
function useCountUp(target, duration = 1400) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    const timeout = setTimeout(() => requestAnimationFrame(step), 400);
    return () => clearTimeout(timeout);
  }, [target, duration]);
  return val;
}

// ─── Components ───────────────────────────────────────────────────────────────

function SectionHeading({ icon, title, subtitle }) {
  return (
    <div style={s.sectionHead}>
      <div style={s.sectionIconWrap}><span style={s.sectionIcon}>{icon}</span></div>
      <div>
        <h2 style={s.sectionTitle}>{title}</h2>
        {subtitle && <p style={s.sectionSub}>{subtitle}</p>}
      </div>
    </div>
  );
}

function VideoReplay({ videoURL, events }) {
  const videoRef = useRef(null);
  const [activeEvent, setActiveEvent] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(60);

  const seekTo = (time) => {
    if (videoRef.current) videoRef.current.currentTime = time;
    setActiveEvent(events.find((e) => e.time === time) || null);
  };

  const onTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const onLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration || 60);
  };

  return (
    <div style={s.videoSection}>
      <SectionHeading icon="▶" title="AI Replay Analysis" subtitle="Click any marker to jump to that moment" />
      <div style={s.videoWrap}>
        {videoURL ? (
          <video
            ref={videoRef}
            src={videoURL}
            controls
            style={s.video}
            onTimeUpdate={onTimeUpdate}
            onLoadedMetadata={onLoadedMetadata}
          />
        ) : (
          <div style={s.videoPlaceholder}>
            <span style={s.videoPlaceholderIcon}>◉</span>
            <p style={s.videoPlaceholderText}>No recording available — demo mode</p>
          </div>
        )}

        {/* Timeline markers */}
        <div style={s.timelineBar}>
          <div style={s.timelineTrack}>
            {/* Progress fill */}
            <div style={{ ...s.timelineProgress, width: `${(currentTime / duration) * 100}%` }} />
            {/* Event markers */}
            {events.map((ev) => (
              <button
                key={ev.time}
                title={ev.msg}
                onClick={() => seekTo(ev.time)}
                style={{
                  ...s.marker,
                  left: `${(ev.time / 60) * 100}%`,
                  background: ev.type === "good" ? "#4edea3" : "#ffb95f",
                  boxShadow: ev.type === "good" ? "0 0 8px #4edea3" : "0 0 8px #ffb95f",
                }}
              />
            ))}
          </div>
          {/* Timestamps */}
          <div style={s.timelineLabels}>
            {["0:00", "0:15", "0:30", "0:45", "1:00"].map((t) => (
              <span key={t} style={s.timelineLabel}>{t}</span>
            ))}
          </div>
        </div>

        {/* Event legend */}
        <div style={s.eventList}>
          {events.map((ev) => (
            <button key={ev.time} style={s.eventChip} onClick={() => seekTo(ev.time)}>
              <span style={{ ...s.eventDot, background: ev.type === "good" ? "#4edea3" : "#ffb95f" }} />
              <span style={s.eventTime}>{`0:${String(ev.time).padStart(2, "0")}`}</span>
              <span style={s.eventMsg}>{ev.msg}</span>
            </button>
          ))}
        </div>

        {activeEvent && (
          <div style={{ ...s.activeToast, borderColor: activeEvent.type === "good" ? "#4edea3" : "#ffb95f" }}>
            <span style={{ color: activeEvent.type === "good" ? "#4edea3" : "#ffb95f", fontWeight: 600 }}>
              {activeEvent.type === "good" ? "✓" : "⚠"}
            </span>
            <span style={s.toastMsg}>{activeEvent.msg}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreCard({ score, feedback }) {
  const displayScore = useCountUp(score);
  const verdict = getVerdict(score);
  const [bars] = useState([36, 55, 68, 78, 90, 95, 88]);

  return (
    <div style={s.scoreSection}>
      <SectionHeading icon="◎" title="Confidence Score" />
      <div style={s.scoreWrap}>
        {/* Score ring */}
        <div style={s.scoreRingWrap}>
          <div style={{ ...s.scoreRing, boxShadow: `0 0 40px ${verdict.glow}, 0 0 80px ${verdict.glow}` }}>
            <svg width="180" height="180" viewBox="0 0 180 180" style={{ position: "absolute", top: 0, left: 0 }}>
              <circle cx="90" cy="90" r="80" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
              <circle
                cx="90" cy="90" r="80"
                fill="none"
                stroke={verdict.color}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 80}`}
                strokeDashoffset={`${2 * Math.PI * 80 * (1 - score / 100)}`}
                transform="rotate(-90 90 90)"
                style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.22,1,0.36,1)" }}
              />
            </svg>
            <span style={{ ...s.scoreNum, color: verdict.color }}>{displayScore}</span>
            <span style={s.scoreMax}>/100</span>
          </div>
          <div style={{ ...s.verdictBadge, color: verdict.color, borderColor: `${verdict.color}40`, background: `${verdict.color}10` }}>
            {verdict.label}
          </div>
        </div>

        {/* Right side */}
        <div style={s.scoreRight}>
          {/* Mini bar chart */}
          <div style={s.miniChart}>
            {bars.map((h, i) => (
              <div key={i} style={{ ...s.miniBar, height: `${h}%`, background: i === bars.length - 1 ? verdict.color : "rgba(255,255,255,0.12)" }} />
            ))}
          </div>
          <p style={s.feedbackText}>{feedback}</p>
        </div>
      </div>
    </div>
  );
}

function RadarSection({ metrics }) {
  const labels = ["Eye Contact", "Voice", "Posture", "Expression"];
  const values = [metrics.eye_contact, metrics.voice_stability, metrics.posture, metrics.expression];

  const data = {
    labels,
    datasets: [{
      label: "Performance",
      data: values,
      backgroundColor: "rgba(173,198,255,0.12)",
      borderColor: "#adc6ff",
      borderWidth: 1.5,
      pointBackgroundColor: "#adc6ff",
      pointBorderColor: "#adc6ff",
      pointRadius: 4,
      pointHoverRadius: 6,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        min: 0, max: 100,
        ticks: { display: false, stepSize: 25 },
        grid: { color: "rgba(255,255,255,0.07)", lineWidth: 1 },
        angleLines: { color: "rgba(255,255,255,0.07)" },
        pointLabels: {
          color: "#888",
          font: { size: 11, family: "'DM Sans', sans-serif", weight: "500" },
        },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1a1a1a",
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
        titleColor: "#adc6ff",
        bodyColor: "#e5e2e1",
        padding: 10,
        callbacks: { label: (ctx) => ` ${ctx.raw}%` },
      },
    },
  };

  return (
    <div style={s.chartCard}>
      <SectionHeading icon="◈" title="Skill Breakdown" />
      <div style={s.radarWrap}>
        <Radar data={data} options={options} />
      </div>
      <div style={s.radarStats}>
        {labels.map((l, i) => (
          <div key={l} style={s.radarStat}>
            <span style={s.radarStatLabel}>{l}</span>
            <div style={s.radarStatBar}>
              <div style={{ ...s.radarStatFill, width: `${values[i]}%` }} />
            </div>
            <span style={s.radarStatVal}>{values[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineSection({ timeline }) {
  const labels = timeline.map((d) => `0:${String(d.time).padStart(2, "0")}`);
  const values = timeline.map((d) => d.confidence);
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);

  const data = {
    labels,
    datasets: [
      {
        label: "Confidence",
        data: values,
        borderColor: "#adc6ff",
        backgroundColor: (ctx) => {
          const c = ctx.chart.ctx;
          const g = c.createLinearGradient(0, 0, 0, 180);
          g.addColorStop(0, "rgba(173,198,255,0.25)");
          g.addColorStop(1, "rgba(173,198,255,0)");
          return g;
        },
        fill: true,
        tension: 0.45,
        borderWidth: 2,
        pointRadius: (ctx) => (values[ctx.dataIndex] === Math.min(...values) ? 6 : 3),
        pointBackgroundColor: (ctx) => (values[ctx.dataIndex] === Math.min(...values) ? "#ff6b6b" : "#adc6ff"),
        pointBorderColor: "transparent",
      },
      {
        label: "Average",
        data: Array(values.length).fill(avg),
        borderColor: "rgba(255,255,255,0.15)",
        borderDash: [4, 4],
        borderWidth: 1,
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { color: "rgba(255,255,255,0.04)" },
        ticks: { color: "#555", font: { size: 10 } },
        border: { color: "rgba(255,255,255,0.06)" },
      },
      y: {
        min: 40, max: 100,
        grid: { color: "rgba(255,255,255,0.04)" },
        ticks: { color: "#555", font: { size: 10 }, callback: (v) => `${v}%` },
        border: { color: "rgba(255,255,255,0.06)" },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1a1a1a",
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
        titleColor: "#adc6ff",
        bodyColor: "#e5e2e1",
        padding: 10,
        callbacks: {
          label: (ctx) => ctx.dataset.label === "Average" ? ` Avg: ${ctx.raw}%` : ` Confidence: ${ctx.raw}%`,
        },
      },
    },
  };

  return (
    <div style={s.chartCard}>
      <SectionHeading icon="↗" title="Confidence Timeline" />
      <div style={s.timelineChartWrap}>
        <Line data={data} options={options} />
      </div>
      <div style={s.tlStats}>
        {[
          { label: "Average", val: `${avg}%`, color: "#adc6ff" },
          { label: "Peak", val: `${Math.max(...values)}%`, color: "#4edea3" },
          { label: "Low", val: `${Math.min(...values)}%`, color: "#ff6b6b" },
        ].map((st) => (
          <div key={st.label} style={s.tlStat}>
            <span style={{ ...s.tlStatVal, color: st.color }}>{st.val}</span>
            <span style={s.tlStatLabel}>{st.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Results Page ────────────────────────────────────────────────────────
export default function Results() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const videoURL = state?.videoURL || null;
  const data = state?.analysisData || FALLBACK;

  return (
    <div style={s.root}>
      <div style={s.bgGlow1} />
      <div style={s.bgGlow2} />

      {/* Header */}
      <header style={s.header}>
        <div style={s.logoMark}>
          <span style={s.logoDot} />
          <span style={s.logoText}>AuraScore</span>
        </div>
        <div style={s.headerCenter}>
          <span style={s.headerLabel}>Session Report</span>
        </div>
        <button style={s.newSessionBtn} onClick={() => navigate("/interview")}>
          + New Session
        </button>
      </header>

      <main style={s.main}>
        {/* Row 1: Video (full width) */}
        <div style={s.fullRow}>
          <VideoReplay videoURL={videoURL} events={data.events} />
        </div>

        {/* Row 2: Score (full width) */}
        <div style={s.fullRow}>
          <ScoreCard score={data.score} feedback={data.feedback} />
        </div>

        {/* Row 3: Two charts side by side */}
        <div style={s.twoCol}>
          <RadarSection metrics={data.metrics} />
          <TimelineSection timeline={data.timeline} />
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0a; }
      `}</style>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
  root: {
    minHeight: "100vh",
    background: "#0a0a0a",
    fontFamily: "'DM Sans', sans-serif",
    color: "#e5e2e1",
    position: "relative",
    overflowX: "hidden",
  },
  bgGlow1: {
    position: "fixed", top: "-20%", left: "-10%",
    width: 500, height: 500, borderRadius: "50%", pointerEvents: "none",
    background: "radial-gradient(circle, rgba(173,198,255,0.04) 0%, transparent 70%)",
  },
  bgGlow2: {
    position: "fixed", bottom: "-20%", right: "-10%",
    width: 600, height: 600, borderRadius: "50%", pointerEvents: "none",
    background: "radial-gradient(circle, rgba(78,222,163,0.03) 0%, transparent 70%)",
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "18px 32px", borderBottom: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(10,10,10,0.85)", backdropFilter: "blur(12px)",
    position: "sticky", top: 0, zIndex: 50,
  },
  logoMark: { display: "flex", alignItems: "center", gap: 8 },
  logoDot: { width: 8, height: 8, borderRadius: "50%", background: "#adc6ff", boxShadow: "0 0 12px #adc6ff" },
  logoText: { fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18, color: "#adc6ff", letterSpacing: "-0.02em" },
  headerCenter: { display: "flex", flexDirection: "column", alignItems: "center" },
  headerLabel: { fontSize: 11, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", color: "#444" },
  newSessionBtn: {
    padding: "8px 18px", borderRadius: 8,
    background: "rgba(173,198,255,0.08)", border: "1px solid rgba(173,198,255,0.2)",
    color: "#adc6ff", cursor: "pointer", fontSize: 12, fontFamily: "inherit", fontWeight: 500,
    transition: "all 0.2s",
  },
  main: { maxWidth: 1200, margin: "0 auto", padding: "32px 24px", display: "flex", flexDirection: "column", gap: 24 },
  fullRow: { width: "100%" },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 },

  // Section common
  sectionHead: { display: "flex", alignItems: "center", gap: 12, marginBottom: 20 },
  sectionIconWrap: {
    width: 32, height: 32, borderRadius: 8,
    background: "rgba(173,198,255,0.08)", border: "1px solid rgba(173,198,255,0.15)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  sectionIcon: { fontSize: 14, color: "#adc6ff" },
  sectionTitle: { fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, color: "#e5e2e1", letterSpacing: "-0.01em" },
  sectionSub: { fontSize: 12, color: "#555", marginTop: 2 },

  // Video section
  videoSection: {
    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16, padding: "24px",
  },
  videoWrap: { display: "flex", flexDirection: "column", gap: 16 },
  video: { width: "100%", maxHeight: 420, objectFit: "contain", borderRadius: 10, background: "#111", display: "block" },
  videoPlaceholder: {
    width: "100%", height: 300, background: "rgba(255,255,255,0.02)", borderRadius: 10,
    border: "1px dashed rgba(255,255,255,0.1)",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12,
  },
  videoPlaceholderIcon: { fontSize: 36, color: "#333" },
  videoPlaceholderText: { fontSize: 13, color: "#444" },
  timelineBar: { display: "flex", flexDirection: "column", gap: 6 },
  timelineTrack: {
    position: "relative", height: 6, background: "rgba(255,255,255,0.06)",
    borderRadius: 4, overflow: "visible",
  },
  timelineProgress: { position: "absolute", top: 0, left: 0, height: "100%", background: "rgba(173,198,255,0.3)", borderRadius: 4, transition: "width 0.1s" },
  marker: {
    position: "absolute", top: "50%", transform: "translate(-50%, -50%)",
    width: 12, height: 12, borderRadius: "50%", border: "2px solid #0a0a0a",
    cursor: "pointer", transition: "transform 0.15s",
    zIndex: 2,
  },
  timelineLabels: { display: "flex", justifyContent: "space-between" },
  timelineLabel: { fontSize: 10, color: "#444" },
  eventList: { display: "flex", flexWrap: "wrap", gap: 8 },
  eventChip: {
    display: "flex", alignItems: "center", gap: 7,
    padding: "6px 12px", borderRadius: 8, cursor: "pointer",
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
    fontFamily: "inherit", transition: "all 0.2s",
  },
  eventDot: { width: 6, height: 6, borderRadius: "50%" },
  eventTime: { fontSize: 11, color: "#555", fontFamily: "monospace" },
  eventMsg: { fontSize: 12, color: "#888" },
  activeToast: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "10px 16px", borderRadius: 8,
    background: "rgba(255,255,255,0.03)", borderWidth: 1, borderStyle: "solid",
    animation: "fadeIn 0.2s ease",
  },
  toastMsg: { fontSize: 13, color: "#bbb" },

  // Score section
  scoreSection: {
    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16, padding: "24px",
  },
  scoreWrap: { display: "flex", alignItems: "center", gap: 40 },
  scoreRingWrap: { display: "flex", flexDirection: "column", alignItems: "center", gap: 12, flexShrink: 0 },
  scoreRing: {
    width: 180, height: 180, borderRadius: "50%",
    background: "rgba(255,255,255,0.02)",
    position: "relative", display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    transition: "box-shadow 1.4s ease",
  },
  scoreNum: { fontSize: 48, fontFamily: "'Syne', sans-serif", fontWeight: 800, lineHeight: 1, position: "relative", zIndex: 1 },
  scoreMax: { fontSize: 13, color: "#555", position: "relative", zIndex: 1 },
  verdictBadge: {
    padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 600,
    borderWidth: 1, borderStyle: "solid", letterSpacing: 0.5,
  },
  scoreRight: { flex: 1, display: "flex", flexDirection: "column", gap: 20 },
  miniChart: {
    display: "flex", alignItems: "flex-end", gap: 4,
    height: 48, width: "100%",
  },
  miniBar: {
    flex: 1, borderRadius: "3px 3px 0 0",
    transition: "height 0.8s ease, background 0.4s",
  },
  feedbackText: { fontSize: 14, color: "#888", lineHeight: 1.7, borderLeft: "2px solid rgba(173,198,255,0.2)", paddingLeft: 16 },

  // Charts
  chartCard: {
    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16, padding: "24px",
  },
  radarWrap: { height: 240, marginBottom: 20 },
  radarStats: { display: "flex", flexDirection: "column", gap: 8 },
  radarStat: { display: "flex", alignItems: "center", gap: 10 },
  radarStatLabel: { fontSize: 11, color: "#666", width: 90, flexShrink: 0 },
  radarStatBar: { flex: 1, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" },
  radarStatFill: { height: "100%", background: "#adc6ff", borderRadius: 2, transition: "width 1s ease" },
  radarStatVal: { fontSize: 11, color: "#555", width: 24, textAlign: "right", fontFamily: "monospace" },

  timelineChartWrap: { height: 200, marginBottom: 16 },
  tlStats: { display: "flex", gap: 24, justifyContent: "center" },
  tlStat: { display: "flex", flexDirection: "column", alignItems: "center", gap: 2 },
  tlStatVal: { fontSize: 20, fontFamily: "'Syne', sans-serif", fontWeight: 700 },
  tlStatLabel: { fontSize: 10, color: "#555", letterSpacing: 1, textTransform: "uppercase" },
};
