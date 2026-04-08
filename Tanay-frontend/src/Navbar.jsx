import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

const GRAPE  = "#8238B3";
const PALE   = "#EFD9F7";

const NAV_LINKS = [
  { to: "/dashboard", label: "DASHBOARD" },
  { to: "/practice",  label: "PRACTICE" },
  { to: "/tips",      label: "COACHING" },
  { to: "/about",     label: "ABOUT" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isAuth = ["/login", "/signup", "/forgot-password"].includes(location.pathname);

  return (
    <nav style={S.nav}>
      {/* Top scan line */}
      <div style={S.scanLine} />

      <div style={S.inner}>
        {/* Logo */}
        <NavLink to={user ? "/dashboard" : "/"} style={S.logo} onClick={() => setMenuOpen(false)}>
          <span style={S.logoIcon}>◈</span>
          <span style={S.logoText}>AURA<span style={S.logoAccent}>SCORE</span></span>
        </NavLink>

        {/* Desktop nav links — only when logged in */}
        {user && !isAuth && (
          <div style={S.links}>
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink key={to} to={to} style={({ isActive }) => ({ ...S.link, ...(isActive ? S.linkActive : {}) })}>
                {label}
                <span style={S.linkUnderline} />
              </NavLink>
            ))}
          </div>
        )}

        {/* Right side */}
        <div style={S.right}>
          {!user && (
            <>
              {location.pathname !== "/login" && (
                <button style={S.btnGhost} onClick={() => navigate("/login")}>LOG IN</button>
              )}
              {location.pathname !== "/signup" && (
                <button style={S.btnCyan} onClick={() => navigate("/signup")}>GET STARTED</button>
              )}
            </>
          )}

          {user && (
            <div style={{ position: "relative" }}>
              <button style={S.avatar} onClick={() => setProfileOpen(p => !p)}>
                <span style={S.avatarInner}>{user.name?.[0]?.toUpperCase() || "A"}</span>
              </button>

              {profileOpen && (
                <div style={S.dropdown} onMouseLeave={() => setProfileOpen(false)}>
                  <div style={S.dropUser}>
                    <div style={S.dropName}>{user.name}</div>
                    <div style={S.dropEmail}>{user.email}</div>
                  </div>
                  <div style={S.dropDivider} />
                  <button style={S.dropItem} onClick={() => { navigate("/profile"); setProfileOpen(false); }}>
                    ⚙ Profile &amp; Settings
                  </button>
                  <button style={{ ...S.dropItem, color: "#ff6b6b" }} onClick={handleLogout}>
                    ⏻ Logout
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mobile hamburger */}
          {user && (
            <button style={S.hamburger} onClick={() => setMenuOpen(p => !p)}>
              <span style={{ ...S.bar, opacity: menuOpen ? 0 : 1 }} />
              <span style={S.bar} />
              <span style={{ ...S.bar, opacity: menuOpen ? 0 : 1 }} />
            </button>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && user && (
        <div style={S.mobileMenu}>
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink key={to} to={to} style={S.mobileLink} onClick={() => setMenuOpen(false)}>
              {label}
            </NavLink>
          ))}
          <button style={{ ...S.mobileLink, color: "#ff6b6b", background: "none", border: "none", textAlign: "left", cursor: "pointer" }} onClick={handleLogout}>
            LOGOUT
          </button>
        </div>
      )}
    </nav>
  );
}

const S = {
  nav: {
    position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
    background: "rgba(26,0,51,0.88)",
    backdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(130,56,179,0.15)",
  },
  scanLine: {
    height: 1,
    background: `linear-gradient(90deg, transparent, rgba(130,56,179,0.7) 50%, transparent)`,
    marginBottom: -1,
  },
  inner: {
    maxWidth: 1280, margin: "0 auto", padding: "0 24px",
    height: 64, display: "flex", alignItems: "center", justifyContent: "space-between",
  },
  logo: {
    display: "flex", alignItems: "center", gap: 10, textDecoration: "none",
  },
  logoIcon: { color: GRAPE, fontSize: 20, lineHeight: 1 },
  logoText: { fontFamily: "'Orbitron', monospace", fontSize: 15, fontWeight: 700, color: PALE, letterSpacing: "0.15em" },
  logoAccent: { color: GRAPE },
  links: { display: "flex", alignItems: "center", gap: 4 },
  link: {
    position: "relative", padding: "6px 14px",
    fontFamily: "'Orbitron', monospace", fontSize: 10, fontWeight: 600, letterSpacing: "0.12em",
    color: "rgba(239,217,247,0.55)", textDecoration: "none", transition: "color 0.2s",
  },
  linkActive: { color: PALE },
  linkUnderline: {
    position: "absolute", bottom: 0, left: "50%", right: "50%", height: 1,
    background: GRAPE, transition: "left 0.2s, right 0.2s",
  },
  right: { display: "flex", alignItems: "center", gap: 12 },
  btnGhost: {
    background: "transparent", border: "1px solid rgba(130,56,179,0.4)",
    color: PALE, padding: "7px 18px", borderRadius: 4,
    fontFamily: "'Orbitron', monospace", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em",
    transition: "all 0.2s", cursor: "pointer",
  },
  btnCyan: {
    background: "rgba(130,56,179,0.15)", border: `1px solid ${GRAPE}`,
    color: PALE, padding: "7px 18px", borderRadius: 4,
    fontFamily: "'Orbitron', monospace", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em",
    cursor: "pointer", transition: "all 0.2s",
  },
  avatar: {
    width: 36, height: 36, borderRadius: "50%",
    background: "transparent", border: `1.5px solid ${GRAPE}`,
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.2s",
  },
  avatarInner: { fontFamily: "'Orbitron', monospace", fontSize: 12, fontWeight: 700, color: PALE },
  dropdown: {
    position: "absolute", top: "calc(100% + 12px)", right: 0,
    background: "#280055", border: "1px solid rgba(130,56,179,0.25)",
    borderRadius: 8, minWidth: 200, overflow: "hidden",
    boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
  },
  dropUser: { padding: "14px 16px" },
  dropName: { color: PALE, fontFamily: "'Orbitron', monospace", fontSize: 11, fontWeight: 600 },
  dropEmail: { color: "rgba(239,217,247,0.55)", fontSize: 12, marginTop: 2 },
  dropDivider: { height: 1, background: "rgba(130,56,179,0.12)" },
  dropItem: {
    display: "block", width: "100%", textAlign: "left",
    padding: "11px 16px", background: "transparent", border: "none",
    color: "rgba(239,217,247,0.6)", fontSize: 13, cursor: "pointer",
    fontFamily: "'Rajdhani', sans-serif", transition: "all 0.15s",
    letterSpacing: "0.03em",
  },
  hamburger: {
    display: "none", flexDirection: "column", gap: 5,
    background: "transparent", border: "none", padding: 4, cursor: "pointer",
    "@media(max-width:768px)": { display: "flex" },
  },
  bar: { width: 22, height: 1.5, background: GRAPE, display: "block", transition: "opacity 0.2s" },
  mobileMenu: {
    background: "#200044", borderTop: "1px solid rgba(130,56,179,0.12)",
    display: "flex", flexDirection: "column",
  },
  mobileLink: {
    padding: "16px 24px",
    fontFamily: "'Orbitron', monospace", fontSize: 11, fontWeight: 600, letterSpacing: "0.12em",
    color: "rgba(239,217,247,0.6)", textDecoration: "none", borderBottom: "1px solid rgba(130,56,179,0.08)",
    transition: "color 0.2s",
  },
};
