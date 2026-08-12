import { INK, GRAY2, ff, mono } from "../brand/tokens.js";
import InvoicesSection from "./InvoicesSection.jsx";
import PipelineSection from "./PipelineSection.jsx";
import MeetingsSection from "./MeetingsSection.jsx";
import ProjectProgressSection from "./ProjectProgressSection.jsx";

export default function CeoView({ addToast, mobile }) {
  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: INK, fontFamily: ff }}>⌂ Command</div>
        <div style={{ fontSize: 12, color: GRAY2, marginTop: 2, fontFamily: mono }}>
          Invoices &amp; payments · team focus · pipeline · meetings — everything in one place
        </div>
      </div>
      <InvoicesSection addToast={addToast} mobile={mobile} />
      <ProjectProgressSection mobile={mobile} />
      <PipelineSection addToast={addToast} mobile={mobile} />
      <MeetingsSection addToast={addToast} mobile={mobile} />
    </div>
  );
}
