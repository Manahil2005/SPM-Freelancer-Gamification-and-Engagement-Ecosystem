import { useState, useEffect } from "react";

// =============================================================
// AchievementsPage.jsx — Module 11
// Tabs: Badges | Levels | Challenges
//
// Badges:    View all | Admin: add/edit/deactivate
// Levels:    View all | Admin: edit XP thresholds
// Challenges: View all | Admin: add/edit/delete
// =============================================================

const API_BASE = "";
const CURRENT_USER_ID = parseInt(import.meta.env.VITE_USER_ID || "1", 10);
const IS_ADMIN        = true; // Set to true to enable admin features (or implement real auth flow in the future)

const C = {
  navBg: "#001736",
  navMuted: "rgba(255,255,255,0.55)",
  navBorder: "rgba(255,255,255,0.08)",
  sidebarBg: "#f0f3ff",
  sidebarGrad: "#f9f9ff",
  sidebarBorder: "#e4e8f0",
  sidebarText: "#515f74",
  sidebarActiveText: "#001736",
  sidebarActiveBg: "#ffffff",
  sidebarHoverBg: "#dee8ff",
  sidebarLabel: "#747780",
  pageBg: "#f9f9ff",
  surfaceCard: "#ffffff",
  surfaceContainer: "#e7eeff",
  surfaceHigh: "#dee8ff",
  surfaceLow: "#f0f3ff",
  primary: "#001736",
  primaryContainer: "#002b5b",
  obsidian: "#001b18",
  teal: "#89f5e7",
  tealOnLight: "#007a6e",
  textPrimary: "#111c2d",
  textMuted: "#747780",
  textOnDark: "#ffffff",
  textOnTeal: "#001b18",
  outline: "#c4c6d0",
  error: "#ba1a1a",
  success: "#1b5e20",
  frameBorder: "#c4c6d0",
  levelIconBg: "#e7eeff",
  dotInactive: "#AEA9A9",
  paginationActive: "#00132E",
  paginationBorder: "#DEE2E6",
  paginationText: "#00132E",
};

// ── Badge style map ───────────────────────────────────────────
const BADGE_STYLE_MAP = {
  first_project:        { icon: "🎯", grad: ["#1976d2","#42a5f5"] },
  rising_star:          { icon: "⭐", grad: ["#f57c00","#ffca28"] },
  consistent_performer: { icon: "🔥", grad: ["#e53935","#ff7043"] },
  top_rated:            { icon: "💎", grad: ["#7b1fa2","#ce93d8"] },
  challenge_master:     { icon: "🏅", grad: ["#777480","#808080"] },
};
const DEFAULT_STYLE = { icon: "🎖", grad: ["#546e7a", "#90a4ae"] };
const getBadgeStyle = code => BADGE_STYLE_MAP[(code || "").toLowerCase()] || DEFAULT_STYLE;

// ── Challenge type colours ────────────────────────────────────
const CHALLENGE_COLORS = {
  daily:      { bg: "#e8f5e9", border: "#a5d6a7", color: "#2e7d32", icon: "☀️" },
  weekly:     { bg: "#e3f2fd", border: "#90caf9", color: "#1565c0", icon: "📅" },
  monthly:    { bg: "#f3e5f5", border: "#ce93d8", color: "#6a1b9a", icon: "🗓" },
  onboarding: { bg: "#fff8e1", border: "#ffe082", color: "#f57f17", icon: "🚀" },
};
const getChallengeStyle = type => CHALLENGE_COLORS[type] || { bg: C.surfaceLow, border: C.outline, color: C.textPrimary, icon: "🎯" };

// ── SVG Badge Logos ───────────────────────────────────────────
const BadgeLogo = {
  first_project: ({ size = 80 }) => (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <defs>
        <linearGradient id="fp_s" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1976d2" /><stop offset="100%" stopColor="#0d47a1" /></linearGradient>
        <linearGradient id="fp_i" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#42a5f5" /><stop offset="100%" stopColor="#1565c0" /></linearGradient>
      </defs>
      <path d="M40 5 L70 18 L70 43 C70 59 56 70 40 76 C24 70 10 59 10 43 L10 18 Z" fill="url(#fp_s)" />
      <path d="M40 12 L63 23 L63 43 C63 55 53 64 40 69 C27 64 17 55 17 43 L17 23 Z" fill="url(#fp_i)" />
      <path d="M40 18 L42 24 L49 24 L43.5 28 L45.5 34 L40 30 L34.5 34 L36.5 28 L31 24 L38 24 Z" fill="#ffd54f" />
      <path d="M27 43 L35 52 L55 30" stroke="#80deea" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  rising_star: ({ size = 80 }) => (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <defs><linearGradient id="rs_s" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#ffca28" /><stop offset="100%" stopColor="#f57c00" /></linearGradient></defs>
      <circle cx="40" cy="36" r="28" fill="#fff176" opacity="0.3" />
      <path d="M40 7 L46 26 L67 26 L51 38 L57 57 L40 46 L23 57 L29 38 L13 26 L34 26 Z" fill="url(#rs_s)" stroke="#e65100" strokeWidth="1" />
      <path d="M40 17 L44 29 L57 29 L47 37 L51 49 L40 42 L29 49 L33 37 L23 29 L36 29 Z" fill="#fff9c4" opacity="0.45" />
    </svg>
  ),
  consistent_performer: ({ size = 80 }) => (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <defs>
        <linearGradient id="cp_r" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef5350" /><stop offset="100%" stopColor="#b71c1c" /></linearGradient>
        <linearGradient id="cp_i" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff7043" /><stop offset="100%" stopColor="#bf360c" /></linearGradient>
        <linearGradient id="cp_b1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#69f0ae" /><stop offset="100%" stopColor="#00c853" /></linearGradient>
        <linearGradient id="cp_b2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#40c4ff" /><stop offset="100%" stopColor="#0091ea" /></linearGradient>
        <linearGradient id="cp_b3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ea80fc" /><stop offset="100%" stopColor="#aa00ff" /></linearGradient>
      </defs>
      <circle cx="40" cy="40" r="33" fill="url(#cp_r)" />
      <circle cx="40" cy="40" r="27" fill="url(#cp_i)" />
      <circle cx="40" cy="40" r="21" fill="#1a0a00" />
      <rect x="24" y="46" width="8" height="12" rx="2" fill="url(#cp_b1)" />
      <rect x="34" y="36" width="8" height="22" rx="2" fill="url(#cp_b2)" />
      <rect x="44" y="26" width="8" height="32" rx="2" fill="url(#cp_b3)" />
    </svg>
  ),
  top_rated: ({ size = 80 }) => (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <defs>
        <linearGradient id="tr_c" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#ce93d8" /><stop offset="100%" stopColor="#7b1fa2" /></linearGradient>
        <linearGradient id="tr_b" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#9c27b0" /><stop offset="100%" stopColor="#4a148c" /></linearGradient>
      </defs>
      <path d="M26 10 L54 10 L54 40 C54 53 47 60 40 62 C33 60 26 53 26 40 Z" fill="url(#tr_c)" stroke="#f3e5f5" strokeWidth="1.5" />
      <path d="M26 18 C16 18 12 25 12 33 C12 40 16 45 26 43" fill="none" stroke="#ce93d8" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M54 18 C64 18 68 25 68 33 C68 40 64 45 54 43" fill="none" stroke="#ce93d8" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M40 20 L42.5 27 L50 27 L44.5 31.5 L46.5 39 L40 34.5 L33.5 39 L35.5 31.5 L30 27 L37.5 27 Z" fill="#ffd54f" />
      <rect x="37" y="62" width="6" height="6" rx="1" fill="url(#tr_b)" />
      <rect x="24" y="68" width="32" height="6" rx="3" fill="url(#tr_b)" />
    </svg>
  ),
  challenge_master: ({ size = 80 }) => (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <defs>
        <linearGradient id="cm_h" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#80cbc4" /><stop offset="100%" stopColor="#004d40" /></linearGradient>
        <linearGradient id="cm_i" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#00897b" /><stop offset="100%" stopColor="#00251a" /></linearGradient>
        <linearGradient id="cm_b" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffee58" /><stop offset="100%" stopColor="#f9a825" /></linearGradient>
      </defs>
      <path d="M40 4 L68 20 L68 52 L40 68 L12 52 L12 20 Z" fill="url(#cm_h)" stroke="#b2dfdb" strokeWidth="2" />
      <path d="M40 12 L62 25 L62 50 L40 63 L18 50 L18 25 Z" fill="url(#cm_i)" />
      <path d="M46 13 L33 38 L42 38 L35 59 L52 31 L43 31 Z" fill="url(#cm_b)" stroke="#fff9c4" strokeWidth="1" />
    </svg>
  ),
};

// ── API helper ────────────────────────────────────────────────
const authHeaders = {
  "Content-Type": "application/json",
  "x-user-id": String(CURRENT_USER_ID),
  "x-user-role": IS_ADMIN ? "admin" : "freelancer",
};

async function apiFetch(url, options = {}) {
  const res = await fetch(url, { ...options, headers: { ...authHeaders, ...(options.headers || {}) } });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || "Request failed");
  return data;
}

// ── Reusable components ───────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 480, maxWidth: "90vw", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <span style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 20, color: C.textPrimary }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: C.textMuted }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder = "", disabled = false, hint = "", options = null }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 12, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{label}</label>
      {type === "textarea"
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.outline}`, fontFamily: "'Inter', sans-serif", fontSize: 14, color: C.textPrimary, resize: "vertical", outline: "none", boxSizing: "border-box" }} />
        : options
        ? <select value={value} onChange={e => onChange(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.outline}`, fontFamily: "'Inter', sans-serif", fontSize: 14, color: C.textPrimary, outline: "none", boxSizing: "border-box", background: "#fff" }}>
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.outline}`, fontFamily: "'Inter', sans-serif", fontSize: 14, color: C.textPrimary, outline: "none", boxSizing: "border-box", background: disabled ? C.surfaceLow : "#fff" }} />
      }
      {hint && <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: C.textMuted, marginTop: 4, display: "block" }}>{hint}</span>}
    </div>
  );
}

function Pagination({ current, total, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", height: 31 }}>
      <button onClick={() => onChange(Math.max(1, current - 1))} disabled={current === 1} style={{ width: 30, height: 31, background: "transparent", border: `1px solid ${C.paginationBorder}`, borderRadius: "3.2px 0 0 3.2px", cursor: current === 1 ? "not-allowed" : "pointer", color: current === 1 ? C.textMuted : C.paginationText, fontSize: 13 }}>‹</button>
      {Array.from({ length: total }, (_, i) => i + 1).map(page => (
        <button key={page} onClick={() => onChange(page)} style={{ width: 26, height: 31, background: current === page ? C.paginationActive : "transparent", border: `1px solid ${current === page ? C.paginationActive : C.paginationBorder}`, borderLeft: "none", fontFamily: "'Inter', sans-serif", fontSize: 12, color: current === page ? "#fff" : C.paginationText, cursor: "pointer" }}>{page}</button>
      ))}
      <button onClick={() => onChange(Math.min(total, current + 1))} disabled={current === total} style={{ width: 30, height: 31, background: "transparent", border: `1px solid ${C.paginationBorder}`, borderLeft: "none", borderRadius: "0 4px 4px 0", cursor: current === total ? "not-allowed" : "pointer", color: current === total ? C.textMuted : C.paginationText, fontSize: 13 }}>›</button>
    </div>
  );
}

// ── Badge Card (view) ─────────────────────────────────────────
function BadgeCard({ badge }) {
  const style = getBadgeStyle(badge.badge_code);
  const Logo = BadgeLogo[(badge.badge_code || "").toLowerCase()];
  return (
    <div style={{ boxSizing: "border-box", width: 271, height: 339, flexShrink: 0, border: `2px solid ${style.grad[0]}`, borderRadius: 12, display: "flex", flexDirection: "column", overflow: "hidden", background: C.surfaceCard, boxShadow: `0 2px 12px ${style.grad[0]}22`, transition: "transform 0.2s, box-shadow 0.2s" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,23,54,0.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 2px 12px ${style.grad[0]}22`; }}
    >
      <div style={{ width: "100%", height: 188, flexShrink: 0, background: `linear-gradient(135deg, ${style.grad[0]}cc, ${style.grad[1]}ee)`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
        {Logo ? <Logo size={90} /> : <span style={{ fontSize: 60 }}>{style.icon}</span>}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.2) 0%, transparent 65%)" }} />
        <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: 10, fontWeight: 700, fontFamily: "'Inter', sans-serif", padding: "2px 8px", borderRadius: 9999 }}>+{badge.points_awarded} pts</div>
        <div style={{ position: "absolute", top: 10, left: 10, background: C.teal, color: C.textOnTeal, fontSize: 9, fontWeight: 800, fontFamily: "'Inter', sans-serif", padding: "2px 7px", borderRadius: 9999, textTransform: "uppercase" }}>{badge.category}</div>
      </div>
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 16, color: "#111c2d" }}>{badge.name}</span>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#43474f" }}>{badge.description}</span>
        <div style={{ marginTop: "auto", fontFamily: "'Inter', sans-serif", fontSize: 11, color: C.textMuted }}>
          Code: <code style={{ background: C.surfaceLow, padding: "1px 5px", borderRadius: 4 }}>{badge.badge_code}</code>
        </div>
      </div>
    </div>
  );
}

// ── Badge Manage Card (admin) ─────────────────────────────────
function BadgeManageCard({ badge, onEdit, onDelete }) {
  const style = getBadgeStyle(badge.badge_code);
  const Logo = BadgeLogo[(badge.badge_code || "").toLowerCase()];
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <div style={{ boxSizing: "border-box", width: 271, height: 339, flexShrink: 0, border: `2px solid ${style.grad[0]}${badge.is_active ? "" : "44"}`, borderRadius: 12, display: "flex", flexDirection: "column", overflow: "hidden", background: badge.is_active ? C.surfaceCard : C.surfaceLow, opacity: badge.is_active ? 1 : 0.6, transition: "transform 0.2s" }}
      onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
      onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
    >
      <div style={{ width: "100%", height: 140, flexShrink: 0, background: `linear-gradient(135deg, ${style.grad[0]}${badge.is_active ? "cc" : "55"}, ${style.grad[1]}${badge.is_active ? "ee" : "77"})`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        {Logo ? <Logo size={70} /> : <span style={{ fontSize: 48 }}>{style.icon}</span>}
        <div style={{ position: "absolute", top: 8, left: 8 }}>
          {!badge.is_active && <span style={{ background: C.error, color: "#fff", fontSize: 9, fontWeight: 800, fontFamily: "'Inter', sans-serif", padding: "2px 7px", borderRadius: 9999, textTransform: "uppercase" }}>Inactive</span>}
        </div>
        <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: 10, fontWeight: 700, fontFamily: "'Inter', sans-serif", padding: "2px 8px", borderRadius: 9999 }}>+{badge.points_awarded}pts</div>
      </div>
      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
        <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 15, color: C.textPrimary }}>{badge.name}</span>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: C.textMuted, lineHeight: "18px" }}>{badge.description}</span>
        <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
          <span style={{ background: C.surfaceContainer, color: C.tealOnLight, fontSize: 10, fontWeight: 600, fontFamily: "'Inter', sans-serif", padding: "2px 8px", borderRadius: 9999, textTransform: "uppercase" }}>{badge.category}</span>
          <code style={{ background: C.surfaceLow, padding: "2px 6px", borderRadius: 4, fontSize: 10, color: C.textMuted }}>{badge.badge_code}</code>
        </div>
      </div>
      <div style={{ padding: "0 14px 14px", display: "flex", gap: 8 }}>
        <button onClick={() => onEdit(badge)} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: `1px solid ${C.outline}`, background: C.surfaceLow, fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 12, color: C.primary, cursor: "pointer" }}
          onMouseEnter={e => e.currentTarget.style.background = C.surfaceHigh}
          onMouseLeave={e => e.currentTarget.style.background = C.surfaceLow}
        >✏️ Edit</button>
        {!confirmDelete
          ? <button onClick={() => setConfirmDelete(true)} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: `1px solid ${C.error}44`, background: "#fff5f5", fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 12, color: C.error, cursor: "pointer" }}>🗑 Delete</button>
          : <button onClick={() => { onDelete(badge.badge_code); setConfirmDelete(false); }} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", background: C.error, fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 12, color: "#fff", cursor: "pointer" }}>Confirm?</button>
        }
      </div>
    </div>
  );
}

// ── Level Row (view) ──────────────────────────────────────────
function LevelRow({ level }) {
  const icons = { 1: "🌱", 2: "⚡", 3: "🏆" };
  const colors = { 1: "#007a6e", 2: "#001736", 3: "#001b18" };
  const color = colors[level.level_number] || C.primary;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", border: `1px solid rgba(0,0,0,0.08)`, borderRadius: 12, background: C.surfaceCard, transition: "box-shadow 0.2s" }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,23,54,0.08)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
    >
      <div style={{ width: 56, height: 56, borderRadius: 12, background: `${color}18`, border: `2px solid ${color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>
        {icons[level.level_number] || "⭐"}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 16, color: C.textPrimary }}>Level {level.level_number}</span>
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 14, color }}>· {level.title}</span>
        </div>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: C.textMuted }}>
        {level.min_points === 0
          ? "Starting level — all users begin here"
          : `${parseInt(level.min_points).toLocaleString()} XP${level.max_points ? ` – ${parseInt(level.max_points).toLocaleString()} XP` : "+"}`
        }
      </span>
      </div>
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${color}22`, border: `2px solid ${color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 14, color, flexShrink: 0 }}>
        {level.level_number}
      </div>
    </div>
  );
}

// ── Challenge Row (view + admin) ──────────────────────────────
function ChallengeRow({ challenge, onEdit, onDelete }) {
  const cs = getChallengeStyle(challenge.challenge_type);
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", border: `1px solid ${challenge.is_active ? cs.border : C.outline}`, borderRadius: 10, background: challenge.is_active ? cs.bg : C.surfaceLow, opacity: challenge.is_active ? 1 : 0.6, transition: "box-shadow 0.2s" }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,23,54,0.08)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
    >
      {/* Type icon */}
      <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fff", border: `1px solid ${cs.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{cs.icon}</div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 14, color: C.textPrimary }}>{challenge.title}</span>
          {!challenge.is_active && <span style={{ background: C.error, color: "#fff", fontSize: 9, fontWeight: 800, fontFamily: "'Inter', sans-serif", padding: "1px 6px", borderRadius: 9999, textTransform: "uppercase" }}>Inactive</span>}
        </div>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: C.textMuted }}>{challenge.description}</span>
      </div>

      {/* Meta */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
        <span style={{ background: cs.border, color: cs.color, fontSize: 10, fontWeight: 700, fontFamily: "'Inter', sans-serif", padding: "2px 8px", borderRadius: 9999, textTransform: "uppercase" }}>{challenge.challenge_type}</span>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: C.textMuted }}>Target: {challenge.target_count} · {challenge.reward_points} pts · {challenge.expiry_days}d</span>
      </div>

      {/* Admin actions */}
      {IS_ADMIN && (
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button onClick={() => onEdit(challenge)} style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${C.outline}`, background: C.surfaceLow, fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 11, color: C.primary, cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.background = C.surfaceHigh}
            onMouseLeave={e => e.currentTarget.style.background = C.surfaceLow}
          >✏️ Edit</button>
          {!confirmDelete
            ? <button onClick={() => setConfirmDelete(true)} style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${C.error}44`, background: "#fff5f5", fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 11, color: C.error, cursor: "pointer" }}>🗑</button>
            : <button onClick={() => { onDelete(challenge.id); setConfirmDelete(false); }} style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: C.error, fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 11, color: "#fff", cursor: "pointer" }}>Sure?</button>
          }
        </div>
      )}
    </div>
  );
}

function Navbar({ onBellClick, unreadCount }) {
  return (
    <header style={{ position: "fixed", top: 0, left: 0, right: 0, height: 64, background: C.navBg, display: "flex", alignItems: "center", padding: "0 32px", gap: 40, zIndex: 100, borderBottom: `1px solid ${C.navBorder}` }}>
      <div style={{ display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <span style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 17, color: C.textOnDark, letterSpacing: "-0.02em", textTransform: "uppercase", lineHeight: 1 }}>Nexus Pro</span>
        <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 9, color: C.teal, letterSpacing: "0.2em", textTransform: "uppercase" }}>Professional</span>
      </div>
      <nav style={{ display: "flex", gap: 32 }}>
        {["Overview", "Leaderboard", "Achievements", "Insights"].map((item, i) => (
        <a key={item} href="#" onClick={e => {
          e.preventDefault();
          if (item === "Leaderboard")  window.__navigate("leaderboard");
          if (item === "Achievements") window.__navigate("achievements");
        }} style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: item === "Achievements" ? C.textOnDark : C.navMuted,
textDecoration: "none",
borderBottom: item === "Achievements" ? `2px solid ${C.teal}` : "none",
paddingBottom: 2, }}>{item}</a>
        ))}
      </nav>
      <div style={{ flex: 1, maxWidth: 380 }}>
        <div style={{ position: "relative" }}>
          <input placeholder="Search insights and assets..." style={{ width: "100%", background: "rgba(255,255,255,0.08)", color: C.textOnDark, fontSize: 13, padding: "7px 14px 7px 36px", borderRadius: 8, border: `1px solid ${C.navBorder}`, outline: "none", fontFamily: "'Inter', sans-serif" }} />
          <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)", fontSize: 14 }}>🔍</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
        <button onClick={onBellClick} style={{ width: 36, height: 36, borderRadius: "50%", background: "none", border: "none", color: C.navMuted, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          🔔{unreadCount > 0 && <span style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, background: C.error, borderRadius: "50%" }} />}
        </button>
        <button style={{ width: 36, height: 36, borderRadius: "50%", background: "none", border: "none", color: C.navMuted, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>❓</button>
        <div style={{ width: 1, height: 32, background: C.navBorder, margin: "0 8px" }} />
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 10, color: C.textOnDark, textTransform: "uppercase", letterSpacing: "0.08em" }}>A. Sterling</div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: 9, color: C.teal, textTransform: "uppercase" }}>Enterprise Admin</div>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(255,255,255,0.1)", border: `1px solid ${C.navBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, cursor: "pointer" }}>👤</div>
      </div>
    </header>
  );
}

function Sidebar() {
  const items = [{ icon: "⊞", label: "Overview" }, { icon: "📁", label: "Portfolio" }, { icon: "⬡", label: "Network" }, { icon: "📈", label: "Analytics" }, { icon: "📄", label: "Documents" }];
  return (
    <aside style={{ position: "fixed", left: 0, top: 64, width: 224, height: "calc(100vh - 64px)", background: `linear-gradient(180deg, ${C.sidebarBg} 0%, ${C.sidebarGrad} 100%)`, display: "flex", flexDirection: "column", padding: 16, zIndex: 40, borderRight: `1px solid ${C.sidebarBorder}` }}>
      <div style={{ padding: "0 12px", marginBottom: 16 }}>
        <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: C.sidebarLabel }}>Navigation</span>
      </div>
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {items.map((item) => {
          const active = item.label === "Overview";
          return (
            <a key={item.label} href="#" style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 8, textDecoration: "none", background: active ? C.sidebarActiveBg : "transparent", color: active ? C.sidebarActiveText : C.sidebarText, fontFamily: "'Inter', sans-serif", fontWeight: active ? 700 : 600, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", transition: "all 0.15s", boxShadow: active ? "0 1px 4px rgba(0,23,54,0.1)" : "none" }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = C.sidebarHoverBg; e.currentTarget.style.color = C.primary; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.sidebarText; } }}
            ><span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{item.icon}</span>{item.label}</a>
          );
        })}
      </nav>
      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
        <button style={{ width: "100%", padding: "12px 0", background: C.primary, color: C.textOnDark, border: "none", borderRadius: 8, fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>Create Project</button>
        <div style={{ height: 1, background: C.sidebarBorder, margin: "6px 0" }} />
        {[{ icon: "⚙", label: "Settings" }, { icon: "❓", label: "Support" }].map(item => (
          <a key={item.label} href="#" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, color: C.sidebarText, textDecoration: "none", fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", transition: "color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.color = C.primary} onMouseLeave={e => e.currentTarget.style.color = C.sidebarText}
          ><span style={{ fontSize: 15 }}>{item.icon}</span> {item.label}</a>
        ))}
      </div>
    </aside>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export default function AchievementsPage() {
  // ── Tab ───────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("badges"); // badges | levels | challenges

  // ── Shared ───────────────────────────────────────────────
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [toast,     setToast]     = useState(null);
  const [adminView, setAdminView] = useState(false);

  // ── Badges state ──────────────────────────────────────────
  const [allBadges,    setAllBadges]    = useState([]);
  const [badgePage,    setBadgePage]    = useState(1);
  const [showAddBadge, setShowAddBadge] = useState(false);
  const [editBadge,    setEditBadge]    = useState(null);
  const [addBadgeForm, setAddBadgeForm] = useState({ badge_code: "", name: "", description: "", category: "milestone", points_awarded: "50" });
  const [editBadgeForm,setEditBadgeForm]= useState({ description: "", points_awarded: "", is_active: true });

  // ── Levels state ──────────────────────────────────────────
  const [levels,     setLevels]     = useState([]);
  const [editLevel,  setEditLevel]  = useState(null);
  const [editLevelForm, setEditLevelForm] = useState({ min_points: "", max_points: "", title: "" });

  // ── Challenges state ──────────────────────────────────────
  const [challenges,      setChallenges]      = useState([]);
  const [challengePage,   setChallengePage]   = useState(1);
  const [filterType,      setFilterType]      = useState("all");
  const [showAddChallenge,setShowAddChallenge]= useState(false);
  const [editChallenge,   setEditChallenge]   = useState(null);
  const [addChallengeForm,setAddChallengeForm]= useState({ challenge_code: "", title: "", description: "", target_count: "1", reward_points: "50", expiry_days: "7", challenge_type: "daily", action_required: "" });
  const [editChallengeForm,setEditChallengeForm]=useState({ title: "", description: "", target_count: "", reward_points: "", expiry_days: "", is_active: true });

  const badgesPerPage     = adminView ? 3 : 4;
  const challengesPerPage = 8;

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  // ── Fetch functions ───────────────────────────────────────
  const fetchBadges = async () => {
    setLoading(true); setError(null);
    try {
      const d = await apiFetch(`${API_BASE}/api/gamification/admin/badges`);
      setAllBadges(d.data || []);
    } catch (err) { setError(`Badges: ${err.message}`); }
    finally { setLoading(false); }
  };

  const fetchLevels = async () => {
    setLoading(true); setError(null);
    try {
      const d = await apiFetch(`${API_BASE}/api/gamification/admin/level-thresholds`);
      setLevels(d.data || []);
    } catch (err) { setError(`Levels: ${err.message}`); }
    finally { setLoading(false); }
  };

  const fetchChallenges = async () => {
    setLoading(true); setError(null);
    try {
      const d = await apiFetch(`${API_BASE}/api/gamification/admin/challenges`);
      setChallenges(d.data || []);
    } catch (err) { setError(`Challenges: ${err.message}`); }
    finally { setLoading(false); }
  };

  const fetchAll = () => { fetchBadges(); fetchLevels(); fetchChallenges(); };

  useEffect(() => { fetchAll(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Badge handlers ────────────────────────────────────────
  const handleAddBadge = async () => {
    if (!addBadgeForm.badge_code || !addBadgeForm.name) return showToast("Badge code and name required", "error");
    try {
      await apiFetch(`${API_BASE}/api/gamification/admin/badges`, { method: "POST", body: JSON.stringify({ ...addBadgeForm, points_awarded: parseInt(addBadgeForm.points_awarded) || 0 }) });
      setShowAddBadge(false);
      setAddBadgeForm({ badge_code: "", name: "", description: "", category: "milestone", points_awarded: "50" });
      await fetchBadges();
      showToast("Badge added!");
    } catch (err) { showToast(err.message, "error"); }
  };

  const handleEditBadge = async () => {
    try {
      await apiFetch(`${API_BASE}/api/gamification/admin/badges/${editBadge.badge_code}`, { method: "PATCH", body: JSON.stringify({ description: editBadgeForm.description, points_awarded: parseInt(editBadgeForm.points_awarded), is_active: editBadgeForm.is_active }) });
      setEditBadge(null); await fetchBadges(); showToast("Badge updated!");
    } catch (err) { showToast(err.message, "error"); }
  };

  const handleDeleteBadge = async (code) => {
    try {
      await apiFetch(`${API_BASE}/api/gamification/admin/badges/${code}`, { method: "DELETE" });
      await fetchBadges(); showToast("Badge deleted.");
    } catch (err) { showToast(err.message, "error"); }
  };

  const openEditBadge = (b) => { setEditBadge(b); setEditBadgeForm({ description: b.description || "", points_awarded: String(b.points_awarded || 0), is_active: b.is_active }); };

  // ── Level handlers ────────────────────────────────────────
  const handleEditLevel = async () => {
    try {
      await apiFetch(`${API_BASE}/api/gamification/admin/level-thresholds`, { method: "PUT",body: JSON.stringify({ level_number: editLevel.level_number, min_points: parseInt(editLevelForm.min_points), max_points: editLevelForm.max_points ? parseInt(editLevelForm.max_points) : null, title: editLevelForm.title }) });
      setEditLevel(null); await fetchLevels(); showToast("Level updated!");
    } catch (err) { showToast(err.message, "error"); }
  };

  const openEditLevel = (l) => { setEditLevel(l); setEditLevelForm({ min_points: String(l.min_points), max_points: String(l.max_points || ""), title: l.title || "" }); };

  // ── Challenge handlers ────────────────────────────────────
  const handleAddChallenge = async () => {
    if (!addChallengeForm.challenge_code || !addChallengeForm.title) return showToast("Code and title required", "error");
    try {
      await apiFetch(`${API_BASE}/api/gamification/admin/challenges`, { method: "POST", body: JSON.stringify({ ...addChallengeForm, target_count: parseInt(addChallengeForm.target_count), reward_points: parseInt(addChallengeForm.reward_points), expiry_days: parseInt(addChallengeForm.expiry_days) }) });
      setShowAddChallenge(false);
      setAddChallengeForm({ challenge_code: "", title: "", description: "", target_count: "1", reward_points: "50", expiry_days: "7", challenge_type: "daily", action_required: "" });
      await fetchChallenges(); showToast("Challenge added!");
    } catch (err) { showToast(err.message, "error"); }
  };

  const handleEditChallenge = async () => {
    try {
      await apiFetch(`${API_BASE}/api/gamification/admin/challenges/${editChallenge.id}`, { method: "PUT", body: JSON.stringify({ title: editChallengeForm.title, description: editChallengeForm.description, target_count: parseInt(editChallengeForm.target_count), reward_points: parseInt(editChallengeForm.reward_points), expiry_days: parseInt(editChallengeForm.expiry_days), is_active: editChallengeForm.is_active }) });
      setEditChallenge(null); await fetchChallenges(); showToast("Challenge updated!");
    } catch (err) { showToast(err.message, "error"); }
  };

  const handleDeleteChallenge = async (id) => {
    try {
      await apiFetch(`${API_BASE}/api/gamification/admin/challenges/${id}`, { method: "DELETE" });
      await fetchChallenges(); showToast("Challenge deleted.");
    } catch (err) { showToast(err.message, "error"); }
  };

  const openEditChallenge = (c) => { setEditChallenge(c); setEditChallengeForm({ title: c.title, description: c.description || "", target_count: String(c.target_count), reward_points: String(c.reward_points), expiry_days: String(c.expiry_days), is_active: c.is_active }); };

  // ── Badge pagination ──────────────────────────────────────
  const displayBadges   = adminView ? allBadges : allBadges.filter(b => b.is_active);
  const totalBadgePages = Math.max(1, Math.ceil(displayBadges.length / badgesPerPage));
  const visibleBadges   = displayBadges.slice((badgePage - 1) * badgesPerPage, badgePage * badgesPerPage);

  // ── Challenge filtering + pagination ──────────────────────
  const filteredChallenges = filterType === "all" ? challenges : challenges.filter(c => c.challenge_type === filterType);
  const totalChallengePages = Math.max(1, Math.ceil(filteredChallenges.length / challengesPerPage));
  const visibleChallenges   = filteredChallenges.slice((challengePage - 1) * challengesPerPage, challengePage * challengesPerPage);

  const TABS = [
    { key: "badges",     label: "🏅 Badges",     count: allBadges.filter(b => b.is_active).length },
    { key: "levels",     label: "📈 Levels",     count: levels.length },
    { key: "challenges", label: "🎯 Challenges", count: challenges.filter(c => c.is_active).length },
  ];

  const CHALLENGE_TYPE_OPTIONS = [
    { value: "daily",      label: "Daily" },
    { value: "weekly",     label: "Weekly" },
    { value: "monthly",    label: "Monthly" },
    { value: "onboarding", label: "Onboarding" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;700;800&family=Inter:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.pageBg}; font-family: 'Inter', sans-serif; }
        a { text-decoration: none; } button { cursor: pointer; } input:focus, textarea:focus, select:focus { outline: none; }
        @keyframes fadeUp    { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn    { from { opacity:0; } to { opacity:1; } }
        @keyframes spin      { to { transform: rotate(360deg); } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
        ::-webkit-scrollbar { height: 4px; width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${C.outline}; border-radius: 3px; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 80, right: 24, zIndex: 9999, background: toast.type === "error" ? C.error : C.success, color: "#fff", padding: "12px 20px", borderRadius: 10, fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 14, boxShadow: "0 4px 16px rgba(0,0,0,0.18)", animation: "slideDown 0.3s ease" }}>
          {toast.type === "error" ? "⚠ " : "✓ "}{toast.msg}
        </div>
      )}

      {/* ── BADGE MODALS ── */}
      {showAddBadge && (
        <Modal title="Add New Badge" onClose={() => setShowAddBadge(false)}>
          <Field label="Badge Code *" value={addBadgeForm.badge_code} onChange={v => setAddBadgeForm(f => ({ ...f, badge_code: v.toUpperCase() }))} placeholder="e.g. SPEED_DEMON" hint="Unique uppercase identifier — cannot change later" />
          <Field label="Name *" value={addBadgeForm.name} onChange={v => setAddBadgeForm(f => ({ ...f, name: v }))} placeholder="e.g. Speed Demon" />
          <Field label="Description" value={addBadgeForm.description} onChange={v => setAddBadgeForm(f => ({ ...f, description: v }))} type="textarea" placeholder="What does this badge reward?" />
          <Field label="Category" value={addBadgeForm.category} onChange={v => setAddBadgeForm(f => ({ ...f, category: v }))} placeholder="milestone / activity / points / reputation / challenges" />
          <Field label="Points Awarded" value={addBadgeForm.points_awarded} onChange={v => setAddBadgeForm(f => ({ ...f, points_awarded: v }))} type="number" />
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button onClick={() => setShowAddBadge(false)} style={{ flex: 1, padding: "12px 0", borderRadius: 8, border: `1px solid ${C.outline}`, background: C.surfaceLow, fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 14, color: C.textPrimary }}>Cancel</button>
            <button onClick={handleAddBadge} style={{ flex: 2, padding: "12px 0", borderRadius: 8, border: "none", background: C.primary, fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 14, color: "#fff" }}>Add Badge</button>
          </div>
        </Modal>
      )}
      {editBadge && (
        <Modal title={`Edit Badge — ${editBadge.name}`} onClose={() => setEditBadge(null)}>
          <Field label="Badge Code" value={editBadge.badge_code} onChange={() => {}} disabled hint="Cannot be changed" />
          <Field label="Description" value={editBadgeForm.description} onChange={v => setEditBadgeForm(f => ({ ...f, description: v }))} type="textarea" />
          <Field label="Points Awarded" value={editBadgeForm.points_awarded} onChange={v => setEditBadgeForm(f => ({ ...f, points_awarded: v }))} type="number" />
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <input type="checkbox" id="badge_active" checked={editBadgeForm.is_active} onChange={e => setEditBadgeForm(f => ({ ...f, is_active: e.target.checked }))} style={{ width: 16, height: 16, cursor: "pointer" }} />
            <label htmlFor="badge_active" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 14, color: C.textPrimary, cursor: "pointer" }}>Badge is Active</label>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => setEditBadge(null)} style={{ flex: 1, padding: "12px 0", borderRadius: 8, border: `1px solid ${C.outline}`, background: C.surfaceLow, fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 14, color: C.textPrimary }}>Cancel</button>
            <button onClick={handleEditBadge} style={{ flex: 2, padding: "12px 0", borderRadius: 8, border: "none", background: C.primary, fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 14, color: "#fff" }}>Save Changes</button>
          </div>
        </Modal>
      )}

      {/* ── LEVEL MODAL ── */}
      {editLevel && (
        <Modal title={`Edit Level ${editLevel.level_number}`} onClose={() => setEditLevel(null)}>
          <Field label="Level Number" value={String(editLevel.level_number)} onChange={() => {}} disabled hint="Cannot be changed" />
          <Field label="Title" value={editLevelForm.title} onChange={v => setEditLevelForm(f => ({ ...f, title: v }))} placeholder="e.g. Intermediate" />
          <Field label="Minimum XP Required" value={editLevelForm.min_points} onChange={v => setEditLevelForm(f => ({ ...f, min_points: v }))} type="number" hint="Level 1 must remain 0" />
          <Field label="Maximum XP (optional)" value={editLevelForm.max_points} onChange={v => setEditLevelForm(f => ({ ...f, max_points: v }))} type="number" hint="Leave empty for no upper limit (last level)" />
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button onClick={() => setEditLevel(null)} style={{ flex: 1, padding: "12px 0", borderRadius: 8, border: `1px solid ${C.outline}`, background: C.surfaceLow, fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 14, color: C.textPrimary }}>Cancel</button>
            <button onClick={handleEditLevel} style={{ flex: 2, padding: "12px 0", borderRadius: 8, border: "none", background: C.primary, fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 14, color: "#fff" }}>Save Changes</button>
          </div>
        </Modal>
      )}

      {/* ── CHALLENGE MODALS ── */}
      {showAddChallenge && (
        <Modal title="Add New Challenge" onClose={() => setShowAddChallenge(false)}>
          <Field label="Challenge Code *" value={addChallengeForm.challenge_code} onChange={v => setAddChallengeForm(f => ({ ...f, challenge_code: v.toUpperCase() }))} placeholder="e.g. DAILY_06" hint="Unique uppercase identifier" />
          <Field label="Title *" value={addChallengeForm.title} onChange={v => setAddChallengeForm(f => ({ ...f, title: v }))} placeholder="e.g. Send 3 messages" />
          <Field label="Description" value={addChallengeForm.description} onChange={v => setAddChallengeForm(f => ({ ...f, description: v }))} type="textarea" placeholder="What does the user need to do?" />
          <Field label="Challenge Type" value={addChallengeForm.challenge_type} onChange={v => setAddChallengeForm(f => ({ ...f, challenge_type: v }))} options={CHALLENGE_TYPE_OPTIONS} />
          <Field label="Action Required" value={addChallengeForm.action_required} onChange={v => setAddChallengeForm(f => ({ ...f, action_required: v }))} placeholder="e.g. message_sent" hint="Backend action type that triggers progress" />
          <Field label="Target Count" value={addChallengeForm.target_count} onChange={v => setAddChallengeForm(f => ({ ...f, target_count: v }))} type="number" />
          <Field label="Reward Points" value={addChallengeForm.reward_points} onChange={v => setAddChallengeForm(f => ({ ...f, reward_points: v }))} type="number" />
          <Field label="Expiry Days" value={addChallengeForm.expiry_days} onChange={v => setAddChallengeForm(f => ({ ...f, expiry_days: v }))} type="number" hint="1 = daily, 7 = weekly, 30 = monthly" />
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button onClick={() => setShowAddChallenge(false)} style={{ flex: 1, padding: "12px 0", borderRadius: 8, border: `1px solid ${C.outline}`, background: C.surfaceLow, fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 14, color: C.textPrimary }}>Cancel</button>
            <button onClick={handleAddChallenge} style={{ flex: 2, padding: "12px 0", borderRadius: 8, border: "none", background: C.primary, fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 14, color: "#fff" }}>Add Challenge</button>
          </div>
        </Modal>
      )}
      {editChallenge && (
        <Modal title={`Edit Challenge — ${editChallenge.title}`} onClose={() => setEditChallenge(null)}>
          <Field label="Challenge Code" value={editChallenge.challenge_code} onChange={() => {}} disabled hint="Cannot be changed" />
          <Field label="Title" value={editChallengeForm.title} onChange={v => setEditChallengeForm(f => ({ ...f, title: v }))} />
          <Field label="Description" value={editChallengeForm.description} onChange={v => setEditChallengeForm(f => ({ ...f, description: v }))} type="textarea" />
          <Field label="Target Count" value={editChallengeForm.target_count} onChange={v => setEditChallengeForm(f => ({ ...f, target_count: v }))} type="number" />
          <Field label="Reward Points" value={editChallengeForm.reward_points} onChange={v => setEditChallengeForm(f => ({ ...f, reward_points: v }))} type="number" />
          <Field label="Expiry Days" value={editChallengeForm.expiry_days} onChange={v => setEditChallengeForm(f => ({ ...f, expiry_days: v }))} type="number" />
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <input type="checkbox" id="ch_active" checked={editChallengeForm.is_active} onChange={e => setEditChallengeForm(f => ({ ...f, is_active: e.target.checked }))} style={{ width: 16, height: 16, cursor: "pointer" }} />
            <label htmlFor="ch_active" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 14, color: C.textPrimary, cursor: "pointer" }}>Challenge is Active</label>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => setEditChallenge(null)} style={{ flex: 1, padding: "12px 0", borderRadius: 8, border: `1px solid ${C.outline}`, background: C.surfaceLow, fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 14, color: C.textPrimary }}>Cancel</button>
            <button onClick={handleEditChallenge} style={{ flex: 2, padding: "12px 0", borderRadius: 8, border: "none", background: C.primary, fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 14, color: "#fff" }}>Save Changes</button>
          </div>
        </Modal>
      )}

      <div style={{ minHeight: "100vh", background: C.pageBg }}>
        <Navbar unreadCount={0} onBellClick={() => { }} />
        <Sidebar />

        <main style={{ marginLeft: 224, paddingTop: 64, minHeight: "100vh" }}>
          <div style={{ padding: "24px 32px", maxWidth: 1380 }}>
            <div style={{ border: `1px solid ${C.frameBorder}`, borderRadius: 20, padding: "24px 28px", background: C.surfaceCard, animation: "fadeUp 0.35s ease both", minHeight: 850 }}>

              {/* ── Page Header ── */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h1 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 32, color: "#121417" }}>Achievements</h1>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {/* Refresh */}
                  <button onClick={fetchAll} disabled={loading} title="Refresh all" style={{ width: 40, height: 40, borderRadius: 8, background: C.surfaceLow, border: `1px solid ${C.outline}`, color: C.textMuted, fontSize: 16, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {loading ? <div style={{ width: 14, height: 14, border: `2px solid ${C.outline}`, borderTopColor: C.obsidian, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> : "↻"}
                  </button>

                  {/* Admin toggle — only for badges tab */}
                  {IS_ADMIN && activeTab === "badges" && (
                    <button onClick={() => { setAdminView(p => !p); setBadgePage(1); }} style={{ height: 40, padding: "0 20px", borderRadius: 8, border: `1px solid ${adminView ? C.primary : C.outline}`, background: adminView ? C.primary : C.surfaceLow, fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 13, color: adminView ? "#fff" : C.textPrimary, cursor: "pointer", transition: "all 0.15s" }}>
                      {adminView ? "👁 View Mode" : "⚙ Manage Badges"}
                    </button>
                  )}

                  {/* Add buttons */}
                  {IS_ADMIN && activeTab === "badges" && adminView && (
                    <button onClick={() => setShowAddBadge(true)} style={{ height: 40, padding: "0 20px", borderRadius: 8, border: "none", background: C.tealOnLight, fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 13, color: "#fff", cursor: "pointer" }}>+ Add Badge</button>
                  )}
                  {IS_ADMIN && activeTab === "challenges" && (
                    <button onClick={() => setShowAddChallenge(true)} style={{ height: 40, padding: "0 20px", borderRadius: 8, border: "none", background: C.tealOnLight, fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 13, color: "#fff", cursor: "pointer" }}>+ Add Challenge</button>
                  )}
                </div>
              </div>

              {/* Error */}
              {error && !loading && (
                <div style={{ padding: "12px 16px", background: "#fff5f5", border: `1px solid ${C.error}33`, borderRadius: 8, color: C.error, fontFamily: "'Inter', sans-serif", fontSize: 13, marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                  <span>⚠ {error}</span>
                  <button onClick={fetchBadges} style={{ marginLeft: "auto", background: C.error, color: "#fff", border: "none", borderRadius: 6, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Retry</button>
                </div>
              )}

              {/* ── TABS ── */}
              <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: `2px solid ${C.outline}33`, paddingBottom: 0 }}>
                {TABS.map(tab => (
                  <button key={tab.key} onClick={() => { setActiveTab(tab.key); setAdminView(false); }} style={{
                    padding: "10px 20px", borderRadius: "8px 8px 0 0",
                    border: "none",
                    borderBottom: activeTab === tab.key ? `2px solid ${C.primary}` : "2px solid transparent",
                    background: activeTab === tab.key ? C.surfaceHigh : "transparent",
                    fontFamily: "'Inter', sans-serif", fontWeight: activeTab === tab.key ? 700 : 500,
                    fontSize: 14, color: activeTab === tab.key ? C.primary : C.textMuted,
                    cursor: "pointer", transition: "all 0.15s",
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    {tab.label}
                    <span style={{ background: activeTab === tab.key ? C.primary : C.outline, color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 9999 }}>{tab.count}</span>
                  </button>
                ))}
              </div>

              {/* ══ BADGES TAB ══ */}
              {activeTab === "badges" && (
                <div style={{ animation: "fadeIn 0.2s ease" }}>
                  {adminView && (
                    <div style={{ padding: "10px 16px", background: "#e8f4fd", border: "1px solid #90caf9", borderRadius: 8, marginBottom: 16, fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#0d47a1" }}>
                      ⚙ <strong>Admin Mode</strong> — Add, edit, or deactivate badge definitions.
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: C.textMuted }}>
                      {adminView ? `${allBadges.length} total · ${allBadges.filter(b => !b.is_active).length} inactive` : `${allBadges.filter(b => b.is_active).length} active badges`}
                    </span>
                    <Pagination current={badgePage} total={totalBadgePages} onChange={setBadgePage} />
                  </div>
                  {loading && <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "40px 0", color: C.textMuted, fontFamily: "'Inter', sans-serif", fontSize: 14 }}><div style={{ width: 20, height: 20, border: `3px solid ${C.surfaceContainer}`, borderTopColor: C.obsidian, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Loading badges...</div>}
                  <div style={{ display: "flex", gap: 24, flexWrap: "nowrap", overflowX: "auto", paddingBottom: 8, minHeight: 360, alignItems: "flex-start" }}>
                    {!loading && visibleBadges.length === 0
                      ? <div style={{ padding: "40px 0", color: C.textMuted, fontFamily: "'Inter', sans-serif", fontSize: 14 }}>No badges found.</div>
                      : !loading && visibleBadges.map(badge =>
                          adminView
                            ? <BadgeManageCard key={badge.badge_code} badge={badge} onEdit={openEditBadge} onDelete={handleDeleteBadge} />
                            : <BadgeCard key={badge.badge_code} badge={badge} />
                        )
                    }
                  </div>
                </div>
              )}

              {/* ══ LEVELS TAB ══ */}
              {activeTab === "levels" && (
                <div style={{ animation: "fadeIn 0.2s ease" }}>
                  {IS_ADMIN && (
                    <div style={{ padding: "10px 16px", background: "#e8f4fd", border: "1px solid #90caf9", borderRadius: 8, marginBottom: 16, fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#0d47a1" }}>
                      ⚙ <strong>Admin</strong> — Click ✏️ Edit on any level to update its XP threshold or title.
                    </div>
                  )}
                  {loading && <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "40px 0", color: C.textMuted, fontFamily: "'Inter', sans-serif", fontSize: 14 }}><div style={{ width: 20, height: 20, border: `3px solid ${C.surfaceContainer}`, borderTopColor: C.obsidian, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Loading levels...</div>}
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {!loading && levels.length === 0 && (
                      <div style={{ padding: "40px 0", color: C.textMuted, fontFamily: "'Inter', sans-serif", fontSize: 14 }}>No levels found. Make sure level definitions are seeded.</div>
                    )}
                    {!loading && levels.map(level => (
                      <div key={level.level_number} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ flex: 1 }}><LevelRow level={level} /></div>
                        {IS_ADMIN && (
                          <button onClick={() => openEditLevel(level)} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${C.outline}`, background: C.surfaceLow, fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 12, color: C.primary, cursor: "pointer", flexShrink: 0 }}
                            onMouseEnter={e => e.currentTarget.style.background = C.surfaceHigh}
                            onMouseLeave={e => e.currentTarget.style.background = C.surfaceLow}
                          >✏️ Edit</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ══ CHALLENGES TAB ══ */}
              {activeTab === "challenges" && (
                <div style={{ animation: "fadeIn 0.2s ease" }}>
                  {/* Filter bar */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      {["all", "daily", "weekly", "monthly", "onboarding"].map(type => {
                        const cs = getChallengeStyle(type);
                        return (
                          <button key={type} onClick={() => { setFilterType(type); setChallengePage(1); }} style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${filterType === type ? C.primary : C.outline}`, background: filterType === type ? C.primary : "transparent", fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 12, color: filterType === type ? "#fff" : C.textMuted, cursor: "pointer", textTransform: "capitalize", transition: "all 0.15s" }}>
                            {type === "all" ? "All" : `${cs.icon} ${type.charAt(0).toUpperCase() + type.slice(1)}`}
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: C.textMuted }}>{filteredChallenges.length} challenges</span>
                      <Pagination current={challengePage} total={totalChallengePages} onChange={setChallengePage} />
                    </div>
                  </div>

                  {loading && <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "40px 0", color: C.textMuted, fontFamily: "'Inter', sans-serif", fontSize: 14 }}><div style={{ width: 20, height: 20, border: `3px solid ${C.surfaceContainer}`, borderTopColor: C.obsidian, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Loading challenges...</div>}

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {!loading && visibleChallenges.length === 0
                      ? <div style={{ padding: "40px 0", color: C.textMuted, fontFamily: "'Inter', sans-serif", fontSize: 14 }}>No challenges found for this filter.</div>
                      : !loading && visibleChallenges.map(ch => (
                          <ChallengeRow key={ch.id} challenge={ch} onEdit={openEditChallenge} onDelete={handleDeleteChallenge} />
                        ))
                    }
                  </div>
                </div>
              )}

            </div>
          </div>
        </main>
      </div>
    </>
  );
}