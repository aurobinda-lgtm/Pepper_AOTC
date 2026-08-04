import { useState, useEffect } from "react";
import { USERS, ROLE_LABEL, ROLE_DESC_MAP } from "../data/users.js";
import { INK, OK, RISK, ff, mono } from "../brand/tokens.js";

const LS_KEY = "aotc_custom_profiles";
function loadCustom() { try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; } }
function saveCustom(list) { localStorage.setItem(LS_KEY, JSON.stringify(list)); }

const SECTIONS = [
  { key: "leadership", label: "Leadership",   roles: ["pm", "ceo", "cto", "cdo"], icon: "◉", defaultRole: "pm"         },
  { key: "team",       label: "Team",         roles: ["consultant", "member"],    icon: "◈", defaultRole: "consultant"  },
  { key: "insights",   label: "Insights",     roles: ["analyst", "admin"],        icon: "$", defaultRole: "analyst"     },
  { key: "clients",    label: "Clients",      roles: ["client"],                  icon: "◫", defaultRole: "client"      },
];

const ALL_ROLES = [
  { key: "pm",         label: "Project Manager",       desc: "Full ops access" },
  { key: "ceo",        label: "Executive",              desc: "Portfolio & financials" },
  { key: "cto",        label: "CTO / CPO",              desc: "Technology, product & operations" },
  { key: "cdo",        label: "Chief Design Officer",   desc: "Design direction & creative" },
  { key: "consultant", label: "Consultant",        desc: "Assigned tasks & projects" },
  { key: "member",     label: "Team Member",       desc: "Tasks & timesheets" },
  { key: "analyst",    label: "Analyst",           desc: "Reports & insights" },
  { key: "admin",      label: "Admin",             desc: "System administration" },
  { key: "client",     label: "Client",            desc: "Project read-only" },
];

function initials(name) {
  return name.trim().split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function AccessGate({ onUnlock }) {
  const [selected,  setSelected]  = useState(null);
  const [pin,       setPin]       = useState("");
  const [error,     setError]     = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [custom,    setCustom]    = useState(loadCustom);

  // which section is open for adding
  const [addingIn, setAddingIn] = useState(null); // section key

  // new member form state
  const [fName,  setFName]  = useState("");
  const [fEmail, setFEmail] = useState("");
  const [fRole,  setFRole]  = useState("");
  const [fPin1,  setFPin1]  = useState("");
  const [fPin2,  setFPin2]  = useState("");
  const [fErr,   setFErr]   = useState("");

  const allUsers = [...USERS, ...custom];

  const openAdd = (sectionKey, defaultRole) => {
    setAddingIn(sectionKey);
    setFRole(defaultRole);
    setFName(""); setFEmail(""); setFPin1(""); setFPin2(""); setFErr("");
  };
  const closeAdd = () => { setAddingIn(null); setFErr(""); };

  const handleCreate = () => {
    if (!fName.trim())      return setFErr("Name is required.");
    if (!fEmail.trim())     return setFErr("Email is required.");
    if (fPin1.length !== 4) return setFErr("PIN must be exactly 4 digits.");
    if (fPin1 !== fPin2)    return setFErr("PINs do not match.");
    const profile = {
      id:       `custom_${Date.now()}`,
      name:     fName.trim(),
      role:     fRole,
      initials: initials(fName),
      email:    fEmail.trim(),
      pin:      fPin1,
      projects: null,
    };
    const updated = [...custom, profile];
    setCustom(updated);
    saveCustom(updated);
    closeAdd();
  };

  const deleteProfile = (id) => {
    const updated = custom.filter(p => p.id !== id);
    setCustom(updated);
    saveCustom(updated);
  };

  const selectUser = (u) => { setSelected(u); setPin(""); setError(""); };
  const clearPin   = ()  => { setPin(""); setError(""); };

  const handlePin = (digit) => {
    if (pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    setError("");
    if (next.length === 4) setTimeout(() => attemptUnlock(next), 120);
  };

  const attemptUnlock = (code) => {
    if (code === selected.pin) {
      setUnlocking(true);
      setTimeout(() => onUnlock(selected), 500);
    } else {
      setPin("");
      setError("Wrong PIN — try again");
    }
  };

  useEffect(() => {
    if (!selected || unlocking) return;
    const onKey = (e) => {
      if (e.key >= "0" && e.key <= "9") handlePin(e.key);
      else if (e.key === "Backspace") clearPin();
      else if (e.key === "Escape") { setSelected(null); setPin(""); setError(""); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, pin, unlocking]);

  const glass = {
    background: "rgba(255,255,255,.08)",
    border: "1.5px solid rgba(255,255,255,.18)",
    backdropFilter: "blur(12px)",
  };
  const inputStyle = {
    width: "100%", boxSizing: "border-box",
    padding: "10px 13px", borderRadius: 11,
    background: "rgba(255,255,255,.1)", border: "1.5px solid rgba(255,255,255,.2)",
    color: "#fff", fontSize: 13, fontFamily: ff, outline: "none",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(145deg, #0D4A3A 0%, ${INK} 40%, #1C7562 70%, #0F6B50 100%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: ff, padding: "24px 16px", position: "relative", overflow: "hidden",
    }}>
      <style>{`
        @keyframes orb1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,-20px) scale(1.08)} }
        @keyframes orb2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-20px,30px) scale(1.05)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse-ring { 0%{box-shadow:0 0 0 0 rgba(30,158,114,.45)} 70%{box-shadow:0 0 0 14px rgba(30,158,114,0)} 100%{box-shadow:0 0 0 0 rgba(30,158,114,0)} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        input::placeholder { color: rgba(255,255,255,.35); }
        input:focus { border-color: rgba(255,255,255,.45) !important; }
      `}</style>

      <div style={{ position:"absolute", width:420, height:420, borderRadius:"50%", background:"rgba(30,158,114,.18)", top:"-100px", left:"-80px", animation:"orb1 8s ease-in-out infinite", filter:"blur(40px)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", width:320, height:320, borderRadius:"50%", background:"rgba(20,160,133,.14)", bottom:"-60px", right:"-60px", animation:"orb2 11s ease-in-out infinite", filter:"blur(50px)", pointerEvents:"none" }} />

      <div style={{ width: "100%", maxWidth: 480, position: "relative", zIndex: 2, animation: "fadeUp .4s ease both" }}>

        {/* logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src="/brand/logo-dark.svg" alt="Art of Tech Consulting." style={{ width: 210, maxWidth: "75vw", display: "inline-block" }} />
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 10, fontFamily: mono, letterSpacing: 1 }}>OPERATIONS PORTAL</div>
        </div>

        {/* ── PIN ENTRY (step 2) ── */}
        {selected ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", animation: "fadeUp .3s ease both" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28, padding: "14px 20px", borderRadius: 20, ...glass, width: "100%" }}>
              <div style={{ width: 46, height: 46, borderRadius: "50%", flexShrink: 0, background: unlocking ? "rgba(30,158,114,.5)" : "rgba(255,255,255,.15)", border: `2px solid ${unlocking ? "rgba(30,158,114,.8)" : "rgba(255,255,255,.3)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff", transition: "all .3s", animation: unlocking ? "pulse-ring 1s ease-out" : "none" }}>
                {unlocking ? "✓" : selected.initials}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{selected.name}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.45)", marginTop: 2 }}>{ROLE_LABEL[selected.role]}</div>
              </div>
              <button onClick={() => { setSelected(null); setPin(""); setError(""); }} style={{ background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.15)", color: "rgba(255,255,255,.6)", fontSize: 12, padding: "5px 12px", borderRadius: 10, cursor: "pointer", fontFamily: ff }}>← Back</button>
            </div>

            <div style={{ fontSize: 13, color: "rgba(255,255,255,.55)", marginBottom: 18, fontFamily: mono }}>Enter your 4-digit PIN</div>
            <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ width: 14, height: 14, borderRadius: "50%", background: i < pin.length ? (unlocking ? "rgba(30,158,114,.9)" : "#fff") : "transparent", border: `2px solid ${i < pin.length ? (unlocking ? "rgba(30,158,114,.9)" : "#fff") : "rgba(255,255,255,.3)"}`, transition: "all .15s" }} />
              ))}
            </div>
            <div style={{ height: 22, marginBottom: 14, fontSize: 12.5, color: "#F4A792", fontWeight: 600 }}>{error}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, width: "100%", maxWidth: 300 }}>
              {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((d, i) => (
                <button key={i} onClick={() => { if (!d) return; if (d === "⌫") clearPin(); else handlePin(d); }} disabled={unlocking}
                  style={{ height: 60, borderRadius: 18, fontSize: d === "⌫" ? 20 : 22, fontWeight: 700, fontFamily: ff, cursor: d ? "pointer" : "default", background: d ? "rgba(255,255,255,.09)" : "transparent", border: d ? "1.5px solid rgba(255,255,255,.14)" : "none", color: d === "⌫" ? "rgba(255,255,255,.55)" : "#fff", transition: "all .12s", opacity: unlocking ? 0.4 : 1 }}
                  onMouseOver={e => d && (e.currentTarget.style.background = "rgba(255,255,255,.18)")}
                  onMouseOut={e  => d && (e.currentTarget.style.background = d ? "rgba(255,255,255,.09)" : "transparent")}
                >{d}</button>
              ))}
            </div>
          </div>

        ) : (
          /* ── PROFILE SECTIONS ── */
          <div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)", textAlign: "center", marginBottom: 20, fontFamily: mono }}>
              Select your profile to continue
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {SECTIONS.map((sec, si) => {
                const members = allUsers.filter(u => sec.roles.includes(u.role));
                const isAdding = addingIn === sec.key;

                return (
                  <div key={sec.key} style={{ borderRadius: 20, overflow: "hidden", border: "1.5px solid rgba(255,255,255,.12)", animation: `fadeUp .4s ease ${si * 0.07}s both` }}>

                    {/* section header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: "rgba(255,255,255,.06)", borderBottom: members.length > 0 || isAdding ? "1px solid rgba(255,255,255,.1)" : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13, color: "rgba(255,255,255,.35)", fontFamily: mono }}>{sec.icon}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,.55)", letterSpacing: 0.8, textTransform: "uppercase", fontFamily: mono }}>{sec.label}</span>
                        {members.length > 0 && <span style={{ fontSize: 10, color: "rgba(255,255,255,.3)", fontFamily: mono }}>{members.length}</span>}
                      </div>
                      <button onClick={() => isAdding ? closeAdd() : openAdd(sec.key, sec.defaultRole)}
                        style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 12, cursor: "pointer", fontFamily: ff, transition: "all .15s", background: isAdding ? "rgba(255,255,255,.12)" : "rgba(30,158,114,.3)", border: isAdding ? "1px solid rgba(255,255,255,.2)" : "1px solid rgba(30,158,114,.4)", color: isAdding ? "rgba(255,255,255,.5)" : "rgba(255,255,255,.85)" }}>
                        {isAdding ? "✕ Cancel" : "+ Add"}
                      </button>
                    </div>

                    {/* existing profiles */}
                    {members.map((u) => (
                      <button key={u.id} onClick={() => selectUser(u)}
                        style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 16px", width: "100%", border: "none", borderBottom: "1px solid rgba(255,255,255,.07)", background: "transparent", cursor: "pointer", fontFamily: ff, textAlign: "left", transition: "background .15s" }}
                        onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,.1)"}
                        onMouseOut={e  => e.currentTarget.style.background = "transparent"}
                      >
                        <div style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0, background: "rgba(255,255,255,.12)", border: "2px solid rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff" }}>
                          {u.initials}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{u.name}</div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 1 }}>{ROLE_LABEL[u.role]} · {ROLE_DESC_MAP[u.role] || ""}</div>
                        </div>
                        {custom.some(c => c.id === u.id) && (
                          <button onClick={e => { e.stopPropagation(); deleteProfile(u.id); }}
                            style={{ width: 22, height: 22, borderRadius: "50%", border: "1px solid rgba(255,255,255,.2)", background: "rgba(255,255,255,.07)", color: "rgba(255,255,255,.4)", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>×</button>
                        )}
                        <span style={{ fontSize: 16, color: "rgba(255,255,255,.3)" }}>›</span>
                      </button>
                    ))}

                    {/* inline add form */}
                    {isAdding && (
                      <div style={{ padding: "16px 16px 14px", background: "rgba(0,0,0,.15)", animation: "slideDown .2s ease both" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.4)", fontFamily: mono, marginBottom: 12, letterSpacing: 0.5 }}>NEW {sec.label.toUpperCase()} PROFILE</div>

                        {/* role selector (within section roles only) */}
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                          {ALL_ROLES.filter(r => sec.roles.includes(r.key)).map(r => (
                            <button key={r.key} onClick={() => setFRole(r.key)}
                              style={{ padding: "5px 13px", borderRadius: 16, cursor: "pointer", fontFamily: ff, fontSize: 12, fontWeight: fRole === r.key ? 700 : 500, background: fRole === r.key ? "rgba(30,158,114,.4)" : "rgba(255,255,255,.08)", border: `1.5px solid ${fRole === r.key ? "rgba(30,158,114,.6)" : "rgba(255,255,255,.15)"}`, color: fRole === r.key ? "#fff" : "rgba(255,255,255,.55)", transition: "all .15s" }}>
                              {r.label}
                            </button>
                          ))}
                        </div>

                        {/* name + email */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                          <input style={inputStyle} placeholder="Full name" value={fName} onChange={e => { setFName(e.target.value); setFErr(""); }} />
                          <input style={inputStyle} placeholder="Email address" value={fEmail} onChange={e => { setFEmail(e.target.value); setFErr(""); }} />
                        </div>

                        {/* PIN */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                          <input style={{ ...inputStyle, letterSpacing: 6, fontSize: 16 }} placeholder="4-digit PIN" value={fPin1} type="password" inputMode="numeric" maxLength={4}
                            onChange={e => { setFPin1(e.target.value.replace(/\D/g,"").slice(0,4)); setFErr(""); }} />
                          <input style={{ ...inputStyle, letterSpacing: 6, fontSize: 16, borderColor: fErr && fPin1 !== fPin2 ? "rgba(242,100,80,.6)" : "rgba(255,255,255,.2)" }} placeholder="Confirm PIN" value={fPin2} type="password" inputMode="numeric" maxLength={4}
                            onChange={e => { setFPin2(e.target.value.replace(/\D/g,"").slice(0,4)); setFErr(""); }} />
                        </div>

                        {fErr && <div style={{ fontSize: 11.5, color: "#F4A792", fontWeight: 600, marginBottom: 8 }}>{fErr}</div>}

                        <button onClick={handleCreate}
                          style={{ width: "100%", padding: "10px 0", borderRadius: 12, border: "none", background: "rgba(30,158,114,.5)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: ff, transition: "background .15s" }}
                          onMouseOver={e => e.currentTarget.style.background = "rgba(30,158,114,.7)"}
                          onMouseOut={e  => e.currentTarget.style.background = "rgba(30,158,114,.5)"}
                        >Create profile</button>
                      </div>
                    )}

                    {/* empty state */}
                    {members.length === 0 && !isAdding && (
                      <div style={{ padding: "12px 16px", fontSize: 12, color: "rgba(255,255,255,.25)", fontFamily: mono }}>No profiles yet — click + Add</div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ textAlign: "center", marginTop: 36 }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.2)", fontFamily: mono, letterSpacing: 0.5 }}>art of tech · operations · v1</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
