// Site-wide password gate — hides the entire app (including the login
// screen itself) from anyone who doesn't have this shared password, on top
// of the real per-person Art of Tech sign-in that already exists once
// they're past this gate. This is a "keep strangers off the URL entirely"
// lock, separate from and in addition to the real authentication in
// src/lib/session.js.
//
// Runs on Vercel's Edge Runtime (browser-like globals — btoa/atob work
// here even though this isn't a browser) before any file is served, so it
// covers the HTML, the JS bundle, and every asset in one place. Browsers
// cache the entered password per-site for the session, so a person only
// has to enter it once, not on every page load.
//
// SETUP (one-time, done in the Vercel dashboard, not in code):
//   Project → Settings → Environment Variables → add:
//     GATE_USER = (any username you choose)
//     GATE_PASS = (any password you choose)
//   Apply to Production (and Preview, if you want those covered too), then
//   redeploy. Choose these directly in Vercel — don't tell them to anyone
//   else, including in chat, email, or a doc.
//
// If GATE_USER/GATE_PASS aren't set yet, this deliberately does nothing
// (fails open) rather than locking everyone out of a misconfigured site —
// so the app keeps working exactly as before until you've set both values.

export default function middleware(request) {
  const user = process.env.GATE_USER;
  const pass = process.env.GATE_PASS;
  if (!user || !pass) return; // not configured yet — let the request through

  const expected = "Basic " + btoa(`${user}:${pass}`);
  const provided = request.headers.get("authorization");
  if (provided === expected) return; // correct credentials — let it through

  return new Response("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Pepper"' },
  });
}

export const config = {
  matcher: "/(.*)",
};
