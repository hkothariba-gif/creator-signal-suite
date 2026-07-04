// The cascade describes how outreach works. Step statuses come from live
// campaign data only, so no fabricated statuses are shown here.

const steps = [
  { num: "1", label: "YouTube Channel Email", sub: "Extracted from the creator About tab via the YouTube Data API" },
  { num: "2", label: "Personal Website Form", sub: "Found through the website linked in the channel bio" },
  { num: "3", label: "X / Twitter DM", sub: "Profile matched via the handle found in the YouTube bio" },
  { num: "4", label: "Discord Community", sub: "Server invite found in the YouTube description" },
  { num: "5", label: "LinkedIn Message", sub: "Professional profile matched by name and niche" },
  { num: "6", label: "Talent Management Agency", sub: "For managed talent the agency form is filled for you" },
];

export function ProblemSolution() {
  return (
    <section style={{ background: "#05080F", padding: "80px 0" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
        <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.12em", color: "#00D97E", marginBottom: "12px", textTransform: "uppercase" }}>HOW WE REACH CREATORS</p>
        <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, color: "#F0F4FF", marginBottom: "12px", letterSpacing: "-0.02em" }}>Every channel. One platform.</h2>
        <p style={{ fontSize: "16px", color: "#8892A4", maxWidth: "500px", margin: "0 auto 48px", lineHeight: "1.5" }}>AspenReach tries every available contact method in sequence until your creator replies.</p>

        <div className="outreach-cascade-wrapper" style={{ maxWidth: "700px", margin: "0 auto", textAlign: "left" }}>
          {steps.map((step, i) => (
            <div key={i} className="outreach-step">
              <div className="outreach-step-dot pending">{step.num}</div>
              <div className="outreach-step-body">
                <div className="outreach-step-label">{step.label}</div>
                <div className="outreach-step-sub">{step.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
