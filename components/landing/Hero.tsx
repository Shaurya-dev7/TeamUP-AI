"use client";

export default function Hero() {
  return (
    <section
      id="hero"
      className="landing-section"
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        textAlign: "center",
        paddingLeft: "clamp(24px, 4vw, 64px)",
        paddingRight: "clamp(24px, 4vw, 64px)",
      }}
    >
      {/* Background gradient glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(229,165,79,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* 3D Cube */}
      <div
        className="hero-cube"
        style={{
          position: "absolute",
          right: "12%",
          top: "50%",
          transform: "translateY(-50%)",
          opacity: 0.5,
        }}
      >
        <div className="cube-wrapper">
          <div className="cube">
            <div className="cube-face cube-face--front" />
            <div className="cube-face cube-face--back" />
            <div className="cube-face cube-face--right" />
            <div className="cube-face cube-face--left" />
            <div className="cube-face cube-face--top" />
            <div className="cube-face cube-face--bottom" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 2, maxWidth: 900 }}>
        <h1
          className="hero-title"
          style={{
            fontFamily: "var(--font-outfit), sans-serif",
            fontSize: "clamp(36px, 5vw, 64px)",
            fontWeight: 300,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            marginBottom: 24,
          }}
        >
          Where Others Advise,
          <br />
          We Build — <span style={{ color: "var(--landing-accent)" }}>With You</span>
        </h1>

        <p
          className="hero-subtitle"
          style={{
            fontSize: "clamp(16px, 1.5vw, 20px)",
            fontWeight: 300,
            color: "var(--landing-text-muted)",
            maxWidth: 600,
            margin: "0 auto 40px",
            lineHeight: 1.7,
          }}
        >
          At Continuous Ventures, we believe great companies aren&rsquo;t discovered.
          They&rsquo;re deliberately built — with the right insight, the right
          infrastructure, and the right people beside you.
        </p>

        <a href="#contact" className="landing-btn">
          Get in Touch
        </a>
      </div>

      {/* Scroll indicator */}
      <div
        className="hero-scroll-hint"
        style={{
          position: "absolute",
          bottom: 40,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          opacity: 0.4,
        }}
      >
        <span style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Scroll
        </span>
        <div
          style={{
            width: 1,
            height: 40,
            background: "linear-gradient(to bottom, var(--landing-text), transparent)",
          }}
        />
      </div>
    </section>
  );
}
