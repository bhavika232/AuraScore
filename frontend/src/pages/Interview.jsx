import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const mockAnalysisData = {
  score: 78,
  verdict: "Moderate Confidence",
  feedback:
    "You showed good structure and articulate responses. Some nervous signals were detected around the 0:25 mark — eye contact briefly dropped and speech pace increased. Overall a strong performance with room to sharpen under pressure.",
  metrics: {
    eye_contact: 70,
    voice_stability: 75,
    posture: 68,
    expression: 80,
  },
  timeline: [
    { time: 0, confidence: 60 },
    { time: 5, confidence: 68 },
    { time: 10, confidence: 75 },
    { time: 15, confidence: 72 },
    { time: 20, confidence: 65 },
    { time: 25, confidence: 58 },
    { time: 30, confidence: 70 },
    { time: 35, confidence: 78 },
    { time: 40, confidence: 82 },
    { time: 45, confidence: 76 },
    { time: 50, confidence: 79 },
    { time: 55, confidence: 74 },
  ],
  events: [
    { time: 10, type: "good", msg: "Strong eye contact maintained" },
    { time: 25, type: "warning", msg: "Looking away — possible distraction" },
    { time: 38, type: "warning", msg: "Speech pace increased slightly" },
    { time: 48, type: "good", msg: "Confident tone — clear articulation" },
  ],
};

const tips = [
  "Maintain steady eye contact with the camera lens",
  "Speak at a measured, deliberate pace",
  "Keep your shoulders back and spine straight",
  "Use natural hand gestures to reinforce your points",
  "Pause briefly before answering — it shows composure",
];

export default function Interview() {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  const [phase, setPhase] = useState("idle"); // idle | ready | recording | stopping
  const [elapsed, setElapsed] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [cameraError, setCameraError] = useState(null);
  const navigate = useNavigate();

  const formatTime = (secs) => {
    const m = String(Math.floor(secs / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const initCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
      }
      setPhase("ready");
      setCameraError(null);
    } catch (err) {
      setCameraError("Camera access denied. Please allow camera permissions and reload.");
    }
  }, []);

  useEffect(() => {
    initCamera();
    const tipInterval = setInterval(() => {
      setTipIndex((i) => (i + 1) % tips.length);
    }, 4000);
    return () => {
      clearInterval(tipInterval);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [initCamera]);

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mr = new MediaRecorder(streamRef.current, { mimeType: "video/webm;codecs=vp9" });
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.start(200);
    mediaRecorderRef.current = mr;
    setPhase("recording");
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
  };

  const stopRecording = () => {
    setPhase("stopping");
    clearInterval(timerRef.current);
    const mr = mediaRecorderRef.current;
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const videoURL = URL.createObjectURL(blob);
      navigate("/results", { state: { videoURL, analysisData: mockAnalysisData } });
    };
    mr.stop();
  };

  return (
    <div style={styles.root}>
      {/* Ambient bg glow */}
      <div style={styles.bgGlow} />

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logoMark}>
          <span style={styles.logoDot} />
          <span style={styles.logoText}>AuraScore</span>
        </div>
        {phase === "recording" && (
          <div style={styles.recBadge}>
            <span style={styles.recDot} className="pulse-rec" />
            <span style={styles.recLabel}>REC</span>
            <span style={styles.recTimer}>{formatTime(elapsed)}</span>
          </div>
        )}
        <div style={styles.sessionTag}>Session Alpha</div>
      </header>

      <main style={styles.main}>
        {/* Camera column */}
        <div style={styles.cameraCol}>
          <div style={styles.cameraFrame}>
            {/* Corner accents */}
            {["tl", "tr", "bl", "br"].map((c) => (
              <div key={c} style={{ ...styles.corner, ...cornerPos[c], borderColor: phase === "recording" ? "#ff4d4d" : "#adc6ff" }} />
            ))}

            <video ref={videoRef} autoPlay playsInline muted style={styles.video} />

            {cameraError && (
              <div style={styles.errorOverlay}>
                <span style={styles.errorIcon}>⚠</span>
                <p style={styles.errorText}>{cameraError}</p>
                <button style={styles.retryBtn} onClick={initCamera}>Retry</button>
              </div>
            )}

            {phase === "stopping" && (
              <div style={styles.processingOverlay}>
                <div style={styles.spinner} />
                <p style={styles.processingText}>Processing session...</p>
              </div>
            )}

            {/* Bottom HUD */}
            <div style={styles.hud}>
              <div style={styles.hudItem}>
                <span style={{ ...styles.hudDot, background: phase === "recording" ? "#4edea3" : "#555" }} />
                <span style={styles.hudLabel}>{phase === "recording" ? "Live" : phase === "ready" ? "Ready" : "Initializing"}</span>
              </div>
              <div style={styles.hudItem}>
                <span style={styles.hudLabel}>HD · 720p</span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div style={styles.controls}>
            {phase === "idle" && (
              <div style={styles.initBtn}>
                <div style={styles.spinnerSm} />
                <span>Accessing camera...</span>
              </div>
            )}
            {phase === "ready" && (
              <button style={styles.startBtn} onClick={startRecording}>
                <span style={styles.startIcon}>●</span>
                Begin Session
              </button>
            )}
            {phase === "recording" && (
              <button style={styles.stopBtn} onClick={stopRecording}>
                <span style={styles.stopIcon}>■</span>
                End Session · {formatTime(elapsed)}
              </button>
            )}
            {phase === "stopping" && (
              <div style={styles.initBtn}>
                <div style={styles.spinnerSm} />
                <span>Finalizing analysis...</span>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside style={styles.sidebar}>
          {/* Metrics */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardTitle}>Live Metrics</span>
              <span style={styles.cardBadge}>AI</span>
            </div>
            <div style={styles.metricList}>
              {[
                { label: "Eye Contact", value: 85, color: "#adc6ff" },
                { label: "Posture", value: 72, color: "#4edea3" },
                { label: "Voice Clarity", value: 68, color: "#ffb95f" },
              ].map((m) => (
                <div key={m.label} style={styles.metric}>
                  <div style={styles.metricTop}>
                    <span style={styles.metricLabel}>{m.label}</span>
                    <span style={{ ...styles.metricVal, color: m.color }}>{m.value}%</span>
                  </div>
                  <div style={styles.metricTrack}>
                    <div style={{ ...styles.metricFill, width: `${m.value}%`, background: m.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tip card */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardTitle}>Coach Tip</span>
            </div>
            <div style={styles.tipBox}>
              <div style={styles.tipIcon}>✦</div>
              <p style={styles.tipText} key={tipIndex}>{tips[tipIndex]}</p>
            </div>
          </div>

          {/* Checklist */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardTitle}>Pre-Session</span>
            </div>
            <div style={styles.checklist}>
              {[
                { label: "Camera connected", done: phase !== "idle" },
                { label: "Microphone active", done: phase !== "idle" },
                { label: "Good lighting", done: true },
                { label: "Quiet environment", done: true },
              ].map((item) => (
                <div key={item.label} style={styles.checkItem}>
                  <div style={{ ...styles.checkDot, background: item.done ? "#4edea3" : "#333", border: item.done ? "none" : "1px solid #444" }}>
                    {item.done && <span style={styles.checkMark}>✓</span>}
                  </div>
                  <span style={{ ...styles.checkLabel, color: item.done ? "#e5e2e1" : "#666" }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0a; }
        .pulse-rec {
          animation: pulseRec 1.2s ease-in-out infinite;
        }
        @keyframes pulseRec {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(255,77,77,0.6); }
          50% { opacity: 0.6; box-shadow: 0 0 0 5px rgba(255,77,77,0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

const cornerPos = {
  tl: { top: 12, left: 12, borderTopWidth: 2, borderLeftWidth: 2, borderRightWidth: 0, borderBottomWidth: 0 },
  tr: { top: 12, right: 12, borderTopWidth: 2, borderRightWidth: 2, borderLeftWidth: 0, borderBottomWidth: 0 },
  bl: { bottom: 12, left: 12, borderBottomWidth: 2, borderLeftWidth: 2, borderRightWidth: 0, borderTopWidth: 0 },
  br: { bottom: 12, right: 12, borderBottomWidth: 2, borderRightWidth: 2, borderLeftWidth: 0, borderTopWidth: 0 },
};

const styles = {
  root: {
    minHeight: "100vh",
    background: "#0a0a0a",
    fontFamily: "'DM Sans', sans-serif",
    color: "#e5e2e1",
    position: "relative",
    overflow: "hidden",
  },
  bgGlow: {
    position: "fixed",
    top: "-30%",
    left: "20%",
    width: 600,
    height: 600,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(173,198,255,0.04) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 32px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(10,10,10,0.8)",
    backdropFilter: "blur(12px)",
    position: "sticky",
    top: 0,
    zIndex: 50,
  },
  logoMark: { display: "flex", alignItems: "center", gap: 8 },
  logoDot: {
    width: 8, height: 8, borderRadius: "50%",
    background: "#adc6ff",
    boxShadow: "0 0 12px #adc6ff",
  },
  logoText: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 18,
    color: "#adc6ff",
    letterSpacing: "-0.02em",
  },
  recBadge: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(255,77,77,0.12)",
    border: "1px solid rgba(255,77,77,0.3)",
    padding: "6px 14px",
    borderRadius: 20,
  },
  recDot: {
    width: 8, height: 8, borderRadius: "50%", background: "#ff4d4d", display: "inline-block",
  },
  recLabel: { fontSize: 11, fontWeight: 600, color: "#ff4d4d", letterSpacing: 2 },
  recTimer: { fontSize: 12, fontFamily: "monospace", color: "#e5e2e1", marginLeft: 4 },
  sessionTag: {
    fontSize: 10,
    fontWeight: 500,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: "#555",
  },
  main: {
    display: "flex",
    gap: 24,
    padding: "28px 32px",
    maxWidth: 1400,
    margin: "0 auto",
    alignItems: "flex-start",
  },
  cameraCol: { flex: 1, display: "flex", flexDirection: "column", gap: 16 },
  cameraFrame: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
    background: "#111",
    border: "1px solid rgba(255,255,255,0.07)",
    aspectRatio: "16/9",
  },
  corner: {
    position: "absolute",
    width: 20,
    height: 20,
    borderStyle: "solid",
    borderColor: "#adc6ff",
    zIndex: 10,
    transition: "border-color 0.4s",
  },
  video: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  errorOverlay: {
    position: "absolute", inset: 0, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: 12,
    background: "rgba(10,10,10,0.9)",
  },
  errorIcon: { fontSize: 32, color: "#ff4d4d" },
  errorText: { color: "#999", fontSize: 14, textAlign: "center", maxWidth: 280 },
  retryBtn: {
    marginTop: 8, padding: "8px 20px", borderRadius: 8,
    background: "rgba(173,198,255,0.1)", border: "1px solid rgba(173,198,255,0.3)",
    color: "#adc6ff", cursor: "pointer", fontSize: 13, fontFamily: "inherit",
  },
  processingOverlay: {
    position: "absolute", inset: 0, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: 16,
    background: "rgba(10,10,10,0.85)", backdropFilter: "blur(4px)",
  },
  spinner: {
    width: 40, height: 40, borderRadius: "50%",
    border: "3px solid rgba(173,198,255,0.15)",
    borderTopColor: "#adc6ff",
    animation: "spin 0.8s linear infinite",
  },
  processingText: { color: "#adc6ff", fontSize: 14, letterSpacing: 1 },
  hud: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "10px 16px",
    background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
  },
  hudItem: { display: "flex", alignItems: "center", gap: 6 },
  hudDot: { width: 6, height: 6, borderRadius: "50%", transition: "background 0.4s" },
  hudLabel: { fontSize: 11, color: "rgba(229,226,225,0.5)", letterSpacing: 1 },
  controls: { display: "flex", justifyContent: "center" },
  startBtn: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "14px 36px", borderRadius: 12,
    background: "linear-gradient(135deg, #adc6ff, #7aa0ff)",
    border: "none", color: "#001a42", fontWeight: 600, fontSize: 15,
    cursor: "pointer", fontFamily: "inherit", letterSpacing: 0.3,
    transition: "all 0.2s", boxShadow: "0 4px 24px rgba(173,198,255,0.3)",
  },
  startIcon: { fontSize: 12, color: "#ff4d4d" },
  stopBtn: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "14px 36px", borderRadius: 12,
    background: "rgba(255,77,77,0.12)", border: "1px solid rgba(255,77,77,0.4)",
    color: "#ff6b6b", fontWeight: 600, fontSize: 15,
    cursor: "pointer", fontFamily: "inherit", letterSpacing: 0.3,
    transition: "all 0.2s",
  },
  stopIcon: { fontSize: 11 },
  initBtn: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "14px 36px", borderRadius: 12,
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    color: "#666", fontSize: 14, fontFamily: "inherit",
  },
  spinnerSm: {
    width: 16, height: 16, borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.1)",
    borderTopColor: "#adc6ff",
    animation: "spin 0.8s linear infinite",
  },
  sidebar: { width: 300, display: "flex", flexDirection: "column", gap: 16, flexShrink: 0 },
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 14, padding: "18px 20px",
  },
  cardHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16,
  },
  cardTitle: { fontSize: 11, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: "#555" },
  cardBadge: {
    fontSize: 9, fontWeight: 700, letterSpacing: 2, color: "#adc6ff",
    background: "rgba(173,198,255,0.1)", border: "1px solid rgba(173,198,255,0.2)",
    padding: "2px 7px", borderRadius: 4,
  },
  metricList: { display: "flex", flexDirection: "column", gap: 14 },
  metric: { display: "flex", flexDirection: "column", gap: 6 },
  metricTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  metricLabel: { fontSize: 12, color: "#888" },
  metricVal: { fontSize: 12, fontWeight: 600, fontFamily: "monospace" },
  metricTrack: { height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" },
  metricFill: { height: "100%", borderRadius: 2, transition: "width 0.8s ease" },
  tipBox: {
    display: "flex", gap: 12, alignItems: "flex-start",
    background: "rgba(173,198,255,0.04)", borderRadius: 10, padding: "12px 14px",
    animation: "fadeSlide 0.4s ease",
  },
  tipIcon: { fontSize: 14, color: "#adc6ff", marginTop: 1, flexShrink: 0 },
  tipText: { fontSize: 13, color: "#a0a0a0", lineHeight: 1.6 },
  checklist: { display: "flex", flexDirection: "column", gap: 10 },
  checkItem: { display: "flex", alignItems: "center", gap: 10 },
  checkDot: {
    width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.3s",
  },
  checkMark: { fontSize: 10, color: "#0a0a0a", fontWeight: 700 },
  checkLabel: { fontSize: 13, transition: "color 0.3s" },
};
