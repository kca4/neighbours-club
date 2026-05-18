import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Neighbours Club — your neighbourhood, working together";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0F766E",
          position: "relative",
        }}
      >
        {/* Subtle radial glow */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.10) 0%, transparent 65%)",
          }}
        />

        {/* Warm bottom strip */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 6,
            backgroundColor: "#F59E0B",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
            zIndex: 1,
          }}
        >
          {/* Location pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: 100,
              paddingTop: 8,
              paddingBottom: 8,
              paddingLeft: 24,
              paddingRight: 24,
              marginBottom: 32,
            }}
          >
            <span
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: 22,
                fontFamily: "sans-serif",
                letterSpacing: 4,
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Kanata, Ottawa
            </span>
          </div>

          {/* Main title */}
          <span
            style={{
              color: "#FFFFFF",
              fontSize: 96,
              fontFamily: "serif",
              fontWeight: 700,
              lineHeight: 1.05,
              textAlign: "center",
              letterSpacing: -2,
            }}
          >
            Neighbours Club
          </span>

          {/* Tagline */}
          <span
            style={{
              color: "rgba(255,255,255,0.80)",
              fontSize: 36,
              fontFamily: "sans-serif",
              fontWeight: 400,
              marginTop: 24,
              textAlign: "center",
              letterSpacing: 0.5,
            }}
          >
            your neighbourhood, working together
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
