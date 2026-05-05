"use client";

const features = [
  {
    title: "Venture Creation",
    description:
      "We don\u2019t just fund ideas — we co-create companies from the ground up. From market validation to MVP development, we\u2019re embedded partners building alongside entrepreneurs who want to move fast and scale smart.",
  },
  {
    title: "Disruptive Services",
    description:
      "Our Disruption & Intelligence team operates as your external innovation arm. We conduct deep market research, build rapid prototypes, and execute go-to-market strategies that traditional consultants only theorize about.",
  },
  {
    title: "Corporate Co-Creation",
    description:
      "For enterprise partners who need to innovate at startup speed, we embed directly within your organization to ship products, launch initiatives, and build new revenue streams — bypassing internal bureaucracy.",
  },
  {
    title: "AI & Infrastructure Layer",
    description:
      "We provide the foundational technology stack and AI capabilities that emerging companies need to compete at scale — from data infrastructure to automated workflows that typically cost millions to develop internally.",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="landing-section"
      style={{
        paddingLeft: "clamp(24px, 4vw, 64px)",
        paddingRight: "clamp(24px, 4vw, 64px)",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <h2
          className="features-heading"
          style={{
            fontFamily: "var(--font-outfit), sans-serif",
            fontSize: "clamp(28px, 3vw, 42px)",
            fontWeight: 300,
            lineHeight: 1.2,
            marginBottom: 64,
            textAlign: "center",
          }}
        >
          What We{" "}
          <span style={{ color: "var(--landing-accent)" }}>Do</span>
        </h2>

        <div
          className="features-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 24,
          }}
        >
          {features.map((feat, i) => (
            <div
              key={i}
              className="landing-card feature-card"
              style={{
                background: "var(--landing-bg-card)",
                borderRadius: 12,
                padding: "clamp(28px, 3vw, 48px)",
                border: "1px solid var(--landing-border-subtle)",
                borderTop: "2px solid var(--landing-accent)",
                cursor: "default",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--landing-accent)",
                  marginBottom: 16,
                }}
              >
                0{i + 1}
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
                {feat.title}
              </h3>

              <p
                style={{
                  fontSize: 15,
                  fontWeight: 300,
                  lineHeight: 1.7,
                  color: "var(--landing-text-muted)",
                }}
              >
                {feat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
