"use client";

const bullets = [
  "Founders who need more than advice — they need operators, builders, and real momentum",
  "Corporate innovators who want to launch faster than their org charts allow",
  "Partners and investors who don\u2019t just want to fund potential — they want to back progress",
];

export default function Statement() {
  return (
    <section
      id="statement"
      className="landing-section"
      style={{
        paddingLeft: "clamp(24px, 4vw, 64px)",
        paddingRight: "clamp(24px, 4vw, 64px)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "clamp(40px, 6vw, 100px)",
          alignItems: "center",
        }}
      >
        {/* Text side */}
        <div className="statement-content">
          <h2
            className="statement-heading"
            style={{
              fontFamily: "var(--font-outfit), sans-serif",
              fontSize: "clamp(28px, 3vw, 42px)",
              fontWeight: 300,
              lineHeight: 1.2,
              marginBottom: 40,
            }}
          >
            Why You{" "}
            <span style={{ color: "var(--landing-accent)" }}>Matter</span>
          </h2>

          <div
            style={{ display: "flex", flexDirection: "column", gap: 24 }}
          >
            {bullets.map((text, i) => (
              <div
                key={i}
                className="statement-bullet"
                style={{
                  display: "flex",
                  gap: 16,
                  alignItems: "flex-start",
                }}
              >
                <div className="gold-square" />
                <p
                  style={{
                    fontSize: 16,
                    lineHeight: 1.7,
                    fontWeight: 300,
                    color: "var(--landing-text-muted)",
                  }}
                >
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative cube side */}
        <div
          className="statement-visual"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div className="cube-wrapper" style={{ opacity: 0.6 }}>
            <div className="cube" style={{ animationDuration: "14s", animationDirection: "reverse" }}>
              <div className="cube-face cube-face--front" />
              <div className="cube-face cube-face--back" />
              <div className="cube-face cube-face--right" />
              <div className="cube-face cube-face--left" />
              <div className="cube-face cube-face--top" />
              <div className="cube-face cube-face--bottom" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
