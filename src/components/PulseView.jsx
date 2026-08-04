import { useState, useEffect, useRef } from "react";
import { INK, SURFACE, PANEL, GRAY, GRAY2, LINE,
         OK, OK_BG, WARN, WARN_BG, RISK, RISK_BG, ff, mono } from "../brand/tokens.js";
import { HEALTH_MATRIX, BLOCKERS, DECISIONS, BUGS,
         CURRENT_SPRINT, RELEASES, TEAM_CAPACITY,
         BUSINESS_METRICS, CUSTOMER_METRICS,
         OUTLOOK_CONNECTED, PM_EMAIL } from "../data/pm_seed.js";

/* ── deadline helpers ── */
const TODAY0 = (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();
const daysPastDue = (dueDate) => dueDate ? Math.floor((TODAY0 - new Date(dueDate)) / 86400000) : 0;
const isMissed    = (dueDate) => dueDate ? new Date(dueDate) < TODAY0 : false;
const fmtDate     = (d) => new Date(d).toLocaleDateString("en-GB",{ day:"numeric", month:"short", year:"numeric" });

/* Sends the deadline-miss digest to the PM.
   When Outlook OAuth is live, wire this to the Graph sendMail endpoint:
     await fetch("/api/outlook/sendMail", { method:"POST", body: JSON.stringify(payload) })
   Until then it logs the payload that *would* be sent. */
function sendDeadlineEmail(payload) {
  console.info("[Outlook] deadline-miss email →", payload);
}

/* Inline notice shown on any missed-deadline task. Reflects whether the
   PM deadline-alert email has been (or will be) sent via Outlook. */
function DeadlineAlert() {
  return (
    <div style={{
      display:"flex", gap:8, alignItems:"flex-start",
      background: OUTLOOK_CONNECTED ? OK_BG : WARN_BG,
      border:`1px solid ${OUTLOOK_CONNECTED ? OK : WARN}44`,
      borderRadius:10, padding:"8px 11px", marginBottom:10,
    }}>
      <span style={{ fontSize:13, flexShrink:0 }}>📧</span>
      <span style={{ fontSize:11.5, lineHeight:1.45, color: OUTLOOK_CONNECTED ? OK : "#8A6314", fontWeight:600 }}>
        {OUTLOOK_CONNECTED
          ? <>Deadline-miss alert emailed to the PM ({PM_EMAIL}).</>
          : <>Flagged <b>critical</b>. The PM will be auto-emailed the details once <b>Outlook is connected</b>.</>}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   AI RECOMMENDATION ENGINE  (mock — swap with real Claude API call)
───────────────────────────────────────────────────────────────────────── */
function buildRecommendations({ blockers, bugs, decisions, releases, capacity, resolvedBlk, resolvedDec }) {
  const actions = [];
  const rel = releases[0];
  const daysToRelease = Math.ceil((new Date(rel.goLive) - new Date()) / 86400000);

  // ── Critical blockers ≥4 days ──
  blockers.filter(b => b.daysOpen >= 4 && !resolvedBlk.has(b.id)).forEach(b => {
    actions.push({
      id: `blk-${b.id}`, urgency:"critical", icon:"🚨",
      headline: `Escalate: "${b.title}"`,
      why: `Blocked ${b.daysOpen} days — ${b.impact}. Release in ${daysToRelease} days.`,
      source:"ClickUp + Outlook", effort:"15 min",
      steps: [`Send escalation email to ${b.owner}`, "Log escalation in ClickUp", "Set follow-up for tomorrow"],
      draft: {
        channel: "email",
        to: `${b.owner} <${b.owner.toLowerCase().replace(/\s/g,".")}@vendor.com>`,
        cc: "aurobinda@artoftech.in",
        subject: `[ESCALATION] ${b.title} — Action needed by EOD`,
        body:
`Hi Team,

I'm writing to formally escalate the following blocker that has now been open for ${b.daysOpen} days:

📌 Blocker: ${b.title}
⚠️  Impact: ${b.impact}
📅 Our release (${rel.version}) is scheduled for ${rel.goLive} — ${daysToRelease} days from today.

Without this resolved by ${new Date(Date.now() + 86400000*2).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}, we will not be able to meet the go-live date.

Could you please confirm:
1. Current status of this item
2. Expected resolution date
3. Any support needed from our side

This is now a priority-1 item for us. Happy to jump on a call today.

Best regards,
Aurobinda
Program Manager — Art of Tech`,
      },
    });
  });

  // ── P0 bugs unresolved ──
  bugs.filter(b => b.priority === "P0" && b.status !== "resolved").forEach(b => {
    actions.push({
      id: `bug-${b.id}`, urgency:"critical", icon:"🐛",
      headline: `P0 bug unresolved: "${b.title}"`,
      why: `${b.openedDays} days open in ${b.project}. Blocks release and impacts customers.`,
      source:"Jira / Bug tracker", effort:"5 min",
      steps: [`Confirm owner is ${b.assignee}`, "Get ETA on fix today", "Check if workaround exists"],
      draft: {
        channel: "teams",
        to: `${b.assignee}`,
        subject: `P0 Bug — Need update: ${b.title}`,
        body:
`Hi ${b.assignee},

Quick check-in on this P0 bug that's been open for ${b.openedDays} days:

🐛 Bug: ${b.title}
📦 Project: ${b.project}
🔴 Priority: P0 (blocks ${rel.version} release on ${rel.goLive})

I need from you today:
• Current status — are you actively working on this?
• ETA for fix or workaround
• Any blockers on your end?

If you need extra hands or resources, let me know immediately — I'll unblock you.

Thanks,
Aurobinda`,
      },
    });
  });

  // ── Release readiness <80% ──
  if (rel.readiness < 80) {
    actions.push({
      id:"release-readiness", urgency:"high", icon:"🚀",
      headline: `${rel.version} only ${rel.readiness}% ready — ${daysToRelease} days to go-live`,
      why: `QA: ${rel.qaStatus.replace("_"," ")}, UAT: ${rel.uat.replace(/_/g," ")}, ${rel.criticalBugs} critical bugs open.`,
      source:"Release tracker", effort:"30 min",
      steps: ["Run daily release standup", "Chase UAT sign-off from client", "Resolve deploy checklist gaps"],
      draft: {
        channel: "teams",
        to: "Release Team Channel",
        subject: `${rel.version} Release Standup — ${daysToRelease} days to go`,
        body:
`📢 Daily Release Standup — ${rel.version}

Go-live: ${rel.goLive} (${daysToRelease} days away)
Current readiness: ${rel.readiness}% ⚠️

Status:
• QA: ${rel.qaStatus.replace("_"," ")}
• UAT: ${rel.uat.replace(/_/g," ")}
• Critical bugs open: ${rel.criticalBugs}
• Deploy checklist: ${Object.values(rel.deployChecklist).filter(Boolean).length}/${Object.keys(rel.deployChecklist).length} items done

🔴 Action required today:
1. QA team — complete regression on payment module
2. Aurobinda — chase Bloom Co for UAT confirmation
3. DevOps — complete DB migration test and monitoring alerts

We need to hit 85%+ by EOD today.

— Aurobinda`,
      },
    });
  }

  // ── QA overloaded ──
  const qaTeam = capacity.find(t => t.team === "QA");
  if (qaTeam && qaTeam.load > 130) {
    actions.push({
      id:"qa-capacity", urgency:"high", icon:"⚡",
      headline: `QA team at ${qaTeam.load}% — test coverage at risk`,
      why: `${qaTeam.members} engineers, ${qaTeam.load}% load. Regression run will be incomplete.`,
      source:"Teams + ClickUp", effort:"20 min",
      steps: ["Raise contract QA request with Director", "Prioritise P0/P1 tests only", "Defer P3 test cases"],
      draft: {
        channel: "email",
        to: "Director <director@artoftech.in>",
        cc: "aurobinda@artoftech.in",
        subject: `Approval needed: Contract QA resource for ${rel.version} release`,
        body:
`Hi,

I need your quick approval on bringing in a contract QA resource for the next 2 weeks.

Context:
• QA team is currently at ${qaTeam.load}% capacity with ${qaTeam.members} engineers
• We have ${rel.version} releasing on ${rel.goLive} (${daysToRelease} days)
• At current load, regression coverage will be incomplete — increasing release risk

What I'm requesting:
• 1 contract QA engineer for 2 weeks
• Focus: regression testing for ${rel.version} and P0/P1 bug verification
• Estimated cost: ₹80,000–₹1,00,000 (2 weeks)

Without this, we are at risk of shipping with untested edge cases, which could mean post-release incidents and customer complaints.

Please confirm approval by EOD so I can initiate the hiring process.

Thanks,
Aurobinda`,
      },
    });
  }

  // ── Stale decisions ──
  decisions.filter(d => d.pendingSince >= 4 && !resolvedDec.has(d.id)).forEach(d => {
    actions.push({
      id: `dec-${d.id}`, urgency: d.escalation ? "high" : "medium", icon:"⏳",
      headline: `Decision stalled ${d.pendingSince} days: "${d.title}"`,
      why: `Owner: ${d.owner}. Impact: ${d.impact}.`,
      source:"Outlook + Teams", effort:"10 min",
      steps: [`Send direct nudge to ${d.owner}`, "Set a hard decision deadline", "Escalate if no response by EOD"],
      draft: {
        channel: d.escalation ? "email" : "teams",
        to: `${d.owner}`,
        subject: `Decision needed: ${d.title}`,
        body:
`Hi ${d.owner},

Following up on the pending decision — this has been waiting for ${d.pendingSince} days now and is starting to impact delivery.

📋 Decision: ${d.title}
⚠️  If delayed: ${d.impact}

I need a decision by ${new Date(Date.now() + 86400000).toLocaleDateString("en-GB",{day:"numeric",month:"short",weekday:"short"})} (tomorrow EOD) to keep the team unblocked.

If you need more information to decide, let me know and I'll arrange it within the hour.

Happy to jump on a 15-minute call today if that helps.

Thanks,
Aurobinda`,
      },
    });
  });

  // ── Client UAT pending ──
  if (rel.uat === "pending_client" && daysToRelease < 14) {
    actions.push({
      id:"uat-client", urgency:"medium", icon:"📋",
      headline: `Client UAT not started — ${daysToRelease} days to go-live`,
      why: `Bloom Co needs to confirm ${rel.version} UAT. Every day compresses the window.`,
      source:"Outlook", effort:"10 min",
      steps: ["Send UAT environment link to client", "Schedule UAT walkthrough call", "Set written UAT deadline"],
      draft: {
        channel: "email",
        to: "Bloom Co PM <pm@bloomco.com>",
        cc: "aurobinda@artoftech.in",
        subject: `UAT for ${rel.version} — Environment ready, action needed`,
        body:
`Hi,

The ${rel.version} staging environment is now ready for your UAT review.

🔗 UAT Environment: https://staging.bloomco.artoftech.in
📅 Go-live: ${rel.goLive} (${daysToRelease} days away)
⏳ UAT window: We need your sign-off by ${new Date(Date.now() + 86400000*7).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}

What we need from you:
1. Access and review the UAT environment
2. Test the key flows in the attached test plan
3. Confirm sign-off (or raise issues) by the date above

I'm happy to walk your team through the new features on a 30-minute call. Please let me know your availability this week.

Best regards,
Aurobinda
Program Manager — Art of Tech`,
      },
    });
  }

  // ── High-risk accounts ──
  if (CUSTOMER_METRICS.highRiskAccounts > 0) {
    actions.push({
      id:"churn-risk", urgency:"medium", icon:"⚠️",
      headline: `${CUSTOMER_METRICS.highRiskAccounts} high-risk accounts — churn signals detected`,
      why: `${CUSTOMER_METRICS.criticalIssues} critical issues + ${CUSTOMER_METRICS.slaBreaches} SLA breaches. Vertex & Bloom Co at risk.`,
      source:"Outlook + Fireflies", effort:"20 min",
      steps: ["Schedule check-in call with Vertex PM", "Review open tickets for Bloom Co", "Share resolution timeline with both accounts"],
      draft: {
        channel: "email",
        to: "Vertex PM <pm@vertex.com>",
        cc: "aurobinda@artoftech.in",
        subject: `Proactive check-in — resolving your open items`,
        body:
`Hi,

I wanted to reach out proactively. I've reviewed your account and noticed a few open items I'd like to address personally.

Current open items on your account:
• ${CUSTOMER_METRICS.criticalIssues} critical issues under investigation
• SLA response times — I owe you a better explanation

I'd like to schedule a 30-minute call this week to:
1. Walk you through the resolution status for each issue
2. Give you a clear timeline for fixes
3. Hear any concerns you may have

Your satisfaction matters a lot to us. Please share your availability and I'll send a calendar invite.

Best regards,
Aurobinda
Program Manager — Art of Tech`,
      },
    });
  }

  const order = { critical:0, high:1, medium:2 };
  return actions.sort((a,b) => order[a.urgency]-order[b.urgency]).slice(0,6);
}

/* ─────────────────────────────────────────────────────────────────────────
   DRAFT PANEL — inline editable message with approve & send
───────────────────────────────────────────────────────────────────────── */
const CHANNEL_META = {
  email:  { icon:"📧", label:"Send via Outlook" },
  teams:  { icon:"💬", label:"Send via Teams"   },
};

function DraftPanel({ draft, onSend, sent }) {
  const [editing, setEditing] = useState(false);
  const [body,    setBody]    = useState(draft.body);
  const [to,      setTo]      = useState(draft.to);
  const [subject, setSubject] = useState(draft.subject);
  const meta = CHANNEL_META[draft.channel] || CHANNEL_META.email;

  if (sent) {
    return (
      <div style={{ background:OK_BG, border:`1.5px solid ${OK}44`, borderRadius:14,
                    padding:"14px 18px", display:"flex", gap:10, alignItems:"center" }}>
        <span style={{ fontSize:20 }}>✅</span>
        <div>
          <div style={{ fontSize:13.5, fontWeight:700, color:OK }}>
            {meta.icon} Message sent successfully
          </div>
          <div style={{ fontSize:12, color:GRAY2, marginTop:2 }}>
            To: {to} · via {draft.channel}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background:PANEL, border:`1.5px solid ${LINE}`, borderRadius:14,
                  overflow:"hidden" }}>
      {/* draft header */}
      <div style={{ background:SURFACE, padding:"10px 16px",
                    borderBottom:`1px solid ${LINE}`,
                    display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontSize:11, fontWeight:700, color:GRAY, textTransform:"uppercase",
                      letterSpacing:0.8, fontFamily:mono }}>
          {meta.icon} AI-drafted message — review before sending
        </div>
        <button onClick={() => setEditing(e => !e)} style={{
          fontSize:12, fontWeight:700, padding:"4px 12px", borderRadius:8,
          border:`1px solid ${LINE}`, background:editing?INK:PANEL,
          color:editing?"#fff":GRAY2, cursor:"pointer", fontFamily:ff,
        }}>{editing ? "← Done editing" : "✏ Edit"}</button>
      </div>

      {/* to / subject */}
      <div style={{ padding:"10px 16px 0" }}>
        <div style={{ display:"grid", gridTemplateColumns:"60px 1fr", gap:6,
                      marginBottom:6, alignItems:"center" }}>
          <span style={{ fontSize:11.5, color:GRAY, fontWeight:600, fontFamily:mono }}>To:</span>
          {editing
            ? <input value={to} onChange={e=>setTo(e.target.value)} style={{
                padding:"5px 10px", borderRadius:8, border:`1px solid ${LINE}`,
                fontSize:12.5, fontFamily:ff, color:INK, background:SURFACE, outline:"none" }} />
            : <span style={{ fontSize:12.5, color:INK, fontWeight:600 }}>{to}</span>
          }
        </div>
        {draft.cc && (
          <div style={{ display:"grid", gridTemplateColumns:"60px 1fr", gap:6,
                        marginBottom:6, alignItems:"center" }}>
            <span style={{ fontSize:11.5, color:GRAY, fontWeight:600, fontFamily:mono }}>CC:</span>
            <span style={{ fontSize:12, color:GRAY2 }}>{draft.cc}</span>
          </div>
        )}
        <div style={{ display:"grid", gridTemplateColumns:"60px 1fr", gap:6,
                      marginBottom:10, alignItems:"center" }}>
          <span style={{ fontSize:11.5, color:GRAY, fontWeight:600, fontFamily:mono }}>Subject:</span>
          {editing
            ? <input value={subject} onChange={e=>setSubject(e.target.value)} style={{
                padding:"5px 10px", borderRadius:8, border:`1px solid ${LINE}`,
                fontSize:12.5, fontFamily:ff, color:INK, background:SURFACE, outline:"none" }} />
            : <span style={{ fontSize:12.5, color:INK, fontWeight:600 }}>{subject}</span>
          }
        </div>
      </div>

      {/* body */}
      <div style={{ padding:"0 16px 14px" }}>
        <div style={{ borderTop:`1px solid ${LINE}`, paddingTop:10 }}>
          {editing
            ? <textarea value={body} onChange={e=>setBody(e.target.value)} rows={10} style={{
                width:"100%", padding:"10px 12px", borderRadius:10,
                border:`1px solid ${LINE}`, fontSize:12.5, fontFamily:ff,
                color:INK, background:SURFACE, outline:"none",
                resize:"vertical", lineHeight:1.6, boxSizing:"border-box" }} />
            : <pre style={{ fontSize:12.5, fontFamily:ff, color:INK,
                             whiteSpace:"pre-wrap", lineHeight:1.7, margin:0 }}>{body}</pre>
          }
        </div>
      </div>

      {/* approve bar */}
      <div style={{ padding:"12px 16px 16px", borderTop:`1px solid ${LINE}`,
                    display:"flex", gap:10, alignItems:"center",
                    background:SURFACE, flexWrap:"wrap" }}>
        <div style={{ flex:1, fontSize:12, color:GRAY }}>
          Review the message above. Click <b style={{color:INK}}>Approve & Send</b> when ready.
        </div>
        <button onClick={() => onSend({ to, subject, body })} style={{
          padding:"9px 22px", borderRadius:12, border:"none",
          background:`linear-gradient(135deg, ${INK} 0%, #1C7562 100%)`,
          color:"#fff", fontSize:13.5, fontWeight:800, cursor:"pointer",
          fontFamily:ff, display:"flex", alignItems:"center", gap:8,
          boxShadow:`0 2px 12px ${INK}30`,
        }}>
          {meta.icon} Approve & Send
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   ACTION CARD — recommendation with step list + draft panel
───────────────────────────────────────────────────────────────────────── */
const URGENCY = {
  critical: { color:RISK,   bg:RISK_BG,   border:"#F2C4BC", label:"Critical" },
  high:     { color:WARN,   bg:WARN_BG,   border:"#A8D8C6", label:"High"     },
  medium:   { color:"#2A6B5A", bg:"#E4F5EF", border:"#A8D8C6", label:"Medium" },
};

function ActionCard({ action, index, open, onToggle, onDone, done, sentDrafts, onSendDraft }) {
  const u    = URGENCY[action.urgency];
  const sent = sentDrafts.has(action.id);
  const [showDraft, setShowDraft]   = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated]   = useState(false);

  const generateDraft = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenerated(true); setShowDraft(true); }, 1100);
  };

  return (
    <div style={{
      background: done ? OK_BG : SURFACE,
      border:`1.5px solid ${done ? OK+"44" : u.border}`,
      borderRadius:16, overflow:"hidden",
      opacity: done ? 0.6 : 1, transition:"all .2s",
    }}>
      {/* ── header row — always visible ── */}
      <button onClick={onToggle} style={{
        width:"100%", background:"transparent", border:"none",
        padding:"14px 18px", cursor:"pointer", textAlign:"left",
        display:"flex", gap:12, alignItems:"flex-start",
      }}>
        <div style={{ flexShrink:0, display:"flex", flexDirection:"column",
                      alignItems:"center", gap:3, paddingTop:2 }}>
          <span style={{ fontSize:18, lineHeight:1 }}>{action.icon}</span>
          <span style={{ fontSize:9, fontWeight:900, fontFamily:mono,
                         color:u.color, letterSpacing:0.5 }}>#{index+1}</span>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap", marginBottom:4 }}>
            <span style={{ fontSize:10, fontWeight:800, padding:"2px 8px", borderRadius:20,
                           background:u.bg, color:u.color, fontFamily:mono,
                           border:`1px solid ${u.border}` }}>{u.label}</span>
            {done  && <span style={{ fontSize:10,fontWeight:800,color:OK,background:OK_BG,
                                     padding:"2px 8px",borderRadius:20 }}>✓ Done</span>}
            {sent  && !done && <span style={{ fontSize:10,fontWeight:800,color:OK,background:OK_BG,
                                              padding:"2px 8px",borderRadius:20 }}>📤 Sent</span>}
            <span style={{ fontSize:10, color:GRAY2, fontFamily:mono }}>~{action.effort}</span>
          </div>
          <div style={{ fontSize:14, fontWeight:700, color:done?GRAY2:INK,
                        lineHeight:1.4, textDecoration:done?"line-through":"none" }}>
            {action.headline}
          </div>
          <div style={{ fontSize:12, color:GRAY, marginTop:3, lineHeight:1.5 }}>{action.why}</div>
        </div>
        <div style={{ flexShrink:0, display:"flex", gap:6, alignItems:"center" }}>
          <span style={{ fontSize:10, color:GRAY2, fontFamily:mono, whiteSpace:"nowrap" }}>
            via {action.source}
          </span>
          <span style={{ fontSize:13, color:GRAY,
                         transform:open?"rotate(180deg)":"none",
                         transition:"transform .2s", display:"inline-block" }}>▾</span>
        </div>
      </button>

      {/* ── expanded panel ── */}
      {open && (
        <div style={{ borderTop:`1px solid ${u.border}`, padding:"14px 18px 18px" }}>

          {/* steps */}
          <div style={{ fontSize:11, fontWeight:700, color:GRAY, textTransform:"uppercase",
                        letterSpacing:0.8, fontFamily:mono, marginBottom:8 }}>
            Steps to action
          </div>
          {action.steps.map((step,i) => (
            <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"5px 0" }}>
              <span style={{ width:20, height:20, borderRadius:"50%", flexShrink:0,
                             background:`${u.color}22`, color:u.color,
                             fontSize:10, fontWeight:800, display:"flex",
                             alignItems:"center", justifyContent:"center",
                             fontFamily:mono }}>{i+1}</span>
              <span style={{ fontSize:13, color:INK, lineHeight:1.5 }}>{step}</span>
            </div>
          ))}

          {/* draft — generate on demand */}
          {action.draft && !done && (
            <div style={{ marginTop:14 }}>

              {/* Step 1: not generated yet → show Generate button */}
              {!generated && !sent && (
                <button onClick={generateDraft} disabled={generating} style={{
                  width:"100%", padding:"11px 18px", borderRadius:12,
                  border:`1.5px solid ${generating ? INK : u.border}`,
                  background: generating ? INK+"0A" : `${u.color}10`,
                  color: generating ? INK : u.color,
                  fontSize:13, fontWeight:700, cursor:generating?"default":"pointer",
                  fontFamily:ff, display:"flex", alignItems:"center",
                  justifyContent:"center", gap:8,
                }}>
                  {generating ? (
                    <>
                      <span style={{ display:"inline-block", width:14, height:14,
                                     border:`2px solid ${INK}33`, borderTopColor:INK,
                                     borderRadius:"50%", animation:"spin .7s linear infinite" }} />
                      Drafting your {action.draft.channel === "email" ? "email" : "message"} with AI…
                    </>
                  ) : (
                    <>✨ Generate {action.draft.channel === "email" ? "email" : "message"} with AI</>
                  )}
                </button>
              )}

              {/* Step 2: generated → collapsible header + draft panel */}
              {(generated || sent) && (
                <>
                  <button onClick={() => setShowDraft(s => !s)} style={{
                    width:"100%", padding:"10px 18px", borderRadius:12,
                    border:`1.5px solid ${showDraft ? INK : LINE}`,
                    background: showDraft ? INK+"0A" : PANEL,
                    color: showDraft ? INK : GRAY2,
                    fontSize:13, fontWeight:700, cursor:"pointer",
                    fontFamily:ff, display:"flex", alignItems:"center",
                    justifyContent:"space-between",
                  }}>
                    <span>
                      {CHANNEL_META[action.draft.channel]?.icon || "📄"}{" "}
                      {sent ? "View sent message" : "AI-drafted message ready"}
                      {!sent && <span style={{ fontSize:11, color:GRAY, fontWeight:400,
                                               marginLeft:8 }}>— review & confirm before sending</span>}
                    </span>
                    <span style={{ transform:showDraft?"rotate(180deg)":"none",
                                   transition:"transform .2s", display:"inline-block",
                                   fontSize:11 }}>▾</span>
                  </button>

                  {showDraft && (
                    <div style={{ marginTop:10 }}>
                      <DraftPanel
                        draft={action.draft}
                        sent={sent}
                        onSend={(edited) => onSendDraft(action.id, edited)}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* done button */}
          {!done && (
            <button onClick={onDone} style={{
              marginTop:12, padding:"8px 20px", borderRadius:10,
              background:PANEL, color:GRAY2, border:`1.5px solid ${LINE}`,
              fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:ff,
            }}>Mark as done ✓</button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   MAIN VIEW
───────────────────────────────────────────────────────────────────────── */
export default function PulseView({ addToast, mobile, tablet }) {
  const [open,       setOpen]    = useState(null);
  const [doneTasks,  setDone]    = useState(new Set());
  const [sentDrafts, setSent]    = useState(new Set());
  const [decDone,    setDecDone] = useState(new Set());
  const [blkDone,    setBlkDone] = useState(new Set());
  const [showKpi,    setShowKpi] = useState(false);
  const [openDec,    setOpenDec] = useState(null);
  const [openBlk,    setOpenBlk] = useState(null);

  const toggle    = (id) => setOpen(o => o === id ? null : id);
  const toggleDec = (id) => setOpenDec(o => o === id ? null : id);
  const toggleBlk = (id) => setOpenBlk(o => o === id ? null : id);

  // ── Auto-email the PM about missed deadlines (fires once Outlook is connected) ──
  const alertedRef = useRef(false);
  useEffect(() => {
    if (alertedRef.current) return;
    if (!OUTLOOK_CONNECTED) return;       // queued until Outlook OAuth is live
    if (overdueAll.length === 0) return;
    alertedRef.current = true;
    // Build the deadline-miss digest the PM receives by email
    const lines = overdueAll.map(t =>
      `• [${t.kind}] ${t.title} — owner: ${t.owner}, due ${fmtDate(t.dueDate)} (${daysPastDue(t.dueDate)}d overdue)`
    ).join("\n");
    sendDeadlineEmail({
      to: PM_EMAIL,
      subject: `[DEADLINE MISSED] ${overdueAll.length} item${overdueAll.length>1?"s":""} past due — action needed`,
      body: `Hi Aurobinda,\n\nThe following items have missed their deadline and are flagged critical:\n\n${lines}\n\n— AOTC Operations (automated alert)`,
    });
    addToast(`📧 Deadline alert emailed to PM — ${overdueAll.length} item${overdueAll.length>1?"s":""} past due`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendDraft = (actionId, { to, subject }) => {
    setSent(s => { const n=new Set(s); n.add(actionId); return n; });
    const meta = CHANNEL_META[recommendations.find(r=>r.id===actionId)?.draft?.channel] || CHANNEL_META.email;
    addToast(`${meta.icon} Message sent to ${to.split("<")[0].trim()}`);
  };

  // ── derived ──────────────────────────────────────────────────────
  const rel          = RELEASES[0];
  const critBugs     = BUGS.filter(b => b.priority==="P0" && b.status!=="resolved");
  const p1Bugs       = BUGS.filter(b => b.priority==="P1" && b.status!=="resolved");
  const openBlockers = BLOCKERS.filter(b => !blkDone.has(b.id));
  const pendingDec   = DECISIONS.filter(d => !decDone.has(d.id));
  const overloaded   = TEAM_CAPACITY.filter(t => t.load > 100);

  // ── missed-deadline detection (flagged critical) ──
  const overdueBlk = openBlockers.filter(b => isMissed(b.dueDate));
  const overdueDec = pendingDec.filter(d => isMissed(d.dueDate));
  const overdueAll = [
    ...overdueBlk.map(b => ({ ...b, kind:"Blocker" })),
    ...overdueDec.map(d => ({ ...d, kind:"Decision" })),
  ];
  const sprintPct    = Math.round(
    CURRENT_SPRINT.items.filter(i=>i.status==="done").length /
    CURRENT_SPRINT.items.length * 100
  );
  const overallH = HEALTH_MATRIX.some(h=>h.status==="red") ? "red"
    : HEALTH_MATRIX.some(h=>h.status==="yellow") ? "yellow" : "green";
  const HCOL = { green:OK, yellow:WARN, red:RISK };
  const HBG  = { green:OK_BG, yellow:WARN_BG, red:RISK_BG };

  const recommendations = buildRecommendations({
    blockers:BLOCKERS, bugs:BUGS, decisions:DECISIONS,
    releases:RELEASES, capacity:TEAM_CAPACITY,
    resolvedBlk:blkDone, resolvedDec:decDone,
  });
  const pending  = recommendations.filter(r => !doneTasks.has(r.id));
  const critical = pending.filter(r => r.urgency==="critical").length;

  return (
    <div>
      {/* ══ STATUS RAIL ══════════════════════════════════════════ */}
      <div style={{ background:SURFACE, border:`1.5px solid ${LINE}`, borderRadius:18,
                    padding:"14px 20px", marginBottom:16,
                    display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
        <span style={{ fontSize:11,fontWeight:700,color:GRAY,fontFamily:mono,
                       textTransform:"uppercase",letterSpacing:0.8,marginRight:4 }}>Status</span>
        {[
          { label:"Program",         value:overallH==="red"?"Off Track":overallH==="yellow"?"At Risk":"On Track",
            color:HCOL[overallH], bg:HBG[overallH] },
          { label:`Release ${rel.version}`, value:`${rel.readiness}% ready`,
            color:rel.readiness<80?WARN:OK, bg:rel.readiness<80?WARN_BG:OK_BG },
          { label:"Sprint",          value:`${sprintPct}% done`,
            color:sprintPct<50?WARN:OK, bg:sprintPct<50?WARN_BG:OK_BG },
          { label:"Bugs",            value:`${critBugs.length} P0 · ${p1Bugs.length} P1`,
            color:critBugs.length>0?RISK:WARN, bg:critBugs.length>0?RISK_BG:WARN_BG },
          { label:"Blockers",        value:`${openBlockers.length} open`,
            color:openBlockers.length>3?RISK:WARN, bg:openBlockers.length>3?RISK_BG:WARN_BG },
          { label:"Teams",           value:`${overloaded.length} overloaded`,
            color:overloaded.length>=2?RISK:OK, bg:overloaded.length>=2?RISK_BG:OK_BG },
          { label:"NPS",             value: BUSINESS_METRICS.nps != null ? `${BUSINESS_METRICS.nps}` : "—",
            color:BUSINESS_METRICS.nps != null ? (BUSINESS_METRICS.nps>50?OK:WARN) : GRAY, bg:BUSINESS_METRICS.nps != null ? (BUSINESS_METRICS.nps>50?OK_BG:WARN_BG) : PANEL },
        ].map(s => (
          <span key={s.label} style={{ display:"flex",alignItems:"center",gap:5,
                                       background:s.bg,border:`1px solid ${s.color}33`,
                                       borderRadius:20,padding:"5px 12px",fontSize:12 }}>
            <span style={{ width:7,height:7,borderRadius:"50%",background:s.color,flexShrink:0 }} />
            <span style={{ color:GRAY2,fontWeight:500 }}>{s.label}:</span>
            <span style={{ color:s.color,fontWeight:700 }}>{s.value}</span>
          </span>
        ))}
        <button onClick={()=>setShowKpi(o=>!o)} style={{
          marginLeft:"auto",fontSize:12,fontWeight:700,padding:"5px 14px",
          borderRadius:20,border:`1px solid ${LINE}`,
          background:showKpi?INK:PANEL,color:showKpi?"#fff":GRAY2,
          cursor:"pointer",fontFamily:ff,
        }}>{showKpi?"Hide details ▲":"Show details ▾"}</button>
      </div>

      {/* ── expanded KPI detail grid ─────────────────────────── */}
      {showKpi && (
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",
                      gap:12,marginBottom:16 }}>
          <div style={{ background:SURFACE,border:`1.5px solid ${LINE}`,borderRadius:16,padding:"16px 18px" }}>
            <div style={{ fontSize:11,fontWeight:700,color:GRAY,textTransform:"uppercase",
                          letterSpacing:0.8,fontFamily:mono,marginBottom:10 }}>
              Health by area
            </div>
            {HEALTH_MATRIX.map((h,i)=>(
              <div key={i} style={{ display:"flex",gap:8,alignItems:"center",padding:"6px 0",
                                    borderBottom:i<HEALTH_MATRIX.length-1?`1px solid ${PANEL}`:"none" }}>
                <span style={{ width:9,height:9,borderRadius:"50%",background:HCOL[h.status],flexShrink:0 }} />
                <span style={{ flex:1,fontSize:12.5,color:INK }}>{h.area}</span>
                <span style={{ fontSize:11,fontWeight:700,color:HCOL[h.status] }}>
                  {h.status==="green"?"On Track":h.status==="yellow"?"At Risk":"Off Track"}
                </span>
              </div>
            ))}
          </div>
          <div style={{ background:SURFACE,border:`1.5px solid ${LINE}`,borderRadius:16,padding:"16px 18px" }}>
            <div style={{ fontSize:11,fontWeight:700,color:GRAY,textTransform:"uppercase",
                          letterSpacing:0.8,fontFamily:mono,marginBottom:10 }}>
              Team capacity — 100% = full
            </div>
            {TEAM_CAPACITY.map((t,i)=>{
              const col=t.load>120?RISK:t.load>100?WARN:OK;
              return (
                <div key={t.team} style={{ padding:"5px 0",borderBottom:i<TEAM_CAPACITY.length-1?`1px solid ${PANEL}`:"none" }}>
                  <div style={{ display:"flex",justifyContent:"space-between",marginBottom:3 }}>
                    <span style={{ fontSize:12.5,color:INK,fontWeight:600 }}>{t.team}</span>
                    <span style={{ fontSize:12,fontWeight:800,color:col,fontFamily:mono }}>{t.load}%</span>
                  </div>
                  <div style={{ background:PANEL,borderRadius:4,height:5,overflow:"hidden" }}>
                    <div style={{ width:`${Math.min(t.load,150)/1.5}%`,height:"100%",background:col,borderRadius:4 }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ background:SURFACE,border:`1.5px solid ${LINE}`,borderRadius:16,padding:"16px 18px" }}>
            <div style={{ fontSize:11,fontWeight:700,color:GRAY,textTransform:"uppercase",
                          letterSpacing:0.8,fontFamily:mono,marginBottom:10 }}>
              {CURRENT_SPRINT.name} · ends {CURRENT_SPRINT.endDate}
            </div>
            <div style={{ background:PANEL,borderRadius:6,height:8,marginBottom:12,overflow:"hidden" }}>
              <div style={{ width:`${sprintPct}%`,height:"100%",borderRadius:6,
                            background:sprintPct<40?RISK:sprintPct<70?WARN:OK }} />
            </div>
            {["done","in_progress","blocked","todo"].map(s=>{
              const cnt=CURRENT_SPRINT.items.filter(i=>i.status===s).length;
              const col=s==="done"?OK:s==="blocked"?RISK:s==="in_progress"?WARN:GRAY;
              return (
                <div key={s} style={{ display:"flex",justifyContent:"space-between",
                                      padding:"5px 0",borderBottom:`1px solid ${PANEL}` }}>
                  <span style={{ fontSize:12.5,color:GRAY2,textTransform:"capitalize" }}>
                    {s.replace("_"," ")}
                  </span>
                  <span style={{ fontSize:13,fontWeight:700,color:col,fontFamily:mono }}>{cnt} tasks</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ AI MORNING BRIEF ═════════════════════════════════════ */}
      <div style={{ background:`linear-gradient(135deg, ${INK}F8 0%, #14574A 100%)`,
                    borderRadius:20,padding:"20px 24px",marginBottom:16 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",
                      marginBottom:16,flexWrap:"wrap",gap:8 }}>
          <div>
            <div style={{ fontSize:16,fontWeight:800,color:"#fff",marginBottom:4 }}>
              🤖 Your AI Morning Brief
            </div>
            <div style={{ fontSize:12.5,color:"rgba(245,244,242,.55)" }}>
              Scanned your ecosystem · ranked by impact · drafts ready to send.
              {critical>0 && <span style={{ color:"#F4A792",fontWeight:700 }}> {critical} critical item{critical>1?"s":""} need action today.</span>}
            </div>
          </div>
          <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
            {["📧 Outlook","✅ ClickUp","💬 Teams","🎙 Fireflies"].map(s=>(
              <span key={s} style={{ fontSize:10.5,padding:"3px 10px",borderRadius:20,
                                     background:"rgba(255,255,255,.09)",
                                     border:"1px solid rgba(255,255,255,.14)",
                                     color:"rgba(245,244,242,.6)",fontFamily:mono }}>{s}</span>
            ))}
          </div>
        </div>

        {pending.length === 0 ? (
          <div style={{ textAlign:"center",padding:"24px 0",color:"rgba(245,244,242,.6)" }}>
            <div style={{ fontSize:28,marginBottom:8 }}>🎉</div>
            <div style={{ fontSize:16,fontWeight:700,color:"#fff" }}>All clear! Nothing critical today.</div>
          </div>
        ) : (
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {recommendations.map((rec,i)=>(
              <ActionCard
                key={rec.id} action={rec} index={i}
                open={open===rec.id}
                done={doneTasks.has(rec.id)}
                sentDrafts={sentDrafts}
                onToggle={()=>toggle(rec.id)}
                onDone={()=>{ setDone(s=>{const n=new Set(s);n.add(rec.id);return n;}); setOpen(null); addToast(`✓ "${rec.headline.slice(0,40)}…" marked done`); }}
                onSendDraft={handleSendDraft}
              />
            ))}
          </div>
        )}

        {recommendations.length > 0 && (
          <div style={{ marginTop:14,display:"flex",alignItems:"center",gap:10 }}>
            <div style={{ flex:1,background:"rgba(255,255,255,.1)",borderRadius:6,height:5,overflow:"hidden" }}>
              <div style={{ width:`${(doneTasks.size/recommendations.length)*100}%`,
                            height:"100%",background:OK,borderRadius:6,transition:"width .4s" }} />
            </div>
            <span style={{ fontSize:11,color:"rgba(245,244,242,.5)",fontFamily:mono,whiteSpace:"nowrap" }}>
              {doneTasks.size}/{recommendations.length} actioned
            </span>
          </div>
        )}
      </div>

      {/* ══ DECISIONS + BLOCKERS ═════════════════════════════════ */}
      <div style={{ display:"grid",gridTemplateColumns:mobile?"1fr":"1fr 1fr",gap:14 }}>
        {/* Pending decisions */}
        <div style={{ background:SURFACE,border:`1.5px solid ${LINE}`,borderRadius:18,padding:"18px 20px" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
            <div>
              <div style={{ fontSize:14,fontWeight:800,color:INK }}>⏳ Pending Decisions</div>
              <div style={{ fontSize:11.5,color:GRAY2,marginTop:2 }}>
                Every day of delay blocks work downstream.
              </div>
            </div>
            <span style={{ fontSize:22,fontWeight:900,
                           color:pendingDec.length>2?WARN:GRAY2,fontFamily:mono }}>{pendingDec.length}</span>
          </div>
          {pendingDec.length===0
            ? <div style={{color:OK,fontWeight:700,padding:"8px 0",fontSize:13}}>✓ All decisions resolved</div>
            : pendingDec.map((d,i)=>{
            const isOpen = openDec === d.id;
            const missed = isMissed(d.dueDate);
            return (
            <div key={d.id} style={{ borderBottom:i<pendingDec.length-1?`1px solid ${PANEL}`:"none" }}>
              {/* point row — always visible */}
              <button onClick={()=>toggleDec(d.id)} style={{
                width:"100%",background:"transparent",border:"none",cursor:"pointer",
                fontFamily:ff,textAlign:"left",padding:"11px 0",
                display:"flex",gap:9,alignItems:"flex-start" }}>
                <span style={{ fontSize:13,color:(missed||d.pendingSince>=5)?RISK:WARN,
                               flexShrink:0,marginTop:1 }}>•</span>
                <span style={{ flex:1,fontSize:13,fontWeight:700,color:INK,lineHeight:1.4 }}>{d.title}</span>
                {missed && <span style={{ fontSize:9,fontWeight:900,background:RISK,color:"#fff",
                                          padding:"2px 7px",borderRadius:4,flexShrink:0,marginTop:1,
                                          letterSpacing:0.3,whiteSpace:"nowrap" }}>⚠ DEADLINE MISSED</span>}
                {!missed && d.escalation && <span style={{ fontSize:9,fontWeight:900,background:RISK_BG,color:RISK,
                                                padding:"2px 7px",borderRadius:4,flexShrink:0,marginTop:1 }}>ESCALATE</span>}
                <span style={{ fontSize:11,color:GRAY,flexShrink:0,marginTop:2,
                               transform:isOpen?"rotate(180deg)":"none",transition:"transform .2s",
                               display:"inline-block" }}>▾</span>
              </button>

              {/* dropdown — only when open */}
              {isOpen && (
                <div style={{ padding:"0 0 12px 22px",animation:"fadeUp .2s ease both" }}>
                  <div style={{ fontSize:11.5,color:GRAY2,marginBottom:4 }}>
                    <b style={{color:INK}}>{d.owner}</b> ·{" "}
                    <span style={{color:d.pendingSince>=5?RISK:WARN,fontWeight:700}}>waiting {d.pendingSince}d</span>
                  </div>
                  {d.dueDate && (
                    <div style={{ fontSize:11.5,color:missed?RISK:GRAY2,marginBottom:4,fontWeight:missed?700:400 }}>
                      Due: {fmtDate(d.dueDate)}{missed && ` · missed by ${daysPastDue(d.dueDate)}d`}
                    </div>
                  )}
                  <div style={{ fontSize:11.5,color:GRAY,marginBottom:8 }}>If delayed: {d.impact}</div>
                  {missed && <DeadlineAlert />}
                  <button onClick={()=>{ setDecDone(s=>{const n=new Set(s);n.add(d.id);return n;}); setOpenDec(null); addToast(`Decision closed: "${d.title}"`); }}
                    style={{ fontSize:12,fontWeight:700,padding:"5px 14px",
                             borderRadius:8,border:`1px solid ${LINE}`,background:PANEL,
                             color:GRAY2,cursor:"pointer",fontFamily:ff }}>
                    Mark resolved ✓
                  </button>
                </div>
              )}
            </div>
          );})}
        </div>

        {/* Active blockers */}
        <div style={{ background:SURFACE,border:`1.5px solid ${LINE}`,borderRadius:18,padding:"18px 20px" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
            <div>
              <div style={{ fontSize:14,fontWeight:800,color:INK }}>🚧 Active Blockers</div>
              <div style={{ fontSize:11.5,color:GRAY2,marginTop:2 }}>
                Any blocker over 48 hours needs an owner assigned now.
              </div>
            </div>
            <span style={{ fontSize:22,fontWeight:900,
                           color:openBlockers.filter(b=>b.daysOpen>=5).length>0?RISK:WARN,
                           fontFamily:mono }}>{openBlockers.length}</span>
          </div>
          {openBlockers.length===0
            ? <div style={{color:OK,fontWeight:700,padding:"8px 0",fontSize:13}}>✓ No active blockers</div>
            : openBlockers.map((b,i)=>{
            const isOpen  = openBlk === b.id;
            const missed  = isMissed(b.dueDate);
            return (
            <div key={b.id} style={{ borderBottom:i<openBlockers.length-1?`1px solid ${PANEL}`:"none" }}>
              {/* point row — always visible */}
              <button onClick={()=>toggleBlk(b.id)} style={{
                width:"100%",background:"transparent",border:"none",cursor:"pointer",
                fontFamily:ff,textAlign:"left",padding:"11px 0",
                display:"flex",gap:9,alignItems:"flex-start" }}>
                <span style={{ fontSize:10.5,fontWeight:800,fontFamily:mono,flexShrink:0,marginTop:1,
                               padding:"2px 7px",borderRadius:5,
                               background:(missed||b.daysOpen>=5)?RISK_BG:WARN_BG,
                               color:(missed||b.daysOpen>=5)?RISK:WARN }}>{b.daysOpen}d</span>
                <span style={{ flex:1,fontSize:13,fontWeight:700,color:INK,lineHeight:1.4 }}>{b.title}</span>
                {missed && <span style={{ fontSize:9,fontWeight:900,background:RISK,color:"#fff",
                                          padding:"2px 7px",borderRadius:4,flexShrink:0,marginTop:1,
                                          letterSpacing:0.3,whiteSpace:"nowrap" }}>⚠ DEADLINE MISSED</span>}
                {!missed && b.escalated && <span style={{ fontSize:9,fontWeight:900,background:RISK_BG,color:RISK,
                                               padding:"2px 6px",borderRadius:4,flexShrink:0,marginTop:1 }}>ESC</span>}
                <span style={{ fontSize:11,color:GRAY,flexShrink:0,marginTop:2,
                               transform:isOpen?"rotate(180deg)":"none",transition:"transform .2s",
                               display:"inline-block" }}>▾</span>
              </button>

              {/* dropdown — only when open */}
              {isOpen && (
                <div style={{ padding:"0 0 12px 38px",animation:"fadeUp .2s ease both" }}>
                  <div style={{ fontSize:11.5,color:GRAY2,marginBottom:4 }}>Owner: <b style={{color:INK}}>{b.owner}</b></div>
                  {b.dueDate && (
                    <div style={{ fontSize:11.5,color:missed?RISK:GRAY2,marginBottom:4,fontWeight:missed?700:400 }}>
                      Due: {fmtDate(b.dueDate)}{missed && ` · missed by ${daysPastDue(b.dueDate)}d`}
                    </div>
                  )}
                  <div style={{ fontSize:11.5,color:GRAY,marginBottom:8 }}>{b.impact}</div>
                  {missed && <DeadlineAlert />}
                  <button onClick={()=>{ setBlkDone(s=>{const n=new Set(s);n.add(b.id);return n;}); setOpenBlk(null); addToast(`Blocker resolved: "${b.title}"`); }}
                    style={{ fontSize:12,fontWeight:700,padding:"5px 14px",
                             borderRadius:8,border:`1px solid ${LINE}`,background:PANEL,
                             color:GRAY2,cursor:"pointer",fontFamily:ff }}>
                    Resolve ✓
                  </button>
                </div>
              )}
            </div>
          );})}
        </div>
      </div>
    </div>
  );
}
