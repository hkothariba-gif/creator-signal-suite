// Funnel stage labels are product chrome. Counts and bar widths come from
// live data only, so the pipeline shows Waiting for API connection until a
// data source is connected.

const stages = [
  "Identified reviewers",
  "Matched to niche",
  "Brief sent",
  "Replied",
  "Post published",
  "Inbound leads",
];

export function LinkedInRevenue() {
  return (
    <section style={{ background: "#05080F", padding: "80px 0", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="linkedin-rev-grid" style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.12em", color: "#0A66C2", textTransform: "uppercase", marginBottom: "12px" }}>LINKEDIN MONETIZATION</p>
          <h2 style={{ fontSize: "clamp(26px, 3.5vw, 38px)", fontWeight: 800, color: "#F0F4FF", letterSpacing: "-0.02em", marginBottom: "12px" }}>B2B revenue through professional voices</h2>
          <p style={{ fontSize: "15px", color: "#8892A4", lineHeight: 1.6, marginBottom: "24px" }}>Work with LinkedIn voices and industry analysts to build a credible sales channel.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {["Director+ audience targeting", "Posts drafted with the creator", "Pipeline influence tracking"].map((t) => (
              <span key={t} className="linkedin-stat-pill blue">{t}</span>
            ))}
          </div>
        </div>
        <div className="linkedin-viz-right">
          <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", color: "#8892A4", textTransform: "uppercase", marginBottom: "18px" }}>REVIEWER PIPELINE</p>
          <div style={{ position: "relative" }}>
            {stages.map((label, i) => (
              <div key={i} className="linkedin-funnel-step">
                <span className="linkedin-funnel-label">{label}</span>
                <div className="linkedin-funnel-bar-wrap" />
              </div>
            ))}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  padding: "8px 16px",
                  borderRadius: "8px",
                  background: "rgba(5,8,15,0.85)",
                  color: "#8892A4",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                Waiting for API connection
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
