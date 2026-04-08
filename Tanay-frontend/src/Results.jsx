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
  RadialLinearScale, PointElement, LineElement, Filler,
  CategoryScale, LinearScale, Tooltip, Legend
);

// ─── Fallback mock data ───────────────────────────────────────────────────────
const FALLBACK = {
  score: 72,
  verdict: "Moderate Confidence",
  archetype: "nervous",
  feedback: "You showed moderate confidence throughout the session. Good eye contact and voice clarity were noted. Work on reducing silence gaps and improving posture consistency for a stronger overall impression.",
  metrics: { eye_contact: 70, voice_stability: 74, posture: 68, expression: 72 },
  face: {
    blink_count: 12, blink_rate: 14.0, avg_ear: 0.27,
    gaze_pct_center: 64.0, gaze_pct_left: 21.0, gaze_pct_right: 15.0,
    pct_chin_level: 72.0, pct_chin_down: 18.0, pct_chin_up: 10.0,
    pct_head_forward: 78.0, avg_pitch_angle: -3.5,
  },
  voice: {
    avg_pitch: 155.0, pitch_variance: 22000.0,
    pace: 140.0, silence_duration: 12.0,
    silence_ratio: 20.0, speech_ratio: 80.0,
    stammer_count: 3, filler_count: 2,
    filler_words: { um: 1, like: 1 }, confidence_score: 75,
    feedback: ["Pace is good.", "Good fluency.", "Minimal silence gaps.", "Good pitch variance.", "Very few filler words."],
  },
  body: {
    avg_posture_score: 72.0, best_posture_score: 91.0,
    worst_posture_score: 48.0, good_pct: 65.0,
    slouch_pct: 22.0, tilt_pct: 15.0,
    slouch_penalty: 14.0, tilt_penalty: 8.4, horiz_penalty: 5.6,
  },
  timeline: [
    { time: 0, confidence: 55 }, { time: 5, confidence: 62 },
    { time: 10, confidence: 70 }, { time: 15, confidence: 68 },
    { time: 20, confidence: 65 }, { time: 25, confidence: 60 },
    { time: 30, confidence: 72 }, { time: 35, confidence: 76 },
    { time: 40, confidence: 74 }, { time: 45, confidence: 70 },
    { time: 50, confidence: 73 }, { time: 55, confidence: 69 },
  ],
  events: [
    { time: 10, type: "good",    msg: "Strong center gaze — 64% of frames" },
    { time: 20, type: "good",    msg: "Fluent speech — minimal stammering" },
    { time: 35, type: "good",    msg: "Good posture maintained 65% of session" },
    { time: 48, type: "good",    msg: "Speaking pace ideal — 140 wpm" },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getVerdict = (score) => {
  if (score > 75) return { label: "Highly Confident", color: "#4edea3", glow: "rgba(78,222,163,0.3)" };
  if (score > 55) return { label: "Moderate Confidence", color: "#ffb95f", glow: "rgba(255,185,95,0.3)" };
  return { label: "Needs Improvement", color: "#ff6b6b", glow: "rgba(255,107,107,0.3)" };
};

const ARCHETYPE_CONFIG = {
  confident: { color: "#4edea3", bg: "rgba(78,222,163,0.1)", border: "rgba(78,222,163,0.3)", icon: "🎯", label: "Confident" },
  nervous:   { color: "#ffb95f", bg: "rgba(255,185,95,0.1)",  border: "rgba(255,185,95,0.3)",  icon: "⚡", label: "Nervous"   },
  dishonest: { color: "#ff6b6b", bg: "rgba(255,107,107,0.1)", border: "rgba(255,107,107,0.3)", icon: "⚠", label: "Stressed"  },
};

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

// ─── Sub-components ───────────────────────────────────────────────────────────

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

function MiniBar({ label, value, max = 100, color = "#8238B3", unit = "%" }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={s.miniBarRow}>
      <span style={s.miniBarLabel}>{label}</span>
      <div style={s.miniBarTrack}>
        <div style={{ ...s.miniBarFill, width: `${pct}%`, background: color }} />
      </div>
      <span style={{ ...s.miniBarVal, color }}>{typeof value === 'number' ? value.toFixed?.(1) ?? value : value}{unit}</span>
    </div>
  );
}

function GaugeRing({ value, max = 100, color, size = 80 }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - value / max);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth="7" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)" }}
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        fill={color} fontSize={size * 0.22} fontFamily="'Orbitron', sans-serif" fontWeight="700">
        {Math.round(value)}
      </text>
    </svg>
  );
}

// ─── Face Panel ───────────────────────────────────────────────────────────────
function FacePanel({ face }) {
  if (!face) return null;
  return (
    <div style={s.moduleCard}>
      <SectionHeading icon="👁" title="Face Analysis" subtitle="By Bhavika — gaze, blinks & head pose" />
      <div style={s.moduleSplit}>
        <div style={s.moduleLeft}>
          <div style={s.statGroup}>
            <div style={s.statBox}>
              <span style={{ ...s.statNum, color: "#be38f3" }}>{face.blink_count}</span>
              <span style={s.statLbl}>Blinks</span>
            </div>
            <div style={s.statBox}>
              <span style={{ ...s.statNum, color: "#ffb43f" }}>{face.blink_rate}</span>
              <span style={s.statLbl}>Blinks/min</span>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <p style={s.subLabel}>GAZE DISTRIBUTION</p>
            <MiniBar label="Center" value={face.gaze_pct_center} color="#4edea3" />
            <MiniBar label="Left"   value={face.gaze_pct_left}   color="#ffb95f" />
            <MiniBar label="Right"  value={face.gaze_pct_right}  color="#ff6b6b" />
          </div>
        </div>
        <div style={s.moduleRight}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <GaugeRing value={face.gaze_pct_center} color="#4edea3" size={90} />
            <span style={{ fontSize: 11, color: "#666", letterSpacing: 1 }}>CENTER GAZE</span>
          </div>
          <div style={{ marginTop: 12 }}>
            <p style={s.subLabel}>HEAD POSE</p>
            <MiniBar label="Forward" value={face.pct_head_forward} color="#8238B3" />
            <MiniBar label="Chin Level" value={face.pct_chin_level} color="#4edea3" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Voice Panel ──────────────────────────────────────────────────────────────
function VoicePanel({ voice }) {
  if (!voice) return null;
  const fillerEntries = Object.entries(voice.filler_words || {});
  return (
    <div style={s.moduleCard}>
      <SectionHeading icon="🎙" title="Voice Analysis" subtitle="By Harshita — pitch, pace & fluency" />
      <div style={s.moduleSplit}>
        <div style={s.moduleLeft}>
          <div style={s.statGroup}>
            <div style={s.statBox}>
              <span style={{ ...s.statNum, color: "#7ec8e3" }}>{voice.pace?.toFixed(0)}</span>
              <span style={s.statLbl}>Words/min</span>
            </div>
            <div style={s.statBox}>
              <span style={{ ...s.statNum, color: voice.stammer_count > 5 ? "#ff6b6b" : "#4edea3" }}>{voice.stammer_count}</span>
              <span style={s.statLbl}>Stammers</span>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <p style={s.subLabel}>SPEECH BREAKDOWN</p>
            <MiniBar label="Speech" value={voice.speech_ratio}  color="#4edea3" />
            <MiniBar label="Silence" value={voice.silence_ratio} color="#ff6b6b" />
          </div>
          {fillerEntries.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <p style={s.subLabel}>FILLER WORDS DETECTED</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                {fillerEntries.map(([word, count]) => (
                  <span key={word} style={s.fillerChip}>"{word}" ×{count}</span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div style={s.moduleRight}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <GaugeRing value={voice.confidence_score} color="#7ec8e3" size={90} />
            <span style={{ fontSize: 11, color: "#666", letterSpacing: 1 }}>VOICE SCORE</span>
          </div>
          <div style={{ marginTop: 14 }}>
            <p style={s.subLabel}>PITCH STATS</p>
            <div style={s.pitchRow}>
              <span style={s.pitchLbl}>Avg Pitch</span>
              <span style={{ ...s.pitchVal, color: "#ffb95f" }}>{voice.avg_pitch?.toFixed(0)} Hz</span>
            </div>
            <div style={s.pitchRow}>
              <span style={s.pitchLbl}>Variance</span>
              <span style={{ ...s.pitchVal, color: voice.pitch_variance > 12000 ? "#4edea3" : "#ff6b6b" }}>
                {voice.pitch_variance > 12000 ? "Expressive" : "Monotone"}
              </span>
            </div>
            <div style={s.pitchRow}>
              <span style={s.pitchLbl}>Fillers</span>
              <span style={{ ...s.pitchVal, color: voice.filler_count > 4 ? "#ff6b6b" : "#4edea3" }}>
                {voice.filler_count}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Body Panel ───────────────────────────────────────────────────────────────
function BodyPanel({ body }) {
  if (!body) return null;
  const postureColor = body.avg_posture_score >= 75 ? "#4edea3" : body.avg_posture_score >= 50 ? "#ffb95f" : "#ff6b6b";
  return (
    <div style={s.moduleCard}>
      <SectionHeading icon="🧍" title="Body & Posture" subtitle="By Ria — posture, slouch & alignment" />
      <div style={s.moduleSplit}>
        <div style={s.moduleLeft}>
          <div style={s.statGroup}>
            <div style={s.statBox}>
              <span style={{ ...s.statNum, color: postureColor }}>{body.avg_posture_score?.toFixed(0)}</span>
              <span style={s.statLbl}>Posture/100</span>
            </div>
            <div style={s.statBox}>
              <span style={{ ...s.statNum, color: body.good_pct >= 60 ? "#4edea3" : "#ff6b6b" }}>{body.good_pct?.toFixed(0)}%</span>
              <span style={s.statLbl}>Good Frames</span>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <p style={s.subLabel}>PENALTY BREAKDOWN</p>
            <MiniBar label="Slouch" value={body.slouch_penalty}  max={40} color="#ff6b6b" unit="pt" />
            <MiniBar label="Tilt"   value={body.tilt_penalty}    max={30} color="#ffb95f" unit="pt" />
            <MiniBar label="Offset" value={body.horiz_penalty}   max={15} color="#7ec8e3" unit="pt" />
          </div>
        </div>
        <div style={s.moduleRight}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <GaugeRing value={body.avg_posture_score} color={postureColor} size={90} />
            <span style={{ fontSize: 11, color: "#666", letterSpacing: 1 }}>POSTURE SCORE</span>
          </div>
          <div style={{ marginTop: 14 }}>
            <p style={s.subLabel}>SESSION RANGE</p>
            <div style={s.pitchRow}>
              <span style={s.pitchLbl}>Best</span>
              <span style={{ ...s.pitchVal, color: "#4edea3" }}>{body.best_posture_score?.toFixed(0)}</span>
            </div>
            <div style={s.pitchRow}>
              <span style={s.pitchLbl}>Worst</span>
              <span style={{ ...s.pitchVal, color: "#ff6b6b" }}>{body.worst_posture_score?.toFixed(0)}</span>
            </div>
            <div style={s.pitchRow}>
              <span style={s.pitchLbl}>Slouch %</span>
              <span style={{ ...s.pitchVal, color: body.slouch_pct > 30 ? "#ff6b6b" : "#4edea3" }}>
                {body.slouch_pct?.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Video Replay ─────────────────────────────────────────────────────────────
function VideoReplay({ videoURL, events }) {
  const videoRef = useRef(null);
  const [activeEvent, setActiveEvent] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(60);

  const seekTo = (time) => {
    if (videoRef.current) videoRef.current.currentTime = time;
    setActiveEvent(events.find((e) => e.time === time) || null);
  };

  return (
    <div style={s.videoSection}>
      <SectionHeading icon="▶" title="AI Replay Analysis" subtitle="Click any marker to jump to that moment" />
      <div style={s.videoWrap}>
        {videoURL ? (
          <video ref={videoRef} src={videoURL} controls style={s.video}
            onTimeUpdate={() => videoRef.current && setCurrentTime(videoRef.current.currentTime)}
            onLoadedMetadata={() => videoRef.current && setDuration(videoRef.current.duration || 60)} />
        ) : (
          <div style={s.videoPlaceholder}>
            <span style={s.videoPlaceholderIcon}>◉</span>
            <p style={s.videoPlaceholderText}>No recording available — demo mode</p>
          </div>
        )}

        <div style={s.timelineBar}>
          <div style={s.timelineTrack}>
            <div style={{ ...s.timelineProgress, width: `${(currentTime / duration) * 100}%` }} />
            {events.map((ev) => (
              <button key={ev.time} title={ev.msg} onClick={() => seekTo(ev.time)}
                style={{ ...s.marker, left: `${(ev.time / duration) * 100}%`,
                  background: ev.type === "good" ? "#4edea3" : "#ffb95f",
                  boxShadow: ev.type === "good" ? "0 0 8px #4edea3" : "0 0 8px #ffb95f" }} />
            ))}
          </div>
          <div style={s.timelineLabels}>
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const t = Math.floor(ratio * duration);
              return <span key={ratio} style={s.timelineLabel}>{`${Math.floor(t/60)}:${String(t%60).padStart(2,"0")}`}</span>;
            })}
          </div>
        </div>

        <div style={s.eventList}>
          {events.map((ev) => {
            const m = Math.floor(ev.time / 60);
            const ss = String(ev.time % 60).padStart(2, "0");
            return (
              <button key={ev.time} style={s.eventChip} onClick={() => seekTo(ev.time)}>
                <span style={{ ...s.eventDot, background: ev.type === "good" ? "#4edea3" : "#ffb95f" }} />
                <span style={s.eventTime}>{`${m}:${ss}`}</span>
                <span style={s.eventMsg}>{ev.msg}</span>
              </button>
            );
          })}
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

// ─── Score Card ───────────────────────────────────────────────────────────────
function ScoreCard({ score, feedback, archetype }) {
  const displayScore = useCountUp(score);
  const verdict = getVerdict(score);
  const archCfg = ARCHETYPE_CONFIG[archetype] || ARCHETYPE_CONFIG.nervous;
  const [bars] = useState([36, 55, 68, 78, 90, 95, 88]);

  return (
    <div style={s.scoreSection}>
      <div style={s.scoreSectionHeader}>
        <SectionHeading icon="◎" title="Confidence Score" />
        <div style={{ ...s.archetypeBadge, color: archCfg.color, background: archCfg.bg, border: `1px solid ${archCfg.border}` }}>
          <span>{archCfg.icon}</span>
          <span style={{ fontWeight: 700, letterSpacing: 1 }}>{archCfg.label.toUpperCase()}</span>
        </div>
      </div>
      <div style={s.scoreWrap}>
        <div style={s.scoreRingWrap}>
          <div style={{ ...s.scoreRing, boxShadow: `0 0 40px ${verdict.glow}, 0 0 80px ${verdict.glow}` }}>
            <svg width="180" height="180" viewBox="0 0 180 180" style={{ position: "absolute", top: 0, left: 0 }}>
              <circle cx="90" cy="90" r="80" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
              <circle cx="90" cy="90" r="80" fill="none" stroke={verdict.color} strokeWidth="8"
                strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 80}`}
                strokeDashoffset={`${2 * Math.PI * 80 * (1 - score / 100)}`}
                transform="rotate(-90 90 90)"
                style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.22,1,0.36,1)" }} />
            </svg>
            <span style={{ ...s.scoreNum, color: verdict.color }}>{displayScore}</span>
            <span style={s.scoreMax}>/100</span>
          </div>
          <div style={{ ...s.verdictBadge, color: verdict.color, borderColor: `${verdict.color}40`, background: `${verdict.color}10` }}>
            {verdict.label}
          </div>
        </div>
        <div style={s.scoreRight}>
          <div style={s.miniChartBar}>
            {bars.map((h, i) => (
              <div key={i} style={{ ...s.miniBarBlock, height: `${h}%`, background: i === bars.length - 1 ? verdict.color : "rgba(255,255,255,0.12)" }} />
            ))}
          </div>
          <p style={s.feedbackText}>{feedback}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Radar ────────────────────────────────────────────────────────────────────
function RadarSection({ metrics }) {
  const labels = ["Eye Contact", "Voice", "Posture", "Expression"];
  const values = [metrics.eye_contact, metrics.voice_stability, metrics.posture, metrics.expression];

  const data = { labels, datasets: [{ label: "Performance", data: values,
    backgroundColor: "rgba(130,56,179,0.12)", borderColor: "#8238B3", borderWidth: 1.5,
    pointBackgroundColor: "#8238B3", pointBorderColor: "#8238B3", pointRadius: 4, pointHoverRadius: 6 }] };

  const options = { responsive: true, maintainAspectRatio: false,
    scales: { r: { min: 0, max: 100, ticks: { display: false }, grid: { color: "rgba(255,255,255,0.07)" },
      angleLines: { color: "rgba(255,255,255,0.07)" }, pointLabels: { color: "#888", font: { size: 11, family: "'Rajdhani', sans-serif" } } } },
    plugins: { legend: { display: false }, tooltip: { backgroundColor: "#1a1a1a", borderColor: "rgba(255,255,255,0.1)",
      borderWidth: 1, titleColor: "#8238B3", bodyColor: "#EFD9F7", padding: 10, callbacks: { label: (ctx) => ` ${ctx.raw}%` } } } };

  return (
    <div style={s.chartCard}>
      <SectionHeading icon="◈" title="Skill Breakdown" />
      <div style={s.radarWrap}><Radar data={data} options={options} /></div>
      <div style={s.radarStats}>
        {labels.map((l, i) => (
          <div key={l} style={s.radarStat}>
            <span style={s.radarStatLabel}>{l}</span>
            <div style={s.radarStatBar}><div style={{ ...s.radarStatFill, width: `${values[i]}%` }} /></div>
            <span style={s.radarStatVal}>{values[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────
function TimelineSection({ timeline }) {
  const labels = timeline.map((d) => `${Math.floor(d.time/60)}:${String(d.time%60).padStart(2,"0")}`);
  const values = timeline.map((d) => d.confidence);
  const avg = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;

  const data = { labels, datasets: [
    { label: "Confidence", data: values, borderColor: "#8238B3",
      backgroundColor: (ctx) => { const g = ctx.chart.ctx.createLinearGradient(0,0,0,180); g.addColorStop(0,"rgba(130,56,179,0.25)"); g.addColorStop(1,"rgba(130,56,179,0)"); return g; },
      fill: true, tension: 0.45, borderWidth: 2,
      pointRadius: (ctx) => values[ctx.dataIndex] === Math.min(...values) ? 6 : 3,
      pointBackgroundColor: (ctx) => values[ctx.dataIndex] === Math.min(...values) ? "#ff6b6b" : "#8238B3",
      pointBorderColor: "transparent" },
    { label: "Average", data: Array(values.length).fill(avg), borderColor: "rgba(255,255,255,0.15)", borderDash: [4,4], borderWidth: 1, pointRadius: 0, fill: false },
  ]};

  const options = { responsive: true, maintainAspectRatio: false,
    scales: { x: { grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "rgba(239,217,247,0.6)", font: { size: 10 } }, border: { color: "rgba(255,255,255,0.06)" } },
      y: { min: 30, max: 100, grid: { color: "rgba(255,255,255,0.04)" }, ticks: { color: "rgba(239,217,247,0.6)", font: { size: 10 }, callback: (v) => `${v}%` }, border: { color: "rgba(255,255,255,0.06)" } } },
    plugins: { legend: { display: false }, tooltip: { backgroundColor: "#1a1a1a", borderColor: "rgba(255,255,255,0.1)", borderWidth: 1, titleColor: "#8238B3", bodyColor: "#EFD9F7", padding: 10,
      callbacks: { label: (ctx) => ctx.dataset.label === "Average" ? ` Avg: ${ctx.raw}%` : ` Confidence: ${ctx.raw}%` } } } };

  return (
    <div style={s.chartCard}>
      <SectionHeading icon="↗" title="Confidence Timeline" />
      <div style={s.timelineChartWrap}><Line data={data} options={options} /></div>
      <div style={s.tlStats}>
        {[{ label: "Average", val: `${avg}%`, color: "#8238B3" },
          { label: "Peak",    val: `${Math.max(...values)}%`, color: "#4edea3" },
          { label: "Low",     val: `${Math.min(...values)}%`, color: "#ff6b6b" }].map((st) => (
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
  const navigate  = useNavigate();
  const [activeTab, setActiveTab] = useState(state?.activeTab || "all");
  const videoURL  = state?.videoURL || null;
  const raw       = state?.analysisData;

  const data = raw ? {
    score:    raw.score    ?? raw.confidence ?? FALLBACK.score,
    verdict:  raw.verdict  || getVerdict(raw.score ?? FALLBACK.score).label,
    archetype: raw.archetype || FALLBACK.archetype,
    feedback: raw.feedback || FALLBACK.feedback,
    metrics: {
      eye_contact:     raw.metrics?.eye_contact     ?? FALLBACK.metrics.eye_contact,
      voice_stability: raw.metrics?.voice_stability ?? FALLBACK.metrics.voice_stability,
      posture:         raw.metrics?.posture         ?? FALLBACK.metrics.posture,
      expression:      raw.metrics?.expression      ?? FALLBACK.metrics.expression,
    },
    face:     raw.face     || FALLBACK.face,
    voice:    raw.voice    || FALLBACK.voice,
    body:     raw.body     || FALLBACK.body,
    timeline: raw.timeline?.length ? raw.timeline : FALLBACK.timeline,
    events:   raw.events?.length   ? raw.events   : FALLBACK.events,
  } : FALLBACK;

  return (
    <div style={s.root}>
      <div style={s.bgGlow1} />
      <div style={s.bgGlow2} />

      {/* Header */}
      <header style={s.header}>
        <div style={s.logoMark}>
          <span style={{ color: '#8238B3', fontSize: 22 }}>◈</span>
          <span style={s.logoText}>AURA<span style={{ color: '#8238B3' }}>SCORE</span></span>
        </div>
        <div style={s.headerCenter}><span style={s.headerLabel}>Session Report</span></div>
        <button style={s.newSessionBtn} onClick={() => navigate("/interview")}>+ New Session</button>
      </header>

      {/* Tab Navigation if filtered */}
      {activeTab !== "all" && (
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 24, padding: "0 24px" }}>
          <button style={{ ...s.filterTab, borderColor: activeTab === "voice" ? "#8238B3" : "rgba(255,255,255,0.1)", background: activeTab === "voice" ? "rgba(130,56,179,0.15)" : "transparent" }} onClick={() => setActiveTab("voice")}>VOICE</button>
          <button style={{ ...s.filterTab, borderColor: activeTab === "eye-contact" ? "#8238B3" : "rgba(255,255,255,0.1)", background: activeTab === "eye-contact" ? "rgba(130,56,179,0.15)" : "transparent" }} onClick={() => setActiveTab("eye-contact")}>EYE CONTACT</button>
          <button style={{ ...s.filterTab, borderColor: activeTab === "body" ? "#8238B3" : "rgba(255,255,255,0.1)", background: activeTab === "body" ? "rgba(130,56,179,0.15)" : "transparent" }} onClick={() => setActiveTab("body")}>BODY</button>
          <button style={{ ...s.filterTab, borderColor: activeTab === "confidence" ? "#8238B3" : "rgba(255,255,255,0.1)", background: activeTab === "confidence" ? "rgba(130,56,179,0.15)" : "transparent" }} onClick={() => setActiveTab("confidence")}>CONFIDENCE</button>
          <button style={{ ...s.filterTab, borderColor: activeTab === "tips" ? "#8238B3" : "rgba(255,255,255,0.1)", background: activeTab === "tips" ? "rgba(130,56,179,0.15)" : "transparent" }} onClick={() => setActiveTab("tips")}>TIPS</button>
          <button style={{ ...s.filterTab, borderColor: "rgba(255,255,255,0.1)", background: "transparent" }} onClick={() => setActiveTab("all")}>SHOW ALL</button>
        </div>
      )}

      <main style={s.main}>
        {/* Row 1: Video */}
        {(activeTab === "all" || activeTab === "confidence") && (
          <div style={s.fullRow}><VideoReplay videoURL={videoURL} events={data.events} /></div>
        )}

        {/* Row 2: Score */}
        {(activeTab === "all" || activeTab === "confidence") && (
          <div style={s.fullRow}>
            <ScoreCard score={data.score} feedback={data.feedback} archetype={data.archetype} />
          </div>
        )}

        {/* Row 3 & 4: Radar + Timeline + Module breakdowns */}
        {activeTab === "all" ? (
          <>
            <div style={s.twoCol}>
              <RadarSection metrics={data.metrics} />
              <TimelineSection timeline={data.timeline} />
            </div>
            <div style={s.threeCol}>
              <FacePanel  face={data.face}   />
              <VoicePanel voice={data.voice} />
              <BodyPanel  body={data.body}   />
            </div>
          </>
        ) : (
          <>
            {(activeTab === "eye-contact" || activeTab === "voice" || activeTab === "body" || activeTab === "confidence") && (
              <div style={s.fullRow}>
                {activeTab === "eye-contact" && <FacePanel face={data.face} />}
                {activeTab === "voice" && <VoicePanel voice={data.voice} />}
                {activeTab === "body" && <BodyPanel body={data.body} />}
                {activeTab === "confidence" && <TimelineSection timeline={data.timeline} />}
              </div>
            )}
          </>
        )}

        {/* Row 5: Voice feedback tips */}
        {(activeTab === "all" || activeTab === "tips") && data.voice?.feedback?.length > 0 && (
          <div style={s.fullRow}>
            <div style={s.tipsCard}>
              <SectionHeading icon="💡" title="AI Coaching Tips" subtitle="Generated from your session analysis" />
              <div style={s.tipGrid}>
                {data.voice.feedback.map((tip, i) => (
                  <div key={i} style={s.tipItem}>
                    <span style={s.tipNumber}>{String(i + 1).padStart(2, "0")}</span>
                    <span style={s.tipText}>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Orbitron:wght@500;700;800&family=Rajdhani:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #1a0033; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
      `}</style>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
  root: { minHeight: "100vh", background: "#1a0033", fontFamily: "'Rajdhani', sans-serif", color: "#EFD9F7", position: "relative", overflowX: "hidden" },
  bgGlow1: { position: "fixed", top: "-20%", left: "-10%", width: 500, height: 500, borderRadius: "50%", pointerEvents: "none", background: "radial-gradient(circle, rgba(130,56,179,0.04) 0%, transparent 70%)" },
  bgGlow2: { position: "fixed", bottom: "-20%", right: "-10%", width: 600, height: 600, borderRadius: "50%", pointerEvents: "none", background: "radial-gradient(circle, rgba(78,222,163,0.03) 0%, transparent 70%)" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 32px", borderBottom: "1px solid rgba(130,56,179,0.12)", background: "rgba(3,4,10,0.85)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 },
  logoMark: { display: "flex", alignItems: "center", gap: 8 },
  logoText: { fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 18, color: "#8238B3", letterSpacing: "-0.02em" },
  headerCenter: { display: "flex", flexDirection: "column", alignItems: "center" },
  headerLabel: { fontSize: 11, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", color: "rgba(239,217,247,0.6)" },
  newSessionBtn: { padding: "8px 18px", borderRadius: 8, background: "rgba(130,56,179,0.08)", border: "1px solid rgba(130,56,179,0.2)", color: "#8238B3", cursor: "pointer", fontSize: 12, fontFamily: "'Orbitron', monospace", fontWeight: 500, transition: "all 0.2s" },
  filterTab: { padding: "8px 16px", borderRadius: 20, border: "1px solid", color: "#EFD9F7", cursor: "pointer", fontSize: 10, fontFamily: "'Orbitron', monospace", fontWeight: 600, letterSpacing: 1, transition: "all 0.2s" },
  main: { maxWidth: 1280, margin: "0 auto", padding: "32px 24px", display: "flex", flexDirection: "column", gap: 24 },
  fullRow: { width: "100%" },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 },
  threeCol: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 },
  sectionHead: { display: "flex", alignItems: "center", gap: 12, marginBottom: 20 },
  sectionIconWrap: { width: 32, height: 32, borderRadius: 8, background: "rgba(130,56,179,0.08)", border: "1px solid rgba(130,56,179,0.15)", display: "flex", alignItems: "center", justifyContent: "center" },
  sectionIcon: { fontSize: 14, color: "#8238B3" },
  sectionTitle: { fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 16, color: "#EFD9F7", letterSpacing: "-0.01em" },
  sectionSub: { fontSize: 12, color: "rgba(239,217,247,0.5)", marginTop: 2 },

  // Video
  videoSection: { background: "#280055", border: "1px solid rgba(130,56,179,0.15)", borderRadius: 16, padding: "24px" },
  videoWrap: { display: "flex", flexDirection: "column", gap: 16 },
  video: { width: "100%", maxHeight: 420, objectFit: "contain", borderRadius: 10, background: "#280055", display: "block" },
  videoPlaceholder: { width: "100%", height: 260, background: "#280055", borderRadius: 10, border: "1px dashed rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 },
  videoPlaceholderIcon: { fontSize: 36, color: "#333" },
  videoPlaceholderText: { fontSize: 13, color: "#444" },
  timelineBar: { display: "flex", flexDirection: "column", gap: 6 },
  timelineTrack: { position: "relative", height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "visible" },
  timelineProgress: { position: "absolute", top: 0, left: 0, height: "100%", background: "rgba(130,56,179,0.3)", borderRadius: 4, transition: "width 0.1s" },
  marker: { position: "absolute", top: "50%", transform: "translate(-50%, -50%)", width: 12, height: 12, borderRadius: "50%", border: "2px solid #0a0a0a", cursor: "pointer", transition: "transform 0.15s", zIndex: 2 },
  timelineLabels: { display: "flex", justifyContent: "space-between" },
  timelineLabel: { fontSize: 10, color: "#444" },
  eventList: { display: "flex", flexWrap: "wrap", gap: 8 },
  eventChip: { display: "flex", alignItems: "center", gap: 7, padding: "6px 12px", borderRadius: 8, cursor: "pointer", background: "#280055", border: "1px solid rgba(130,56,179,0.15)", fontFamily: "inherit", transition: "all 0.2s" },
  eventDot: { width: 6, height: 6, borderRadius: "50%" },
  eventTime: { fontSize: 11, color: "rgba(239,217,247,0.6)", fontFamily: "'JetBrains Mono', monospace" },
  eventMsg: { fontSize: 12, color: "#888" },
  activeToast: { display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 8, background: "#280055", borderWidth: 1, borderStyle: "solid", animation: "fadeIn 0.2s ease" },
  toastMsg: { fontSize: 13, color: "#bbb" },

  // Score
  scoreSection: { background: "#280055", border: "1px solid rgba(130,56,179,0.15)", borderRadius: 16, padding: "24px" },
  scoreSectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
  archetypeBadge: { display: "flex", alignItems: "center", gap: 7, padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, letterSpacing: 1 },
  scoreWrap: { display: "flex", alignItems: "center", gap: 40 },
  scoreRingWrap: { display: "flex", flexDirection: "column", alignItems: "center", gap: 12, flexShrink: 0 },
  scoreRing: { width: 180, height: 180, borderRadius: "50%", background: "#280055", position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transition: "box-shadow 1.4s ease" },
  scoreNum: { fontSize: 48, fontFamily: "'Orbitron', sans-serif", fontWeight: 800, lineHeight: 1, position: "relative", zIndex: 1 },
  scoreMax: { fontSize: 13, color: "rgba(239,217,247,0.6)", position: "relative", zIndex: 1 },
  verdictBadge: { padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 600, borderWidth: 1, borderStyle: "solid", letterSpacing: 0.5 },
  scoreRight: { flex: 1, display: "flex", flexDirection: "column", gap: 20 },
  miniChartBar: { display: "flex", alignItems: "flex-end", gap: 4, height: 48, width: "100%" },
  miniBarBlock: { flex: 1, borderRadius: "3px 3px 0 0", transition: "height 0.8s ease, background 0.4s" },
  feedbackText: { fontSize: 14, color: "#888", lineHeight: 1.7, borderLeft: "2px solid rgba(130,56,179,0.2)", paddingLeft: 16 },

  // Charts
  chartCard: { background: "#280055", border: "1px solid rgba(130,56,179,0.15)", borderRadius: 16, padding: "24px" },
  radarWrap: { height: 240, marginBottom: 20 },
  radarStats: { display: "flex", flexDirection: "column", gap: 8 },
  radarStat: { display: "flex", alignItems: "center", gap: 10 },
  radarStatLabel: { fontSize: 11, color: "#666", width: 90, flexShrink: 0 },
  radarStatBar: { flex: 1, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" },
  radarStatFill: { height: "100%", background: "#8238B3", borderRadius: 2, transition: "width 1s ease" },
  radarStatVal: { fontSize: 11, color: "rgba(239,217,247,0.6)", width: 24, textAlign: "right", fontFamily: "'JetBrains Mono', monospace" },
  timelineChartWrap: { height: 200, marginBottom: 16 },
  tlStats: { display: "flex", gap: 24, justifyContent: "center" },
  tlStat: { display: "flex", flexDirection: "column", alignItems: "center", gap: 2 },
  tlStatVal: { fontSize: 20, fontFamily: "'Orbitron', sans-serif", fontWeight: 700 },
  tlStatLabel: { fontSize: 10, color: "rgba(239,217,247,0.6)", letterSpacing: 1, textTransform: "uppercase" },

  // Module cards
  moduleCard: { background: "#280055", border: "1px solid rgba(130,56,179,0.15)", borderRadius: 16, padding: "22px 20px" },
  moduleSplit: { display: "flex", gap: 20 },
  moduleLeft: { flex: 1 },
  moduleRight: { width: 120, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center" },
  statGroup: { display: "flex", gap: 16, marginBottom: 4 },
  statBox: { display: "flex", flexDirection: "column", alignItems: "center", background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "8px 12px", flex: 1, border: "1px solid rgba(255,255,255,0.04)" },
  statNum: { fontFamily: "'Orbitron', sans-serif", fontSize: 22, fontWeight: 800, lineHeight: 1 },
  statLbl: { fontSize: 10, color: "#555", letterSpacing: 1, marginTop: 3, textTransform: "uppercase" },
  subLabel: { fontSize: 10, letterSpacing: 2, color: "#555", textTransform: "uppercase", marginBottom: 8 },
  miniBarRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 7 },
  miniBarLabel: { fontSize: 11, color: "#666", width: 50, flexShrink: 0 },
  miniBarTrack: { flex: 1, height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" },
  miniBarFill: { height: "100%", borderRadius: 3, transition: "width 1s ease" },
  miniBarVal: { fontSize: 11, fontFamily: "'JetBrains Mono', monospace", width: 42, textAlign: "right", flexShrink: 0 },
  pitchRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, paddingBottom: 6, borderBottom: "1px solid rgba(255,255,255,0.04)" },
  pitchLbl: { fontSize: 11, color: "#555" },
  pitchVal: { fontSize: 12, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 },
  fillerChip: { padding: "3px 8px", borderRadius: 6, background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)", color: "#ff6b6b", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" },

  // Tips
  tipsCard: { background: "#280055", border: "1px solid rgba(130,56,179,0.15)", borderRadius: 16, padding: "24px" },
  tipGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 },
  tipItem: { display: "flex", alignItems: "flex-start", gap: 14, padding: "12px 14px", background: "rgba(130,56,179,0.04)", borderRadius: 10, border: "1px solid rgba(130,56,179,0.08)" },
  tipNumber: { fontFamily: "'Orbitron', sans-serif", fontSize: 13, color: "#8238B3", fontWeight: 700, flexShrink: 0, marginTop: 1 },
  tipText: { fontSize: 13, color: "#888", lineHeight: 1.6 },
};
