import React, { useEffect, useRef } from 'react';

interface MotionCursorTrailProps {
  /** Whether the trail is active (e.g. only in 3D and 2D views) */
  enabled?: boolean;
  /** Accessibility setting to disable motion */
  reducedMotion?: boolean;
}

interface TrailNode {
  x: number;
  y: number;
  speed: number;
  vx: number;
  vy: number;
  time: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
}

// Brand-aligned luxury harmonic palette (Gold, Amber, Subtle Cyan, Rose)
const TRAIL_PALETTE = [
  'rgba(223, 177, 91, ',   // Jonny Coke Muted Gold #dfb15b
  'rgba(245, 158, 11, ',   // Radiant Amber
  'rgba(56, 189, 248, ',   // Subtle Cyan accent
  'rgba(244, 63, 94, ',    // Subtle Rose
];

export const MotionCursorTrail: React.FC<MotionCursorTrailProps> = ({
  enabled = true,
  reducedMotion = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // Respect OS-level reduced motion preference as well as the app-level setting
    const mediaQuery = typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null;
    const isSystemReduced = mediaQuery?.matches ?? false;

    const isActive = enabled && !reducedMotion && !isSystemReduced;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!isActive) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const trail: TrailNode[] = [];
    const particles: Particle[] = [];
    const MAX_TRAIL_LENGTH = 18;
    const MAX_AGE_MS = 380; // Trail fades rapidly and smoothly

    let lastX = 0;
    let lastY = 0;
    let lastTime = performance.now();
    let isMoving = false;
    let hasCursor = false;
    let idleTimeout: NodeJS.Timeout | null = null;

    const handlePointerMove = (e: PointerEvent) => {
      // Ignore simulated pointer events or non-mouse/stylus if preferred
      if (e.pointerType === 'touch') return;

      const now = performance.now();
      const dt = Math.max(now - lastTime, 8);
      const x = e.clientX;
      const y = e.clientY;

      if (!hasCursor) {
        lastX = x;
        lastY = y;
        hasCursor = true;
      }

      const dx = x - lastX;
      const dy = y - lastY;
      const dist = Math.hypot(dx, dy);
      const speed = Math.min(dist / (dt / 16.67), 35); // Normalized velocity

      const vx = dx / (dt / 16.67);
      const vy = dy / (dt / 16.67);

      trail.unshift({
        x,
        y,
        speed,
        vx,
        vy,
        time: now,
      });

      if (trail.length > MAX_TRAIL_LENGTH) {
        trail.pop();
      }

      // Motion-reactive micro-sparks generation based on velocity
      if (speed > 2.5) {
        const spawnCount = Math.min(Math.floor(speed / 4), 3);
        for (let i = 0; i < spawnCount; i++) {
          const angle = Math.atan2(vy, vx) + (Math.random() - 0.5) * 1.8 + Math.PI;
          const pSpeed = (Math.random() * 0.8 + 0.3) * (speed * 0.12);
          const colorBase = TRAIL_PALETTE[Math.floor(Math.random() * TRAIL_PALETTE.length)];
          particles.push({
            x: x + (Math.random() - 0.5) * 6,
            y: y + (Math.random() - 0.5) * 6,
            vx: Math.cos(angle) * pSpeed,
            vy: Math.sin(angle) * pSpeed,
            size: Math.random() * 2 + 1,
            life: 1,
            maxLife: Math.random() * 18 + 12,
            color: colorBase,
          });
        }
      }

      lastX = x;
      lastY = y;
      lastTime = now;
      isMoving = true;

      if (idleTimeout) clearTimeout(idleTimeout);
      idleTimeout = setTimeout(() => {
        isMoving = false;
      }, 90);
    };

    const handleMouseLeave = () => {
      hasCursor = false;
      isMoving = false;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    // Animation Render Loop
    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      // Clean up aged trail nodes
      for (let i = trail.length - 1; i >= 0; i--) {
        if (time - trail[i].time > MAX_AGE_MS) {
          trail.splice(i, 1);
        }
      }

      // Draw Ribbon Trail
      if (trail.length > 2) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Render multi-segment dynamic fluid trail with velocity-tapered width
        for (let i = 0; i < trail.length - 1; i++) {
          const current = trail[i];
          const next = trail[i + 1];
          const age = (time - current.time) / MAX_AGE_MS;
          const ratio = 1 - i / (trail.length - 1);
          const alpha = Math.max(0, (1 - age) * ratio * 0.55);

          if (alpha <= 0.01) continue;

          // Motion-reactive thickness: faster movements yield sleeker or extended tapered stream
          const speedFactor = Math.min(Math.max(current.speed / 8, 0.6), 2.2);
          const lineWidth = Math.max(ratio * 5.5 * speedFactor, 0.8);

          ctx.beginPath();
          ctx.moveTo(current.x, current.y);
          const xc = (current.x + next.x) / 2;
          const yc = (current.y + next.y) / 2;
          ctx.quadraticCurveTo(current.x, current.y, xc, yc);

          // Subtle gradient shift: Gold towards center, warm radiant amber at edge
          const color = i % 3 === 0
            ? `rgba(223, 177, 91, ${alpha})`
            : i % 3 === 1
            ? `rgba(245, 158, 11, ${alpha * 0.9})`
            : `rgba(56, 189, 248, ${alpha * 0.8})`;

          ctx.strokeStyle = color;
          ctx.lineWidth = lineWidth;
          ctx.shadowColor = 'rgba(223, 177, 91, 0.4)';
          ctx.shadowBlur = 8;
          ctx.stroke();
        }

        // Leading cursor halo / radiant node
        if (isMoving && trail.length > 0) {
          const lead = trail[0];
          const haloSize = Math.min(Math.max(lead.speed * 0.45, 2.5), 7);
          const grad = ctx.createRadialGradient(
            lead.x,
            lead.y,
            0,
            lead.x,
            lead.y,
            haloSize * 2.4
          );
          grad.addColorStop(0, 'rgba(255, 255, 255, 0.65)');
          grad.addColorStop(0.35, 'rgba(223, 177, 91, 0.45)');
          grad.addColorStop(1, 'rgba(223, 177, 91, 0)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(lead.x, lead.y, haloSize * 2.4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // Draw & Update Micro-Particles
      if (particles.length > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.95; // Fluid drag
          p.vy *= 0.95;
          p.life -= 1 / p.maxLife;

          if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
          }

          const alpha = Math.max(0, p.life * 0.6);
          ctx.fillStyle = `${p.color}${alpha})`;
          ctx.shadowColor = 'rgba(223, 177, 91, 0.5)';
          ctx.shadowBlur = 4;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (idleTimeout) clearTimeout(idleTimeout);
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
  }, [enabled, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-30 transition-opacity duration-300"
    />
  );
};
