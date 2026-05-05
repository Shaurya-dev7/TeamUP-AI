"use client";

import { FormEvent, useState } from "react";

export default function CTA() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section
      id="contact"
      className="landing-section"
      style={{
        background: "var(--landing-bg-elevated)",
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
          alignItems: "start",
        }}
      >
        {/* Left copy */}
        <div className="cta-text">
          <h2
            style={{
              fontFamily: "var(--font-outfit), sans-serif",
              fontSize: "clamp(28px, 3vw, 42px)",
              fontWeight: 300,
              lineHeight: 1.2,
              marginBottom: 24,
            }}
          >
            Ready to Build{" "}
            <span style={{ color: "var(--landing-accent)" }}>Together?</span>
          </h2>
          <p
            style={{
              fontSize: 16,
              fontWeight: 300,
              lineHeight: 1.7,
              color: "var(--landing-text-muted)",
              marginBottom: 24,
            }}
          >
            Whether you&rsquo;re a founder who needs operators, a corporate innovator
            ready to move fast, or an investor looking to back real progress —
            let&rsquo;s start the conversation.
          </p>
          <p
            style={{
              fontSize: 16,
              fontWeight: 300,
              lineHeight: 1.7,
              color: "var(--landing-text-muted)",
            }}
          >
            Fill out the form and we&rsquo;ll connect you with the right team to
            discuss how we can build something impactful together.
          </p>
        </div>

        {/* Right form */}
        <div className="cta-form">
          {submitted ? (
            <div
              style={{
                padding: 48,
                textAlign: "center",
                border: "1px solid var(--landing-border-subtle)",
                borderRadius: 12,
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-outfit), sans-serif",
                  fontSize: 24,
                  fontWeight: 300,
                  color: "var(--landing-accent)",
                  marginBottom: 12,
                }}
              >
                Thank you!
              </p>
              <p style={{ color: "var(--landing-text-muted)", fontSize: 15 }}>
                We&rsquo;ll be in touch soon.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 28,
              }}
            >
              <input
                type="text"
                name="name"
                placeholder="Your Name…"
                className="landing-input"
                required
                autoComplete="name"
              />
              <input
                type="email"
                name="email"
                placeholder="Email Address…"
                className="landing-input"
                required
                autoComplete="email"
              />
              <input
                type="text"
                name="company"
                placeholder="Company / Organization…"
                className="landing-input"
                autoComplete="organization"
              />
              <textarea
                name="message"
                placeholder="Tell us about your project…"
                className="landing-input"
                rows={4}
                style={{ resize: "vertical" }}
              />
              <button type="submit" className="landing-btn landing-btn--filled" style={{ alignSelf: "flex-start" }}>
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
