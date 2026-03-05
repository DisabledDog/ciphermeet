'use client';

import { useEffect, useRef, useCallback } from 'react';

interface Star {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  size: number;
  brightness: number;
  maxBrightness: number;
  twinkleSpeed: number;
  twinklePhase: number;
  layer: number;
  hue: number; // color tint
  captured: boolean; // attracted to cursor
}

interface TrailParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
}

interface BurstParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  trail: { x: number; y: number }[];
  brightness: number;
}

interface Nebula {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  hue: number;
  alpha: number;
  phase: number;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

interface InteractiveSkyProps {
  warp?: boolean;
}

export function InteractiveSky({ warp = false }: InteractiveSkyProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const trailRef = useRef<TrailParticle[]>([]);
  const burstsRef = useRef<BurstParticle[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const shootingRef = useRef<ShootingStar[]>([]);
  const nebulaeRef = useRef<Nebula[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, px: 0, py: 0, speed: 0, active: false, down: false });
  const timeRef = useRef(0);
  const rafRef = useRef(0);
  const warpRef = useRef(0);
  const warpTargetRef = useRef(0);
  const holdTimeRef = useRef(0);

  useEffect(() => {
    warpTargetRef.current = warp ? 1 : 0;
  }, [warp]);

  const initStars = useCallback((w: number, h: number) => {
    const rand = seededRandom(42);
    const stars: Star[] = [];
    for (let i = 0; i < 400; i++) {
      const layer = i < 100 ? 1 : i < 250 ? 2 : 3;
      const sizeBase = layer === 1 ? 0.4 : layer === 2 ? 0.9 : 1.5;
      // Varied star colors: most white, some blue, some warm
      const hueRoll = rand();
      const hue = hueRoll < 0.6 ? 220 : hueRoll < 0.8 ? 240 : hueRoll < 0.9 ? 30 : 0;
      stars.push({
        x: rand() * w, y: rand() * h,
        baseX: rand() * w, baseY: rand() * h,
        vx: 0, vy: 0,
        size: sizeBase + rand() * 0.8,
        brightness: rand() * 0.4 + 0.1,
        maxBrightness: rand() * 0.5 + 0.35,
        twinkleSpeed: rand() * 2.5 + 0.8,
        twinklePhase: rand() * Math.PI * 2,
        layer,
        hue,
        captured: false,
      });
    }
    starsRef.current = stars;
  }, []);

  const initNebulae = useCallback((w: number, h: number) => {
    const nebulae: Nebula[] = [];
    for (let i = 0; i < 5; i++) {
      nebulae.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.2,
        size: 200 + Math.random() * 300,
        hue: [220, 260, 280, 200, 310][i],
        alpha: 0.015 + Math.random() * 0.015,
        phase: Math.random() * Math.PI * 2,
      });
    }
    nebulaeRef.current = nebulae;
  }, []);

  const spawnShootingStar = useCallback((w: number, h: number) => {
    const angle = (Math.random() * 30 + 15) * (Math.PI / 180);
    const speed = Math.random() * 10 + 8;
    const fromRight = Math.random() > 0.5;
    shootingRef.current.push({
      x: fromRight ? w * 0.6 + Math.random() * w * 0.4 : Math.random() * w * 0.6,
      y: Math.random() * h * 0.4,
      vx: (fromRight ? -1 : 1) * Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1, maxLife: 1,
      trail: [],
      brightness: 0.7 + Math.random() * 0.3,
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true })!;
    let w = 0, h = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
      ctx.scale(dpr, dpr);
      if (starsRef.current.length === 0) {
        initStars(w, h);
        initNebulae(w, h);
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e: MouseEvent) => {
      const m = mouseRef.current;
      m.px = m.x; m.py = m.y;
      m.x = e.clientX; m.y = e.clientY;
      m.speed = Math.hypot(m.x - m.px, m.y - m.py);
      m.active = true;
    };
    const handleMouseLeave = () => { mouseRef.current.active = false; mouseRef.current.down = false; };
    const handleMouseDown = () => { mouseRef.current.down = true; holdTimeRef.current = 0; };
    const handleMouseUp = () => {
      const m = mouseRef.current;
      m.down = false;
      // If held long enough, release captured stars with a burst
      if (holdTimeRef.current > 0.3) {
        const stars = starsRef.current;
        for (const star of stars) {
          if (star.captured) {
            const angle = Math.atan2(star.y - m.y, star.x - m.x);
            const dist = Math.hypot(star.x - m.x, star.y - m.y);
            const force = Math.max(3, 15 - dist * 0.05);
            star.vx = Math.cos(angle) * force + (Math.random() - 0.5) * 3;
            star.vy = Math.sin(angle) * force + (Math.random() - 0.5) * 3;
            star.captured = false;
          }
        }
        // Ripple on release
        ripplesRef.current.push({
          x: m.x, y: m.y,
          radius: 0, maxRadius: 250 + holdTimeRef.current * 100,
          life: 1,
        });
      }
      holdTimeRef.current = 0;
    };

    const handleClick = (e: MouseEvent) => {
      // Supernova burst
      const count = 50 + Math.floor(Math.random() * 20);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
        const speed = Math.random() * 5 + 1.5;
        const hue = 200 + Math.random() * 80;
        burstsRef.current.push({
          x: e.clientX, y: e.clientY,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          life: 1, maxLife: 1, size: Math.random() * 3.5 + 1,
          color: `hsla(${hue}, 70%, 75%, `,
        });
      }
      // Bright white ring
      for (let i = 0; i < 80; i++) {
        const angle = (Math.PI * 2 * i) / 80;
        const speed = 3.5 + Math.random() * 2.5;
        burstsRef.current.push({
          x: e.clientX, y: e.clientY,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          life: 0.8, maxLife: 0.8, size: 1.2,
          color: 'hsla(0, 0%, 100%, ',
        });
      }
      // Shockwave ripple
      ripplesRef.current.push({
        x: e.clientX, y: e.clientY,
        radius: 0, maxRadius: 200,
        life: 1,
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('click', handleClick);

    let shootingTimer = 0;

    const draw = () => {
      const dt = 1 / 60;
      timeRef.current += dt;
      const t = timeRef.current;
      const m = mouseRef.current;

      // Smooth warp transition
      warpRef.current += (warpTargetRef.current - warpRef.current) * 0.04;
      const warpAmount = warpRef.current;

      // Track hold time
      if (m.down && m.active) holdTimeRef.current += dt;

      ctx.clearRect(0, 0, w, h);

      const mx = m.active ? (m.x / w - 0.5) * 2 : 0;
      const my = m.active ? (m.y / h - 0.5) * 2 : 0;
      const cx = w / 2;
      const cy = h / 2;

      // --- NEBULAE (background gas clouds) ---
      if (warpAmount < 0.5) {
        for (const neb of nebulaeRef.current) {
          neb.x += neb.vx;
          neb.y += neb.vy;
          // Wrap around
          if (neb.x < -neb.size) neb.x = w + neb.size;
          if (neb.x > w + neb.size) neb.x = -neb.size;
          if (neb.y < -neb.size) neb.y = h + neb.size;
          if (neb.y > h + neb.size) neb.y = -neb.size;

          const breathe = 1 + Math.sin(t * 0.3 + neb.phase) * 0.15;
          const s = neb.size * breathe;
          const a = neb.alpha * (1 - warpAmount * 2);

          const grad = ctx.createRadialGradient(neb.x, neb.y, 0, neb.x, neb.y, s);
          grad.addColorStop(0, `hsla(${neb.hue}, 50%, 40%, ${a})`);
          grad.addColorStop(0.4, `hsla(${neb.hue}, 40%, 30%, ${a * 0.5})`);
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.fillRect(neb.x - s, neb.y - s, s * 2, s * 2);
        }
      }

      // Nebula glow under cursor
      if (m.active && warpAmount < 0.5) {
        const intensity = m.down ? 0.08 + holdTimeRef.current * 0.03 : 0.04;
        const size = m.down ? 400 + holdTimeRef.current * 80 : 350;

        const grad1 = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, size);
        grad1.addColorStop(0, `rgba(100, 130, 255, ${intensity})`);
        grad1.addColorStop(0.3, `rgba(80, 60, 200, ${intensity * 0.5})`);
        grad1.addColorStop(1, 'transparent');
        ctx.fillStyle = grad1;
        ctx.fillRect(0, 0, w, h);

        const grad2 = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 120);
        grad2.addColorStop(0, `rgba(255, 255, 255, ${m.down ? 0.1 + holdTimeRef.current * 0.04 : 0.06})`);
        grad2.addColorStop(1, 'transparent');
        ctx.fillStyle = grad2;
        ctx.fillRect(0, 0, w, h);

        // Gravity well visual when holding
        if (m.down && holdTimeRef.current > 0.2) {
          const pullAlpha = Math.min(0.3, holdTimeRef.current * 0.1);
          const rings = 3;
          for (let r = 0; r < rings; r++) {
            const ringRadius = 30 + r * 25 + Math.sin(t * 3 + r) * 8;
            ctx.beginPath();
            ctx.arc(m.x, m.y, ringRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(150, 180, 255, ${pullAlpha * (1 - r / rings)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // --- WARP CENTER GLOW ---
      if (warpAmount > 0.05) {
        const glowSize = warpAmount * 500;
        const centerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowSize);
        centerGlow.addColorStop(0, `rgba(255, 255, 255, ${warpAmount * 0.15})`);
        centerGlow.addColorStop(0.2, `rgba(150, 180, 255, ${warpAmount * 0.08})`);
        centerGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = centerGlow;
        ctx.fillRect(0, 0, w, h);
      }

      // --- STARS ---
      const stars = starsRef.current;
      const attractRadius = m.down ? 200 + holdTimeRef.current * 50 : 0;

      for (const star of stars) {
        const depth = star.layer === 1 ? 0.15 : star.layer === 2 ? 0.4 : 0.8;

        if (warpAmount > 0.05) {
          // WARP: Stars streak outward from center
          const dx = star.baseX - cx;
          const dy = star.baseY - cy;
          const dist = Math.hypot(dx, dy);
          const angle = Math.atan2(dy, dx);

          star.x = star.baseX + Math.cos(angle) * dist * warpAmount * 1.5;
          star.y = star.baseY + Math.sin(angle) * dist * warpAmount * 1.5;

          const streakLen = warpAmount * depth * 50;
          const sx = star.x - Math.cos(angle) * streakLen;
          const sy = star.y - Math.sin(angle) * streakLen;

          const alpha = Math.min(1, star.maxBrightness + warpAmount * 0.5);

          // Colored streaks for variety
          const r = star.hue === 0 ? 255 : star.hue < 60 ? 255 : 200;
          const g = star.hue === 0 ? 255 : star.hue < 60 ? 230 : 220;
          const b = 255;

          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(star.x, star.y);
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.lineWidth = star.size * (0.5 + warpAmount * 0.8);
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.fill();
        } else {
          // NORMAL: mouse parallax + physics
          const targetX = star.baseX + mx * 40 * depth;
          const targetY = star.baseY + my * 40 * depth;

          if (m.active) {
            const dx = star.x - m.x;
            const dy = star.y - m.y;
            const dist = Math.hypot(dx, dy);

            if (m.down && dist < attractRadius) {
              // GRAVITY WELL: attract stars toward cursor
              const force = (1 - dist / attractRadius) * 1.5;
              star.vx -= (dx / dist) * force;
              star.vy -= (dy / dist) * force;
              star.captured = true;
            } else if (!m.down && dist < 150 && dist > 0) {
              // Normal repulsion
              const force = (1 - dist / 150) * 2;
              star.vx += (dx / dist) * force;
              star.vy += (dy / dist) * force;
            }

            // Fast mouse movement flings nearby stars
            if (m.speed > 15 && dist < 100) {
              const flingForce = (m.speed / 100) * (1 - dist / 100) * 0.8;
              star.vx += (m.x - m.px) * flingForce * 0.1;
              star.vy += (m.y - m.py) * flingForce * 0.1;
            }
          }

          // Spring back to base position
          const springForce = star.captured ? 0.005 : 0.02;
          star.vx += (targetX - star.x) * springForce;
          star.vy += (targetY - star.y) * springForce;
          star.vx *= 0.93;
          star.vy *= 0.93;
          star.x += star.vx;
          star.y += star.vy;

          // If not captured and close to base, reset captured flag
          if (star.captured && !m.down) {
            star.captured = false;
          }

          const twinkle = (Math.sin(t * star.twinkleSpeed + star.twinklePhase) + 1) / 2;
          const brightness = star.brightness + twinkle * (star.maxBrightness - star.brightness);

          let proxGlow = 0;
          if (m.active) {
            const dist = Math.hypot(star.x - m.x, star.y - m.y);
            if (dist < 250) proxGlow = (1 - dist / 250) * 0.6;
          }

          // Stars glow brighter when captured
          const capturedBoost = star.captured ? 0.3 : 0;
          const alpha = Math.min(1, brightness + proxGlow + capturedBoost);
          const sz = star.size + proxGlow * 2.5 + capturedBoost * 2;

          // Star color
          const saturation = star.hue === 0 ? 0 : 30 + proxGlow * 40;
          const lightness = 80 + proxGlow * 20;

          // Glow halo for brighter stars
          if (sz > 1.2 || proxGlow > 0.1 || capturedBoost > 0) {
            const glow = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, sz * 4);
            glow.addColorStop(0, `hsla(${star.hue}, ${saturation}%, ${lightness}%, ${alpha * 0.2})`);
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.fillRect(star.x - sz * 4, star.y - sz * 4, sz * 8, sz * 8);
          }

          // Cross-flare for bright stars near cursor
          if (proxGlow > 0.3 && sz > 1.5) {
            const flareLen = sz * 6 * proxGlow;
            ctx.strokeStyle = `rgba(255, 255, 255, ${proxGlow * 0.15})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(star.x - flareLen, star.y);
            ctx.lineTo(star.x + flareLen, star.y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(star.x, star.y - flareLen);
            ctx.lineTo(star.x, star.y + flareLen);
            ctx.stroke();
          }

          ctx.beginPath();
          ctx.arc(star.x, star.y, sz * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = star.hue === 0
            ? `rgba(255, 255, 255, ${alpha})`
            : `hsla(${star.hue}, ${saturation}%, ${lightness}%, ${alpha})`;
          ctx.fill();
        }
      }

      // --- CONNECTION LINES (constellation effect) ---
      if (m.active && warpAmount < 0.3) {
        const nearby = stars.filter((s) => Math.hypot(s.x - m.x, s.y - m.y) < 200);
        // Sort by distance for better constellation look
        nearby.sort((a, b) => Math.hypot(a.x - m.x, a.y - m.y) - Math.hypot(b.x - m.x, b.y - m.y));
        const maxConn = Math.min(nearby.length, 12);

        for (let i = 0; i < maxConn; i++) {
          for (let j = i + 1; j < maxConn; j++) {
            const dist = Math.hypot(nearby[i].x - nearby[j].x, nearby[i].y - nearby[j].y);
            if (dist < 140) {
              const lineAlpha = (1 - dist / 140) * 0.2;
              ctx.beginPath();
              ctx.moveTo(nearby[i].x, nearby[i].y);
              ctx.lineTo(nearby[j].x, nearby[j].y);
              ctx.strokeStyle = `rgba(150, 180, 255, ${lineAlpha})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
          // Line to cursor
          const distC = Math.hypot(nearby[i].x - m.x, nearby[i].y - m.y);
          if (distC < 180) {
            ctx.beginPath();
            ctx.moveTo(nearby[i].x, nearby[i].y);
            ctx.lineTo(m.x, m.y);
            ctx.strokeStyle = `rgba(200, 220, 255, ${(1 - distC / 180) * 0.1})`;
            ctx.lineWidth = 0.3;
            ctx.stroke();
          }
        }
      }

      // --- MOUSE TRAIL ---
      if (m.active && m.speed > 2 && warpAmount < 0.3) {
        const count = Math.min(4, Math.floor(m.speed / 4) + 1);
        for (let i = 0; i < count; i++) {
          const trailHue = (t * 30 + i * 40) % 360; // slowly cycling color
          trailRef.current.push({
            x: m.x + (Math.random() - 0.5) * 10,
            y: m.y + (Math.random() - 0.5) * 10,
            vx: (Math.random() - 0.5) * 1.5 + (m.x - m.px) * 0.1,
            vy: (Math.random() - 0.5) * 1.5 + (m.y - m.py) * 0.1,
            life: 1, maxLife: 1, size: Math.random() * 2.5 + 0.5,
            hue: trailHue,
          });
        }
      }

      for (let i = trailRef.current.length - 1; i >= 0; i--) {
        const p = trailRef.current[i];
        p.life -= dt * 1.3;
        if (p.life <= 0) { trailRef.current.splice(i, 1); continue; }
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.97; p.vy *= 0.97;
        const a = p.life / p.maxLife;
        // Glow
        if (p.size > 1) {
          const tGlow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
          tGlow.addColorStop(0, `hsla(${p.hue}, 50%, 70%, ${a * 0.2})`);
          tGlow.addColorStop(1, 'transparent');
          ctx.fillStyle = tGlow;
          ctx.fillRect(p.x - p.size * 3, p.y - p.size * 3, p.size * 6, p.size * 6);
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * a, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 50%, 80%, ${a * 0.7})`;
        ctx.fill();
      }

      // --- BURST PARTICLES ---
      for (let i = burstsRef.current.length - 1; i >= 0; i--) {
        const p = burstsRef.current[i];
        p.life -= dt * 1.1;
        if (p.life <= 0) { burstsRef.current.splice(i, 1); continue; }
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.97; p.vy *= 0.97;
        p.vy += 0.03; // slight gravity
        const a = p.life / p.maxLife;
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        glow.addColorStop(0, `${p.color}${a * 0.35})`);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(p.x - p.size * 3, p.y - p.size * 3, p.size * 6, p.size * 6);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * a, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${a})`;
        ctx.fill();
      }

      // --- RIPPLES (shockwaves) ---
      for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
        const r = ripplesRef.current[i];
        r.life -= dt * 1.5;
        if (r.life <= 0) { ripplesRef.current.splice(i, 1); continue; }
        r.radius += (r.maxRadius - r.radius) * 0.08;
        const a = r.life * 0.3;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(180, 200, 255, ${a})`;
        ctx.lineWidth = 1.5 * r.life;
        ctx.stroke();
        // Inner ring
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius * 0.7, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${a * 0.3})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Push nearby stars outward from ripple edge
        for (const star of stars) {
          const dist = Math.hypot(star.x - r.x, star.y - r.y);
          if (Math.abs(dist - r.radius) < 30 && dist > 0) {
            const push = (1 - Math.abs(dist - r.radius) / 30) * 1.5 * r.life;
            star.vx += ((star.x - r.x) / dist) * push;
            star.vy += ((star.y - r.y) / dist) * push;
          }
        }
      }

      // --- SHOOTING STARS ---
      if (warpAmount < 0.3) {
        shootingTimer += dt;
        if (shootingTimer > 3 + Math.random() * 4) {
          shootingTimer = 0;
          spawnShootingStar(w, h);
        }
      }

      for (let i = shootingRef.current.length - 1; i >= 0; i--) {
        const ss = shootingRef.current[i];
        ss.life -= dt * 0.6;
        if (ss.life <= 0) { shootingRef.current.splice(i, 1); continue; }
        ss.trail.unshift({ x: ss.x, y: ss.y });
        if (ss.trail.length > 35) ss.trail.pop();
        ss.x += ss.vx; ss.y += ss.vy;

        // Gradient trail
        for (let j = 0; j < ss.trail.length; j++) {
          const tp = ss.trail[j];
          const a = (1 - j / ss.trail.length) * ss.life * ss.brightness;
          const trailSize = (1 - j / ss.trail.length) * 1.5;
          ctx.beginPath();
          ctx.arc(tp.x, tp.y, trailSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${a * 0.8})`;
          ctx.fill();
        }
        // Bright head glow
        const hg = ctx.createRadialGradient(ss.x, ss.y, 0, ss.x, ss.y, 12);
        hg.addColorStop(0, `rgba(255, 255, 255, ${ss.life * ss.brightness * 0.7})`);
        hg.addColorStop(0.5, `rgba(180, 200, 255, ${ss.life * 0.2})`);
        hg.addColorStop(1, 'transparent');
        ctx.fillStyle = hg;
        ctx.fillRect(ss.x - 12, ss.y - 12, 24, 24);
      }

      // --- VIGNETTE ---
      const vig = ctx.createRadialGradient(cx, cy, h * 0.3, cx, cy, h * 0.9);
      vig.addColorStop(0, 'transparent');
      vig.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('click', handleClick);
    };
  }, [initStars, initNebulae, spawnShootingStar]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0"
    />
  );
}
