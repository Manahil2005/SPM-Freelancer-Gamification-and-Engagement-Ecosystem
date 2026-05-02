import { useState, useEffect, useCallback } from "react";
/* ═══════════════════════════════════════════════════════════════
   THEME — exact tokens from light.html
═══════════════════════════════════════════════════════════════ */
const T = {
  primary:          "#001736",
  primaryContainer: "#002b5b",
  tertiary:         "#001b18",
  tertiaryFixed:    "#89f5e7",
  tertiaryFixedDim: "#6bd8cb",
  secondary:        "#515f74",
  secondaryContainer:"#d5e3fc",
  surface:          "#f9f9ff",
  surfaceLow:       "#f0f3ff",
  surfaceContainer: "#e7eeff",
  surfaceHigh:      "#dee8ff",
  surfaceLowest:    "#ffffff",
  onSurface:        "#111c2d",
  onSurfaceVar:     "#43474f",
  outline:          "#747780",
  outlineVar:       "#c4c6d0",
  error:            "#ba1a1a",
};

/* ═══════════════════════════════════════════════════════════════
   DATA — unchanged
═══════════════════════════════════════════════════════════════ */
const STEPS = [
  { id:1, label:"Intro"   },
  { id:2, label:"About"   },
  { id:3, label:"Role"    },
  { id:4, label:"Modules" },
  { id:5, label:"Badge"   },
  { id:6, label:"Done"    },
];

const TOUR_SLIDES = [
  { title:"AI-Powered Matching",    desc:"Get matched instantly with projects that fit your exact skill set using our intelligent recommendation engine.", icon:"🤖", hint:"Skill Matching Engine"    },
  { title:"Skill Certifications",   desc:"Verify your expertise with proctored online tests. Earn certificates recognised nationwide.",                  icon:"🎓", hint:"Certification Module"   },
  { title:"Escrow Payments",        desc:"Every rupee is protected. Funds are held in escrow until the job is delivered and approved.",                  icon:"💳", hint:"Secure Escrow System"   },
  { title:"Gamified Growth",        desc:"Earn XP, unlock badges, climb leaderboards, and level up your professional reputation.",                      icon:"🏆", hint:"Gamification Engine"    },
  { title:"Team Collaboration",     desc:"Shared workspaces, Git integration, task boards, and real-time messaging ; all in one place.",                icon:"🤝", hint:"Collaboration Suite"    },
];

const MODULES = [
  { n:1,  name:"User Identity & Portfolio",           icon:"🪪" },
  { n:2,  name:"Skill Testing & Certification",        icon:"📜" },
  { n:3,  name:"Project & Git Marketplace",            icon:"🛒" },
  { n:4,  name:"AI Matching & Recommendation",         icon:"🤖" },
  { n:5,  name:"Collaboration & Team Workspace",       icon:"🤝" },
  { n:6,  name:"Communication",                        icon:"💬" },
  { n:7,  name:"Payment & Escrow Management",          icon:"💳" },
  { n:8,  name:"Dispute & Conflict Resolution",        icon:"⚖️" },
  { n:9,  name:"Analytics & System Governance",        icon:"📊" },
  { n:10, name:"Social Impact & Volunteering",         icon:"🌱" },
  { n:11, name:"Freelancer Engagement & Gamification", icon:"🎮" },
  { n:12, name:"Hardware & Asset Rental",              icon:"🖥️" },
];

const WHO_WE_ARE = [
  { icon:"🇵🇰", title:"Pakistan's National Platform", desc:"Built to empower every Pakistani freelancer — from Karachi to Gilgit — with verified skills and fair opportunities." },
  { icon:"🔐",  title:"Verified & Trusted",           desc:"CNIC-linked identity verification, proctored skill tests, and escrow payments ensure every transaction is safe." },
  { icon:"🚀",  title:"Gamified Growth",              desc:"Level up, earn badges, and climb leaderboards. Your reputation grows with every completed project." },
  { icon:"🤝",  title:"Community First",              desc:"Social impact projects, volunteer missions, and a thriving network of 50,000+ professionals." },
];

const BADGE_TIERS = [
  { key:"pathfinder", icon:"🎯", name:"Pathfinder", xp:100,  color:"#0f6e56", bg:"#e0faf7", border:"#6bd8cb", desc:"Awarded for starting your SPM journey"         },
  { key:"explorer",   icon:"🧭", name:"Explorer",   xp:250,  color:"#264778", bg:"#dbe8ff", border:"#a9c7ff", desc:"Awarded for exploring all platform modules"     },
  { key:"certified",  icon:"⚡", name:"Certified",  xp:500,  color:"#b87400", bg:"#fff3d0", border:"#f0c060", desc:"Awarded when you pass your first skill test"    },
  { key:"pioneer",    icon:"🏆", name:"Pioneer",    xp:1000, color:"#7c1fa8", bg:"#f3e0ff", border:"#c07fd0", desc:"Awarded to early platform adopters"             },
];

/* ═══════════════════════════════════════════════════════════════
   API HELPERS — unchanged
═══════════════════════════════════════════════════════════════ */
const API_BASE = "http://localhost:5000";
// You'll need to get the actual user ID from your auth system
// For now, let's fetch from localStorage or context
const getCurrentUserId = () => {
    // Replace this with your actual auth logic
    const storedId = localStorage.getItem('userId');
    if (storedId) return parseInt(storedId);
    // For demo, return a test user ID (you should have this in your users table)
    return 1; 
};

async function apiPost(path, body, requiresAuth = true) {
    try {
        const headers = {
            "Content-Type": "application/json",
        };
        
        if (requiresAuth) {
            const userId = getCurrentUserId();
            headers["x-user-id"] = userId.toString();
        }
        
        const r = await fetch(`${API_BASE}${path}`, { 
            method: "POST", 
            headers: headers,
            body: JSON.stringify(body) 
        });
        
        if (!r.ok) {
            console.error(`API Error ${r.status}: ${path}`);
            return null;
        }
        
        return r.json();
    } catch (error) {
        console.error(`Fetch error for ${path}:`, error);
        return null;
    }
}

async function apiGet(path) {
    try {
        const userId = getCurrentUserId();
        const r = await fetch(`${API_BASE}${path}`, {
            headers: { "x-user-id": userId.toString() }
        });
        return r.ok ? r.json() : null;
    } catch { 
        return null; 
    }
}

/* ═══════════════════════════════════════════════════════════════
   STEP DOTS — unchanged
═══════════════════════════════════════════════════════════════ */
function StepDots({ current }) {
  return (
    <div style={{ display:"flex", alignItems:"center" }}>
      {STEPS.map((s,i) => {
        const done   = current > s.id;
        const active = current === s.id;
        return (
          <div key={s.id} style={{ display:"flex", alignItems:"center" }}>
            <div title={s.label} style={{
              width: active ? 28 : 20, height:20, borderRadius:10,
              background: active ? T.tertiaryFixed : done ? T.tertiaryFixedDim : "rgba(255,255,255,.18)",
              border:`1.5px solid ${active ? T.tertiaryFixed : done ? T.tertiaryFixedDim : "rgba(255,255,255,.28)"}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              transition:"all .35s cubic-bezier(.34,1.56,.64,1)",
            }}>
              {done
                ? <svg width="9" height="7" viewBox="0 0 9 7"><path d="M1 3.5L3.2 6 8 1" stroke={T.primary} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
                : <span style={{ fontSize:8, fontWeight:800, color: active ? T.primary : "rgba(255,255,255,.55)" }}>{s.id}</span>
              }
            </div>
            {i < STEPS.length-1 && (
              <div style={{ width:12, height:1.5, background: done ? T.tertiaryFixedDim : "rgba(255,255,255,.2)", transition:"background .4s" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD PLACEHOLDER CARD — unchanged
═══════════════════════════════════════════════════════════════ */
function DashCard({ label, sub, accent }) {
  return (
    <div style={{ background:"rgba(0,27,24,.5)", border:"1px solid rgba(137,245,231,.1)", borderRadius:8, padding:"10px 12px" }}>
      <div style={{ width:24, height:3, background:accent, borderRadius:2, marginBottom:7, opacity:.7 }} />
      <div style={{ fontSize:9, fontWeight:700, color:"rgba(137,245,231,.75)", textTransform:"uppercase", letterSpacing:".1em", marginBottom:3 }}>{label}</div>
      <div style={{ fontSize:8, color:"rgba(255,255,255,.38)", marginBottom:8 }}>{sub}</div>
      <div style={{ display:"flex", gap:4 }}>
        {[65,42,80].map((w,i)=>(
          <div key={i} style={{ height:2.5, width:`${w}%`, background:"rgba(137,245,231,.12)", borderRadius:2 }}/>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   NEXUS NAVBAR — from light.html
═══════════════════════════════════════════════════════════════ */
function NexusNavbar({ xp, backendOK, unreadCount, onBellClick }) {
  return (
    <header style={{
      height: 64, display:"flex", justifyContent:"space-between", alignItems:"center",
      width:"100%", padding:"0 32px",
      position:"sticky", top:0, zIndex:50,
      background: T.primary,
      borderBottom:`1px solid rgba(255,255,255,0.08)`,
      flexShrink: 0,
    }}>
      {/* Left: Logo + nav links */}
      <div style={{ display:"flex", alignItems:"center", gap:40 }}>
        <div style={{ display:"flex", flexDirection:"column" }}>
          <span style={{ fontFamily:"Manrope,sans-serif", fontSize:17, fontWeight:800, color:"#fff", textTransform:"uppercase", letterSpacing:"-0.02em", lineHeight:1 }}>Nexus Pro</span>
          <span style={{ fontSize:9, fontWeight:700, color:T.tertiaryFixedDim, letterSpacing:"0.2em", textTransform:"uppercase" }}>Professional</span>
        </div>
        <nav style={{ display:"flex", alignItems:"center", gap:32 }}>
          {["Overview","Marketplace","Network","Insights"].map((item,i) => (
            <a key={item} href="#" style={{
              fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em",
              color: i===0 ? "#fff" : "rgba(255,255,255,0.55)",
              textDecoration:"none",
              borderBottom: i===0 ? `2px solid ${T.tertiaryFixedDim}` : "none",
              paddingBottom: i===0 ? 2 : 0,
            }}>{item}</a>
          ))}
        </nav>
      </div>

      {/* Centre: search */}
      <div style={{ flex:1, maxWidth:380, margin:"0 40px" }}>
        <div style={{ position:"relative" }}>
          <input placeholder="Search insights and assets..." style={{
            width:"100%", background:"rgba(255,255,255,0.08)",
            color:"#fff", fontSize:13,
            padding:"7px 14px 7px 36px", borderRadius:8,
            border:"1px solid rgba(255,255,255,0.1)", outline:"none",
            fontFamily:"Inter,sans-serif",
          }} />
          <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", color:"rgba(255,255,255,0.35)", fontSize:14 }}>🔍</span>
        </div>
      </div>

      {/* Right: XP + backend indicator + profile */}
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        {/* XP pill */}
        <div style={{ display:"flex", alignItems:"center", gap:4, background:"rgba(137,245,231,.1)", border:"1px solid rgba(137,245,231,.18)", borderRadius:12, padding:"4px 10px" }}>
          <span style={{ fontSize:9, fontWeight:700, color:T.tertiaryFixed, letterSpacing:".1em" }}>XP</span>
          <span style={{ fontFamily:"Manrope,sans-serif", fontSize:12, fontWeight:900, color:"#fff" }}>{xp}</span>
        </div>
        {/* Backend live dot */}
        {backendOK && (
          <div style={{ width:6, height:6, borderRadius:"50%", background:T.tertiaryFixed, boxShadow:`0 0 5px ${T.tertiaryFixed}`, animation:"pulse 2s infinite" }} title="Backend live"/>
        )}
        {/* Bell */}
        <button onClick={onBellClick} style={{ width:36, height:36, borderRadius:"50%", background:"none", border:"none", color:"rgba(255,255,255,0.6)", cursor:"pointer", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
          🔔
          {unreadCount > 0 && <span style={{ position:"absolute", top:6, right:6, width:8, height:8, background:T.error, borderRadius:"50%" }} />}
        </button>
        <button style={{ width:36, height:36, borderRadius:"50%", background:"none", border:"none", color:"rgba(255,255,255,0.6)", cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>❓</button>
        {/* Divider */}
        <div style={{ width:1, height:32, background:"rgba(255,255,255,0.1)", margin:"0 4px" }} />
        {/* User */}
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:10, fontWeight:700, color:"#fff", textTransform:"uppercase", letterSpacing:"0.08em" }}>A. Sterling</div>
          <div style={{ fontSize:9, fontWeight:500, color:"rgba(255,255,255,0.45)", textTransform:"uppercase" }}>Enterprise Admin</div>
        </div>
        <div style={{ width:36, height:36, borderRadius:8, background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>👤</div>
      </div>
    </header>
  );
}

/* ═══════════════════════════════════════════════════════════════
   NEXUS SIDEBAR — from light.html
═══════════════════════════════════════════════════════════════ */
function NexusSidebar() {
  const items = [
    { icon:"⊞",  label:"Overview",  active:true  },
    { icon:"📁", label:"Portfolio", active:false },
    { icon:"⬡",  label:"Network",   active:false },
    { icon:"📈", label:"Analytics", active:false },
    { icon:"📄", label:"Documents", active:false },
  ];
  return (
    <aside style={{
      width:224, flexShrink:0,
      background:`rgba(240,243,255,0.55)`,
      backdropFilter:"blur(20px) saturate(0.85)",
      WebkitBackdropFilter:"blur(20px) saturate(0.85)",
      borderRight:`1px solid rgba(196,198,208,0.4)`,
      display:"flex", flexDirection:"column",
      padding:16,
      height:"100%",
    }}>
      <div style={{ padding:"0 12px", marginBottom:16 }}>
        <span style={{ fontSize:9, fontWeight:700, letterSpacing:"0.18em", textTransform:"uppercase", color:T.outline }}>Navigation</span>
      </div>
      <nav style={{ flex:1, display:"flex", flexDirection:"column", gap:2 }}>
        {items.map(item => (
          <a key={item.label} href="#" style={{
            display:"flex", alignItems:"center", gap:12,
            padding:"10px 12px", borderRadius:8, textDecoration:"none",
            background: item.active ? T.surfaceLowest : "transparent",
            color: item.active ? T.tertiary : T.secondary,
            fontFamily:"Inter,sans-serif", fontWeight:700,
            fontSize:11, letterSpacing:"0.06em", textTransform:"uppercase",
            boxShadow: item.active ? "0 1px 4px rgba(0,23,54,0.1)" : "none",
            transition:"all 0.15s",
          }}
            onMouseEnter={e => { if (!item.active) { e.currentTarget.style.background = T.surfaceHigh; e.currentTarget.style.color = T.primary; } }}
            onMouseLeave={e => { if (!item.active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.secondary; } }}
          >
            <span style={{ fontSize:16, width:20, textAlign:"center" }}>{item.icon}</span>
            {item.label}
          </a>
        ))}
      </nav>
      <div style={{ marginTop:"auto", display:"flex", flexDirection:"column", gap:6 }}>
        <button style={{
          width:"100%", padding:"12px 0",
          background: T.primary, color:"#fff",
          border:"none", borderRadius:8,
          fontFamily:"Inter,sans-serif", fontWeight:700,
          fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase",
          cursor:"pointer", boxShadow:"0 2px 8px rgba(0,23,54,0.2)",
        }}>Create Project</button>
        <div style={{ height:1, background:T.outlineVar, margin:"4px 0" }} />
        {[{ icon:"⚙", label:"Settings" }, { icon:"❓", label:"Support" }].map(item => (
          <a key={item.label} href="#" style={{
            display:"flex", alignItems:"center", gap:10,
            padding:"8px 12px", borderRadius:8,
            color: T.secondary, textDecoration:"none",
            fontFamily:"Inter,sans-serif", fontWeight:600,
            fontSize:11, letterSpacing:"0.06em", textTransform:"uppercase",
            transition:"color 0.15s",
          }}
            onMouseEnter={e => e.currentTarget.style.color = T.primary}
            onMouseLeave={e => e.currentTarget.style.color = T.secondary}
          >
            <span style={{ fontSize:15 }}>{item.icon}</span> {item.label}
          </a>
        ))}
      </div>
    </aside>
  );
}

/* ═══════════════════════════════════════════════════════════════
   NOTIFICATION PANEL
═══════════════════════════════════════════════════════════════ */
function NotificationPanel({ notifications, onMarkRead, onMarkAll, onClose }) {
  const typeIcon = { points:"⭐", level:"⬆️", badge:"🏅", challenge:"🎯" };
  return (
    <div style={{
      position:"fixed", top:64, right:0, width:340, bottom:0,
      background:"#ffffff",
      boxShadow:"-4px 0 20px rgba(0,23,54,0.1)",
      zIndex:200, display:"flex", flexDirection:"column",
      borderLeft:"1px solid #e4e8f0",
      animation:"slideIn .22s ease both",
    }}>
      <div style={{ padding:"14px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid #e4e8f0", background:"#f0f3ff" }}>
        <span style={{ fontFamily:"Manrope,sans-serif", fontWeight:800, fontSize:15, color:"#001736" }}>Notifications</span>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onMarkAll} style={{ background:"#001736", color:"#fff", border:"none", borderRadius:6, padding:"4px 10px", fontFamily:"Inter,sans-serif", fontSize:11, fontWeight:700, cursor:"pointer" }}>Mark all read</button>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"#747780" }}>×</button>
        </div>
      </div>
      <div style={{ flex:1, overflowY:"auto" }}>
        {notifications.length === 0
          ? <div style={{ padding:32, textAlign:"center", color:"#747780", fontFamily:"Inter,sans-serif", fontSize:13 }}>No notifications</div>
          : notifications.map(n => (
            <div key={n.notification_id}
              onClick={() => !n.is_read && onMarkRead(n.notification_id)}
              style={{ padding:"12px 20px", borderBottom:"1px solid rgba(196,198,208,0.3)", background: n.is_read ? "#ffffff" : "#f0f3ff", cursor: n.is_read ? "default" : "pointer", display:"flex", gap:12, alignItems:"flex-start" }}
            >
              <span style={{ fontSize:16, flexShrink:0 }}>{typeIcon[n.type] || "🔔"}</span>
              <div>
                <div style={{ fontFamily:"Inter,sans-serif", fontSize:12, color:"#111c2d", fontWeight: n.is_read ? 400 : 600, lineHeight:"18px" }}>{n.message}</div>
                <div style={{ fontFamily:"Inter,sans-serif", fontSize:10, color:"#747780", marginTop:3 }}>
                  {new Date(n.created_at).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}
                  {!n.is_read && <span style={{ marginLeft:6, color:"#007a6e", fontWeight:700, fontSize:9 }}>● NEW</span>}
                </div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT — all step logic unchanged
═══════════════════════════════════════════════════════════════ */
export default function SPMOnboarding() {
  const [step, setStep]               = useState(1);
  const [slide, setSlide]             = useState(0);
  const [role, setRole]               = useState("");
  const [selMods, setSelMods]         = useState(new Set());
  const [earnedBadge, setEarnedBadge] = useState(null);
  const [xp, setXp]                   = useState(0);
  const [backendOK, setBackendOK]     = useState(false);
  const [paneKey, setPaneKey]         = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [showPanel,     setShowPanel]     = useState(false);

  const isDark = step === 1 || step === 6;

  useEffect(() => { apiGet("/health").then(d => setBackendOK(!!d)); }, []);

  // ── Fetch notifications ───────────────────────────────────
const fetchNotifications = useCallback(async () => {
  try {
    const [nr, cr] = await Promise.all([
      fetch(`${API_BASE}/api/notifications/u001`, { headers: { "x-user-id": "u001" } }),  // Changed from "1" to "u001"
      fetch(`${API_BASE}/api/notifications/u001/unread-count`, { headers: { "x-user-id": "u001" } }),
    ]);
    if (nr.ok) { const d = await nr.json(); if (d.success) setNotifications(d.notifications || []); }
    if (cr.ok) { const d = await cr.json(); if (d.success) setUnreadCount(d.unread_count || 0); }
  } catch { /* silent */ }
}, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markRead = async (id) => {
    try {
      await fetch(`${API_BASE}/api/notifications/1/${id}/read`, { method: "PUT", headers: { "x-user-id": "1" } });
      setNotifications(p => p.map(n => n.notification_id === id ? { ...n, is_read: true } : n));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await fetch(`${API_BASE}/api/notifications/1/read-all`, { method: "PUT", headers: { "x-user-id": "1" } });
      setNotifications(p => p.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  };

  function goTo(s) { setPaneKey(k=>k+1); setStep(s); }
 /* function next()  {

    // ── Step 2 → 3: Award points for viewing "Who We Are" ──
    if (step === 2 && backendOK) {
      apiPost("/api/gamification/points/award", {
        user_id:     1,
        action_type: "onboarding_about",
        points:      50,
      });
    }

    // ── Step 3 → 4: Role selected — award 100 XP ──────────
    if (step === 3 && role && backendOK) {
      apiPost("/api/gamification/points/award", {
        user_id:     1,
        action_type: "onboarding_role_selected",
        points:      100,
      });
      // Notify user about role selection
      apiPost("/api/notifications/send", {
        user_id:           1,
        notification_type: "points",
        title:             "Role Selected!",
        message:           `You selected the ${role} role and earned 100 XP!`,
      });
    }

    // ── Step 4 → 5: Modules selected — award XP + badge ───
    if (step === 4) {
      const key    = selMods.size >= 5 ? "explorer" : "pathfinder";
      const badgeXP = BADGE_TIERS.find(b => b.key === key)?.xp || 100;
      const modXP  = selMods.size * 10;

      setEarnedBadge(key);
      setXp(x => x + badgeXP + modXP);

      if (backendOK) {
        // Award module selection XP
        if (modXP > 0) {
          apiPost("/api/gamification/points/award", {
            user_id:     1,
            action_type: "onboarding_modules_selected",
            points:      modXP,
          });
        }
        // Award badge XP
        apiPost("/api/gamification/points/award", {
          user_id:     1,
          action_type: "onboarding_badge_earned",
          points:      badgeXP,
        });
        // Send badge notification via correct endpoint
        apiPost("/api/notifications/send", {
          user_id:           1,
          notification_type: "badge",
          title:             "Badge Unlocked!",
          message:           `You earned the ${key.charAt(0).toUpperCase() + key.slice(1)} badge during onboarding! +${badgeXP} XP`,
        });
        // Evaluate badges automatically — triggers RISING_STAR etc if conditions met
        fetch(`http://localhost:5000/api/gamification/points/award`, {
          method:  "POST",
          headers: { "Content-Type": "application/json", "x-user-id": "1" },
          body:    JSON.stringify({ user_id: 1, action_type: "evaluate_badges", points: 0 }),
        }).catch(() => {});
      }
    }

    if (step < 6) goTo(step + 1);
  }*/

  // Update the next() function in your main component
  function next() {
      const userId = getCurrentUserId();
      
      // Step 2 → 3: Award points for viewing "Who We Are"
      if (step === 2 && backendOK) {
          apiPost("/api/gamification/onboarding/complete-step", {
              stepCode: "ABOUT",
              stepData: { viewed: true }
          }).then(result => {
              if (result?.success) {
                  setXp(prev => prev + result.data.pointsAwarded);
              }
          });
      }

      // Step 3 → 4: Role selected — award XP
      if (step === 3 && role && backendOK) {
          apiPost("/api/gamification/onboarding/select-role", {
              role: role.toLowerCase()
          }).then(result => {
              if (result?.success) {
                  setXp(prev => prev + result.pointsAwarded);
              }
          });
          
          // Create notification (using existing notification system)
          apiPost("/api/notifications/send", {
              user_id: userId,
              type: "badge",
              message: `You selected the ${role} role and earned 100 XP!`
          });
      }

      // Step 4 → 5: Modules selected — award XP + badge
      if (step === 4) {
          const modXP = selMods.size * 10;
          const hasExplorer = selMods.size >= 5;
          const explorerBonus = hasExplorer ? 50 : 0;
          
          apiPost("/api/gamification/onboarding/complete-step", {
              stepCode: "MODULES",
              stepData: {
                  moduleCount: selMods.size,
                  modules: Array.from(selMods),
                  hasExplorerBonus: hasExplorer
              }
          }).then(result => {
              if (result?.success) {
                  const totalXP = modXP + explorerBonus;
                  setXp(prev => prev + totalXP);
                  
                  // Trigger badge evaluation
                  if (hasExplorer) {
                      setEarnedBadge("explorer");
                      apiPost("/api/gamification/points/award", {
                          user_id: userId,
                          action_type: "evaluate_badges",
                          points: 0
                      });
                  } else {
                      setEarnedBadge("pathfinder");
                  }
              }
          });
      }

      if (step < 6) goTo(step + 1);
  }
  function back()  { if (step > 1) goTo(step-1); }
  function skip()  { goTo(6); }

  /* ── ONBOARDING INNER NAVBAR (step dots + XP) ── */
  const OnboardingNav = () => (
    <div style={{
      height:44, flexShrink:0,
      background: isDark ? "rgba(0,23,54,.96)" : T.surfaceLow,
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"0 18px",
      borderBottom:`1px solid ${isDark ? "rgba(137,245,231,.07)" : T.outlineVar}`,
    }}>
      <div style={{ fontSize:11, fontWeight:700, color: isDark ? "rgba(137,245,231,.6)" : T.secondary, letterSpacing:"0.1em", textTransform:"uppercase" }}>
        {STEPS.find(s => s.id === step)?.label || "Onboarding"}
      </div>
      {step >= 2 && step <= 5 && <StepDots current={step} />}
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        {step >= 2 && step <= 5 && (
          <div style={{ display:"flex", alignItems:"center", gap:4, background:"rgba(137,245,231,.1)", border:"1px solid rgba(137,245,231,.18)", borderRadius:12, padding:"3px 9px" }}>
            <span style={{ fontSize:8, fontWeight:700, color:T.tertiaryFixed, letterSpacing:".1em" }}>XP</span>
            <span style={{ fontFamily:"Manrope,sans-serif", fontSize:11, fontWeight:900, color: isDark ? "#fff" : T.primary }}>{xp}</span>
          </div>
        )}
      </div>
    </div>
  );

  /* ── FOOTER ── */
  const Footer = ({ onNext, label="Continue", canNext=true, showBack=true }) => (
    <div style={{
      flexShrink:0, display:"flex", justifyContent:"space-between", alignItems:"center",
      padding:"11px 22px 16px",
      background: T.surface,
      borderTop:`1px solid ${T.outlineVar}`,
    }}>
      <button onClick={back} style={{
        visibility: showBack && step > 1 ? "visible":"hidden",
        fontFamily:"Inter,sans-serif", fontSize:9.5, fontWeight:700, color:T.secondary,
        textTransform:"uppercase", letterSpacing:".12em", background:"none", border:"none", cursor:"pointer", padding:"8px 0",
      }}>← Back</button>
      <button onClick={onNext} disabled={!canNext} style={{
        fontFamily:"Manrope,sans-serif", fontSize:9.5, fontWeight:800, textTransform:"uppercase", letterSpacing:".12em",
        color:"#fff", background: canNext ? T.primary : T.outline,
        border:"none", borderRadius:8, padding:"9px 22px", cursor: canNext?"pointer":"not-allowed",
        display:"flex", alignItems:"center", gap:6, opacity: canNext?1:.55, transition:"all .2s",
      }}>
        {label}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5h6M5.5 2.5L8 5 5.5 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
    </div>
  );

  /* ── ALL STEPS — completely unchanged ── */
  const Step1 = () => {
    const cur = TOUR_SLIDES[slide];
    return (
      <div style={{ flex:1, position:"relative", overflow:"hidden", background:"#060f1c" }}>
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(130deg,#001736 0%,#001b18 55%,#002b5b 100%)" }}>
          <div style={{ position:"absolute", inset:0, display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, padding:"14px" }}>
            <DashCard label="Leaderboard"    sub="Weekly ranking · Module 11"  accent={T.tertiaryFixed}    />
            <DashCard label="Trust Score"    sub="Calculating from your data"   accent="#a9c7ff"            />
            <DashCard label="Notifications"  sub="3 unread events pending"      accent="#f0c060"            />
            <DashCard label="Skill Tests"    sub="2 certification tests queued" accent={T.tertiaryFixed}    />
            <DashCard label="Projects"       sub="Module 3 — Marketplace"       accent="#a9c7ff"            />
            <DashCard label="XP Progress"    sub="Level 2 · Rising Pro"         accent="#f0c060"            />
          </div>
          <div style={{ position:"absolute", inset:0, backdropFilter:"blur(11px)", background:"rgba(6,15,28,.74)" }} />
        </div>
        <div style={{
          position:"absolute", top:"50%", left:"50%",
          transform:"translate(-50%, -50%)", width:288,
          background:"rgba(249,249,255,.97)", borderRadius:13,
          boxShadow:"0 20px 60px rgba(0,0,0,.5), 0 4px 14px rgba(0,0,0,.3)",
          border:"1px solid rgba(255,255,255,.85)", overflow:"hidden",
          animation:"modalIn .42s cubic-bezier(.34,1.56,.64,1) forwards",
        }}>
          <div style={{ background:T.primary, padding:"11px 14px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <div style={{ fontFamily:"Manrope,sans-serif", fontSize:10, fontWeight:900, color:"#fff", textTransform:"uppercase", letterSpacing:".09em" }}>Platform Tour</div>
              <div style={{ fontSize:8, color:T.tertiaryFixedDim, letterSpacing:".16em", textTransform:"uppercase", marginTop:1 }}>{slide+1} of {TOUR_SLIDES.length}</div>
            </div>
            <button onClick={()=>{ if(slide<TOUR_SLIDES.length-1) setSlide(i=>i+1); else next(); }} style={{ width:24, height:24, borderRadius:"50%", background:T.tertiaryFixed, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M2 4.5h5M4.5 2.5L6.5 4.5 4.5 6.5" stroke={T.primary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
          <div style={{ display:"flex", gap:8, padding:"12px 12px 8px" }}>
            <div style={{ width:88, height:72, borderRadius:8, background:T.surfaceContainer, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:5, flexShrink:0, border:`1px solid ${T.outlineVar}` }}>
              <span style={{ fontSize:26 }}>{cur.icon}</span>
              <div style={{ width:38, height:2.5, background:T.tertiaryFixedDim, borderRadius:2, opacity:.8 }} />
            </div>
            <div style={{ flex:1, height:72, borderRadius:8, background:`linear-gradient(135deg, ${T.primary} 0%, #001b18 100%)`, border:`1px solid rgba(137,245,231,.18)`, position:"relative", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
              <style>{`
                @keyframes illuPulse{0%,100%{transform:scale(1);opacity:.8}50%{transform:scale(1.1);opacity:1}}
                @keyframes illuSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
                @keyframes illuBar0{0%,100%{height:8px;y:36px}50%{height:18px;y:26px}}
              `}</style>
              {slide===0&&<svg width="80" height="60" viewBox="0 0 80 60" style={{animation:"illuPulse 2.4s ease-in-out infinite"}}>
                <circle cx="40" cy="28" r="7" fill="none" stroke={T.tertiaryFixed} strokeWidth="1.2" opacity=".9"/>
                <circle cx="40" cy="28" r="14" fill="none" stroke={T.tertiaryFixedDim} strokeWidth=".5" strokeDasharray="3 3" opacity=".45"/>
                {[[14,10],[66,10],[14,46],[66,46],[40,5],[40,51]].map(([x,y],i)=>(
                  <g key={i}><line x1="40" y1="28" x2={x} y2={y} stroke={T.tertiaryFixedDim} strokeWidth=".8" opacity=".4"/><circle cx={x} cy={y} r="3" fill={i%2===0?"#a9c7ff":T.tertiaryFixed} opacity=".85"/></g>
                ))}
                <circle cx="40" cy="28" r="3.5" fill={T.tertiaryFixed}/>
                <text x="40" y="58" textAnchor="middle" fontSize="6" fontWeight="700" fill={T.tertiaryFixedDim} letterSpacing=".08em" fontFamily="Inter,sans-serif">{cur.hint}</text>
              </svg>}
              {slide===1&&<svg width="80" height="60" viewBox="0 0 80 60" style={{animation:"illuPulse 2.2s ease-in-out infinite"}}>
                <path d="M40 6L52 12L52 28Q52 42 40 50Q28 42 28 28L28 12Z" fill="none" stroke={T.tertiaryFixed} strokeWidth="1.4" opacity=".9"/>
                <path d="M34 28L38 32L46 22" stroke={T.tertiaryFixed} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <circle cx="40" cy="28" r="18" fill="none" stroke={T.tertiaryFixedDim} strokeWidth=".5" strokeDasharray="2 4" opacity=".35"/>
                <text x="40" y="58" textAnchor="middle" fontSize="6" fontWeight="700" fill={T.tertiaryFixedDim} letterSpacing=".08em" fontFamily="Inter,sans-serif">{cur.hint}</text>
              </svg>}
              {slide===2&&<svg width="80" height="60" viewBox="0 0 80 60" style={{animation:"illuPulse 2s ease-in-out infinite"}}>
                <rect x="24" y="24" width="32" height="22" rx="3" fill="none" stroke={T.tertiaryFixed} strokeWidth="1.3"/>
                <path d="M32 24L32 18Q32 12 40 12Q48 12 48 18L48 24" fill="none" stroke={T.tertiaryFixed} strokeWidth="1.3"/>
                <circle cx="40" cy="35" r="4" fill="none" stroke={T.tertiaryFixedDim} strokeWidth="1.2"/>
                <line x1="40" y1="39" x2="40" y2="43" stroke={T.tertiaryFixedDim} strokeWidth="1.2"/>
                {[16,28,52,64].map((x,i)=><circle key={i} cx={x} cy="31" r="2" fill="#a9c7ff" opacity=".4"/>)}
                <text x="40" y="58" textAnchor="middle" fontSize="6" fontWeight="700" fill={T.tertiaryFixedDim} letterSpacing=".08em" fontFamily="Inter,sans-serif">{cur.hint}</text>
              </svg>}
              {slide===3&&<svg width="80" height="60" viewBox="0 0 80 60">
                {[{x:14,h:12},{x:24,h:20},{x:34,h:16},{x:44,h:26},{x:54,h:18},{x:64,h:30}].map(({x,h},i)=>(
                  <rect key={i} x={x-4} y={42-h} width="8" height={h} rx="1.5" fill={i%2===0?T.tertiaryFixed:"#a9c7ff"} opacity=".85" style={{animation:`illuPulse ${1.5+i*.2}s ${i*.15}s ease-in-out infinite`}}/>
                ))}
                <line x1="8" y1="42" x2="72" y2="42" stroke={T.outlineVar} strokeWidth=".8" opacity=".5"/>
                <text x="40" y="58" textAnchor="middle" fontSize="6" fontWeight="700" fill={T.tertiaryFixedDim} letterSpacing=".08em" fontFamily="Inter,sans-serif">{cur.hint}</text>
              </svg>}
              {slide===4&&<svg width="80" height="60" viewBox="0 0 80 60" style={{animation:"illuPulse 2.6s ease-in-out infinite"}}>
                {[[40,26],[18,14],[62,14],[18,40],[62,40]].map(([cx,cy],i)=>(
                  <g key={i}>{i>0&&<line x1="40" y1="26" x2={cx} y2={cy} stroke={T.tertiaryFixedDim} strokeWidth=".9" opacity=".5"/>}<circle cx={cx} cy={cy} r={i===0?6:4} fill={i===0?T.tertiaryFixed:"#a9c7ff"} opacity={i===0?1:.8}/></g>
                ))}
                <line x1="18" y1="14" x2="62" y2="14" stroke={T.tertiaryFixedDim} strokeWidth=".6" strokeDasharray="2 2" opacity=".3"/>
                <line x1="18" y1="40" x2="62" y2="40" stroke={T.tertiaryFixedDim} strokeWidth=".6" strokeDasharray="2 2" opacity=".3"/>
                <text x="40" y="58" textAnchor="middle" fontSize="6" fontWeight="700" fill={T.tertiaryFixedDim} letterSpacing=".08em" fontFamily="Inter,sans-serif">{cur.hint}</text>
              </svg>}
            </div>
          </div>
          <div style={{ display:"flex", justifyContent:"center", gap:5, paddingBottom:8 }}>
            {TOUR_SLIDES.map((_,i) => (
              <div key={i} onClick={()=>setSlide(i)} style={{ width: i===slide?14:5, height:5, borderRadius:3, background: i===slide ? T.primary : T.outlineVar, cursor:"pointer", transition:"all .3s" }}/>
            ))}
          </div>
          <div style={{ padding:"0 12px 10px" }}>
            <div style={{ fontFamily:"Manrope,sans-serif", fontSize:13, fontWeight:800, color:T.primary, marginBottom:4 }}>{cur.title}</div>
            <div style={{ fontSize:9.5, color:T.onSurfaceVar, lineHeight:1.65 }}>{cur.desc}</div>
          </div>
          <div style={{ padding:"8px 12px 12px", display:"flex", justifyContent:"space-between", alignItems:"center", borderTop:`1px solid ${T.outlineVar}` }}>
            <button onClick={()=>setSlide(i=>Math.max(0,i-1))} style={{ fontSize:8.5, fontWeight:700, color:T.secondary, textTransform:"uppercase", letterSpacing:".1em", background:"none", border:"none", cursor:"pointer", opacity:slide===0?.3:1 }}>← Prev</button>
            <button onClick={skip} style={{ fontSize:8.5, fontWeight:700, color:T.secondary, textTransform:"uppercase", letterSpacing:".1em", background:"none", border:`1px solid ${T.outlineVar}`, borderRadius:5, padding:"3px 9px", cursor:"pointer" }}>Skip</button>
            <button onClick={()=>{ if(slide<TOUR_SLIDES.length-1) setSlide(i=>i+1); else next(); }} style={{ fontFamily:"Manrope,sans-serif", fontSize:8.5, fontWeight:800, color:"#fff", background:T.primary, border:"none", borderRadius:6, padding:"5px 13px", cursor:"pointer", textTransform:"uppercase", letterSpacing:".1em" }}>
              {slide===TOUR_SLIDES.length-1 ? "Begin →" : "Next →"}
            </button>
          </div>
        </div>
        <div style={{ position:"absolute", bottom:14, left:"50%", transform:"translateX(-50%)", fontSize:8.5, color:"rgba(137,245,231,.3)", letterSpacing:".14em", textTransform:"uppercase", whiteSpace:"nowrap" }}>
          {slide+1} / {TOUR_SLIDES.length} · Click dots or arrows to navigate
        </div>
      </div>
    );
  };

  const Step2 = () => (
    <div key={paneKey} className="pane" style={{ flex:1, overflowY:"auto", padding:"40px 10% 40px" }}>
      <div style={{ fontSize:8.5, fontWeight:700, color:T.secondary, letterSpacing:".16em", textTransform:"uppercase", marginBottom:5, display:"flex", alignItems:"center", gap:5 }}>
        About Us <span style={{ background:T.secondaryContainer, color:T.primaryContainer, fontSize:7.5, fontWeight:700, borderRadius:4, padding:"1.5px 6px" }}>Step 2</span>
      </div>
      <div style={{ fontFamily:"Manrope,sans-serif", fontSize:21, fontWeight:900, color:T.primary, lineHeight:1.2, marginBottom:4 }}>Who We <span style={{ color:"#0f6e56" }}>Are</span></div>
      <div style={{ fontSize:11.5, color:T.onSurfaceVar, lineHeight:1.65, marginBottom:16, maxWidth:500 }}>SPM Nexus is Pakistan's national freelance and skill verification system — a government-aligned platform connecting verified talent with real opportunities across every province.</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9, marginBottom:14 }}>
        {WHO_WE_ARE.map((w,i) => (
          <div key={i} style={{ background:T.surfaceLow, border:`1.5px solid ${T.outlineVar}`, borderRadius:11, padding:"13px 14px" }}>
            <div style={{ fontSize:20, marginBottom:7 }}>{w.icon}</div>
            <div style={{ fontFamily:"Manrope,sans-serif", fontSize:11.5, fontWeight:800, color:T.primary, marginBottom:4 }}>{w.title}</div>
            <div style={{ fontSize:9.5, color:T.onSurfaceVar, lineHeight:1.6 }}>{w.desc}</div>
          </div>
        ))}
      </div>
      <div style={{ background:T.primary, borderRadius:10, padding:"11px 16px", display:"flex" }}>
        {[["50,000+","Freelancers"],["12","Modules"],["100%","Escrow Safe"],["4.9★","Rating"]].map(([v,l],i,arr)=>(
          <div key={i} style={{ flex:1, textAlign:"center", borderRight:i<arr.length-1?"1px solid rgba(255,255,255,.1)":"none" }}>
            <div style={{ fontFamily:"Manrope,sans-serif", fontSize:14, fontWeight:900, color:T.tertiaryFixed }}>{v}</div>
            <div style={{ fontSize:7.5, fontWeight:700, color:"rgba(137,245,231,.55)", textTransform:"uppercase", letterSpacing:".1em", marginTop:2 }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const Step3 = () => (
    <div key={paneKey} className="pane" style={{ flex:1, overflowY:"auto", padding:"20px 22px 10px" }}>
      <div style={{ fontSize:8.5, fontWeight:700, color:T.secondary, letterSpacing:".16em", textTransform:"uppercase", marginBottom:5, display:"flex", alignItems:"center", gap:5 }}>
        Step 3 of 6 <span style={{ background:"#fff8e1", color:"#b87400", fontSize:7.5, fontWeight:700, borderRadius:4, padding:"1.5px 6px", border:"1px solid #f0c060" }}>+100 XP</span>
      </div>
      <div style={{ fontFamily:"Manrope,sans-serif", fontSize:21, fontWeight:900, color:T.primary, lineHeight:1.2, marginBottom:4 }}>Choose your <span style={{ color:"#0f6e56" }}>role</span></div>
      <div style={{ fontSize:11.5, color:T.onSurfaceVar, marginBottom:14 }}>Select how you'll use SPM Nexus. Each role unlocks different features and a unique badge.</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:9, marginBottom:13 }}>
        {[
          { r:"Freelancer", icon:"💼", desc:"Offer your skills and win verified projects",   badge:"Pathfinder Badge" },
          { r:"Client",     icon:"🏢", desc:"Post projects and hire Pakistan's best talent",  badge:"Employer Badge"  },
          { r:"Admin",      icon:"🛡️", desc:"Govern, moderate, and manage the platform",      badge:"Guardian Badge"  },
        ].map(item=>{
          const sel = role===item.r;
          return (
            <div key={item.r} onClick={()=>{ if(!sel){ setRole(item.r); setXp(x=>x+100); } }} style={{
              border:`2px solid ${sel ? T.primary : T.outlineVar}`,
              borderRadius:11, padding:"16px 10px 13px", cursor:"pointer",
              background: sel ? T.surfaceContainer : T.surface,
              textAlign:"center", transition:"all .22s",
              transform: sel?"translateY(-2px)":"none",
              boxShadow: sel?"0 6px 18px rgba(0,23,54,.11)":"none",
            }}>
              <div style={{ fontSize:26, marginBottom:9 }}>{item.icon}</div>
              <div style={{ fontFamily:"Manrope,sans-serif", fontSize:10.5, fontWeight:900, color:T.primary, textTransform:"uppercase", letterSpacing:".06em", marginBottom:4 }}>{item.r}</div>
              <div style={{ fontSize:9.5, color:T.onSurfaceVar, lineHeight:1.55, marginBottom:8 }}>{item.desc}</div>
              <div style={{ display:"inline-block", fontSize:7.5, fontWeight:700, color:"#0f6e56", background:"#e6f4ef", borderRadius:4, padding:"2px 6px", letterSpacing:".05em" }}>{item.badge}</div>
            </div>
          );
        })}
      </div>
      <div style={{ background:T.surfaceContainer, border:`1px solid ${T.secondaryContainer}`, borderRadius:9, padding:"9px 13px", display:"flex", alignItems:"center", gap:9 }}>
        <span style={{ fontSize:15 }}>📋</span>
        <span style={{ fontSize:10.5, fontWeight:600, color:T.primaryContainer, flex:1 }}>Mission: Select your role to unlock your personalised dashboard path</span>
        <span style={{ fontSize:9.5, fontWeight:700, color:"#0f6e56", whiteSpace:"nowrap" }}>+100 XP</span>
      </div>
    </div>
  );

  const Step4 = () => {
    const modXP = selMods.size * 10 + (selMods.size >= 5 ? 50 : 0);
    function toggle(n) {
      setSelMods(prev => {
        const next = new Set(prev);
        if(next.has(n)){ next.delete(n); setXp(x=>Math.max(0,x-10)); }
        else            { next.add(n);   setXp(x=>x+10); }
        return next;
      });
    }
    return (
      <div key={paneKey} className="pane" style={{ flex:1, display:"flex", flexDirection:"column", padding:"18px 22px 8px", overflow:"hidden" }}>
        <div style={{ fontSize:8.5, fontWeight:700, color:T.secondary, letterSpacing:".16em", textTransform:"uppercase", marginBottom:4, display:"flex", alignItems:"center", gap:5 }}>
          Step 4 of 6 <span style={{ background:T.secondaryContainer, color:T.primaryContainer, fontSize:7.5, fontWeight:700, borderRadius:4, padding:"1.5px 6px" }}>+10 XP each</span>
        </div>
        <div style={{ fontFamily:"Manrope,sans-serif", fontSize:19, fontWeight:900, color:T.primary, marginBottom:3 }}>Explore <span style={{ color:"#0f6e56" }}>modules</span></div>
        <div style={{ fontSize:11, color:T.onSurfaceVar, marginBottom:8 }}>Select the platform modules you want access to.</div>
        <div style={{ background:T.surfaceContainer, border:`1px solid ${T.secondaryContainer}`, borderRadius:8, padding:"7px 11px", display:"flex", alignItems:"center", gap:7, marginBottom:8, flexShrink:0 }}>
          <span>🏅</span>
          <span style={{ fontSize:9.5, fontWeight:600, color:T.primaryContainer, flex:1 }}>Select 5+ modules to unlock the Explorer Badge</span>
          <span style={{ fontSize:8.5, fontWeight:700, color:"#0f6e56", whiteSpace:"nowrap" }}>+50 XP bonus</span>
        </div>
        <div style={{ fontSize:8.5, color:T.secondary, marginBottom:6, flexShrink:0 }}>
          Selected: <strong style={{ color:"#0f6e56" }}>{selMods.size}</strong> of 12 · <strong style={{ color:"#0f6e56" }}>{modXP} XP</strong>
        </div>
        <div style={{ flex:1, overflowY:"auto", display:"grid", gridTemplateColumns:"1fr 1fr", gap:5, paddingRight:2 }}>
          {MODULES.map(m => {
            const sel = selMods.has(m.n);
            return (
              <div key={m.n} onClick={()=>toggle(m.n)} style={{ display:"flex", alignItems:"center", gap:7, border:`1.5px solid ${sel ? T.primary : T.outlineVar}`, borderRadius:8, padding:"7px 9px", cursor:"pointer", background: sel ? T.surfaceContainer : T.surface, transition:"all .17s" }}>
                <span style={{ fontSize:13, flexShrink:0 }}>{m.icon}</span>
                <div style={{ width:16, height:16, borderRadius:4, background: sel ? T.primary : T.surfaceHigh, fontSize:7.5, fontWeight:700, color: sel ? T.tertiaryFixed : T.secondary, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{String(m.n).padStart(2,"0")}</div>
                <span style={{ fontSize:9.5, fontWeight:600, color: sel ? T.primary : T.onSurfaceVar, flex:1, lineHeight:1.3 }}>{m.name}</span>
                <div style={{ width:12, height:12, border:`1.5px solid ${sel ? T.primary : T.outlineVar}`, borderRadius:3, flexShrink:0, background: sel ? T.primary : "transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {sel && <svg width="7" height="5" viewBox="0 0 7 5"><path d="M1 2.5L2.8 4.5L6 1" stroke={T.tertiaryFixed} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const Step5 = () => {
    const badge = BADGE_TIERS.find(b=>b.key===earnedBadge) || BADGE_TIERS[0];
    const [reveal, setReveal] = useState(false);
    useEffect(()=>{ const t=setTimeout(()=>setReveal(true),300); return()=>clearTimeout(t); },[]);
    return (
      <div key={paneKey} className="pane" style={{ flex:1, overflowY:"auto", padding:"20px 22px 10px" }}>
        <div style={{ fontSize:8.5, fontWeight:700, color:T.secondary, letterSpacing:".16em", textTransform:"uppercase", marginBottom:14, display:"flex", alignItems:"center", gap:5 }}>
          Step 5 of 6 <span style={{ background:"#e0faf7", color:"#0f6e56", fontSize:7.5, fontWeight:700, borderRadius:4, padding:"1.5px 6px", border:"1px solid #6bd8cb" }}>Badge Unlocked!</span>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", padding:"20px", background:`linear-gradient(135deg, ${badge.bg} 0%, #f9f9ff 100%)`, border:`2px solid ${badge.border}`, borderRadius:14, marginBottom:14, transform: reveal ? "translateY(0) scale(1)" : "translateY(12px) scale(.9)", opacity: reveal ? 1 : 0, transition:"all .55s cubic-bezier(.34,1.56,.64,1)" }}>
          <div style={{ width:74, height:74, borderRadius:"50%", background:badge.bg, border:`3px solid ${badge.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:34, marginBottom:12, boxShadow:`0 0 0 7px ${badge.bg}, 0 0 0 9px ${badge.border}38`, animation: reveal ? "glow 2s ease-in-out infinite alternate" : "none" }}>{badge.icon}</div>
          <div style={{ fontFamily:"Manrope,sans-serif", fontSize:8, fontWeight:700, color:badge.color, textTransform:"uppercase", letterSpacing:".2em", marginBottom:5 }}>Badge Earned</div>
          <div style={{ fontFamily:"Manrope,sans-serif", fontSize:20, fontWeight:900, color:T.primary, marginBottom:5 }}>{badge.name}</div>
          <div style={{ fontSize:10.5, color:T.onSurfaceVar, lineHeight:1.65, maxWidth:270, marginBottom:11 }}>{badge.desc}</div>
          <div style={{ display:"inline-flex", alignItems:"center", gap:5, background:badge.bg, border:`1px solid ${badge.border}`, borderRadius:18, padding:"4px 13px" }}>
            <span style={{ fontSize:11 }}>⚡</span>
            <span style={{ fontFamily:"Manrope,sans-serif", fontSize:12, fontWeight:900, color:badge.color }}>+{badge.xp} XP</span>
          </div>
        </div>
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:8.5, fontWeight:700, color:T.secondary, textTransform:"uppercase", letterSpacing:".14em", marginBottom:8 }}>Your Badge Collection</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:7 }}>
            {BADGE_TIERS.map(b=>{
              const earned = b.key===earnedBadge;
              return (
                <div key={b.key} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, background: earned ? b.bg : T.surfaceLow, border:`1.5px solid ${earned ? b.border : T.outlineVar}`, borderRadius:9, padding:"9px 5px", opacity: earned ? 1 : 0.42, transition:"all .3s" }}>
                  <span style={{ fontSize:18 }}>{b.icon}</span>
                  <span style={{ fontSize:7.5, fontWeight:700, color: earned ? b.color : T.secondary, textTransform:"uppercase", letterSpacing:".04em", textAlign:"center" }}>{b.name}</span>
                  <span style={{ fontSize:7, color:T.outline }}>{b.xp} XP</span>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ background:T.surfaceContainer, borderRadius:9, padding:"9px 13px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
            <span style={{ fontSize:8.5, fontWeight:700, color:T.secondary, textTransform:"uppercase", letterSpacing:".1em" }}>XP Progress</span>
            <span style={{ fontFamily:"Manrope,sans-serif", fontSize:11, fontWeight:900, color:T.primary }}>{xp} XP</span>
          </div>
          <div style={{ height:5, background:T.surfaceHigh, borderRadius:3, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${Math.min((xp/1000)*100,100)}%`, background:`linear-gradient(90deg,${T.tertiaryFixedDim},${T.tertiaryFixed})`, borderRadius:3, transition:"width .9s cubic-bezier(.34,1.56,.64,1)" }}/>
          </div>
          <div style={{ fontSize:7.5, color:T.outline, marginTop:3 }}>Next badge at 500 XP · Keep exploring the platform!</div>
        </div>
      </div>
    );
  };

  const Step6 = () => {
    const [show, setShow] = useState(false);
    useEffect(()=>{ const t=setTimeout(()=>setShow(true),250); return()=>clearTimeout(t); },[]);
    const badge = BADGE_TIERS.find(b=>b.key===earnedBadge);
    return (
      <div style={{ flex:1, position:"relative", overflow:"hidden", background:"#060f1c", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(130deg,#001736 0%,#001b18 55%,#002b5b 100%)" }}>
          <div style={{ position:"absolute", inset:0, display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, padding:"14px", opacity:.3 }}>
            {[...Array(6)].map((_,i)=>(
              <div key={i} style={{ background:"rgba(0,27,24,.55)", border:"1px solid rgba(137,245,231,.09)", borderRadius:8, padding:"10px 11px" }}>
                <div style={{ width:18, height:2.5, background:T.tertiaryFixed, borderRadius:2, marginBottom:5, opacity:.4 }}/>
                <div style={{ width:"78%", height:2.5, background:"rgba(255,255,255,.09)", borderRadius:2, marginBottom:3 }}/>
                <div style={{ width:"52%", height:2.5, background:"rgba(255,255,255,.06)", borderRadius:2 }}/>
              </div>
            ))}
          </div>
          <div style={{ position:"absolute", inset:0, backdropFilter:"blur(13px)", background:"rgba(6,15,28,.82)" }}/>
        </div>
        <div style={{ position:"relative", zIndex:1, textAlign:"center", padding:"0 28px", transform: show?"translateY(0)":"translateY(22px)", opacity: show?1:0, transition:"all .65s cubic-bezier(.34,1.56,.64,1)" }}>
          <div style={{ width:72, height:72, borderRadius:"50%", background:"rgba(137,245,231,.1)", border:`2px solid ${T.tertiaryFixed}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", animation: show?"glow 2.2s ease-in-out infinite alternate":"none" }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M7 16L13 22L25 10" stroke={T.tertiaryFixed} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div style={{ fontFamily:"Manrope,sans-serif", fontSize:8.5, fontWeight:700, color:T.tertiaryFixedDim, letterSpacing:".2em", textTransform:"uppercase", marginBottom:7 }}>Tour Complete</div>
          <div style={{ fontFamily:"Manrope,sans-serif", fontSize:24, fontWeight:900, color:"#fff", lineHeight:1.2, marginBottom:7 }}>You've successfully<br /><span style={{ color:T.tertiaryFixed }}>completed the tour!</span></div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,.52)", lineHeight:1.72, maxWidth:340, margin:"0 auto 20px" }}>Your role, selected modules, and badge have been saved. Head to your dashboard to start your journey on SPM Nexus.</div>
          <div style={{ display:"flex", gap:20, justifyContent:"center", marginBottom:20 }}>
            {[[`${xp} XP`,"Earned"],[`${selMods.size}`,"Modules Selected"],["1","Badge Earned"]].map(([v,l],i)=>(
              <div key={i} style={{ textAlign:"center" }}>
                <div style={{ fontFamily:"Manrope,sans-serif", fontSize:17, fontWeight:900, color:T.tertiaryFixed }}>{v}</div>
                <div style={{ fontSize:7.5, fontWeight:700, color:"rgba(137,245,231,.48)", textTransform:"uppercase", letterSpacing:".1em", marginTop:2 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ background:"rgba(0,23,54,.72)", border:"1px solid rgba(137,245,231,.1)", borderRadius:11, padding:"13px 18px", textAlign:"left", maxWidth:340, margin:"0 auto 20px" }}>
            {[
              `Role selected: ${role || "Not set"}`,
              `${selMods.size} platform modules chosen`,
              badge ? `${badge.name} Badge earned (${badge.xp} XP)` : "Pathfinder Badge earned",
              "Gamification dashboard unlocked",
              backendOK ? "XP & notifications synced to backend" : "Offline mode — connect backend when ready",
            ].map((f,i)=>(
              <div key={i} style={{ display:"flex", alignItems:"center", gap:7, padding:"4.5px 0", borderBottom:i<4?"1px solid rgba(255,255,255,.055)":"none" }}>
                <div style={{ width:4.5, height:4.5, borderRadius:"50%", background:T.tertiaryFixedDim, flexShrink:0 }}/>
                <span style={{ fontSize:10.5, color:"rgba(255,255,255,.68)" }}>{f}</span>
              </div>
            ))}
          </div>
          <button onClick={()=>alert("Navigate to /dashboard")} style={{ fontFamily:"Manrope,sans-serif", fontSize:10.5, fontWeight:800, textTransform:"uppercase", letterSpacing:".12em", color:T.primary, background:T.tertiaryFixed, border:"none", borderRadius:10, padding:"11px 30px", cursor:"pointer", display:"inline-flex", alignItems:"center", gap:7, boxShadow:`0 8px 22px rgba(137,245,231,.22)` }}>
            Explore Dashboard ↗
          </button>
        </div>
      </div>
    );
  };

  /* ════════════════════════════════════════
     SHELL — now wrapped in Nexus layout
  ════════════════════════════════════════ */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;700;800;900&family=Inter:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'Inter',sans-serif; background:${T.surface}; }
        @keyframes modalIn { from{opacity:0;transform:translate(-50%,-44%) scale(.88);} to{opacity:1;transform:translate(-50%,-50%) scale(1);} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(13px);} to{opacity:1;transform:translateY(0);} }
        @keyframes glow    { from{box-shadow:0 0 8px rgba(137,245,231,.18);} to{box-shadow:0 0 26px rgba(137,245,231,.52);} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes slideIn { from{transform:translateX(100%);} to{transform:translateX(0);} }
        .pane { animation:fadeUp .36s ease; }
        input:focus,select:focus { outline:none; box-shadow:0 0 0 2px #6bd8cb; border-color:#6bd8cb!important; }
        ::-webkit-scrollbar { width:3px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#c4c6d0; border-radius:2px; }
        a { text-decoration:none; }
      `}</style>

      {/* ── Nexus top navbar ── */}
      <NexusNavbar xp={xp} backendOK={backendOK} unreadCount={unreadCount} onBellClick={() => setShowPanel(p => !p)} />

      {/* ── Notification panel ── */}
      {showPanel && (
        <NotificationPanel
          notifications={notifications}
          onMarkRead={markRead}
          onMarkAll={markAllRead}
          onClose={() => setShowPanel(false)}
        />
      )}

      {/* ── Body: sidebar + content ── */}
      <div style={{ display:"flex", height:"calc(100vh - 64px)" }}>

      {/* ── Nexus sidebar ── */}
        <div style={{ position:"relative", zIndex:10, flexShrink:0 }}>
          {/* Blurred dark backdrop behind sidebar */}
          <div style={{
            position:"absolute", inset:0,
            backdropFilter:"blur(18px) saturate(0.7)",
            background:"rgba(6,15,28,0.55)",
            zIndex:0,
            pointerEvents:"none",
          }} />
          <div style={{ position:"relative", zIndex:1 }}>
            <NexusSidebar />
          </div>
        </div>

        {/* ── Main content area ── */}
        <main style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", background: isDark ? "#060f1c" : T.surface }}>

          {/* Step label + step dots sub-bar */}
          <OnboardingNav />

          {/* Step content */}
          <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
            {step===1 && <Step1 />}
            {step===2 && <Step2 />}
            {step===3 && <Step3 />}
            {step===4 && <Step4 />}
            {step===5 && <Step5 />}
            {step===6 && <Step6 />}
          </div>

          {/* Footer */}
          {step===2 && <Footer onNext={next} label="Continue" showBack={false} />}
          {step===3 && <Footer onNext={next} label="Continue" canNext={!!role} />}
          {step===4 && <Footer onNext={next} label="Continue" />}
          {step===5 && <Footer onNext={next} label="Claim Badge & Continue" />}
        </main>
      </div>
    </>
  );
}