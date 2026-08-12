import { INK, GRAY2, ff, mono } from "../brand/tokens.js";
import InvoicesSection from "./InvoicesSection.jsx";
import PipelineSection from "./PipelineSection.jsx";
import MeetingsSection from "./MeetingsSection.jsx";
import ProjectProgressSection from "./ProjectProgressSection.jsx";
import NotesSection from "./NotesSection.jsx";

// Everything CeoView has, plus product/project notes & plans. Finance itself
// is covered by the existing Business tab rather than rebuilt here.
export default function ExecutiveView({ addToast, mobile, user }) {
  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: INK, fontFamily: ff }}>⌂ Executive</div>
        <div style={{ fontSize: 12, color: GRAY2, marginTop: 2, fontFamily: mono }}>
          Company-wide view — invoices, pipeline, team focus, meetings, product &amp; project notes. See "Business" for finance/budget.
        </div>
      </div>
      <InvoicesSection addToast={addToast} mobile={mobile} />
      <ProjectProgressSection mobile={mobile} />
      <PipelineSection addToast={addToast} mobile={mobile} />
      <NotesSection addToast={addToast} mobile={mobile} user={user} title="🗒 Product & Project Notes" />
      <MeetingsSection addToast={addToast} mobile={mobile} />
    </div>
  );
}
