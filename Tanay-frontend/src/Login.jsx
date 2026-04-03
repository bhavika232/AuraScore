import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import BorderGlow from "./BorderGlow";
import Aurora from "./Aurora";

const GRAPE  = "#8238B3";
const PALE   = "#EFD9F7";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      {/* Full-screen Orb background */}
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
          <span style={S.logoIcon}>◈</span>
          <span style={S.logoText}>AURA<span style={{ color: GRAPE }}>SCORE</span></span>
        </div>

        <div style={S.tag}>IDENTITY VERIFICATION</div>
        <h1 style={S.title}>SIGN IN</h1>

        <form onSubmit={submit} style={S.form}>
          <div style={S.fieldWrap}>
            <label style={S.label}>EMAIL ADDRESS</label>
            <div style={S.inputWrap}>
              <span style={S.inputIcon}>◎</span>
              <input
                style={S.input} type="email" name="email" placeholder="operator@domain.com"
                value={form.email} onChange={handle} required autoComplete="email"
              />
            </div>
          </div>

          <div style={S.fieldWrap}>
            <label style={S.label}>ACCESS CODE</label>
            <div style={S.inputWrap}>
              <span style={S.inputIcon}>◆</span>
              <input
                style={S.input} type="password" name="password" placeholder="••••••••••••"
                value={form.password} onChange={handle} required autoComplete="current-password"
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -8 }}>
            <Link to="/forgot-password" style={S.forgot}>FORGOT PASSWORD?</Link>
          </div>

          {error && <div style={S.error}><span>⚠</span> {error}</div>}

          <button type="submit" style={S.btn} disabled={loading}>
            {loading ? <span style={S.spinner} /> : null}
            {loading ? "AUTHENTICATING..." : "ENTER SYSTEM →"}
          </button>
        </form>

        <div style={S.footer}>
          <span style={S.footerText}>NO ACCOUNT?</span>
          <Link to="/signup" style={S.footerLink}>CREATE ONE →</Link>
        </div>
      </div>
      </BorderGlow>
    </div>
  );
}

const S = {
  page: {
    minHeight: "100vh", background: "#1a0033",
    display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 16px 40px",
    position: "relative",
  },
  orbWrap: { position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" },
  card: {
    position: "relative", zIndex: 1,
    padding: "48px 44px", width: "100%", maxWidth: 420,
  },
  corner: {
    position: "absolute", width: 16, height: 16,
    borderColor: GRAPE, borderStyle: "solid",
  },
  logoWrap: { display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginBottom: 36 },
  logoIcon: { color: GRAPE, fontSize: 22 },
  logoText: { fontFamily: "'Orbitron', monospace", fontSize: 16, fontWeight: 700, color: PALE, letterSpacing: "0.15em" },
  tag: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.25em",
    color: GRAPE, opacity: 0.8, marginBottom: 8, textAlign: "center",
  },
  title: {
    fontFamily: "'Orbitron', monospace", fontSize: 24, fontWeight: 700, letterSpacing: "0.15em",
    color: PALE, textAlign: "center", marginBottom: 36,
  },
  form: { display: "flex", flexDirection: "column", gap: 20 },
  fieldWrap: { display: "flex", flexDirection: "column", gap: 7 },
  label: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.22em",
    color: "rgba(239,217,247,0.4)",
  },
  inputWrap: { position: "relative", display: "flex", alignItems: "center" },
  inputIcon: { position: "absolute", left: 14, color: GRAPE, fontSize: 12, pointerEvents: "none", opacity: 0.8 },
  input: {
    width: "100%", background: "#1a0033", border: "1px solid rgba(130,56,179,0.18)",
    borderRadius: 4, padding: "12px 14px 12px 36px",
    color: PALE, fontSize: 14, fontFamily: "'Rajdhani', sans-serif",
    transition: "border-color 0.2s",
    "::placeholder": { color: "rgba(239,217,247,0.3)" },
  },
  forgot: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.15em",
    color: "rgba(239,217,247,0.35)", textDecoration: "none", transition: "color 0.2s",
  },
  error: {
    background: "rgba(255,45,120,0.08)", border: "1px solid rgba(255,45,120,0.25)",
    borderRadius: 4, padding: "10px 14px", color: "#ff6b6b",
    fontFamily: "'Rajdhani', sans-serif", fontSize: 13,
    display: "flex", alignItems: "center", gap: 8,
  },
  btn: {
    background: "rgba(130,56,179,0.15)", border: `1px solid ${GRAPE}`,
    color: PALE, padding: "14px", borderRadius: 4,
    fontFamily: "'Orbitron', monospace", fontSize: 11, fontWeight: 600, letterSpacing: "0.15em",
    cursor: "pointer", transition: "all 0.2s", marginTop: 8,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
    boxShadow: "0 0 20px rgba(130,56,179,0.12)",
  },
  spinner: {
    width: 14, height: 14, border: "2px solid rgba(130,56,179,0.25)", borderTop: `2px solid ${GRAPE}`,
    borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block",
  },
  footer: { marginTop: 28, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 },
  footerText: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(239,217,247,0.35)", letterSpacing: "0.2em" },
  footerLink: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: GRAPE, letterSpacing: "0.2em", textDecoration: "none" },
};
