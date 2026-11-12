import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AccessibilitySettings } from './types';
import { soundEngine } from './audio';
import { saveScore } from './leaderboard';
import {
  Trophy,
  Volume2,
  VolumeX,
  RotateCcw,
  Play,
  Pause,
  Rocket,
  Flame,
  Zap,
  Radio,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

interface AsteroidsCanvasProps {
  onOpenPortfolio?: (projectId?: string) => void;
  onOpenLeaderboard?: () => void;
  settings: AccessibilitySettings;
  onUpdateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
  onGamePlayed?: () => void;
  onScoreUpdate?: (score: number) => void;
  onPlayerDied?: () => void;
  onReturnTo3D?: () => void;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

interface Asteroid {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  size: 'large' | 'medium' | 'small';
  points: number;
  vertices: { angle: number; r: number }[];
  term: string;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

const DESIGN_BAD_PRACTICES = [
  'Bad Kerning',
  'Low Contrast',
  'Unpaid 40hr Test',
  'Broken Grid',
  'Tiny Touch Target',
  'Ghosted Recruiter',
  'Illegible Type',
  'Missing Alt Text',
  'Pure Black Text',
  'Overlapping Text',
];

export const AsteroidsCanvas: React.FC<AsteroidsCanvasProps> = ({
  onOpenPortfolio,
  onOpenLeaderboard,
  settings,
  onUpdateSettings,
  onGamePlayed,
  onScoreUpdate,
  onPlayerDied,
  onReturnTo3D,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Game state
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [lives, setLives] = useState(3);
  const [playerInitials, setPlayerInitials] = useState('');
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [autoReturnCountdown, setAutoReturnCountdown] = useState<number | null>(null);

  // Ship physics state in ref for 60fps loop
  const shipRef = useRef({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2, // Facing up
    rotationSpeed: 0.075,
    thrustPower: 0.18,
    friction: 0.986,
    isRotatingLeft: false,
    isRotatingRight: false,
    isThrusting: false,
    invulnerableTime: 0,
    radius: 14,
    lastFireTime: 0,
  });

  const asteroidsRef = useRef<Asteroid[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const nextAsteroidIdRef = useRef(1);
  const animationFrameId = useRef<number | null>(null);

  // Generate irregular polygon vertices for an asteroid
  const generateAsteroidVertices = (baseRadius: number): { angle: number; r: number }[] => {
    const numPoints = Math.floor(Math.random() * 4) + 8; // 8 to 11 points
    const vertices: { angle: number; r: number }[] = [];
    for (let i = 0; i < numPoints; i++) {
      const angle = (i * 2 * Math.PI) / numPoints;
      // Irregularity between 0.75 and 1.25 of radius
      const r = baseRadius * (0.75 + Math.random() * 0.45);
      vertices.push({ angle, r });
    }
    return vertices;
  };

  // Spawn initial wave of large asteroids away from center
  const spawnAsteroidWave = useCallback((waveNum: number) => {
    const count = Math.min(10, 3 + waveNum);
    const newAsteroids: Asteroid[] = [];

    for (let i = 0; i < count; i++) {
      // Pick position away from center
      let x = Math.random() * CANVAS_WIDTH;
      let y = Math.random() * CANVAS_HEIGHT;
      while (
        Math.hypot(x - CANVAS_WIDTH / 2, y - CANVAS_HEIGHT / 2) < 140
      ) {
        x = Math.random() * CANVAS_WIDTH;
        y = Math.random() * CANVAS_HEIGHT;
      }

      const speed = 0.8 + Math.random() * 1.2 + waveNum * 0.15;
      const angle = Math.random() * Math.PI * 2;
      const baseRadius = 40;

      newAsteroids.push({
        id: nextAsteroidIdRef.current++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: baseRadius,
        size: 'large',
        points: 20,
        vertices: generateAsteroidVertices(baseRadius),
        term: DESIGN_BAD_PRACTICES[Math.floor(Math.random() * DESIGN_BAD_PRACTICES.length)],
      });
    }

    asteroidsRef.current = newAsteroids;
  }, []);

  // Start new game
  const startGame = useCallback(() => {
    soundEngine.playClick();
    shipRef.current = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2,
      rotationSpeed: 0.075,
      thrustPower: 0.18,
      friction: 0.986,
      isRotatingLeft: false,
      isRotatingRight: false,
      isThrusting: false,
      invulnerableTime: 120, // 2 seconds safety
      radius: 14,
      lastFireTime: 0,
    };
    bulletsRef.current = [];
    particlesRef.current = [];
    setScore(0);
    setWave(1);
    setLives(3);
    setGameState('playing');
    setScoreSubmitted(false);
    spawnAsteroidWave(1);

    // Record that Asteroids has been played for progressive portfolio unlock!
    if (onGamePlayed) {
      onGamePlayed();
    }
  }, [spawnAsteroidWave, onGamePlayed]);

  // Fire laser bolt
  const fireBullet = useCallback(() => {
    const now = Date.now();
    if (now - shipRef.current.lastFireTime < 140) return;
    shipRef.current.lastFireTime = now;

    const ship = shipRef.current;
    const bulletSpeed = 9;
    const noseX = ship.x + Math.cos(ship.angle) * ship.radius;
    const noseY = ship.y + Math.sin(ship.angle) * ship.radius;

    bulletsRef.current.push({
      x: noseX,
      y: noseY,
      vx: Math.cos(ship.angle) * bulletSpeed + ship.vx * 0.4,
      vy: Math.sin(ship.angle) * bulletSpeed + ship.vy * 0.4,
      life: 0,
      maxLife: 55,
    });

    soundEngine.playShoot();
  }, []);

  // Emergency Hyperspace teleport
  const hyperspace = useCallback(() => {
    shipRef.current.x = Math.random() * CANVAS_WIDTH;
    shipRef.current.y = Math.random() * CANVAS_HEIGHT;
    shipRef.current.vx = (Math.random() - 0.5) * 2;
    shipRef.current.vy = (Math.random() - 0.5) * 2;
    shipRef.current.invulnerableTime = 60;
    soundEngine.playPowerup();
  }, []);

  // Split an asteroid upon hit
  const splitAsteroid = useCallback((hitAsteroid: Asteroid) => {
    const { x, y, size, vx, vy } = hitAsteroid;

    // Create debris particles
    const particleCount = size === 'large' ? 18 : size === 'medium' ? 12 : 8;
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3.5 + 0.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: Math.random() * 30 + 20,
        color: Math.random() > 0.4 ? '#dfb15b' : '#ef4444',
      });
    }

    // Split into smaller asteroids if not already small
    if (size === 'large') {
      const newRadius = 22;
      for (let i = 0; i < 2; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.hypot(vx, vy) * 1.35 + 0.5;
        asteroidsRef.current.push({
          id: nextAsteroidIdRef.current++,
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: newRadius,
          size: 'medium',
          points: 50,
          vertices: generateAsteroidVertices(newRadius),
          term: DESIGN_BAD_PRACTICES[Math.floor(Math.random() * DESIGN_BAD_PRACTICES.length)],
        });
      }
    } else if (size === 'medium') {
      const newRadius = 12;
      for (let i = 0; i < 2; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.hypot(vx, vy) * 1.6 + 0.8;
        asteroidsRef.current.push({
          id: nextAsteroidIdRef.current++,
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: newRadius,
          size: 'small',
          points: 100,
          vertices: generateAsteroidVertices(newRadius),
          term: DESIGN_BAD_PRACTICES[Math.floor(Math.random() * DESIGN_BAD_PRACTICES.length)],
        });
      }
    }
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent browser from scrolling the page
      if (
        ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', ' ', 'KeyW', 'KeyS', 'KeyA', 'KeyD', 'KeyH', 'ShiftLeft', 'ShiftRight'].includes(e.code) ||
        ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)
      ) {
        e.preventDefault();
      }

      if (gameState !== 'playing') {
        if (e.code === 'Space' || e.code === 'Enter') {
          if (gameState === 'menu' || gameState === 'gameover') {
            startGame();
          }
        }
        return;
      }

      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        shipRef.current.isRotatingLeft = true;
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        shipRef.current.isRotatingRight = true;
      } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        shipRef.current.isThrusting = true;
      } else if (e.code === 'Space' || e.code === 'Enter') {
        fireBullet();
      } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'KeyH') {
        hyperspace();
      } else if (e.code === 'KeyP') {
        setGameState(prev => (prev === 'playing' ? 'paused' : 'playing'));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (
        ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', ' ', 'KeyW', 'KeyS', 'KeyA', 'KeyD'].includes(e.code) ||
        ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)
      ) {
        e.preventDefault();
      }

      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        shipRef.current.isRotatingLeft = false;
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        shipRef.current.isRotatingRight = false;
      } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        shipRef.current.isThrusting = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp, { passive: false });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, startGame, fireBullet, hyperspace]);

  // Auto return to 3D Space Arena on death
  useEffect(() => {
    if (gameState !== 'gameover' || autoReturnCountdown === null) return;
    if (autoReturnCountdown <= 0) {
      if (onReturnTo3D) onReturnTo3D();
      else if (onPlayerDied) onPlayerDied();
      return;
    }
    const timer = setTimeout(() => {
      setAutoReturnCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [gameState, autoReturnCountdown, onReturnTo3D, onPlayerDied]);

  // Main 60fps Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localScore = score;
    let localLives = lives;
    let localWave = wave;

    const gameLoop = () => {
      // 1. Clear background (Vector CRT phosphor dark canvas)
      ctx.fillStyle = settings.highContrast ? '#000000' : '#050914';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Subtle CRT grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.lineWidth = 1;
      for (let x = 0; x < CANVAS_WIDTH; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
      }

      if (gameState === 'playing') {
        const ship = shipRef.current;

        // Ship rotation
        if (ship.isRotatingLeft) ship.angle -= ship.rotationSpeed;
        if (ship.isRotatingRight) ship.angle += ship.rotationSpeed;

        // Ship thrust
        if (ship.isThrusting) {
          ship.vx += Math.cos(ship.angle) * ship.thrustPower;
          ship.vy += Math.sin(ship.angle) * ship.thrustPower;

          // Sound trigger & exhaust particles
          if (Math.random() > 0.5) soundEngine.playThrust();

          const exhaustX = ship.x - Math.cos(ship.angle) * ship.radius * 0.9;
          const exhaustY = ship.y - Math.sin(ship.angle) * ship.radius * 0.9;
          particlesRef.current.push({
            x: exhaustX,
            y: exhaustY,
            vx: -Math.cos(ship.angle) * 3 + (Math.random() - 0.5) * 1.5,
            vy: -Math.sin(ship.angle) * 3 + (Math.random() - 0.5) * 1.5,
            life: 0,
            maxLife: 15,
            color: '#f97316',
          });
        }

        // Apply friction
        ship.vx *= ship.friction;
        ship.vy *= ship.friction;

        // Move ship
        ship.x += ship.vx;
        ship.y += ship.vy;

        // Screen wrap
        if (ship.x < 0) ship.x = CANVAS_WIDTH;
        else if (ship.x > CANVAS_WIDTH) ship.x = 0;
        if (ship.y < 0) ship.y = CANVAS_HEIGHT;
        else if (ship.y > CANVAS_HEIGHT) ship.y = 0;

        if (ship.invulnerableTime > 0) ship.invulnerableTime--;

        // Auto-fire if enabled in settings
        if (settings.autoFire && Date.now() - ship.lastFireTime > 250) {
          fireBullet();
        }

        // Update Bullets
        bulletsRef.current = bulletsRef.current.filter(b => {
          b.x += b.vx;
          b.y += b.vy;
          b.life++;

          // Wrap bullets
          if (b.x < 0) b.x = CANVAS_WIDTH;
          else if (b.x > CANVAS_WIDTH) b.x = 0;
          if (b.y < 0) b.y = CANVAS_HEIGHT;
          else if (b.y > CANVAS_HEIGHT) b.y = 0;

          return b.life < b.maxLife;
        });

        // Update Asteroids
        asteroidsRef.current.forEach(ast => {
          ast.x += ast.vx;
          ast.y += ast.vy;

          // Wrap asteroids
          if (ast.x < -ast.radius) ast.x = CANVAS_WIDTH + ast.radius;
          else if (ast.x > CANVAS_WIDTH + ast.radius) ast.x = -ast.radius;
          if (ast.y < -ast.radius) ast.y = CANVAS_HEIGHT + ast.radius;
          else if (ast.y > CANVAS_HEIGHT + ast.radius) ast.y = -ast.radius;
        });

        // Bullet <-> Asteroid Collisions
        const bulletsToRemove = new Set<number>();
        const asteroidsToRemove = new Set<number>();
        const asteroidsToAdd: Asteroid[] = [];

        bulletsRef.current.forEach((b, bIdx) => {
          asteroidsRef.current.forEach(ast => {
            if (asteroidsToRemove.has(ast.id)) return;
            const dist = Math.hypot(b.x - ast.x, b.y - ast.y);
            if (dist < ast.radius) {
              bulletsToRemove.add(bIdx);
              asteroidsToRemove.add(ast.id);

              localScore += ast.points;
              setScore(localScore);
              if (onScoreUpdate) onScoreUpdate(localScore);

              soundEngine.playHit(false);
              splitAsteroid(ast);
            }
          });
        });

        bulletsRef.current = bulletsRef.current.filter((_, idx) => !bulletsToRemove.has(idx));
        asteroidsRef.current = asteroidsRef.current
          .filter(a => !asteroidsToRemove.has(a.id))
          .concat(asteroidsToAdd);

        // Ship <-> Asteroid Collisions
        if (ship.invulnerableTime <= 0) {
          for (const ast of asteroidsRef.current) {
            const dist = Math.hypot(ship.x - ast.x, ship.y - ast.y);
            if (dist < ship.radius + ast.radius * 0.8) {
              // Ship destroyed!
              soundEngine.playExplosion();
              localLives--;
              setLives(localLives);

              // Ship explosion particles
              for (let i = 0; i < 30; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 5 + 1;
                particlesRef.current.push({
                  x: ship.x,
                  y: ship.y,
                  vx: Math.cos(angle) * speed,
                  vy: Math.sin(angle) * speed,
                  life: 0,
                  maxLife: 40,
                  color: '#ef4444',
                });
              }

              if (localLives <= 0) {
                setGameState('gameover');
                if (onGamePlayed) onGamePlayed();
                if (onReturnTo3D || onPlayerDied) {
                  setAutoReturnCountdown(4);
                }
              } else {
                // Respawn ship at center
                ship.x = CANVAS_WIDTH / 2;
                ship.y = CANVAS_HEIGHT / 2;
                ship.vx = 0;
                ship.vy = 0;
                ship.angle = -Math.PI / 2;
                ship.invulnerableTime = 120;
              }
              break;
            }
          }
        }

        // Wave Completion Check
        if (asteroidsRef.current.length === 0) {
          soundEngine.playHarmonicFanfare();
          localWave++;
          setWave(localWave);
          spawnAsteroidWave(localWave);
        }
      }

      // Update Particles
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        return p.life < p.maxLife;
      });

      // --- RENDERING PHASE ---

      // 1. Render Asteroids (Vector glowing wireframe)
      asteroidsRef.current.forEach(ast => {
        ctx.save();
        ctx.translate(ast.x, ast.y);

        ctx.strokeStyle = '#dfb15b';
        ctx.shadowColor = '#dfb15b';
        ctx.shadowBlur = 8;
        ctx.lineWidth = 1.75;

        ctx.beginPath();
        ast.vertices.forEach((v, idx) => {
          const vx = Math.cos(v.angle) * v.r;
          const vy = Math.sin(v.angle) * v.r;
          if (idx === 0) ctx.moveTo(vx, vy);
          else ctx.lineTo(vx, vy);
        });
        ctx.closePath();
        ctx.stroke();

        // Render interior design fault label
        if (ast.size === 'large' || ast.size === 'medium') {
          ctx.shadowBlur = 0;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(ast.term, 0, 0);
        }

        ctx.restore();
      });

      // 2. Render Bullets
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#38bdf8';
      ctx.fillStyle = '#38bdf8';
      bulletsRef.current.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Render Particles
      particlesRef.current.forEach(p => {
        const alpha = 1 - p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
      });
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      // 4. Render Ship
      if (gameState === 'playing' || gameState === 'paused') {
        const ship = shipRef.current;
        const blink = ship.invulnerableTime > 0 && Math.floor(Date.now() / 100) % 2 === 0;

        if (!blink) {
          ctx.save();
          ctx.translate(ship.x, ship.y);
          ctx.rotate(ship.angle);

          ctx.strokeStyle = '#38bdf8';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 10;
          ctx.lineWidth = 2;

          // Classic Asteroids Ship Triangle with inward notch
          ctx.beginPath();
          ctx.moveTo(ship.radius, 0);
          ctx.lineTo(-ship.radius * 0.8, -ship.radius * 0.75);
          ctx.lineTo(-ship.radius * 0.45, 0);
          ctx.lineTo(-ship.radius * 0.8, ship.radius * 0.75);
          ctx.closePath();
          ctx.stroke();

          // Thrust flame
          if (ship.isThrusting) {
            ctx.strokeStyle = '#f97316';
            ctx.shadowColor = '#f97316';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(-ship.radius * 0.45, -ship.radius * 0.35);
            ctx.lineTo(-ship.radius * (1.1 + Math.random() * 0.4), 0);
            ctx.lineTo(-ship.radius * 0.45, ship.radius * 0.35);
            ctx.stroke();
          }

          ctx.restore();
        }
      }

      // HUD Overlay
      if (gameState === 'playing' || gameState === 'paused') {
        ctx.font = 'bold 13px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(`SCORE: ${score}`, 20, 28);
        ctx.fillText(`WAVE: ${wave}`, 170, 28);

        // Render lives as mini vector ships
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < lives; i++) {
          ctx.save();
          ctx.translate(CANVAS_WIDTH - 30 - i * 22, 22);
          ctx.rotate(-Math.PI / 2);
          ctx.beginPath();
          ctx.moveTo(8, 0);
          ctx.lineTo(-6, -5);
          ctx.lineTo(-3, 0);
          ctx.lineTo(-6, 5);
          ctx.closePath();
          ctx.stroke();
          ctx.restore();
        }
      }

      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    animationFrameId.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [gameState, score, wave, lives, settings, fireBullet, splitAsteroid, spawnAsteroidWave, onScoreUpdate]);

  const handleSubmitScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerInitials.trim() || scoreSubmitted) return;
    saveScore(
      playerInitials.toUpperCase().slice(0, 3) || 'YOU',
      score,
      wave,
      0
    );
    setScoreSubmitted(true);
    soundEngine.playLevelUp();
    if (onOpenLeaderboard) onOpenLeaderboard();
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-4xl mx-auto rounded-3xl overflow-hidden border-2 border-slate-800 bg-[#050914] shadow-2xl flex flex-col items-center select-none"
    >
      {/* Arcade Header HUD */}
      <div className="w-full bg-[#080d1a]/95 border-b border-slate-800/80 px-4 py-3 flex items-center justify-between gap-4 text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[#dfb15b] font-bold">
            <Rocket className="w-4 h-4 text-sky-400" />
            <span>ASTEROIDS 2D // VECTOR DEFENDER</span>
          </div>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30 text-[10px]">
            Inertia &amp; Fracture Physics
          </span>
        </div>

        <div className="flex items-center gap-2">
          {gameState === 'playing' && (
            <button
              onClick={() => setGameState(prev => (prev === 'playing' ? 'paused' : 'playing'))}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1"
            >
              <Pause className="w-3 h-3" />
              <span>Pause</span>
            </button>
          )}

          <button
            onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            title="Toggle Audio"
          >
            {settings.soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-rose-400" />}
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="relative w-full aspect-[4/3] max-w-[800px] flex items-center justify-center bg-black">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full h-full object-contain"
        />

        {/* Start / Menu Screen */}
        {gameState === 'menu' && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-sky-500/20 border-2 border-sky-500/50 flex items-center justify-center text-sky-400 shadow-[0_0_30px_rgba(56,189,248,0.3)]">
              <Rocket className="w-8 h-8" />
            </div>

            <div>
              <div className="text-[10px] font-mono text-[#dfb15b] uppercase tracking-widest font-bold mb-1">
                ATARI 1979 CLASSIC VECTOR PHYSICS
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Vector Asteroids: Break Bad Design
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
                Pilot the vector ship with real inertia. Blast fracturing asteroids carrying hostile design anti-patterns. Playing this game unlocks <strong className="text-[#dfb15b]">1/3 of the portfolio</strong>!
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-slate-400 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800">
              <span>W / ↑ : Thrust</span>
              <span>•</span>
              <span>A/D / ←/→ : Rotate</span>
              <span>•</span>
              <span>Space : Lasers</span>
              <span>•</span>
              <span>Shift : Hyperspace</span>
            </div>

            <button
              id="asteroids-launch-game-btn"
              onClick={startGame}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-mono font-bold text-sm shadow-xl shadow-sky-500/30 hover:scale-105 transition flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>LAUNCH ASTEROIDS &amp; EARN 1/3 UNLOCK</span>
            </button>
          </div>
        )}

        {/* Paused Screen */}
        {gameState === 'paused' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-3">
            <h4 className="text-xl font-mono font-bold text-white">SIMULATION PAUSED</h4>
            <button
              onClick={() => setGameState('playing')}
              className="px-6 py-2.5 rounded-xl bg-sky-500 text-white font-mono text-xs font-bold"
            >
              Resume Game
            </button>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="text-xs font-mono text-rose-400 font-bold uppercase tracking-widest">
              VESSEL COMPROMISED // SIMULATION TERMINATED
            </div>
            <h3 className="text-3xl font-black text-white">Final Score: {score.toLocaleString()}</h3>
            <p className="text-xs text-slate-400 font-mono">You reached Wave {wave}</p>

            {!scoreSubmitted ? (
              <form onSubmit={handleSubmitScore} className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={3}
                  placeholder="AAA"
                  value={playerInitials}
                  onChange={e => setPlayerInitials(e.target.value.toUpperCase())}
                  className="w-20 text-center uppercase font-mono font-bold text-base px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-sky-400"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-mono text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Submit Score</span>
                </button>
              </form>
            ) : (
              <div className="text-xs font-mono text-emerald-400">✓ Score registered to Hall of Fame!</div>
            )}

            {/* Transport back to 3D Space Arena Notification */}
            <div className="w-full max-w-sm mx-auto p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-mono text-amber-300 flex flex-col items-center gap-1.5 animate-pulse">
              <span className="font-bold uppercase tracking-wider">
                PORTFOLIO TIER UNLOCKED (+1/3)
              </span>
              <span>
                {autoReturnCountdown !== null && autoReturnCountdown > 0
                  ? `Transporting back to 3D Space Arena in ${autoReturnCountdown}s...`
                  : 'Transporting back to 3D Space Arena...'}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {(onReturnTo3D || onPlayerDied) && (
                <button
                  onClick={() => {
                    if (onReturnTo3D) onReturnTo3D();
                    else if (onPlayerDied) onPlayerDied();
                  }}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-mono text-xs font-black transition flex items-center gap-2 shadow-lg shadow-amber-500/20"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Return to 3D Space Arena Now</span>
                </button>
              )}

              <button
                onClick={startGame}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold transition flex items-center gap-2"
              >
                <span>Retry Game</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* On-Screen Mobile Controls */}
      <div className="w-full bg-[#080d1a] border-t border-slate-800/80 p-3 flex sm:hidden items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onMouseDown={() => (shipRef.current.isRotatingLeft = true)}
            onMouseUp={() => (shipRef.current.isRotatingLeft = false)}
            onTouchStart={() => (shipRef.current.isRotatingLeft = true)}
            onTouchEnd={() => (shipRef.current.isRotatingLeft = false)}
            className="w-12 h-12 rounded-xl bg-slate-800 text-white flex items-center justify-center active:bg-sky-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onMouseDown={() => (shipRef.current.isRotatingRight = true)}
            onMouseUp={() => (shipRef.current.isRotatingRight = false)}
            onTouchStart={() => (shipRef.current.isRotatingRight = true)}
            onTouchEnd={() => (shipRef.current.isRotatingRight = false)}
            className="w-12 h-12 rounded-xl bg-slate-800 text-white flex items-center justify-center active:bg-sky-600"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onMouseDown={() => (shipRef.current.isThrusting = true)}
            onMouseUp={() => (shipRef.current.isThrusting = false)}
            onTouchStart={() => (shipRef.current.isThrusting = true)}
            onTouchEnd={() => (shipRef.current.isThrusting = false)}
            className="w-12 h-12 rounded-xl bg-slate-800 text-white flex items-center justify-center active:bg-amber-600"
            title="Thrust"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          <button
            onClick={fireBullet}
            className="w-14 h-12 rounded-xl bg-sky-500 text-white font-mono font-bold text-xs flex items-center justify-center active:bg-sky-400"
          >
            FIRE
          </button>
          <button
            onClick={hyperspace}
            className="w-10 h-12 rounded-xl bg-purple-900/60 text-purple-300 font-mono text-[10px] flex items-center justify-center active:bg-purple-800"
            title="Hyperspace"
          >
            HYPER
          </button>
        </div>
      </div>
    </div>
  );
};
