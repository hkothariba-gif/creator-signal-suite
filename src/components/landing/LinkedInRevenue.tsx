const rows = [
  { label: "Identified reviewers", width: "100%", count: "847" },
  { label: "Matched to niche", width: "68%", count: "576" },
  { label: "Brief sent", width: "44%", count: "373" },
  { label: "Replied", width: "28%", count: "237" },
  { label: "Post published", width: "14%", count: "118" },
  { label: "Inbound leads", width: "6%", count: "51" },
];

export function LinkedInRevenue() {
  return (
    <section style={{ background: "#05080F", padding: "80px 0", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="linkedin-rev-grid" style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.12em", color: "#0A66C2", textTransform: "uppercase", marginBottom: "12px" }}>LINKEDIN MONETIZATION</p>
          <h2 style={{ fontSize: "clamp(26px, 3.5vw, 38px)", fontWeight: 800, color: "#F0F4FF", letterSpacing: "-0.02em", marginBottom: "12px" }}>B2B revenue through professional voices</h2>
          <p style={{ fontSize: "15px", color: "#8892A4", lineHeight: 1.6, marginBottom: "24px" }}>Turn LinkedIn Top Voices and industry analysts into your most credible sales channel.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {["4.2x higher B2B conversion", "Director+ audience targeting", "73% open rate on cold briefs", "Ghostwritten or co-authored posts"].map((t) => (
              <span key={t} className="linkedin-stat-pill blue">{t}</span>
            ))}
          </div>
        </div>
        <div className="linkedin-viz-right">
          <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", color: "#8892A4", textTransform: "uppercase", marginBottom: "18px" }}>REVIEWER PIPELINE — LIVE VIEW</p>
          {rows.map((row, i) => (
            <div key={i} className="linkedin-funnel-step">
              <span className="linkedin-funnel-label">{row.label}</span>
              <div className="linkedin-funnel-bar-wrap">
                <div className="linkedin-funnel-bar" style={{ width: row.width }} />
              </div>
              <span className="linkedin-funnel-count">{row.count}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
