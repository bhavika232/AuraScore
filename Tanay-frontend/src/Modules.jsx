import { useNavigate } from "react-router-dom";
import ProfileCard from "./ProfileCard";

function ModulePage({ color, icon, title, tag, description, children, ctaLabel, ctaRoute }) {
  const navigate = useNavigate();
  return (
    <div style={M.page}>
      <div style={M.grid} />
      <div style={M.inner}>
        {/* Back */}
        <button style={M.back} onClick={() => navigate("/dashboard")}>← DASHBOARD</button>

        {/* Header */}
        <div style={M.header}>
          <div style={{ ...M.tag, color, borderColor: color + "44", background: color + "11" }}>{tag}</div>
          <span style={{ ...M.icon, color }}>{icon}</span>
          <h1 style={M.title}>{title}</h1>
          <p style={M.desc}>{description}</p>
        </div>

        {/* Content */}
        <div style={M.content}>{children}</div>

        {ctaLabel && (
          <div style={{ textAlign: "center", marginTop: 48 }}>
            <button
              style={{ ...M.cta, borderColor: color, color, background: color + "10", boxShadow: `0 0 20px ${color}15` }}
              onClick={() => navigate(ctaRoute)}
            >
              {ctaLabel} →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ ...M.statCard, borderColor: color + "33" }}>
      <div style={{ ...M.statCardValue, color }}>{value}</div>
      <div style={M.statCardLabel}>{label}</div>
    </div>
  );
}

function InfoCard({ title, items }) {
  return (
    <div style={M.infoCard}>
      <div style={M.infoCardTitle}>{title}</div>
      {items.map(item => (
        <div key={item} style={M.infoCardItem}>
          <span style={M.infoCardDot}>▸</span>
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

const M = {
  page: { minHeight: "100vh", background: "#1a0033", paddingTop: 64 },
  grid: { position: "fixed", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(130,56,179,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(130,56,179,0.02) 1px, transparent 1px)", backgroundSize: "60px 60px" },
  inner: { position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "40px 24px 80px" },
  back: { background: "transparent", border: "none", color: "rgba(239,217,247,0.35)", fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.2em", cursor: "pointer", marginBottom: 36, padding: 0, transition: "color 0.2s" },
  header: { marginBottom: 48, maxWidth: 680 },
  tag: { display: "inline-block", padding: "3px 10px", border: "1px solid", borderRadius: 3, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.2em", marginBottom: 16 },
  icon: { fontSize: 36, display: "block", marginBottom: 12 },
  title: { fontFamily: "'Orbitron', monospace", fontSize: "clamp(20px,4vw,32px)", fontWeight: 700, color: "#EFD9F7", letterSpacing: "0.1em", marginBottom: 14 },
  desc: { fontFamily: "'Rajdhani', sans-serif", fontSize: 15, color: "rgba(239,217,247,0.6)", lineHeight: 1.75, maxWidth: 560 },
  content: { display: "flex", flexDirection: "column", gap: 24 },
  statRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))", gap: 12 },
  statCard: { background: "#280055", border: "1px solid", borderRadius: 8, padding: "20px 16px", textAlign: "center" },
  statCardValue: { fontFamily: "'Orbitron', monospace", fontSize: 24, fontWeight: 700, marginBottom: 4 },
  statCardLabel: { fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: "rgba(239,217,247,0.35)", letterSpacing: "0.2em" },
  infoCard: { background: "#280055", border: "1px solid rgba(130,56,179,0.08)", borderRadius: 8, padding: "24px" },
  infoCardTitle: { fontFamily: "'Orbitron', monospace", fontSize: 11, fontWeight: 600, color: "#EFD9F7", letterSpacing: "0.1em", marginBottom: 16 },
  infoCardItem: { display: "flex", gap: 10, fontFamily: "'Rajdhani', sans-serif", fontSize: 14, color: "rgba(239,217,247,0.6)", lineHeight: 1.6, marginBottom: 8 },
  infoCardDot: { color: "#8238B3", flexShrink: 0, marginTop: 1 },
  cta: { padding: "14px 36px", borderRadius: 4, border: "1px solid", fontFamily: "'Orbitron', monospace", fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", cursor: "pointer", transition: "all 0.2s" },
};

// ─── VOICE ANALYSIS ───────────────────────────────────────────────────────────
export function VoiceAnalysis() {
  const navigate = useNavigate();
  return (
    <ModulePage color="#8238B3" icon="◎" tag="AUDIO · SPEECH" title="VOICE ANALYSIS"
      description="Analyse tone modulation, speech pace, filler word frequency, and overall clarity. Get a detailed breakdown of how your voice lands in high-pressure interviews."
      ctaLabel="START VOICE SESSION" ctaRoute="/interview">
      <div style={M.statRow}>
        <StatCard label="TONE SCORE" value="82" color="#8238B3" />
        <StatCard label="PACE (WPM)" value="148" color="#8238B3" />
        <StatCard label="FILLER WORDS" value="3.2%" color="#D7AC28" />
        <StatCard label="CLARITY" value="91%" color="#C78D17" />
      </div>
      <InfoCard title="WHAT WE MEASURE" items={[
        "Tone variation — monotone vs. dynamic delivery",
        "Speech pace — optimal range is 120–160 WPM for interviews",
        "Filler word density — 'um', 'uh', 'like', 'you know'",
        "Silence patterns — confident pauses vs. nervous hesitation",
        "Volume consistency and vocal projection",
      ]} />
      <InfoCard title="HOW TO IMPROVE" items={[
        "Practise speaking at 130–150 WPM — record yourself and review",
        "Replace filler words with deliberate pauses (silence reads confident)",
        "Vary your pitch for emphasis on key words",
        "Hydrate before interviews — vocal quality drops when dehydrated",
      ]} />
    </ModulePage>
  );
}

// ─── BODY LANGUAGE ────────────────────────────────────────────────────────────
export function BodyLanguage() {
  return (
    <ModulePage color="#D7AC28" icon="◈" tag="VISUAL · POSTURE" title="BODY LANGUAGE"
      description="Computer vision tracks your posture alignment, shoulder position, head tilt, and movement frequency to measure professional physical presence."
      ctaLabel="ANALYSE MY POSTURE" ctaRoute="/interview">
      <div style={M.statRow}>
        <StatCard label="POSTURE SCORE" value="74" color="#D7AC28" />
        <StatCard label="STABILITY" value="88%" color="#D7AC28" />
        <StatCard label="OPEN STANCE" value="YES" color="#C78D17" />
        <StatCard label="MOVEMENT" value="LOW" color="#C78D17" />
      </div>
      <InfoCard title="WHAT WE MEASURE" items={[
        "Spine alignment — upright vs. slouched position",
        "Shoulder symmetry and openness",
        "Head position — straight, tilted, or dropped",
        "Micro-movements and nervous fidgeting frequency",
        "Forward lean — engagement signal vs. invasion",
      ]} />
      <InfoCard title="HOW TO IMPROVE" items={[
        "Sit with your back against the chair — avoid leaning forward excessively",
        "Keep shoulders back and down, not hunched toward ears",
        "Plant feet flat on the floor — reduces micro-movements",
        "Mirror your interviewer's body language subtly for rapport",
      ]} />
    </ModulePage>
  );
}

// ─── EYE CONTACT ─────────────────────────────────────────────────────────────
export function EyeContact() {
  return (
    <ModulePage color="#C78D17" icon="◉" tag="VISUAL · GAZE" title="EYE CONTACT & EXPRESSION"
      description="Track gaze direction, camera engagement rate, and facial expression dynamics. Our model scores how connected and expressive you appear to your interviewer."
      ctaLabel="ANALYSE MY GAZE" ctaRoute="/interview">
      <div style={M.statRow}>
        <StatCard label="GAZE SCORE" value="68" color="#C78D17" />
        <StatCard label="CAM ENGAGEMENT" value="61%" color="#D7AC28" />
        <StatCard label="SMILE RATE" value="12%" color="#C78D17" />
        <StatCard label="BLINK RATE" value="NORMAL" color="#C78D17" />
      </div>
      <InfoCard title="WHAT WE MEASURE" items={[
        "Camera gaze percentage — how often you look directly at the camera",
        "Downward gaze — reading notes vs. thinking",
        "Smile frequency and genuine vs. forced expression detection",
        "Blink rate — stress indicator (elevated blink = anxiety)",
        "Micro-expression patterns during answering",
      ]} />
      <InfoCard title="HOW TO IMPROVE" items={[
        "Position camera at eye level — looking up/down ruins gaze lines",
        "Stick a small sticker near your webcam as a gaze anchor",
        "Aim for 70% camera contact — 100% feels unnatural and intense",
        "Let genuine reactions show — suppressed emotion reads as robotic",
      ]} />
    </ModulePage>
  );
}

// ─── CONFIDENCE SCORE ─────────────────────────────────────────────────────────
export function ConfidenceScore() {
  return (
    <ModulePage color="#D7AC28" icon="◆" tag="COMPOSITE · REALTIME" title="CONFIDENCE SCORE"
      description="A composite index calculated from voice, gaze, posture, and expression signals simultaneously. This is your real-time performance fingerprint."
      ctaLabel="RUN CONFIDENCE ANALYSIS" ctaRoute="/interview">
      <div style={M.statRow}>
        <StatCard label="COMPOSITE SCORE" value="71" color="#D7AC28" />
        <StatCard label="PEAK SCORE" value="89" color="#C78D17" />
        <StatCard label="LOW POINT" value="54" color="#D7AC28" />
        <StatCard label="CONSISTENCY" value="MEDIUM" color="#D7AC28" />
      </div>
      <InfoCard title="HOW COMPOSITE IS CALCULATED" items={[
        "Voice stability weight: 30% — tone, pace, filler frequency",
        "Gaze engagement weight: 25% — camera contact, expression quality",
        "Posture score weight: 25% — alignment, openness, stillness",
        "Expression weight: 20% — warmth, engagement, naturalness",
        "Score updates every 2 seconds throughout your session",
      ]} />
      <InfoCard title="WHAT YOUR SCORE MEANS" items={[
        "90–100: Elite — commanding, authoritative, memorable",
        "75–89: Strong — professional, prepared, engaging",
        "60–74: Developing — some friction, fixable with practice",
        "Below 60: Focus zone — specific modules need targeted work",
      ]} />
    </ModulePage>
  );
}

// ─── PRACTICE MODE ────────────────────────────────────────────────────────────
export function PracticeMode() {
  const navigate = useNavigate();
  const QUESTION_SETS = [
    { label: "BEHAVIOURAL", count: 20, color: "#8238B3" },
    { label: "TECHNICAL", count: 15, color: "#D7AC28" },
    { label: "LEADERSHIP", count: 10, color: "#D7AC28" },
    { label: "CASE STUDY", count: 8, color: "#8238B3" },
  ];
  return (
    <ModulePage color="#8238B3" icon="▷" tag="TRAINING · AI" title="PRACTICE MODE"
      description="Warm up with AI-generated interview questions tailored to role type. Answer with camera on and receive instant analysis — exactly like the real thing.">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: 16 }}>
        {QUESTION_SETS.map(q => (
          <div
            key={q.label}
            style={{ background: "#280055", border: `1px solid ${q.color}33`, borderRadius: 8, padding: "24px 20px", cursor: "pointer", transition: "all 0.2s" }}
            onClick={() => navigate("/interview")}
            onMouseEnter={e => e.currentTarget.style.borderColor = q.color + "88"}
            onMouseLeave={e => e.currentTarget.style.borderColor = q.color + "33"}
          >
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 10, color: q.color, letterSpacing: "0.15em", marginBottom: 10 }}>{q.label}</div>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 28, fontWeight: 700, color: "#EFD9F7", marginBottom: 4 }}>{q.count}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: "rgba(239,217,247,0.35)", letterSpacing: "0.15em" }}>QUESTIONS</div>
            <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13, color: "#8238B3", marginTop: 14 }}>START →</div>
          </div>
        ))}
      </div>
      <InfoCard title="HOW PRACTICE MODE WORKS" items={[
        "Select a question category and difficulty",
        "Camera activates — answer naturally as you would in a real interview",
        "AI analyses voice, body language, and eye contact simultaneously",
        "After each answer, receive a micro-feedback card before the next question",
        "End of session: full breakdown with improvement priorities",
      ]} />
    </ModulePage>
  );
}

// ─── TIPS & COACHING ──────────────────────────────────────────────────────────
export function TipsCoaching() {
  const TIPS = [
    { priority: "HIGH", color: "#D7AC28", title: "Reduce filler words", detail: "Your 'um' frequency was 3.2% last session — above the 2% threshold. Try replacing with a breath pause." },
    { priority: "MED", color: "#D7AC28", title: "Improve camera gaze", detail: "You spent 39% of session looking away. Try placing a sticker near your webcam as a focus anchor." },
    { priority: "LOW", color: "#C78D17", title: "Maintain strong posture", detail: "Your posture score of 74 is solid. Focus on keeping shoulders back during longer answers." },
    { priority: "MED", color: "#D7AC28", title: "Vary speech pace", detail: "Slight monotone detected on technical answers. Slow down by 10 WPM on key points for emphasis." },
    { priority: "LOW", color: "#C78D17", title: "Expression variety", detail: "Great baseline expression. Experiment with nodding slightly to signal active engagement." },
  ];
  return (
    <ModulePage color="#C78D17" icon="◈" tag="COACHING · AI" title="TIPS & COACHING"
      description="Personalised improvement recommendations generated from your analysis history. Ranked by impact on your overall score.">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {TIPS.map(tip => (
          <div key={tip.title} style={{ background: "#280055", border: `1px solid ${tip.color}22`, borderLeft: `3px solid ${tip.color}`, borderRadius: 8, padding: "20px 20px 20px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.2em", color: tip.color, background: tip.color + "15", padding: "2px 8px", borderRadius: 2 }}>{tip.priority}</span>
              <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 11, color: "#EFD9F7", letterSpacing: "0.08em" }}>{tip.title}</span>
            </div>
            <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13, color: "rgba(239,217,247,0.6)", lineHeight: 1.65, margin: 0 }}>{tip.detail}</p>
          </div>
        ))}
      </div>
    </ModulePage>
  );
}

// ─── HISTORY ─────────────────────────────────────────────────────────────────
export function History() {
  const navigate = useNavigate();
  const SESSIONS = [
    { id: "s1", date: "2025-06-14", duration: "08:32", score: 78, verdict: "Good" },
    { id: "s2", date: "2025-06-12", duration: "06:14", score: 65, verdict: "Average" },
    { id: "s3", date: "2025-06-10", duration: "11:05", score: 82, verdict: "Good" },
    { id: "s4", date: "2025-06-07", duration: "07:50", score: 91, verdict: "Excellent" },
    { id: "s5", date: "2025-06-04", duration: "05:23", score: 58, verdict: "Average" },
  ];
  const verdictColor = v => ({ Excellent: "#C78D17", Good: "#8238B3", Average: "#D7AC28", Poor: "#D7AC28" }[v] || "#8238B3");

  return (
    <ModulePage color="#8238B3" icon="◇" tag="ARCHIVE · SESSIONS" title="SESSION HISTORY"
      description="Every interview session you've recorded, with scores and replay access. Track your improvement over time.">
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {SESSIONS.map(s => (
          <div
            key={s.id}
            style={{ background: "#280055", border: "1px solid rgba(168,85,247,0.12)", borderRadius: 8, padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", transition: "all 0.2s", flexWrap: "wrap", gap: 12 }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(168,85,247,0.4)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(168,85,247,0.12)"}
            onClick={() => navigate("/results", { state: { analysisData: null, videoURL: null } })}
          >
            <div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(239,217,247,0.35)", letterSpacing: "0.15em", marginBottom: 4 }}>{s.date} · {s.duration}</div>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 12, color: "#EFD9F7", letterSpacing: "0.08em" }}>Session #{s.id.slice(1).padStart(3, "0")}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 20, fontWeight: 700, color: verdictColor(s.verdict) }}>{s.score}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 7, color: "rgba(239,217,247,0.35)", letterSpacing: "0.15em" }}>SCORE</div>
              </div>
              <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 12, color: verdictColor(s.verdict), letterSpacing: "0.08em", minWidth: 70, textAlign: "center" }}>{s.verdict.toUpperCase()}</div>
              <div style={{ color: "#8238B3", fontSize: 16 }}>→</div>
            </div>
          </div>
        ))}
      </div>
    </ModulePage>
  );
}

// ─── ABOUT ────────────────────────────────────────────────────────────────────
export function About() {
  const TEAM = [
    { name: "HARSHITA KANDANALA", role: "VOICE ANALYST" },
    { name: "BHAVIKA KHANNA", role: "FACE ANALYST" },
    { name: "RIA RAVIKUMAR", role: "BODY ANALYST" },
    { name: "SHAURYA ARVIND", role: " ML & SCORING ENGINE" },
    { name: "TANAY SANJAY", role: "FRONTEND ARCHITECT" },
  ];
  return (
    <div style={M.page}>
      <div style={M.grid} />
      <div style={M.inner}>
        <div style={{ maxWidth: 760 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#8238B3", letterSpacing: "0.25em", marginBottom: 16, opacity: 0.7 }}>ABOUT THE PROJECT</div>
          <h1 style={{ fontFamily: "'Orbitron', monospace", fontSize: "clamp(24px,5vw,44px)", fontWeight: 700, color: "#EFD9F7", letterSpacing: "0.08em", lineHeight: 1.1, marginBottom: 28 }}>
            BUILT TO MAKE<br /><span style={{ color: "#8238B3" }}>GREAT INTERVIEWS</span><br />REPEATABLE.
          </h1>
          <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 16, color: "rgba(239,217,247,0.6)", lineHeight: 1.85, marginBottom: 20 }}>
            AuraScore was born from a frustration: interview performance is treated as a mysterious, innate talent. We disagree. Every aspect of how you present in an interview — your voice, posture, gaze, expression — is measurable, learnable, and improvable.
          </p>
          <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 16, color: "rgba(239,217,247,0.6)", lineHeight: 1.85, marginBottom: 48 }}>
            We combine computer vision, real-time audio analysis, and behavioural data to turn vague interview anxiety into clear, prioritised action. Not feedback like "be more confident." Feedback like "your gaze drops 42% during technical questions — here's why and how to fix it."
          </p>

          <div style={{ borderTop: "1px solid rgba(130,56,179,0.1)", paddingTop: 48, marginBottom: 48 }}>
            <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 11, color: "#EFD9F7", letterSpacing: "0.1em", marginBottom: 24 }}>THE TEAM</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: 16 }}>
              {TEAM.map(t => (
                <div key={t.name} style={{ background: "#280055", border: "1px solid rgba(130,56,179,0.08)", borderRadius: 8, padding: "20px 16px" }}>
                  <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 10, fontWeight: 600, color: "#8238B3", letterSpacing: "0.1em", marginBottom: 6 }}>{t.name}</div>
                  <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13, color: "rgba(239,217,247,0.6)" }}>{t.role}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))", gap: 12 }}>
            {[["98.4%", "ANALYSIS ACCURACY"], ["12K+", "SESSIONS PROCESSED"], ["4.9★", "USER RATING"], ["<2s", "REAL-TIME LATENCY"]].map(([v, l]) => (
              <div key={l} style={{ background: "#280055", border: "1px solid rgba(130,56,179,0.08)", borderRadius: 8, padding: "20px 16px", textAlign: "center" }}>
                <div style={{ fontFamily: "'Orbitron', monospace", fontSize: 22, fontWeight: 700, color: "#8238B3", marginBottom: 4 }}>{v}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: "rgba(239,217,247,0.35)", letterSpacing: "0.2em" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PROFILE ─────────────────────────────────────────────────────────────────
export function Profile() {
  const navigate = useNavigate();
  const stored = localStorage.getItem("aura_user");
  const user = stored ? JSON.parse(stored) : { name: "User", email: "user@example.com", joinedAt: new Date().toISOString() };
  const handle = (user?.name || "user").toLowerCase().replace(/\s+/g, "");

  return (
    <div style={M.page}>
      <div style={M.grid} />
      <div style={{ ...M.inner, maxWidth: 1100 }}>
        <button style={M.back} onClick={() => navigate("/dashboard")}>← DASHBOARD</button>

        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#8238B3", letterSpacing: "0.25em", marginBottom: 12, opacity: 0.7 }}>ACCOUNT</div>
        <h1 style={{ fontFamily: "'Orbitron', monospace", fontSize: "clamp(18px,3vw,28px)", fontWeight: 700, color: "#EFD9F7", letterSpacing: "0.1em", marginBottom: 48 }}>PROFILE &amp; SETTINGS</h1>

        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 64, alignItems: "flex-start" }}>

          {/* Profile Card */}
          <div style={{ flexShrink: 0 }}>
            <ProfileCard
              name={user?.name || "User"}
              title="AuraScore Member"
              handle={handle}
              status="Online"
              contactText="EDIT PROFILE"
              showUserInfo={true}
              enableTilt={true}
              enableMobileTilt={false}
              behindGlowEnabled={true}
              behindGlowColor="rgba(0, 212, 255, 0.45)"
              innerGradient="linear-gradient(145deg, rgba(130,56,179,0.1) 0%, rgba(0,10,20,0.95) 100%)"
              onContactClick={() => { }}
            />
          </div>

          {/* Settings fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 520, paddingTop: 8 }}>
            {[
              { label: "DISPLAY NAME", value: user?.name || "" },
              { label: "EMAIL ADDRESS", value: user?.email || "" },
              { label: "ACCOUNT TYPE", value: "FREE TIER" },
              { label: "MEMBER SINCE", value: user?.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : "" },
            ].map(f => (
              <div key={f.label}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(239,217,247,0.35)", letterSpacing: "0.2em", marginBottom: 7 }}>{f.label}</div>
                <div style={{ background: "#200044", border: "1px solid rgba(130,56,179,0.12)", borderRadius: 4, padding: "12px 16px", fontFamily: "'Rajdhani', sans-serif", fontSize: 14, color: "#EFD9F7" }}>{f.value}</div>
              </div>
            ))}
            <button style={{ background: "rgba(130,56,179,0.08)", border: "1px solid rgba(130,56,179,0.3)", color: "#8238B3", padding: "12px", borderRadius: 4, fontFamily: "'Orbitron', monospace", fontSize: 10, letterSpacing: "0.12em", cursor: "pointer", marginTop: 8 }}>
              SAVE CHANGES
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 404 ─────────────────────────────────────────────────────────────────────
export function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{ ...M.page, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={M.grid} />
      <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
        <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "clamp(80px,20vw,160px)", fontWeight: 900, color: "rgba(130,56,179,0.06)", lineHeight: 1, marginBottom: 0 }}>404</div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#D7AC28", letterSpacing: "0.25em", marginBottom: 16, marginTop: -20 }}>SIGNAL LOST</div>
        <h1 style={{ fontFamily: "'Orbitron', monospace", fontSize: 20, fontWeight: 700, color: "#EFD9F7", letterSpacing: "0.1em", marginBottom: 16 }}>PAGE NOT FOUND</h1>
        <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 15, color: "rgba(239,217,247,0.6)", marginBottom: 36 }}>This sector of the system does not exist.</p>
        <button
          style={{ background: "rgba(130,56,179,0.1)", border: "1px solid #8238B3", color: "#8238B3", padding: "12px 32px", borderRadius: 4, fontFamily: "'Orbitron', monospace", fontSize: 11, letterSpacing: "0.12em", cursor: "pointer" }}
          onClick={() => navigate("/dashboard")}
        >← RETURN TO BASE</button>
      </div>
    </div>
  );
}
