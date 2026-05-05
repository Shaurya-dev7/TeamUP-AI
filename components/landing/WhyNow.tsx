"use client";

const quotes = [
  "Startups spend too long pitching, hiring, and hoping.",
  "Corporates are drowning in strategy decks, but nothing ships.",
  "Capital is abundant — but execution is rare.",
];

export default function WhyNow() {
  return (
    <section
      id="why-now"
      className="landing-section"
      style={{
        paddingLeft: "clamp(24px, 4vw, 64px)",
        paddingRight: "clamp(24px, 4vw, 64px)",
      }}
    >
      <div
        className="why-now-content"
        style={{
          maxWidth: 800,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <h2
          className="why-now-heading"
          style={{
            fontFamily: "var(--font-outfit), sans-serif",
            fontSize: "clamp(28px, 3vw, 42px)",
            fontWeight: 300,
            lineHeight: 1.2,
            marginBottom: 56,
          }}
        >
          Why <span style={{ color: "var(--landing-accent)" }}>Now</span>
        </h2>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
            marginBottom: 48,
          }}
        >
          {quotes.map((q, i) => (
            <p
              key={i}
              className="why-now-quote"
              style={{
                fontSize: "clamp(18px, 2vw, 24px)",
                fontWeight: 300,
                fontStyle: "italic",
                color: "var(--landing-text-muted)",
                lineHeight: 1.6,
              }}
            >
              &ldquo;{q}&rdquo;
            </p>
          ))}
        </div>

        <p
          className="why-now-closer"
          style={{
            fontSize: "clamp(24px, 3vw, 36px)",
            fontFamily: "var(--font-outfit), sans-serif",
            fontWeight: 500,
            color: "var(--landing-accent)",
          }}
        >
          We fix that.
        </p>

        <p
          className="why-now-subtext"
          style={{
            marginTop: 24,
            fontSize: 16,
            fontWeight: 300,
            color: "var(--landing-text-muted)",
            lineHeight: 1.7,
            maxWidth: 600,
            margin: "24px auto 0",
          }}
        >
          While others debate market timing and perfect conditions, we&rsquo;re building
          real solutions with real impact. The opportunity cost of waiting has never
          been higher.
        </p>
      </div>
    </section>
  );
}
