// ── AOTC PM Dashboard — live data pulled from ClickUp ────────────────────────
// Workspace: 90161357960  |  Last sync: 2026-08-04
// Pulled from: Product Development (MUWCI, Campus OS, AOTC Website, VIBE, NAIN),
//              AoTC Development Projects (List, VenueSage), Goals Tracker (List)
// Since the prior sync (2026-06-22):
//   • MUWCI: ~20 tasks were bulk-closed today, incl. the 51-day-old staging-server
//     bug. But the GO LIVE milestone itself is still open and now 21 days past
//     its target date, with APIs/DB Integration (58d) and Pages & Frontend (55d)
//     still blocking.
//   • MovieBeam payment follow-up and the "AI Presentation to Zhooben" decision
//     are both resolved — dropped from risks/decisions.
//   • Jeetendra Chandragiri has picked up a large UFO Emotive backlog (~22 items)
//     plus a new Aurora/Fanfare/Spotlight cinema-app cluster — now the most
//     overloaded person in the workspace.
//   • Two new project spaces exist with real tasks/empty backlog: VIBE and NAIN.
// Financial metrics (ARR, MRR, CSAT, Budget) are not tracked in ClickUp —
// fill those manually in the sections marked ⚠️ MANUAL.

// ─── PROJECTS / FEATURES ──────────────────────────────────────────────────────
export const FEATURES = [
  // MUWCI Website (active — go-live milestone slipped, but a burst of progress today)
  { id:"muwci-api",          name:"APIs & Database Integration",         project:"MUWCI",      status:"delayed",     owner:"Jyoti Shid",              targetDate:"2026-06-07", risk:"58 days overdue",           health:"red",    priority:"P0", blocked:true,  clickupId:"86d2zwnt6" },
  { id:"muwci-pages",        name:"Pages & Frontend",                    project:"MUWCI",      status:"delayed",     owner:"Mahesh Pawar",            targetDate:"2026-06-10", risk:"55 days overdue",           health:"red",    priority:"P0", blocked:true,  clickupId:"86d2zwp0k", category:"design" },
  { id:"muwci-reqs",         name:"Product Requirement",                 project:"MUWCI",      status:"delayed",     owner:"Caryn Putman",            targetDate:"2026-06-04", risk:"61 days overdue",           health:"red",    priority:"P1", blocked:false, clickupId:"86d2zwnnu" },
  { id:"muwci-testing",      name:"Internal Testing",                    project:"MUWCI",      status:"delayed",     owner:"Caryn Putman / Indranil", targetDate:"2026-07-07", risk:"28 days overdue — blocks QA sign-off", health:"red", priority:"P1", blocked:true, clickupId:"86d2zvhtp" },
  { id:"muwci-donation",     name:"Donation Pages",                      project:"MUWCI",      status:"delayed",     owner:"Unassigned",              targetDate:"2026-07-02", risk:"33 days overdue",           health:"red",    priority:"P2", blocked:false, clickupId:"86d2zwnmw" },
  { id:"muwci-feedback",     name:"Feedback from MUWCI",                 project:"MUWCI",      status:"delayed",     owner:"Unassigned",              targetDate:"2026-07-09", risk:"26 days overdue",           health:"yellow", priority:"P2", blocked:false, clickupId:"86d318qr7" },
  { id:"muwci-fixes",        name:"Fixes & Tweaks (MUWCI feedback)",     project:"MUWCI",      status:"delayed",     owner:"Unassigned",              targetDate:"2026-07-13", risk:"22 days overdue",           health:"yellow", priority:"P2", blocked:false, clickupId:"86d318qzz" },
  { id:"muwci-uat",          name:"UAT & Fixes",                         project:"MUWCI",      status:"delayed",     owner:"Unassigned",              targetDate:"2026-07-13", risk:"22 days overdue",           health:"yellow", priority:"P1", blocked:false, clickupId:"86d2zwppm" },
  { id:"muwci-golive",       name:"MUWCI GO LIVE",                       project:"MUWCI",      status:"not_started", owner:"Unassigned",              targetDate:"2026-07-14", risk:"21 days overdue — milestone slipped", health:"red", priority:"P0", blocked:true, clickupId:"86d318r4d" },
  { id:"muwci-dev",          name:"Development",                         project:"MUWCI",      status:"not_started", owner:"Unassigned",              targetDate:null,         risk:"No date set",               health:"yellow", priority:"P2", blocked:false, clickupId:"86d2zvhtb" },
  { id:"muwci-cms",          name:"CMS",                                 project:"MUWCI",      status:"not_started", owner:"Unassigned",              targetDate:null,         risk:"No date set",               health:"yellow", priority:"P2", blocked:false, clickupId:"86d2zvhpr" },
  { id:"muwci-staging",      name:"Staging Server Setup",                project:"MUWCI",      status:"completed",   owner:"Indranil Gupta",          targetDate:"2026-08-04", risk:"",                          health:"green",  priority:"P0", blocked:false, clickupId:"86d2zvktf" },
  { id:"muwci-admissions",   name:"Admissions Page",                     project:"MUWCI",      status:"completed",   owner:"Caryn Putman",            targetDate:"2026-08-04", risk:"",                          health:"green",  priority:"P1", blocked:false, clickupId:"86d2zwmu9" },

  // VenueSage (GigSpace)
  { id:"vs-deploy",          name:"Deploy to Production",                project:"VenueSage",  status:"completed",   owner:"Jeetendra Chandragiri",   targetDate:"2026-06-13", risk:"",                          health:"green",  priority:"P1", blocked:false, clickupId:"86d39jq7f" },
  { id:"vs-bizplan",         name:"Business Plan & Pitch Deck",          project:"VenueSage",  status:"delayed",     owner:"Jeetendra / Indranil",    targetDate:"2026-06-17", risk:"48 days overdue — funding window closing", health:"red", priority:"P0", blocked:false, clickupId:"86d39jqga" },
  { id:"vs-gigspace-spec",   name:"GigSpace Product Spec (51 backlog items)", project:"VenueSage", status:"not_started", owner:"Unassigned",         targetDate:null,         risk:"No owner or dates set on the 51-item feature backlog", health:"yellow", priority:"P2", blocked:false },

  // UFO Buzz
  { id:"ufo-dashboard",      name:"Content Owner Dashboard (Claude)",    project:"UFO Buzz",   status:"completed",   owner:"Jeetendra Chandragiri",   targetDate:"2026-06-13", risk:"",                          health:"green",  priority:"P1", blocked:false, clickupId:"86d39jqz3" },
  { id:"ufo-models",         name:"Models",                              project:"UFO Buzz",   status:"completed",   owner:"Indranil Gupta",          targetDate:"2026-06-14", risk:"",                          health:"green",  priority:"P1", blocked:false, clickupId:"86d39jt3f" },
  { id:"ufo-client-dash",    name:"UFO Buzz Client Dashboard",           project:"UFO Buzz",   status:"completed",   owner:"Jeetendra Chandragiri",   targetDate:null,         risk:"",                          health:"green",  priority:"P2", blocked:false, clickupId:"86d1npg2y" },

  // UFO Emotive
  { id:"ufo-emotive-dash",   name:"Emotive Dashboard (Full Flow)",       project:"UFO Emotive",status:"completed",   owner:"Jeetendra Chandragiri",   targetDate:"2026-06-14", risk:"",                          health:"green",  priority:"P1", blocked:false, clickupId:"86d39jrtj" },
  { id:"ufo-emotive-backlog",name:"Emotive Feature Backlog (22 items)",  project:"UFO Emotive",status:"not_started", owner:"Jeetendra Chandragiri",   targetDate:null,         risk:"22 backlog items, no dates — spec not prioritized", health:"yellow", priority:"P2", blocked:false },

  // UFO / Aurora Cinema Suite (new cluster — not in prior sync)
  { id:"ufo-aurora-cineselect", name:"Cinema Selection Flow (Plexiads → Spotlight)", project:"UFO Aurora", status:"in_progress", owner:"Jeetendra Chandragiri", targetDate:"2026-08-04", risk:"Due today", health:"yellow", priority:"P1", blocked:false, clickupId:"86d3vbqt7" },
  { id:"ufo-aurora-fanfare", name:"Fanfare App Screens",                 project:"UFO Aurora", status:"in_progress", owner:"Jeetendra Chandragiri",   targetDate:"2026-08-04", risk:"Due today",                 health:"yellow", priority:"P1", blocked:false, clickupId:"86d3vbpze", category:"design" },
  { id:"ufo-aurora-sms",     name:"Aurora SMS Integration",              project:"UFO Aurora", status:"not_started", owner:"Jeetendra Chandragiri",   targetDate:null,         risk:"No date set",               health:"yellow", priority:"P2", blocked:false, clickupId:"86d3vc05j" },

  // Carer
  { id:"carer-admin",        name:"Admin Dashboard",                     project:"Carer",      status:"not_started", owner:"Tripti / Indranil / Caryn",targetDate:null,         risk:"Backlog — no date set",   health:"yellow", priority:"P2", blocked:false, clickupId:"86d1qpjt2" },
  { id:"carer-whatsapp",     name:"WhatsApp Integration",                project:"Carer",      status:"not_started", owner:"Tripti A",                targetDate:null,         risk:"Backlog — no date set",   health:"yellow", priority:"P2", blocked:false, clickupId:"86d1qp4pu" },

  // Campus OS
  { id:"campus-features",    name:"Product Feature Backlog (7 modules)", project:"Campus OS",  status:"not_started", owner:"Unassigned",              targetDate:null,         risk:"No owner or dates set",     health:"yellow", priority:"P2", blocked:false },
  { id:"campus-gtm",         name:"GTM Launch (30 tasks)",               project:"Campus OS",  status:"not_started", owner:"Unassigned",              targetDate:null,         risk:"No owner or dates set",     health:"yellow", priority:"P1", blocked:false },

  // AOTC Website
  { id:"aotc-liveserver",    name:"Set Up Live Server",                  project:"AOTC Website", status:"delayed",   owner:"Indranil Gupta",          targetDate:"2026-05-26", risk:"70 days overdue — longest-running open item in the workspace", health:"red", priority:"P0", blocked:false, clickupId:"86d32272v" },

  // VIBE (new project space)
  { id:"vibe-app",           name:"VIBE App Development",                project:"VIBE",       status:"not_started", owner:"Mahesh / Indranil / Caryn / Auro", targetDate:null, risk:"No dates set — early discovery", health:"yellow", priority:"P2", blocked:false, clickupId:"86d3jpytz" },
  { id:"vibe-screens",       name:"Basic Screens for VIBE",              project:"VIBE",       status:"not_started", owner:"Mahesh Pawar",            targetDate:null,         risk:"No date set",               health:"yellow", priority:"P3", blocked:false, clickupId:"86d3jq11d", category:"design" },

  // NAIN (new project space — empty backlog)
  { id:"nain-placeholder",   name:"NAIN — no tasks logged yet",          project:"NAIN",       status:"not_started", owner:"Unassigned",              targetDate:null,         risk:"New space, empty backlog",  health:"yellow", priority:"P3", blocked:false },
];

// ─── CURRENT SPRINT ────────────────────────────────────────────────────────────
export const CURRENT_SPRINT = {
  name: "Active Work — MUWCI Go-Live Recovery & Aurora Deadlines",
  startDate: "2026-07-28",
  endDate:   "2026-08-11",
  velocity:  null,
  items: [
    { id:"86d318r4d", title:"MUWCI: GO LIVE",                                points:null, status:"blocked",     assignee:"Unassigned",         blocked:true  },
    { id:"86d2zwnt6", title:"MUWCI: APIs & Database Integration",            points:null, status:"blocked",     assignee:"Jyoti",              blocked:true  },
    { id:"86d2zwp0k", title:"MUWCI: Pages & Frontend",                       points:null, status:"blocked",     assignee:"Mahesh",             blocked:true  },
    { id:"86d2zvhtp", title:"MUWCI: Internal Testing",                       points:null, status:"blocked",     assignee:"Caryn / Indranil",   blocked:true  },
    { id:"86d2zwnnu", title:"MUWCI: Product Requirement",                    points:null, status:"todo",        assignee:"Caryn",              blocked:false },
    { id:"86d2zwppm", title:"MUWCI: UAT & Fixes",                            points:null, status:"todo",        assignee:"Unassigned",         blocked:false },
    { id:"86d318qzz", title:"MUWCI: Fixes & Tweaks",                         points:null, status:"todo",        assignee:"Unassigned",         blocked:false },
    { id:"86d318qr7", title:"MUWCI: Feedback from MUWCI",                    points:null, status:"todo",        assignee:"Unassigned",         blocked:false },
    { id:"86d2zwnmw", title:"MUWCI: Donation Pages",                         points:null, status:"todo",        assignee:"Unassigned",         blocked:false },
    { id:"86d39jqga", title:"VenueSage: Business Plan & Pitch Deck",         points:null, status:"todo",        assignee:"Jeet / Indranil",    blocked:false },
    { id:"86d32272v", title:"AOTC Website: Set Up Live Server",              points:null, status:"todo",        assignee:"Indranil",           blocked:false },
    { id:"86d3vbqt7", title:"UFO Aurora: Cinema Selection Flow",             points:null, status:"todo",        assignee:"Jeetendra",          blocked:false },
    { id:"86d3vbpze", title:"UFO Aurora: Fanfare App Screens",               points:null, status:"todo",        assignee:"Jeetendra",          blocked:false },
    { id:"86d3ff0j3", title:"Campus OS: Demo of Complete Product",           points:null, status:"todo",        assignee:"Indranil",           blocked:false },
  ],
};

// ─── RELEASES ──────────────────────────────────────────────────────────────────
export const RELEASES = [
  {
    id: "muwci-uat", project: "MUWCI", version: "MUWCI v1.0 — UAT Release", goLive: "2026-07-08",
    readiness: 65, qaStatus: "not_started", criticalBugs: 0,
    uat: "not_started", rollback: false, status: "yellow",
    features: ["Admissions Page", "Parents Page", "Alumni Page", "Giving & Donations", "MUWCI Experience", "Integration with Design Templates"],
    deployChecklist: { infraReady:true, featureFlags:false, dbMigration:true, rollbackScript:false, monitoringAlerts:false },
  },
  {
    id: "muwci-live", project: "MUWCI", version: "MUWCI v1.0 — GO LIVE", goLive: "2026-07-14",
    readiness: 45, qaStatus: "not_started", criticalBugs: 0,
    uat: "not_started", rollback: false, status: "red",
    features: ["Full MUWCI Website", "Content Calendar", "Donation Pages", "Internal Testing Complete"],
    deployChecklist: { infraReady:true, featureFlags:false, dbMigration:true, rollbackScript:false, monitoringAlerts:false },
  },
];

// ─── BUGS (real backlog / open items from ClickUp) ────────────────────────────
export const BUGS = [
  { id:"86d32272v", title:"AOTC Website: Live server not set up",                           priority:"P0", status:"open",     project:"AOTC Website",  openedDays:70,  assignee:"Indranil Gupta"   },
  { id:"86d1rnh61", title:"Carer: Start quiz should route to Profile.carer.com",             priority:"P1", status:"open",     project:"Carer",         openedDays:null, assignee:"Mahesh Pawar"   },
  { id:"86d1rngkh", title:"Carer: Cookies not being set",                                    priority:"P1", status:"open",     project:"Carer",         openedDays:null, assignee:"Mahesh Pawar"   },
  { id:"86d1rndk2", title:"Carer: Profile — plan type mismatch not handled",                 priority:"P1", status:"open",     project:"Carer",         openedDays:null, assignee:"Mahesh Pawar"   },
  { id:"86d1rnfk1", title:"Carer: Remove Circle & Your Account from menu bar",               priority:"P2", status:"open",     project:"Carer",         openedDays:null, assignee:"Mahesh Pawar"   },
  { id:"86d1rmk6b", title:"Carer: Special link for clients with diagnosed patient",          priority:"P2", status:"open",     project:"Carer",         openedDays:null, assignee:"Tripti A"       },
  { id:"86d2zvktf", title:"MUWCI: Staging server not set up",                                priority:"P0", status:"resolved", project:"MUWCI",         openedDays:null, assignee:"Indranil Gupta" },
  { id:"86d1gu4ex", title:"Carer: Classification model work cancelled",                      priority:"P3", status:"cancelled",project:"Carer",         openedDays:null, assignee:"Indranil Gupta" },
];

// ─── BUG TREND — ⚠️ MANUAL: historical data not in ClickUp ──────────────────
export const BUG_TREND = [
  { week:"W20", opened:0, resolved:0 },
  { week:"W21", opened:0, resolved:0 },
  { week:"W22", opened:0, resolved:0 },
  { week:"W23", opened:0, resolved:0 },
  { week:"W24", opened:8, resolved:1 },
];

// ─── TEAM CAPACITY (derived from open ClickUp task counts per assignee) ───────
export const TEAM_CAPACITY = [
  { team:"Jeetendra Chandragiri", capacity:100, load:190, members:1, blocked:0 },
  { team:"Indranil Gupta",        capacity:100, load:120, members:1, blocked:2 },
  { team:"Mahesh Pawar",          capacity:100, load:80,  members:1, blocked:1 },
  { team:"Caryn Putman",          capacity:100, load:70,  members:1, blocked:0 },
  { team:"Tripti A",              capacity:100, load:60,  members:1, blocked:0 },
  { team:"Jyoti Shid",            capacity:100, load:40,  members:1, blocked:1 },
];

// ─── HEALTH MATRIX (MUWCI — primary active project) ──────────────────────────
export const HEALTH_MATRIX = [
  { area:"Timeline",                   status:"red"    },
  { area:"Scope",                      status:"yellow" },
  { area:"Quality / Testing",          status:"red"    },
  { area:"Team Capacity",              status:"red"    },
  { area:"Client / Stakeholder Dep.",  status:"green"  },
  { area:"Budget / Effort",            status:"green"  },
];

// ─── BLOCKERS (derived from overdue ClickUp tasks) ───────────────────────────
// `project`: null = company-wide, visible to PM only; otherwise scoped to that space.
export const BLOCKERS = [
  { id:"86d2zwnt6", project:"MUWCI",      title:"MUWCI: APIs & Database Integration overdue",         owner:"Jyoti Shid",            impact:"Blocks frontend integration and UAT",          dueDate:"2026-06-07", daysOpen:58, status:"open",    escalated:true  },
  { id:"86d2zwp0k", project:"MUWCI",      title:"MUWCI: Pages & Frontend overdue",                    owner:"Mahesh Pawar",           impact:"Blocks internal testing and release",          dueDate:"2026-06-10", daysOpen:55, status:"open",    escalated:true  },
  { id:"86d2zvhtp", project:"MUWCI",      title:"MUWCI: Internal Testing overdue",                    owner:"Caryn / Indranil",       impact:"Blocks QA sign-off before go-live",             dueDate:"2026-07-07", daysOpen:28, status:"open",    escalated:true  },
  { id:"86d318r4d", project:"MUWCI",      title:"MUWCI: GO LIVE milestone overdue",                   owner:"Unassigned",             impact:"Blocks full MUWCI launch",                      dueDate:"2026-07-14", daysOpen:21, status:"open",    escalated:true  },
  { id:"86d32272v", project:"AOTC Website", title:"AOTC Website: Live server still not set up",       owner:"Indranil Gupta",         impact:"Longest-running open item — blocks AOTC's own website work", dueDate:"2026-05-26", daysOpen:70, status:"open", escalated:true },
  { id:"86d39jqga", project:"VenueSage",  title:"VenueSage: Business Plan & Pitch Deck overdue",      owner:"Jeetendra / Indranil",   impact:"Blocks VenueSage funding round",                dueDate:"2026-06-17", daysOpen:48, status:"open",    escalated:false },
];

// ─── RISKS ────────────────────────────────────────────────────────────────────
export const RISKS = [
  { id:"r1", project:"MUWCI",     title:"MUWCI go-live 21 days past deadline despite today's progress burst",  probability:"high",   impact:"high",   owner:"Aurobinda", mitigation:"Force a hard cutover date with Jyoti & Mahesh this week; descope anything not done by Aug 11" },
  { id:"r2", project:null,        title:"Jeetendra Chandragiri overloaded — ~35+ open items across UFO Emotive backlog, Aurora/Fanfare/Spotlight builds, VenueSage deck, and invoices", probability:"high", impact:"high", owner:"Aurobinda", mitigation:"Triage the UFO Emotive backlog (defer/kill undated items); bring a second engineer onto Aurora/Fanfare" },
  { id:"r3", project:"VenueSage", title:"VenueSage pitch deck 48 days overdue — funding window closing",       probability:"high",   impact:"high",   owner:"Indranil",  mitigation:"Block time this week; ship a v1 deck even if incomplete" },
  { id:"r4", project:"AOTC Website", title:"AOTC's own website live server unset for 70 days — longest-standing open item workspace-wide", probability:"medium", impact:"medium", owner:"Indranil", mitigation:"Assign a hard date this week; escalate to Aurobinda if blocked on a hosting decision" },
  { id:"r5", project:"Carer",     title:"Carer pricing structure with Samara Mahindra team still undecided — blocks admin dashboard & WhatsApp work", probability:"medium", impact:"medium", owner:"Indranil", mitigation:"Set a decision deadline with Samara's team this week" },
];

// ─── DECISIONS PENDING ────────────────────────────────────────────────────────
export const DECISIONS = [
  { id:"muwci-scope",  project:"MUWCI",       title:"MUWCI scope freeze — confirm Donation Pages, Development & CMS are final before go-live", owner:"Aurobinda", impact:"Prevents further scope creep now that go-live is already late", pendingSince:45, escalation:true,  dueDate:null },
  { id:"carer-price",  project:"Carer",       title:"Carer pricing structure with Samara Mahindra team",                   owner:"Indranil",        impact:"Required before Carer admin dashboard & WhatsApp integration can begin", pendingSince:65, escalation:true,  dueDate:null },
  { id:"86d39jqga",    project:"VenueSage",   title:"VenueSage Business Plan finalisation & investor pitch",                owner:"Jeet / Indranil", impact:"Required for VenueSage funding round",             pendingSince:48, escalation:true,  dueDate:"2026-06-17" },
  { id:"aotc-liveserver", project:"AOTC Website", title:"AOTC Website: decide on hosting for the live server",               owner:"Indranil",        impact:"Blocked 70 days — needs a hosting decision to move",  pendingSince:70, escalation:true,  dueDate:"2026-05-26" },
];

// ─── Integration config — flip OUTLOOK_CONNECTED to true once OAuth is live ───
export const OUTLOOK_CONNECTED = false;
export const PM_EMAIL = "aurobinda@artoftechconsulting.com";

// ─── CUSTOMER / ACCOUNT METRICS — ⚠️ MANUAL: fill real revenue data ─────────
// Client names are real from ClickUp; financial figures need manual entry.
export const CUSTOMER_METRICS = {
  openTickets:     7,
  criticalIssues:  1,
  slaBreaches:     0,
  featureRequests: 12,
  highRiskAccounts:1,
  csat:            null,   // ⚠️ MANUAL
  accounts: [
    { name:"MUWCI (UWC)",      tickets:5, sla:"ok",       risk:"medium", mrr:null },
    { name:"Carer (Samara)",   tickets:1, sla:"ok",       risk:"low",    mrr:null },
    { name:"GDL (Gilani's)",   tickets:1, sla:"ok",       risk:"low",    mrr:null },
    { name:"UFO (Sanjay G.)",  tickets:0, sla:"ok",       risk:"low",    mrr:null },
    { name:"MovieBeam (Ankur)",tickets:0, sla:"ok",       risk:"low",    mrr:null },
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
  renewalRisk:  1,    // GDL (maintenance lapsed) — MovieBeam payment resolved
  nps:          null,
};

// ─── BUDGET — ⚠️ MANUAL: fill actual project budgets ─────────────────────────
export const BUDGET = [
  { team:"MUWCI Project",   planned:null, actual:null },
  { team:"Carer",           planned:null, actual:null },
  { team:"VenueSage",       planned:null, actual:null },
  { team:"UFO Platforms",   planned:null, actual:null },
  { team:"Campus OS",       planned:null, actual:null },
  { team:"VIBE",            planned:null, actual:null },
  { team:"AOTC Internal",   planned:null, actual:null },
];
