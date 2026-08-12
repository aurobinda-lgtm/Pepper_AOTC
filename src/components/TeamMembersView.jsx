import { useState } from "react";
import { INK, SURFACE, PANEL, GRAY, GRAY2, LINE, OK, OK_BG, RISK, RISK_BG, ff, mono } from "../brand/tokens.js";
import { useProfiles, setProfileActive, inviteTeamMember } from "../lib/queries.js";
import { SUPABASE_CONFIGURED } from "../lib/supabaseClient.js";
import { USERS, ROLE_LABEL } from "../data/users.js";
import {
  loadCustomMembers, addLocalMember,
  getScopeProjects, setScopeProjects, isDeactivated, setDeactivated,
} from "../lib/localDirectory.js";
import { ALL_PROJECTS } from "../lib/access.js";

const ROLE_OPTIONS = [
  { value: "pm",       label: "PM" },
  { value: "cto",      label: "Leadership (CTO)" },
  { value: "cdo",      label: "Leadership (CDO)" },
  { value: "delivery", label: "Delivery" },
];

const inp = {
  width: "100%", boxSizing: "border-box", padding: "8px 11px", borderRadius: 9,
  border: `1.5px solid ${LINE}`, fontSize: 13, fontFamily: ff, color: INK,
  background: SURFACE, outline: "none",
};

function buildLocalProfiles() {
  return [...USERS.filter((u) => u.writeAccess), ...loadCustomMembers()].map((u) => ({
    id: u.id, name: u.name, email: u.email, role: u.role,
    active: !isDeactivated(u.email),
    scopeProjects: getScopeProjects(u),
  }));
}

function SpacesChips({ scopeProjects }) {
  if (!scopeProjects) return <span style={{ fontSize: 11, color: GRAY2, fontStyle: "italic" }}>All spaces</span>;
  if (scopeProjects.length === 0) return <span style={{ fontSize: 11, color: GRAY2, fontStyle: "italic" }}>No spaces assigned</span>;
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", maxWidth: 220 }}>
      {scopeProjects.map((s) => (
        <span key={s} style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: PANEL, color: GRAY2 }}>{s}</span>
      ))}
    </div>
  );
}

export default function TeamMembersView({ addToast, mobile, user }) {
  const isPM = user?.role === "pm";
  // Adding new accounts is restricted to the PM and the COO/operations head (Indranil, role "cto") —
  // everyone else can still see the roster but not create new logins.
  const canAddMembers = user?.role === "pm" || user?.role === "cto";
  // eslint-disable-next-line no-unused-vars -- read only to force a re-render after a local-storage write
  const [localTick, setLocalTick] = useState(0);
  const live = useProfiles(); // always called (rules of hooks) — a no-op when Supabase isn't configured
  const PROFILES = SUPABASE_CONFIGURED ? (live.data ?? []) : buildLocalProfiles();
  const refetch = SUPABASE_CONFIGURED ? live.refetch : () => setLocalTick((t) => t + 1);

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName]   = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole]   = useState("delivery");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [lastCreated, setLastCreated] = useState(null); // { email, password }

  const [editingSpacesFor, setEditingSpacesFor] = useState(null); // profile id
  const [spacesDraft, setSpacesDraft] = useState([]);
  const [unrestrictedDraft, setUnrestrictedDraft] = useState(false);

  const resetForm = () => { setName(""); setEmail(""); setRole("delivery"); setError(""); };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) { setError("Name and email are required."); return; }
    setSubmitting(true);
    setError("");
    if (SUPABASE_CONFIGURED) {
      const { data, error: inviteErr } = await inviteTeamMember({ name: name.trim(), email: email.trim(), role });
      setSubmitting(false);
      if (inviteErr) { setError(inviteErr.message || "Could not create the account."); return; }
      setLastCreated(data);
      addToast(`✓ Added ${name.trim()} — share their temporary password securely`);
    } else {
      addLocalMember({ name: name.trim(), email: email.trim(), role });
      setSubmitting(false);
      addToast(`✓ Added ${name.trim()} — they can sign in with just their email for now (local mode, no Supabase yet)`);
    }
    resetForm();
    setShowAdd(false);
    refetch();
  };

  const toggleActive = async (p) => {
    if (SUPABASE_CONFIGURED) await setProfileActive(p.id, !p.active);
    else setDeactivated(p.email, p.active);
    addToast(p.active ? `${p.name} deactivated` : `${p.name} reactivated`);
    refetch();
  };

  const openSpacesEditor = (p) => {
    setEditingSpacesFor(p.id);
    setSpacesDraft(p.scopeProjects ?? []);
    setUnrestrictedDraft(p.scopeProjects == null);
  };
  const toggleSpace = (s) => setSpacesDraft((d) => (d.includes(s) ? d.filter((x) => x !== s) : [...d, s]));
  const saveSpaces = (p) => {
    setScopeProjects(p.email, unrestrictedDraft ? null : spacesDraft);
    addToast(`✓ Updated spaces for ${p.name}`);
    setEditingSpacesFor(null);
    refetch();
  };

  return (
    <div>
      {!SUPABASE_CONFIGURED && (
        <div style={{ fontSize: 11.5, color: GRAY2, background: PANEL, border: `1px solid ${LINE}`, borderRadius: 10, padding: "8px 12px", marginBottom: 16 }}>
          Running in local/demo mode — members and space assignments are saved in this browser until Supabase is connected.
        </div>
      )}

      {/* ── one-time temp password banner ── */}
      {lastCreated && (
        <div style={{ background: OK_BG, border: `1.5px solid ${OK}44`, borderRadius: 14,
                      padding: "14px 16px", marginBottom: 16, display: "flex", gap: 12,
                      alignItems: "flex-start", flexWrap: "wrap" }}>
          <span style={{ fontSize: 18 }}>🔑</span>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: OK }}>Account created — copy this now, it won't be shown again</div>
            <div style={{ fontSize: 12.5, color: INK, marginTop: 4, fontFamily: mono }}>
              {lastCreated.email} · {lastCreated.password}
            </div>
          </div>
          <button onClick={() => setLastCreated(null)} style={{
            fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 8,
            border: `1px solid ${LINE}`, background: SURFACE, color: GRAY2, cursor: "pointer", fontFamily: ff,
          }}>Dismiss</button>
        </div>
      )}

      {/* ── header + add button ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: INK }}>👥 Team Members</div>
          <div style={{ fontSize: 12, color: GRAY2, marginTop: 2 }}>
            {PROFILES.filter(p => p.active).length} active · {PROFILES.filter(p => !p.active).length} deactivated
          </div>
        </div>
        {canAddMembers && (
          <button onClick={() => setShowAdd(s => !s)} style={{
            marginLeft: "auto", fontSize: 13, fontWeight: 700, padding: "8px 18px", borderRadius: 12,
            border: "none", background: showAdd ? PANEL : INK, color: showAdd ? GRAY2 : "#fff",
            cursor: "pointer", fontFamily: ff,
          }}>{showAdd ? "✕ Cancel" : "+ Add member"}</button>
        )}
      </div>

      {/* ── add member form (PM + COO/operations head only) ── */}
      {canAddMembers && showAdd && (
        <form onSubmit={handleAdd} style={{ background: SURFACE, border: `1.5px solid ${INK}33`, borderRadius: 16,
                                             padding: "16px 18px", marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr 1fr", gap: "12px 16px", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: GRAY, textTransform: "uppercase", letterSpacing: 0.6, fontFamily: mono, marginBottom: 5 }}>Name</div>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" style={inp} />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: GRAY, textTransform: "uppercase", letterSpacing: 0.6, fontFamily: mono, marginBottom: 5 }}>Email</div>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="name@artoftechconsulting.com" style={inp} />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: GRAY, textTransform: "uppercase", letterSpacing: 0.6, fontFamily: mono, marginBottom: 5 }}>Role</div>
              <select value={role} onChange={e => setRole(e.target.value)} style={inp}>
                {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>
          {error && <div style={{ fontSize: 12, color: RISK, fontWeight: 600, marginBottom: 10 }}>{error}</div>}
          <button type="submit" disabled={submitting} style={{
            fontSize: 13, fontWeight: 700, padding: "9px 22px", borderRadius: 12, border: "none",
            background: INK, color: "#fff", cursor: submitting ? "default" : "pointer", fontFamily: ff,
            opacity: submitting ? 0.6 : 1,
          }}>{submitting ? "Creating…" : "Create account"}</button>
        </form>
      )}

      {/* ── member list ── */}
      <div style={{ background: SURFACE, border: `1.5px solid ${LINE}`, borderRadius: 18, overflow: "hidden" }}>
        {PROFILES.length === 0 && (
          <div style={{ padding: "20px", fontSize: 13, color: GRAY2 }}>No team members yet{canAddMembers ? " — add the first one above." : "."}</div>
        )}
        {PROFILES.map((p, i) => (
          <div key={p.id} style={{ borderBottom: i < PROFILES.length - 1 ? `1px solid ${PANEL}` : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 20px", flexWrap: "wrap", opacity: p.active ? 1 : 0.55 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: INK, color: "#fff",
                            fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {p.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
              </div>
              <div style={{ flex: 1, minWidth: 140 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: INK }}>{p.name}</div>
                <div style={{ fontSize: 11.5, color: GRAY2, marginTop: 1 }}>{p.email}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 8,
                             background: PANEL, color: GRAY2, whiteSpace: "nowrap" }}>{ROLE_LABEL[p.role] || p.role}</span>
              {p.role !== "pm" && <SpacesChips scopeProjects={p.scopeProjects} />}
              {!p.active && <span style={{ fontSize: 10, fontWeight: 800, background: RISK_BG, color: RISK, padding: "2px 8px", borderRadius: 6 }}>DEACTIVATED</span>}
              {isPM && p.role !== "pm" && (
                <button onClick={() => openSpacesEditor(p)} style={{
                  fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 8,
                  border: `1px solid ${LINE}`, background: SURFACE, color: GRAY2, cursor: "pointer", fontFamily: ff,
                }}>Edit spaces</button>
              )}
              {isPM && (
                <button onClick={() => toggleActive(p)} style={{
                  fontSize: 12, fontWeight: 700, padding: "5px 14px", borderRadius: 10,
                  border: `1.5px solid ${LINE}`, background: p.active ? SURFACE : OK_BG,
                  color: p.active ? GRAY2 : OK, cursor: "pointer", fontFamily: ff, flexShrink: 0,
                }}>{p.active ? "Deactivate" : "Reactivate"}</button>
              )}
            </div>

            {/* ── spaces editor (PM only, one at a time) ── */}
            {isPM && editingSpacesFor === p.id && (
              <div style={{ padding: "0 20px 16px 70px" }}>
                <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 12, padding: "14px 16px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 700, color: INK, marginBottom: 10, cursor: "pointer" }}>
                    <input type="checkbox" checked={unrestrictedDraft} onChange={e => setUnrestrictedDraft(e.target.checked)} />
                    All spaces (PM-level access)
                  </label>
                  {!unrestrictedDraft && (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                      {ALL_PROJECTS.map((s) => {
                        const on = spacesDraft.includes(s);
                        return (
                          <button key={s} type="button" onClick={() => toggleSpace(s)} style={{
                            fontSize: 12, fontWeight: 700, padding: "5px 13px", borderRadius: 20, cursor: "pointer", fontFamily: ff,
                            border: `1.5px solid ${on ? INK : LINE}`, background: on ? INK : SURFACE, color: on ? "#fff" : GRAY2,
                          }}>{s}</button>
                        );
                      })}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => saveSpaces(p)} style={{
                      fontSize: 12, fontWeight: 700, padding: "6px 16px", borderRadius: 10, border: "none",
                      background: OK, color: "#fff", cursor: "pointer", fontFamily: ff,
                    }}>Save</button>
                    <button onClick={() => setEditingSpacesFor(null)} style={{
                      fontSize: 12, fontWeight: 700, padding: "6px 16px", borderRadius: 10, border: `1px solid ${LINE}`,
                      background: SURFACE, color: GRAY2, cursor: "pointer", fontFamily: ff,
                    }}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
