/**
 * Mock data shaped exactly like the real API responses.
 *
 * OUTLOOK  — Microsoft Graph API
 *   Real call: GET https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages
 *              ?$filter=from/emailAddress/address eq '{clientEmail}'
 *              &$orderby=receivedDateTime desc&$top=5
 *   Docs: https://learn.microsoft.com/en-us/graph/api/user-list-messages
 *
 * FIREFLIES — GraphQL API
 *   Real call: POST https://api.fireflies.ai/graphql
 *              { transcripts(title: "{clientName}") { id title date sentences { text speaker_name } action_items { text assignee } } }
 *   Docs: https://docs.fireflies.ai/graphql-api/transcript
 */

// Outlook: recent email threads per client
export const OUTLOOK_THREADS = {
  "Starlight Inc": [
    {
      id: "msg-001",
      subject: "RE: Horizon UX Review — next steps?",
      from: "linda.park@starlightinc.com",
      fromName: "Linda Park",
      receivedAt: "2026-06-09T14:22:00Z",   // 9 days ago
      preview: "Hi, following up on the UX review sign-off. We haven't heard back from your team since the 3rd. Can we get an update this week?",
      sentiment: "frustrated",
      unread: true,
      requiresReply: true,
    },
    {
      id: "msg-002",
      subject: "Horizon milestone — Q2 delivery timeline",
      from: "linda.park@starlightinc.com",
      fromName: "Linda Park",
      receivedAt: "2026-06-03T09:05:00Z",
      preview: "We need to align on the Q2 delivery plan. Please confirm the updated milestone dates.",
      sentiment: "concerned",
      unread: false,
      requiresReply: true,
    },
  ],
  "Yellow Submarine": [
    {
      id: "msg-003",
      subject: "Brand Overhaul — Style Guide feedback",
      from: "tom.reed@yellowsubmarine.com",
      fromName: "Tom Reed",
      receivedAt: "2026-06-14T11:30:00Z",   // 4 days ago
      preview: "The v1 style guide looks good but we have a few comments on the typography section. Let's sync soon.",
      sentiment: "neutral",
      unread: false,
      requiresReply: false,
    },
  ],
};

// Fireflies: meeting transcripts + action items per client
export const FIREFLIES_NOTES = {
  "Starlight Inc": [
    {
      id: "tf-001",
      title: "Horizon Weekly Sync",
      date: "2026-06-05T15:00:00Z",
      durationMins: 45,
      attendees: ["Aurobinda", "Linda Park", "Priya"],
      keyMoments: [
        { speaker: "Linda Park", text: "We're really concerned about the UX review slipping. This was supposed to be done two weeks ago." },
        { speaker: "Aurobinda",  text: "We hit a dependency on the design tokens — Priya is resolving it this sprint." },
        { speaker: "Linda Park", text: "If this isn't resolved by the 14th we may need to revisit the contract timeline." },
      ],
      actionItems: [
        { text: "Priya to unblock design token dependency by June 10",    assignee: "Priya",     done: false },
        { text: "Aurobinda to send updated delivery timeline to Linda",    assignee: "Aurobinda", done: false },
        { text: "Schedule follow-up call for June 12",                    assignee: "Aurobinda", done: false },
      ],
      sentiment: "at-risk",
    },
  ],
  "Yellow Submarine": [
    {
      id: "tf-002",
      title: "Brand Overhaul — Style Guide Review",
      date: "2026-06-12T10:00:00Z",
      durationMins: 30,
      attendees: ["Aurobinda", "Tom Reed"],
      keyMoments: [
        { speaker: "Tom Reed",   text: "The direction is good, but the type scale feels a bit heavy for mobile." },
        { speaker: "Aurobinda",  text: "We can adjust — I'll have Priya revise the scale by Friday." },
      ],
      actionItems: [
        { text: "Priya to revise mobile type scale",    assignee: "Priya",     done: false },
        { text: "Share v2 preview by June 20",          assignee: "Aurobinda", done: false },
      ],
      sentiment: "watch",
    },
  ],
};

// Recommended actions per client (curated, will be AI-generated in production)
export const RECOMMENDATIONS = {
  "Starlight Inc": {
    priority: "urgent",
    summary: "Client is frustrated by communication gaps and milestone slippage. Immediate outreach + concrete dates required.",
    actions: [
      { icon: "✉️", text: "Reply to Linda's June 9th email today with updated UX Review timeline." },
      { icon: "📅", text: "Book a 30-min call this week — do not wait for them to follow up again." },
      { icon: "⚡", text: "Escalate design token blocker to top of Priya's queue (currently task #3)." },
      { icon: "📄", text: "Send a written milestone update covering the next 3 deliverables with dates." },
    ],
  },
  "Yellow Submarine": {
    priority: "watch",
    summary: "Client is engaged but has open feedback. Low risk now, but delays on the type scale revision could escalate.",
    actions: [
      { icon: "🎨", text: "Assign Priya's type scale revision a firm deadline of June 19." },
      { icon: "✉️", text: "Acknowledge Tom's email and share a v2 preview date (June 20 per meeting notes)." },
    ],
  },
};
