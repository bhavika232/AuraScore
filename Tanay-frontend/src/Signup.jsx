import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "./AuthContext";
import BorderGlow from "./BorderGlow";
import Aurora from "./Aurora";

const GRAPE  = "#8238B3";
const PALE   = "#EFD9F7";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      await signup(form.name, form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: "name",     type: "text",     icon: "◈", label: "DISPLAY NAME",    placeholder: "Your name" },
    { name: "email",    type: "email",    icon: "◎", label: "EMAIL ADDRESS",   placeholder: "operator@domain.com" },
    { name: "password", type: "password", icon: "◆", label: "SET PASSWORD",    placeholder: "Min. 6 characters" },
    { name: "confirm",  type: "password", icon: "◆", label: "CONFIRM PASSWORD",placeholder: "Repeat password" },
  ];

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
        className="signup-glow-card"
      >
      <div style={S.card}>

        <div style={S.logoWrap}>
          <span style={S.logoIcon}>◈</span>
          <span style={S.logoText}>AURA<span style={{ color: GRAPE }}>SCORE</span></span>
        </div>

        <div style={S.tag}>NEW OPERATOR REGISTRATION</div>
        <h1 style={S.title}>CREATE ACCOUNT</h1>

        <form onSubmit={submit} style={S.form}>
          {fields.map(f => (
            <div key={f.name} style={S.fieldWrap}>
              <label style={S.label}>{f.label}</label>
              <div style={S.inputWrap}>
                <span style={S.inputIcon}>{f.icon}</span>
                <input
                  style={S.input} type={f.type} name={f.name}
                  placeholder={f.placeholder} value={form[f.name]}
                  onChange={handle} required
                />
              </div>
            </div>
          ))}

          {error && <div style={S.error}><span>⚠</span> {error}</div>}

          <button type="submit" style={S.btn} disabled={loading}>
            {loading ? <span style={S.spinner} /> : null}
            {loading ? "CREATING ACCOUNT..." : "INITIALISE SYSTEM →"}
          </button>
        </form>

        <div style={S.footer}>
          <span style={S.footerText}>ALREADY REGISTERED?</span>
          <Link to="/login" style={S.footerLink}>SIGN IN →</Link>
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
    padding: "48px 44px", width: "100%", maxWidth: 440,
  },
  corner: { position: "absolute", width: 16, height: 16, borderColor: GRAPE, borderStyle: "solid" },
  logoWrap: { display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginBottom: 36 },
  logoIcon: { color: GRAPE, fontSize: 22 },
  logoText: { fontFamily: "'Orbitron', monospace", fontSize: 16, fontWeight: 700, color: PALE, letterSpacing: "0.15em" },
  tag: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.25em", color: GRAPE, opacity: 0.8, marginBottom: 8, textAlign: "center" },
  title: { fontFamily: "'Orbitron', monospace", fontSize: 22, fontWeight: 700, letterSpacing: "0.15em", color: PALE, textAlign: "center", marginBottom: 36 },
  form: { display: "flex", flexDirection: "column", gap: 18 },
  fieldWrap: { display: "flex", flexDirection: "column", gap: 7 },
  label: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.22em", color: "rgba(239,217,247,0.4)" },
  inputWrap: { position: "relative", display: "flex", alignItems: "center" },
  inputIcon: { position: "absolute", left: 14, color: GRAPE, fontSize: 12, pointerEvents: "none", opacity: 0.8 },
  input: {
    width: "100%", background: "#1a0033", border: "1px solid rgba(130,56,179,0.18)",
    borderRadius: 4, padding: "12px 14px 12px 36px",
    color: PALE, fontSize: 14, fontFamily: "'Rajdhani', sans-serif", transition: "border-color 0.2s",
  },
  error: {
    background: "rgba(255,45,120,0.08)", border: "1px solid rgba(255,45,120,0.25)",
    borderRadius: 4, padding: "10px 14px", color: "#ff6b6b",
    fontFamily: "'Rajdhani', sans-serif", fontSize: 13, display: "flex", alignItems: "center", gap: 8,
  },
  btn: {
    background: "rgba(130,56,179,0.15)", border: `1px solid ${GRAPE}`, color: PALE,
    padding: "14px", borderRadius: 4, fontFamily: "'Orbitron', monospace", fontSize: 11,
    fontWeight: 600, letterSpacing: "0.15em", cursor: "pointer", transition: "all 0.2s", marginTop: 8,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
  },
  spinner: { width: 14, height: 14, border: "2px solid rgba(130,56,179,0.25)", borderTop: `2px solid ${GRAPE}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" },
  footer: { marginTop: 28, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 },
  footerText: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(239,217,247,0.35)", letterSpacing: "0.2em" },
  footerLink: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: GRAPE, letterSpacing: "0.2em", textDecoration: "none" },
};
