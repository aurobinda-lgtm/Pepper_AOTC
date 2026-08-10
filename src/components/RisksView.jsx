import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { INK, SURFACE, PANEL, GRAY, GRAY2, LINE, OK, OK_BG, WARN, WARN_BG, RISK, RISK_BG, ff, mono } from "../brand/tokens.js";
import { useBlockers, useRisks, useBugs, useBugTrend, resolveBlocker, resolveBug } from "../lib/queries.js";

const PROB_COLOR  = { high:RISK, medium:WARN, low:GRAY2 };
const IMPACT_COLOR= { high:RISK, medium:WARN, low:OK   };

export default function RisksView({ addToast, mobile, tablet }) {
  const [tab, setTab]           = useState("blockers");
  const [resolvedBugs, setRB]   = useState(new Set());
  const [resolvedBlk,  setRBl]  = useState(new Set());

  const { data: blockersData, refetch: refetchBlockers } = useBlockers();
  const BLOCKERS = blockersData ?? [];
  const RISKS = useRisks().data ?? [];
  const { data: bugsData, refetch: refetchBugs } = useBugs();
  const BUGS = bugsData ?? [];
  const BUG_TREND = useBugTrend().data ?? [];

  const openBugs     = BUGS.filter(b => b.status !== "resolved" && !resolvedBugs.has(b.id));
  const p0 = openBugs.filter(b=>b.priority==="P0");
  const p1 = openBugs.filter(b=>b.priority==="P1");
  const p2 = openBugs.filter(b=>b.priority==="P2");
  const p3 = openBugs.filter(b=>b.priority==="P3");

  const openBlockers = BLOCKERS.filter(b => b.status !== "resolved" && !resolvedBlk.has(b.id));

  const handleResolveBlocker = async (b) => {
    setRBl(s=>{const n=new Set(s);n.add(b.id);return n;});
    addToast(`Blocker resolved: "${b.title}"`);
    await resolveBlocker(b.id);
    refetchBlockers();
  };

  const handleResolveBug = async (b) => {
    setRB(s=>{const n=new Set(s);n.add(b.id);return n;});
    addToast(`Bug resolved: "${b.title}"`);
    await resolveBug(b.id);
    refetchBugs();
  };

  return (
    <div>
      {/* sub-nav */}
      <div style={{ display:"flex", gap:8, marginBottom:24 }}>
        {[["blockers","🚧 Blockers & Risks"],["bugs","🐛 Bugs & Quality"]].map(([k,l]) => (
          <button key={k} onClick={()=>setTab(k)} style={{
            padding:"8px 20px", borderRadius:20, border:`1.5px solid ${tab===k?INK:LINE}`,
            background:tab===k?INK:SURFACE, color:tab===k?"#fff":GRAY2,
            fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:ff,
          }}>{l}</button>
        ))}
      </div>

      {/* ════════ BLOCKERS & RISKS ════════ */}
      {tab === "blockers" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {/* blockers */}
          <div style={{ background:SURFACE, border:`1.5px solid ${LINE}`, borderRadius:18, padding:"18px 20px" }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase",
                          color:GRAY, fontFamily:mono, marginBottom:14 }}>
              Active Blockers — {openBlockers.length} open
            </div>
            {openBlockers.map((b,i) => (
              <div key={b.id} style={{ padding:"12px 0", borderBottom: i<openBlockers.length-1?`1px solid ${PANEL}`:"none" }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                  <span style={{ fontSize:11, fontWeight:800, fontFamily:mono, padding:"2px 8px",
                                 borderRadius:6, flexShrink:0, marginTop:1,
                                 background: b.daysOpen >= 5 ? RISK_BG : WARN_BG,
                                 color: b.daysOpen >= 5 ? RISK : WARN }}>
                    {b.daysOpen}d open
                  </span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:INK }}>{b.title}</div>
                    <div style={{ fontSize:12, color:GRAY2, marginTop:3 }}>
                      Owner: <b style={{color:INK}}>{b.owner}</b> · Due: <span style={{color:WARN, fontFamily:mono}}>{b.dueDate}</span>
                    </div>
                    <div style={{ fontSize:12, color:GRAY, marginTop:2 }}>Impact: {b.impact}</div>
                  </div>
                  <div style={{ display:"flex", gap:8, flexShrink:0, alignItems:"center" }}>
                    {b.escalated && (
                      <span style={{ fontSize:10, fontWeight:800, background:RISK_BG, color:RISK,
                                     padding:"2px 8px", borderRadius:5 }}>ESCALATED</span>
                    )}
                    <button onClick={() => handleResolveBlocker(b)}
                      style={{ fontSize:12, fontWeight:700, padding:"5px 14px", borderRadius:10,
                               border:`1.5px solid ${LINE}`, background:SURFACE, color:GRAY2,
                               cursor:"pointer", fontFamily:ff }}>Resolve</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* risks */}
          <div style={{ background:SURFACE, border:`1.5px solid ${LINE}`, borderRadius:18, padding:"18px 20px" }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase",
                          color:GRAY, fontFamily:mono, marginBottom:14 }}>Top 5 Risks</div>
            {RISKS.map((r,i) => (
              <div key={r.id} style={{ padding:"12px 0", borderBottom: i<RISKS.length-1?`1px solid ${PANEL}`:"none" }}>
                <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                  <div style={{ display:"flex", flexDirection:"column", gap:4, flexShrink:0 }}>
                    <span style={{ fontSize:10, fontWeight:800, padding:"2px 7px", borderRadius:5,
                                   background:`${PROB_COLOR[r.probability]}22`, color:PROB_COLOR[r.probability],
                                   fontFamily:mono }}>P: {r.probability}</span>
                    <span style={{ fontSize:10, fontWeight:800, padding:"2px 7px", borderRadius:5,
                                   background:`${IMPACT_COLOR[r.impact]}22`, color:IMPACT_COLOR[r.impact],
                                   fontFamily:mono }}>I: {r.impact}</span>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13.5, fontWeight:700, color:INK }}>{r.title}</div>
                    <div style={{ fontSize:12, color:GRAY2, marginTop:3 }}>Owner: <b style={{color:INK}}>{r.owner}</b></div>
                    <div style={{ fontSize:12, color:GRAY, marginTop:2 }}>↳ {r.mitigation}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════ BUGS & QUALITY ════════ */}
      {tab === "bugs" && (
        <div>
          {/* priority summary */}
          <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
            {[["P0","Critical",p0.length,RISK,RISK_BG],["P1","High",p1.length,WARN,WARN_BG],
              ["P2","Medium",p2.length,GRAY2,PANEL],["P3","Low",p3.length,GRAY,PANEL]].map(([pri,lbl,cnt,col,bg]) => (
              <div key={pri} style={{ flex:"1 1 120px", background:bg,
                                      border:`1.5px solid ${col}44`, borderRadius:14,
                                      padding:"14px 16px", textAlign:"center" }}>
                <div style={{ fontSize:28, fontWeight:900, color:col, fontFamily:mono }}>{cnt}</div>
                <div style={{ fontSize:12, fontWeight:700, color:col }}>{pri}</div>
                <div style={{ fontSize:11, color:GRAY2 }}>{lbl}</div>
              </div>
            ))}
          </div>

          {/* trend chart */}
          <div style={{ background:SURFACE, border:`1.5px solid ${LINE}`, borderRadius:18,
                        padding:"18px 20px", marginBottom:20 }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase",
                          color:GRAY, fontFamily:mono, marginBottom:14 }}>Bugs Opened vs Resolved (5 weeks)</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={BUG_TREND} barGap={4}>
                <XAxis dataKey="week" tick={{fontSize:11,fill:GRAY}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize:11,fill:GRAY}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{fontSize:12,borderRadius:10,border:`1px solid ${LINE}`}} />
                <Bar dataKey="opened"   fill={RISK} radius={[4,4,0,0]} name="Opened"  />
                <Bar dataKey="resolved" fill={OK}   radius={[4,4,0,0]} name="Resolved"/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* bug list */}
          <div style={{ overflowX:"auto", borderRadius:18 }}>
          <div style={{ background:SURFACE, border:`1.5px solid ${LINE}`, borderRadius:18, minWidth:560 }}>
            <div style={{ padding:"12px 20px", background:PANEL, borderRadius:"16px 16px 0 0",
                          display:"grid", gridTemplateColumns:"60px 2fr 1fr 1fr 1fr 80px",
                          fontSize:10.5, fontWeight:800, color:GRAY, letterSpacing:0.8,
                          textTransform:"uppercase", fontFamily:mono, gap:12 }}>
              <span>Priority</span><span>Bug</span><span>Project</span>
              <span>Assignee</span><span>Age</span><span>Status</span>
            </div>
            {openBugs.map((b,i) => {
              const col = b.priority==="P0"?RISK:b.priority==="P1"?WARN:b.priority==="P2"?GRAY2:GRAY;
              return (
                <div key={b.id} style={{ display:"grid",
                  gridTemplateColumns:"60px 2fr 1fr 1fr 1fr 80px", gap:12,
                  padding:"12px 20px", alignItems:"center",
                  borderBottom: i<openBugs.length-1?`1px solid ${PANEL}`:"none",
                  background: b.priority==="P0" ? `${RISK}06` : "transparent" }}>
                  <span style={{ fontSize:11, fontWeight:900, color:col, fontFamily:mono }}>{b.priority}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:INK }}>{b.title}</span>
                  <span style={{ fontSize:12, color:GRAY2 }}>{b.project}</span>
                  <span style={{ fontSize:12, color:GRAY2 }}>{b.assignee}</span>
                  <span style={{ fontSize:12, fontFamily:mono, color:b.openedDays>7?RISK:GRAY2 }}>{b.openedDays}d</span>
                  <button onClick={()=>handleResolveBug(b)}
                    style={{ fontSize:11, padding:"4px 10px", borderRadius:8,
                             border:`1px solid ${LINE}`, background:SURFACE, color:GRAY2,
                             cursor:"pointer", fontFamily:ff }}>Resolve</button>
                </div>
              );
            })}
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
