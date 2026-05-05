"use client";

const steps = [
  {
    number: "01",
    title: "Embed",
    description:
      "We don\u2019t advise from the sidelines. Our team integrates directly into your operations, working alongside your people to build, ship, and scale solutions in real-time.",
  },
  {
    number: "02",
    title: "Validate",
    description:
      "Every decision is backed by data, market feedback, and rapid iteration. We test assumptions quickly, learn fast, and pivot when necessary — keeping momentum without burning resources.",
  },
  {
    number: "03",
    title: "Align",
    description:
      "Success requires synchronized execution across all stakeholders. We ensure every team member, investor, and partner is working toward the same measurable outcomes.",
  },
];

export default function HowWeWork() {
  return (
    <section
      id="how-we-work"
      className="landing-section"
      style={{
        paddingLeft: "clamp(24px, 4vw, 64px)",
        paddingRight: "clamp(24px, 4vw, 64px)",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <h2
          className="how-heading"
          style={{
            fontFamily: "var(--font-outfit), sans-serif",
            fontSize: "clamp(28px, 3vw, 42px)",
            fontWeight: 300,
            lineHeight: 1.2,
            marginBottom: 64,
            textAlign: "center",
          }}
        >
          How We{" "}
          <span style={{ color: "var(--landing-accent)" }}>Work</span>
        </h2>

        <div
          className="how-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 24,
          }}
        >
          {steps.map((step) => (
            <div
              key={step.number}
              className="landing-card how-step"
              style={{
                background: "var(--landing-bg-card)",
                borderRadius: 12,
                padding: "clamp(28px, 3vw, 48px)",
                border: "1px solid var(--landing-border-subtle)",
                position: "relative",
                cursor: "default",
              }}
            >
              <span
                style={{
                  display: "block",
                  fontFamily: "var(--font-outfit), sans-serif",
                  fontSize: 48,
                  fontWeight: 200,
                  color: "var(--landing-accent)",
                  opacity: 0.3,
                  lineHeight: 1,
                  marginBottom: 20,
                }}
              >
                {step.number}
              </span>

              <h3
                style={{
                  fontFamily: "var(--font-outfit), sans-serif",
                  fontSize: "clamp(20px, 2vw, 26px)",
                  fontWeight: 400,
                  marginBottom: 16,
                  lineHeight: 1.3,
                }}
              >
                {step.title}
              </h3>

              <p
                style={{
                  fontSize: 15,
                  fontWeight: 300,
                  lineHeight: 1.7,
                  color: "var(--landing-text-muted)",
                }}
              >
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <p
          className="how-footnote"
          style={{
            textAlign: "center",
            marginTop: 48,
            fontSize: 16,
            fontWeight: 300,
            color: "var(--landing-text-muted)",
            lineHeight: 1.7,
            maxWidth: 700,
            margin: "48px auto 0",
          }}
        >
          We build regionally, think globally — with teams across North America,
          Europe, and emerging markets to ensure your solutions work everywhere
          they need to.
        </p>
      </div>
    </section>
  );
}
