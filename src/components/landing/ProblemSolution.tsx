const steps = [
  { num: "1", label: "YouTube Channel Email", sub: "Extracted from creator About tab via YouTube Data API", status: "sent", statusText: "Sent 2d ago", active: true },
  { num: "2", label: "Personal Website Form", sub: "Scraped from linked website in channel bio", status: "waiting", statusText: "Awaiting reply", active: true },
  { num: "3", label: "X / Twitter DM", sub: "Matched profile via handle found in YouTube bio", status: "queued", statusText: "Queued in 48h", active: false },
  { num: "4", label: "Discord Community", sub: "Server invite found in YouTube description", status: "queued", statusText: "Queued in 5d", active: false },
  { num: "5", label: "LinkedIn Message", sub: "Professional profile matched by name + niche", status: "queued", statusText: "Queued in 7d", active: false },
  { num: "6", label: "Talent Management Agency", sub: "Flagged as managed talent — agency form auto-filled", status: "queued", statusText: "Queued in 10d", active: false },
];

export function ProblemSolution() {
  return (
    <section style={{ background: "#05080F", padding: "80px 0" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
        <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.12em", color: "#00D97E", marginBottom: "12px", textTransform: "uppercase" }}>HOW WE REACH CREATORS</p>
        <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, color: "#F0F4FF", marginBottom: "12px", letterSpacing: "-0.02em" }}>Every channel. One platform.</h2>
        <p style={{ fontSize: "16px", color: "#8892A4", maxWidth: "500px", margin: "0 auto 48px", lineHeight: "1.5" }}>AspenReach tries every available contact method — in sequence — until your creator replies.</p>

        <div className="outreach-cascade-wrapper" style={{ maxWidth: "700px", margin: "0 auto", textAlign: "left" }}>
          {steps.map((step, i) => (
            <div key={i} className="outreach-step">
              <div className={`outreach-step-dot ${step.active ? "active" : "pending"}`}>{step.num}</div>
              <div className="outreach-step-body">
                <div className="outreach-step-label">{step.label}</div>
                <div className="outreach-step-sub">{step.sub}</div>
                <span className={`outreach-step-status ${step.status}`}>{step.statusText}</span>
              </div>
            </div>
          ))}
          <div style={{ marginTop: "24px", padding: "14px 18px", background: "rgba(0,217,126,0.05)", border: "1px solid rgba(0,217,126,0.15)", borderRadius: "10px", fontSize: "13px", color: "#00D97E", fontWeight: 500 }}>
            ✦ AspenReach achieves 73% reply rate when 3+ channels are attempted within 14 days
          </div>
        </div>
      </div>
    </section>
  );
}
