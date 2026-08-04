import { useState } from "react";
import { INK, SURFACE, PANEL, GRAY, GRAY2, LINE, OK, OK_BG, WARN, WARN_BG, RISK, RISK_BG, ff, mono } from "../brand/tokens.js";
import { FEATURES, RELEASES, CURRENT_SPRINT } from "../data/pm_seed.js";

const STATUS_META = {
  completed:   { label:"Done",        color:OK,   bg:OK_BG   },
  in_progress: { label:"In Progress", color:WARN, bg:WARN_BG },
  delayed:     { label:"Delayed",     color:RISK, bg:RISK_BG },
  not_started: { label:"Not Started", color:GRAY, bg:PANEL   },
  blocked:     { label:"Blocked",     color:RISK, bg:RISK_BG },
};
const PRIORITY_COLOR = { P0:RISK, P1:WARN, P2:GRAY2, P3:GRAY };
const HEALTH_COLOR   = { green:OK, yellow:WARN, red:RISK };

export default function DeliveryView({ addToast, mobile, tablet }) {
  const [tab, setTab]           = useState("roadmap"); // roadmap | sprint | releases
  const [filterStatus, setFS]   = useState("all");
  const [filterProject, setFP]  = useState("all");

  const projects = ["all", ...new Set(FEATURES.map(f => f.project))];
  const statuses = ["all", "in_progress", "delayed", "blocked", "not_started", "completed"];

  const visible = FEATURES.filter(f =>
    (filterStatus  === "all" || f.status  === filterStatus ) &&
    (filterProject === "all" || f.project === filterProject)
  );

  const rel = RELEASES[0];
  const checkDone = Object.values(rel.deployChecklist).filter(Boolean).length;
  const checkTotal= Object.keys(rel.deployChecklist).length;

  const CHECKLIST_LABEL = {
    infraReady:"Infra ready", featureFlags:"Feature flags configured",
    dbMigration:"DB migration tested", rollbackScript:"Rollback script verified",
    monitoringAlerts:"Monitoring alerts set",
  };

  return (
    <div>
      {/* ── sub-nav ─────────────────────────────────────────────── */}
      <div style={{ display:"flex", gap:8, marginBottom:24 }}>
        {[["roadmap","🗺 Roadmap"],["sprint","⚡ Sprint"],["releases","🚀 Releases"]].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding:"8px 20px", borderRadius:20, border:`1.5px solid ${tab===k ? INK : LINE}`,
            background: tab===k ? INK : SURFACE, color: tab===k ? "#fff" : GRAY2,
            fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:ff,
          }}>{l}</button>
        ))}
      </div>

      {/* ════════ ROADMAP ════════════════════════════════════════ */}
      {tab === "roadmap" && (
        <>
          {/* filters */}
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
            <select value={filterStatus} onChange={e=>setFS(e.target.value)} style={{
              padding:"7px 12px", borderRadius:12, border:`1.5px solid ${LINE}`,
              fontSize:12.5, fontFamily:ff, color:INK, background:SURFACE, cursor:"pointer", outline:"none" }}>
              {statuses.map(s => <option key={s} value={s}>{s === "all" ? "All statuses" : STATUS_META[s]?.label || s}</option>)}
            </select>
            <select value={filterProject} onChange={e=>setFP(e.target.value)} style={{
              padding:"7px 12px", borderRadius:12, border:`1.5px solid ${LINE}`,
              fontSize:12.5, fontFamily:ff, color:INK, background:SURFACE, cursor:"pointer", outline:"none" }}>
              {projects.map(p => <option key={p} value={p}>{p === "all" ? "All projects" : p}</option>)}
            </select>
            <div style={{ marginLeft:"auto", fontSize:12, color:GRAY, fontFamily:mono, display:"flex", alignItems:"center" }}>
              {visible.length} features · {visible.filter(f=>f.blocked).length} blocked
            </div>
          </div>

          {/* feature table */}
          <div style={{ background:SURFACE, border:`1.5px solid ${LINE}`, borderRadius:18, overflow:"hidden" }}>
            {/* header */}
            <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 80px",
                          padding:"10px 20px", background:PANEL, borderBottom:`1px solid ${LINE}`,
                          fontSize:10.5, fontWeight:800, color:GRAY, letterSpacing:0.8,
                          textTransform:"uppercase", fontFamily:mono, gap:12 }}>
              <span>Feature</span><span>Project</span><span>Owner</span>
              <span>Target</span><span>Status</span><span>Health</span>
            </div>
            {visible.map((f, i) => {
              const sm = STATUS_META[f.status] || STATUS_META.not_started;
              return (
                <div key={f.id} style={{ display:"grid",
                  gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 80px",
                  padding:"13px 20px", gap:12, alignItems:"start",
                  borderBottom: i < visible.length-1 ? `1px solid ${PANEL}` : "none",
                  background: f.blocked ? `${RISK}08` : "transparent" }}>
                  <div>
                    <div style={{ fontSize:13.5, fontWeight:700, color:INK }}>{f.name}</div>
                    <div style={{ display:"flex", gap:6, marginTop:4, flexWrap:"wrap" }}>
                      <span style={{ fontSize:10, fontWeight:800, padding:"1px 7px", borderRadius:5,
                                     background:`${PRIORITY_COLOR[f.priority]}22`,
                                     color:PRIORITY_COLOR[f.priority], fontFamily:mono }}>{f.priority}</span>
                      {f.blocked && <span style={{ fontSize:10, fontWeight:800, padding:"1px 7px", borderRadius:5,
                                                   background:RISK_BG, color:RISK, fontFamily:mono }}>BLOCKED</span>}
                      {f.risk && <span style={{ fontSize:11, color:WARN }}>{f.risk}</span>}
                    </div>
                  </div>
                  <span style={{ fontSize:12, color:GRAY2 }}>{f.project}</span>
                  <span style={{ fontSize:12, color:INK }}>{f.owner}</span>
                  <span style={{ fontSize:12, fontFamily:mono, color: new Date(f.targetDate) < new Date() && f.status !== "completed" ? RISK : GRAY2 }}>
                    {new Date(f.targetDate).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}
                  </span>
                  <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:8,
                                 background:sm.bg, color:sm.color, whiteSpace:"nowrap",
                                 display:"inline-block" }}>{sm.label}</span>
                  <span style={{ width:12, height:12, borderRadius:"50%", display:"inline-block",
                                 background:HEALTH_COLOR[f.health], marginTop:2 }} />
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ════════ SPRINT ════════════════════════════════════════ */}
      {tab === "sprint" && (
        <div>
          <div style={{ display:"flex", gap:12, marginBottom:20, alignItems:"center" }}>
            <div>
              <div style={{ fontSize:18, fontWeight:800, color:INK }}>{CURRENT_SPRINT.name}</div>
              <div style={{ fontSize:12, color:GRAY2, fontFamily:mono }}>{CURRENT_SPRINT.startDate} → {CURRENT_SPRINT.endDate} · {CURRENT_SPRINT.velocity} pts velocity</div>
            </div>
            <div style={{ marginLeft:"auto" }}>
              {["todo","in_progress","blocked","done"].map(s => {
                const count = CURRENT_SPRINT.items.filter(i=>i.status===s).length;
                const col = s==="done"?OK:s==="blocked"?RISK:s==="in_progress"?WARN:GRAY;
                return (
                  <span key={s} style={{ marginLeft:16, fontSize:12, fontWeight:700, color:col, fontFamily:mono }}>
                    {count} {s.replace("_"," ")}
                  </span>
                );
              })}
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:mobile?"1fr":"1fr 1fr", gap:12 }}>
            {["todo","in_progress","blocked","done"].map(col => (
              <div key={col} style={{ background:SURFACE, border:`1.5px solid ${LINE}`, borderRadius:16, padding:"14px 16px" }}>
                <div style={{ fontSize:10.5, fontWeight:800, textTransform:"uppercase", letterSpacing:1,
                              color:col==="done"?OK:col==="blocked"?RISK:col==="in_progress"?WARN:GRAY,
                              fontFamily:mono, marginBottom:10 }}>
                  {col.replace("_"," ")} · {CURRENT_SPRINT.items.filter(i=>i.status===col).length}
                </div>
                {CURRENT_SPRINT.items.filter(i=>i.status===col).map(item => (
                  <div key={item.id} style={{ background:PANEL, borderRadius:10, padding:"10px 12px", marginBottom:8 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:INK }}>{item.title}</div>
                    <div style={{ fontSize:11, color:GRAY2, marginTop:4, fontFamily:mono }}>
                      {item.assignee} · {item.points} pts
                      {item.blocked && <span style={{ marginLeft:6, color:RISK, fontWeight:700 }}>⚠ blocked</span>}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════ RELEASES ════════════════════════════════════════ */}
      {tab === "releases" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {RELEASES.map(rel => {
            const done = Object.values(rel.deployChecklist).filter(Boolean).length;
            const total= Object.keys(rel.deployChecklist).length;
            const col  = rel.status === "green" ? OK : rel.status === "yellow" ? WARN : RISK;
            const bg   = rel.status === "green" ? OK_BG : rel.status === "yellow" ? WARN_BG : RISK_BG;
            return (
              <div key={rel.id} style={{ background:SURFACE, border:`1.5px solid ${col}44`, borderRadius:18 }}>
                {/* header */}
                <div style={{ background:bg, padding:"16px 20px", borderRadius:"16px 16px 0 0",
                              display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
                  <span style={{ fontSize:20, fontWeight:900, color:INK }}>{rel.version}</span>
                  <span style={{ fontSize:13, fontFamily:mono, color:GRAY2 }}>Go-live: {rel.goLive}</span>
                  <div style={{ flex:1 }} />
                  <span style={{ fontWeight:800, fontSize:24, color:col }}>{rel.readiness}%</span>
                  <span style={{ fontSize:12, color:GRAY2 }}>readiness</span>
                </div>
                {/* body */}
                <div style={{ padding:"16px 20px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                  {/* status metrics */}
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, color:GRAY, textTransform:"uppercase",
                                  letterSpacing:0.8, fontFamily:mono, marginBottom:10 }}>Status</div>
                    {[
                      ["QA", rel.qaStatus.replace("_"," ")],
                      ["UAT", rel.uat.replace(/_/g," ")],
                      ["Critical Bugs", rel.criticalBugs + " open"],
                      ["Rollback Plan", rel.rollback ? "Ready" : "⚠ Not ready"],
                    ].map(([k,v]) => (
                      <div key={k} style={{ display:"flex", justifyContent:"space-between",
                                            padding:"6px 0", borderBottom:`1px solid ${PANEL}`,
                                            fontSize:13 }}>
                        <span style={{ color:GRAY2 }}>{k}</span>
                        <span style={{ fontWeight:700, color:
                          v.includes("open") && rel.criticalBugs>0 ? RISK :
                          v === "Ready" ? OK : v.includes("Not") ? RISK : INK }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  {/* deploy checklist */}
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, color:GRAY, textTransform:"uppercase",
                                  letterSpacing:0.8, fontFamily:mono, marginBottom:10 }}>
                      Deploy Checklist {done}/{total}
                    </div>
                    {Object.entries(rel.deployChecklist).map(([k,v]) => (
                      <div key={k} style={{ display:"flex", alignItems:"center", gap:8,
                                            padding:"6px 0", borderBottom:`1px solid ${PANEL}` }}>
                        <span style={{ width:16, height:16, borderRadius:"50%", flexShrink:0,
                                       background:v ? OK : PANEL, border:`2px solid ${v ? OK : LINE}`,
                                       display:"flex", alignItems:"center", justifyContent:"center" }}>
                          {v && <span style={{ color:"#fff", fontSize:9, fontWeight:900 }}>✓</span>}
                        </span>
                        <span style={{ fontSize:12.5, color:v?INK:GRAY2 }}>{CHECKLIST_LABEL[k]}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* features */}
                <div style={{ padding:"0 20px 16px" }}>
                  <div style={{ fontSize:11, fontWeight:700, color:GRAY, textTransform:"uppercase",
                                letterSpacing:0.8, fontFamily:mono, marginBottom:8 }}>Features in release</div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {rel.features.map(f => (
                      <span key={f} style={{ fontSize:12, padding:"4px 12px", borderRadius:20,
                                             background:PANEL, border:`1px solid ${LINE}`, color:INK }}>{f}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
