// ── AOTC PM Dashboard — live data pulled from ClickUp ────────────────────────
// Workspace: 90161357960  |  Last sync: 2026-06-19
// Financial metrics (ARR, MRR, CSAT, Budget) are not tracked in ClickUp —
// fill those manually in the sections marked ⚠️ MANUAL.

// ─── PROJECTS / FEATURES ──────────────────────────────────────────────────────
export const FEATURES = [
  // MUWCI Website (active — multiple tasks overdue)
  { id:"muwci-api",          name:"APIs & Database Integration",         project:"MUWCI",      status:"delayed",     owner:"Jyoti Shid",             targetDate:"2026-06-06", risk:"13 days overdue",         health:"red",    priority:"P0", blocked:true,  clickupId:"86d2zwnt6" },
  { id:"muwci-pages",        name:"Pages & Frontend",                    project:"MUWCI",      status:"delayed",     owner:"Mahesh Pawar",            targetDate:"2026-06-09", risk:"10 days overdue",         health:"red",    priority:"P0", blocked:true,  clickupId:"86d2zwp0k" },
  { id:"muwci-design-fixes", name:"Design Fixes & Feedback",             project:"MUWCI",      status:"delayed",     owner:"Jeetendra Chandragiri",   targetDate:"2026-06-13", risk:"6 days overdue",          health:"red",    priority:"P1", blocked:false, clickupId:"86d2zwqc0" },
  { id:"muwci-templates",    name:"Integration with Design Templates",   project:"MUWCI",      status:"delayed",     owner:"Jyoti / Mahesh",          targetDate:"2026-06-16", risk:"3 days overdue",          health:"red",    priority:"P0", blocked:false, clickupId:"86d2zwnf4" },
  { id:"muwci-admissions",   name:"Admissions Page",                     project:"MUWCI",      status:"in_progress", owner:"Caryn Putman",            targetDate:"2026-06-19", risk:"Due today",               health:"yellow", priority:"P1", blocked:false, clickupId:"86d2zwmu9" },
  { id:"muwci-parents",      name:"Parents Page",                        project:"MUWCI",      status:"in_progress", owner:"Indranil / Caryn",        targetDate:"2026-06-23", risk:"",                        health:"green",  priority:"P2", blocked:false, clickupId:"86d2zwmv5" },
  { id:"muwci-experience",   name:"MUWCI Experience Section",            project:"MUWCI",      status:"in_progress", owner:"Caryn / Indranil",        targetDate:"2026-06-25", risk:"",                        health:"green",  priority:"P2", blocked:false, clickupId:"86d2zwmtn" },
  { id:"muwci-alumni",       name:"Alumni Page",                         project:"MUWCI",      status:"not_started", owner:"Caryn / Indranil",        targetDate:"2026-07-03", risk:"",                        health:"green",  priority:"P2", blocked:false, clickupId:"86d2zwmuj" },
  { id:"muwci-giving",       name:"Giving & Donations",                  project:"MUWCI",      status:"not_started", owner:"Indranil / Caryn",        targetDate:"2026-07-09", risk:"",                        health:"green",  priority:"P2", blocked:false, clickupId:"86d2zwmup" },
  { id:"muwci-uat",          name:"Release for UAT",                     project:"MUWCI",      status:"not_started", owner:"Unassigned",              targetDate:"2026-07-08", risk:"Blocked by open dev tasks", health:"red",   priority:"P0", blocked:true,  clickupId:"86d318qf6" },
  { id:"muwci-golive",       name:"MUWCI GO LIVE",                       project:"MUWCI",      status:"not_started", owner:"Unassigned",              targetDate:"2026-07-14", risk:"Dependent on all upstream", health:"red",   priority:"P0", blocked:true,  clickupId:"86d318r4d" },

  // VenueSage (GigSpace)
  { id:"vs-deploy",          name:"Deploy to Production",                project:"VenueSage",  status:"completed",   owner:"Jeetendra Chandragiri",   targetDate:"2026-06-13", risk:"",                        health:"green",  priority:"P1", blocked:false, clickupId:"86d39jq7f" },
  { id:"vs-bizplan",         name:"Business Plan & Pitch Deck",          project:"VenueSage",  status:"delayed",     owner:"Jeetendra / Indranil",    targetDate:"2026-06-17", risk:"2 days overdue",          health:"red",    priority:"P1", blocked:false, clickupId:"86d39jqga" },

  // UFO Buzz
  { id:"ufo-dashboard",      name:"Content Owner Dashboard (Claude)",    project:"UFO Buzz",   status:"completed",   owner:"Jeetendra Chandragiri",   targetDate:"2026-06-13", risk:"",                        health:"green",  priority:"P1", blocked:false, clickupId:"86d39jqz3" },
  { id:"ufo-models",         name:"Models",                              project:"UFO Buzz",   status:"delayed",     owner:"Indranil Gupta",          targetDate:"2026-06-13", risk:"6 days overdue",          health:"red",    priority:"P1", blocked:false, clickupId:"86d39jt3f" },
  { id:"ufo-client-dash",    name:"UFO Buzz Client Dashboard",           project:"UFO Buzz",   status:"completed",   owner:"Jeetendra Chandragiri",   targetDate:null,         risk:"",                        health:"green",  priority:"P2", blocked:false, clickupId:"86d1npg2y" },

  // UFO Emotive
  { id:"ufo-emotive-dash",   name:"Emotive Dashboard (Full Flow)",       project:"UFO Emotive",status:"completed",   owner:"Jeetendra Chandragiri",   targetDate:"2026-06-14", risk:"",                        health:"green",  priority:"P1", blocked:false, clickupId:"86d39jrtj" },

  // Carer
  { id:"carer-admin",        name:"Admin Dashboard",                     project:"Carer",      status:"not_started", owner:"Tripti / Indranil / Caryn",targetDate:null,         risk:"Backlog — no date set",   health:"yellow", priority:"P2", blocked:false, clickupId:"86d1qpjt2" },
  { id:"carer-whatsapp",     name:"WhatsApp Integration",                project:"Carer",      status:"not_started", owner:"Tripti A",                targetDate:null,         risk:"Backlog — no date set",   health:"yellow", priority:"P2", blocked:false, clickupId:"86d1qp4pu" },

  // Campus OS
  { id:"campus-gtm",         name:"GTM Launch (30 tasks)",               project:"Campus OS",  status:"not_started", owner:"Unassigned",              targetDate:null,         risk:"No owner or dates set",   health:"yellow", priority:"P1", blocked:false },
];

// ─── CURRENT SPRINT ────────────────────────────────────────────────────────────
export const CURRENT_SPRINT = {
  name: "Active Work — MUWCI Go-Live & Milestones",
  startDate: "2026-06-16",
  endDate:   "2026-06-30",
  velocity:  null,
  items: [
    { id:"86d2zwmu9", title:"MUWCI: Admissions Page",                       points:null, status:"in_progress", assignee:"Caryn",             blocked:false },
    { id:"86d2zwmv5", title:"MUWCI: Parents Page",                          points:null, status:"in_progress", assignee:"Indranil / Caryn",  blocked:false },
    { id:"86d2zwmtn", title:"MUWCI: MUWCI Experience Section",              points:null, status:"in_progress", assignee:"Caryn / Indranil",  blocked:false },
    { id:"86d2zwnf4", title:"MUWCI: Integration with Design Templates",     points:null, status:"blocked",     assignee:"Jyoti / Mahesh",   blocked:true  },
    { id:"86d2zwp0k", title:"MUWCI: Pages and Frontend",                    points:null, status:"blocked",     assignee:"Mahesh",           blocked:true  },
    { id:"86d2zwnt6", title:"MUWCI: APIs & Database Integration",           points:null, status:"blocked",     assignee:"Jyoti",            blocked:true  },
    { id:"86d2zwqc0", title:"MUWCI: Design Fixes & Feedback Implementation",points:null, status:"in_progress", assignee:"Jeetendra",        blocked:false },
    { id:"86d39jqga", title:"VenueSage: Business Plan & Pitch Deck",        points:null, status:"todo",        assignee:"Jeet / Indranil",  blocked:false },
    { id:"86d39m7ez", title:"MUWCI: Visit — Head of Transport & Campus",    points:null, status:"todo",        assignee:"Jeet / Indranil",  blocked:false },
    { id:"86d3cktd7", title:"MovieBeam: Payment Follow-up (Ankur)",         points:null, status:"todo",        assignee:"Jeet / Auro",      blocked:false },
    { id:"86d39m820", title:"MUWCI: AI Presentation to Zhooben Sir",        points:null, status:"blocked",     assignee:"Amit / Indranil",  blocked:true  },
    { id:"86d39jt3f", title:"UFO Buzz: Models",                             points:null, status:"todo",        assignee:"Indranil",         blocked:false },
    { id:"86d2zwmuj", title:"MUWCI: Alumni Page",                           points:null, status:"todo",        assignee:"Caryn / Indranil", blocked:false },
  ],
};

// ─── RELEASES ──────────────────────────────────────────────────────────────────
export const RELEASES = [
  {
    id: "muwci-uat", version: "MUWCI v1.0 — UAT Release", goLive: "2026-07-08",
    readiness: 38, qaStatus: "not_started", criticalBugs: 0,
    uat: "not_started", rollback: false, status: "red",
    features: ["Admissions Page", "Parents Page", "Alumni Page", "Giving & Donations", "MUWCI Experience", "Integration with Design Templates"],
    deployChecklist: { infraReady:false, featureFlags:false, dbMigration:true, rollbackScript:false, monitoringAlerts:false },
  },
  {
    id: "muwci-live", version: "MUWCI v1.0 — GO LIVE", goLive: "2026-07-14",
    readiness: 20, qaStatus: "not_started", criticalBugs: 0,
    uat: "not_started", rollback: false, status: "red",
    features: ["Full MUWCI Website", "Content Calendar", "Donation Pages", "Internal Testing Complete"],
    deployChecklist: { infraReady:false, featureFlags:false, dbMigration:false, rollbackScript:false, monitoringAlerts:false },
  },
];

// ─── BUGS (real backlog / open items from ClickUp) ────────────────────────────
export const BUGS = [
  { id:"86d2zvktf", title:"MUWCI: Staging server not set up",                           priority:"P0", status:"open",     project:"MUWCI",        openedDays:51, assignee:"Indranil Gupta"   },
  { id:"86d1rnh61", title:"Carer: Start quiz should route to Profile.carer.com",        priority:"P1", status:"open",     project:"Carer",         openedDays:null, assignee:"Mahesh Pawar"   },
  { id:"86d1rngkh", title:"Carer: Cookies not being set",                               priority:"P1", status:"open",     project:"Carer",         openedDays:null, assignee:"Mahesh Pawar"   },
  { id:"86d1rndk2", title:"Carer: Profile — plan type mismatch not handled",            priority:"P1", status:"open",     project:"Carer",         openedDays:null, assignee:"Mahesh Pawar"   },
  { id:"86d32272v", title:"AOTC Website: Live server not set up",                       priority:"P1", status:"open",     project:"AOTC Website",  openedDays:null, assignee:"Indranil Gupta" },
  { id:"86d1rnfk1", title:"Carer: Remove Circle & Your Account from menu bar",          priority:"P2", status:"open",     project:"Carer",         openedDays:null, assignee:"Mahesh Pawar"   },
  { id:"86d1rmk6b", title:"Carer: Special link for clients with diagnosed patient",     priority:"P2", status:"open",     project:"Carer",         openedDays:null, assignee:"Tripti A"       },
  { id:"86d1gu4ex", title:"Carer: Classification model work cancelled",                 priority:"P3", status:"resolved", project:"Carer",         openedDays:null, assignee:"Indranil Gupta" },
];

// ─── BUG TREND — ⚠️ MANUAL: historical data not in ClickUp ──────────────────
export const BUG_TREND = [
  { week:"W20", opened:0, resolved:0 },
  { week:"W21", opened:0, resolved:0 },
  { week:"W22", opened:0, resolved:0 },
  { week:"W23", opened:0, resolved:0 },
  { week:"W24", opened:8, resolved:1 },
];

// ─── TEAM CAPACITY (real team from workspace) ─────────────────────────────────
export const TEAM_CAPACITY = [
  { team:"Indranil Gupta",        capacity:100, load:145, members:1, blocked:3 },
  { team:"Jeetendra Chandragiri", capacity:100, load:130, members:1, blocked:1 },
  { team:"Caryn Putman",          capacity:100, load:110, members:1, blocked:0 },
  { team:"Mahesh Pawar",          capacity:100, load:90,  members:1, blocked:2 },
  { team:"Jyoti Shid",            capacity:100, load:95,  members:1, blocked:2 },
  { team:"Tripti A",              capacity:100, load:70,  members:1, blocked:0 },
];

// ─── HEALTH MATRIX (MUWCI — primary active project) ──────────────────────────
export const HEALTH_MATRIX = [
  { area:"Timeline",                   status:"red"    },
  { area:"Scope",                      status:"yellow" },
  { area:"Quality / Testing",          status:"red"    },
  { area:"Team Capacity",              status:"red"    },
  { area:"Client / Stakeholder Dep.",  status:"yellow" },
  { area:"Budget / Effort",            status:"green"  },
];

// ─── BLOCKERS (derived from overdue ClickUp tasks) ───────────────────────────
export const BLOCKERS = [
  { id:"86d2zwnt6", title:"MUWCI: APIs & Database Integration overdue",         owner:"Jyoti Shid",            impact:"Blocks frontend integration and UAT",         dueDate:"2026-06-06", daysOpen:13, status:"open",    escalated:true  },
  { id:"86d2zwp0k", title:"MUWCI: Pages & Frontend overdue",                    owner:"Mahesh Pawar",           impact:"Blocks internal testing and release",          dueDate:"2026-06-09", daysOpen:10, status:"open",    escalated:true  },
  { id:"86d2zwnf4", title:"MUWCI: Integration with Design Templates overdue",   owner:"Jyoti / Mahesh",         impact:"Blocks go-live readiness",                    dueDate:"2026-06-16", daysOpen:3,  status:"open",    escalated:false },
  { id:"86d39m820", title:"MUWCI: AI Presentation to Zhooben Sir overdue",      owner:"Amit / Indranil",        impact:"Blocks MUWCI stakeholder alignment",           dueDate:"2026-06-10", daysOpen:9,  status:"open",    escalated:false },
  { id:"86d3cktd7", title:"MovieBeam: Payment outstanding from Ankur",          owner:"Jeetendra / Aurobinda",  impact:"Blocks MovieBeam project continuation",        dueDate:"2026-06-19", daysOpen:0,  status:"open",    escalated:false },
];

// ─── RISKS ────────────────────────────────────────────────────────────────────
export const RISKS = [
  { id:"r1", title:"MUWCI go-live at risk — 4+ dev tasks overdue",          probability:"high",   impact:"high",   owner:"Aurobinda", mitigation:"Escalate to Jyoti & Mahesh; daily standups until delivery" },
  { id:"r2", title:"Team bandwidth — Indranil & Jeet on 5+ projects",       probability:"high",   impact:"high",   owner:"Aurobinda", mitigation:"Prioritise MUWCI; defer Carer & Campus OS tasks"           },
  { id:"r3", title:"VenueSage pitch deck delayed — funding window closing",  probability:"medium", impact:"high",   owner:"Indranil",  mitigation:"Block time this week; Jeet to complete biz plan draft"    },
  { id:"r4", title:"MUWCI staging server still not set up (51 days open)",   probability:"high",   impact:"high",   owner:"Indranil",  mitigation:"Set up server immediately — blocks all testing"           },
  { id:"r5", title:"MovieBeam payment outstanding from client (Ankur)",      probability:"medium", impact:"medium", owner:"Aurobinda", mitigation:"Follow up via Jeetendra today; send formal invoice"        },
];

// ─── DECISIONS PENDING ────────────────────────────────────────────────────────
export const DECISIONS = [
  { id:"86d39m820", title:"AI Presentation to Zhooben Sir — MUWCI stakeholder",    owner:"Amit / Indranil", impact:"Unblocks MUWCI institutional alignment",          pendingSince:9,  escalation:true,  dueDate:"2026-06-09" },
  { id:"86d39jqga", title:"VenueSage Business Plan finalisation & investor pitch",  owner:"Jeet / Indranil", impact:"Required for VenueSage funding round",             pendingSince:2,  escalation:false, dueDate:"2026-06-17" },
  { id:"muwci-scope",title:"MUWCI scope freeze — confirm all pages in scope",       owner:"Aurobinda",       impact:"Prevents further scope creep before go-live",     pendingSince:5,  escalation:false, dueDate:null         },
  { id:"carer-price",title:"Carer pricing structure with Samara Mahindra team",     owner:"Indranil",        impact:"Required before Carer admin dashboard can begin",  pendingSince:30, escalation:true,  dueDate:null         },
  { id:"moviebeam",  title:"MovieBeam: Confirm Ankur payment to proceed",           owner:"Aurobinda / Jeet",impact:"Blocks next phase of MovieBeam delivery",          pendingSince:0,  escalation:false, dueDate:"2026-06-21" },
];

// ─── Integration config — flip OUTLOOK_CONNECTED to true once OAuth is live ───
export const OUTLOOK_CONNECTED = false;
export const PM_EMAIL = "aurobinda@artoftechconsulting.com";

// ─── CUSTOMER / ACCOUNT METRICS — ⚠️ MANUAL: fill real revenue data ─────────
// Client names are real from ClickUp; financial figures need manual entry.
export const CUSTOMER_METRICS = {
  openTickets:     8,
  criticalIssues:  2,
  slaBreaches:     1,
  featureRequests: 12,
  highRiskAccounts:2,
  csat:            null,   // ⚠️ MANUAL
  accounts: [
    { name:"MUWCI (UWC)",      tickets:5, sla:"ok",       risk:"medium", mrr:null },
    { name:"Carer (Samara)",   tickets:1, sla:"ok",       risk:"low",    mrr:null },
    { name:"GDL (Gilani's)",   tickets:1, sla:"ok",       risk:"low",    mrr:null },
    { name:"UFO (Sanjay G.)",  tickets:0, sla:"ok",       risk:"low",    mrr:null },
    { name:"MovieBeam (Ankur)",tickets:1, sla:"breached",  risk:"high",  mrr:null },
  ],
};

// ─── PRODUCT USAGE — Campus OS features (real from ClickUp backlog) ───────────
// ⚠️ MANUAL: adoption % and DAU figures need real analytics data.
export const PRODUCT_USAGE = [
  { feature:"Admission Module",        released:"TBD", adoption:0, target:70, trend:"flat", dau:0 },
  { feature:"School Information Sys.", released:"TBD", adoption:0, target:60, trend:"flat", dau:0 },
  { feature:"Medical Centre",          released:"TBD", adoption:0, target:50, trend:"flat", dau:0 },
  { feature:"Inventory Management",    released:"TBD", adoption:0, target:50, trend:"flat", dau:0 },
  { feature:"Mental Wellbeing",        released:"TBD", adoption:0, target:40, trend:"flat", dau:0 },
  { feature:"Analytics Dashboard",     released:"TBD", adoption:0, target:60, trend:"flat", dau:0 },
];

// ─── BUSINESS METRICS — ⚠️ MANUAL: all figures need manual entry ─────────────
export const BUSINESS_METRICS = {
  arr:         null,
  mrr:         null,
  mrrGrowth:   null,
  churn:       null,
  newCustomers: 1,    // MUWCI signed
  trialToPaid:  null,
  renewalRisk:  2,    // MovieBeam (payment) + GDL (maintenance lapsed)
  nps:          null,
};

// ─── BUDGET — ⚠️ MANUAL: fill actual project budgets ─────────────────────────
export const BUDGET = [
  { team:"MUWCI Project",   planned:null, actual:null },
  { team:"Carer",           planned:null, actual:null },
  { team:"VenueSage",       planned:null, actual:null },
  { team:"UFO Platforms",   planned:null, actual:null },
  { team:"Campus OS",       planned:null, actual:null },
  { team:"AOTC Internal",   planned:null, actual:null },
];
