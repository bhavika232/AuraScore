import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Interview from "./pages/Interview";
import Results from "./pages/Results";

// Simple Home redirect — replace with your actual Home.jsx
function Home() {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 48, color: "#adc6ff", marginBottom: 8 }}>AuraScore</h1>
        <p style={{ color: "#555", marginBottom: 32 }}>AI-Powered Interview Analysis</p>
        <a href="/interview" style={{ padding: "12px 32px", background: "#adc6ff", color: "#001a42", borderRadius: 10, fontWeight: 600, textDecoration: "none" }}>
          Start Session
        </a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/interview" element={<Interview />} />
        <Route path="/results" element={<Results />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
