import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AccessibilitySettings } from './types';
import { soundEngine } from './audio';
import {
  FileText,
  Volume2,
  VolumeX,
  RotateCcw,
  Play,
  Pause,
  Trophy,
  ShieldCheck,
  Bot,
  User,
  Zap,
  Sparkles,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

interface PongCanvasProps {
  onUnlockCV: () => void;
  onNavigateToCV: () => void;
  settings: AccessibilitySettings;
  onUpdateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
  onGamePlayed?: () => void;
  onPlayerDied?: () => void;
  onReturnTo3D?: () => void;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const WINNING_SCORE = 3; // First to 3 points defeats the ATS Bot

export const PongCanvas: React.FC<PongCanvasProps> = ({
  onUnlockCV,
  onNavigateToCV,
  settings,
  onUpdateSettings,
  onGamePlayed,
  onPlayerDied,
  onReturnTo3D,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'player_won' | 'bot_won'>('menu');
  const [playerScore, setPlayerScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [botComment, setBotComment] = useState<string>('A.T.S. Bot online. Scanning applicant credentials...');
  const [autoReturnCountdown, setAutoReturnCountdown] = useState<number | null>(null);

  const PADDLE_HEIGHT = 86;
  const PADDLE_WIDTH = 12;

  // Game state references for 60fps loop
  const playerYRef = useRef(CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2);
  const botYRef = useRef(CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2);
  const isMovingUpRef = useRef(false);
  const isMovingDownRef = useRef(false);

  const ballRef = useRef({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    vx: 5.5,
    vy: 2.5,
    size: 11,
    speed: 6,
  });

  const trailRef = useRef<{ x: number; y: number }[]>([]);
  const animationFrameId = useRef<number | null>(null);

  const resetBall = useCallback((towardsBot: boolean) => {
    ballRef.current.x = CANVAS_WIDTH / 2;
    ballRef.current.y = CANVAS_HEIGHT / 2;
    const initialSpeed = 5.5;
    const angle = (Math.random() * 0.8 - 0.4); // Mild vertical angle
    ballRef.current.vx = (towardsBot ? 1 : -1) * initialSpeed * Math.cos(angle);
    ballRef.current.vy = initialSpeed * Math.sin(angle);
    ballRef.current.speed = initialSpeed;
    trailRef.current = [];
  }, []);

  const startGame = useCallback(() => {
    soundEngine.playClick();
    setPlayerScore(0);
    setBotScore(0);
    playerYRef.current = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    botYRef.current = CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2;
    resetBall(true);
    setGameState('playing');
    setBotComment('A.T.S. algorithm deployed. Defend your CV!');

    // Record game played for progressive unlock
    if (onGamePlayed) {
      onGamePlayed();
    }
  }, [resetBall, onGamePlayed]);

  // Handle keyboard inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent browser from scrolling the page
      if (
        ['ArrowUp', 'ArrowDown', 'Space', ' ', 'KeyW', 'KeyS'].includes(e.code) ||
        ['ArrowUp', 'ArrowDown', ' '].includes(e.key)
      ) {
        e.preventDefault();
      }

      if (gameState !== 'playing') {
        if (e.code === 'Space' || e.code === 'Enter') {
          if (gameState === 'menu' || gameState === 'player_won' || gameState === 'bot_won') {
            startGame();
          }
        }
        return;
      }

      if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        isMovingUpRef.current = true;
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        isMovingDownRef.current = true;
      } else if (e.code === 'KeyP') {
        setGameState(prev => (prev === 'playing' ? 'paused' : 'playing'));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (
        ['ArrowUp', 'ArrowDown', 'Space', ' ', 'KeyW', 'KeyS'].includes(e.code) ||
        ['ArrowUp', 'ArrowDown', ' '].includes(e.key)
      ) {
        e.preventDefault();
      }

      if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        isMovingUpRef.current = false;
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        isMovingDownRef.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp, { passive: false });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, startGame]);

  // Auto return to 3D Space Arena on match end/death
  useEffect(() => {
    if ((gameState !== 'bot_won' && gameState !== 'player_won') || autoReturnCountdown === null) return;
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

  // Mouse / Touch paddle tracking
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleY = CANVAS_HEIGHT / rect.height;
    const clientY = e.clientY - rect.top;
    const canvasY = clientY * scaleY;
    playerYRef.current = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, canvasY - PADDLE_HEIGHT / 2));
  };

  // 60FPS Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localPlayerScore = playerScore;
    let localBotScore = botScore;

    const loop = () => {
      // Background CRT field
      ctx.fillStyle = settings.highContrast ? '#000000' : '#040814';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Center Court Net Line (Dotted Vector)
      ctx.strokeStyle = 'rgba(223, 177, 91, 0.25)';
      ctx.lineWidth = 2;
      ctx.setLineDash([12, 10]);
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH / 2, 0);
      ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]);

      if (gameState === 'playing') {
        // 1. Move Player Paddle
        const playerSpeed = 7.5;
        if (isMovingUpRef.current) {
          playerYRef.current = Math.max(0, playerYRef.current - playerSpeed);
        }
        if (isMovingDownRef.current) {
          playerYRef.current = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, playerYRef.current + playerSpeed);
        }

        // 2. Automated A.T.S. Bot AI
        const ball = ballRef.current;
        const botCenter = botYRef.current + PADDLE_HEIGHT / 2;
        const botSpeed = 4.75; // Fair, human-beatable reaction speed

        // Bot only tracks when ball is moving toward it or near middle
        if (ball.vx > 0) {
          if (botCenter < ball.y - 12) {
            botYRef.current = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, botYRef.current + botSpeed);
          } else if (botCenter > ball.y + 12) {
            botYRef.current = Math.max(0, botYRef.current - botSpeed);
          }
        }

        // 3. Move Ball
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Store trail
        trailRef.current.push({ x: ball.x, y: ball.y });
        if (trailRef.current.length > 8) trailRef.current.shift();

        // 4. Wall Collisions (Top & Bottom)
        if (ball.y <= ball.size / 2) {
          ball.y = ball.size / 2;
          ball.vy = Math.abs(ball.vy);
          soundEngine.playPongBeep(false);
        } else if (ball.y >= CANVAS_HEIGHT - ball.size / 2) {
          ball.y = CANVAS_HEIGHT - ball.size / 2;
          ball.vy = -Math.abs(ball.vy);
          soundEngine.playPongBeep(false);
        }

        // 5. Paddle Collisions
        const playerX = 24;
        const botX = CANVAS_WIDTH - 24 - PADDLE_WIDTH;

        // Human Player Paddle Collision (Left)
        if (
          ball.vx < 0 &&
          ball.x - ball.size / 2 <= playerX + PADDLE_WIDTH &&
          ball.x + ball.size / 2 >= playerX &&
          ball.y >= playerYRef.current - 6 &&
          ball.y <= playerYRef.current + PADDLE_HEIGHT + 6
        ) {
          // Calculate deflection based on where it hits the paddle
          const hitOffset = (ball.y - (playerYRef.current + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
          const maxBounceAngle = Math.PI / 3; // 60 degrees
          const bounceAngle = hitOffset * maxBounceAngle;

          ball.speed = Math.min(13, ball.speed + 0.35); // Acceleration
          ball.vx = Math.abs(Math.cos(bounceAngle) * ball.speed);
          ball.vy = Math.sin(bounceAngle) * ball.speed;
          ball.x = playerX + PADDLE_WIDTH + ball.size / 2;

          soundEngine.playPongBeep(true);
        }

        // A.T.S. Bot Paddle Collision (Right)
        if (
          ball.vx > 0 &&
          ball.x + ball.size / 2 >= botX &&
          ball.x - ball.size / 2 <= botX + PADDLE_WIDTH &&
          ball.y >= botYRef.current - 6 &&
          ball.y <= botYRef.current + PADDLE_HEIGHT + 6
        ) {
          const hitOffset = (ball.y - (botYRef.current + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
          const maxBounceAngle = Math.PI / 3;
          const bounceAngle = hitOffset * maxBounceAngle;

          ball.speed = Math.min(13, ball.speed + 0.35);
          ball.vx = -Math.abs(Math.cos(bounceAngle) * ball.speed);
          ball.vy = Math.sin(bounceAngle) * ball.speed;
          ball.x = botX - ball.size / 2;

          soundEngine.playPongBeep(false);
        }

        // 6. Scoring Check
        // Player Scores!
        if (ball.x > CANVAS_WIDTH) {
          localPlayerScore++;
          setPlayerScore(localPlayerScore);
          soundEngine.playPowerup();
          setBotComment('A.T.S. filter pierced! Craftsmanship 1, Buzzword Bot 0.');

          if (localPlayerScore >= WINNING_SCORE) {
            setGameState('player_won');
            soundEngine.playSawVictory();
            onUnlockCV();
            if (onGamePlayed) onGamePlayed();
            if (onReturnTo3D || onPlayerDied) {
              setAutoReturnCountdown(5);
            }
          } else {
            resetBall(false);
          }
        }
        // Bot Scores!
        else if (ball.x < 0) {
          localBotScore++;
          setBotScore(localBotScore);
          soundEngine.playExplosion();
          setBotComment('Auto-rejection triggered. Re-align your defenses!');

          if (localBotScore >= WINNING_SCORE) {
            setGameState('bot_won');
            if (onGamePlayed) onGamePlayed();
            if (onReturnTo3D || onPlayerDied) {
              setAutoReturnCountdown(4);
            }
          } else {
            resetBall(true);
          }
        }
      }

      // --- RENDERING PHASE ---

      // 1. Draw Ball Motion Trail
      trailRef.current.forEach((pos, idx) => {
        const alpha = (idx + 1) / trailRef.current.length * 0.4;
        ctx.fillStyle = `rgba(223, 177, 91, ${alpha})`;
        ctx.fillRect(pos.x - 4, pos.y - 4, 8, 8);
      });

      // 2. Draw Ball
      const ball = ballRef.current;
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#dfb15b';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ball.x - ball.size / 2, ball.y - ball.size / 2, ball.size, ball.size);
      ctx.shadowBlur = 0;

      // 3. Draw Player Paddle (Human - Gold/Cyan)
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#38bdf8';
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(24, playerYRef.current, PADDLE_WIDTH, PADDLE_HEIGHT);

      // 4. Draw A.T.S. Bot Paddle (Red/Crimson)
      ctx.shadowColor = '#ef4444';
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(CANVAS_WIDTH - 24 - PADDLE_WIDTH, botYRef.current, PADDLE_WIDTH, PADDLE_HEIGHT);
      ctx.shadowBlur = 0;

      // 5. Score Display in Arena
      ctx.font = 'bold 36px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
      ctx.fillText(String(localPlayerScore), CANVAS_WIDTH / 2 - 60, 56);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
      ctx.fillText(String(localBotScore), CANVAS_WIDTH / 2 + 60, 56);

      animationFrameId.current = requestAnimationFrame(loop);
    };

    animationFrameId.current = requestAnimationFrame(loop);
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [gameState, playerScore, botScore, settings, resetBall, onUnlockCV]);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-4xl mx-auto rounded-3xl overflow-hidden border-2 border-slate-800 bg-[#040814] shadow-2xl flex flex-col items-center select-none"
    >
      {/* HUD Header */}
      <div className="w-full bg-[#080d1a]/95 border-b border-slate-800/80 px-4 py-3 flex items-center justify-between gap-4 text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[#dfb15b] font-bold">
            <Bot className="w-4 h-4 text-rose-400" />
            <span>PONG // HUMAN CRAFT VS A.T.S. (&ldquo;A T S&rdquo;) BOT</span>
          </div>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px]">
            First to {WINNING_SCORE} PTS Unlocks CV
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

      {/* Main Pong Arena */}
      <div className="relative w-full aspect-[8/5] max-w-[800px] flex items-center justify-center bg-black">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onPointerMove={handlePointerMove}
          className="w-full h-full object-contain cursor-ns-resize touch-none"
        />

        {/* Live Bot Subtitle Status */}
        <div className="absolute top-3 inset-x-0 flex justify-center pointer-events-none">
          <div className="px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700 text-[11px] font-mono text-slate-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{botComment}</span>
          </div>
        </div>

        {/* Menu Screen */}
        {gameState === 'menu' && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center text-[#dfb15b] shadow-[0_0_30px_rgba(223,177,91,0.3)]">
              <FileText className="w-8 h-8" />
            </div>

            <div>
              <div className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold mb-1">
                ARENA 4 // EXECUTIVE CV CHALLENGE
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Pong vs Automated ATS Bot
              </h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto mt-2 leading-relaxed">
                Recruiters and algorithms have screened you out for years. Take control of the human design paddle. Score <strong className="text-[#dfb15b]">{WINNING_SCORE} points</strong> against the automated rejection bot to immediately unlock and inspect Jonny Coke&apos;s full Executive CV.
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 text-xs font-mono text-slate-400 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800">
              <span className="flex items-center gap-1.5 text-sky-300">
                <User className="w-3.5 h-3.5" /> Human Craft: W/S or ↑/↓ or Drag
              </span>
              <span>vs</span>
              <span className="flex items-center gap-1.5 text-rose-300">
                <Bot className="w-3.5 h-3.5" /> Automated A.T.S. (&ldquo;A T S&rdquo;) AI
              </span>
            </div>

            <button
              id="pong-start-match-btn"
              onClick={startGame}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-red-600 text-black font-mono font-black text-sm shadow-xl shadow-amber-500/30 hover:scale-105 transition flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>START PONG MATCH &amp; EARN CV</span>
            </button>
          </div>
        )}

        {/* Paused Screen */}
        {gameState === 'paused' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-3">
            <h4 className="text-xl font-mono font-bold text-white">MATCH PAUSED</h4>
            <button
              onClick={() => setGameState('playing')}
              className="px-6 py-2.5 rounded-xl bg-amber-500 text-black font-mono text-xs font-bold"
            >
              Resume Match
            </button>
          </div>
        )}

        {/* Player Won Screen (CV UNLOCKED!) */}
        {gameState === 'player_won' && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
              <ShieldCheck className="w-9 h-9" />
            </div>

            <div>
              <div className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-widest mb-1">
                A.T.S. (&ldquo;A T S&rdquo;) BOT OVERRIDDEN // VICTORY CONFIRMED
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                Executive CV Successfully Unlocked!
              </h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto mt-2 leading-relaxed">
                You defeated the automated screening bot ({playerScore} - {botScore}). Jonny Coke&apos;s verified credentials, design leadership background, and career history are now permanently unlocked for viewing and download.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {(onReturnTo3D || onPlayerDied) && (
                <button
                  onClick={() => {
                    if (onReturnTo3D) onReturnTo3D();
                    else if (onPlayerDied) onPlayerDied();
                  }}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-mono text-xs font-black transition flex items-center gap-2 shadow-lg shadow-amber-500/20"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Return to 3D Space Arena</span>
                </button>
              )}

              <button
                id="pong-view-cv-now-btn"
                onClick={onNavigateToCV}
                className="px-6 py-3 rounded-2xl bg-[#dfb15b] hover:bg-yellow-400 text-[#080d1a] font-mono font-bold text-xs shadow-xl shadow-[#dfb15b]/25 flex items-center gap-2 transition"
              >
                <FileText className="w-4 h-4" />
                <span>VIEW EXECUTIVE CV NOW</span>
              </button>

              <button
                onClick={startGame}
                className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-semibold flex items-center gap-2 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Play Another Match</span>
              </button>
            </div>
          </div>
        )}

        {/* Bot Won Screen */}
        {gameState === 'bot_won' && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="text-xs font-mono text-rose-400 font-bold uppercase tracking-widest">
              A.T.S. ALGORITHM PREVAILED ({botScore} - {playerScore})
            </div>
            <h3 className="text-2xl font-black text-white">The Robot Defended the Gates</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Match logged! You have unlocked another tier of the portfolio. Defeat the bot to earn the full CV!
            </p>

            <div className="w-full max-w-sm mx-auto p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-mono text-amber-300 flex flex-col items-center gap-1 animate-pulse">
              <span className="font-bold uppercase tracking-wider">PORTFOLIO TIER UNLOCKED</span>
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
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs shadow-lg shadow-rose-600/30 flex items-center gap-2 transition"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Rematch A.T.S. (&ldquo;A T S&rdquo;) Bot</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Touch Paddle Controls */}
      <div className="w-full bg-[#080d1a] border-t border-slate-800/80 p-3 flex sm:hidden items-center justify-around">
        <button
          onMouseDown={() => (isMovingUpRef.current = true)}
          onMouseUp={() => (isMovingUpRef.current = false)}
          onTouchStart={() => (isMovingUpRef.current = true)}
          onTouchEnd={() => (isMovingUpRef.current = false)}
          className="w-24 h-12 rounded-xl bg-slate-800 text-white flex items-center justify-center active:bg-sky-600 font-mono font-bold text-xs gap-1"
        >
          <ArrowUp className="w-4 h-4" />
          <span>UP</span>
        </button>
        <button
          onMouseDown={() => (isMovingDownRef.current = true)}
          onMouseUp={() => (isMovingDownRef.current = false)}
          onTouchStart={() => (isMovingDownRef.current = true)}
          onTouchEnd={() => (isMovingDownRef.current = false)}
          className="w-24 h-12 rounded-xl bg-slate-800 text-white flex items-center justify-center active:bg-sky-600 font-mono font-bold text-xs gap-1"
        >
          <ArrowDown className="w-4 h-4" />
          <span>DOWN</span>
        </button>
      </div>
    </div>
  );
};
