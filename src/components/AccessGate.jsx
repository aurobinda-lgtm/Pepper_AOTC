import { useState } from "react";
import { USERS, ROLE_LABEL } from "../data/users.js";
import { INK, ff, mono } from "../brand/tokens.js";
import { signInWithPassword, getProfile, isAllowedEmailDomain, signOut } from "../lib/session.js";
import { SUPABASE_CONFIGURED } from "../lib/supabaseClient.js";

export default function AccessGate({ onUnlock }) {
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [error,     setError]     = useState("");
  const [unlocking, setUnlocking] = useState(false);

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

  // ── Real mode: real Supabase accounts, no PINs, no local user list.
  // Restricted to Art of Tech company email domains — see session.js's
  // isAllowedEmailDomain. Which org(s) a signed-in user sees comes from
  // organization_members, not from this form.
  const submitLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setUnlocking(true);
    setError("");
    if (!isAllowedEmailDomain(email.trim())) {
      setUnlocking(false);
      setError("Only Art of Tech company accounts can sign in here.");
      return;
    }
    const { error: authErr } = await signInWithPassword(email.trim(), password);
    if (authErr) {
      setUnlocking(false);
      setError(authErr.message || "Sign-in failed — check your email and password");
      return;
    }
    const profile = await getProfile();
    if (!profile) {
      setUnlocking(false);
      await signOut();
      setError("Signed in, but no profile found for this account — check with your PM.");
      return;
    }
    onUnlock(profile);
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
        input::placeholder { color: rgba(255,255,255,.35); }
        input:focus { border-color: rgba(255,255,255,.45) !important; }
      `}</style>

      <div style={{ position:"absolute", width:420, height:420, borderRadius:"50%", background:"rgba(30,158,114,.18)", top:"-100px", left:"-80px", animation:"orb1 8s ease-in-out infinite", filter:"blur(40px)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", width:320, height:320, borderRadius:"50%", background:"rgba(20,160,133,.14)", bottom:"-60px", right:"-60px", animation:"orb2 11s ease-in-out infinite", filter:"blur(50px)", pointerEvents:"none" }} />

      <div style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 2, animation: "fadeUp .4s ease both" }}>

        {/* logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src="/brand/logo-dark.svg" alt="Pepper" style={{ width: 210, maxWidth: "75vw", display: "inline-block" }} />
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 10, fontFamily: mono, letterSpacing: 1 }}>WORKSPACE SIGN-IN</div>
        </div>

        {SUPABASE_CONFIGURED ? (
          <form onSubmit={submitLogin} style={{ animation: "fadeUp .3s ease both" }}>
            <div style={{ padding: "18px 20px", borderRadius: 20, ...glass, marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                autoFocus
                type="email"
                placeholder="you@company.com"
                value={email}
                disabled={unlocking}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                style={inputStyle}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                disabled={unlocking}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                style={inputStyle}
              />
            </div>
            <div style={{ minHeight: 18, marginBottom: 10, fontSize: 12.5, color: "#F4A792", fontWeight: 600, textAlign: "center" }}>{error}</div>
            <button type="submit" disabled={unlocking || !email.trim() || !password} style={{
              width: "100%", padding: "12px 0", borderRadius: 12, border: "none",
              background: "rgba(30,158,114,.6)", color: "#fff", fontSize: 14, fontWeight: 700,
              cursor: "pointer", fontFamily: ff, opacity: unlocking || !email.trim() || !password ? 0.5 : 1,
            }}>{unlocking ? "Signing in…" : "Sign in"}</button>

            <div style={{ textAlign: "center", marginTop: 36 }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.2)", fontFamily: mono, letterSpacing: 0.5 }}>pepper · v1</div>
            </div>
          </form>
        ) : (
          /* ── Local dev mode: no Supabase configured, nothing to authenticate
             against — click a persona to continue. Not a security flow. ── */
          <div style={{ animation: "fadeUp .3s ease both" }}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.5)", textAlign: "center", marginBottom: 18, fontFamily: mono }}>
              Local dev mode — Supabase isn't configured (see .env.example).<br />Continue as:
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, borderRadius: 18, overflow: "hidden", ...glass }}>
              {USERS.map(u => (
                <button key={u.id} onClick={() => onUnlock(u)} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                  border: "none", background: "transparent", cursor: "pointer", fontFamily: ff, textAlign: "left",
                  borderBottom: "1px solid rgba(255,255,255,.08)",
                }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,.15)", border: "1.5px solid rgba(255,255,255,.25)", color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {u.initials}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{u.name}</div>
                    <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.45)" }}>{ROLE_LABEL[u.role]}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
