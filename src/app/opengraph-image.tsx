import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'CipherMeet — Video Calls That Leave No Trace';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'black',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Subtle radial glow */}
        <div
          style={{
            position: 'absolute',
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
          }}
        />

        {/* Title */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            marginBottom: 24,
          }}
        >
          <span
            style={{
              fontSize: 96,
              fontWeight: 700,
              color: 'white',
              letterSpacing: '-0.05em',
            }}
          >
            CIPHER
          </span>
          <span
            style={{
              fontSize: 96,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.15)',
              letterSpacing: '-0.05em',
            }}
          >
            MEET
          </span>
        </div>

        {/* Tagline */}
        <p
          style={{
            fontSize: 24,
            color: 'rgba(255,255,255,0.4)',
            fontWeight: 300,
            letterSpacing: '0.05em',
            marginBottom: 48,
          }}
        >
          Video calls that leave no trace.
        </p>

        {/* Pills */}
        <div style={{ display: 'flex', gap: 32 }}>
          {['No Accounts', 'No Data Stored', 'No Trace'].map((text) => (
            <div
              key={text}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 1,
                  height: 32,
                  background: 'linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)',
                }}
              />
              <span
                style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.3)',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                }}
              >
                {text}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
