"use client";

const footerLinks = [
  { label: "Home", href: "#hero" },
  { label: "D&I", href: "#features" },
  { label: "Agency", href: "#how-we-work" },
  { label: "News", href: "#partners" },
  { label: "Contact", href: "#contact" },
];

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--landing-border-subtle)",
        padding: "48px clamp(24px, 4vw, 64px)",
        background: "var(--landing-bg)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 24,
        }}
      >
        {/* Links */}
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {footerLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="landing-link"
              style={{
                color: "var(--landing-text-muted)",
                textDecoration: "none",
                fontSize: 13,
                letterSpacing: "0.04em",
              }}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Social icons placeholder */}
        <div style={{ display: "flex", gap: 16 }}>
          {/* Instagram */}
          <a
            href="#"
            aria-label="Instagram"
            className="landing-link"
            style={{
              color: "var(--landing-text-muted)",
              textDecoration: "none",
              fontSize: 18,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <circle cx="12" cy="12" r="5" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
            </svg>
          </a>
          {/* LinkedIn */}
          <a
            href="#"
            aria-label="LinkedIn"
            className="landing-link"
            style={{
              color: "var(--landing-text-muted)",
              textDecoration: "none",
              fontSize: 18,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
              <rect x="2" y="9" width="4" height="12" />
              <circle cx="4" cy="4" r="2" />
            </svg>
          </a>
        </div>

        {/* Copyright */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <p
            style={{
              fontSize: 12,
              color: "var(--landing-text-muted)",
              letterSpacing: "0.04em",
            }}
          >
            &copy; {new Date().getFullYear()} CONTINUOUS VENTURES. All rights reserved.
          </p>
          <p style={{ fontSize: 11, color: "var(--landing-text-muted)" }}>
            Developed by{" "}
            <a
              href="https://granitemena.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--landing-accent)", textDecoration: "none" }}
            >
              Granite MENA
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
