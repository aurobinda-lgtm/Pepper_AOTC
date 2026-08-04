// All mock data — mirrors the live Plane / ClickUp model.
// Swap this module for live API calls without touching any component.

export const PROJECTS = [
  { id: "horizon",   name: "Horizon",       company: "aot", client: "Starlight Inc",   health: "red",    progress: 42, week: -3, milestone: "UX Review",        due: "Apr 14", total: 22, done: 9,  overdue: 3, invoiced: 185000, received: 120000, lastContact: 9  },
  { id: "brand",     name: "Brand Overhaul",company: "ys",  client: "Yellow Submarine",health: "yellow", progress: 68, week: +2, milestone: "Style Guide v2",    due: "Apr 21", total: 18, done: 12, overdue: 1, invoiced: 95000,  received: 95000,  lastContact: 4  },
  { id: "forge",     name: "Forge",         company: "aot", client: "Nexus Labs",      health: "green",  progress: 81, week: +5, milestone: "Beta Launch",       due: "May 2",  total: 30, done: 24, overdue: 0, invoiced: 240000, received: 200000, lastContact: 2  },
  { id: "bloom",     name: "Bloom",         company: "ys",  client: "Bloom Co",        health: "green",  progress: 55, week: +1, milestone: "Content Delivery",  due: "May 9",  total: 14, done: 8,  overdue: 0, invoiced: 72000,  received: 72000,  lastContact: 1  },
  { id: "atlas",     name: "Atlas",         company: "aot", client: "Internal",        health: "green",  progress: 90, week: +7, milestone: "Final QA",          due: "Apr 18", total: 10, done: 9,  overdue: 0, invoiced: 0,      received: 0,      lastContact: 0  },
  { id: "muwci",     name: "MUWCI Website", company: "aot", client: "MUWCI",           health: "yellow", progress: 48, week: +2, milestone: "Content & Staging", due: "May 23", total: 18, done: 4,  overdue: 0, invoiced: 0,      received: 0,      lastContact: 3  },
  { id: "venuesage", name: "VenueSage",     company: "aot", client: "VenueSage",       health: "yellow", progress: 30, week: +1, milestone: "Business Plan",     due: "May 17", total: 6,  done: 1,  overdue: 0, invoiced: 0,      received: 0,      lastContact: 7  },
  { id: "ufobuzz",   name: "UFO Buzz",      company: "aot", client: "UFO Buzz",        health: "green",  progress: 60, week: +3, milestone: "Models",            due: "May 14", total: 4,  done: 2,  overdue: 0, invoiced: 0,      received: 0,      lastContact: 5  },
  { id: "aotc-web",  name: "AOTC Website",  company: "aot", client: "Internal",        health: "red",    progress: 15, week: -1, milestone: "Revamp & Migrate",  due: "Jun 7",  total: 5,  done: 1,  overdue: 0, invoiced: 0,      received: 0,      lastContact: 0  },
  { id: "ufoemotive", name: "UFO Emotive",  company: "aot", client: "UFO Emotive", health: "yellow", progress: 25, week: +1, milestone: "Dashboard MVP",    due: "Jul 30", total: 20, done: 2,  overdue: 0, invoiced: 0, received: 0, lastContact: 5  },
  { id: "gigspace",   name: "GigSpace",     company: "aot", client: "GigSpace",    health: "yellow", progress: 20, week: +2, milestone: "Sandbox Setup",    due: "Jun 30", total: 4,  done: 0,  overdue: 2, invoiced: 0, received: 0, lastContact: 10 },
  { id: "moviebeam",  name: "MovieBeam",    company: "aot", client: "MovieBeam",   health: "red",    progress: 10, week: -1, milestone: "Payment Follow-up", due: "Jun 25", total: 2,  done: 0,  overdue: 1, invoiced: 0, received: 0, lastContact: 14 },
  { id: "carer",      name: "Carer",        company: "aot", client: "Carer",       health: "yellow", progress: 30, week: 0,  milestone: "Admin Dashboard",   due: "Jul 15", total: 5,  done: 1,  overdue: 0, invoiced: 0, received: 0, lastContact: 7  },
];

export const TEAM_SEED = [
  { name: "Indranil", projects: ["MUWCI Website", "VenueSage", "UFO Buzz", "AOTC Website"], load: 22 },
  { name: "Rahul",    projects: ["Brand Overhaul", "Bloom"],                                load: 10 },
  { name: "Anya",     projects: ["Forge", "Atlas"],                                         load: 6  },
  { name: "Dev",      projects: ["Bloom", "Atlas"],                                         load: 3  },
  { name: "Jeetendra", projects: ["MUWCI Website", "UFO Emotive", "UFO Buzz", "VenueSage", "GigSpace", "MovieBeam"], load: 15 },
];

export const ATTENTION = [
  { sev: "urgent", text: "Horizon UX Review blocked — awaiting Starlight sign-off",   project: "Horizon",
    nextSteps: ["Ping Starlight contact directly via email with a clear deadline", "Loop in Indranil to escalate internally", "Block time today to follow up if no reply by 3 PM"],
    emailDraft: { to: "contact@starlightinc.com", subject: "Horizon UX Review — Sign-off Required", body: `Hi,\n\nI'm writing to follow up on the Horizon UX Review, which is currently blocked pending your team's sign-off.\n\nWe've been waiting on this for a few days and it's on the critical path for our April 14th milestone. To keep the project on track, we need your sign-off by end of this week.\n\nCould you please:\n1. Review the UX deliverables shared last week\n2. Confirm approval or send any blockers/feedback by Thursday EOD\n\nIf there's anything we can clarify or adjust to speed up the process, we're ready to jump on a call at short notice.\n\nThank you,\nAurobinda\nArt of Tech Consulting` } },
  { sev: "urgent", text: "Brand Overhaul missed Style Guide deadline by 2 days",       project: "Brand Overhaul",
    nextSteps: ["Review what's outstanding on the Style Guide", "Update the project timeline and notify Yellow Submarine", "Assign catch-up tasks to Rahul with a hard deadline"],
    emailDraft: { to: "contact@yellowsubmarine.com", subject: "Brand Overhaul — Style Guide Update & Revised Timeline", body: `Hi,\n\nI wanted to proactively reach out regarding the Style Guide v2 milestone on the Brand Overhaul project.\n\nWe're 2 days past the original delivery date and I want to be transparent about where things stand:\n• The core Style Guide structure is complete\n• We're finalising typography and component documentation\n• Revised delivery: end of this week\n\nI've assigned dedicated time from our team to close this out urgently. You'll have the final document by Friday along with a brief walkthrough.\n\nApologies for the delay — we're on it.\n\nBest,\nAurobinda\nArt of Tech Consulting` } },
  { sev: "soon",   text: "Forge: 3 tasks unassigned heading into beta sprint",         project: "Forge",
    nextSteps: ["Open Forge board and identify the 3 unassigned tasks", "Assign based on Anya's current availability (6 tasks)", "Confirm assignments before sprint kick-off"],
    emailDraft: { to: "anya@artoftech.in", subject: "Forge Beta Sprint — Task Assignments", body: `Hi Anya,\n\nHeading into the Forge beta sprint, there are 3 tasks currently unassigned on the board. Given your current load (6 tasks) I'd like to loop you in before we kick off.\n\nCould you take a look at the Forge board and let me know:\n1. Which of the 3 unassigned tasks you can pick up\n2. If any need to be reassigned or descoped for this sprint\n3. Your bandwidth for the sprint (any conflicts or PTO?)\n\nLet's confirm assignments by tomorrow morning so we start the sprint clean.\n\nThanks,\nAurobinda\nArt of Tech Consulting` } },
];

export const WINS = [
  { icon: "🚀", text: "Forge beta build shipped",        detail: "On time, under budget" },
  { icon: "💰", text: "Bloom Co invoice paid",           detail: "₹72K received — full amount" },
  { icon: "⭐", text: "Nexus Labs gave 5-star feedback", detail: "\"Best onboarding we've had\"" },
  { icon: "📈", text: "Atlas hits 90% completion",       detail: "Final QA next week" },
];

export const CLIENT_REQUESTS = [
  { id: "cr1", client: "Starlight Inc",   project: "Horizon",        requestedBy: "Sarah (Starlight)",  submittedOn: "Jun 25", title: "Add a client-facing progress dashboard",           description: "We'd like a read-only view where we can log in and see the current project progress, milestones, and upcoming tasks without needing to email your team for updates.", priority: "high",   status: "pending" },
  { id: "cr2", client: "Yellow Submarine", project: "Brand Overhaul", requestedBy: "Tom (YS)",          submittedOn: "Jun 26", title: "Revise colour palette across all brand assets",    description: "After internal review, leadership has decided to shift the primary brand colour from navy to forest green. This affects the style guide, all templates, and the 3 social media kits already delivered.", priority: "high",   status: "pending" },
  { id: "cr3", client: "Nexus Labs",       project: "Forge",          requestedBy: "Priya (Nexus)",     submittedOn: "Jun 27", title: "Add CSV export to all data tables in the app",     description: "Our ops team needs to pull data into Excel for weekly reporting. A simple export button on each data table would save them significant manual work each week.", priority: "medium", status: "pending" },
  { id: "cr4", client: "Bloom Co",         project: "Bloom",          requestedBy: "James (Bloom Co)",  submittedOn: "Jun 24", title: "Translate website copy into French",               description: "We're expanding into the Quebec market in Q3. We need all website copy translated into Canadian French, including the homepage, about page, and all product descriptions.", priority: "medium", status: "pending" },
  { id: "cr5", client: "MUWCI",            project: "MUWCI Website",  requestedBy: "Dr. Mehta (MUWCI)", submittedOn: "Jun 23", title: "Integrate an events calendar on the homepage",     description: "We run approximately 40 events per year and need a filterable events calendar embedded on the homepage that our admin staff can update without developer involvement.", priority: "low",    status: "pending" },
];

export const WATCH = [
  { sev: "high",   text: "Starlight last contact 9 days ago — silence risk",    project: "Horizon" },
  { sev: "high",   text: "Rahul at 10 tasks — overloaded this sprint",          project: "Brand Overhaul" },
  { sev: "medium", text: "Bloom content delivery at risk if copy delayed",      project: "Bloom" },
];

export const ACTIONS = [
  { id: 1, title: "Starlight check-in overdue",          body: "No contact in 9 days. Send a status note + share updated timeline.", priority: "urgent",  cat: "client",    project: "Horizon",        assignee: "Aurobinda",
    nextSteps: ["Draft a brief status email with updated project timeline", "Schedule a 15-min check-in call for this week", "If no reply in 24h, escalate to Amit"],
    emailDraft: { to: "contact@starlightinc.com", subject: "Horizon Project — Status Update & Next Steps", body: `Hi,\n\nI wanted to reach out as we haven't connected in a while and I'd like to keep you in the loop on the Horizon project.\n\nHere's where things stand:\n• UX Review milestone is next in queue and awaiting your sign-off\n• Overall progress is at 42% — we're eager to move this forward\n• We have a few items that need your input to unblock the team\n\nCould we schedule a brief 15-minute call this week to align? I'm available most mornings.\n\nPlease let me know a time that works for you.\n\nBest regards,\nAurobinda\nArt of Tech Consulting` } },
  { id: 2, title: "Unblock Horizon UX Review",           body: "Coordinate with Indranil to resolve the sign-off bottleneck.",      priority: "urgent",  cat: "tasks",     project: "Horizon",        assignee: "Aurobinda",
    nextSteps: ["Message Indranil to confirm what's blocking the sign-off", "Set up a 30-min sync with Indranil and Starlight stakeholder", "Document the blocker in the Horizon project tracker"],
    emailDraft: { to: "indranil@artoftechconsulting.com", subject: "Horizon UX Review — Sign-off Bottleneck", body: `Hi Indranil,\n\nThe Horizon UX Review is currently blocked pending Starlight's sign-off. Can we connect today to map out the fastest path to unblocking this?\n\nSpecifically, I'd like to:\n1. Understand what's outstanding on the sign-off checklist\n2. Decide if we need to escalate to Starlight's leadership\n3. Align on a fallback plan if sign-off doesn't arrive by EOD\n\nAre you free for a quick call this afternoon?\n\nThanks,\nAurobinda` } },
  { id: 3, title: "Review Brand Overhaul Style Guide",   body: "Provide feedback before end of day to avoid further slippage.",     priority: "soon",    cat: "tasks",     project: "Brand Overhaul", assignee: "Indranil",
    nextSteps: ["Open the Style Guide doc and review sections 3–5", "Leave inline comments or a consolidated feedback note", "Send feedback to Rahul before 5 PM today"],
    emailDraft: { to: "rahul@artoftech.in", subject: "Brand Overhaul — Style Guide Feedback", body: `Hi Rahul,\n\nI've reviewed the Style Guide v2 and have a few notes to share before we proceed.\n\nKey feedback:\n• Sections 3–5 need tighter alignment with Yellow Submarine's brand voice\n• Typography hierarchy in the component library needs one more review pass\n• The colour palette section is solid — approved as-is\n\nPlease address these before end of week so we can hit the revised timeline. Let me know if you'd like to discuss.\n\nThanks,\nIndranil\nArt of Tech Consulting` } },
  { id: 4, title: "Schedule Forge beta demo",            body: "Nexus Labs requested a live walkthrough next week.",                 priority: "soon",    cat: "meeting",   project: "Forge",          assignee: "Aurobinda",
    nextSteps: ["Check Nexus Labs contact's availability for Mon–Wed next week", "Send a calendar invite with Zoom link and demo agenda", "Confirm Anya is available to support the walkthrough"],
    emailDraft: { to: "contact@nexuslabs.com", subject: "Forge Beta Demo — Scheduling for Next Week", body: `Hi,\n\nThank you for the fantastic feedback on our onboarding — the team was thrilled to hear it!\n\nAs requested, I'd like to schedule a live walkthrough of the Forge beta build next week. The demo will cover:\n• Core feature set and user flows\n• Recent improvements from your feedback\n• Roadmap for the final release\n\nI have availability Monday–Wednesday, 10am–12pm or 3–5pm. Please let me know what works best for your team and I'll send a calendar invite with joining details.\n\nLooking forward to it!\n\nBest,\nAurobinda\nArt of Tech Consulting` } },
  { id: 5, title: "Confirm Bloom Co content timeline",   body: "Follow up with client on the three delayed copy documents.",        priority: "whenever", cat: "client",   project: "Bloom",          assignee: "Indranil",
    nextSteps: ["Email Bloom Co contact listing the three overdue documents", "Request a revised delivery date for each", "Update the Bloom project tracker with the new dates once confirmed"],
    emailDraft: { to: "contact@bloomco.com", subject: "Bloom Co — Content Delivery Timeline", body: `Hi,\n\nI hope you're doing well. I'm following up on the three content documents that were scheduled for delivery last week.\n\nOutstanding items:\n1. Homepage hero copy\n2. Product page descriptions (3 pages)\n3. Email nurture sequence (5 emails)\n\nThese are on the critical path for our Content Delivery milestone on May 9th. Could you share revised delivery dates for each? Even partial drafts would help us keep momentum.\n\nPlease let me know if there's anything we can do to support the process on your end.\n\nThanks,\nIndranil\nArt of Tech Consulting` } },
];

// MY_TASKS — Indranil's tasks are sourced live from ClickUp (clickupId: 260478634).
// Aurobinda's tasks are managed locally.
export const MY_TASKS = [
  // Aurobinda's tasks
  { id: 1,  label: "Send updated SOW to Starlight",               due: "Today",    project: "Horizon",        assignee: "Aurobinda", priority: "high",    status: "in-progress", notes: "Confirm scope changes with client before sending.", tags: ["client", "docs"] },
  { id: 3,  label: "Update Atlas project tracker",                due: "Today",    project: "Atlas",          assignee: "Aurobinda", priority: "medium",  status: "todo",        notes: "", tags: ["admin"] },

  // Indranil's tasks — synced from ClickUp (86d32272v, 86d2zvk20, 86d2zwn9b, etc.)
  { id: 10, label: "Set up live server",                          due: "Apr 25",   project: "MUWCI Website",  assignee: "Indranil",  priority: "high",    status: "overdue",     notes: "ClickUp: 86d32272v · Development list", tags: ["dev", "infra"], clickupId: "86d32272v" },
  { id: 11, label: "Stakeholder Interviews",                      due: "Apr 24",   project: "MUWCI Website",  assignee: "Indranil",  priority: "high",    status: "overdue",     notes: "ClickUp: 86d2zvk20 · with Caryn", tags: ["research"], clickupId: "86d2zvk20" },
  { id: 12, label: "CMS Selection",                               due: "Apr 23",   project: "MUWCI Website",  assignee: "Indranil",  priority: "high",    status: "overdue",     notes: "ClickUp: 86d2zwn9b · Jyoti & Caryn also assigned", tags: ["planning"], clickupId: "86d2zwn9b" },
  { id: 13, label: "Setting up staging server",                   due: "Apr 20",   project: "MUWCI Website",  assignee: "Indranil",  priority: "high",    status: "overdue",     notes: "ClickUp: 86d2zvktf", tags: ["dev", "infra"], clickupId: "86d2zvktf" },
  { id: 14, label: "Understanding Google Analytics",              due: "Apr 20",   project: "MUWCI Website",  assignee: "Indranil",  priority: "medium",  status: "overdue",     notes: "ClickUp: 86d2zvk8h · with Caryn", tags: ["analytics"], clickupId: "86d2zvk8h" },
  { id: 15, label: "Website mapping",                             due: "Apr 20",   project: "MUWCI Website",  assignee: "Indranil",  priority: "medium",  status: "overdue",     notes: "ClickUp: 86d2zvjfg · with Caryn", tags: ["planning"], clickupId: "86d2zvjfg" },
  { id: 16, label: "Get handover from MUWCI",                     due: "Apr 13",   project: "MUWCI Website",  assignee: "Indranil",  priority: "high",    status: "overdue",     notes: "ClickUp: 86d2zwdm6", tags: ["handover"], clickupId: "86d2zwdm6" },
  { id: 17, label: "Content creation",                            due: "Apr 30",   project: "MUWCI Website",  assignee: "Indranil",  priority: "medium",  status: "overdue",     notes: "ClickUp: 86d2zwtkc · with Caryn", tags: ["content"], clickupId: "86d2zwtkc" },
  { id: 18, label: "Feedback from MUWCI",                         due: "May 1",    project: "MUWCI Website",  assignee: "Indranil",  priority: "medium",  status: "overdue",     notes: "ClickUp: 86d2zwtxx · with Caryn", tags: ["feedback"], clickupId: "86d2zwtxx" },
  { id: 19, label: "About MUWCI",                                 due: "May 2",    project: "MUWCI Website",  assignee: "Indranil",  priority: "medium",  status: "overdue",     notes: "ClickUp: 86d2zwmnj · with Caryn", tags: ["content"], clickupId: "86d2zwmnj" },
  { id: 20, label: "Finalise Copy",                               due: "May 2",    project: "MUWCI Website",  assignee: "Indranil",  priority: "high",    status: "overdue",     notes: "ClickUp: 86d2zwua8 · with Caryn", tags: ["content"], clickupId: "86d2zwua8" },
  { id: 21, label: "Learning",                                    due: "May 4",    project: "MUWCI Website",  assignee: "Indranil",  priority: "low",     status: "overdue",     notes: "ClickUp: 86d2zwmqu · with Caryn", tags: ["training"], clickupId: "86d2zwmqu" },
  { id: 22, label: "collect feedback from MUWC",                  due: "May 10",   project: "MUWCI Website",  assignee: "Indranil",  priority: "high",    status: "overdue",     notes: "ClickUp: 86d2zwq79 · with Caryn", tags: ["feedback"], clickupId: "86d2zwq79" },
  { id: 23, label: "AI presentation to Zhooben sir",              due: "May 11",   project: "MUWCI Website",  assignee: "Indranil",  priority: "high",    status: "overdue",     notes: "ClickUp: 86d39m820 · Amit also assigned", tags: ["presentation"], clickupId: "86d39m820" },
  { id: 24, label: "Models",                                      due: "May 14",   project: "UFO Buzz",       assignee: "Indranil",  priority: "medium",  status: "overdue",     notes: "ClickUp: 86d39jt3f", tags: ["design"], clickupId: "86d39jt3f" },
  { id: 25, label: "MUWCI Experience",                            due: "May 16",   project: "MUWCI Website",  assignee: "Indranil",  priority: "medium",  status: "overdue",     notes: "ClickUp: 86d2zwmtn · with Caryn", tags: ["content"], clickupId: "86d2zwmtn" },
  { id: 26, label: "Business plan and Pitch deck",                due: "May 17",   project: "VenueSage",      assignee: "Indranil",  priority: "high",    status: "overdue",     notes: "ClickUp: 86d39jqga · Jeetendra also assigned", tags: ["strategy"], clickupId: "86d39jqga" },
  { id: 27, label: "Visit MUWCI — meet head of transport & campus", due: "May 23", project: "MUWCI Website", assignee: "Indranil",  priority: "high",    status: "overdue",     notes: "ClickUp: 86d39m7ez · Jeetendra also assigned", tags: ["meeting"], clickupId: "86d39m7ez" },
  { id: 28, label: "Parents",                                     due: "May 25",   project: "MUWCI Website",  assignee: "Indranil",  priority: "medium",  status: "overdue",     notes: "ClickUp: 86d2zwmv5 · with Caryn", tags: ["content"], clickupId: "86d2zwmv5" },
  { id: 29, label: "Alumni",                                      due: "Jun 1",    project: "MUWCI Website",  assignee: "Indranil",  priority: "medium",  status: "overdue",     notes: "ClickUp: 86d2zwmuj · with Caryn", tags: ["content"], clickupId: "86d2zwmuj" },
  { id: 30, label: "InternalTesting",                             due: "Jun 6",    project: "MUWCI Website",  assignee: "Indranil",  priority: "high",    status: "overdue",     notes: "ClickUp: 86d2zvhtp · with Caryn", tags: ["qa"], clickupId: "86d2zvhtp" },
  { id: 31, label: "Giving",                                      due: "Jun 8",    project: "MUWCI Website",  assignee: "Indranil",  priority: "medium",  status: "overdue",     notes: "ClickUp: 86d2zwmup · with Caryn", tags: ["content"], clickupId: "86d2zwmup" },

  // Indranil's backlog tasks (from ClickUp)
  { id: 40, label: "AOTC: Revamp website",                        due: "Feb 7",    project: "AOTC Website",   assignee: "Indranil",  priority: "high",    status: "overdue",     notes: "ClickUp: 86d2052xe", tags: ["aotc", "dev"], clickupId: "86d2052xe" },
  { id: 41, label: "AOTC: Review LinkedIn posts",                 due: "Jan 18",   project: "AOTC Website",   assignee: "Indranil",  priority: "medium",  status: "overdue",     notes: "ClickUp: 86d1ud0qa", tags: ["aotc", "content"], clickupId: "86d1ud0qa" },
  { id: 42, label: "AOTC: Complete and migrate to new website",   due: "Jan 18",   project: "AOTC Website",   assignee: "Indranil",  priority: "high",    status: "overdue",     notes: "ClickUp: 86d1uczv7", tags: ["aotc", "dev"], clickupId: "86d1uczv7" },

  // Jeetendra's tasks — synced from ClickUp (ID: 100901542)
  { id: 50, label: "Complete overhaul of infrastructure based on new IA", due: "Apr 25", project: "MUWCI Website", assignee: "Jeetendra", priority: "high",   status: "overdue", notes: "ClickUp: 86d2zvm6h", tags: ["design", "infra"], clickupId: "86d2zvm6h" },
  { id: 51, label: "Design Release",                                       due: "May 11", project: "MUWCI Website", assignee: "Jeetendra", priority: "high",   status: "overdue", notes: "ClickUp: 86d2zwm86", tags: ["design"], clickupId: "86d2zwm86" },
  { id: 52, label: "Design fixes and feedback implementation",             due: "May 14", project: "MUWCI Website", assignee: "Jeetendra", priority: "high",   status: "overdue", notes: "ClickUp: 86d2zwqc0", tags: ["design"], clickupId: "86d2zwqc0" },
  { id: 53, label: "Business plan and Pitch deck",                         due: "May 17", project: "VenueSage",     assignee: "Jeetendra", priority: "high",   status: "overdue", notes: "ClickUp: 86d39jqga", tags: ["strategy"], clickupId: "86d39jqga" },
  { id: 54, label: "Visit MUWCI — meet head of transport & campus",        due: "May 23", project: "MUWCI Website", assignee: "Jeetendra", priority: "high",   status: "overdue", notes: "ClickUp: 86d39m7ez", tags: ["meeting"], clickupId: "86d39m7ez" },
  { id: 55, label: "Reminders for pushing Ankur — MovieBeam payment",      due: "May 25", project: "MovieBeam",     assignee: "Jeetendra", priority: "urgent", status: "overdue", notes: "ClickUp: 86d3cktd7", tags: ["finance", "client"], clickupId: "86d3cktd7" },
  { id: 56, label: "Set up Nylas account with sandbox",                    due: "Jun 30", project: "GigSpace",      assignee: "Jeetendra", priority: "medium", status: "todo",    notes: "ClickUp: 86d1347ct", tags: ["dev"], clickupId: "86d1347ct" },
  { id: 57, label: "Set up Stripe account with sandbox",                   due: "Jun 30", project: "GigSpace",      assignee: "Jeetendra", priority: "medium", status: "todo",    notes: "ClickUp: 86d1347an", tags: ["dev"], clickupId: "86d1347an" },
  // UFO Emotive backlog (20 tasks)
  { id: 60, label: "UFO Emotive: Dashboard",                               due: "Jul 30", project: "UFO Emotive",   assignee: "Jeetendra", priority: "high",   status: "todo",    notes: "ClickUp: 86d1r7kqg", tags: ["design", "product"], clickupId: "86d1r7kqg" },
  { id: 61, label: "UFO Emotive: Data collection",                         due: "Jul 30", project: "UFO Emotive",   assignee: "Jeetendra", priority: "high",   status: "todo",    notes: "ClickUp: 86d1r7ban", tags: ["product"], clickupId: "86d1r7ban" },
  { id: 62, label: "UFO Emotive: Media Player Sync",                       due: "Jul 30", project: "UFO Emotive",   assignee: "Jeetendra", priority: "high",   status: "todo",    notes: "ClickUp: 86d1r7fc9", tags: ["product"], clickupId: "86d1r7fc9" },
  { id: 63, label: "UFO Emotive: Session process",                         due: "Jul 30", project: "UFO Emotive",   assignee: "Jeetendra", priority: "medium", status: "todo",    notes: "ClickUp: 86d1r7dt7", tags: ["product"], clickupId: "86d1r7dt7" },
  { id: 64, label: "UFO Emotive: Store raw data locally",                  due: "Jul 30", project: "UFO Emotive",   assignee: "Jeetendra", priority: "medium", status: "todo",    notes: "ClickUp: 86d1r7k45", tags: ["product"], clickupId: "86d1r7k45" },
  { id: 65, label: "UFO Emotive: Aggregate mood analytics",                due: "Jul 30", project: "UFO Emotive",   assignee: "Jeetendra", priority: "medium", status: "todo",    notes: "ClickUp: 86d1r7uj8", tags: ["product"], clickupId: "86d1r7uj8" },
  { id: 66, label: "UFO Buzz: Interface",                                   due: "Jul 14", project: "UFO Buzz",      assignee: "Jeetendra", priority: "medium", status: "todo",    notes: "ClickUp: 86d1r79g7", tags: ["design"], clickupId: "86d1r79g7" },
  { id: 67, label: "UFO Buzz: Client Dashboard",                            due: "Jul 14", project: "UFO Buzz",      assignee: "Jeetendra", priority: "medium", status: "todo",    notes: "ClickUp: 86d1r796n", tags: ["design"], clickupId: "86d1r796n" },
  { id: 68, label: "UFO Buzz: API Integration",                             due: "Jul 14", project: "UFO Buzz",      assignee: "Jeetendra", priority: "high",   status: "todo",    notes: "ClickUp: 86d1r79xf", tags: ["dev"], clickupId: "86d1r79xf" },
  { id: 69, label: "UFO Buzz: User Signup",                                 due: "Jul 14", project: "UFO Buzz",      assignee: "Jeetendra", priority: "medium", status: "todo",    notes: "ClickUp: 86d1r79tx", tags: ["design"], clickupId: "86d1r79tx" },
];

export const TREND = [
  { w: "W1", tasks: 18, revenue: 0.8 },
  { w: "W2", tasks: 24, revenue: 1.2 },
  { w: "W3", tasks: 19, revenue: 0.9 },
  { w: "W4", tasks: 30, revenue: 1.8 },
  { w: "W5", tasks: 27, revenue: 2.1 },
  { w: "W6", tasks: 35, revenue: 2.6 },
];
