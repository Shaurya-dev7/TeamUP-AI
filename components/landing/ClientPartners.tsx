"use client";

const partners = [
  "Digiwell",
  "Passivate",
  "NovaTech",
  "Axiom",
  "Meridian",
  "Stratos",
];

export default function ClientPartners() {
  return (
    <section
      id="partners"
      className="landing-section"
      style={{
        paddingLeft: "clamp(24px, 4vw, 64px)",
        paddingRight: "clamp(24px, 4vw, 64px)",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <h2
          className="partners-heading"
          style={{
            fontFamily: "var(--font-outfit), sans-serif",
            fontSize: "clamp(28px, 3vw, 42px)",
            fontWeight: 300,
            lineHeight: 1.2,
            marginBottom: 64,
            textAlign: "center",
          }}
        >
          Client{" "}
          <span style={{ color: "var(--landing-accent)" }}>Partners</span>
        </h2>

        <div
          className="partners-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
          }}
        >
          {partners.map((name) => (
            <div
              key={name}
              className="landing-card partner-card"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--landing-border-subtle)",
                borderRadius: 12,
                padding: "40px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "default",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-outfit), sans-serif",
                  fontSize: 18,
                  fontWeight: 300,
                  letterSpacing: "0.06em",
                  color: "var(--landing-text-muted)",
                }}
              >
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
