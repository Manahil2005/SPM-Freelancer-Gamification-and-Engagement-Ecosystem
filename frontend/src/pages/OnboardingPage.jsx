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

      // Step 4 → 5: Modules explored — award explorer XP + badge
      if (step === 4) {
          setEarnedBadge("explorer");
          setXp(x => x + 250);

          if (backendOK) {
            apiPost("/api/gamification/onboarding/complete-step", {
              stepCode: "MODULES",
              stepData: { moduleCount: 12, hasExplorerBonus: true }
            });
          }
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
            <div style={{ flex:1, height:72, borderRadius:8, background:`linear-gradient(135deg, ${T.primary} 0%, #001b18 100%)`, border:`1px solid rgba(137,245,231,.18)`, position:"relative", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"all .3s" }}
              onMouseEnter={e=>{ e.currentTarget.style.border="1.5px solid rgba(137,245,231,.5)"; e.currentTarget.style.boxShadow="0 0 18px rgba(137,245,231,.18)"; }}
              onMouseLeave={e=>{ e.currentTarget.style.border="1px solid rgba(137,245,231,.18)"; e.currentTarget.style.boxShadow="none"; }}>

              <style>{`
                @keyframes illuFloat{0%,100%{transform:translateY(0px)}50%{transform:translateY(-5px)}}
                @keyframes illuSpin{from{transform:rotate(0deg) translateX(18px) rotate(0deg)}to{transform:rotate(360deg) translateX(18px) rotate(-360deg)}}
                @keyframes illuSpinSlow{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
                @keyframes illuBob{0%,100%{transform:scale(1) rotate(-3deg)}50%{transform:scale(1.12) rotate(3deg)}}
                @keyframes illuPop{0%,100%{r:3}50%{r:4.5}}
                @keyframes illuBarA{0%,100%{height:14px}50%{height:26px}}
                @keyframes illuBarB{0%,100%{height:20px}50%{height:10px}}
                @keyframes illuBarC{0%,100%{height:18px}50%{height:30px}}
                @keyframes illuCoin{0%,100%{transform:rotateY(0deg)}50%{transform:rotateY(180deg)}}
                @keyframes illuShine{0%{opacity:0;transform:translateX(-12px)}60%{opacity:.7}100%{opacity:0;transform:translateX(12px)}}
              `}</style>
              {/* Slide 0 — AI Matching: vibrant neural-net with coloured nodes */}
              {slide===0&&<svg width="80" height="60" viewBox="0 0 80 60" style={{animation:"illuFloat 2.8s ease-in-out infinite"}}>
                <defs>
                  <radialGradient id="gAI" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#89f5e7" stopOpacity=".3"/><stop offset="100%" stopColor="#89f5e7" stopOpacity="0"/></radialGradient>
                </defs>
                <circle cx="40" cy="30" r="20" fill="url(#gAI)"/>
                {/* lines */}
                {[[13,12],[67,12],[13,48],[67,48],[40,5]].map(([x,y],i)=>(
                  <line key={i} x1="40" y1="30" x2={x} y2={y} stroke={["#89f5e7","#a9c7ff","#f9a8d4","#fcd34d","#86efac"][i]} strokeWidth="1.2" opacity=".7"/>
                ))}
                {/* outer nodes */}
                {[[13,12,"#f9a8d4"],[67,12,"#86efac"],[13,48,"#fcd34d"],[67,48,"#a9c7ff"],[40,5,"#f97316"]].map(([cx,cy,c],i)=>(
                  <circle key={i} cx={cx} cy={cy} r="4.5" fill={c} opacity=".92" style={{animation:`illuFloat ${1.8+i*.3}s ${i*.2}s ease-in-out infinite`}}/>
                ))}
                {/* centre */}
                <circle cx="40" cy="30" r="8" fill="#001736" stroke="#89f5e7" strokeWidth="1.5"/>
                <text x="40" y="34" textAnchor="middle" fontSize="9" fill="#89f5e7">🤖</text>
              </svg>}

              {/* Slide 1 — Skill Certs: colourful shield + stars */}
              {slide===1&&<svg width="80" height="60" viewBox="0 0 80 60" style={{animation:"illuFloat 2.4s ease-in-out infinite"}}>
                <defs>
                  <linearGradient id="gShield" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a9c7ff"/><stop offset="100%" stopColor="#001736"/></linearGradient>
                </defs>
                <path d="M40 4L56 11L56 30Q56 46 40 56Q24 46 24 30L24 11Z" fill="url(#gShield)" stroke="#89f5e7" strokeWidth="1.4"/>
                <path d="M40 4L56 11L56 30Q56 46 40 56Q24 46 24 30L24 11Z" fill="none" stroke="#fcd34d" strokeWidth=".7" strokeDasharray="3 3" opacity=".5"/>
                {/* checkmark */}
                <path d="M32 30L38 36L50 22" stroke="#89f5e7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                {/* sparkles */}
                {[[14,8,"#fcd34d"],[66,8,"#f9a8d4"],[14,44,"#86efac"],[68,40,"#a9c7ff"]].map(([x,y,c],i)=>(
                  <text key={i} x={x} y={y} textAnchor="middle" fontSize="8" style={{animation:`illuBob ${1.6+i*.25}s ${i*.2}s ease-in-out infinite`}}>✦</text>
                ))}
              </svg>}

              {/* Slide 2 — Escrow: bright safe/vault with coins */}
              {slide===2&&<svg width="80" height="60" viewBox="0 0 80 60" style={{animation:"illuFloat 2.6s ease-in-out infinite"}}>
                <defs>
                  <linearGradient id="gVault" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#fcd34d"/><stop offset="100%" stopColor="#f97316"/></linearGradient>
                </defs>
                {/* vault body */}
                <rect x="18" y="14" width="44" height="34" rx="5" fill="#001736" stroke="#fcd34d" strokeWidth="1.6"/>
                <rect x="24" y="20" width="32" height="22" rx="3" fill="url(#gVault)" opacity=".18" stroke="#fcd34d" strokeWidth=".8"/>
                {/* dial */}
                <circle cx="40" cy="31" r="8" fill="none" stroke="#fcd34d" strokeWidth="1.3"/>
                <circle cx="40" cy="31" r="3" fill="#fcd34d"/>
                <line x1="40" y1="31" x2="40" y2="24" stroke="#fcd34d" strokeWidth="1.3" strokeLinecap="round"/>
                {/* handle */}
                <rect x="54" y="28" width="6" height="6" rx="2" fill="#f97316" opacity=".9"/>
                {/* coins floating */}
                {[[14,12,"#fcd34d"],[66,18,"#86efac"],[12,38,"#a9c7ff"]].map(([cx,cy,c],i)=>(
                  <circle key={i} cx={cx} cy={cy} r="4" fill={c} opacity=".85" style={{animation:`illuFloat ${1.5+i*.4}s ${i*.3}s ease-in-out infinite`}}>
                    <title>₨</title>
                  </circle>
                ))}
                {[[14,12],[66,18],[12,38]].map(([x,y],i)=>(
                  <text key={i} x={x} y={y+3.5} textAnchor="middle" fontSize="5" fontWeight="800" fill="#001736">₨</text>
                ))}
              </svg>}

              {/* Slide 3 — Gamification: colourful bar chart + trophy */}
              {slide===3&&<svg width="80" height="60" viewBox="0 0 80 60">
                <defs>
                  <linearGradient id="gBar1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#89f5e7"/><stop offset="100%" stopColor="#001736"/></linearGradient>
                  <linearGradient id="gBar2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a9c7ff"/><stop offset="100%" stopColor="#3b4fa8"/></linearGradient>
                  <linearGradient id="gBar3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fcd34d"/><stop offset="100%" stopColor="#b87400"/></linearGradient>
                  <linearGradient id="gBar4" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f9a8d4"/><stop offset="100%" stopColor="#be185d"/></linearGradient>
                  <linearGradient id="gBar5" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#86efac"/><stop offset="100%" stopColor="#15803d"/></linearGradient>
                </defs>
                {/* bars */}
                <rect x="10" y="30" width="9" height="14" rx="2" fill="url(#gBar3)" style={{animation:"illuBarB 1.8s ease-in-out infinite"}}/>
                <rect x="22" y="22" width="9" height="22" rx="2" fill="url(#gBar1)" style={{animation:"illuBarA 2.1s .2s ease-in-out infinite"}}/>
                <rect x="34" y="26" width="9" height="18" rx="2" fill="url(#gBar2)" style={{animation:"illuBarC 1.9s .1s ease-in-out infinite"}}/>
                <rect x="46" y="18" width="9" height="26" rx="2" fill="url(#gBar5)" style={{animation:"illuBarA 2.3s .3s ease-in-out infinite"}}/>
                <rect x="58" y="14" width="9" height="30" rx="2" fill="url(#gBar4)" style={{animation:"illuBarC 2s .15s ease-in-out infinite"}}/>
                {/* floor */}
                <line x1="6" y1="44" x2="74" y2="44" stroke="rgba(255,255,255,.25)" strokeWidth=".8"/>
                {/* trophy */}
                <text x="69" y="13" fontSize="11" style={{animation:"illuBob 2s ease-in-out infinite"}}>🏆</text>
              </svg>}

              {/* Slide 4 — Team: colourful connected avatars */}
              {slide===4&&<svg width="80" height="60" viewBox="0 0 80 60" style={{animation:"illuFloat 3s ease-in-out infinite"}}>
                {/* connection lines */}
                {[[40,30,16,16],[40,30,64,16],[40,30,16,46],[40,30,64,46]].map(([x1,y1,x2,y2],i)=>(
                  <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={["#89f5e7","#a9c7ff","#fcd34d","#f9a8d4"][i]} strokeWidth="1.2" opacity=".6" strokeDasharray="3 2"/>
                ))}
                {/* centre node */}
                <circle cx="40" cy="30" r="9" fill="#001736" stroke="#89f5e7" strokeWidth="2"/>
                <text x="40" y="34.5" textAnchor="middle" fontSize="10">🤝</text>
                {/* avatar nodes */}
                {[[16,16,"#f9a8d4","👩"],[64,16,"#86efac","👨"],[16,46,"#fcd34d","🧑"],[64,46,"#a9c7ff","👱"]].map(([cx,cy,c,em],i)=>(
                  <g key={i} style={{animation:`illuFloat ${2+i*.35}s ${i*.25}s ease-in-out infinite`}}>
                    <circle cx={cx} cy={cy} r="7" fill={c} opacity=".9"/>
                    <text x={cx} y={cy+4} textAnchor="middle" fontSize="8">{em}</text>
                  </g>
                ))}
                {/* pulse ring */}
                <circle cx="40" cy="30" r="14" fill="none" stroke="#89f5e7" strokeWidth=".6" strokeDasharray="4 3" opacity=".4"/>
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

  const Step2 = () => {
    const [hov, setHov] = useState(null);
    const [countUp, setCountUp] = useState(false);
    useEffect(() => { const t = setTimeout(() => setCountUp(true), 400); return () => clearTimeout(t); }, []);

    const CARDS = [
      {
        icon:"🇵🇰", title:"Pakistan's National Platform",
        desc:"Built to empower every Pakistani freelancer — from Karachi to Gilgit — with verified skills and fair opportunities.",
        accent:"#001736", accentLight:"#dbe8ff", border:"#a9c7ff",
        illu: (hov) => (
          <svg width="100%" height="70" viewBox="0 0 200 70" style={{overflow:"visible"}}>
            <defs>
              <linearGradient id="pkGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#001736"/>
                <stop offset="100%" stopColor="#264778"/>
              </linearGradient>
            </defs>
            {/* Map dots for Pakistan provinces */}
            {[[40,35,"#89f5e7"],[70,20,"#a9c7ff"],[100,30,"#fcd34d"],[130,25,"#f9a8d4"],[160,35,"#86efac"],[55,50,"#fdba74"],[115,48,"#c4b5fd"],[85,55,"#89f5e7"]].map(([x,y,c],i)=>(
              <g key={i}>
                <circle cx={x} cy={y} r={hov ? 5 : 3.5} fill={c} opacity={hov ? 1 : .7}
                  style={{transition:`all .3s ${i*.04}s`}}/>
                {hov && <circle cx={x} cy={y} r="9" fill={c} opacity=".15"
                  style={{animation:`illuFloat ${1.5+i*.2}s ease-in-out infinite`}}/>}
              </g>
            ))}
            {/* Connection lines when hovered */}
            {hov && [[40,35,100,30],[70,20,100,30],[130,25,100,30],[160,35,100,30],[55,50,100,30],[115,48,100,30]].map(([x1,y1,x2,y2],i)=>(
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#a9c7ff" strokeWidth=".8" opacity=".4"
                strokeDasharray="3 2" style={{animation:`illuFloat ${1.8+i*.15}s ease-in-out infinite`}}/>
            ))}
            <circle cx="100" cy="30" r={hov ? 9 : 6} fill="url(#pkGrad)" stroke="#89f5e7" strokeWidth={hov?1.8:1.2} style={{transition:"all .3s"}}/>
            <text x="100" y="34" textAnchor="middle" fontSize={hov?10:8} style={{transition:"font-size .3s"}}>🇵🇰</text>
          </svg>
        ),
      },
      {
        icon:"🔐", title:"Verified & Trusted",
        desc:"CNIC-linked identity verification, proctored skill tests, and escrow payments ensure every transaction is safe.",
        accent:"#0f6e56", accentLight:"#e0faf7", border:"#6bd8cb",
        illu: (hov) => (
          <svg width="100%" height="70" viewBox="0 0 200 70" style={{overflow:"visible"}}>
            <defs>
              <linearGradient id="lockGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6bd8cb"/>
                <stop offset="100%" stopColor="#0f6e56"/>
              </linearGradient>
            </defs>
            {/* Shield */}
            <path d={`M100 8L120 16L120 ${hov?42:38}Q120 ${hov?58:54} 100 ${hov?64:60}Q80 ${hov?58:54} 80 ${hov?42:38}L80 16Z`}
              fill={hov?"url(#lockGrad)":"none"} stroke="#6bd8cb" strokeWidth={hov?1.5:1}
              opacity={hov?1:.8} style={{transition:"all .4s cubic-bezier(.34,1.56,.64,1)"}}/>
            {/* checkmark */}
            <path d={hov?"M91 36L97 42L110 28":"M93 36L97 40L108 29"} stroke={hov?"#fff":"#6bd8cb"}
              strokeWidth={hov?2.2:1.6} strokeLinecap="round" strokeLinejoin="round" fill="none"
              style={{transition:"all .3s"}}/>
            {/* floating verification dots */}
            {[[60,20,"#fcd34d"],[140,20,"#a9c7ff"],[55,50,"#f9a8d4"],[145,50,"#86efac"]].map(([x,y,c],i)=>(
              <g key={i} style={{transition:`all .3s ${i*.06}s`}}>
                <circle cx={x} cy={y} r={hov?5:3} fill={c} opacity={hov?.9:.5}/>
                {hov&&<text x={x} y={y+4} textAnchor="middle" fontSize="7">✓</text>}
              </g>
            ))}
          </svg>
        ),
      },
      {
        icon:"🚀", title:"Gamified Growth",
        desc:"Level up, earn badges, and climb leaderboards. Your reputation grows with every completed project.",
        accent:"#7c1fa8", accentLight:"#f3e0ff", border:"#c07fd0",
        illu: (hov) => (
          <svg width="100%" height="70" viewBox="0 0 200 70" style={{overflow:"visible"}}>
            <defs>
              <linearGradient id="xpGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#c07fd0"/>
                <stop offset="100%" stopColor="#89f5e7"/>
              </linearGradient>
            </defs>
            {/* XP bar */}
            <rect x="30" y="44" width="140" height="8" rx="4" fill="#f3e0ff" stroke="#c07fd0" strokeWidth=".8"/>
            <rect x="30" y="44" width={hov?105:70} height="8" rx="4" fill="url(#xpGrad)"
              style={{transition:"width .6s cubic-bezier(.34,1.56,.64,1)"}}/>
            <text x="175" y="51" fontSize="7" fontWeight="700" fill="#7c1fa8"
              style={{transition:"all .3s"}}>{hov?"75%":"50%"}</text>
            {/* Floating badges */}
            {[["🎯",50,28],["🧭",90,22],["⚡",130,28],["🏆",hov?165:160,hov?22:26]].map(([em,x,y],i)=>(
              <text key={i} x={x} y={y} textAnchor="middle" fontSize={hov&&i===3?16:11}
                style={{animation:`illuFloat ${1.8+i*.3}s ${i*.2}s ease-in-out infinite`,transition:"font-size .3s"}}>{em}</text>
            ))}
            {/* Stars when hovered */}
            {hov&&[["✦",45,14,"#fcd34d"],["✦",155,14,"#f9a8d4"],["✦",100,10,"#86efac"]].map(([em,x,y,c],i)=>(
              <text key={i} x={x} y={y} textAnchor="middle" fontSize="10" fill={c}
                style={{animation:`illuBob ${1.2+i*.25}s ease-in-out infinite`}}>{em}</text>
            ))}
          </svg>
        ),
      },
      {
        icon:"🤝", title:"Community First",
        desc:"Social impact projects, volunteer missions, and a thriving network of 50,000+ professionals.",
        accent:"#b87400", accentLight:"#fff3d0", border:"#f0c060",
        illu: (hov) => (
          <svg width="100%" height="70" viewBox="0 0 200 70" style={{overflow:"visible"}}>
            {/* People network */}
            {[[50,35],[100,20],[150,35],[75,55],[125,55]].map(([cx,cy],i)=>(
              <g key={i}>
                {i>0&&<line x1="100" y1="20" x2={cx} y2={cy} stroke="#f0c060" strokeWidth={hov?1.2:.6}
                  opacity={hov?.7:.3} strokeDasharray={hov?"none":"3 2"} style={{transition:"all .3s"}}/>}
                <circle cx={cx} cy={cy} r={hov?(i===1?10:7):5} fill={["#fcd34d","#89f5e7","#f9a8d4","#a9c7ff","#86efac"][i]}
                  opacity={hov?1:.8} style={{transition:`all .35s ${i*.06}s cubic-bezier(.34,1.56,.64,1)`}}/>
                <text x={cx} y={cy+(hov?(i===1?5:4):3)} textAnchor="middle" fontSize={hov?(i===1?11:8):7}
                  style={{transition:"font-size .3s"}}>
                  {["🤝","🌟","🌱","💬","🎯"][i]}
                </text>
              </g>
            ))}
            {/* Pulse rings on hover */}
            {hov&&<>
              <circle cx="100" cy="20" r="15" fill="none" stroke="#89f5e7" strokeWidth=".8" opacity=".3"
                style={{animation:"illuFloat 2s ease-in-out infinite"}}/>
              <circle cx="100" cy="20" r="22" fill="none" stroke="#89f5e7" strokeWidth=".4" opacity=".15"
                style={{animation:"illuFloat 2.5s ease-in-out infinite"}}/>
            </>}
          </svg>
        ),
      },
    ];

    const STATS = [
      { v:"50K+", l:"Freelancers", icon:"👥", color:"#89f5e7" },
      { v:"12", l:"Modules", icon:"🧩", color:"#a9c7ff" },
      { v:"100%", l:"Escrow Safe", icon:"🔒", color:"#6bd8cb" },
      { v:"4.9★", l:"Rating", icon:"⭐", color:"#fcd34d" },
    ];

    return (
      <div key={paneKey} className="pane" style={{ flex:1, overflowY:"auto", padding:"22px 6% 22px", background:T.surface }}>
        <style>{`
          @keyframes statPop { from{transform:scale(.6);opacity:0} to{transform:scale(1);opacity:1} }
          @keyframes cardSlide { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        `}</style>

        {/* Header */}
        <div style={{ marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:6 }}>
            <div style={{ width:3, height:18, background:T.tertiaryFixedDim, borderRadius:2 }}/>
            <span style={{ fontSize:8.5, fontWeight:700, color:T.secondary, letterSpacing:".18em", textTransform:"uppercase" }}>About Us</span>
            <span style={{ background:T.secondaryContainer, color:"#264778", fontSize:7.5, fontWeight:700, borderRadius:4, padding:"1.5px 7px" }}>Step 2</span>
          </div>
          <div style={{ fontFamily:"Manrope,sans-serif", fontSize:22, fontWeight:900, color:T.primary, lineHeight:1.18, marginBottom:5 }}>
            Who We <span style={{ color:T.tertiaryFixedDim, position:"relative" }}>Are
              <span style={{ position:"absolute", bottom:-2, left:0, right:0, height:2, background:`linear-gradient(90deg,${T.tertiaryFixedDim},transparent)`, borderRadius:2 }}/>
            </span>
          </div>
          <div style={{ fontSize:11, color:T.onSurfaceVar, lineHeight:1.7, maxWidth:520 }}>
            SPM Nexus is Pakistan's national freelance and skill verification system — a government-aligned platform connecting <strong style={{ color:T.primary }}>verified talent</strong> with real opportunities across every province.
          </div>
        </div>

        {/* 2×2 interactive cards */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
          {CARDS.map((card, i) => {
            const isHov = hov === i;
            return (
              <div key={i}
                onMouseEnter={() => setHov(i)}
                onMouseLeave={() => setHov(null)}
                style={{
                  background: isHov ? card.accentLight : T.surfaceLowest,
                  border: `1.5px solid ${isHov ? card.border : T.outlineVar}`,
                  borderRadius: 13,
                  overflow: "hidden",
                  cursor: "default",
                  transition: "all .28s cubic-bezier(.34,1.56,.64,1)",
                  transform: isHov ? "translateY(-3px) scale(1.012)" : "none",
                  boxShadow: isHov ? `0 8px 28px ${card.border}44` : "0 1px 4px rgba(0,23,54,.06)",
                  animation: `cardSlide .4s ${i*.09}s both`,
                }}
              >
                {/* Illustration area */}
                <div style={{
                  padding:"10px 12px 2px",
                  background: isHov ? `linear-gradient(135deg, ${card.accentLight} 0%, rgba(255,255,255,0) 100%)` : "transparent",
                  transition:"background .3s",
                  minHeight:82,
                  display:"flex", alignItems:"center",
                }}>
                  {card.illu(isHov)}
                </div>

                {/* Content */}
                <div style={{ padding:"6px 13px 13px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                    <div style={{
                      width:26, height:26, borderRadius:7,
                      background: isHov ? card.accentLight : T.surfaceContainer,
                      border:`1px solid ${isHov ? card.border : T.outlineVar}`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:14, transition:"all .25s",
                      transform: isHov ? "rotate(-5deg) scale(1.1)" : "none",
                    }}>{card.icon}</div>
                    <div style={{ fontFamily:"Manrope,sans-serif", fontSize:11, fontWeight:900, color: isHov ? card.accent : T.primary, transition:"color .25s" }}>{card.title}</div>
                  </div>
                  <div style={{ fontSize:9.5, color:T.onSurfaceVar, lineHeight:1.6 }}>{card.desc}</div>
                  {/* Reveal bar on hover */}
                  <div style={{ height:2, marginTop:8, borderRadius:2, overflow:"hidden", background:T.outlineVar }}>
                    <div style={{ height:"100%", width: isHov ? "100%" : "0%", background:`linear-gradient(90deg,${card.border},${card.accent})`, transition:"width .5s cubic-bezier(.34,1.56,.64,1)" }}/>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Stats bar */}
        <div style={{ background:T.primary, borderRadius:11, padding:"12px 8px", display:"flex", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(90deg,#001736,#001b18 60%,#002b5b)", opacity:.9 }}/>
          {STATS.map(({v,l,icon,color},i) => (
            <div key={i} style={{ flex:1, textAlign:"center", borderRight:i<3?"1px solid rgba(255,255,255,.08)":"none", position:"relative", zIndex:1, padding:"0 4px" }}>
              <div style={{ fontSize:11, marginBottom:2, animation: countUp ? `statPop .5s ${i*.1}s both` : "none" }}>{icon}</div>
              <div style={{ fontFamily:"Manrope,sans-serif", fontSize:15, fontWeight:900, color, animation: countUp ? `statPop .5s ${i*.12+.1}s both` : "none" }}>{v}</div>
              <div style={{ fontSize:7, fontWeight:700, color:"rgba(255,255,255,.4)", textTransform:"uppercase", letterSpacing:".1em", marginTop:1 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const Step3 = () => {
    const [hovRole, setHovRole] = useState(null);

    const ROLES = [
      {
        r:"Freelancer", icon:"💼",
        desc:"Offer your skills and win verified projects nationwide.",
        badge:"Pathfinder Badge",
        accent:"#0f6e56", accentLight:"#e0faf7", border:"#6bd8cb",
        xpColor:"#0f6e56", xpBg:"#e0faf7",
        perks:["Build a verified portfolio","Earn skill certificates","Compete on leaderboards"],
        illu: (isHov, isSel) => (
          <svg viewBox="0 0 160 100" width="100%" height="90" style={{overflow:"visible"}}>
            <defs>
              <linearGradient id="flGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#6bd8cb"/>
                <stop offset="100%" stopColor="#0f6e56"/>
              </linearGradient>
            </defs>
            {/* Laptop */}
            <rect x="40" y="32" width="80" height="50" rx="5" fill={isHov?"url(#flGrad)":"none"} stroke="#6bd8cb" strokeWidth="1.5"
              style={{transition:"fill .3s"}}/>
            <rect x="44" y="36" width="72" height="40" rx="2" fill={isHov?"rgba(0,27,24,.6)":"rgba(0,27,24,.3)"}
              style={{transition:"fill .3s"}}/>
            <rect x="30" y="82" width="100" height="5" rx="2.5" fill="#6bd8cb" opacity=".5"/>
            {/* Screen content */}
            {isHov && <>
              <rect x="50" y="40" width="30" height="3" rx="1.5" fill="#89f5e7" opacity=".8"/>
              <rect x="50" y="46" width="50" height="2" rx="1" fill="rgba(255,255,255,.3)"/>
              <rect x="50" y="51" width="40" height="2" rx="1" fill="rgba(255,255,255,.2)"/>
              <rect x="50" y="61" width="22" height="8" rx="3" fill="#6bd8cb"/>
              <text x="61" y="67.5" textAnchor="middle" fontSize="5" fontWeight="800" fill="#001736">APPLY</text>
            </>}
            {/* Floating badges */}
            {[["🎯",22,25],["📜",138,30],["⭐",25,65]].map(([em,x,y],i)=>(
              <text key={i} x={x} y={y} textAnchor="middle" fontSize={isHov?13:9}
                style={{transition:`font-size .3s ${i*.08}s`, animation:isHov?`illuFloat ${1.8+i*.3}s ${i*.2}s ease-in-out infinite`:"none"}}>{em}</text>
            ))}
          </svg>
        ),
      },
      {
        r:"Client", icon:"🏢",
        desc:"Post projects and hire Pakistan's best verified talent.",
        badge:"Employer Badge",
        accent:"#264778", accentLight:"#dbe8ff", border:"#a9c7ff",
        xpColor:"#264778", xpBg:"#dbe8ff",
        perks:["Post unlimited projects","Access verified freelancers","Milestone-based escrow"],
        illu: (isHov) => (
          <svg viewBox="0 0 160 100" width="100%" height="90" style={{overflow:"visible"}}>
            <defs>
              <linearGradient id="clGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a9c7ff"/>
                <stop offset="100%" stopColor="#264778"/>
              </linearGradient>
            </defs>
            {/* Building */}
            <rect x="55" y="20" width="50" height="64" rx="4" fill={isHov?"url(#clGrad)":"none"} stroke="#a9c7ff" strokeWidth="1.5"
              style={{transition:"fill .3s"}}/>
            {/* Windows */}
            {[[63,28],[80,28],[97,28],[63,42],[80,42],[97,42],[63,56],[80,56],[97,56]].map(([wx,wy],i)=>(
              <rect key={i} x={wx} y={wy} width="9" height="7" rx="1.5"
                fill={isHov?["#89f5e7","#fcd34d","#f9a8d4","#86efac","#a9c7ff","#fdba74","#c4b5fd","#7dd3fc","#89f5e7"][i]:"rgba(255,255,255,.15)"}
                opacity={isHov?1:.6} style={{transition:`fill .25s ${i*.04}s`}}/>
            ))}
            {/* Door */}
            <rect x="73" y="70" width="14" height="14" rx="2" fill={isHov?"#001736":"rgba(255,255,255,.1)"} stroke="#a9c7ff" strokeWidth="1"
              style={{transition:"fill .3s"}}/>
            {/* Floating elements */}
            {isHov&&[["📋",30,35],["✅",130,30],["💰",135,65],["🤝",25,65]].map(([em,x,y],i)=>(
              <text key={i} x={x} y={y} textAnchor="middle" fontSize="12"
                style={{animation:`illuFloat ${1.6+i*.25}s ${i*.15}s ease-in-out infinite`}}>{em}</text>
            ))}
          </svg>
        ),
      },
      {
        r:"Admin", icon:"🛡️",
        desc:"Govern, moderate, and manage the entire platform.",
        badge:"Guardian Badge",
        accent:"#7c1fa8", accentLight:"#f3e0ff", border:"#c07fd0",
        xpColor:"#7c1fa8", xpBg:"#f3e0ff",
        perks:["Full platform oversight","Dispute resolution tools","System analytics access"],
        illu: (isHov) => (
          <svg viewBox="0 0 160 100" width="100%" height="90" style={{overflow:"visible"}}>
            <defs>
              <linearGradient id="adGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#c07fd0"/>
                <stop offset="100%" stopColor="#7c1fa8"/>
              </linearGradient>
            </defs>
            {/* Shield */}
            <path d={`M80 10L112 22L112 ${isHov?58:54}Q112 ${isHov?80:76} 80 ${isHov?92:88}Q48 ${isHov?80:76} 48 ${isHov?58:54}L48 22Z`}
              fill={isHov?"url(#adGrad)":"none"} stroke="#c07fd0" strokeWidth="1.8"
              style={{transition:"all .4s cubic-bezier(.34,1.56,.64,1)"}}/>
            {/* Star in shield */}
            <text x="80" y={isHov?57:54} textAnchor="middle" fontSize={isHov?22:16}
              style={{transition:"all .3s", animation:isHov?"illuBob 2s ease-in-out infinite":"none"}}>⭐</text>
            {/* Orbiting admin tools */}
            {isHov&&[["🔍",28,22],["⚖️",132,22],["📊",28,70],["🔔",132,68],["🛡️",80,12]].map(([em,x,y],i)=>(
              <text key={i} x={x} y={y} textAnchor="middle" fontSize="12"
                style={{animation:`illuFloat ${1.5+i*.2}s ${i*.18}s ease-in-out infinite`}}>{em}</text>
            ))}
            {/* Glow rings */}
            {isHov&&[22,34,46].map((r,i)=>(
              <circle key={i} cx="80" cy="52" r={r} fill="none" stroke="#c07fd0"
                strokeWidth=".5" opacity={.15-i*.04}
                style={{animation:`illuFloat ${2+i*.4}s ease-in-out infinite`}}/>
            ))}
          </svg>
        ),
      },
    ];

    return (
      <div key={paneKey} className="pane" style={{ flex:1, overflowY:"auto", padding:"18px 22px 10px", background:T.surface }}>
        <style>{`
          @keyframes roleIn { from{opacity:0;transform:translateY(12px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
          @keyframes perkIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
          @keyframes selPulse { 0%,100%{box-shadow:0 0 0 0 rgba(107,216,203,.4)} 50%{box-shadow:0 0 0 6px rgba(107,216,203,0)} }
        `}</style>

        {/* Header */}
        <div style={{ marginBottom:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5 }}>
            <div style={{ width:3, height:18, background:"#f0c060", borderRadius:2 }}/>
            <span style={{ fontSize:8.5, fontWeight:700, color:T.secondary, letterSpacing:".18em", textTransform:"uppercase" }}>Step 3 of 6</span>
            <span style={{ background:"#fff8e1", color:"#b87400", fontSize:7.5, fontWeight:700, borderRadius:4, padding:"1.5px 7px", border:"1px solid #f0c060" }}>+100 XP</span>
          </div>
          <div style={{ fontFamily:"Manrope,sans-serif", fontSize:22, fontWeight:900, color:T.primary, lineHeight:1.18, marginBottom:4 }}>
            Choose your <span style={{ color:T.tertiaryFixedDim }}>role</span>
          </div>
          <div style={{ fontSize:11, color:T.onSurfaceVar }}>Hover to explore each role. Click to select and earn <strong style={{color:"#b87400"}}>+100 XP</strong>.</div>
        </div>

        {/* Role cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:9, marginBottom:12 }}>
          {ROLES.map((item, i) => {
            const isSel = role === item.r;
            const isHov = hovRole === i;
            const active = isHov || isSel;
            return (
              <div key={item.r}
                onClick={() => { if(!isSel){ setRole(item.r); setXp(x=>x+100); } }}
                onMouseEnter={() => setHovRole(i)}
                onMouseLeave={() => setHovRole(null)}
                style={{
                  border: `2px solid ${isSel ? item.accent : (isHov ? item.border : T.outlineVar)}`,
                  borderRadius: 14,
                  overflow: "hidden",
                  cursor: "pointer",
                  background: active ? item.accentLight : T.surfaceLowest,
                  transition: "all .3s cubic-bezier(.34,1.56,.64,1)",
                  transform: isSel ? "translateY(-4px) scale(1.02)" : isHov ? "translateY(-2px)" : "none",
                  boxShadow: isSel ? `0 10px 30px ${item.border}55` : isHov ? `0 5px 18px ${item.border}33` : "0 1px 4px rgba(0,23,54,.06)",
                  animation: `roleIn .4s ${i*.1}s both`,
                }}
              >
                {/* Illustration zone */}
                <div style={{ background: active ? `linear-gradient(160deg,${item.accentLight},rgba(255,255,255,0))` : T.surfaceLow, padding:"8px 8px 0", transition:"background .3s", minHeight:100 }}>
                  {item.illu(active, isSel)}
                </div>

                {/* Card body */}
                <div style={{ padding:"6px 11px 11px" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:5 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                      <span style={{ fontSize:16, transition:"transform .3s", transform: active ? "scale(1.15) rotate(-5deg)" : "none", display:"inline-block" }}>{item.icon}</span>
                      <span style={{ fontFamily:"Manrope,sans-serif", fontSize:12, fontWeight:900, color: active ? item.accent : T.primary, textTransform:"uppercase", letterSpacing:".05em", transition:"color .25s" }}>{item.r}</span>
                    </div>
                    {isSel && <div style={{ width:16, height:16, borderRadius:"50%", background:item.accent, display:"flex", alignItems:"center", justifyContent:"center", animation:"selPulse 2s infinite" }}>
                      <svg width="9" height="7" viewBox="0 0 9 7"><path d="M1 3.5L3.2 6 8 1" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
                    </div>}
                  </div>

                  <div style={{ fontSize:9, color:T.onSurfaceVar, lineHeight:1.55, marginBottom:7 }}>{item.desc}</div>

                  {/* Perks — slide in on hover/select */}
                  <div style={{ height: active ? item.perks.length * 18 : 0, overflow:"hidden", transition:"height .35s cubic-bezier(.34,1.56,.64,1)" }}>
                    {item.perks.map((p,j) => (
                      <div key={j} style={{ display:"flex", alignItems:"center", gap:5, marginBottom:2,
                        animation: active ? `perkIn .3s ${j*.07+.1}s both` : "none" }}>
                        <div style={{ width:4, height:4, borderRadius:"50%", background:item.border, flexShrink:0 }}/>
                        <span style={{ fontSize:8.5, color:item.accent, fontWeight:600 }}>{p}</span>
                      </div>
                    ))}
                  </div>

                  {/* Badge pill */}
                  <div style={{
                    display:"inline-flex", alignItems:"center", gap:4, marginTop:6,
                    background: active ? item.xpBg : T.surfaceContainer,
                    border: `1px solid ${active ? item.border : T.outlineVar}`,
                    borderRadius:6, padding:"3px 7px", transition:"all .25s",
                  }}>
                    <span style={{ fontSize:8 }}>🏅</span>
                    <span style={{ fontSize:7.5, fontWeight:700, color: active ? item.xpColor : T.secondary, letterSpacing:".04em" }}>{item.badge}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mission strip */}
        <div style={{ background:`linear-gradient(90deg,${T.surfaceContainer},${T.secondaryContainer})`, border:`1px solid ${T.secondaryContainer}`, borderRadius:10, padding:"9px 14px", display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:30, height:30, borderRadius:8, background:T.primary, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:14 }}>📋</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:9, fontWeight:800, color:T.primary, textTransform:"uppercase", letterSpacing:".08em", marginBottom:1 }}>Mission</div>
            <div style={{ fontSize:10, fontWeight:600, color:T.primaryContainer }}>Select your role to unlock your personalised dashboard path</div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", flexShrink:0 }}>
            <span style={{ fontFamily:"Manrope,sans-serif", fontSize:13, fontWeight:900, color:"#b87400" }}>+100</span>
            <span style={{ fontSize:7, fontWeight:700, color:"#b87400", letterSpacing:".1em" }}>XP</span>
          </div>
        </div>
      </div>
    );
  };

  const Step4 = () => {
    const [hovered, setHovered] = useState(null);

    // Colour palette cycling for modules
    const MODULE_COLORS = [
      { bg:"#e0faf7", border:"#6bd8cb", accent:"#0f6e56", icon_bg:"#89f5e7" },
      { bg:"#dbe8ff", border:"#a9c7ff", accent:"#264778", icon_bg:"#a9c7ff" },
      { bg:"#fff3d0", border:"#f0c060", accent:"#b87400", icon_bg:"#fcd34d" },
      { bg:"#f3e0ff", border:"#c07fd0", accent:"#7c1fa8", icon_bg:"#e9b8f8" },
      { bg:"#fce7f3", border:"#f9a8d4", accent:"#be185d", icon_bg:"#f9a8d4" },
      { bg:"#dcfce7", border:"#86efac", accent:"#15803d", icon_bg:"#86efac" },
      { bg:"#fff7ed", border:"#fdba74", accent:"#c2410c", icon_bg:"#fdba74" },
      { bg:"#e0f2fe", border:"#7dd3fc", accent:"#0369a1", icon_bg:"#7dd3fc" },
      { bg:"#fef9c3", border:"#fde047", accent:"#a16207", icon_bg:"#fde047" },
      { bg:"#ede9fe", border:"#c4b5fd", accent:"#6d28d9", icon_bg:"#c4b5fd" },
      { bg:"#fee2e2", border:"#fca5a5", accent:"#b91c1c", icon_bg:"#fca5a5" },
      { bg:"#f0fdf4", border:"#6ee7b7", accent:"#065f46", icon_bg:"#6ee7b7" },
    ];

    const MODULE_DESCS = [
      "CNIC-linked identity, portfolio showcase & trust score.",
      "Proctored tests, certificates & skill badges.",
      "Browse, post & collaborate on verified projects.",
      "Smart matching engine connecting you to ideal gigs.",
      "Shared workspaces, task boards & Git integration.",
      "Real-time chat, video calls & project threads.",
      "Milestone-based escrow keeps every rupee safe.",
      "Fair resolution for project & payment conflicts.",
      "Live dashboards, audit logs & platform health.",
      "Volunteer missions & community impact drives.",
      "XP, badges, leaderboards & achievement streaks.",
      "Rent cameras, laptops & hardware by the day.",
    ];

    return (
      <div key={paneKey} className="pane" style={{ flex:1, display:"flex", flexDirection:"column", padding:"18px 22px 8px", overflow:"hidden" }}>
        <div style={{ fontSize:8.5, fontWeight:700, color:T.secondary, letterSpacing:".16em", textTransform:"uppercase", marginBottom:4, display:"flex", alignItems:"center", gap:5 }}>
          Step 4 of 6 <span style={{ background:T.secondaryContainer, color:T.primaryContainer, fontSize:7.5, fontWeight:700, borderRadius:4, padding:"1.5px 6px" }}>12 Modules</span>
        </div>
        <div style={{ fontFamily:"Manrope,sans-serif", fontSize:19, fontWeight:900, color:T.primary, marginBottom:3 }}>Platform <span style={{ color:"#0f6e56" }}>modules</span></div>
        <div style={{ fontSize:11, color:T.onSurfaceVar, marginBottom:10 }}>Hover any module to learn what it does.</div>

        {/* Expanded detail card for hovered module */}
        <div style={{
          flexShrink:0, height: hovered !== null ? 54 : 0, overflow:"hidden",
          transition:"height .3s cubic-bezier(.34,1.56,.64,1)",
          marginBottom: hovered !== null ? 8 : 0,
        }}>
          {hovered !== null && (() => {
            const m = MODULES[hovered];
            const c = MODULE_COLORS[hovered];
            return (
              <div style={{ display:"flex", alignItems:"center", gap:10, background:c.bg, border:`1.5px solid ${c.border}`, borderRadius:10, padding:"9px 13px" }}>
                <div style={{ width:36, height:36, borderRadius:8, background:c.icon_bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{m.icon}</div>
                <div>
                  <div style={{ fontFamily:"Manrope,sans-serif", fontSize:11, fontWeight:800, color:c.accent, marginBottom:2 }}>Module {String(m.n).padStart(2,"0")} — {m.name}</div>
                  <div style={{ fontSize:9.5, color:T.onSurfaceVar, lineHeight:1.5 }}>{MODULE_DESCS[hovered]}</div>
                </div>
              </div>
            );
          })()}
        </div>

        <div style={{ flex:1, overflowY:"auto", display:"grid", gridTemplateColumns:"1fr 1fr", gap:5, paddingRight:2 }}>
          {MODULES.map((m, idx) => {
            const c = MODULE_COLORS[idx % MODULE_COLORS.length];
            const isHov = hovered === idx;
            return (
              <div
                key={m.n}
                onMouseEnter={() => setHovered(idx)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  display:"flex", alignItems:"center", gap:8,
                  border:`1.5px solid ${isHov ? c.border : T.outlineVar}`,
                  borderRadius:9, padding:"7px 9px", cursor:"default",
                  background: isHov ? c.bg : T.surface,
                  transition:"all .18s cubic-bezier(.34,1.56,.64,1)",
                  transform: isHov ? "translateY(-1px)" : "none",
                  boxShadow: isHov ? `0 4px 14px ${c.border}55` : "none",
                }}
              >
                <div style={{
                  width:28, height:28, borderRadius:7,
                  background: isHov ? c.icon_bg : T.surfaceContainer,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:15, flexShrink:0, transition:"background .18s",
                }}>{m.icon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:1 }}>
                    <span style={{ fontSize:7, fontWeight:800, color: isHov ? c.accent : T.outline, background: isHov ? c.icon_bg : T.surfaceHigh, borderRadius:3, padding:"1px 4px", flexShrink:0 }}>
                      {String(m.n).padStart(2,"0")}
                    </span>
                  </div>
                  <span style={{ fontSize:9, fontWeight:700, color: isHov ? c.accent : T.onSurfaceVar, lineHeight:1.3, display:"block" }}>{m.name}</span>
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
            {[[`${xp} XP`,"Earned"],["12","Modules Explored"],["1","Badge Earned"]].map(([v,l],i)=>(
              <div key={i} style={{ textAlign:"center" }}>
                <div style={{ fontFamily:"Manrope,sans-serif", fontSize:17, fontWeight:900, color:T.tertiaryFixed }}>{v}</div>
                <div style={{ fontSize:7.5, fontWeight:700, color:"rgba(137,245,231,.48)", textTransform:"uppercase", letterSpacing:".1em", marginTop:2 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ background:"rgba(0,23,54,.72)", border:"1px solid rgba(137,245,231,.1)", borderRadius:11, padding:"13px 18px", textAlign:"left", maxWidth:340, margin:"0 auto 20px" }}>
            {[
              `Role selected: ${role || "Not set"}`,
              `12 platform modules explored`,
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

      {/* ── Nexus sidebar — locked behind dark overlay during onboarding ── */}
        <div style={{ position:"relative", zIndex:10, flexShrink:0 }}>
          <NexusSidebar />
          {/* Dark blackish overlay — fully covers sidebar, blocks all pointer events */}
          <div style={{
            position:"absolute", inset:0,
            background:"rgba(4,8,18,0.72)",
            backdropFilter:"blur(3px) saturate(0.4)",
            WebkitBackdropFilter:"blur(3px) saturate(0.4)",
            zIndex:20,
            pointerEvents:"all",
            cursor:"not-allowed",
            borderRight:"1px solid rgba(255,255,255,0.04)",
          }} />
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