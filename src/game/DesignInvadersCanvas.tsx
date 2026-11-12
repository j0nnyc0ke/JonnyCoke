import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BAD_PRACTICE_TERMS, InvaderEnemy, Projectile, ShatterParticle, FloatingNotification, AccessibilitySettings } from './types';
import { PORTFOLIO_PROJECTS, PortfolioProject } from '../data/portfolioData';
import { soundEngine } from './audio';
import { saveScore } from './leaderboard';
import { Sparkles, Trophy, Volume2, VolumeX, Eye, FastForward, RotateCcw, Play, Pause, ChevronLeft, ChevronRight, Crosshair } from 'lucide-react';

interface Props {
  onOpenPortfolio: (projectId?: string) => void;
  onOpenLeaderboard: () => void;
  settings: AccessibilitySettings;
  onUpdateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
  unlockedProjects: string[];
  onUnlockProject: (projectId: string) => void;
  onScoreUpdate?: (score: number) => void;
  onGamePlayed?: () => void;
  onPlayerDied?: () => void;
  onReturnTo3D?: () => void;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

export const DesignInvadersCanvas: React.FC<Props> = ({
  onOpenPortfolio,
  onOpenLeaderboard,
  settings,
  onUpdateSettings,
  unlockedProjects,
  onUnlockProject,
  onScoreUpdate,
  onGamePlayed,
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
  const [streak, setStreak] = useState(0);
  const [recentUnlock, setRecentUnlock] = useState<PortfolioProject | null>(null);

  const [playerInitials, setPlayerInitials] = useState('');
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [autoReturnCountdown, setAutoReturnCountdown] = useState<number | null>(null);

  const playerRef = useRef({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 48,
    width: 40,
    height: 40,
    speed: 7.5,
    isMovingLeft: false,
    isMovingRight: false,
    lastFireTime: 0,
  });

  const enemiesRef = useRef<InvaderEnemy[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const particlesRef = useRef<ShatterParticle[]>([]);
  const notificationsRef = useRef<FloatingNotification[]>([]);
  const animationFrameId = useRef<number | null>(null);
  const waveDirectionRef = useRef<number>(1);

  const currentScoreRef = useRef(0);
  const currentWaveRef = useRef(1);
  const currentLivesRef = useRef(3);
  const currentStreakRef = useRef(0);

  useEffect(() => { currentScoreRef.current = score; }, [score]);
  useEffect(() => { currentWaveRef.current = wave; }, [wave]);
  useEffect(() => { currentLivesRef.current = lives; }, [lives]);
  useEffect(() => { currentStreakRef.current = streak; }, [streak]);

  const checkMilestones = useCallback((newScore: number) => {
    PORTFOLIO_PROJECTS.forEach(proj => {
      if (newScore >= proj.unlockScore && !unlockedProjects.includes(proj.id)) {
        onUnlockProject(proj.id);
        setRecentUnlock(proj);
        soundEngine.playUnlock();
        notificationsRef.current.push({
          id: 'unlock_' + Date.now(),
          text: `UNLOCKED: ${proj.title}!`,
          x: CANVAS_WIDTH / 2,
          y: 120,
          alpha: 1,
          color: proj.accentColor || '#dfb15b',
          scale: 1.2,
        });
      }
    });
  }, [unlockedProjects, onUnlockProject]);

  const spawnWave = useCallback((waveNum: number) => {
    soundEngine.playWaveStart();
    const rows = Math.min(3 + Math.floor(waveNum / 2), 5);
    const cols = 4;
    const colSpacing = 175;
    const rowSpacing = 48;
    const startX = (CANVAS_WIDTH - (cols - 1) * colSpacing) / 2;
    const startY = 80;
    const newEnemies: InvaderEnemy[] = [];

    let termIndex = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const term = BAD_PRACTICE_TERMS[(termIndex + (waveNum - 1) * 2) % BAD_PRACTICE_TERMS.length];
        termIndex++;
        newEnemies.push({
          id: `enemy_${r}_${c}_${Date.now()}`,
          x: startX + c * colSpacing,
          y: startY + r * rowSpacing,
          width: 140,
          height: 32,
          term,
          hp: term.hp + Math.floor((waveNum - 1) / 3),
          maxHp: term.hp + Math.floor((waveNum - 1) / 3),
          vx: (1.2 + waveNum * 0.25) * waveDirectionRef.current,
          vy: 0.15 + waveNum * 0.05,
          initialX: startX + c * colSpacing,
        });
      }
    }
    enemiesRef.current = newEnemies;
    waveDirectionRef.current = 1;

    notificationsRef.current.push({
      id: 'wave_' + waveNum,
      text: `WAVE ${waveNum}: RESOLVE HOSTILE PATTERNS`,
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2 - 40,
      alpha: 1,
      color: '#dfb15b',
      scale: 1.1,
    });
  }, []);

  const fireProjectile = useCallback(() => {
    const now = Date.now();
    if (now - playerRef.current.lastFireTime < 180) return;
    playerRef.current.lastFireTime = now;
    soundEngine.playShoot();

    const colors = ['#dfb15b', '#c41230', '#672288', '#38bdf8'];
    const chosenColor = colors[Math.floor(Math.random() * colors.length)];

    projectilesRef.current.push({
      id: 'proj_' + now + '_' + Math.random(),
      x: playerRef.current.x,
      y: playerRef.current.y - 14,
      radius: 5,
      vy: -12,
      color: chosenColor,
      tokenType: 'diamond',
    });
  }, []);

  const shatterEnemy = (enemy: InvaderEnemy) => {
    soundEngine.playHit(currentStreakRef.current > 2);
    const count = settings.reducedMotion ? 6 : 20;
    const shapes: ('square' | 'pill' | 'check' | 'dot')[] = ['square', 'pill', 'check', 'dot'];
    const palette = [enemy.term.color, '#dfb15b', '#c41230', '#ffffff', '#672288'];

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
      const speed = (settings.reducedMotion ? 1.5 : 3.5) + Math.random() * 3.5;
      particlesRef.current.push({
        x: enemy.x + (Math.random() - 0.5) * enemy.width * 0.8,
        y: enemy.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        size: Math.random() * 5 + 3,
        color: palette[Math.floor(Math.random() * palette.length)],
        alpha: 1,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
      });
    }

    const streakBonus = Math.min(currentStreakRef.current, 5) * 20;
    const gained = enemy.term.points + streakBonus;
    const updatedScore = currentScoreRef.current + gained;
    setScore(updatedScore);
    setStreak(s => s + 1);
    checkMilestones(updatedScore);
    onScoreUpdate?.(updatedScore);

    notificationsRef.current.push({
      id: 'pop_' + Date.now() + Math.random(),
      text: `+${gained} • ${enemy.term.solutionHint}`,
      x: enemy.x,
      y: enemy.y - 12,
      alpha: 1,
      color: '#dfb15b',
      scale: 0.9,
    });
  };

  const handleStartGame = () => {
    setScore(0);
    setWave(1);
    setLives(3);
    setStreak(0);
    setScoreSubmitted(false);
    setPlayerInitials('');
    setRecentUnlock(null);
    playerRef.current.x = CANVAS_WIDTH / 2;
    projectilesRef.current = [];
    particlesRef.current = [];
    notificationsRef.current = [];
    spawnWave(1);
    setGameState('playing');
    if (onGamePlayed) onGamePlayed();
  };

  const handleScoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (scoreSubmitted) return;
    saveScore(playerInitials, score, wave, unlockedProjects.length);
    setScoreSubmitted(true);
    soundEngine.playClick();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', ' ', 'KeyW', 'KeyS', 'KeyA', 'KeyD'].includes(e.code) ||
        ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)
      ) {
        e.preventDefault();
      }

      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        playerRef.current.isMovingLeft = true;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        playerRef.current.isMovingRight = true;
      }
      if (e.code === 'Space') {
        if (gameState === 'playing') {
          fireProjectile();
        } else if (gameState === 'menu' || gameState === 'gameover') {
          handleStartGame();
        }
      }
      if (e.code === 'KeyP') {
        if (gameState === 'playing') setGameState('paused');
        else if (gameState === 'paused') setGameState('playing');
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
        playerRef.current.isMovingLeft = false;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        playerRef.current.isMovingRight = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp, { passive: false });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, fireProjectile]);

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastAutoFire = 0;

    const render = () => {
      if (gameState === 'playing') {
        if (settings.autoFire && Date.now() - lastAutoFire > 220) {
          lastAutoFire = Date.now();
          fireProjectile();
        }

        if (playerRef.current.isMovingLeft) {
          playerRef.current.x = Math.max(30, playerRef.current.x - playerRef.current.speed);
        }
        if (playerRef.current.isMovingRight) {
          playerRef.current.x = Math.min(CANVAS_WIDTH - 30, playerRef.current.x + playerRef.current.speed);
        }

        projectilesRef.current.forEach(p => { p.y += p.vy; });
        projectilesRef.current = projectilesRef.current.filter(p => p.y > -20);

        let hitEdge = false;
        const enemies = enemiesRef.current;
        for (let i = 0; i < enemies.length; i++) {
          const enemy = enemies[i];
          enemy.x += enemy.vx;
          if (enemy.x - enemy.width / 2 < 20 || enemy.x + enemy.width / 2 > CANVAS_WIDTH - 20) {
            hitEdge = true;
          }

          if (enemy.y + enemy.height / 2 >= CANVAS_HEIGHT - 65) {
            soundEngine.playGameOver();
            setLives(l => {
              const remaining = l - 1;
              if (remaining <= 0) {
                setGameState('gameover');
              } else {
                enemiesRef.current.forEach(e => (e.y -= 70));
              }
              return Math.max(0, remaining);
            });
            break;
          }
        }

        if (hitEdge) {
          waveDirectionRef.current *= -1;
          for (let i = 0; i < enemies.length; i++) {
            enemies[i].vx = Math.abs(enemies[i].vx) * waveDirectionRef.current;
            enemies[i].y += 16;
          }
        }

        // Collision check
        const aliveEnemies: InvaderEnemy[] = [];
        const activeProjectiles = [...projectilesRef.current];

        for (let eIdx = 0; eIdx < enemies.length; eIdx++) {
          const enemy = enemies[eIdx];
          let destroyed = false;
          for (let pIdx = activeProjectiles.length - 1; pIdx >= 0; pIdx--) {
            const p = activeProjectiles[pIdx];
            const halfW = enemy.width / 2;
            const halfH = enemy.height / 2;

            if (
              p.x >= enemy.x - halfW &&
              p.x <= enemy.x + halfW &&
              p.y >= enemy.y - halfH &&
              p.y <= enemy.y + halfH
            ) {
              activeProjectiles.splice(pIdx, 1);
              enemy.hp -= 1;
              if (enemy.hp <= 0) {
                destroyed = true;
                shatterEnemy(enemy);
                break;
              } else {
                notificationsRef.current.push({
                  id: 'hit_' + Date.now(),
                  text: 'HIT',
                  x: enemy.x,
                  y: enemy.y,
                  alpha: 0.8,
                  color: '#ffffff',
                  scale: 0.7,
                });
                soundEngine.playHit(false);
              }
            }
          }
          if (!destroyed) {
            aliveEnemies.push(enemy);
          }
        }

        enemiesRef.current = aliveEnemies;
        projectilesRef.current = activeProjectiles;

        if (aliveEnemies.length === 0) {
          const nextWave = currentWaveRef.current + 1;
          setWave(nextWave);
          spawnWave(nextWave);
        }

        particlesRef.current.forEach(pt => {
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.vy += 0.08;
          pt.alpha -= 0.02;
          pt.rotation += pt.vRot;
        });
        particlesRef.current = particlesRef.current.filter(pt => pt.alpha > 0);

        notificationsRef.current.forEach(n => {
          n.y -= 0.8;
          n.alpha -= 0.015;
        });
        notificationsRef.current = notificationsRef.current.filter(n => n.alpha > 0);
      }

      // Drawing
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const isHighContrast = settings.highContrast;
      ctx.fillStyle = isHighContrast ? '#05070c' : '#070b16';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Subtle proportional grid lines
      ctx.strokeStyle = isHighContrast ? 'rgba(255,255,255,0.1)' : 'rgba(223, 177, 91, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < CANVAS_WIDTH; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y < CANVAS_HEIGHT; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
      }

      // Defense boundary baseline
      ctx.strokeStyle = isHighContrast ? '#f43f5e' : 'rgba(196, 18, 48, 0.4)';
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(10, CANVAS_HEIGHT - 65);
      ctx.lineTo(CANVAS_WIDTH - 10, CANVAS_HEIGHT - 65);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = isHighContrast ? '#ffffff' : 'rgba(196, 18, 48, 0.7)';
      ctx.textAlign = 'right';
      ctx.fillText('ACCESSIBILITY BOUNDARY', CANVAS_WIDTH - 20, CANVAS_HEIGHT - 70);

      // Draw Enemies
      enemiesRef.current.forEach(enemy => {
        const halfW = enemy.width / 2;
        const halfH = enemy.height / 2;
        const x = enemy.x - halfW;
        const y = enemy.y - halfH;

        ctx.fillStyle = isHighContrast ? '#000000' : 'rgba(12, 20, 39, 0.95)';
        ctx.strokeStyle = enemy.term.color;
        ctx.lineWidth = isHighContrast ? 2.5 : 1.5;

        ctx.beginPath();
        const r = 8;
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + enemy.width, y, x + enemy.width, y + enemy.height, r);
        ctx.arcTo(x + enemy.width, y + enemy.height, x, y + enemy.height, r);
        ctx.arcTo(x, y + enemy.height, x, y, r);
        ctx.arcTo(x, y, x + enemy.width, y, r);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = enemy.term.color;
        ctx.beginPath();
        ctx.arc(x + 14, y + halfH, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = isHighContrast ? '#ffffff' : '#f8fafc';
        ctx.textAlign = 'center';
        ctx.fillText(enemy.term.text, enemy.x + 6, y + halfH + 4);

        if (enemy.maxHp > 1) {
          const barW = enemy.width - 24;
          const barH = 3;
          const barX = x + 12;
          const barY = y + enemy.height - 5;
          ctx.fillStyle = 'rgba(255,255,255,0.2)';
          ctx.fillRect(barX, barY, barW, barH);
          ctx.fillStyle = enemy.term.color;
          ctx.fillRect(barX, barY, barW * (enemy.hp / enemy.maxHp), barH);
        }
      });

      // Draw Projectiles
      projectilesRef.current.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-4, -4, 8, 8);
        ctx.strokeRect(-4, -4, 8, 8);
        ctx.restore();

        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y + 4);
        ctx.lineTo(p.x, p.y + 12);
        ctx.stroke();
      });

      // Draw Particles
      particlesRef.current.forEach(pt => {
        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.rotate(pt.rotation);
        ctx.globalAlpha = Math.max(0, pt.alpha);
        ctx.fillStyle = pt.color;
        ctx.fillRect(-pt.size / 2, -pt.size / 2, pt.size, pt.size);
        ctx.restore();
      });

      // Draw Player Cursor Ship
      const pX = playerRef.current.x;
      const pY = playerRef.current.y;

      ctx.strokeStyle = 'rgba(223, 177, 91, 0.25)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(pX, pY - 18);
      ctx.lineTo(pX, 40);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.save();
      ctx.translate(pX, pY);

      ctx.fillStyle = isHighContrast ? '#ffffff' : '#c41230';
      ctx.strokeStyle = '#dfb15b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(16, 12);
      ctx.lineTo(0, 6);
      ctx.lineTo(-16, 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-2, -2, 4, 4);

      ctx.restore();

      // Notifications
      notificationsRef.current.forEach(n => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, n.alpha);
        ctx.font = `bold ${Math.round(13 * n.scale)}px "Plus Jakarta Sans", sans-serif`;
        ctx.fillStyle = n.color;
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.fillText(n.text, n.x, n.y);
        ctx.restore();
      });

      // HUD
      ctx.fillStyle = isHighContrast ? '#ffffff' : '#94a3b8';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`MASTERY SCORE: ${score.toLocaleString()}`, 24, 30);
      ctx.fillText(`WAVE: ${wave}`, 200, 30);

      ctx.textAlign = 'right';
      ctx.fillText('DESIGN FOCUS:', CANVAS_WIDTH - 90, 30);
      for (let i = 0; i < 3; i++) {
        const heartX = CANVAS_WIDTH - 70 + i * 20;
        ctx.fillStyle = i < lives ? '#c41230' : 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.arc(heartX, 26, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId.current = requestAnimationFrame(render);
    };

    animationFrameId.current = requestAnimationFrame(render);
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [gameState, settings, score, wave, lives, spawnWave, fireProjectile]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const relativeX = (clientX / rect.width) * CANVAS_WIDTH;

    if (gameState === 'playing') {
      if (relativeX < CANVAS_WIDTH * 0.35) {
        playerRef.current.isMovingLeft = true;
        playerRef.current.isMovingRight = false;
      } else if (relativeX > CANVAS_WIDTH * 0.65) {
        playerRef.current.isMovingRight = true;
        playerRef.current.isMovingLeft = false;
      } else {
        playerRef.current.x = relativeX;
        fireProjectile();
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.buttons > 0 && gameState === 'playing') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const relativeX = (clientX / rect.width) * CANVAS_WIDTH;
      playerRef.current.x = Math.max(30, Math.min(CANVAS_WIDTH - 30, relativeX));
    }
  };

  const handlePointerUp = () => {
    playerRef.current.isMovingLeft = false;
    playerRef.current.isMovingRight = false;
  };

  return (
    <div className="w-full flex flex-col items-center" ref={containerRef}>
      {/* Top Bar */}
      <div className="w-full max-w-[800px] flex items-center justify-between px-4 py-2.5 bg-[#0c1427]/90 border-x border-t border-slate-800 rounded-t-2xl text-xs font-mono text-slate-300">
        <div className="flex items-center gap-3">
          <span className="font-bold text-[#dfb15b] flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5" />
            2D RETRO ARCADE
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">Wave {wave}</span>
          <span className="text-slate-400">Score: <strong className="text-[#dfb15b]">{score.toLocaleString()}</strong></span>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="sound-toggle-2d-btn"
            onClick={() => {
              const muted = soundEngine.toggleMute();
              onUpdateSettings({ soundEnabled: !muted });
            }}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
            title={settings.soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
          >
            {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-[#dfb15b]" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          </button>
          <button
            id="autofire-toggle-2d-btn"
            onClick={() => onUpdateSettings({ autoFire: !settings.autoFire })}
            className={`px-2 py-1 rounded-lg text-[11px] font-medium transition flex items-center gap-1 ${
              settings.autoFire
                ? 'bg-[#dfb15b]/20 text-[#dfb15b] border border-[#dfb15b]/40'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <FastForward className="w-3 h-3" />
            Auto-Fire: {settings.autoFire ? 'ON' : 'OFF'}
          </button>
          <button
            id="contrast-toggle-2d-btn"
            onClick={() => onUpdateSettings({ highContrast: !settings.highContrast })}
            className={`px-2 py-1 rounded-lg text-[11px] font-medium transition flex items-center gap-1 ${
              settings.highContrast
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3 h-3" />
            High Contrast
          </button>
          {gameState === 'playing' && (
            <button
              id="pause-2d-btn"
              onClick={() => setGameState('paused')}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
          )}
          {gameState === 'paused' && (
            <button
              id="resume-2d-btn"
              onClick={() => setGameState('playing')}
              className="p-1.5 rounded-lg bg-[#c41230] text-white hover:bg-[#d3192b]"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="relative w-full max-w-[800px] aspect-[4/3] bg-[#070b16] border-x border-slate-800 overflow-hidden shadow-2xl">
        <canvas
          id="design-invaders-canvas"
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-full block select-none touch-none cursor-crosshair"
          tabIndex={0}
        />

        {gameState === 'menu' && (
          <div className="absolute inset-0 bg-[#070b16]/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#dfb15b]/10 border border-[#dfb15b]/30 text-[#dfb15b] text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              ACCESSIBILITY &amp; MOTION SPECIALIST PORTFOLIO
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2 font-mono">
              DESIGN INVADERS
            </h1>
            <p className="max-w-md text-xs sm:text-sm text-slate-300 mb-6 leading-relaxed">
              Cleanse the interface of inaccessible anti-patterns. Shoot design solutions to shatter bad practices and earn access to Jonny Coke&apos;s case studies!
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs mb-6">
              <button
                id="start-game-2d-btn"
                onClick={handleStartGame}
                className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-[#c41230] to-[#672288] text-white font-bold text-xs tracking-wide shadow-lg transition flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                PLAY 2D MODE
              </button>
              <button
                id="view-portfolio-2d-btn"
                onClick={() => onOpenPortfolio()}
                className="w-full py-3 px-6 rounded-2xl bg-[#0c1427] hover:bg-slate-850 text-white font-semibold text-xs border border-slate-700 transition"
              >
                VIEW PORTFOLIO
              </button>
            </div>
            <div className="flex items-center gap-6 text-[11px] text-slate-400 font-mono">
              <span>← / → or A / D: Move</span>
              <span>Space: Shoot</span>
              <span>P: Pause</span>
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-[#070b16]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1 font-mono">GAME OVER</h2>
            <p className="text-slate-400 text-xs mb-4">The hostile UX patterns breached the threshold.</p>
            <div className="grid grid-cols-2 gap-4 w-full max-w-xs p-4 rounded-2xl bg-[#0c1427] border border-slate-800 mb-5 text-left">
              <div>
                <span className="text-[10px] text-slate-400 font-mono block">FINAL SCORE</span>
                <span className="text-xl font-extrabold text-[#dfb15b] font-mono">{score.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-mono block">WAVE REACHED</span>
                <span className="text-xl font-bold text-[#38bdf8] font-mono">Wave {wave}</span>
              </div>
            </div>

            {!scoreSubmitted ? (
              <form onSubmit={handleScoreSubmit} className="w-full max-w-xs mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={3}
                    value={playerInitials}
                    onChange={e => setPlayerInitials(e.target.value.toUpperCase())}
                    placeholder="INITIALS"
                    className="flex-1 py-2 px-3 bg-[#080d1a] border border-slate-700 rounded-xl text-white font-mono text-center tracking-widest font-bold focus:border-[#dfb15b] focus:outline-none text-sm"
                    required
                  />
                  <button
                    type="submit"
                    className="py-2 px-4 rounded-xl bg-[#dfb15b] text-[#080d1a] font-bold text-xs transition"
                  >
                    SAVE
                  </button>
                </div>
              </form>
            ) : (
              <div className="mb-4 text-xs text-emerald-400 font-medium">✓ Score saved to arcade leaderboard!</div>
            )}

            <div className="flex items-center gap-3 w-full max-w-xs">
              <button
                onClick={handleStartGame}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#c41230] text-white font-bold text-xs transition"
              >
                PLAY AGAIN
              </button>
              <button
                onClick={onOpenLeaderboard}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#0c1427] hover:bg-slate-850 text-white font-semibold text-xs border border-slate-700 transition flex items-center justify-center gap-1.5"
              >
                <Trophy className="w-3.5 h-3.5 text-[#dfb15b]" />
                LEADERBOARD
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="w-full max-w-[800px] flex items-center justify-between p-3 bg-[#0c1427]/90 border-x border-b border-slate-800 rounded-b-2xl gap-2 select-none">
        <div className="flex items-center gap-2 flex-1">
          <button
            onPointerDown={() => { playerRef.current.isMovingLeft = true; }}
            onPointerUp={() => { playerRef.current.isMovingLeft = false; }}
            onPointerLeave={() => { playerRef.current.isMovingLeft = false; }}
            className="flex-1 py-3 bg-slate-800 active:bg-[#c41230] rounded-xl flex items-center justify-center text-white text-xs font-semibold transition touch-none"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>LEFT</span>
          </button>
          <button
            onPointerDown={() => { playerRef.current.isMovingRight = true; }}
            onPointerUp={() => { playerRef.current.isMovingRight = false; }}
            onPointerLeave={() => { playerRef.current.isMovingRight = false; }}
            className="flex-1 py-3 bg-slate-800 active:bg-[#c41230] rounded-xl flex items-center justify-center text-white text-xs font-semibold transition touch-none"
          >
            <span>RIGHT</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={fireProjectile}
          className="flex-1 py-3 bg-gradient-to-r from-[#dfb15b] to-[#e5c07b] text-[#080d1a] rounded-xl flex items-center justify-center text-xs font-bold shadow-md transition touch-none gap-1.5"
        >
          <Sparkles className="w-4 h-4 fill-current" />
          <span>FIRE SOLUTION</span>
        </button>
      </div>

      {recentUnlock && (
        <div className="w-full max-w-[800px] mt-3 p-3 rounded-2xl bg-gradient-to-r from-[#0c1427] to-[#1e1b4b] border border-[#dfb15b]/40 text-white flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#dfb15b]/20 border border-[#dfb15b]/30 flex items-center justify-center text-[#dfb15b] font-bold">
              ★
            </div>
            <div>
              <span className="text-[10px] text-[#dfb15b] font-mono block">NEW CASE STUDY UNLOCKED!</span>
              <strong className="text-xs text-white font-semibold">{recentUnlock.title}</strong>
            </div>
          </div>
          <button
            onClick={() => onOpenPortfolio(recentUnlock.id)}
            className="py-1.5 px-3 rounded-xl bg-[#dfb15b] text-[#080d1a] font-bold text-xs transition"
          >
            Read Case Study
          </button>
        </div>
      )}
    </div>
  );
};
