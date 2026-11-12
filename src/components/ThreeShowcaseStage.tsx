import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { soundEngine } from '../game/audio';
import {
  Gamepad2,
  Trophy,
  Briefcase,
  FileText,
  Lock,
  Unlock,
  ShieldCheck,
  ShieldAlert,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
  Target,
  ArrowRight,
  Flame,
} from 'lucide-react';

interface ThreeShowcaseStageProps {
  onSelectProject: (projectId?: string) => void;
  onOpenCV: () => void;
  reducedMotion?: boolean;
  onScoreUpdate?: (score: number) => void;
  portfolioEarned?: boolean;
  cvEarned?: boolean;
  isGatekeeperActive?: boolean;
}

export const ThreeShowcaseStage: React.FC<ThreeShowcaseStageProps> = ({
  onSelectProject,
  onOpenCV,
  reducedMotion = false,
  onScoreUpdate,
  portfolioEarned: initialPortfolioEarned = false,
  cvEarned: initialCvEarned = false,
  isGatekeeperActive = false,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Game States: starts in ambient showcase mode (NO auto-playing SFX)
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [health, setHealth] = useState<number>(100);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [portfolioUnlocked, setPortfolioUnlocked] = useState<boolean>(initialPortfolioEarned);
  const [cvUnlocked, setCvUnlocked] = useState<boolean>(initialCvEarned);
  const [isMuted, setIsMuted] = useState<boolean>(soundEngine.getMuted());
  const [autoFire, setAutoFire] = useState<boolean>(false);

  // Milestone Thresholds
  const PORTFOLIO_SCORE = 300;
  const CV_SCORE = 600;

  // Refs for animation loop
  const stateRef = useRef({
    isPlaying: false,
    score: 0,
    health: 100,
    gameOver: false,
    autoFire: false,
    mouse: { x: 0, y: 0 },
    playerPos: { x: 0, y: -2 },
    lastShot: 0,
    lastSpawn: 0,
  });

  // Keep stateRef in sync
  useEffect(() => {
    stateRef.current.isPlaying = isPlaying;
    stateRef.current.autoFire = autoFire;
    stateRef.current.gameOver = gameOver;
  }, [isPlaying, autoFire, gameOver]);

  // Pause game and silence if Gatekeeper chamber is active
  useEffect(() => {
    if (isGatekeeperActive) {
      setIsPlaying(false);
      stateRef.current.isPlaying = false;
    }
  }, [isGatekeeperActive]);

  useEffect(() => {
    setPortfolioUnlocked(initialPortfolioEarned);
  }, [initialPortfolioEarned]);

  useEffect(() => {
    setCvUnlocked(initialCvEarned);
  }, [initialCvEarned]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. SCENE & CAMERA SETUP
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x080d1a, 0.025);

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 12);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. LIGHTING
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const goldLight = new THREE.PointLight(0xdfb15b, 3, 50);
    goldLight.position.set(0, 5, 8);
    scene.add(goldLight);

    const redLight = new THREE.PointLight(0xc41230, 2.5, 50);
    redLight.position.set(-10, -5, 5);
    scene.add(redLight);

    // 3. CYBER TUNNEL & STARFIELD
    const starCount = 350;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 60;
      starPositions[i + 1] = (Math.random() - 0.5) * 40;
      starPositions[i + 2] = -Math.random() * 80;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xdfb15b,
      size: 0.25,
      transparent: true,
      opacity: 0.65,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // Perspective Cyber Grid Floor
    const gridHelper = new THREE.GridHelper(80, 40, 0xdfb15b, 0x1e293b);
    gridHelper.position.y = -6;
    gridHelper.rotation.x = 0;
    scene.add(gridHelper);

    // 4. PLAYER CRAFT ("Design Craft Core")
    const playerGroup = new THREE.Group();

    // Central core hull
    const shipGeo = new THREE.ConeGeometry(0.7, 1.8, 4);
    shipGeo.rotateX(Math.PI / 2);
    const shipMat = new THREE.MeshStandardMaterial({
      color: 0x080d1a,
      emissive: 0xdfb15b,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.9,
    });
    const shipMesh = new THREE.Mesh(shipGeo, shipMat);
    playerGroup.add(shipMesh);

    // Energy wings
    const wingGeo = new THREE.BoxGeometry(2.4, 0.08, 0.8);
    const wingMat = new THREE.MeshBasicMaterial({ color: 0xdfb15b, wireframe: true });
    const wingMesh = new THREE.Mesh(wingGeo, wingMat);
    wingMesh.position.z = -0.3;
    playerGroup.add(wingMesh);

    // Thruster glow
    const thrusterGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const thrusterMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const thrusterMesh = new THREE.Mesh(thrusterGeo, thrusterMat);
    thrusterMesh.position.z = -1;
    playerGroup.add(thrusterMesh);

    playerGroup.position.set(0, -2.5, 6);
    scene.add(playerGroup);

    // 5. BULLETS, OBSTACLES, & COLLECTIBLES ARRAYS
    interface Bullet {
      mesh: THREE.Mesh;
      velocity: THREE.Vector3;
    }
    const bullets: Bullet[] = [];

    interface GameEntity {
      mesh: THREE.Mesh;
      type: 'obstacle' | 'craft_token';
      label: string;
      points: number;
      speed: number;
      rotationSpeed: THREE.Vector3;
    }
    const entities: GameEntity[] = [];

    // Obstacle Labels & Craft Token Labels
    const obstacleLabels = [
      'A.T.S. (A T S) Filter',
      '6-Second Skim',
      'Agency Ghost',
      'Automated Reject',
      'Unpaid Spec Work',
    ];
    const tokenLabels = [
      'WCAG AA Standard',
      'DeWalt Commercial Art',
      'Stanley Die-lines',
      '60 FPS Motion',
      'HeartNeuro Spatial',
    ];

    // Spawn Helper
    const spawnEntity = () => {
      const isToken = Math.random() > 0.45; // 55% tokens, 45% obstacles
      const spawnX = (Math.random() - 0.5) * 14;
      const spawnY = (Math.random() - 0.5) * 6 - 0.5;
      const spawnZ = -60;

      if (isToken) {
        // Collectible Craft Token (Glowing Octahedron / Icosahedron)
        const geo = new THREE.OctahedronGeometry(0.75);
        const mat = new THREE.MeshStandardMaterial({
          color: 0xdfb15b,
          emissive: 0xdfb15b,
          emissiveIntensity: 0.9,
          roughness: 0.2,
          metalness: 0.8,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(spawnX, spawnY, spawnZ);
        scene.add(mesh);

        const label = tokenLabels[Math.floor(Math.random() * tokenLabels.length)];
        entities.push({
          mesh,
          type: 'craft_token',
          label,
          points: 100,
          speed: 0.28 + Math.random() * 0.1,
          rotationSpeed: new THREE.Vector3(0.03, 0.05, 0.02),
        });
      } else {
        // Obstacle: Red ATS Rejection Drone
        const geo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
        const mat = new THREE.MeshStandardMaterial({
          color: 0xc41230,
          emissive: 0x881337,
          emissiveIntensity: 0.8,
          wireframe: false,
          roughness: 0.4,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(spawnX, spawnY, spawnZ);
        scene.add(mesh);

        const label = obstacleLabels[Math.floor(Math.random() * obstacleLabels.length)];
        entities.push({
          mesh,
          type: 'obstacle',
          label,
          points: 50,
          speed: 0.32 + Math.random() * 0.12,
          rotationSpeed: new THREE.Vector3(0.02, 0.02, 0.03),
        });
      }
    };

    // Shoot Bullet Function
    const shootBullet = () => {
      if (!stateRef.current.isPlaying || stateRef.current.gameOver) return;
      soundEngine.playShoot();
      const bulletGeo = new THREE.SphereGeometry(0.18, 8, 8);
      const bulletMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const bulletMesh = new THREE.Mesh(bulletGeo, bulletMat);
      bulletMesh.position.copy(playerGroup.position);
      bulletMesh.position.z -= 0.5;
      scene.add(bulletMesh);
      bullets.push({
        mesh: bulletMesh,
        velocity: new THREE.Vector3(0, 0, -1.2),
      });
    };

    // Pointer move listener
    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      stateRef.current.mouse = { x: x * 6, y: y * 3 - 1.5 };
    };

    // Pointer click listener to shoot
    const handlePointerDown = () => {
      if (stateRef.current.isPlaying && !stateRef.current.gameOver) {
        shootBullet();
      }
    };

    container.addEventListener('mousemove', handlePointerMove);
    container.addEventListener('mousedown', handlePointerDown);

    // Keyboard controls (Space = Shoot, A/D or Left/Right)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (stateRef.current.isPlaying && !stateRef.current.gameOver) {
          e.preventDefault();
          shootBullet();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // 6. MAIN GAME ANIMATION LOOP
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const state = stateRef.current;

      if (!state.isPlaying || state.gameOver) {
        // Gentle ambient flight motion (NO collisions, NO sound effects)
        playerGroup.position.x += (state.mouse.x * 0.4 - playerGroup.position.x) * 0.05;
        playerGroup.position.y += (state.mouse.y * 0.4 - playerGroup.position.y) * 0.05;
        playerGroup.rotation.y += 0.005;
        playerGroup.rotation.z = (playerGroup.position.x - state.mouse.x * 0.4) * 0.08;
        renderer.render(scene, camera);
        return;
      }

      // Smoothly move player craft towards mouse
      playerGroup.position.x += (state.mouse.x - playerGroup.position.x) * 0.12;
      playerGroup.position.y += (state.mouse.y - playerGroup.position.y) * 0.12;
      // Banking tilt
      playerGroup.rotation.z = (playerGroup.position.x - state.mouse.x) * 0.15;
      playerGroup.rotation.x = (playerGroup.position.y - state.mouse.y) * 0.08;

      // Pulse thruster
      thrusterMesh.scale.setScalar(0.8 + Math.sin(clock.getElapsedTime() * 20) * 0.3);

      // Auto-fire check
      if (state.autoFire && Date.now() - state.lastShot > 280) {
        shootBullet();
        state.lastShot = Date.now();
      }

      // Spawn entities
      if (Date.now() - state.lastSpawn > 1100) {
        spawnEntity();
        state.lastSpawn = Date.now();
      }

      // Update Starfield & Grid animation
      const starPos = starGeo.attributes.position.array as Float32Array;
      for (let i = 2; i < starPos.length; i += 3) {
        starPos[i] += 0.8;
        if (starPos[i] > 10) {
          starPos[i] = -80;
        }
      }
      starGeo.attributes.position.needsUpdate = true;
      gridHelper.position.z = (gridHelper.position.z + 0.3) % 4;

      // Update Bullets
      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.mesh.position.add(b.velocity);

        // Remove if off screen
        if (b.mesh.position.z < -70) {
          scene.remove(b.mesh);
          bullets.splice(i, 1);
          continue;
        }

        // Bullet vs Entity collision
        for (let j = entities.length - 1; j >= 0; j--) {
          const ent = entities[j];
          if (b.mesh.position.distanceTo(ent.mesh.position) < 1.6) {
            // Hit!
            soundEngine.playHit();
            scene.remove(b.mesh);
            bullets.splice(i, 1);

            if (ent.type === 'obstacle') {
              soundEngine.playExplosion();
              scene.remove(ent.mesh);
              entities.splice(j, 1);

              // Update Score
              setScore(prev => {
                const nextScore = prev + ent.points;
                state.score = nextScore;
                if (onScoreUpdate) onScoreUpdate(nextScore);

                // Check unlocks
                if (nextScore >= PORTFOLIO_SCORE && !portfolioUnlocked) {
                  setPortfolioUnlocked(true);
                  soundEngine.playLevelUp();
                }
                if (nextScore >= CV_SCORE && !cvUnlocked) {
                  setCvUnlocked(true);
                  soundEngine.playLevelUp();
                }
                return nextScore;
              });
            }
            break;
          }
        }
      }

      // Update Entities
      for (let i = entities.length - 1; i >= 0; i--) {
        const ent = entities[i];
        ent.mesh.position.z += ent.speed;
        ent.mesh.rotation.x += ent.rotationSpeed.x;
        ent.mesh.rotation.y += ent.rotationSpeed.y;

        // Player vs Entity collision
        const distToPlayer = ent.mesh.position.distanceTo(playerGroup.position);
        if (distToPlayer < 1.8) {
          if (ent.type === 'craft_token') {
            // Collected craft token!
            soundEngine.playPowerup();
            scene.remove(ent.mesh);
            entities.splice(i, 1);

            setScore(prev => {
              const nextScore = prev + ent.points;
              state.score = nextScore;
              if (onScoreUpdate) onScoreUpdate(nextScore);

              if (nextScore >= PORTFOLIO_SCORE && !portfolioUnlocked) {
                setPortfolioUnlocked(true);
                soundEngine.playLevelUp();
              }
              if (nextScore >= CV_SCORE && !cvUnlocked) {
                setCvUnlocked(true);
                soundEngine.playLevelUp();
              }
              return nextScore;
            });
            continue;
          } else {
            // Collided with obstacle
            soundEngine.playHit();
            scene.remove(ent.mesh);
            entities.splice(i, 1);

            setHealth(prev => {
              const nextHealth = Math.max(0, prev - 20);
              state.health = nextHealth;
              if (nextHealth <= 0) {
                soundEngine.playGameOver();
                setGameOver(true);
              }
              return nextHealth;
            });
            continue;
          }
        }

        // Remove passed entities
        if (ent.mesh.position.z > 14) {
          scene.remove(ent.mesh);
          entities.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      container.removeEventListener('mousemove', handlePointerMove);
      container.removeEventListener('mousedown', handlePointerDown);

      // Clean scene objects
      bullets.forEach(b => scene.remove(b.mesh));
      entities.forEach(e => scene.remove(e.mesh));
      scene.remove(playerGroup);
      scene.remove(starField);
      scene.remove(gridHelper);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  const handleRestart = () => {
    setScore(0);
    setHealth(100);
    setGameOver(false);
    setIsPlaying(true);
    stateRef.current.score = 0;
    stateRef.current.health = 100;
    stateRef.current.gameOver = false;
    stateRef.current.isPlaying = true;
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* 3D Game Header HUD */}
      <div className="w-full max-w-5xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 px-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#dfb15b]/15 text-[#dfb15b] border border-[#dfb15b]/30">
              <Gamepad2 className="w-3.5 h-3.5" />
              Recruiter Clearance 3D: Defeat the A.T.S. (A T S) &amp; Earn Credentials
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-white mt-1 tracking-tight">
            Earn Jonny Coke&apos;s Portfolio &amp; Executive CV
          </h2>
          <p className="text-xs text-slate-400">
            Pilot the Design Craft Core • Destroy automated A.T.S. filters • Collect craft badges to unlock access
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoFire(!autoFire)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition ${
              autoFire
                ? 'bg-[#dfb15b] text-[#080d1a] font-bold border-[#dfb15b]'
                : 'bg-[#0c1427] border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Auto-Fire: {autoFire ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Viewport */}
      <div className="relative w-full max-w-5xl h-[480px] sm:h-[560px] bg-[#050811] rounded-3xl border-2 border-slate-800 overflow-hidden shadow-2xl group">
        
        {/* Three.js Container */}
        <div ref={mountRef} className="w-full h-full cursor-crosshair" />

        {/* Top Overlay HUD Bar */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-3 pointer-events-none">
          {/* Score & Integrity */}
          <div className="flex items-center gap-3 bg-[#0c1427]/85 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700/80 shadow-lg pointer-events-auto">
            <div className="font-mono">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                Clearance Score
              </span>
              <span className="text-xl font-black text-[#dfb15b]">{score}</span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                Core Integrity
              </span>
              <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full transition-all duration-300 ${
                    health > 50
                      ? 'bg-emerald-400'
                      : health > 20
                      ? 'bg-amber-400'
                      : 'bg-rose-500 animate-pulse'
                  }`}
                  style={{ width: `${health}%` }}
                />
              </div>
            </div>
          </div>

          {/* Unlock Status Badges with Instant Jumps */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Portfolio Unlock Pill */}
            <div
              className={`px-3 py-2 rounded-2xl border flex items-center gap-2 transition-all ${
                portfolioUnlocked
                  ? 'bg-emerald-950/80 border-emerald-500/70 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : 'bg-[#0c1427]/85 border-slate-800 text-slate-400'
              }`}
            >
              {portfolioUnlocked ? (
                <>
                  <Unlock className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Portfolio Unlocked!</span>
                  <button
                    onClick={() => onSelectProject()}
                    className="ml-1 px-2 py-0.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#080d1a] font-black text-[10px] transition"
                  >
                    VIEW
                  </button>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-mono">Portfolio: 300 Pts</span>
                </>
              )}
            </div>

            {/* CV Unlock Pill */}
            <div
              className={`px-3 py-2 rounded-2xl border flex items-center gap-2 transition-all ${
                cvUnlocked
                  ? 'bg-[#dfb15b]/20 border-[#dfb15b]/70 text-[#dfb15b] shadow-[0_0_15px_rgba(223,177,91,0.3)]'
                  : 'bg-[#0c1427]/85 border-slate-800 text-slate-400'
              }`}
            >
              {cvUnlocked ? (
                <>
                  <Unlock className="w-4 h-4 text-[#dfb15b]" />
                  <span className="text-xs font-bold text-white">CV Unlocked!</span>
                  <button
                    onClick={onOpenCV}
                    className="ml-1 px-2 py-0.5 rounded-lg bg-[#dfb15b] hover:bg-[#e5c07b] text-[#080d1a] font-black text-[10px] transition"
                  >
                    VIEW
                  </button>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-mono">CV: 600 Pts</span>
                </>
              )}
            </div>

            {/* Play / Standby Toggle Button */}
            <button
              id="three-stage-toggle-play-btn"
              onClick={() => {
                soundEngine.playClick();
                setIsPlaying(prev => !prev);
              }}
              className={`px-3 py-2 rounded-2xl border flex items-center gap-1.5 text-xs font-mono font-bold transition shadow-md ${
                isPlaying
                  ? 'bg-amber-950/80 border-amber-600/70 text-amber-300 hover:bg-amber-900/80'
                  : 'bg-[#dfb15b] hover:bg-[#e5c07b] text-[#080d1a] border-[#dfb15b]'
              }`}
            >
              {isPlaying ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>PAUSE FLIGHT</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>START 3D FLIGHT</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Ambient Showcase Overlay with Manual Play Button */}
        {!isPlaying && !gameOver && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center z-10 pointer-events-auto">
            <div className="bg-[#0c1427]/95 border border-slate-700/80 p-6 rounded-3xl max-w-sm shadow-2xl flex flex-col items-center space-y-3">
              <div className="p-3 rounded-2xl bg-[#dfb15b]/20 text-[#dfb15b] border border-[#dfb15b]/40">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">3D Flight Stage</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Pilot the geometric craft through space, collect golden craft tokens, and destroy ATS obstacles to unlock portfolio &amp; CV.
              </p>
              <button
                id="three-stage-start-btn"
                onClick={() => {
                  soundEngine.playClick();
                  setIsPlaying(true);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#dfb15b] to-amber-500 hover:opacity-95 text-[#080d1a] font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>ENGAGE FLIGHT SIMULATOR</span>
              </button>
              <span className="text-[10px] font-mono text-slate-400">
                Ambient showcase active • Sound effects only trigger during flight
              </span>
            </div>
          </div>
        )}

        {/* On-Canvas Instructions & Crosshair */}
        <div className="absolute bottom-4 left-4 pointer-events-none bg-[#0c1427]/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800/80 text-[11px] text-slate-300">
          <span className="font-mono text-[#dfb15b]">CONTROLS:</span> Move mouse to pilot • Click / Space to fire lasers • Catch golden craft tokens
        </div>

        {/* Game Over / Victory Modal Overlay */}
        {gameOver && (
          <div className="absolute inset-0 bg-[#080d1a]/90 backdrop-blur-lg flex flex-col items-center justify-center p-6 text-center space-y-4 z-20">
            <div className="p-3 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-white">Core Shield Depleted</h3>
            <p className="text-xs text-slate-300 max-w-md">
              The A.T.S. (&ldquo;A T S&rdquo;) rejection loop overwhelmed the ship. But you earned <strong className="text-[#dfb15b]">{score} clearance points</strong>!
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleRestart}
                className="px-5 py-2.5 rounded-xl bg-[#dfb15b] hover:bg-[#e5c07b] text-[#080d1a] font-bold text-xs flex items-center gap-2 shadow-lg"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
              {portfolioUnlocked && (
                <button
                  onClick={() => onSelectProject()}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <Briefcase className="w-4 h-4 text-[#dfb15b]" />
                  <span>View Earned Portfolio</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Explanatory Recruiter Callout */}
      <div className="w-full max-w-5xl mt-3 p-4 rounded-2xl bg-[#0c1427]/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-300">
        <div className="flex items-center gap-2.5">
          <Flame className="w-4 h-4 text-[#dfb15b] shrink-0" />
          <span>
            <strong className="text-white">Why this game exists:</strong> Rather than passive resume screening, this 3D WebGL engine proves firsthand Jonny Coke&apos;s senior competencies in real-time 3D geometry, interactive collision systems, and accessibility.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onSelectProject()}
            disabled={!portfolioUnlocked}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition ${
              portfolioUnlocked
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-slate-850 text-slate-500 border border-slate-800 cursor-not-allowed'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Portfolio</span>
            {portfolioUnlocked ? <Unlock className="w-3 h-3 text-emerald-400" /> : <Lock className="w-3 h-3 text-amber-400" />}
          </button>
          <button
            onClick={onOpenCV}
            disabled={!cvUnlocked}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition ${
              cvUnlocked
                ? 'bg-[#dfb15b]/20 text-[#dfb15b] border border-[#dfb15b]/40 hover:bg-[#dfb15b]/30'
                : 'bg-slate-850 text-slate-500 border border-slate-800 cursor-not-allowed'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Executive CV</span>
            {cvUnlocked ? <Unlock className="w-3 h-3 text-[#dfb15b]" /> : <Lock className="w-3 h-3 text-amber-400" />}
          </button>
        </div>
      </div>
    </div>
  );
};
