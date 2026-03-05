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
  layer: number; // 1-3 for parallax
}

interface TrailParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
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

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  trail: { x: number; y: number }[];
}

// Seeded random for deterministic star placement
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

export function InteractiveSky() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const trailRef = useRef<TrailParticle[]>([]);
  const burstsRef = useRef<BurstParticle[]>([]);
  const shootingRef = useRef<ShootingStar[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, px: 0, py: 0, speed: 0, active: false });
  const timeRef = useRef(0);
  const rafRef = useRef(0);

  const initStars = useCallback((w: number, h: number) => {
    const rand = seededRandom(42);
    const stars: Star[] = [];

    for (let i = 0; i < 300; i++) {
      const layer = i < 80 ? 1 : i < 180 ? 2 : 3;
      const sizeBase = layer === 1 ? 0.5 : layer === 2 ? 1 : 1.5;

      stars.push({
        x: rand() * w,
        y: rand() * h,
        baseX: rand() * w,
        baseY: rand() * h,
        vx: 0,
        vy: 0,
        size: sizeBase + rand() * 0.8,
        brightness: rand() * 0.5 + 0.1,
        maxBrightness: rand() * 0.5 + 0.3,
        twinkleSpeed: rand() * 2 + 1,
        twinklePhase: rand() * Math.PI * 2,
        layer,
      });
    }

    starsRef.current = stars;
  }, []);

  const spawnShootingStar = useCallback((w: number, h: number) => {
    const angle = (Math.random() * 30 + 15) * (Math.PI / 180);
    const speed = Math.random() * 8 + 6;
    shootingRef.current.push({
      x: Math.random() * w * 0.8,
      y: Math.random() * h * 0.3,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: 1,
      trail: [],
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true })!;
    let w = 0;
    let h = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.scale(dpr, dpr);

      if (starsRef.current.length === 0) {
        initStars(w, h);
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e: MouseEvent) => {
      const m = mouseRef.current;
      m.px = m.x;
      m.py = m.y;
      m.x = e.clientX;
      m.y = e.clientY;
      m.speed = Math.hypot(m.x - m.px, m.y - m.py);
      m.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    const handleClick = (e: MouseEvent) => {
      // Supernova burst
      const count = 40 + Math.floor(Math.random() * 20);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
        const speed = Math.random() * 4 + 1;
        const hue = Math.random() > 0.5 ? 220 : 260;
        burstsRef.current.push({
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          maxLife: 1,
          size: Math.random() * 3 + 1,
          color: `hsla(${hue}, 60%, 70%, `,
        });
      }
      // Ring wave
      for (let i = 0; i < 60; i++) {
        const angle = (Math.PI * 2 * i) / 60;
        const speed = 3 + Math.random() * 2;
        burstsRef.current.push({
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.7,
          maxLife: 0.7,
          size: 1,
          color: 'hsla(0, 0%, 100%, ',
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('click', handleClick);

    // Shooting star timer
    let shootingTimer = 0;

    const draw = () => {
      const dt = 1 / 60;
      timeRef.current += dt;
      const t = timeRef.current;
      const m = mouseRef.current;

      ctx.clearRect(0, 0, w, h);

      // Normalized mouse position (-1 to 1)
      const mx = m.active ? (m.x / w - 0.5) * 2 : 0;
      const my = m.active ? (m.y / h - 0.5) * 2 : 0;

      // --- NEBULA GLOW under cursor ---
      if (m.active) {
        const grad1 = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 350);
        grad1.addColorStop(0, 'rgba(100, 130, 255, 0.04)');
        grad1.addColorStop(0.3, 'rgba(80, 60, 200, 0.02)');
        grad1.addColorStop(1, 'transparent');
        ctx.fillStyle = grad1;
        ctx.fillRect(0, 0, w, h);

        const grad2 = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 120);
        grad2.addColorStop(0, 'rgba(255, 255, 255, 0.06)');
        grad2.addColorStop(1, 'transparent');
        ctx.fillStyle = grad2;
        ctx.fillRect(0, 0, w, h);
      }

      // --- STARS ---
      const stars = starsRef.current;

      for (const star of stars) {
        // Parallax shift based on mouse
        const depth = star.layer === 1 ? 0.15 : star.layer === 2 ? 0.4 : 0.8;
        const targetX = star.baseX + mx * 40 * depth;
        const targetY = star.baseY + my * 40 * depth;

        // Mouse repulsion
        if (m.active) {
          const dx = star.x - m.x;
          const dy = star.y - m.y;
          const dist = Math.hypot(dx, dy);
          const repulseRadius = 150;

          if (dist < repulseRadius && dist > 0) {
            const force = (1 - dist / repulseRadius) * 2;
            star.vx += (dx / dist) * force;
            star.vy += (dy / dist) * force;
          }
        }

        // Spring back to position + parallax target
        star.vx += (targetX - star.x) * 0.02;
        star.vy += (targetY - star.y) * 0.02;

        // Damping
        star.vx *= 0.92;
        star.vy *= 0.92;

        star.x += star.vx;
        star.y += star.vy;

        // Twinkle
        const twinkle = (Math.sin(t * star.twinkleSpeed + star.twinklePhase) + 1) / 2;
        const brightness = star.brightness + twinkle * (star.maxBrightness - star.brightness);

        // Mouse proximity glow
        let proxGlow = 0;
        if (m.active) {
          const dist = Math.hypot(star.x - m.x, star.y - m.y);
          if (dist < 200) {
            proxGlow = (1 - dist / 200) * 0.5;
          }
        }

        const alpha = Math.min(1, brightness + proxGlow);
        const sz = star.size + proxGlow * 2;

        // Draw glow
        if (sz > 1.2 || proxGlow > 0.1) {
          const glow = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, sz * 4);
          glow.addColorStop(0, `rgba(180, 200, 255, ${alpha * 0.15})`);
          glow.addColorStop(1, 'transparent');
          ctx.fillStyle = glow;
          ctx.fillRect(star.x - sz * 4, star.y - sz * 4, sz * 8, sz * 8);
        }

        // Draw star
        ctx.beginPath();
        ctx.arc(star.x, star.y, sz * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
      }

      // --- CONNECTION LINES near cursor ---
      if (m.active) {
        const nearby = stars.filter((s) => Math.hypot(s.x - m.x, s.y - m.y) < 180);
        for (let i = 0; i < nearby.length; i++) {
          for (let j = i + 1; j < nearby.length; j++) {
            const a = nearby[i];
            const b = nearby[j];
            const dist = Math.hypot(a.x - b.x, a.y - b.y);
            if (dist < 120) {
              const alpha = (1 - dist / 120) * 0.15;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.strokeStyle = `rgba(150, 180, 255, ${alpha})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
          // Line from star to cursor
          const distToCursor = Math.hypot(nearby[i].x - m.x, nearby[i].y - m.y);
          if (distToCursor < 150) {
            const alpha = (1 - distToCursor / 150) * 0.08;
            ctx.beginPath();
            ctx.moveTo(nearby[i].x, nearby[i].y);
            ctx.lineTo(m.x, m.y);
            ctx.strokeStyle = `rgba(200, 220, 255, ${alpha})`;
            ctx.lineWidth = 0.3;
            ctx.stroke();
          }
        }
      }

      // --- MOUSE TRAIL ---
      if (m.active && m.speed > 2) {
        const count = Math.min(3, Math.floor(m.speed / 5) + 1);
        for (let i = 0; i < count; i++) {
          trailRef.current.push({
            x: m.x + (Math.random() - 0.5) * 8,
            y: m.y + (Math.random() - 0.5) * 8,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5,
            life: 1,
            maxLife: 1,
            size: Math.random() * 2 + 0.5,
          });
        }
      }

      // Update & draw trail
      for (let i = trailRef.current.length - 1; i >= 0; i--) {
        const p = trailRef.current[i];
        p.life -= dt * 1.5;
        if (p.life <= 0) {
          trailRef.current.splice(i, 1);
          continue;
        }
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.98;
        p.vy *= 0.98;

        const alpha = p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 200, 255, ${alpha * 0.6})`;
        ctx.fill();
      }

      // --- BURST PARTICLES (click) ---
      for (let i = burstsRef.current.length - 1; i >= 0; i--) {
        const p = burstsRef.current[i];
        p.life -= dt * 1.2;
        if (p.life <= 0) {
          burstsRef.current.splice(i, 1);
          continue;
        }
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.97;
        p.vy *= 0.97;

        const alpha = p.life / p.maxLife;

        // Glow
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        glow.addColorStop(0, `${p.color}${alpha * 0.3})`);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(p.x - p.size * 3, p.y - p.size * 3, p.size * 6, p.size * 6);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${alpha})`;
        ctx.fill();
      }

      // --- SHOOTING STARS ---
      shootingTimer += dt;
      if (shootingTimer > 4 + Math.random() * 6) {
        shootingTimer = 0;
        spawnShootingStar(w, h);
      }

      for (let i = shootingRef.current.length - 1; i >= 0; i--) {
        const ss = shootingRef.current[i];
        ss.life -= dt * 0.7;
        if (ss.life <= 0) {
          shootingRef.current.splice(i, 1);
          continue;
        }

        ss.trail.unshift({ x: ss.x, y: ss.y });
        if (ss.trail.length > 25) ss.trail.pop();

        ss.x += ss.vx;
        ss.y += ss.vy;

        // Draw trail
        for (let j = 0; j < ss.trail.length; j++) {
          const tp = ss.trail[j];
          const alpha = (1 - j / ss.trail.length) * ss.life;
          const sz = (1 - j / ss.trail.length) * 2;
          ctx.beginPath();
          ctx.arc(tp.x, tp.y, sz * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
          ctx.fill();
        }

        // Head glow
        const headGlow = ctx.createRadialGradient(ss.x, ss.y, 0, ss.x, ss.y, 8);
        headGlow.addColorStop(0, `rgba(255, 255, 255, ${ss.life * 0.6})`);
        headGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = headGlow;
        ctx.fillRect(ss.x - 8, ss.y - 8, 16, 16);
      }

      // --- VIGNETTE ---
      const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.9);
      vig.addColorStop(0, 'transparent');
      vig.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
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
      window.removeEventListener('click', handleClick);
    };
  }, [initStars, spawnShootingStar]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ pointerEvents: 'auto' }}
    />
  );
}
