"use client";

import { useState, useEffect } from "react";

const cities = [
  { name: "Dubai, UAE", timeZone: "Asia/Dubai" },
  { name: "Dublin, Ireland", timeZone: "Europe/Dublin" },
  { name: "New York, USA", timeZone: "America/New_York" },
];

function CityTime({ timeZone }: { timeZone: string }) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      setTime(
        new Intl.DateTimeFormat("en-US", {
          timeZone,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(new Date())
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [timeZone]);

  return (
    <span
      style={{
        fontFamily: "var(--font-outfit), sans-serif",
        fontSize: "clamp(32px, 4vw, 56px)",
        fontWeight: 200,
        color: "var(--landing-accent)",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {time}
    </span>
  );
}

export default function Locations() {
  return (
    <section
      id="locations"
      className="landing-section"
      style={{
        paddingLeft: "clamp(24px, 4vw, 64px)",
        paddingRight: "clamp(24px, 4vw, 64px)",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <h2
          className="locations-heading"
          style={{
            fontFamily: "var(--font-outfit), sans-serif",
            fontSize: "clamp(28px, 3vw, 42px)",
            fontWeight: 300,
            lineHeight: 1.2,
            marginBottom: 64,
            textAlign: "center",
          }}
        >
          Where We{" "}
          <span style={{ color: "var(--landing-accent)" }}>Are</span>
        </h2>

        <div
          className="locations-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 24,
          }}
        >
          {cities.map((city) => (
            <div
              key={city.name}
              className="location-card"
              style={{
                textAlign: "center",
                padding: "clamp(24px, 3vw, 48px)",
                background: "var(--landing-bg-card)",
                borderRadius: 12,
                border: "1px solid var(--landing-border-subtle)",
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--font-outfit), sans-serif",
                  fontSize: 18,
                  fontWeight: 400,
                  marginBottom: 8,
                }}
              >
                {city.name}
              </h3>
              <p
                style={{
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--landing-text-muted)",
                  marginBottom: 20,
                }}
              >
                Current time
              </p>
              <CityTime timeZone={city.timeZone} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
