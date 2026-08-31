// Local-dev-only persona list. Used ONLY when Supabase isn't configured
// (see AccessGate.jsx / supabaseClient.js's SUPABASE_CONFIGURED) — there's
// no real backend to authenticate against in that mode, so AccessGate lets a
// developer click to continue as one of these instead of entering a
// password. This is NOT a security mechanism (no PINs, nothing secret) and
// is never used once Supabase is configured: real sign-in goes through
// Supabase Auth directly, and org membership/role comes from
// `organization_members`, not this file.

export const USERS = [
  {
    id:       "pm1",
    name:     "Aurobinda",
    role:     "pm",
    initials: "AK",
    email:    "aurobinda@artoftechconsulting.com",
    writeAccess: true,
    scopeProjects: null, // PM — sees every space
    projects: null,
  },
  {
    id:        "c1",
    name:      "Indranil",
    role:      "cto",
    initials:  "IG",
    email:     "indranil@artoftechconsulting.com",
    writeAccess: true,
    scopeProjects: ["MUWCI", "AOTC Website", "VenueSage"],
    title:     "CTO · CPO · HR & Finance · Project Owner",
    projects:  ["muwci", "venuesage", "ufobuzz", "aotc-web", "carer", "ufoemotive", "gigspace", "moviebeam"],
    clickupId: 260478634,
  },
  {
    id:        "jc1",
    name:      "Jeetendra",
    role:      "cdo",
    initials:  "JC",
    email:     "jeetendra@artoftechconsulting.com",
    writeAccess: true,
    scopeProjects: ["UFO Aurora", "UFO Emotive", "UFO Buzz", "VenueSage"],
    title:     "Chief Design Officer · Project Owner",
    projects:  ["muwci", "ufoemotive", "ufobuzz", "venuesage", "gigspace", "moviebeam"],
    clickupId: 100901542,
  },
  {
    id:        "d1",
    name:      "Caryn Putman",
    role:      "delivery",
    initials:  "CP",
    email:     "caryn@artoftechconsulting.com",
    writeAccess: true,
    scopeProjects: ["MUWCI", "Carer"],
    title:     "Delivery",
    projects:  null,
  },
  {
    id:        "d2",
    name:      "Mahesh Pawar",
    role:      "delivery",
    initials:  "MP",
    email:     "mahesh@artoftechconsulting.com",
    writeAccess: true,
    scopeProjects: ["MUWCI", "VIBE", "Carer"],
    title:     "Delivery",
    projects:  null,
  },
  {
    id:        "d3",
    name:      "Jyoti Shid",
    role:      "delivery",
    initials:  "JS",
    email:     "jyoti@artoftechconsulting.com",
    writeAccess: true,
    scopeProjects: ["MUWCI"],
    title:     "Delivery",
    projects:  null,
  },
  {
    id:        "d4",
    name:      "Tripti A",
    role:      "delivery",
    initials:  "TA",
    email:     "tripti@artoftechconsulting.com",
    writeAccess: true,
    scopeProjects: ["Carer"],
    title:     "Delivery",
    projects:  null,
  },
  {
    id:       "ceo1",
    name:     "Amit",
    role:     "ceo",
    initials: "AM",
    email:    "amit@artoftech.in",
    projects: null,
  },
  // ── Client accounts (dev persona only — Dr. Mehta/MUWCI is the one real
  // client account; the other fictional demo clients that used to live here
  // were removed along with their fictional projects, see pm_seed.js) ──
  {
    id:       "cl5",
    name:     "Dr. Mehta",
    role:     "client",
    initials: "MW",
    email:    "mehta@muwci.edu",
    company:  "MUWCI",
    projects: ["muwci"],
  },
];

export const ROLE_LABEL = {
  pm:         "PM",
  consultant: "Team",
  ceo:        "CEO",
  cto:        "Leadership",
  cdo:        "Leadership",
  delivery:   "Delivery",
  admin:      "Admin",
  member:     "Team Member",
  analyst:    "Analyst",
  client:     "Client",
};

export const ROLE_DESC_MAP = {
  pm:         "Full access — projects, clients, team & inbox",
  consultant: "Your assigned tasks, projects & updates",
  ceo:        "Command centre — portfolio & financials",
  cto:        "CTO · CPO · HR & Finance · Projects",
  cdo:        "Chief Design Officer · Projects",
  delivery:   "Delivery team — create & manage tasks",
  admin:      "System administration & user management",
  member:     "Team tasks, timesheets & project updates",
  analyst:    "Data, reports & business insights",
  client:     "Read-only access to your project status",
};
