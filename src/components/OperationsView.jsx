import { useState, useRef, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import Celebration from "./Celebration.jsx";
import TaskDetailExtras from "./TaskDetailExtras.jsx";
import BoardView from "./BoardView.jsx";
import { getProfile } from "../lib/session.js";
import { scopeByProject, ALL_PROJECTS } from "../lib/access.js";
import { getScopeProjects } from "../lib/localDirectory.js";
import { awardPoints } from "../lib/gamification.js";
import AddTaskForm from "./AddTaskForm.jsx";
import { INK, SURFACE, PANEL, GRAY, GRAY2, LINE, OK, OK_BG, WARN, WARN_BG, RISK, RISK_BG, ff, mono } from "../brand/tokens.js";
import {
  useFeatures, useReleases, useCurrentSprint,
  useBlockers, useRisks, useBugs, useBugTrend,
  useTeamCapacity, useDecisions, useHealthMatrix,
  updateTask, updateRelease, updateSprintItem, resolveBlocker, resolveBug, closeDecision, setRiskMitigated,
} from "../lib/queries.js";

const EMPTY_SPRINT = { name:"", startDate:"", endDate:"", velocity:null, items:[] };
const TODAY0 = (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();

/* ── shared meta ── */
const STATUS_META = {
  completed:   { label:"Done",        color:OK,   bg:OK_BG   },
  in_progress: { label:"In Progress", color:WARN, bg:WARN_BG },
  delayed:     { label:"Delayed",     color:RISK, bg:RISK_BG },
  not_started: { label:"Not Started", color:GRAY, bg:PANEL   },
  blocked:     { label:"Blocked",     color:RISK, bg:RISK_BG },
};
const PRIORITY_COLOR = { P0:RISK, P1:WARN, P2:GRAY2, P3:GRAY };
const HEALTH_COLOR   = { green:OK, yellow:WARN, red:RISK };
const PROB_COLOR     = { high:RISK, medium:WARN, low:GRAY2 };
const IMPACT_COLOR   = { high:RISK, medium:WARN, low:OK   };
const CHECKLIST_LABEL = {
  infraReady:"Infra ready", featureFlags:"Feature flags configured",
  dbMigration:"DB migration tested", rollbackScript:"Rollback script verified",
  monitoringAlerts:"Monitoring alerts set",
};

/* section heading */
function SectionHead({ icon, title, sub, right }) {
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:12, marginBottom:16, flexWrap:"wrap" }}>
      <div>
        <div style={{ fontSize:18, fontWeight:800, color:INK }}>{icon} {title}</div>
        {sub && <div style={{ fontSize:12, color:GRAY2, marginTop:2 }}>{sub}</div>}
      </div>
      {right && <div style={{ marginLeft:"auto" }}>{right}</div>}
    </div>
  );
}

/* compact action-button style */
const actBtn = (color, bg, outline) => ({
  fontSize:12, fontWeight:700, padding:"6px 14px", borderRadius:10,
  border:`1.5px solid ${outline ? LINE : color+"55"}`,
  background: bg, color, cursor:"pointer", fontFamily:ff,
  display:"inline-flex", alignItems:"center", gap:6, whiteSpace:"nowrap",
});

/* tiny pill button for cards */
const miniBtn = (color) => ({
  fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:8,
  border:`1px solid ${color}55`, background:`${color}12`, color,
  cursor:"pointer", fontFamily:ff,
});

/* inline edit input style */
const inp = {
  width:"100%", boxSizing:"border-box", padding:"8px 11px", borderRadius:9,
  border:`1.5px solid ${LINE}`, fontSize:13, fontFamily:ff, color:INK,
  background:SURFACE, outline:"none",
};

/* labelled edit field */
function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize:10, fontWeight:700, color:GRAY, textTransform:"uppercase",
                    letterSpacing:0.6, fontFamily:mono, marginBottom:5 }}>{label}</div>
      {children}
    </div>
  );
}

function LoadBar({ load }) {
  const color = load > 120 ? RISK : load > 100 ? WARN : OK;
  return (
    <div style={{ flex:1, background:PANEL, borderRadius:6, height:8, overflow:"hidden", minWidth:60 }}>
      <div style={{ width:`${Math.min(load,150)/1.5}%`, height:"100%", background:color, borderRadius:6, transition:"width .4s" }} />
    </div>
  );
}

export default function OperationsView({ addToast, mobile, tablet, user }) {
  /* ── interactive state preserved from all three views ── */
  const [filterStatus, setFS]  = useState("all");
  const [filterProject, setFP] = useState("all");
  const [resolvedBugs, setRB]  = useState(new Set());
  const [resolvedBlk,  setRBl] = useState(new Set());
  const [decDone,      setDecDone] = useState(new Set());
  const [sprintOv,     setSprintOv]  = useState({});      // sprint item id → {status, blocked}
  const [relCheck,     setRelCheck]  = useState({});      // `${relId}.${key}` → bool override
  const [risksDone,    setRisksDone] = useState(new Set());
  const [bugFilter,    setBugFilter] = useState(null);    // null | "P0".."P3"
  const [openFeat,     setOpenFeat] = useState(null);
  const [roadmapView,  setRoadmapView] = useState("table"); // "table" | "board"
  const [featEdits,    setFeatEdits] = useState({});   // id → partial field overrides
  const [editingFeat,  setEditingFeat] = useState(null);
  const toggleFeat = (id) => { setOpenFeat(o => o === id ? null : id); setEditingFeat(null); };
  const patchFeat  = (id, patch) => setFeatEdits(o => ({ ...o, [id]: { ...(o[id]||{}), ...patch } }));

  const [currentProfile, setCurrentProfile] = useState(null);
  useEffect(() => { getProfile().then(setCurrentProfile); }, []);

  /* ── live data, scoped to the signed-in user's space (PM sees everything) ── */
  const { data: featuresData, refetch: refetchFeatures } = useFeatures();
  const FEATURES = scopeByProject(user, featuresData ?? []);
  const RELEASES = scopeByProject(user, useReleases().data ?? []);
  const { data: sprintData, refetch: refetchSprint } = useCurrentSprint();
  const sprintRaw = sprintData ?? EMPTY_SPRINT;
  const CURRENT_SPRINT = { ...sprintRaw, items: scopeByProject(user, sprintRaw.items) };
  // a task can be created from Roadmap, Bugs, or Sprint — since they all read
  // the same `tasks` table, refresh everything so it shows up wherever it's relevant
  const [boardKey, setBoardKey] = useState(0);
  const refreshAllTaskViews = () => {
    setBoardKey(k => k + 1); // remounts the embedded Board, forcing it to refetch
    refetchFeatures();
    refetchBugs();
    refetchSprint();
  };
  const projectOptions = getScopeProjects(user) ?? ALL_PROJECTS;
  const { data: blockersData, refetch: refetchBlockers } = useBlockers();
  const BLOCKERS = scopeByProject(user, blockersData ?? []);
  const { data: risksData, refetch: refetchRisks } = useRisks();
  const RISKS = scopeByProject(user, risksData ?? []);
  const { data: bugsData, refetch: refetchBugs } = useBugs();
  const BUGS = scopeByProject(user, bugsData ?? []);
  const BUG_TREND = useBugTrend().data ?? []; // company-wide trend, not project-scoped
  const TEAM_CAPACITY = useTeamCapacity().data ?? []; // workload overview, left visible to all for now
  const { data: decisionsData, refetch: refetchDecisions } = useDecisions();
  const DECISIONS = scopeByProject(user, decisionsData ?? []);
  const HEALTH_MATRIX = useHealthMatrix().data ?? []; // company-wide health snapshot

  // push a feature edit to the database, with toast feedback
  const saveFeature = async (id, patch, name) => {
    const dbPatch = {};
    if ("owner" in patch) dbPatch.owner_label = patch.owner;
    if ("targetDate" in patch) dbPatch.target_date = patch.targetDate;
    if ("status" in patch) dbPatch.status = patch.status;
    if ("priority" in patch) dbPatch.priority = patch.priority;
    if ("health" in patch) dbPatch.health = patch.health;
    if ("blocked" in patch) dbPatch.blocked = patch.blocked;
    if ("risk" in patch) dbPatch.risk_note = patch.risk;
    addToast(`⤴ Saving "${name}"…`);
    await updateTask(id, dbPatch);
    addToast(`✓ "${name}" updated`);
  };

  // 🎉 celebration when a task is completed on time
  const [celebrate, setCelebrate] = useState(false);
  const celebRef = useRef(null);
  const fireCelebration = () => {
    setCelebrate(true);
    clearTimeout(celebRef.current);
    celebRef.current = setTimeout(() => setCelebrate(false), 1000);
  };
  const onTime = (dueDate) => !dueDate || new Date(dueDate) >= TODAY0;

  // 🏆 gamification — awards points/streak, surfaces via toast + badge unlock toasts
  const awardAndNotify = (action, meta) => {
    const { pointsAwarded, newBadges } = awardPoints(user?.email, action, meta);
    if (pointsAwarded > 0) addToast(`⭐ +${pointsAwarded} pts`);
    newBadges.forEach(b => addToast(`${b.icon} New badge unlocked: ${b.label}!`));
  };

  /* ── section refs for jump-nav ── */
  const refs = {
    roadmap:   useRef(null),
    sprint:    useRef(null),
    releases:  useRef(null),
    blockers:  useRef(null),
    bugs:      useRef(null),
    capacity:  useRef(null),
    decisions: useRef(null),
  };
  const jumpTo = (k) => refs[k].current?.scrollIntoView({ behavior:"smooth", block:"start" });

  /* ── derived ── */
  const roadmap  = FEATURES;
  const projects = ["all", ...new Set(roadmap.map(f => f.project))];
  const statuses = ["all", "in_progress", "delayed", "blocked", "not_started", "completed"];
  const visible  = roadmap.filter(f =>
    (filterStatus  === "all" || f.status  === filterStatus ) &&
    (filterProject === "all" || f.project === filterProject)
  );
  const sprintDone = CURRENT_SPRINT.items.filter(i=>i.status==="done").length;
  const sprintPct  = CURRENT_SPRINT.items.length ? Math.round(sprintDone / CURRENT_SPRINT.items.length * 100) : 0;

  const openBugs     = BUGS.filter(b => b.status !== "resolved" && !resolvedBugs.has(b.id));
  const p0 = openBugs.filter(b=>b.priority==="P0");
  const p1 = openBugs.filter(b=>b.priority==="P1");
  const p2 = openBugs.filter(b=>b.priority==="P2");
  const p3 = openBugs.filter(b=>b.priority==="P3");
  const openBlockers = BLOCKERS.filter(b => b.status !== "resolved" && !resolvedBlk.has(b.id));
  const pendingDec   = DECISIONS.filter(d => !decDone.has(d.id));
  const overloaded   = TEAM_CAPACITY.filter(t => t.load > 100);

  /* ── "Today" priority card — top 3 things needing action, no scrolling required ── */
  const roadmapWithEdits = roadmap.map(f => ({ ...f, ...(featEdits[f.id]||{}) }));
  const todayItems = [
    ...roadmapWithEdits
      .filter(f => f.status !== "completed" && (f.blocked || (f.targetDate && new Date(f.targetDate) < TODAY0)))
      .map(f => ({ kind:"feature", id:f.id, title:f.name, sub:f.project,
                   urgency: (f.blocked ? 10000 : 0) + (f.targetDate ? (TODAY0 - new Date(f.targetDate))/86400000 : 0), raw:f })),
    ...openBlockers.map(b => ({ kind:"blocker", id:b.id, title:b.title, sub:b.owner, urgency: 5000 + b.daysOpen, raw:b })),
    ...p0.map(b => ({ kind:"bug", id:b.id, title:b.title, sub:b.project, urgency: 3000 + (b.openedDays||0), raw:b })),
  ].sort((a,b) => b.urgency - a.urgency).slice(0,3);

  const markFeatureDone = (f) => {
    patchFeat(f.id, { status:"completed" });
    const wasOverdue = f.targetDate && new Date(f.targetDate) < TODAY0;
    if (!wasOverdue) fireCelebration();
    saveFeature(f.id, { status:"completed" }, f.name);
    awardAndNotify("task_complete", { onTime: !wasOverdue });
  };
  const resolveBlockerItem = (b) => {
    setRBl(s=>{const n=new Set(s);n.add(b.id);return n;});
    if (onTime(b.dueDate)) fireCelebration();
    addToast(`Blocker resolved: "${b.title}"`);
    resolveBlocker(b.id).then(refetchBlockers);
    awardAndNotify("blocker_resolve");
  };
  const resolveBugItem = (b) => {
    setRB(s=>{const n=new Set(s);n.add(b.id);return n;});
    fireCelebration();
    addToast(`Bug resolved: "${b.title}"`);
    resolveBug(b.id).then(refetchBugs);
    awardAndNotify("bug_resolve");
  };

  /* jump-nav config with live counts */
  const JUMPS = [
    { k:"roadmap",   label:"Roadmap",   icon:"🗺", badge:`${FEATURES.length}`,            tone:GRAY2 },
    { k:"sprint",    label:"Sprint",    icon:"⚡", badge:`${sprintPct}%`,                 tone: sprintPct<40?RISK:sprintPct<70?WARN:OK },
    { k:"releases",  label:"Releases",  icon:"🚀", badge:`${RELEASES[0]?.readiness ?? 0}%`, tone: RELEASES[0]?.status==="green"?OK:RELEASES[0]?.status==="yellow"?WARN:RISK },
    { k:"blockers",  label:"Blockers & Risks", icon:"🚧", badge:`${openBlockers.length}`, tone: openBlockers.length?RISK:OK },
    { k:"bugs",      label:"Bugs",      icon:"🐛", badge:`P0 ${p0.length}`,               tone: p0.length?RISK:OK },
    { k:"capacity",  label:"Capacity",  icon:"👥", badge:`${overloaded.length} over`,     tone: overloaded.length?RISK:OK },
    { k:"decisions", label:"Decisions", icon:"⏳", badge:`${pendingDec.length}`,          tone: pendingDec.length>2?WARN:GRAY2 },
  ];

  return (
    <div>
      {/* ════════ TODAY — top priorities, no scrolling required ════════ */}
      {todayItems.length > 0 && (
        <div style={{ background:`linear-gradient(135deg, ${INK}F8 0%, #14574A 100%)`, borderRadius:20,
                      padding:"18px 22px", marginBottom:18 }}>
          <div style={{ fontSize:14, fontWeight:800, color:"#fff", marginBottom:12 }}>
            ⚡ Today — {todayItems.length} thing{todayItems.length>1?"s":""} that need you
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {todayItems.map(item => (
              <div key={`${item.kind}-${item.id}`} style={{ display:"flex", alignItems:"center", gap:10,
                                                             background:"rgba(255,255,255,.08)", borderRadius:12,
                                                             padding:"10px 14px", flexWrap:"wrap" }}>
                <span style={{ fontSize:9.5, fontWeight:800, padding:"2px 8px", borderRadius:6,
                               background:"rgba(255,255,255,.15)", color:"#fff", fontFamily:mono,
                               textTransform:"uppercase", letterSpacing:0.5 }}>{item.kind}</span>
                <div style={{ flex:1, minWidth:140 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#fff" }}>{item.title}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,.5)", marginTop:1 }}>{item.sub}</div>
                </div>
                <button onClick={() => {
                  if (item.kind === "feature") markFeatureDone(item.raw);
                  else if (item.kind === "blocker") resolveBlockerItem(item.raw);
                  else resolveBugItem(item.raw);
                }} style={{
                  fontSize:12, fontWeight:700, padding:"6px 14px", borderRadius:10, border:"1px solid rgba(255,255,255,.25)",
                  background:"rgba(255,255,255,.12)", color:"#fff", cursor:"pointer", fontFamily:ff, flexShrink:0,
                }}>{item.kind === "feature" ? "✓ Mark complete" : "Resolve"}</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════ STICKY JUMP-NAV ════════ */}
      <div style={{ position:"sticky", top:0, zIndex:20, marginBottom:22,
                    background:`${PANEL}F2`, backdropFilter:"blur(8px)",
                    border:`1.5px solid ${LINE}`, borderRadius:16, padding:"10px 12px" }}>
        <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:2 }}>
          {JUMPS.map(j => (
            <button key={j.k} onClick={()=>jumpTo(j.k)} style={{
              display:"flex", alignItems:"center", gap:7, whiteSpace:"nowrap",
              padding:"7px 13px", borderRadius:20, border:`1.5px solid ${LINE}`,
              background:SURFACE, color:INK, fontSize:12.5, fontWeight:700,
              cursor:"pointer", fontFamily:ff, flexShrink:0,
            }}>
              <span>{j.icon}</span>
              <span>{j.label}</span>
              <span style={{ fontSize:10.5, fontWeight:900, fontFamily:mono,
                             background:`${j.tone}1A`, color:j.tone,
                             padding:"1px 7px", borderRadius:20 }}>{j.badge}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ════════ 1 · ROADMAP ════════ */}
      <section ref={refs.roadmap} style={{ marginBottom:34, scrollMarginTop:80 }}>
        <SectionHead icon="🗺" title="Roadmap" sub="Feature delivery across all active projects"
          right={<span style={{ fontSize:12, color:GRAY, fontFamily:mono }}>
            {visible.length} features · {visible.filter(f=>f.blocked).length} blocked</span>} />

        {/* filters + table/board toggle */}
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:14, alignItems:"center" }}>
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
          <div style={{ marginLeft:"auto", display:"flex", gap:4, background:PANEL, borderRadius:12, padding:3 }}>
            {[["table","☰ Table"],["board","▦ Board"]].map(([k,l]) => (
              <button key={k} onClick={()=>setRoadmapView(k)} style={{
                padding:"6px 14px", borderRadius:9, border:"none", cursor:"pointer", fontFamily:ff,
                fontSize:12, fontWeight:700, background:roadmapView===k?SURFACE:"transparent", color:roadmapView===k?INK:GRAY2,
                boxShadow:roadmapView===k?"0 1px 4px rgba(0,0,0,.08)":"none",
              }}>{l}</button>
            ))}
          </div>
        </div>

        <AddTaskForm type="feature" projectOptions={projectOptions} addToast={addToast} mobile={mobile} onCreated={refreshAllTaskViews} />

        {roadmapView === "board" ? (
          <BoardView key={boardKey} addToast={addToast} mobile={mobile} user={user} />
        ) : (
        <>
        {/* feature table */}
        <div style={{ overflowX:"auto", borderRadius:18 }}>
        <div style={{ background:SURFACE, border:`1.5px solid ${LINE}`, borderRadius:18, overflow:"hidden", minWidth:640 }}>
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 80px",
                        padding:"10px 20px", background:PANEL, borderBottom:`1px solid ${LINE}`,
                        fontSize:10.5, fontWeight:800, color:GRAY, letterSpacing:0.8,
                        textTransform:"uppercase", fontFamily:mono, gap:12 }}>
            <span>Feature</span><span>Project</span><span>Owner</span>
            <span>Target</span><span>Status</span><span>Health</span>
          </div>
          {visible.map((orig, i) => {
            const f = { ...orig, ...(featEdits[orig.id]||{}) };   // merge any inline edits
            const eff = f.status;
            const sm  = STATUS_META[eff] || STATUS_META.not_started;
            const isOpen  = openFeat === orig.id;
            const editing = editingFeat === orig.id;
            const overdue = new Date(f.targetDate) < new Date() && eff !== "completed";
            const hcol    = eff === "completed" ? OK : HEALTH_COLOR[f.health];
            return (
              <div key={orig.id} style={{ borderBottom: i < visible.length-1 ? `1px solid ${PANEL}` : "none",
                                       background: isOpen ? PANEL : f.blocked ? `${RISK}08` : "transparent" }}>
                {/* clickable row */}
                <div onClick={()=>toggleFeat(orig.id)} style={{ display:"grid",
                  gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 80px",
                  padding:"13px 20px", gap:12, alignItems:"start", cursor:"pointer" }}>
                  <div>
                    <div style={{ fontSize:13.5, fontWeight:700, color:INK, display:"flex", gap:7, alignItems:"center", flexWrap:"wrap" }}>
                      <span style={{ fontSize:10, color:GRAY, transition:"transform .2s",
                                     transform:isOpen?"rotate(90deg)":"none", display:"inline-block" }}>▸</span>
                      {f.name}
                    </div>
                    <div style={{ display:"flex", gap:6, marginTop:4, flexWrap:"wrap", paddingLeft:17 }}>
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
                  <span style={{ fontSize:12, fontFamily:mono, color: overdue ? RISK : GRAY2 }}>
                    {new Date(f.targetDate).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}
                  </span>
                  <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:8,
                                 background:sm.bg, color:sm.color, whiteSpace:"nowrap",
                                 display:"inline-block" }}>{sm.label}</span>
                  <span style={{ width:12, height:12, borderRadius:"50%", display:"inline-block",
                                 background:hcol, marginTop:2 }} />
                </div>

                {/* expanded detail — view or edit mode */}
                {isOpen && (
                  <div style={{ padding:"4px 20px 18px 37px", animation:"fadeUp .2s ease both" }}>

                    {/* ─────── EDIT MODE ─────── */}
                    {editing ? (
                      <div style={{ background:SURFACE, border:`1.5px solid ${INK}55`, borderRadius:12, padding:"16px 18px" }}>
                        <div style={{ fontSize:11, fontWeight:800, color:INK, textTransform:"uppercase",
                                      letterSpacing:0.6, fontFamily:mono, marginBottom:14 }}>✎ Editing — {orig.name}</div>
                        <div style={{ display:"grid", gridTemplateColumns:mobile?"1fr":"1fr 1fr", gap:"14px 18px" }}>
                          <Field label="Owner">
                            <input value={f.owner} onChange={e=>patchFeat(orig.id,{owner:e.target.value})} style={inp} />
                          </Field>
                          <Field label="Target / due date">
                            <input type="date" value={f.targetDate} onChange={e=>patchFeat(orig.id,{targetDate:e.target.value})} style={inp} />
                          </Field>
                          <Field label="Status">
                            <select value={f.status} onChange={e=>patchFeat(orig.id,{status:e.target.value})} style={inp}>
                              {Object.keys(STATUS_META).map(s=> <option key={s} value={s}>{STATUS_META[s].label}</option>)}
                            </select>
                          </Field>
                          <Field label="Priority">
                            <select value={f.priority} onChange={e=>patchFeat(orig.id,{priority:e.target.value})} style={inp}>
                              {["P0","P1","P2","P3"].map(p=> <option key={p} value={p}>{p}</option>)}
                            </select>
                          </Field>
                          <Field label="Health">
                            <select value={f.health} onChange={e=>patchFeat(orig.id,{health:e.target.value})} style={inp}>
                              <option value="green">On Track</option>
                              <option value="yellow">At Risk</option>
                              <option value="red">Off Track</option>
                            </select>
                          </Field>
                          <Field label="Blocked">
                            <button onClick={()=>patchFeat(orig.id,{blocked:!f.blocked})} style={{
                              ...inp, cursor:"pointer", textAlign:"left", fontWeight:700,
                              color:f.blocked?RISK:OK, background:f.blocked?RISK_BG:OK_BG,
                              borderColor:(f.blocked?RISK:OK)+"55" }}>
                              {f.blocked ? "🚧 Blocked — click to clear" : "✓ Not blocked — click to set"}
                            </button>
                          </Field>
                          <div style={{ gridColumn:mobile?"auto":"1 / -1" }}>
                            <Field label="Risk / dependency note">
                              <input value={f.risk||""} placeholder="e.g. waiting on vendor API" onChange={e=>patchFeat(orig.id,{risk:e.target.value})} style={inp} />
                            </Field>
                          </div>
                        </div>
                        <div style={{ marginTop:16, display:"flex", gap:8, flexWrap:"wrap" }}>
                          <button onClick={()=>{ const patch=featEdits[orig.id]||{}; setEditingFeat(null); saveFeature(orig.id, patch, f.name); }}
                            style={actBtn("#fff", INK)}>💾 Save</button>
                          <button onClick={()=>{ setFeatEdits(o=>{const n={...o}; delete n[orig.id]; return n;}); setEditingFeat(null); addToast(`Edits discarded`); }}
                            style={actBtn(GRAY2, SURFACE, true)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                    /* ─────── VIEW MODE ─────── */
                    <>
                    <div style={{ display:"grid", gridTemplateColumns:mobile?"1fr 1fr":"repeat(4, 1fr)", gap:"12px 18px",
                                  background:SURFACE, border:`1px solid ${LINE}`, borderRadius:12, padding:"14px 16px" }}>
                      {[
                        ["Feature",  f.name],
                        ["Project",  f.project],
                        ["Owner",    f.owner],
                        ["Priority", f.priority],
                        ["Status",   sm.label,  sm.color],
                        ["Target date", new Date(f.targetDate).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}) + (overdue?" · overdue":""), overdue?RISK:INK],
                        ["Health",   f.health==="green"?"On Track":f.health==="yellow"?"At Risk":"Off Track", hcol],
                        ["Blocked",  f.blocked?"Yes":"No", f.blocked?RISK:OK],
                      ].map(([k,v,col]) => (
                        <div key={k}>
                          <div style={{ fontSize:10, fontWeight:700, color:GRAY, textTransform:"uppercase",
                                        letterSpacing:0.6, fontFamily:mono, marginBottom:3 }}>{k}</div>
                          <div style={{ fontSize:13, fontWeight:600, color:col||INK }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    {/* risk / dependency note, full width */}
                    <div style={{ marginTop:10, background:f.risk?WARN_BG:OK_BG,
                                  border:`1px solid ${(f.risk?WARN:OK)}44`, borderRadius:12, padding:"10px 14px",
                                  display:"flex", gap:8, alignItems:"flex-start" }}>
                      <span style={{ fontSize:13, flexShrink:0 }}>{f.risk?"⚠":"✓"}</span>
                      <span style={{ fontSize:12, color:f.risk?"#8A6314":OK, fontWeight:600, lineHeight:1.45 }}>
                        {f.risk ? <>Risk / dependency: {f.risk}</> : <>No open risks or dependencies flagged for this feature.</>}
                      </span>
                    </div>

                    {/* action buttons — each runs an action specific to the feature */}
                    <div style={{ marginTop:12, display:"flex", gap:8, flexWrap:"wrap" }}>
                      {/* Edit */}
                      <button onClick={()=>setEditingFeat(orig.id)} style={actBtn(INK, PANEL)}>✎ Edit task</button>

                      {/* Mark complete / Reopen */}
                      {eff !== "completed" ? (
                        <button onClick={()=>markFeatureDone(orig)}
                          style={actBtn(OK, OK_BG)}>✓ Mark complete</button>
                      ) : (
                        <button onClick={()=>{ patchFeat(orig.id,{status:orig.status}); saveFeature(orig.id,{status:orig.status}, f.name); }}
                          style={actBtn(GRAY2, PANEL)}>↺ Reopen</button>
                      )}

                      {/* Nudge / assign owner */}
                      {f.owner === "Unassigned" ? (
                        <button onClick={()=>addToast(`👤 Assignment request sent for "${f.name}"`)}
                          style={actBtn(WARN, WARN_BG)}>👤 Assign owner</button>
                      ) : (
                        <button onClick={()=>addToast(`🔔 Reminder sent to ${f.owner}`)}
                          style={actBtn(INK, PANEL)}>🔔 Nudge {f.owner.split(" ")[0]}</button>
                      )}

                      {/* Escalate — only when blocked or overdue */}
                      {(f.blocked || overdue) && eff !== "completed" && (
                        <button onClick={()=>addToast(`🚩 "${f.name}" escalated to leadership`)}
                          style={actBtn(RISK, RISK_BG)}>🚩 Escalate</button>
                      )}
                    </div>

                    <TaskDetailExtras taskId={orig.id} currentProfile={currentProfile} mobile={mobile} />
                    </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        </div>
        </>
        )}
      </section>

      {/* ════════ 2 · SPRINT ════════ */}
      <section ref={refs.sprint} style={{ marginBottom:34, scrollMarginTop:80 }}>
        <SectionHead icon="⚡" title={CURRENT_SPRINT.name}
          sub={`${CURRENT_SPRINT.startDate} → ${CURRENT_SPRINT.endDate} · ${CURRENT_SPRINT.velocity} pts velocity`}
          right={
            <div>{["todo","in_progress","blocked","done"].map(s => {
              const count = CURRENT_SPRINT.items.filter(i=>i.status===s).length;
              const col = s==="done"?OK:s==="blocked"?RISK:s==="in_progress"?WARN:GRAY;
              return (<span key={s} style={{ marginLeft:14, fontSize:12, fontWeight:700, color:col, fontFamily:mono }}>
                {count} {s.replace("_"," ")}</span>);
            })}</div>
          } />
        <AddTaskForm type="feature" defaultStatus="not_started" sprintId={CURRENT_SPRINT.id}
          projectOptions={projectOptions} addToast={addToast} mobile={mobile} onCreated={refreshAllTaskViews} />
        <div style={{ display:"grid", gridTemplateColumns:mobile?"1fr":"1fr 1fr", gap:12 }}>
          {["todo","in_progress","blocked","done"].map(col => {
            const items = CURRENT_SPRINT.items
              .map(it => ({ ...it, ...(sprintOv[it.id]||{}) }))
              .filter(it => it.status === col);
            const NEXT = { todo:"in_progress", in_progress:"done" };
            return (
            <div key={col} style={{ background:SURFACE, border:`1.5px solid ${LINE}`, borderRadius:16, padding:"14px 16px" }}>
              <div style={{ fontSize:10.5, fontWeight:800, textTransform:"uppercase", letterSpacing:1,
                            color:col==="done"?OK:col==="blocked"?RISK:col==="in_progress"?WARN:GRAY,
                            fontFamily:mono, marginBottom:10 }}>
                {col.replace("_"," ")} · {items.length}
              </div>
              {items.map(item => {
                const setItem = (patch, msg) => {
                  setSprintOv(o=>({ ...o, [item.id]:{ ...(o[item.id]||{}), ...patch } }));
                  if(msg) addToast(msg);
                  updateSprintItem(item.sprintItemId, patch);
                };
                return (
                <div key={item.id} style={{ background:PANEL, borderRadius:10, padding:"10px 12px", marginBottom:8 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:INK }}>{item.title}</div>
                  <div style={{ fontSize:11, color:GRAY2, marginTop:4, fontFamily:mono }}>
                    {item.assignee} · {item.points} pts
                    {item.blocked && <span style={{ marginLeft:6, color:RISK, fontWeight:700 }}>⚠ blocked</span>}
                  </div>
                  {/* per-card actions */}
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:8 }}>
                    {col !== "done" && NEXT[col] && !item.blocked && (
                      <button onClick={()=>{ const ns=NEXT[col]; setItem({status:ns}, `"${item.title}" → ${ns.replace("_"," ")}`); if(ns==="done") { fireCelebration(); awardAndNotify("task_complete", { onTime:true }); } }}
                        style={miniBtn(INK)}>→ {NEXT[col]==="done"?"Done":"Start"}</button>
                    )}
                    {col === "blocked" && (
                      <button onClick={()=>setItem({status:"in_progress",blocked:false}, `"${item.title}" unblocked`)} style={miniBtn(OK)}>✓ Unblock</button>
                    )}
                    {col !== "done" && col !== "blocked" && (
                      <button onClick={()=>setItem({status:"blocked",blocked:true}, `"${item.title}" marked blocked`)} style={miniBtn(RISK)}>⚠ Block</button>
                    )}
                    {col === "done" && (
                      <button onClick={()=>setItem({status:"in_progress"}, `"${item.title}" reopened`)} style={miniBtn(GRAY2)}>↺ Reopen</button>
                    )}
                  </div>
                </div>
              );})}
              {items.length===0 && <div style={{ fontSize:12, color:GRAY2 }}>—</div>}
            </div>
          );})}
        </div>
      </section>

      {/* ════════ 3 · RELEASES ════════ */}
      <section ref={refs.releases} style={{ marginBottom:34, scrollMarginTop:80 }}>
        <SectionHead icon="🚀" title="Release Readiness" sub="Deploy checklists, QA, UAT & rollback status" />
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {RELEASES.map(rel => {
            // checklist with live overrides
            const checklist = Object.fromEntries(
              Object.entries(rel.deployChecklist).map(([k,v]) => [k, relCheck[`${rel.id}.${k}`] ?? v]));
            const done = Object.values(checklist).filter(Boolean).length;
            const total= Object.keys(checklist).length;
            const allReady = done === total;
            const col  = allReady ? OK : rel.status === "green" ? OK : rel.status === "yellow" ? WARN : RISK;
            const bg   = allReady ? OK_BG : rel.status === "green" ? OK_BG : rel.status === "yellow" ? WARN_BG : RISK_BG;
            const readiness = Math.round((done/total)*100);
            const toggleCheck = (k) => {
              const nextChecklist = { ...checklist, [k]: !checklist[k] };
              setRelCheck(o=>({ ...o, [`${rel.id}.${k}`]: nextChecklist[k] }));
              updateRelease(rel.id, { deployChecklist: nextChecklist });
            };
            return (
              <div key={rel.id} style={{ background:SURFACE, border:`1.5px solid ${col}44`, borderRadius:18 }}>
                <div style={{ background:bg, padding:"16px 20px", borderRadius:"16px 16px 0 0",
                              display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
                  <span style={{ fontSize:20, fontWeight:900, color:INK }}>{rel.version}</span>
                  <span style={{ fontSize:13, fontFamily:mono, color:GRAY2 }}>Go-live: {rel.goLive}</span>
                  <div style={{ flex:1 }} />
                  <span style={{ fontWeight:800, fontSize:24, color:col }}>{readiness}%</span>
                  <span style={{ fontSize:12, color:GRAY2 }}>readiness</span>
                </div>
                <div style={{ padding:"16px 20px", display:"grid", gridTemplateColumns:mobile?"1fr":"1fr 1fr", gap:16 }}>
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
                                            padding:"6px 0", borderBottom:`1px solid ${PANEL}`, fontSize:13 }}>
                        <span style={{ color:GRAY2 }}>{k}</span>
                        <span style={{ fontWeight:700, color:
                          v.includes("open") && rel.criticalBugs>0 ? RISK :
                          v === "Ready" ? OK : v.includes("Not") ? RISK : INK }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, color:GRAY, textTransform:"uppercase",
                                  letterSpacing:0.8, fontFamily:mono, marginBottom:10 }}>
                      Deploy Checklist {done}/{total}
                    </div>
                    {Object.entries(checklist).map(([k,v]) => (
                      <button key={k} onClick={()=>toggleCheck(k)} style={{ width:"100%", textAlign:"left",
                                            display:"flex", alignItems:"center", gap:8, cursor:"pointer",
                                            background:"transparent", border:"none", fontFamily:ff,
                                            padding:"6px 0", borderBottom:`1px solid ${PANEL}` }}>
                        <span style={{ width:16, height:16, borderRadius:"50%", flexShrink:0,
                                       background:v ? OK : PANEL, border:`2px solid ${v ? OK : LINE}`,
                                       display:"flex", alignItems:"center", justifyContent:"center" }}>
                          {v && <span style={{ color:"#fff", fontSize:9, fontWeight:900 }}>✓</span>}
                        </span>
                        <span style={{ fontSize:12.5, color:v?INK:GRAY2 }}>{CHECKLIST_LABEL[k]}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ padding:"0 20px 16px" }}>
                  <div style={{ fontSize:11, fontWeight:700, color:GRAY, textTransform:"uppercase",
                                letterSpacing:0.8, fontFamily:mono, marginBottom:8 }}>Features in release</div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:14 }}>
                    {rel.features.map(f => (
                      <span key={f} style={{ fontSize:12, padding:"4px 12px", borderRadius:20,
                                             background:PANEL, border:`1px solid ${LINE}`, color:INK }}>{f}</span>
                    ))}
                  </div>
                  {/* release actions */}
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    <button disabled={!allReady}
                      onClick={()=>{ addToast(`🚀 ${rel.version} deploy initiated — go-live ${rel.goLive}`); fireCelebration(); }}
                      style={{ ...actBtn("#fff", allReady?INK:GRAY), cursor:allReady?"pointer":"not-allowed", opacity:allReady?1:0.5 }}>
                      🚀 {allReady ? "Deploy / Go-live" : `Deploy (locked · ${total-done} left)`}
                    </button>
                    <button onClick={()=>addToast(`📨 UAT sign-off chased for ${rel.version}`)} style={actBtn(WARN, WARN_BG)}>📨 Chase UAT</button>
                    <button onClick={()=>addToast(`📋 ${rel.version} release notes copied`)} style={actBtn(GRAY2, SURFACE, true)}>📋 Release notes</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ════════ 4 · BLOCKERS & RISKS ════════ */}
      <section ref={refs.blockers} style={{ marginBottom:34, scrollMarginTop:80 }}>
        <SectionHead icon="🚧" title="Blockers & Risks" sub="Active blockers needing owners + top program risks" />
        <div style={{ display:"grid", gridTemplateColumns:mobile?"1fr":"1fr 1fr", gap:16 }}>
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
                    <button onClick={() => resolveBlockerItem(b)}
                      style={{ fontSize:12, fontWeight:700, padding:"5px 14px", borderRadius:10,
                               border:`1.5px solid ${LINE}`, background:SURFACE, color:GRAY2,
                               cursor:"pointer", fontFamily:ff }}>Resolve</button>
                  </div>
                </div>
              </div>
            ))}
            {openBlockers.length===0 && <div style={{color:OK,fontWeight:700,fontSize:13}}>✓ No active blockers</div>}
          </div>

          {/* risks */}
          <div style={{ background:SURFACE, border:`1.5px solid ${LINE}`, borderRadius:18, padding:"18px 20px" }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase",
                          color:GRAY, fontFamily:mono, marginBottom:14 }}>Top {RISKS.length} Risks</div>
            {RISKS.map((r,i) => {
              const mitigated = risksDone.has(r.id) || r.mitigated;
              return (
              <div key={r.id} style={{ padding:"12px 0", borderBottom: i<RISKS.length-1?`1px solid ${PANEL}`:"none",
                                       opacity: mitigated?0.55:1 }}>
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
                    <div style={{ fontSize:13.5, fontWeight:700, color:INK,
                                  textDecoration:mitigated?"line-through":"none" }}>{r.title}</div>
                    <div style={{ fontSize:12, color:GRAY2, marginTop:3 }}>Owner: <b style={{color:INK}}>{r.owner}</b></div>
                    <div style={{ fontSize:12, color:GRAY, marginTop:2 }}>↳ {r.mitigation}</div>
                    {/* risk actions */}
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:7 }}>
                      {!mitigated ? (
                        <>
                          <button onClick={()=>{ setRisksDone(s=>{const n=new Set(s);n.add(r.id);return n;}); addToast(`✓ Risk mitigated: "${r.title}"`); setRiskMitigated(r.id, true).then(refetchRisks); }}
                            style={miniBtn(OK)}>✓ Mark mitigated</button>
                          <button onClick={()=>addToast(`🚩 Risk escalated: "${r.title}" → ${r.owner}`)} style={miniBtn(RISK)}>🚩 Escalate</button>
                        </>
                      ) : (
                        <button onClick={()=>{ setRisksDone(s=>{const n=new Set(s);n.delete(r.id);return n;}); setRiskMitigated(r.id, false).then(refetchRisks); }} style={miniBtn(GRAY2)}>↺ Reopen risk</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );})}
          </div>
        </div>
      </section>

      {/* ════════ 5 · BUGS & QUALITY ════════ */}
      <section ref={refs.bugs} style={{ marginBottom:34, scrollMarginTop:80 }}>
        <SectionHead icon="🐛" title="Bugs & Quality" sub="Open defects by priority + 5-week trend" />
        <AddTaskForm type="bug" projectOptions={projectOptions} addToast={addToast} mobile={mobile} onCreated={refreshAllTaskViews} />
        {/* priority summary — click to filter the list */}
        <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
          {[["P0","Critical",p0.length,RISK,RISK_BG],["P1","High",p1.length,WARN,WARN_BG],
            ["P2","Medium",p2.length,GRAY2,PANEL],["P3","Low",p3.length,GRAY,PANEL]].map(([pri,lbl,cnt,col,bg]) => {
            const active = bugFilter === pri;
            return (
            <button key={pri} onClick={()=>setBugFilter(active?null:pri)} style={{ flex:"1 1 120px", background:bg,
                                    border:`2px solid ${active?col:col+"44"}`, borderRadius:14, cursor:"pointer", fontFamily:ff,
                                    padding:"14px 16px", textAlign:"center", outline:"none",
                                    boxShadow: active?`0 0 0 3px ${col}22`:"none" }}>
              <div style={{ fontSize:28, fontWeight:900, color:col, fontFamily:mono }}>{cnt}</div>
              <div style={{ fontSize:12, fontWeight:700, color:col }}>{pri}</div>
              <div style={{ fontSize:11, color:GRAY2 }}>{active ? "✓ filtering" : lbl}</div>
            </button>
          );})}
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
        <div style={{ background:SURFACE, border:`1.5px solid ${LINE}`, borderRadius:18, minWidth:620 }}>
          <div style={{ padding:"12px 20px", background:PANEL, borderRadius:"16px 16px 0 0",
                        display:"grid", gridTemplateColumns:"60px 2fr 1fr 1fr 1fr 140px",
                        fontSize:10.5, fontWeight:800, color:GRAY, letterSpacing:0.8,
                        textTransform:"uppercase", fontFamily:mono, gap:12 }}>
            <span>Priority</span><span>Bug</span><span>Project</span>
            <span>Assignee</span><span>Age</span><span>Status</span>
          </div>
          {openBugs.filter(b => !bugFilter || b.priority===bugFilter).map((b,i,arr) => {
            const col = b.priority==="P0"?RISK:b.priority==="P1"?WARN:b.priority==="P2"?GRAY2:GRAY;
            return (
              <div key={b.id} style={{ display:"grid",
                gridTemplateColumns:"60px 2fr 1fr 1fr 1fr 140px", gap:12,
                padding:"12px 20px", alignItems:"center",
                borderBottom: i<arr.length-1?`1px solid ${PANEL}`:"none",
                background: b.priority==="P0" ? `${RISK}06` : "transparent" }}>
                <span style={{ fontSize:11, fontWeight:900, color:col, fontFamily:mono }}>{b.priority}</span>
                <span style={{ fontSize:13, fontWeight:600, color:INK }}>{b.title}</span>
                <span style={{ fontSize:12, color:GRAY2 }}>{b.project}</span>
                <span style={{ fontSize:12, color:GRAY2 }}>{b.assignee}</span>
                <span style={{ fontSize:12, fontFamily:mono, color:b.openedDays>7?RISK:GRAY2 }}>{b.openedDays}d</span>
                <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                  <button onClick={()=>resolveBugItem(b)}
                    style={{ fontSize:11, padding:"4px 10px", borderRadius:8,
                             border:`1px solid ${LINE}`, background:SURFACE, color:GRAY2,
                             cursor:"pointer", fontFamily:ff }}>Resolve</button>
                  <button onClick={()=>addToast(`🔔 ${b.assignee} nudged about "${b.title}"`)}
                    style={{ fontSize:11, padding:"4px 10px", borderRadius:8,
                             border:`1px solid ${LINE}`, background:SURFACE, color:GRAY2,
                             cursor:"pointer", fontFamily:ff }}>Nudge</button>
                </div>
              </div>
            );
          })}
        </div>
        </div>
      </section>

      {/* ════════ 6 · CAPACITY + HEALTH ════════ */}
      <section ref={refs.capacity} style={{ marginBottom:34, scrollMarginTop:80 }}>
        <SectionHead icon="👥" title="Team Capacity & Health" sub="Workload, health by area & capacity recommendations" />

        {/* capacity overview */}
        <div style={{ background:SURFACE, border:`1.5px solid ${LINE}`, borderRadius:18,
                      padding:"18px 20px", marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase",
                        color:GRAY, fontFamily:mono, marginBottom:16 }}>Team Capacity & Workload</div>
          <div style={{ display:"flex", gap:16, marginBottom:12, fontSize:11, color:GRAY, flexWrap:"wrap" }}>
            <span style={{ display:"flex", alignItems:"center", gap:5 }}>
              <span style={{ width:10, height:10, borderRadius:2, background:OK }} /> Under 100%</span>
            <span style={{ display:"flex", alignItems:"center", gap:5 }}>
              <span style={{ width:10, height:10, borderRadius:2, background:WARN }} /> 100–120% — at risk</span>
            <span style={{ display:"flex", alignItems:"center", gap:5 }}>
              <span style={{ width:10, height:10, borderRadius:2, background:RISK }} /> Over 120% — critical</span>
          </div>
          {TEAM_CAPACITY.map((t,i) => {
            const color = t.load > 120 ? RISK : t.load > 100 ? WARN : OK;
            return (
              <div key={t.team} style={{ display:"grid", gridTemplateColumns:mobile?"80px 1fr 56px":"100px 1fr 70px 56px 90px",
                                          gap:12, alignItems:"center", padding:"10px 0",
                                          borderBottom: i<TEAM_CAPACITY.length-1?`1px solid ${PANEL}`:"none" }}>
                <span style={{ fontSize:13.5, fontWeight:700, color:INK }}>{t.team}</span>
                <LoadBar load={t.load} />
                <span style={{ fontSize:13, fontWeight:800, color, fontFamily:mono, textAlign:"right" }}>{t.load}%</span>
                {!mobile && <span style={{ fontSize:11, color:GRAY2, fontFamily:mono }}>{t.members} ppl</span>}
                {!mobile && (t.load > 100
                  ? <button onClick={()=>addToast(`⚖ Rebalance proposed for ${t.team} (${t.load}%) — work redistributed`)}
                      style={miniBtn(RISK)}>⚖ Rebalance</button>
                  : <span style={{ fontSize:11, color:OK, fontFamily:mono, textAlign:"center" }}>✓ healthy</span>)}
              </div>
            );
          })}
          <div style={{ marginTop:14, padding:"12px 16px", background:PANEL, borderRadius:12,
                        display:"flex", gap:20, flexWrap:"wrap", fontSize:12 }}>
            <span>Total people: <b style={{color:INK}}>{TEAM_CAPACITY.reduce((s,t)=>s+t.members,0)}</b></span>
            <span>Avg load: <b style={{color:WARN}}>{Math.round(TEAM_CAPACITY.reduce((s,t)=>s+t.load,0)/TEAM_CAPACITY.length)}%</b></span>
            <span>Teams overloaded: <b style={{color:RISK}}>{TEAM_CAPACITY.filter(t=>t.load>100).length}</b></span>
            <span>Blocked members: <b style={{color:RISK}}>{TEAM_CAPACITY.reduce((s,t)=>s+t.blocked,0)}</b></span>
          </div>
        </div>

        {/* health matrix + recommendations */}
        <div style={{ display:"grid", gridTemplateColumns:mobile?"1fr":"1fr 1fr", gap:16 }}>
          <div style={{ background:SURFACE, border:`1.5px solid ${LINE}`, borderRadius:18, padding:"18px 20px" }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:"uppercase",
                          color:GRAY, fontFamily:mono, marginBottom:14 }}>Health by Area</div>
            {HEALTH_MATRIX.map((h,i) => {
              const col = h.status==="green"?OK:h.status==="yellow"?WARN:RISK;
              const bg  = h.status==="green"?OK_BG:h.status==="yellow"?WARN_BG:RISK_BG;
              const lbl = h.status==="green"?"On Track":h.status==="yellow"?"At Risk":"Off Track";
              return (
                <button key={i} onClick={()=>addToast(h.status==="green"
                          ? `✓ ${h.area} is on track — no action needed`
                          : `🔍 Review opened for ${h.area} (${lbl})`)}
                        style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", width:"100%",
                                 borderRadius:10, marginBottom:6, background:bg, border:"none",
                                 cursor:"pointer", fontFamily:ff, textAlign:"left" }}>
                  <span style={{ width:9, height:9, borderRadius:"50%", background:col, flexShrink:0 }} />
                  <span style={{ flex:1, fontSize:13, color:INK }}>{h.area}</span>
                  <span style={{ fontSize:11, fontWeight:700, color:col, fontFamily:mono }}>{lbl}</span>
                </button>
              );
            })}
          </div>
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
                <div style={{ fontSize:12, color:GRAY2, marginBottom:6 }}>{r.action}</div>
                <button onClick={()=>addToast(`✓ Applied: ${r.team} — "${r.action.split(" — ")[0]}"`)}
                  style={miniBtn(INK)}>✓ Apply recommendation</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ 7 · DECISIONS TRACKER ════════ */}
      <section ref={refs.decisions} style={{ marginBottom:20, scrollMarginTop:80 }}>
        <SectionHead icon="⏳" title="Decisions Tracker"
          sub={`${pendingDec.length} pending stakeholder decisions`} />
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
                  Owner: <b style={{color:INK}}>{d.owner}</b></div>
                <div style={{ fontSize:11.5, color:GRAY2, marginBottom:4 }}>Impact: {d.impact}</div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:8 }}>
                  <span style={{ fontSize:11, fontFamily:mono, color:d.pendingSince>4?RISK:WARN }}>
                    Pending {d.pendingSince}d</span>
                  {!resolved && (
                    <button onClick={()=>{ setDecDone(s=>{const n=new Set(s);n.add(d.id);return n;}); if(onTime(d.dueDate)) fireCelebration(); addToast(`Decision closed: "${d.title}"`); closeDecision(d.id).then(refetchDecisions); }}
                      style={{ fontSize:12, fontWeight:700, padding:"5px 14px", borderRadius:10,
                               border:`1.5px solid ${LINE}`, background:SURFACE, color:GRAY2,
                               cursor:"pointer", fontFamily:ff }}>Mark done</button>
                  )}
                  {resolved && <span style={{ fontSize:12, color:OK, fontWeight:700 }}>✓ Resolved</span>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 🎉 on-time completion celebration */}
      <Celebration show={celebrate} />
    </div>
  );
}
