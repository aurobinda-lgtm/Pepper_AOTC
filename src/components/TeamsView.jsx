import { INK, SURFACE, PANEL, GRAY, GRAY2, LINE, OK, OK_BG, WARN, WARN_BG, RISK, RISK_BG, ff, mono } from "../brand/tokens.js";
import { useTeamCapacity, useDecisions, useHealthMatrix, closeDecision } from "../lib/queries.js";
import { useState } from "react";

function LoadBar({ load }) {
  const color = load > 120 ? RISK : load > 100 ? WARN : OK;
  return (
    <div style={{ flex:1, background:PANEL, borderRadius:6, height:8, overflow:"hidden", minWidth:60 }}>
      <div style={{ width:`${Math.min(load,150)/1.5}%`, height:"100%", background:color, borderRadius:6, transition:"width .4s" }} />
    </div>
  );
}

export default function TeamsView({ addToast, mobile, tablet }) {
  const [decDone, setDecDone] = useState(new Set());
  const TEAM_CAPACITY = useTeamCapacity().data ?? [];
  const HEALTH_MATRIX = useHealthMatrix().data ?? [];
  const { data: decisionsData, refetch: refetchDecisions } = useDecisions();
  const DECISIONS = decisionsData ?? [];

  const handleCloseDecision = async (d) => {
    setDecDone((s) => { const n = new Set(s); n.add(d.id); return n; });
    addToast(`Decision closed: "${d.title}"`);
    await closeDecision(d.id);
    refetchDecisions();
  };

  return (
    <div>
      {/* ── Capacity overview ──────────────────────────────── */}
      <div style={{ background:SURFACE, border:`1.5px solid ${LINE}`, borderRadius:18,
                    padding:"18px 20px", marginBottom:20 }}>
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase",
                      color:GRAY, fontFamily:mono, marginBottom:16 }}>Team Capacity & Workload</div>

        {/* legend */}
        <div style={{ display:"flex", gap:16, marginBottom:12, fontSize:11, color:GRAY }}>
          <span style={{ display:"flex", alignItems:"center", gap:5 }}>
            <span style={{ width:10, height:10, borderRadius:2, background:OK }} /> Under 100%
          </span>
          <span style={{ display:"flex", alignItems:"center", gap:5 }}>
            <span style={{ width:10, height:10, borderRadius:2, background:WARN }} /> 100–120% — at risk
          </span>
          <span style={{ display:"flex", alignItems:"center", gap:5 }}>
            <span style={{ width:10, height:10, borderRadius:2, background:RISK }} /> Over 120% — critical
          </span>
        </div>

        {TEAM_CAPACITY.map((t,i) => {
          const color = t.load > 120 ? RISK : t.load > 100 ? WARN : OK;
          const bg    = t.load > 120 ? RISK_BG : t.load > 100 ? WARN_BG : OK_BG;
          return (
            <div key={t.team} style={{ display:"grid", gridTemplateColumns:"100px 1fr 80px 60px 80px",
                                        gap:12, alignItems:"center", padding:"10px 0",
                                        borderBottom: i<TEAM_CAPACITY.length-1?`1px solid ${PANEL}`:"none" }}>
              <span style={{ fontSize:13.5, fontWeight:700, color:INK }}>{t.team}</span>
              <LoadBar load={t.load} />
              <span style={{ fontSize:13, fontWeight:800, color, fontFamily:mono, textAlign:"right" }}>{t.load}%</span>
              <span style={{ fontSize:11, color:GRAY2, fontFamily:mono }}>{t.members} ppl</span>
              {t.blocked > 0
                ? <span style={{ fontSize:11, fontWeight:700, background:RISK_BG, color:RISK,
                                  padding:"2px 8px", borderRadius:6, fontFamily:mono, textAlign:"center" }}>
                    {t.blocked} blocked
                  </span>
                : <span style={{ fontSize:11, color:OK, fontFamily:mono }}>✓ clear</span>
              }
            </div>
          );
        })}

        {/* summary row */}
        <div style={{ marginTop:14, padding:"12px 16px", background:PANEL, borderRadius:12,
                      display:"flex", gap:20, flexWrap:"wrap", fontSize:12 }}>
          <span>Total people: <b style={{color:INK}}>{TEAM_CAPACITY.reduce((s,t)=>s+t.members,0)}</b></span>
          <span>Avg load: <b style={{color:WARN}}>{Math.round(TEAM_CAPACITY.reduce((s,t)=>s+t.load,0)/TEAM_CAPACITY.length)}%</b></span>
          <span>Teams overloaded: <b style={{color:RISK}}>{TEAM_CAPACITY.filter(t=>t.load>100).length}</b></span>
          <span>Blocked members: <b style={{color:RISK}}>{TEAM_CAPACITY.reduce((s,t)=>s+t.blocked,0)}</b></span>
        </div>
      </div>

      {/* ── Health matrix for reference ─────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns:mobile?"1fr":"1fr 1fr", gap:16, marginBottom:20 }}>
        <div style={{ background:SURFACE, border:`1.5px solid ${LINE}`, borderRadius:18, padding:"18px 20px" }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase",
                        color:GRAY, fontFamily:mono, marginBottom:14 }}>Health by Area</div>
          {HEALTH_MATRIX.map((h,i) => {
            const col = h.status==="green"?OK:h.status==="yellow"?WARN:RISK;
            const bg  = h.status==="green"?OK_BG:h.status==="yellow"?WARN_BG:RISK_BG;
            return (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px",
                                    borderRadius:10, marginBottom:6, background:bg }}>
                <span style={{ width:9, height:9, borderRadius:"50%", background:col, flexShrink:0 }} />
                <span style={{ flex:1, fontSize:13, color:INK }}>{h.area}</span>
                <span style={{ fontSize:11, fontWeight:700, color:col, fontFamily:mono }}>
                  {h.status==="green"?"On Track":h.status==="yellow"?"At Risk":"Off Track"}
                </span>
              </div>
            );
          })}
        </div>

        {/* capacity risk notes */}
        <div style={{ background:SURFACE, border:`1.5px solid ${LINE}`, borderRadius:18, padding:"18px 20px" }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase",
                        color:GRAY, fontFamily:mono, marginBottom:14 }}>Capacity Recommendations</div>
          {[
            { team:"QA",      load:145, action:"Hire contract QA for 2 weeks — 2 open P0 bugs need urgent coverage" },
            { team:"Backend", load:122, action:"RBAC blocker is adding load — resolve design dependency first"       },
            { team:"DevOps",  load:95,  action:"Close to limit — avoid adding more infra tasks before release"       },
            { team:"Design",  load:65,  action:"Design has spare bandwidth — can absorb onboarding v2 finalization"  },
          ].map((r,i) => (
            <div key={r.team} style={{ padding:"10px 0", borderBottom:i<3?`1px solid ${PANEL}`:"none" }}>
              <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4 }}>
                <span style={{ fontSize:11.5, fontWeight:800, color:INK }}>{r.team}</span>
                <span style={{ fontSize:11, fontWeight:700, fontFamily:mono,
                               color: r.load>120?RISK:r.load>100?WARN:OK }}>{r.load}%</span>
              </div>
              <div style={{ fontSize:12, color:GRAY2 }}>{r.action}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Pending decisions ──────────────────────────────────── */}
      <div style={{ background:SURFACE, border:`1.5px solid ${LINE}`, borderRadius:18, padding:"18px 20px" }}>
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase",
                      color:GRAY, fontFamily:mono, marginBottom:14 }}>
          ⏳ Decisions Tracker — {DECISIONS.filter(d=>!decDone.has(d.id)).length} pending
        </div>
        <div style={{ display:"grid", gridTemplateColumns:mobile?"1fr":tablet?"1fr 1fr":"repeat(auto-fill,minmax(280px,1fr))", gap:12 }}>
          {DECISIONS.map(d => {
            const resolved = decDone.has(d.id);
            return (
              <div key={d.id} style={{ background: resolved ? OK_BG : d.escalation ? RISK_BG : PANEL,
                                       border:`1.5px solid ${resolved?OK:d.escalation?"#F2C4BC":LINE}`,
                                       borderRadius:14, padding:"14px 16px", opacity: resolved ? 0.6 : 1 }}>
                <div style={{ display:"flex", gap:8, alignItems:"flex-start", marginBottom:6 }}>
                  <div style={{ flex:1, fontSize:13.5, fontWeight:700, color:INK,
                                textDecoration: resolved?"line-through":"none" }}>{d.title}</div>
                  {d.escalation && !resolved && (
                    <span style={{ fontSize:9, fontWeight:900, background:RISK_BG, color:RISK,
                                   padding:"2px 7px", borderRadius:4, flexShrink:0 }}>ESCALATE</span>
                  )}
                </div>
                <div style={{ fontSize:11.5, color:GRAY2, marginBottom:4 }}>
                  Owner: <b style={{color:INK}}>{d.owner}</b>
                </div>
                <div style={{ fontSize:11.5, color:GRAY2, marginBottom:4 }}>
                  Impact: {d.impact}
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:8 }}>
                  <span style={{ fontSize:11, fontFamily:mono, color:d.pendingSince>4?RISK:WARN }}>
                    Pending {d.pendingSince}d
                  </span>
                  {!resolved && (
                    <button onClick={()=>handleCloseDecision(d)}
                      style={{ fontSize:12, fontWeight:700, padding:"5px 14px", borderRadius:10,
                               border:`1.5px solid ${LINE}`, background:SURFACE, color:GRAY2,
                               cursor:"pointer", fontFamily:ff }}>
                      Mark done
                    </button>
                  )}
                  {resolved && <span style={{ fontSize:12, color:OK, fontWeight:700 }}>✓ Resolved</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
