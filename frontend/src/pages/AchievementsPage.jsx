import { useState, useEffect, useCallback, useRef } from "react";

// =============================================================
// AchievementsPage.jsx — Page 9
// Matches Group#11_Page9 CSS exactly:
//
// Layout:
//   • Same Nexus navbar as LeaderboardPage
//   • Same white sidebar with soft tonal blue
//   • Frame 99: large bordered rounded container (1325×850px)
//     ├─ Header: "Achievements" title + "My Achievements" button
//     ├─ Top section: "Levels" — horizontal scrollable cards
//     │    4 level cards (Frame 3/5/6/7): icon box + text
//     │    Pagination dots (Group 30)
//     ├─ Line 11: horizontal divider
//     └─ Bottom section: "Badges" — horizontal scrollable cards
//          5 badge cards (Building Blocks/Content):
//          grey media area + title + subhead + "Enabled" button
//          Pagination controls (prev/1/2/3/4/next)
//
// Data: fetched from backend
//   GET /api/user/:userId/level      → current level info
//   GET /api/user/:userId/badges     → earned badges
//   Levels list is static (3 levels defined in SRS)
//   Badges come from gamification_badges + gamification_user_badges
// =============================================================

const API_BASE   = "";
const CURRENT_USER_ID = "u001";

// ── Nexus light theme colors (matching LeaderboardPage) ───────
const C = {
  navBg:            "#001736",
  navText:          "#ffffff",
  navMuted:         "rgba(255,255,255,0.55)",
  navBorder:        "rgba(255,255,255,0.08)",
  navHover:         "rgba(255,255,255,0.07)",
  sidebarBg:        "#f0f3ff",
  sidebarGrad:      "#f9f9ff",
  sidebarBorder:    "#e4e8f0",
  sidebarText:      "#515f74",
  sidebarActiveText:"#001736",
  sidebarActiveBg:  "#ffffff",
  sidebarHoverBg:   "#dee8ff",
  sidebarLabel:     "#747780",
  pageBg:           "#f9f9ff",
  surfaceCard:      "#ffffff",
  surfaceContainer: "#e7eeff",
  surfaceHigh:      "#dee8ff",
  surfaceLow:       "#f0f3ff",
  primary:          "#001736",
  primaryContainer: "#002b5b",
  obsidian:         "#001b18",
  teal:             "#89f5e7",
  tealOnLight:      "#007a6e",
  textPrimary:      "#111c2d",   // #121417 in CSS
  textSecondary:    "#43474f",
  textMuted:        "#747780",
  textOnDark:       "#ffffff",
  textOnTeal:       "#001b18",
  cardBorder:       "rgba(0,0,0,0.2)",  // rgba(0,0,0,0.2) from CSS
  outline:          "#c4c6d0",
  error:            "#ba1a1a",
  // Page 9 specific
  frameBorder:      "#c4c6d0",          // Frame 99 border — softened to Nexus outline
  levelIconBg:      "#e7eeff",               // Nexus surface-container
  mediaBg:          "#f0f3ff",          // Nexus soft tonal blue
  myAchievBg:       "#dee8ff",          // Nexus surface-high
  dotInactive:      "#AEA9A9",          // Ellipse 6/7/8
  paginationActive: "#00132E",          // Active page bg
  paginationBorder: "#DEE2E6",
  paginationText:   "#00132E",
};

// ── Static level definitions (SRS 4.2, 3 levels) ─────────────
const LEVEL_DEFS = [
  { level: 1, title: "Beginner",     xp_required: 0,    icon: "🌱", color: "#007a6e", desc: "Starting your journey on the platform" },
  { level: 2, title: "Intermediate", xp_required: 1000, icon: "⚡", color: "#001736", desc: "Building momentum and gaining experience" },
  { level: 3, title: "Advanced",     xp_required: 2500, icon: "🏆", color: "#001b18", desc: "Master achiever — top of the platform" },
];

// ── Static badge definitions (SRS 4.3, 5 badges) ─────────────
const BADGE_DEFS = [
  { badge_code: "first_project",        name: "First Project",        icon: "🎯", color: "#1565c0", grad: ["#1976d2","#42a5f5"], desc: "Completed your first project on the platform" },
  { badge_code: "rising_star",          name: "Rising Star",          icon: "⭐", color: "#e65100", grad: ["#f57c00","#ffca28"], desc: "Reached Level 2 and earned 500+ points" },
  { badge_code: "consistent_performer", name: "Consistent Performer", icon: "🔥", color: "#b71c1c", grad: ["#e53935","#ff7043"], desc: "Maintained a 7-day activity streak" },
  { badge_code: "top_rated",            name: "Top Rated",            icon: "💎", color: "#4a148c", grad: ["#7b1fa2","#ce93d8"], desc: "Received an average rating of 4.5 or above" },
  { badge_code: "challenge_master",     name: "Challenge Master",     icon: "🏅", color: "#004d40", grad: ["#00796b","#80cbc4"], desc: "Completed 10 challenges" },
];


// ── SVG Badge Logos — vibrant, colourful designs ──────────────
const BadgeLogo = {

  // First Project — Blue shield with golden star & teal checkmark
  first_project: ({ size = 80, earned }) => (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <defs>
        <linearGradient id="fp_shield" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={earned ? "#1976d2" : "#c4c6d0"} />
          <stop offset="100%" stopColor={earned ? "#0d47a1" : "#dee8ff"} />
        </linearGradient>
        <linearGradient id="fp_inner" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={earned ? "#42a5f5" : "#e7eeff"} />
          <stop offset="100%" stopColor={earned ? "#1565c0" : "#f0f3ff"} />
        </linearGradient>
      </defs>
      {/* Shield outer */}
      <path d="M40 5 L70 18 L70 43 C70 59 56 70 40 76 C24 70 10 59 10 43 L10 18 Z"
        fill="url(#fp_shield)" />
      {/* Shield inner */}
      <path d="M40 12 L63 23 L63 43 C63 55 53 64 40 69 C27 64 17 55 17 43 L17 23 Z"
        fill="url(#fp_inner)" />
      {/* Golden star top */}
      <path d="M40 18 L42 24 L49 24 L43.5 28 L45.5 34 L40 30 L34.5 34 L36.5 28 L31 24 L38 24 Z"
        fill={earned ? "#ffd54f" : "#c4c6d0"} />
      {/* Teal checkmark */}
      <path d="M27 43 L35 52 L55 30"
        stroke={earned ? "#80deea" : "#9e9e9e"}
        strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Shine */}
      {earned && <ellipse cx="27" cy="30" rx="5" ry="8" fill="white" opacity="0.12" transform="rotate(-30 27 30)" />}
    </svg>
  ),

  // Rising Star — orange/yellow gradient star with sparkles
  rising_star: ({ size = 80, earned }) => (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <defs>
        <linearGradient id="rs_star" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={earned ? "#ffca28" : "#dee8ff"} />
          <stop offset="100%" stopColor={earned ? "#f57c00" : "#c4c6d0"} />
        </linearGradient>
        <radialGradient id="rs_glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={earned ? "#fff176" : "#ffffff"} stopOpacity="0.6" />
          <stop offset="100%" stopColor={earned ? "#ff8f00" : "#c4c6d0"} stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Glow bg */}
      {earned && <circle cx="40" cy="36" r="28" fill="url(#rs_glow)" />}
      {/* Main star */}
      <path d="M40 7 L46 26 L67 26 L51 38 L57 57 L40 46 L23 57 L29 38 L13 26 L34 26 Z"
        fill="url(#rs_star)"
        stroke={earned ? "#e65100" : "#c4c6d0"} strokeWidth="1" />
      {/* Inner highlight */}
      <path d="M40 17 L44 29 L57 29 L47 37 L51 49 L40 42 L29 49 L33 37 L23 29 L36 29 Z"
        fill={earned ? "#fff9c4" : "#f0f3ff"} opacity="0.45" />
      {/* Sparkles */}
      {earned && <>
        <circle cx="16" cy="14" r="2.5" fill="#ffca28" opacity="0.9" />
        <circle cx="64" cy="18" r="2"   fill="#fff176" opacity="0.8" />
        <circle cx="70" cy="52" r="1.5" fill="#ffca28" opacity="0.7" />
        <circle cx="12" cy="56" r="2"   fill="#fff176" opacity="0.8" />
        <path d="M22 8 L22 14 M19 11 L25 11" stroke="#ffca28" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M62 10 L62 16 M59 13 L65 13" stroke="#fff176" strokeWidth="1.5" strokeLinecap="round" />
      </>}
      {/* Rising arrow base */}
      <rect x="36" y="60" width="8" height="3" rx="1.5" fill={earned ? "#e65100" : "#c4c6d0"} />
      <path d="M40 75 L40 63 M34 69 L40 63 L46 69"
        stroke={earned ? "#f57c00" : "#c4c6d0"}
        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),

  // Consistent Performer — red/orange fire ring with green bars
  consistent_performer: ({ size = 80, earned }) => (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <defs>
        <linearGradient id="cp_ring" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={earned ? "#ef5350" : "#dee8ff"} />
          <stop offset="100%" stopColor={earned ? "#b71c1c" : "#c4c6d0"} />
        </linearGradient>
        <linearGradient id="cp_inner" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={earned ? "#ff7043" : "#e7eeff"} />
          <stop offset="100%" stopColor={earned ? "#bf360c" : "#dee8ff"} />
        </linearGradient>
        <linearGradient id="cp_bar1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={earned ? "#69f0ae" : "#c4c6d0"} />
          <stop offset="100%" stopColor={earned ? "#00c853" : "#dee8ff"} />
        </linearGradient>
        <linearGradient id="cp_bar2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={earned ? "#40c4ff" : "#dee8ff"} />
          <stop offset="100%" stopColor={earned ? "#0091ea" : "#c4c6d0"} />
        </linearGradient>
        <linearGradient id="cp_bar3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={earned ? "#ea80fc" : "#c4c6d0"} />
          <stop offset="100%" stopColor={earned ? "#aa00ff" : "#dee8ff"} />
        </linearGradient>
      </defs>
      {/* Outer ring */}
      <circle cx="40" cy="40" r="33" fill="url(#cp_ring)" />
      {/* Middle ring */}
      <circle cx="40" cy="40" r="27" fill="url(#cp_inner)" />
      {/* Inner dark circle */}
      <circle cx="40" cy="40" r="21" fill={earned ? "#1a0a00" : "#f0f3ff"} />
      {/* Coloured bars */}
      <rect x="24" y="46" width="8" height="12" rx="2" fill="url(#cp_bar1)" />
      <rect x="34" y="36" width="8" height="22" rx="2" fill="url(#cp_bar2)" />
      <rect x="44" y="26" width="8" height="32" rx="2" fill="url(#cp_bar3)" />
      {/* White trend line */}
      <path d="M24 44 L38 32 L52 22"
        stroke={earned ? "#ffffff" : "#c4c6d0"}
        strokeWidth="2" strokeLinecap="round" strokeDasharray="3 2" opacity="0.8" />
      {/* Dots on trend */}
      {earned && <>
        <circle cx="24" cy="44" r="2.5" fill="#ffffff" />
        <circle cx="38" cy="32" r="2.5" fill="#ffffff" />
        <circle cx="52" cy="22" r="2.5" fill="#ffffff" />
      </>}
    </svg>
  ),

  // Top Rated — purple trophy with gold stars
  top_rated: ({ size = 80, earned }) => (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <defs>
        <linearGradient id="tr_cup" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={earned ? "#ce93d8" : "#dee8ff"} />
          <stop offset="100%" stopColor={earned ? "#7b1fa2" : "#c4c6d0"} />
        </linearGradient>
        <linearGradient id="tr_base" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={earned ? "#9c27b0" : "#c4c6d0"} />
          <stop offset="100%" stopColor={earned ? "#4a148c" : "#dee8ff"} />
        </linearGradient>
      </defs>
      {/* Trophy cup */}
      <path d="M26 10 L54 10 L54 40 C54 53 47 60 40 62 C33 60 26 53 26 40 Z"
        fill="url(#tr_cup)"
        stroke={earned ? "#f3e5f5" : "#c4c6d0"} strokeWidth="1.5" />
      {/* Cup inner shine */}
      <path d="M30 14 L50 14 L50 38 C50 49 44 55 40 57 C36 55 30 49 30 38 Z"
        fill={earned ? "#ab47bc" : "#e7eeff"} opacity="0.6" />
      {/* Handles */}
      <path d="M26 18 C16 18 12 25 12 33 C12 40 16 45 26 43"
        fill="none" stroke={earned ? "#ce93d8" : "#c4c6d0"} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M54 18 C64 18 68 25 68 33 C68 40 64 45 54 43"
        fill="none" stroke={earned ? "#ce93d8" : "#c4c6d0"} strokeWidth="3.5" strokeLinecap="round" />
      {/* Gold star inside */}
      <path d="M40 20 L42.5 27 L50 27 L44.5 31.5 L46.5 39 L40 34.5 L33.5 39 L35.5 31.5 L30 27 L37.5 27 Z"
        fill={earned ? "#ffd54f" : "#dee8ff"} />
      {/* Base stem */}
      <rect x="37" y="62" width="6" height="6" rx="1" fill="url(#tr_base)" />
      {/* Base plate */}
      <rect x="24" y="68" width="32" height="6" rx="3" fill="url(#tr_base)" />
      {/* Side stars */}
      {earned && <>
        <path d="M14 8 L15 11 L18 11 L15.5 13 L16.5 16 L14 14.5 L11.5 16 L12.5 13 L10 11 L13 11 Z" fill="#ffd54f" opacity="0.9" />
        <path d="M66 8 L67 11 L70 11 L67.5 13 L68.5 16 L66 14.5 L63.5 16 L64.5 13 L62 11 L65 11 Z" fill="#ffd54f" opacity="0.9" />
      </>}
    </svg>
  ),

  // Challenge Master — teal hexagon with electric bolt
  challenge_master: ({ size = 80, earned }) => (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <defs>
        <linearGradient id="cm_hex" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={earned ? "#80cbc4" : "#dee8ff"} />
          <stop offset="100%" stopColor={earned ? "#004d40" : "#c4c6d0"} />
        </linearGradient>
        <linearGradient id="cm_inner" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={earned ? "#00897b" : "#e7eeff"} />
          <stop offset="100%" stopColor={earned ? "#00251a" : "#f0f3ff"} />
        </linearGradient>
        <linearGradient id="cm_bolt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={earned ? "#ffee58" : "#dee8ff"} />
          <stop offset="100%" stopColor={earned ? "#f9a825" : "#c4c6d0"} />
        </linearGradient>
      </defs>
      {/* Outer hexagon */}
      <path d="M40 4 L68 20 L68 52 L40 68 L12 52 L12 20 Z"
        fill="url(#cm_hex)"
        stroke={earned ? "#b2dfdb" : "#dee8ff"} strokeWidth="2" />
      {/* Inner hexagon */}
      <path d="M40 12 L62 25 L62 50 L40 63 L18 50 L18 25 Z"
        fill="url(#cm_inner)" />
      {/* Lightning bolt — golden */}
      <path d="M46 13 L33 38 L42 38 L35 59 L52 31 L43 31 Z"
        fill="url(#cm_bolt)"
        stroke={earned ? "#fff9c4" : "#c4c6d0"} strokeWidth="1" />
      {/* Energy sparks */}
      {earned && <>
        <circle cx="20" cy="20" r="2"   fill="#ffee58" opacity="0.8" />
        <circle cx="60" cy="18" r="1.5" fill="#ffee58" opacity="0.7" />
        <circle cx="64" cy="55" r="2"   fill="#80cbc4" opacity="0.9" />
        <circle cx="16" cy="52" r="1.5" fill="#80cbc4" opacity="0.8" />
        <path d="M22 26 L24 22 L26 26" stroke="#ffee58" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.7" />
        <path d="M56 24 L58 20 L60 24" stroke="#ffee58" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.7" />
      </>}
    </svg>
  ),
};

// ── Navbar (identical to LeaderboardPage) ────────────────────
function Navbar({ onBellClick, unreadCount }) {
  return (
    <header style={{
      position: "fixed", top: 0, left: 0, right: 0,
      height: 64, background: C.navBg,
      display: "flex", alignItems: "center",
      padding: "0 32px", gap: 40, zIndex: 100,
      borderBottom: `1px solid ${C.navBorder}`,
    }}>
      <div style={{ display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <span style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 17, color: C.textOnDark, letterSpacing: "-0.02em", textTransform: "uppercase", lineHeight: 1 }}>Nexus Pro</span>
        <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 9, color: C.teal, letterSpacing: "0.2em", textTransform: "uppercase" }}>Professional</span>
      </div>
      <nav style={{ display: "flex", gap: 32 }}>
        {["Overview", "Marketplace", "Network", "Insights"].map((item, i) => (
          <a key={item} href="#" style={{
            fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 11,
            letterSpacing: "0.08em", textTransform: "uppercase",
            color: i === 0 ? C.textOnDark : C.navMuted,
            textDecoration: "none",
            borderBottom: i === 0 ? `2px solid ${C.teal}` : "none",
            paddingBottom: 2,
          }}>{item}</a>
        ))}
      </nav>
      <div style={{ flex: 1, maxWidth: 380 }}>
        <div style={{ position: "relative" }}>
          <input placeholder="Search insights and assets..." style={{
            width: "100%", background: "rgba(255,255,255,0.08)",
            color: C.textOnDark, fontSize: 13,
            padding: "7px 14px 7px 36px", borderRadius: 8,
            border: `1px solid ${C.navBorder}`, outline: "none",
            fontFamily: "'Inter', sans-serif",
          }} />
          <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)", fontSize: 14 }}>🔍</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
        <button onClick={onBellClick} style={{ width: 36, height: 36, borderRadius: "50%", background: "none", border: "none", color: C.navMuted, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          🔔
          {unreadCount > 0 && <span style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, background: C.error, borderRadius: "50%" }} />}
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

// ── Sidebar (identical to LeaderboardPage) ────────────────────
function Sidebar() {
  const items = [
    { icon: "⊞", label: "Overview"  },
    { icon: "📁", label: "Portfolio" },
    { icon: "⬡",  label: "Network"   },
    { icon: "📈", label: "Analytics" },
    { icon: "📄", label: "Documents" },
  ];
  return (
    <aside style={{
      position: "fixed", left: 0, top: 64,
      width: 224, height: "calc(100vh - 64px)",
      background: `linear-gradient(180deg, ${C.sidebarBg} 0%, ${C.sidebarGrad} 100%)`,
      display: "flex", flexDirection: "column",
      padding: 16, zIndex: 40,
      borderRight: `1px solid ${C.sidebarBorder}`,
    }}>
      <div style={{ padding: "0 12px", marginBottom: 16 }}>
        <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: C.sidebarLabel }}>Navigation</span>
      </div>
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {items.map((item) => {
          const active = item.label === "Overview";
          return (
            <a key={item.label} href="#" style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 12px", borderRadius: 8, textDecoration: "none",
              background: active ? C.sidebarActiveBg : "transparent",
              color: active ? C.sidebarActiveText : C.sidebarText,
              fontFamily: "'Inter', sans-serif", fontWeight: active ? 700 : 600,
              fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase",
              transition: "all 0.15s",
              boxShadow: active ? "0 1px 4px rgba(0,23,54,0.1)" : "none",
            }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = C.sidebarHoverBg; e.currentTarget.style.color = C.primary; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.sidebarText; } }}
            >
              <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{item.icon}</span>
              {item.label}
            </a>
          );
        })}
      </nav>
      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
        <button style={{ width: "100%", padding: "12px 0", background: C.primary, color: C.textOnDark, border: "none", borderRadius: 8, fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,23,54,0.2)" }}>
          Create Project
        </button>
        <div style={{ height: 1, background: C.sidebarBorder, margin: "6px 0" }} />
        {[{ icon: "⚙", label: "Settings" }, { icon: "❓", label: "Support" }].map(item => (
          <a key={item.label} href="#" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, color: C.sidebarText, textDecoration: "none", fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", transition: "color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.color = C.primary}
            onMouseLeave={e => e.currentTarget.style.color = C.sidebarText}
          >
            <span style={{ fontSize: 15 }}>{item.icon}</span> {item.label}
          </a>
        ))}
      </div>
    </aside>
  );
}

// ── Level Card — matches Frame 3/5/6/7 ───────────────────────
// Structure: border + border-radius:8px
//   Left: Rectangle 3 (icon box, grey bg, ~70px wide)
//   Right: "Level Name XP required" text block
function LevelCard({ def, isCurrentLevel, userPoints }) {
  const unlocked = userPoints >= def.xp_required;

  return (
    <div style={{
      boxSizing: "border-box",
      width: 310, height: 126, flexShrink: 0,
      border: `1px solid ${isCurrentLevel ? C.primary : "rgba(0,0,0,0.2)"}`,
      borderRadius: 8,
      display: "flex", flexDirection: "row",
      alignItems: "center",
      padding: "0 16px", gap: 16,
      background: isCurrentLevel ? `${C.surfaceHigh}` : C.surfaceCard,
      position: "relative",
      transition: "box-shadow 0.2s",
      boxShadow: isCurrentLevel ? `0 2px 12px rgba(0,23,54,0.1)` : "none",
    }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,23,54,0.12)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = isCurrentLevel ? "0 2px 12px rgba(0,23,54,0.1)" : "none"}
    >
      {/* Rectangle 3 — icon box: left 3.4%, width ~70px, bg rgba(174,169,169,0.31) */}
      <div style={{
        width: 70, height: 50, flexShrink: 0,
        background: unlocked ? `${def.color}22` : C.levelIconBg,
        borderRadius: 8,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 28,
        border: isCurrentLevel ? `2px solid ${def.color}55` : "none",
      }}>
        {unlocked ? def.icon : "🔒"}
      </div>

      {/* Text block — "Level Name XP required" */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontFamily: "'Inter', sans-serif", fontWeight: 700,
            fontSize: 16, color: unlocked ? C.textPrimary : C.textMuted,
            letterSpacing: "-0.01em",
          }}>Level {def.level}</span>
          {isCurrentLevel && (
            <span style={{
              background: C.teal, color: C.textOnTeal,
              fontSize: 9, fontWeight: 800,
              fontFamily: "'Inter', sans-serif",
              padding: "2px 7px", borderRadius: 9999,
              letterSpacing: "0.05em", textTransform: "uppercase",
            }}>Current</span>
          )}
        </div>
        <span style={{
          fontFamily: "'Inter', sans-serif", fontWeight: 600,
          fontSize: 14, color: unlocked ? def.color : C.textMuted,
        }}>{def.title}</span>
        <span style={{
          fontFamily: "'Inter', sans-serif", fontWeight: 400,
          fontSize: 12, color: C.textMuted,
        }}>
          {def.xp_required === 0 ? "Starting level" : `${def.xp_required.toLocaleString()} XP required`}
        </span>
        <span style={{
          fontFamily: "'Inter', sans-serif", fontWeight: 400,
          fontSize: 11, color: C.textMuted, fontStyle: "italic",
        }}>{def.desc}</span>
      </div>

      {/* Unlock status indicator */}
      <div style={{
        width: 10, height: 10, borderRadius: "50%",
        background: unlocked ? "#4caf50" : C.dotInactive,
        flexShrink: 0,
      }} />
    </div>
  );
}

// ── Badge Card — matches Building Blocks/Content ──────────────
// Structure (271×339px):
//   Top: Media area (271×188, bg #D9D9D9) — badge icon shown here
//   Bottom: Text content (padding 16px)
//     Title (Roboto 16px, #1D1B20)
//     Subhead (Roboto 14px, #49454F)
//     Actions: "Enabled" button (outlined, border #79747E, text #00132E)
function BadgeCard({ def, earned }) {
  return (
    <div style={{
      boxSizing: "border-box",
      width: 271, height: 339, flexShrink: 0,
      border: `2px solid ${(def.grad||[def.color])[0]}${earned ? '' : '88'}`,
      borderRadius: 12,
      display: "flex", flexDirection: "column",
      overflow: "hidden",
      background: C.surfaceCard,
      boxShadow: earned ? `0 2px 12px ${(def.grad||[def.color])[0]}33` : `0 1px 4px ${(def.grad||[def.color])[0]}22`,
      transition: "transform 0.2s, box-shadow 0.2s",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,23,54,0.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      {/* Media area — 271×188, bg #D9D9D9 */}
      <div style={{
        width: "100%", height: 188, flexShrink: 0,
        background: earned ? `linear-gradient(135deg, ${(def.grad||[def.color,def.color])[0]}cc, ${(def.grad||[def.color,def.color])[1]}ee)` : `linear-gradient(135deg, ${(def.grad||[def.color,def.color])[0]}55, ${(def.grad||[def.color,def.color])[1]}77)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden",
      }}>
        {/* SVG Badge Logo */}
        {(() => {
          const Logo = BadgeLogo[def.badge_code];
          return Logo ? (
            <div style={{
              zIndex: 1,
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: earned ? 1 : 0.7,
              transition: "all 0.3s",
            }}>
              <Logo size={90} earned={true} />
            </div>
          ) : (
            <span style={{ fontSize: 60, zIndex: 1, opacity: earned ? 1 : 0.3 }}>{def.icon}</span>
          );
        })()}
        {/* Badge glow overlay */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: `radial-gradient(circle at 50% 50%, rgba(255,255,255,${earned ? "0.25" : "0.08"}) 0%, transparent 65%)`,
        }} />
        {/* Locked overlay */}
        {!earned && (
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "rgba(0,0,0,0.28)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
            paddingBottom: 12,
          }}>
            <span style={{
              fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 800,
              color: "rgba(255,255,255,0.9)", letterSpacing: "0.12em",
              textTransform: "uppercase",
              background: "rgba(0,0,0,0.4)",
              padding: "3px 10px", borderRadius: 9999,
            }}>🔒 Locked</span>
          </div>
        )}
        {earned && (
          <div style={{
            position: "absolute", top: 10, right: 10,
            background: "#007a6e", color: "#fff",
            fontSize: 9, fontWeight: 800,
            fontFamily: "'Inter', sans-serif",
            padding: "2px 7px", borderRadius: 9999,
            letterSpacing: "0.05em", textTransform: "uppercase",
          }}>Earned</div>
        )}
      </div>

      {/* Text content — padding 16px, gap 32px */}
      <div style={{
        padding: 16, display: "flex", flexDirection: "column",
        gap: 8, flex: 1,
      }}>
        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {/* Title — Roboto 16px, #1D1B20 */}
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600, fontSize: 16, lineHeight: "24px",
            letterSpacing: "0.5px", color: "#111c2d",
          }}>{def.name}</span>
          {/* Subhead — Roboto 14px, #49454F */}
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 400, fontSize: 13, lineHeight: "20px",
            letterSpacing: "0.25px", color: "#43474f",
          }}>{def.desc}</span>
        </div>

        {/* Actions — flex-end */}
        <div style={{
          display: "flex", flexDirection: "row",
          justifyContent: "flex-end", alignItems: "center",
          marginTop: "auto",
        }}>
          {/* Secondary action button — border: 1px solid #79747E, border-radius: 100px */}
          <button style={{
            boxSizing: "border-box",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "10px 24px",
            width: 117, height: 40,
            border: `1px solid ${earned ? (def.color || C.primary) : "#79747E"}`,
            borderRadius: 100,
            background: earned ? (def.color || C.obsidian) : "transparent",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600, fontSize: 14, lineHeight: "20px",
            letterSpacing: "0.1px",
            color: earned ? C.teal : "#001736",
            cursor: earned ? "default" : "not-allowed",
            transition: "all 0.15s",
          }}>
            {earned ? "Unlocked" : "Locked"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Pagination — matches Pagination component in CSS ──────────
function Pagination({ current, total, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 0, height: 31 }}>
      {/* Prev button */}
      <button
        onClick={() => onChange(Math.max(1, current - 1))}
        disabled={current === 1}
        style={{
          boxSizing: "border-box",
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 30, height: 31,
          background: "transparent",
          border: `1px solid ${C.paginationBorder}`,
          borderRadius: "3.2px 0 0 3.2px",
          cursor: current === 1 ? "not-allowed" : "pointer",
          color: current === 1 ? C.textMuted : C.paginationText,
          fontSize: 13,
        }}
      >‹</button>

      {/* Page numbers */}
      {Array.from({ length: total }, (_, i) => i + 1).map(page => (
        <button
          key={page}
          onClick={() => onChange(page)}
          style={{
            boxSizing: "border-box",
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 26, height: 31,
            background: current === page ? C.paginationActive : "transparent",
            border: `1px solid ${current === page ? C.paginationActive : C.paginationBorder}`,
            borderLeft: "none",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 400, fontSize: 12, lineHeight: "150%",
            color: current === page ? "#ffffff" : C.paginationText,
            cursor: "pointer",
          }}
        >{page}</button>
      ))}

      {/* Next button */}
      <button
        onClick={() => onChange(Math.min(total, current + 1))}
        disabled={current === total}
        style={{
          boxSizing: "border-box",
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 30, height: 31,
          background: "transparent",
          border: `1px solid ${C.paginationBorder}`,
          borderLeft: "none",
          borderRadius: "0 4px 4px 0",
          cursor: current === total ? "not-allowed" : "pointer",
          color: current === total ? C.textMuted : C.paginationText,
          fontSize: 13,
        }}
      >›</button>
    </div>
  );
}

// ── Pagination dots — matches Group 30 ────────────────────────
function PaginationDots({ total, current }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: "50%",
          background: i === current ? C.primary : C.dotInactive,
          transition: "background 0.2s",
        }} />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export default function AchievementsPage() {
  const [userLevel,    setUserLevel]    = useState(1);
  const [userPoints,   setUserPoints]   = useState(0);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [badgePage,    setBadgePage]    = useState(1);
  const [levelDot,     setLevelDot]     = useState(0);
  const [showMyOnly,   setShowMyOnly]   = useState(false);

  const badgesPerPage = 4;
  const levelScrollRef = useRef(null);

  // ── Fetch user level & points ─────────────────────────────
  const fetchUserData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      // Fetch leaderboard to get current user's points + level
      const res  = await fetch(`${API_BASE}/api/leaderboard?period=all&limit=50`, {
        headers: { "x-user-id": CURRENT_USER_ID },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const me   = (data.data || []).find(u => String(u.user_id) === String(CURRENT_USER_ID));
      if (me) {
        setUserLevel(me.level || 1);
        setUserPoints(me.total_points || 0);
      }

      // Fetch badges
      const badgeRes = await fetch(`${API_BASE}/api/user/${CURRENT_USER_ID}/badges`, {
        headers: { "x-user-id": CURRENT_USER_ID },
      });
      if (badgeRes.ok) {
        const badgeData = await badgeRes.json();
        if (badgeData.success) {
          setEarnedBadges((badgeData.badges || []).map(b => b.badge_code || b.badge_id));
        }
      }
    } catch (err) {
      setError(`Could not load achievements: ${err.message}`);
      // Use sensible defaults so page still renders
      setUserLevel(1);
      setUserPoints(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUserData(); }, [fetchUserData]);

  // ── Visible badges for current page ───────────────────────
  const filteredBadges = showMyOnly
    ? BADGE_DEFS.filter(b => earnedBadges.includes(b.badge_code))
    : BADGE_DEFS;

  const totalBadgePages = Math.max(1, Math.ceil(filteredBadges.length / badgesPerPage));
  const visibleBadges   = filteredBadges.slice(
    (badgePage - 1) * badgesPerPage,
    badgePage       * badgesPerPage
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;700;800&family=Inter:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.pageBg}; font-family: 'Inter', sans-serif; }
        a { text-decoration: none; }
        button { cursor: pointer; }
        input:focus { outline: none; }
        @keyframes fadeUp   { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
        ::-webkit-scrollbar { height: 4px; width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${C.outline}; border-radius: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
      `}</style>

      <div style={{ minHeight: "100vh", background: C.pageBg }}>
        <Navbar unreadCount={0} onBellClick={() => {}} />
        <Sidebar />

        <main style={{ marginLeft: 224, paddingTop: 64, minHeight: "100vh" }}>
          <div style={{ padding: "24px 32px", maxWidth: 1380 }}>

            {/* ── Frame 99: main container ── */}
            {/* CSS: width 1325px, height 850px, border 1px solid #000, border-radius 20px */}
            <div style={{
              border: `1px solid ${C.frameBorder}`,
              borderRadius: 20,
              padding: "24px 28px",
              background: C.surfaceCard,
              animation: "fadeUp 0.35s ease both",
              minHeight: 850,
            }}>

              {/* ── Frame 99 Header ── */}
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", marginBottom: 20,
              }}>
                {/* "Achievements" — Manrope 700, 32px, #121417 */}
                <h1 style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 700, fontSize: 32, lineHeight: "28px",
                  color: "#121417",
                }}>Achievements</h1>

                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  {/* My Achievements toggle — Frame 98: bg #D9D9D9, border-radius 10px */}
                  <button
                    onClick={() => { setShowMyOnly(p => !p); setBadgePage(1); }}
                    style={{
                      width: 264, height: 57, borderRadius: 10,
                      background: "#001736",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 600, fontSize: 20, lineHeight: "29px",
                      color: "#ffffff",
                      transition: "all 0.2s",
                      boxShadow: "0 2px 8px rgba(0,23,54,0.2)",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#002b5b"}
                    onMouseLeave={e => e.currentTarget.style.background = "#001736"}
                  >
                    {showMyOnly ? "All Achievements" : "My Achievements"}
                  </button>
                </div>
              </div>

              {/* ── LEVELS SECTION ── */}
              <div style={{ marginBottom: 0 }}>

                {/* Section label + dots */}
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", marginBottom: 12,
                }}>
                  {/* "Levels" — Manrope 700, 16px, #121417 */}
                  <span style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontWeight: 700, fontSize: 16, lineHeight: "28px",
                    color: "#121417",
                  }}>Levels</span>

                  {/* Pagination dots — Group 30: 3 dots, #AEA9A9 */}
                  <PaginationDots total={LEVEL_DEFS.length} current={levelDot} />
                </div>

                {/* Frame 101: horizontal scroll container — height 246px */}
                <div
                  ref={levelScrollRef}
                  style={{
                    overflowX: "auto",
                    overflowY: "hidden",
                    height: 140,
                    display: "flex",
                    flexDirection: "row",
                    gap: 20,
                    paddingBottom: 8,
                    scrollBehavior: "smooth",
                  }}
                  onScroll={e => {
                    const el = e.target;
                    const pct = el.scrollLeft / (el.scrollWidth - el.clientWidth || 1);
                    setLevelDot(Math.round(pct * (LEVEL_DEFS.length - 1)));
                  }}
                >
                  {LEVEL_DEFS.map(def => (
                    <LevelCard
                      key={def.level}
                      def={def}
                      isCurrentLevel={def.level === userLevel}
                      userPoints={userPoints}
                    />
                  ))}
                </div>
              </div>

              {/* ── Line 11 — horizontal divider: 1px solid #000 ── */}
              <div style={{
                width: "100%", height: 1,
                background: "#000000",
                margin: "20px 0",
              }} />

              {/* ── BADGES SECTION ── */}
              <div>

                {/* Section label + pagination */}
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", marginBottom: 16,
                }}>
                  {/* "Badges" — Manrope 700, 16px, #121417 */}
                  <span style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontWeight: 700, fontSize: 16, lineHeight: "28px",
                    color: "#121417",
                  }}>Badges</span>

                  {/* Pagination component */}
                  <Pagination
                    current={badgePage}
                    total={totalBadgePages}
                    onChange={setBadgePage}
                  />
                </div>

                {/* Status messages */}
                {loading && (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "40px 0", color: C.textMuted, fontFamily: "'Inter', sans-serif", fontSize: 14 }}>
                    <div style={{ width: 20, height: 20, border: `3px solid ${C.surfaceContainer}`, borderTopColor: C.obsidian, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    Loading achievements...
                  </div>
                )}
                {error && !loading && (
                  <div style={{ padding: "12px 16px", background: "#fff5f5", border: `1px solid ${C.error}33`, borderRadius: 8, color: C.error, fontFamily: "'Inter', sans-serif", fontSize: 13, marginBottom: 16 }}>
                    ⚠ {error} — showing default badges
                  </div>
                )}

                {/* Frame 100: horizontal scroll container — height 433px */}
                {/* Building Blocks/Content cards: 271×339px each */}
                <div style={{
                  display: "flex", flexDirection: "row",
                  gap: 24, flexWrap: "nowrap",
                  overflowX: "auto",
                  paddingBottom: 8,
                  minHeight: 360,
                  animation: "fadeIn 0.3s ease both",
                }}>
                  {visibleBadges.length === 0 ? (
                    <div style={{ padding: "40px 0", color: C.textMuted, fontFamily: "'Inter', sans-serif", fontSize: 14 }}>
                      No badges found. Complete challenges to earn your first badge!
                    </div>
                  ) : (
                    visibleBadges.map(def => (
                      <BadgeCard
                        key={def.badge_code}
                        def={def}
                        earned={earnedBadges.includes(def.badge_code)}
                      />
                    ))
                  )}
                </div>

                {/* Badge count summary */}
                <div style={{
                  marginTop: 16, textAlign: "right",
                  fontFamily: "'Inter', sans-serif", fontSize: 12,
                  color: C.textMuted,
                }}>
                  {earnedBadges.length} of {BADGE_DEFS.length} badges earned
                  {showMyOnly && earnedBadges.length === 0 && (
                    <span style={{ marginLeft: 8, color: C.tealOnLight }}>
                      — Complete challenges to unlock badges!
                    </span>
                  )}
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
