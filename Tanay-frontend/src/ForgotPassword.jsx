import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import BorderGlow from "./BorderGlow";
import Aurora from "./Aurora";

const GRAPE  = "#8238B3";
const GOLD   = "#D7AC28";
const PALE   = "#EFD9F7";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post("http://localhost:5002/api/forgot-password", { email });
    } catch (err) {
      console.error("Error sending reset password:", err);
    }
    setLoading(false);
    setSent(true);
  };

  return (
    <div style={S.page}>
      <div style={S.orbWrap}>
        <Aurora colorStops={["#2e073e","#be38f3","#ffb43f"]} blend={0.76} amplitude={1.0} speed={1} />
      </div>
      <BorderGlow
        edgeSensitivity={28}
        glowColor="280 55 47"
        backgroundColor="#280055"
        borderRadius={4}
        glowRadius={44}
        glowIntensity={1.1}
        coneSpread={22}
        animated={false}
        colors={['#8238B3', '#EFD9F7', '#D7AC28']}
        fillOpacity={0.45}
        className="auth-glow-card"
      >
      <div style={S.card}>

        <div style={S.logoWrap}>
          <span style={{ color: GRAPE, fontSize: 22 }}>◈</span>
          <span style={S.logoText}>AURA<span style={{ color: GRAPE }}>SCORE</span></span>
        </div>

        {!sent ? (
          <>
            <div style={S.tag}>ACCOUNT RECOVERY</div>
            <h1 style={S.title}>RESET PASSWORD</h1>
            <p style={S.desc}>Enter your registered email. We'll send a reset link.</p>
            <form onSubmit={submit} style={S.form}>
              <div style={S.fieldWrap}>
                <label style={S.label}>EMAIL ADDRESS</label>
                <div style={S.inputWrap}>
                  <span style={S.inputIcon}>◎</span>
                  <input
                    style={S.input} type="email" placeholder="operator@domain.com"
                    value={email} onChange={e => setEmail(e.target.value)} required
                  />
                </div>
              </div>
              <button type="submit" style={S.btn} disabled={loading}>
                {loading ? <span style={S.spinner} /> : null}
                {loading ? "SENDING..." : "SEND RESET LINK →"}
              </button>
            </form>
          </>
        ) : (
          <div style={S.successBox}>
            <div style={S.successIcon}>◎</div>
            <div style={S.successTitle}>MAIL SENT</div>
            <p style={S.successText}>A reset link has been dispatched to <strong style={{ color: GOLD }}>{email}</strong>. Check your inbox.</p>
          </div>
        )}

        <div style={S.footer}>
          <Link to="/login" style={S.footerLink}>← BACK TO SIGN IN</Link>
        </div>
      </div>
      </BorderGlow>
    </div>
  );
}

const S = {
  page: { minHeight: "100vh", background: "#1a0033", display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 16px 40px", position: "relative" },
  orbWrap: { position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" },
  card: {
    position: "relative", zIndex: 1,
    padding: "48px 44px", width: "100%", maxWidth: 400,
  },
  corner: { position: "absolute", width: 16, height: 16, borderColor: GRAPE, borderStyle: "solid" },
  logoWrap: { display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginBottom: 36 },
  logoText: { fontFamily: "'Orbitron', monospace", fontSize: 16, fontWeight: 700, color: PALE, letterSpacing: "0.15em" },
  tag: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.25em",
    color: GRAPE, opacity: 0.8, marginBottom: 8, textAlign: "center",
  },
  title: { fontFamily: "'Orbitron', monospace", fontSize: 22, fontWeight: 700, letterSpacing: "0.15em", color: PALE, textAlign: "center", marginBottom: 12 },
  desc: { fontFamily: "'Rajdhani', sans-serif", fontSize: 14, color: "rgba(239,217,247,0.55)", textAlign: "center", marginBottom: 28, lineHeight: 1.6 },
  form: { display: "flex", flexDirection: "column", gap: 20 },
  fieldWrap: { display: "flex", flexDirection: "column", gap: 7 },
  label: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.22em", color: "rgba(239,217,247,0.4)" },
  inputWrap: { position: "relative", display: "flex", alignItems: "center" },
  inputIcon: { position: "absolute", left: 14, color: GRAPE, fontSize: 12, pointerEvents: "none", opacity: 0.8 },
  input: {
    width: "100%", background: "#1a0033", border: "1px solid rgba(130,56,179,0.18)",
    borderRadius: 4, padding: "12px 14px 12px 36px", color: PALE,
    fontSize: 14, fontFamily: "'Rajdhani', sans-serif",
  },
  btn: {
    background: "rgba(130,56,179,0.15)", border: `1px solid ${GRAPE}`, color: PALE,
    padding: "14px", borderRadius: 4, fontFamily: "'Orbitron', monospace",
    fontSize: 11, fontWeight: 600, letterSpacing: "0.15em",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
  },
  spinner: { width: 14, height: 14, border: "2px solid rgba(130,56,179,0.25)", borderTop: `2px solid ${GRAPE}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" },
  successBox: { textAlign: "center", padding: "12px 0" },
  successIcon: { fontSize: 48, color: GOLD, marginBottom: 16 },
  successTitle: { fontFamily: "'Orbitron', monospace", fontSize: 16, fontWeight: 700, color: GOLD, letterSpacing: "0.15em", marginBottom: 14 },
  successText: { fontFamily: "'Rajdhani', sans-serif", fontSize: 14, color: "rgba(239,217,247,0.6)", lineHeight: 1.7 },
  footer: { marginTop: 28, textAlign: "center" },
  footerLink: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(239,217,247,0.4)", letterSpacing: "0.2em", textDecoration: "none" },
};
