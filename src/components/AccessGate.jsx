import { useState, useEffect } from "react";
import { ROLE_LABEL } from "../data/users.js";
import { getAllProfiles } from "../lib/localDirectory.js";
import { INK, ff, mono } from "../brand/tokens.js";
import { signInWithPassword } from "../lib/session.js";
import { SUPABASE_CONFIGURED } from "../lib/supabaseClient.js";

// TEMP: skip PIN/password entry entirely — a matched email signs straight in.
// Flip back to false once Supabase auth is actually configured.
const SKIP_AUTH = true;

export default function AccessGate({ onUnlock }) {
  const [selected,  setSelected]  = useState(null);
  const [emailInput, setEmailInput] = useState("");
  const [lookupErr, setLookupErr] = useState("");
  const [pin,       setPin]       = useState("");
  const [password,  setPassword]  = useState("");
  const [error,     setError]     = useState("");
  const [unlocking, setUnlocking] = useState(false);

  const findByEmail = (email) => {
    const norm = email.trim().toLowerCase();
    return getAllProfiles().find((u) => u.email?.toLowerCase() === norm);
  };

  const submitEmail = (e) => {
    e.preventDefault();
    const match = findByEmail(emailInput);
    if (!match) { setLookupErr("No account found for that email — check with your PM."); return; }
    setLookupErr("");
    if (SKIP_AUTH) { onUnlock(match); return; }
    setSelected(match); setPin(""); setPassword(""); setError("");
  };

  const backToEmail = () => { setSelected(null); setPin(""); setPassword(""); setError(""); setEmailInput(""); };
  const clearPin    = ()  => { setPin(""); setError(""); };

  const attemptPasswordLogin = async (e) => {
    e.preventDefault();
    if (!password) return;
    setUnlocking(true);
    setError("");
    const { error: authErr } = await signInWithPassword(selected.email, password);
    if (authErr) {
      setUnlocking(false);
      setError(authErr.message || "Sign-in failed — check your password");
      return;
    }
    setTimeout(() => onUnlock(selected), 400);
  };

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
    if (!selected || unlocking || selected.writeAccess) return;
    const onKey = (e) => {
      if (e.key >= "0" && e.key <= "9") handlePin(e.key);
      else if (e.key === "Backspace") clearPin();
      else if (e.key === "Escape") backToEmail();
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
    padding: "12px 14px", borderRadius: 12,
    background: "rgba(255,255,255,.1)", border: "1.5px solid rgba(255,255,255,.2)",
    color: "#fff", fontSize: 14, fontFamily: ff, outline: "none",
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
        input::placeholder { color: rgba(255,255,255,.35); }
        input:focus { border-color: rgba(255,255,255,.45) !important; }
      `}</style>

      <div style={{ position:"absolute", width:420, height:420, borderRadius:"50%", background:"rgba(30,158,114,.18)", top:"-100px", left:"-80px", animation:"orb1 8s ease-in-out infinite", filter:"blur(40px)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", width:320, height:320, borderRadius:"50%", background:"rgba(20,160,133,.14)", bottom:"-60px", right:"-60px", animation:"orb2 11s ease-in-out infinite", filter:"blur(50px)", pointerEvents:"none" }} />

      <div style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 2, animation: "fadeUp .4s ease both" }}>

        {/* logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src="/brand/logo-dark.svg" alt="Art of Tech Consulting." style={{ width: 210, maxWidth: "75vw", display: "inline-block" }} />
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 10, fontFamily: mono, letterSpacing: 1 }}>OPERATIONS PORTAL</div>
        </div>

        {selected ? (
          /* ── STEP 2: PIN or password, scoped to just this one matched person ── */
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", animation: "fadeUp .3s ease both" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28, padding: "14px 20px", borderRadius: 20, ...glass, width: "100%" }}>
              <div style={{ width: 46, height: 46, borderRadius: "50%", flexShrink: 0, background: unlocking ? "rgba(30,158,114,.5)" : "rgba(255,255,255,.15)", border: `2px solid ${unlocking ? "rgba(30,158,114,.8)" : "rgba(255,255,255,.3)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff", transition: "all .3s", animation: unlocking ? "pulse-ring 1s ease-out" : "none" }}>
                {unlocking ? "✓" : selected.initials}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{selected.name}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.45)", marginTop: 2 }}>{ROLE_LABEL[selected.role]}</div>
              </div>
              <button onClick={backToEmail} style={{ background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.15)", color: "rgba(255,255,255,.6)", fontSize: 12, padding: "5px 12px", borderRadius: 10, cursor: "pointer", fontFamily: ff }}>← Not you?</button>
            </div>

            {selected.writeAccess ? (
              /* ── Real email + password sign-in (Supabase Auth) ── */
              <form onSubmit={attemptPasswordLogin} style={{ width: "100%", maxWidth: 320, display: "flex", flexDirection: "column", alignItems: "stretch" }}>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,.55)", marginBottom: 14, fontFamily: mono, textAlign: "center" }}>
                  {SUPABASE_CONFIGURED ? "Sign in with your password" : "Supabase isn't configured yet — see .env.example"}
                </div>
                <input
                  type="password"
                  autoFocus
                  placeholder="Password"
                  value={password}
                  disabled={unlocking || !SUPABASE_CONFIGURED}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  style={{ ...inputStyle, marginBottom: 12 }}
                />
                <div style={{ minHeight: 20, marginBottom: 10, fontSize: 12.5, color: "#F4A792", fontWeight: 600, textAlign: "center" }}>{error}</div>
                <button type="submit" disabled={unlocking || !password || !SUPABASE_CONFIGURED}
                  style={{ width: "100%", padding: "12px 0", borderRadius: 12, border: "none", background: "rgba(30,158,114,.6)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: ff, opacity: unlocking || !password || !SUPABASE_CONFIGURED ? 0.5 : 1 }}
                >{unlocking ? "Signing in…" : "Sign in"}</button>
              </form>
            ) : (
              <>
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
              </>
            )}
          </div>

        ) : (
          /* ── STEP 1: email only — nobody else's name is ever shown ── */
          <form onSubmit={submitEmail} style={{ animation: "fadeUp .3s ease both" }}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)", textAlign: "center", marginBottom: 20, fontFamily: mono }}>
              Enter your email to continue
            </div>
            <input
              autoFocus
              type="email"
              placeholder="you@artoftechconsulting.com"
              value={emailInput}
              onChange={e => { setEmailInput(e.target.value); setLookupErr(""); }}
              style={{ ...inputStyle, marginBottom: 12, textAlign: "center" }}
            />
            <div style={{ minHeight: 18, marginBottom: 10, fontSize: 12.5, color: "#F4A792", fontWeight: 600, textAlign: "center" }}>{lookupErr}</div>
            <button type="submit" disabled={!emailInput.trim()} style={{
              width: "100%", padding: "12px 0", borderRadius: 12, border: "none",
              background: "rgba(30,158,114,.6)", color: "#fff", fontSize: 14, fontWeight: 700,
              cursor: emailInput.trim() ? "pointer" : "default", fontFamily: ff, opacity: emailInput.trim() ? 1 : 0.5,
            }}>Continue</button>

            <div style={{ textAlign: "center", marginTop: 36 }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.2)", fontFamily: mono, letterSpacing: 0.5 }}>art of tech · operations · v1</div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
