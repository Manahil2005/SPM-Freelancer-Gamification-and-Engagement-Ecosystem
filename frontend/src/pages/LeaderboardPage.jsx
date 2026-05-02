import { useState, useEffect, useCallback } from "react";

// =============================================================
// LeaderboardPage.jsx — Nexus Professional LIGHT THEME
// Matches the screenshot exactly:
//   Navbar:    Deep Midnight #001736 (dark navy)
//   Sidebar:   White #ffffff with light #f0f3ff gradient, blue text
//   Page bg:   #f9f9ff (very light surface)
//   Cards:     White #ffffff with subtle borders
//   Podium:    Deep Midnight #001736 (dark, authoritative)
//   Table rows: #f0f3ff alternating on white card
//   Accent:    Teal #89f5e7, Obsidian green #001b18 for badges/pills
//   Text:      #111c2d primary, #43474f secondary, #747780 muted
// =============================================================

const API_BASE = "";
const CURRENT_USER_ID = "1";

const C = {
  // ── Navbar — deep midnight (matches screenshot top bar) ──────
  navBg: "#001736",
  navText: "#ffffff",
  navMuted: "rgba(255,255,255,0.55)",
  navBorder: "rgba(255,255,255,0.08)",
  navHover: "rgba(255,255,255,0.07)",

  // ── Sidebar — white with soft tonal blue (matches screenshot) ─
  sidebarBg: "#f0f3ff",      // Soft Tonal Blue background
  sidebarGrad: "#f9f9ff",      // gradient end
  sidebarBorder: "#e4e8f0",
  sidebarText: "#515f74",      // Nexus secondary — readable blue-grey
  sidebarActiveText: "#001736",      // Deep Midnight for active
  sidebarActiveBg: "#ffffff",      // White card for active item
  sidebarHoverBg: "#dee8ff",      // Surface high on hover
  sidebarLabel: "#747780",      // Muted label

  // ── Page & surfaces ──────────────────────────────────────────
  pageBg: "#f9f9ff",      // Nexus surface
  surfaceCard: "#ffffff",      // White cards
  surfaceContainer: "#e7eeff",      // Surface container
  surfaceHigh: "#dee8ff",      // Surface high
  surfaceLow: "#f0f3ff",      // Soft Tonal Blue

  // ── Brand colours ────────────────────────────────────────────
  primary: "#001736",      // Deep Midnight
  primaryContainer: "#002b5b",
  obsidian: "#001b18",      // Obsidian Green — used for badges/podium
  obsidianMid: "#00322d",
  teal: "#89f5e7",      // Teal Accent
  tealDim: "#6bd8cb",
  tealFaint: "#2ca397",
  tealOnLight: "#007a6e",      // Teal readable on white bg

  // ── Text ─────────────────────────────────────────────────────
  textPrimary: "#111c2d",      // On-background
  textSecondary: "#43474f",      // On-surface-variant
  textMuted: "#747780",      // Outline
  textOnDark: "#ffffff",      // White text on dark surfaces
  textOnTeal: "#001b18",

  // ── Cards ─────────────────────────────────────────────────────
  cardBorder: "#c4c6d0",      // Outline-variant (light)
  cardBorderLight: "rgba(196,198,208,0.4)",
  cardShadow: "0 1px 4px rgba(0,23,54,0.07), 0 4px 16px rgba(0,23,54,0.04)",

  // ── Table rows ───────────────────────────────────────────────
  rowBg: "#ffffff",
  rowAlt: "#f0f3ff",      // Soft tonal blue alt row
  rowHover: "#dee8ff",
  rowActiveBg: "#001736",      // Current user = deep midnight
  rowActiveBorder: "#89f5e7",

  // ── Podium (dark — stands out on light page) ─────────────────
  podiumBg: "#001736",
  podium2: "#001b22",
  podium3: "#001a1c",

  // ── Accents ──────────────────────────────────────────────────
  gold: "#d4a843",
  silver: "#8fa8b8",
  bronze: "#9a6b3c",
  error: "#ba1a1a",
  outline: "#c4c6d0",
  outlineVariant: "rgba(196,198,208,0.5)",
};

const LEVEL_LABELS = { 1: "Beginner", 2: "Intermediate", 3: "Advanced" };
const MEDAL = {
  1: { color: C.gold, glow: "#d4a84325", emoji: "🥇" },
  2: { color: C.silver, glow: "#8fa8b820", emoji: "🥈" },
  3: { color: C.bronze, glow: "#9a6b3c20", emoji: "🥉" },
};

// ── Avatar ────────────────────────────────────────────────────
function Avatar({ name, size = 36, onDark = false }) {
  const initials = name
    ? name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: onDark
        ? `linear-gradient(135deg, #00322d, #004d3d)`
        : `linear-gradient(135deg, ${C.surfaceContainer}, ${C.surfaceHigh})`,
      border: onDark
        ? `2px solid ${C.teal}55`
        : `2px solid ${C.cardBorder}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Manrope', sans-serif",
      fontWeight: 800, fontSize: size * 0.33,
      color: onDark ? C.teal : C.primary,
      flexShrink: 0,
    }}>{initials}</div>
  );
}

// ── XP Badge — obsidian on light ─────────────────────────────
function XPBadge({ small }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      background: C.obsidian,
      color: C.textOnDark,
      borderRadius: 6,
      padding: small ? "1px 7px" : "3px 9px",
      fontFamily: "'Inter', sans-serif",
      fontWeight: 800, fontSize: small ? 9 : 11,
      letterSpacing: "0.06em",
    }}>XP</span>
  );
}

// ── Teal pill ─────────────────────────────────────────────────
function Pill({ children }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      background: C.teal,
      color: C.textOnTeal,
      borderRadius: 9999, padding: "3px 12px",
      fontFamily: "'Inter', sans-serif",
      fontWeight: 700, fontSize: 10,
      letterSpacing: "0.06em", textTransform: "uppercase",
    }}>{children}</span>
  );
}

// ── Total Players Card ────────────────────────────────────────
function TotalPlayersCard({ count }) {
  return (
    <div style={{
      background: C.surfaceCard,
      borderRadius: 16,
      padding: "28px 48px",
      position: "relative", overflow: "hidden",
      border: `1px solid ${C.cardBorderLight}`,
      boxShadow: C.cardShadow,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 6, minWidth: 240,
      transition: "transform 0.2s, box-shadow 0.2s",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,23,54,0.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = C.cardShadow; }}
    >
      {/* Teal glow top-right */}
      <div style={{ position: "absolute", top: -24, right: -24, width: 90, height: 90, borderRadius: "50%", background: `${C.teal}22`, filter: "blur(20px)", pointerEvents: "none" }} />

      <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: C.tealOnLight }}>
        Total Players
      </span>
      <span style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 48, color: C.primary, letterSpacing: "-0.03em", lineHeight: 1 }}>
        {count || "—"}
      </span>
      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: C.textMuted }}>
        on the leaderboard
      </span>

      {/* Bottom teal accent */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${C.teal}, transparent)` }} />
    </div>
  );
}

// ── Podium Card ───────────────────────────────────────────────
function PodiumCard({ entry, isCurrent }) {
  if (!entry) return <div style={{ flex: 1 }} />;

  const rank = entry.rank;
  const heights = { 1: 330, 2: 295, 3: 265 };
  const cardH = heights[rank] || 265;
  const med = MEDAL[rank];
  const avatarSize = rank === 1 ? 100 : 82;
  const bg = { 1: C.podiumBg, 2: C.podium2, 3: C.podium3 }[rank];

  return (
    <div
      style={{
        flex: 1, height: cardH,
        background: `linear-gradient(180deg, ${bg} 0%, #001b22 100%)`,
        position: "relative",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "flex-end",
        paddingBottom: 22,
        border: isCurrent
          ? `2px solid ${C.teal}`
          : rank === 1 ? `1px solid ${med.color}44` : `1px solid rgba(255,255,255,0.08)`,
        boxSizing: "border-box",
        transition: "transform 0.22s ease",
        overflow: "hidden",
      }}
      onMouseEnter={e => e.currentTarget.style.transform = "translateY(-6px)"}
      onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
    >
      {/* Top glow bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        background: rank === 1
          ? `linear-gradient(90deg, transparent, ${C.teal}, transparent)`
          : `linear-gradient(90deg, transparent, ${med.color}88, transparent)`,
      }} />

      {/* Radial glow */}
      <div style={{
        position: "absolute", top: 40, left: "50%", transform: "translateX(-50%)",
        width: avatarSize + 40, height: avatarSize + 40, borderRadius: "50%",
        background: `radial-gradient(circle, ${rank === 1 ? C.teal + "1a" : med.glow} 0%, transparent 70%)`,
        filter: "blur(8px)", pointerEvents: "none",
      }} />

      {/* White name banner */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        background: C.surfaceCard,
        padding: "10px 14px", height: 44,
        display: "flex", alignItems: "center", gap: 8,
        borderBottom: `2px solid ${rank === 1 ? C.teal + "55" : C.cardBorderLight}`,
      }}>
        <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 13, color: C.textPrimary, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          #{rank} {entry.name}
        </span>
        {isCurrent && <span style={{ fontSize: 9, background: C.teal, color: C.textOnTeal, borderRadius: 4, padding: "2px 6px", fontWeight: 800, fontFamily: "'Inter', sans-serif" }}>YOU</span>}
        {rank === 1 && <span style={{ fontSize: 9, background: `${C.gold}18`, color: C.gold, borderRadius: 4, padding: "2px 6px", fontWeight: 700, border: `1px solid ${C.gold}44`, fontFamily: "'Inter', sans-serif" }}>LEADER</span>}
      </div>

      {/* Avatar */}
      <div style={{ position: "absolute", top: 52, left: "50%", transform: "translateX(-50%)" }}>
        <div style={{
          width: avatarSize, height: avatarSize, borderRadius: "50%", overflow: "hidden",
          border: `3px solid ${rank === 1 ? C.teal : med.color + "88"}`,
          boxShadow: rank === 1 ? `0 0 0 4px ${C.teal}20, 0 0 24px ${C.teal}40` : `0 0 0 3px ${med.glow}`,
        }}>
          <Avatar name={entry.name} size={avatarSize} onDark />
        </div>
      </div>

      {/* Points */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <span style={{ fontSize: 24, lineHeight: 1 }}>{med.emoji}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 18, color: rank === 1 ? C.teal : C.textOnDark }}>
          {entry.points_for_rank.toLocaleString()}
          <XPBadge />
        </div>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: "rgba(255,255,255,0.45)" }}>
          Level {entry.level} · {LEVEL_LABELS[entry.level]}
        </div>
      </div>
    </div>
  );
}

// ── Leaderboard Row ───────────────────────────────────────────
function LeaderboardRow({ entry, index, isCurrent }) {
  return (
    <div
      style={{
        display: "flex", alignItems: "center",
        padding: "0 16px", height: 52,
        background: isCurrent ? C.rowActiveBg : (index % 2 === 0 ? C.rowBg : C.rowAlt),
        borderRadius: 10,
        border: isCurrent ? `1.5px solid ${C.rowActiveBorder}` : `1px solid ${C.cardBorderLight}`,
        boxSizing: "border-box",
        animation: `rowIn 0.3s ease both`,
        animationDelay: `${index * 45}ms`,
        transition: "background 0.15s",
        boxShadow: isCurrent ? `0 2px 12px rgba(0,23,54,0.15)` : "0 1px 2px rgba(0,23,54,0.04)",
      }}
      onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = C.rowHover; }}
      onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = index % 2 === 0 ? C.rowBg : C.rowAlt; }}
    >
      {/* Rank */}
      <div style={{ width: 40, textAlign: "center", flexShrink: 0, fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 14, color: isCurrent ? C.teal : C.textMuted }}>
        {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : entry.rank}
      </div>

      {/* Player */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, width: 210, flexShrink: 0 }}>
        <Avatar name={entry.name} size={34} onDark={isCurrent} />
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 13, color: isCurrent ? C.textOnDark : C.textPrimary, whiteSpace: "nowrap" }}>{entry.name}</span>
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 11, color: isCurrent ? "rgba(255,255,255,0.5)" : C.textMuted }}>@{entry.name.toLowerCase().replace(" ", "_")}</span>
        </div>
      </div>

      {/* Points */}
      <div style={{ flex: 1, textAlign: "center", fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 15, color: isCurrent ? C.teal : C.primary }}>
        {entry.points_for_rank.toLocaleString()}
      </div>

      {/* Level badge */}
      <div style={{ width: 130, textAlign: "center" }}>
        <span style={{
          fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 11,
          color: isCurrent ? C.tealDim : C.tealOnLight,
          background: isCurrent ? `${C.teal}18` : C.surfaceLow,
          border: `1px solid ${isCurrent ? C.teal + "44" : C.cardBorderLight}`,
          borderRadius: 6, padding: "2px 8px",
        }}>Lv {entry.level} · {LEVEL_LABELS[entry.level]}</span>
      </div>

      {/* XP */}
      <div style={{ width: 60, display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
        <XPBadge />
      </div>
    </div>
  );
}

// ── Notification Banner ───────────────────────────────────────
function NotificationBanner({ userEntry, totalUsers }) {
  const [visible, setVisible] = useState(true);
  if (!visible || !userEntry) return null;
  return (
    <div style={{
      display: "flex", alignItems: "center", flexWrap: "wrap",
      padding: "14px 20px", gap: 8,
      background: C.surfaceCard,
      borderRadius: 12,
      border: `1px solid ${C.cardBorderLight}`,
      boxShadow: C.cardShadow,
      position: "relative",
      animation: "rowIn 0.4s ease both",
    }}>
      {/* Teal left accent */}
      <div style={{ position: "absolute", left: 0, top: "15%", bottom: "15%", width: 3, background: C.teal, borderRadius: "0 3px 3px 0" }} />
      <span style={{ fontSize: 16 }}>🎯</span>
      <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 14, color: C.textSecondary }}>You earned</span>
      <strong style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 16, color: C.primary }}>{userEntry.points_for_rank.toLocaleString()}</strong>
      <XPBadge small />
      <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 14, color: C.textSecondary }}>
        today · ranked <strong style={{ color: C.primary }}>#{userEntry.rank}</strong> of
      </span>
      <strong style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 14, color: C.primary }}>{totalUsers} users</strong>
      <button onClick={() => setVisible(false)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
    </div>
  );
}

// ── Period Toggle ─────────────────────────────────────────────
function PeriodToggle({ period, onChange }) {
  return (
    <div style={{ display: "flex", background: C.surfaceCard, borderRadius: 10, padding: 4, gap: 3, border: `1px solid ${C.cardBorderLight}`, boxShadow: "0 1px 3px rgba(0,23,54,0.06)" }}>
      {[["Weekly", "weekly"], ["All-Time", "all"]].map(([label, val]) => (
        <button key={val} onClick={() => onChange(val)} style={{
          padding: "6px 18px", borderRadius: 7, border: "none",
          background: period === val ? C.primary : "transparent",
          color: period === val ? C.textOnDark : C.textSecondary,
          fontFamily: "'Inter', sans-serif", fontWeight: 700,
          fontSize: 11, letterSpacing: "0.04em",
          cursor: "pointer",
          boxShadow: period === val ? "0 2px 8px rgba(0,23,54,0.2)" : "none",
          transition: "all 0.18s",
        }}>{label}</button>
      ))}
    </div>
  );
}

// ── Navbar — deep midnight (matches screenshot exactly) ───────
function Navbar({ unreadCount, onBellClick }) {
  return (
    <header style={{
      position: "fixed", top: 0, left: 0, right: 0,
      height: 64, background: C.navBg,
      display: "flex", alignItems: "center",
      padding: "0 32px", gap: 40, zIndex: 100,
      borderBottom: `1px solid ${C.navBorder}`,
    }}>
      {/* Logo */}
      <div style={{ display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <span style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 17, color: C.textOnDark, letterSpacing: "-0.02em", textTransform: "uppercase", lineHeight: 1 }}>Nexus Pro</span>
        <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 9, color: C.teal, letterSpacing: "0.2em", textTransform: "uppercase" }}>Professional</span>
      </div>

      {/* Nav links */}
      <nav style={{ display: "flex", gap: 32 }}>
       {["Overview", "Leaderboard", "Achievements", "Insights"].map((item, i) => (
      <a key={item} href="#" onClick={e => {
        e.preventDefault();
        if (item === "Leaderboard")  window.__navigate("leaderboard");
        if (item === "Achievements") window.__navigate("achievements");
      }} style={{
            fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 11,
            letterSpacing: "0.08em", textTransform: "uppercase",
            color: item === "Leaderboard" ? C.textOnDark : C.navMuted,
            textDecoration: "none",
            borderBottom: item === "Leaderboard" ? `2px solid ${C.teal}` : "none",
            paddingBottom: 2,
          }}>{item}</a>
        ))}
      </nav>

      {/* Search */}
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

      {/* Right icons */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
        <button onClick={onBellClick} style={{ width: 36, height: 36, borderRadius: "50%", background: "none", border: "none", color: C.navMuted, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", transition: "background 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.background = C.navHover}
          onMouseLeave={e => e.currentTarget.style.background = "none"}
        >
          🔔
          {unreadCount > 0 && <span style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, background: C.error, borderRadius: "50%" }} />}
        </button>
        <button style={{ width: 36, height: 36, borderRadius: "50%", background: "none", border: "none", color: C.navMuted, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.background = C.navHover}
          onMouseLeave={e => e.currentTarget.style.background = "none"}
        >❓</button>
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

// ── Sidebar — light theme (matches screenshot) ────────────────
function Sidebar() {
  const items = [
    { icon: "⊞", label: "Overview" },
    { icon: "📁", label: "Portfolio" },
    { icon: "⬡", label: "Network" },
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
      {/* NAVIGATION label */}
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
              border: active ? "none" : "1px solid transparent",
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
        {/* Create Project button — matches screenshot dark button */}
        <button style={{
          width: "100%", padding: "12px 0",
          background: C.primary,
          color: C.textOnDark,
          border: "none", borderRadius: 8,
          fontFamily: "'Inter', sans-serif",
          fontWeight: 800, fontSize: 11,
          letterSpacing: "0.1em", textTransform: "uppercase",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,23,54,0.2)",
        }}>Create Project</button>

        <div style={{ height: 1, background: C.sidebarBorder, margin: "6px 0" }} />

        {[{ icon: "⚙", label: "Settings" }, { icon: "❓", label: "Support" }].map(item => (
          <a key={item.label} href="#" style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 12px", borderRadius: 8,
            color: C.sidebarText, textDecoration: "none",
            fontFamily: "'Inter', sans-serif", fontWeight: 600,
            fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase",
            transition: "color 0.15s",
          }}
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

// ── Notification Panel ────────────────────────────────────────
function NotificationPanel({ notifications, onMarkRead, onMarkAll, onClose }) {
  const typeIcon = { points: "⭐", level: "⬆️", badge: "🏅", challenge: "🎯" };
  return (
    <div style={{
      position: "fixed", top: 64, right: 0, width: 340, bottom: 0,
      background: C.surfaceCard,
      boxShadow: "-4px 0 20px rgba(0,23,54,0.1)",
      zIndex: 200, display: "flex", flexDirection: "column",
      animation: "slideRight 0.22s ease both",
      borderLeft: `1px solid ${C.sidebarBorder}`,
    }}>
      <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.sidebarBorder}`, background: C.surfaceLow }}>
        <span style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 15, color: C.primary }}>Notifications</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onMarkAll} style={{ background: C.primary, color: C.textOnDark, border: "none", borderRadius: 6, padding: "4px 10px", fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Mark all read</button>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: C.textMuted }}>×</button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {notifications.length === 0
          ? <div style={{ padding: 32, textAlign: "center", color: C.textMuted, fontFamily: "'Inter', sans-serif", fontSize: 13 }}>No notifications</div>
          : notifications.map(n => (
            <div key={n.notification_id}
              onClick={() => !n.is_read && onMarkRead(n.notification_id)}
              style={{ padding: "12px 20px", borderBottom: `1px solid ${C.cardBorderLight}`, background: n.is_read ? C.surfaceCard : C.surfaceLow, cursor: n.is_read ? "default" : "pointer", display: "flex", gap: 12, alignItems: "flex-start" }}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>{typeIcon[n.type] || "🔔"}</span>
              <div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: C.textPrimary, fontWeight: n.is_read ? 400 : 600, lineHeight: "18px" }}>{n.message}</div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: C.textMuted, marginTop: 3 }}>
                  {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  {!n.is_read && <span style={{ marginLeft: 6, color: C.tealOnLight, fontWeight: 700, fontSize: 9 }}>● NEW</span>}
                </div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ── Loading / Error ───────────────────────────────────────────
function StatusMsg({ loading, error }) {
  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 280, gap: 14, fontFamily: "'Inter', sans-serif", fontSize: 14, color: C.textSecondary }}>
      <div style={{ width: 22, height: 22, border: `3px solid ${C.surfaceHigh}`, borderTopColor: C.primary, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      Loading leaderboard...
    </div>
  );
  if (error) return (
    <div style={{ padding: "18px 22px", background: "#fff5f5", border: `1px solid ${C.error}44`, borderRadius: 12, fontFamily: "'Inter', sans-serif", fontSize: 13, color: C.error }}>
      ⚠ {error}
      <div style={{ marginTop: 6, fontSize: 11, color: C.textMuted }}>Make sure the backend is running on port 5000</div>
    </div>
  );
  return null;
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════
export default function LeaderboardPage() {
  const [period, setPeriod] = useState("weekly");
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/leaderboard?period=${period}&limit=50`, { headers: { "x-user-id": CURRENT_USER_ID } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setLeaderboard(data.data || []);
      setLastRefreshed(data.lastRefreshed);
    } catch (err) { setError(`Could not load leaderboard: ${err.message}`); }
    finally { setLoading(false); }
  }, [period]);

  const fetchNotifications = useCallback(async () => {
    try {
      const [nr, cr] = await Promise.all([
        fetch(`${API_BASE}/api/notifications/${CURRENT_USER_ID}`, { headers: { "x-user-id": CURRENT_USER_ID } }),
        fetch(`${API_BASE}/api/notifications/${CURRENT_USER_ID}/unread-count`, { headers: { "x-user-id": CURRENT_USER_ID } }),
      ]);
      if (nr.ok) { const d = await nr.json(); if (d.success) setNotifications(d.notifications || []); }
      if (cr.ok) { const d = await cr.json(); if (d.success) setUnreadCount(d.unread_count || 0); }
    } catch { /* silent */ }
  }, []);

  const markRead = async (id) => {
    try {
      await fetch(`${API_BASE}/api/notifications/${CURRENT_USER_ID}/${id}/read`, { method: "PUT", headers: { "x-user-id": CURRENT_USER_ID } });
      setNotifications(p => p.map(n => n.notification_id === id ? { ...n, is_read: true } : n));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await fetch(`${API_BASE}/api/notifications/${CURRENT_USER_ID}/read-all`, { method: "PUT", headers: { "x-user-id": CURRENT_USER_ID } });
      setNotifications(p => p.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  };

  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);
  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const podium = [
    leaderboard.find(e => e.rank === 2) || null,
    leaderboard.find(e => e.rank === 1) || null,
    leaderboard.find(e => e.rank === 3) || null,
  ];
  const tableRows = leaderboard.slice(3);
  const userEntry = leaderboard.find(e => e.user_id === CURRENT_USER_ID);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;700;800&family=Inter:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.pageBg}; font-family: 'Inter', sans-serif; }
        a { text-decoration: none; }
        button { cursor: pointer; }
        input::placeholder { color: rgba(255,255,255,0.3); }
        input:focus { outline: none; }
        @keyframes rowIn      { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideRight { from { transform:translateX(100%); } to { transform:translateX(0); } }
        @keyframes spin       { to { transform:rotate(360deg); } }
        @keyframes fadeUp     { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: ${C.outline}; border-radius: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
      `}</style>

      <div style={{ minHeight: "100vh", background: C.pageBg }}>

        <Navbar unreadCount={unreadCount} onBellClick={() => setShowPanel(p => !p)} />
        <Sidebar />

        {showPanel && (
          <NotificationPanel
            notifications={notifications}
            onMarkRead={markRead}
            onMarkAll={markAllRead}
            onClose={() => setShowPanel(false)}
          />
        )}

        <main style={{ marginLeft: 224, paddingTop: 64, minHeight: "100vh" }}>
          <div style={{ padding: "36px 44px", maxWidth: 1160 }}>

            {/* Page header — matches "System Analytics / Overview Dashboard" */}
            <div style={{ marginBottom: 32, animation: "fadeUp 0.3s ease both" }}>
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase", color: C.tealOnLight, display: "block", marginBottom: 6 }}>
                Gamification · Module 11
              </span>
              <h2 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 32, color: C.primary, letterSpacing: "-0.02em" }}>
                Leaderboard
              </h2>
            </div>

            {/* Toggle + refresh — right aligned */}
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12, marginBottom: 28, animation: "fadeUp 0.35s ease both" }}>
              {lastRefreshed && (
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: C.textMuted, display: "flex", alignItems: "center", gap: 6 }}>
                  Updated {new Date(lastRefreshed).toLocaleTimeString()}
                  <button onClick={fetchLeaderboard} style={{ background: "none", border: "none", color: C.tealOnLight, fontSize: 10, fontFamily: "'Inter', sans-serif", textDecoration: "underline", padding: 0 }}>&#8635; Refresh</button>
                </div>
              )}
              <PeriodToggle period={period} onChange={p => setPeriod(p)} />
            </div>

            <StatusMsg loading={loading} error={error} />

            {!loading && !error && leaderboard.length > 0 && (
              <>
                {/* Podium card — dark on light page */}
                <div style={{
                  background: `linear-gradient(180deg, #001736 0%, #001b22 100%)`,
                  borderRadius: 16,
                  border: `1px solid rgba(137,245,231,0.15)`,
                  boxShadow: `0 8px 32px rgba(0,23,54,0.2)`,
                  padding: "24px 24px 0 24px",
                  marginBottom: 20, overflow: "hidden",
                  animation: "fadeUp 0.45s ease both",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <div>
                      <h3 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 17, color: C.textOnDark }}>Top Performers</h3>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 3 }}>
                        {period === "weekly" ? "Points earned this week" : "All-time points ranking"}
                      </p>
                    </div>
                    <Pill>{period === "weekly" ? "This Week" : "All Time"}</Pill>
                  </div>

                  <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-end" }}>
                    {podium.map((entry, i) => (
                      <PodiumCard key={entry?.user_id ?? `empty-${i}`} entry={entry} isCurrent={entry?.user_id === CURRENT_USER_ID} />
                    ))}
                  </div>
                </div>

                {/* Table card — white card on light page */}
                <div style={{
                  background: C.surfaceCard,
                  borderRadius: 16,
                  border: `1px solid ${C.cardBorderLight}`,
                  boxShadow: C.cardShadow,
                  padding: 24,
                  animation: "fadeUp 0.5s ease both",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h3 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 17, color: C.primary }}>Full Rankings</h3>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: C.textMuted }}>{leaderboard.length} participants</span>
                  </div>

                  {/* Column headers */}
                  <div style={{ display: "flex", padding: "0 16px", marginBottom: 8 }}>
                    {[["#", 40], ["Player", 210], ["Points", "1fr"], ["Level", 130], ["XP", 60]].map(([h, w]) => (
                      <div key={h} style={{ width: typeof w === "number" ? w : undefined, flex: w === "1fr" ? 1 : undefined, flexShrink: 0, fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 9, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        {h}
                      </div>
                    ))}
                  </div>

                  {/* Rows */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 320, overflowY: "auto", paddingRight: 4 }}>
                    {tableRows.length === 0
                      ? <div style={{ padding: "24px 0", textAlign: "center", fontFamily: "'Inter', sans-serif", fontSize: 13, color: C.textMuted }}>
                        Only {leaderboard.length} user{leaderboard.length !== 1 ? "s" : ""} on the board so far.
                      </div>
                      : tableRows.map((entry, i) => (
                        <LeaderboardRow key={entry.user_id} entry={entry} index={i} isCurrent={entry.user_id === CURRENT_USER_ID} />
                      ))
                    }
                  </div>
                </div>
              </>
            )}

            {!loading && !error && leaderboard.length === 0 && (
              <div style={{ textAlign: "center", padding: "80px 0", fontFamily: "'Inter', sans-serif", fontSize: 14, color: C.textMuted }}>
                No users on the {period === "weekly" ? "weekly" : "all-time"} leaderboard yet.
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
