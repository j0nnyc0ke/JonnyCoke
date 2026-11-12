import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { PORTFOLIO_PROJECTS, PortfolioProject } from '../data/portfolioData';
import { soundEngine } from './audio';
import { saveScore } from './leaderboard';
import { AccessibilitySettings } from './types';
import { PHI, HARMONIC_TIERS, getHarmonicProgress } from '../utils/goldenRatio';
import {
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  RotateCcw,
  Play,
  Zap,
  Lock,
  Unlock,
  ChevronRight,
  Crosshair,
} from 'lucide-react';

interface Props {
  onOpenPortfolio: (projectId?: string) => void;
  onOpenLeaderboard: () => void;
  settings: AccessibilitySettings;
  onUpdateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
  unlockedProjects: string[];
  onUnlockProject: (projectId: string) => void;
  onScoreUpdate?: (score: number) => void;
  onGamePlayed?: () => void;
}

const BAD_DESIGN_PATTERNS = [
  { term: 'Contrast Fail', color: 0xc41230, penalty: 'WCAG AAA 7:1 Violation' },
  { term: 'Messy Grids', color: 0xdfb15b, penalty: 'Zero Proportional Hierarchy' },
  { term: 'Missing Alt Text', color: 0x672288, penalty: 'Screen Reader Barrier' },
  { term: 'Broken Links', color: 0xe11d48, penalty: 'Dead-End Navigation' },
  { term: 'Keyboard Trap', color: 0x9333ea, penalty: 'Accessibility Blocker' },
  { term: 'Cognitive Overload', color: 0x4f46e5, penalty: 'Excessive Visual Density' },
  { term: 'Zero Spacing', color: 0x0284c7, penalty: 'Suffocating Rhythm' },
  { term: 'No Focus Ring', color: 0x0d9488, penalty: 'Motor Navigation Loss' },
  { term: 'Tiny Targets', color: 0xf43f5e, penalty: 'Sub-44px Touch Target' },
  { term: 'Flashing Loops', color: 0x8b5cf6, penalty: 'Vestibular Trigger' },
];

interface Enemy3D {
  mesh: THREE.Group;
  term: string;
  color: number;
  initialX: number;
  initialY: number;
  initialZ: number;
  hp: number;
  points: number;
  width: number;
  height: number;
}

interface Projectile3D {
  mesh: THREE.Mesh;
  oldZ: number;
  velocityZ: number;
  velocityY: number;
  velocityX: number;
  isSurge: boolean;
}

interface ShatterShard3D {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  rx: number;
  ry: number;
  rz: number;
  life: number;
  maxLife: number;
}

export const DesignInvaders3D: React.FC<Props> = ({
  onOpenPortfolio,
  onOpenLeaderboard,
  settings,
  onUpdateSettings,
  unlockedProjects,
  onUnlockProject,
  onScoreUpdate,
  onGamePlayed,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // UI state
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [lives, setLives] = useState(3);
  const [streak, setStreak] = useState(0);
  const [surgeMeter, setSurgeMeter] = useState(0); // 0 - 100
  const [isSurgeActive, setIsSurgeActive] = useState(false);
  const [earnedProjectBanner, setEarnedProjectBanner] = useState<PortfolioProject | null>(null);
  const [playerInitials, setPlayerInitials] = useState('');
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  // Engine refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const playerShipRef = useRef<THREE.Group | null>(null);
  const goldenSpiralMeshRef = useRef<THREE.Points | null>(null);
  const enemiesRef = useRef<Enemy3D[]>([]);
  const projectilesRef = useRef<Projectile3D[]>([]);
  const shardsRef = useRef<ShatterShard3D[]>([]);

  const keysRef = useRef<{ left: boolean; right: boolean; fire: boolean }>({
    left: false,
    right: false,
    fire: false,
  });

  const playerPosRef = useRef<{ x: number; targetX: number; tilt: number }>({
    x: 0,
    targetX: 0,
    tilt: 0,
  });

  const lastFireTimeRef = useRef(0);
  const scoreRef = useRef(0);
  const waveRef = useRef(1);
  const livesRef = useRef(3);
  const streakRef = useRef(0);
  const surgeMeterRef = useRef(0);
  const isSurgeActiveRef = useRef(false);
  const surgeEndTimeRef = useRef(0);
  const animFrameIdRef = useRef<number | null>(null);

  // Sync state to refs
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { waveRef.current = wave; }, [wave]);
  useEffect(() => { livesRef.current = lives; }, [lives]);
  useEffect(() => { streakRef.current = streak; }, [streak]);
  useEffect(() => { surgeMeterRef.current = surgeMeter; }, [surgeMeter]);
  useEffect(() => { isSurgeActiveRef.current = isSurgeActive; }, [isSurgeActive]);

  // Texture helper for 3D anti-pattern monoliths
  const createTextTexture = (text: string, colorHex: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#080d1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = colorHex;
    ctx.lineWidth = 14;
    ctx.strokeRect(7, 7, canvas.width - 14, canvas.height - 14);

    // Header badge
    ctx.fillStyle = colorHex;
    ctx.fillRect(24, 20, 200, 36);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px "JetBrains Mono", monospace';
    ctx.fillText('DESIGN DEFECT', 34, 45);

    // Main anti-pattern text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, canvas.width / 2, 138);

    // Subtitle
    ctx.fillStyle = '#94a3b8';
    ctx.font = '20px "JetBrains Mono", monospace';
    ctx.fillText('TARGET TO RESOLVE', canvas.width / 2, 196);

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 4;
    return texture;
  };

  // Build the 3D Player Ship based on the Logo Aesthetic
  const buildPlayerShip = () => {
    const shipGroup = new THREE.Group();

    // Fuselage
    const bodyGeo = new THREE.ConeGeometry(0.85, 3.0, 6);
    bodyGeo.rotateX(Math.PI / 2);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x242265,
      emissiveIntensity: 0.4,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    shipGroup.add(body);

    // Wings
    const wingGeo = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      0, 0, 0.4,
      -2.5, -0.15, 1.3,
      0, 0, -0.9,
      0, 0, 0.4,
      0, 0, -0.9,
      2.5, -0.15, 1.3,
    ]);
    wingGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    wingGeo.computeVertexNormals();
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0xc41230, // Logo Crimson
      metalness: 0.7,
      roughness: 0.25,
      side: THREE.DoubleSide,
      emissive: 0x672288, // Logo Purple
      emissiveIntensity: 0.3,
    });
    const wings = new THREE.Mesh(wingGeo, wingMat);
    shipGroup.add(wings);

    // Cockpit
    const cockpitGeo = new THREE.DodecahedronGeometry(0.42);
    const cockpitMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      emissive: 0xdfb15b, // Muted Gold accent
      emissiveIntensity: 0.8,
      metalness: 0.2,
      roughness: 0.1,
      transmission: 0.8,
      transparent: true,
      opacity: 0.9,
    });
    const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
    cockpit.position.set(0, 0.32, -0.2);
    cockpit.scale.set(0.65, 0.8, 1.4);
    shipGroup.add(cockpit);

    // Subtle Golden Ratio Halo
    const haloGeo = new THREE.TorusGeometry(1.618, 0.03, 8, 48);
    haloGeo.rotateX(Math.PI / 2);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xdfb15b,
      transparent: true,
      opacity: 0.4,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.set(0, 0, 0.2);
    shipGroup.add(halo);

    return shipGroup;
  };

  // Spawn a wave of 3D Anti-Pattern Targets
  const spawnWaveEnemies = (waveNumber: number) => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clear previous
    enemiesRef.current.forEach(e => scene.remove(e.mesh));
    enemiesRef.current = [];

    const rows = Math.min(3, 2 + Math.floor((waveNumber - 1) / 3));
    const cols = 4;
    const spacingX = 4.2;
    const spacingY = 2.0;
    const startZ = -25;
    const targetWidth = 3.0;
    const targetHeight = 1.4;

    let termIndex = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const item = BAD_DESIGN_PATTERNS[(termIndex + (waveNumber - 1) * 2) % BAD_DESIGN_PATTERNS.length];
        termIndex++;

        const group = new THREE.Group();
        const boxGeo = new THREE.BoxGeometry(targetWidth, targetHeight, 0.7);
        const texture = createTextTexture(item.term, `#${item.color.toString(16).padStart(6, '0')}`);

        const materials = [
          new THREE.MeshStandardMaterial({ color: 0x0b1224, metalness: 0.8, roughness: 0.3 }),
          new THREE.MeshStandardMaterial({ color: 0x0b1224, metalness: 0.8, roughness: 0.3 }),
          new THREE.MeshStandardMaterial({ color: 0x0b1224, metalness: 0.8, roughness: 0.3 }),
          new THREE.MeshStandardMaterial({ color: 0x0b1224, metalness: 0.8, roughness: 0.3 }),
          // Front face with crisp term texture
          new THREE.MeshStandardMaterial({
            map: texture || undefined,
            color: 0xffffff,
            emissive: item.color,
            emissiveIntensity: 0.4,
            metalness: 0.3,
            roughness: 0.2,
          }),
          new THREE.MeshStandardMaterial({ color: 0x080d1a }),
        ];

        const monolith = new THREE.Mesh(boxGeo, materials);
        group.add(monolith);

        // Glowing boundary wire
        const wireGeo = new THREE.EdgesGeometry(boxGeo);
        const wireMat = new THREE.LineBasicMaterial({
          color: item.color,
          linewidth: 2,
        });
        const wire = new THREE.LineSegments(wireGeo, wireMat);
        group.add(wire);

        // Elevation and position: targets are centered vertically around y = 1.2 to 2.8
        const posX = (c - (cols - 1) / 2) * spacingX;
        const posY = 1.0 + (rows - 1 - r) * spacingY;
        const posZ = startZ - r * 1.8;

        group.position.set(posX, posY, posZ);
        scene.add(group);

        enemiesRef.current.push({
          mesh: group,
          term: item.term,
          color: item.color,
          initialX: posX,
          initialY: posY,
          initialZ: posZ,
          hp: 1 + Math.floor(waveNumber / 4),
          points: 55 * (r + 1),
          width: targetWidth,
          height: targetHeight,
        });
      }
    }
  };

  // Shatter animation when hit
  const triggerShatterExplosion = (enemy: Enemy3D) => {
    const scene = sceneRef.current;
    if (!scene) return;

    soundEngine.playHit(true);
    const pos = enemy.mesh.position;
    const shardCount = settings.reducedMotion ? 6 : 16;

    for (let i = 0; i < shardCount; i++) {
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));
      const theta = i * goldenAngle;
      const phi = (Math.random() - 0.5) * Math.PI;
      const speed = (settings.reducedMotion ? 0.15 : 0.32) + Math.random() * 0.3;

      const vx = speed * Math.cos(theta) * Math.cos(phi);
      const vy = speed * Math.sin(phi) + 0.12;
      const vz = speed * Math.sin(theta) * Math.cos(phi);

      const shardGeo = new THREE.TetrahedronGeometry(0.28 + Math.random() * 0.25);
      const shardMat = new THREE.MeshStandardMaterial({
        color: enemy.color,
        emissive: enemy.color,
        emissiveIntensity: 0.9,
        metalness: 0.85,
        roughness: 0.15,
      });

      const shardMesh = new THREE.Mesh(shardGeo, shardMat);
      shardMesh.position.copy(pos);
      scene.add(shardMesh);

      shardsRef.current.push({
        mesh: shardMesh,
        vx,
        vy,
        vz,
        rx: (Math.random() - 0.5) * 0.3,
        ry: (Math.random() - 0.5) * 0.3,
        rz: (Math.random() - 0.5) * 0.3,
        life: 0,
        maxLife: 35 + Math.random() * 15,
      });
    }

    scene.remove(enemy.mesh);
    enemiesRef.current = enemiesRef.current.filter(e => e !== enemy);
  };

  // Fire Torpedo with accurate trajectory into target corridor
  const fireTorpedo = () => {
    const scene = sceneRef.current;
    const ship = playerShipRef.current;
    if (!scene || !ship) return;

    const now = performance.now();
    const cooldown = isSurgeActiveRef.current ? 100 : 200;
    if (now - lastFireTimeRef.current < cooldown) return;
    lastFireTimeRef.current = now;

    soundEngine.playShoot();
    const isSurge = isSurgeActiveRef.current;

    const laserMat = new THREE.MeshBasicMaterial({
      color: isSurge ? 0xdfb15b : 0x38bdf8,
    });

    const laserGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.6, 8);
    laserGeo.rotateX(Math.PI / 2);

    const shipX = ship.position.x;
    const shipY = ship.position.y + 0.2;
    const shipZ = ship.position.z - 1.2;

    // Laser has slight upward velocity (0.055) so it matches the elevation of targets at Z = -25
    const laserSpeedZ = -1.15;
    const laserSpeedY = 0.055;

    if (isSurge) {
      // Triple spread
      [-0.35, 0, 0.35].forEach((angleOffset, idx) => {
        const mesh = new THREE.Mesh(laserGeo, laserMat);
        mesh.position.set(shipX + (idx - 1) * 0.45, shipY, shipZ);
        mesh.rotation.y = angleOffset;
        scene.add(mesh);
        projectilesRef.current.push({
          mesh,
          oldZ: shipZ,
          velocityZ: laserSpeedZ,
          velocityY: laserSpeedY,
          velocityX: angleOffset * 0.5,
          isSurge: true,
        });
      });
    } else {
      // Dual wing pulses
      [-0.65, 0.65].forEach(offsetX => {
        const mesh = new THREE.Mesh(laserGeo, laserMat);
        mesh.position.set(shipX + offsetX, shipY, shipZ);
        scene.add(mesh);
        projectilesRef.current.push({
          mesh,
          oldZ: shipZ,
          velocityZ: laserSpeedZ,
          velocityY: laserSpeedY,
          velocityX: 0,
          isSurge: false,
        });
      });
    }
  };

  // Trigger Precision Velocity Surge
  const triggerSurge = () => {
    if (surgeMeterRef.current < 100 || isSurgeActiveRef.current) return;
    soundEngine.playPrecisionSurge();
    setIsSurgeActive(true);
    setSurgeMeter(0);
    surgeEndTimeRef.current = performance.now() + 6000;
  };

  // Check Harmonic Milestone Unlocks
  const checkMilestoneUnlocks = (newScore: number) => {
    for (const project of PORTFOLIO_PROJECTS) {
      if (!unlockedProjects.includes(project.id) && newScore >= project.unlockScore) {
        onUnlockProject(project.id);
        soundEngine.playHarmonicFanfare();
        setEarnedProjectBanner(project);
        break;
      }
    }
  };

  // Main Three.js Initialization & 60 FPS Loop
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 540;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060a14, 0.02);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 140);
    camera.position.set(0, 4.8, 9.5);
    camera.lookAt(0, 1.8, -16);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.replaceChildren(renderer.domElement);
    rendererRef.current = renderer;

    // Ambient & Directional Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xdfb15b, 1.8);
    sunLight.position.set(6, 12, 6);
    scene.add(sunLight);

    const rimLight = new THREE.PointLight(0xc41230, 2.5, 45);
    rimLight.position.set(0, -2, -14);
    scene.add(rimLight);

    // Dynamic Spatial Grid Floor
    const gridHelper = new THREE.GridHelper(80, 40, 0x38bdf8, 0x1e293b);
    gridHelper.position.set(0, -2.5, -20);
    scene.add(gridHelper);

    // Ambient Golden Ratio Spiral Stars
    const spiralCount = 144;
    const spiralPositions = new Float32Array(spiralCount * 3);
    const spiralColors = new Float32Array(spiralCount * 3);
    for (let i = 0; i < spiralCount; i++) {
      const goldenAngle = Math.PI * (3 - Math.sqrt(5));
      const theta = i * goldenAngle;
      const r = 0.55 * Math.sqrt(i);
      spiralPositions[i * 3] = r * Math.cos(theta);
      spiralPositions[i * 3 + 1] = r * Math.sin(theta) + 3.5;
      spiralPositions[i * 3 + 2] = -40 + (i % 18) * 0.9;

      const t = i / spiralCount;
      spiralColors[i * 3] = THREE.MathUtils.lerp(0.77, 0.87, t); // gold / crimson
      spiralColors[i * 3 + 1] = THREE.MathUtils.lerp(0.07, 0.69, t);
      spiralColors[i * 3 + 2] = THREE.MathUtils.lerp(0.19, 0.36, t);
    }
    const spiralGeo = new THREE.BufferGeometry();
    spiralGeo.setAttribute('position', new THREE.BufferAttribute(spiralPositions, 3));
    spiralGeo.setAttribute('color', new THREE.BufferAttribute(spiralColors, 3));
    const spiralMat = new THREE.PointsMaterial({
      size: 0.32,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
    });
    const goldenSpiral = new THREE.Points(spiralGeo, spiralMat);
    scene.add(goldenSpiral);
    goldenSpiralMeshRef.current = goldenSpiral;

    // Player Ship
    const playerShip = buildPlayerShip();
    playerShip.position.set(0, 0, 3.2);
    scene.add(playerShip);
    playerShipRef.current = playerShip;

    // Spawn Initial Wave
    spawnWaveEnemies(waveRef.current);

    // Resize Observer
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 540;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Main Game Loop
    let lastTimestamp = performance.now();
    const gameLoop = (timestamp: number) => {
      const delta = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
      lastTimestamp = timestamp;

      // Check Surge Expiration
      if (isSurgeActiveRef.current && timestamp >= surgeEndTimeRef.current) {
        setIsSurgeActive(false);
      }

      // Rotate Background Spiral
      if (goldenSpiralMeshRef.current && !settings.reducedMotion) {
        goldenSpiralMeshRef.current.rotation.z += 0.0025;
      }

      // Scroll Grid Floor
      if (gridHelper && !settings.reducedMotion) {
        gridHelper.position.z += (isSurgeActiveRef.current ? 14 : 8) * delta;
        if (gridHelper.position.z > 0) {
          gridHelper.position.z = -20;
        }
      }

      // Physics loop if game active
      if (gameState === 'playing' && playerShipRef.current) {
        const ship = playerShipRef.current;

        // Player lateral steer
        const speed = isSurgeActiveRef.current ? 19 : 14;
        if (keysRef.current.left) {
          playerPosRef.current.targetX -= speed * delta;
        }
        if (keysRef.current.right) {
          playerPosRef.current.targetX += speed * delta;
        }

        playerPosRef.current.targetX = THREE.MathUtils.clamp(
          playerPosRef.current.targetX,
          -9.5,
          9.5
        );

        playerPosRef.current.x = THREE.MathUtils.lerp(
          playerPosRef.current.x,
          playerPosRef.current.targetX,
          14 * delta
        );

        const targetTilt = (playerPosRef.current.targetX - playerPosRef.current.x) * 0.28;
        playerPosRef.current.tilt = THREE.MathUtils.lerp(
          playerPosRef.current.tilt,
          targetTilt,
          12 * delta
        );

        ship.position.x = playerPosRef.current.x;
        ship.rotation.z = -playerPosRef.current.tilt;
        ship.rotation.y = -playerPosRef.current.tilt * 0.35;

        if (!settings.reducedMotion) {
          ship.position.y = Math.sin(timestamp * 0.004) * 0.12;
        }

        if (keysRef.current.fire || settings.autoFire) {
          fireTorpedo();
        }

        // ============================================================
        // ROBUST CONTINUOUS 3D COLLISION DETECTION (HITS & MISSES)
        // ============================================================
        for (let i = projectilesRef.current.length - 1; i >= 0; i--) {
          const p = projectilesRef.current[i];
          const oldZ = p.mesh.position.z;
          p.mesh.position.z += p.velocityZ;
          p.mesh.position.y += p.velocityY;
          p.mesh.position.x += p.velocityX;
          const newZ = p.mesh.position.z;

          let hit = false;
          for (let j = enemiesRef.current.length - 1; j >= 0; j--) {
            const enemy = enemiesRef.current[j];
            const enemyZ = enemy.mesh.position.z;
            const enemyX = enemy.mesh.position.x;
            const enemyY = enemy.mesh.position.y;

            // 1. Z-Interval check: Did projectile pass through enemy depth during this frame?
            const minZ = Math.min(oldZ, newZ) - 0.6;
            const maxZ = Math.max(oldZ, newZ) + 0.6;

            if (enemyZ >= minZ && enemyZ <= maxZ) {
              // 2. Horizontal alignment check (X axis): Target width is ~3.0
              const dx = Math.abs(p.mesh.position.x - enemyX);
              const halfW = enemy.width / 2 + 0.35;

              // 3. Vertical alignment check (Y axis): Target height is ~1.4
              const dy = Math.abs(p.mesh.position.y - enemyY);
              const halfH = enemy.height / 2 + 0.75;

              if (dx <= halfW && dy <= halfH) {
                // CONFIRMED HIT!
                hit = true;
                enemy.hp -= p.isSurge ? 2 : 1;
                if (enemy.hp <= 0) {
                  triggerShatterExplosion(enemy);
                  const earned = enemy.points * (1 + Math.floor(streakRef.current / 3));
                  setScore(prev => {
                    const next = prev + earned;
                    checkMilestoneUnlocks(next);
                    onScoreUpdate?.(next);
                    return next;
                  });
                  setStreak(prev => {
                    const next = prev + 1;
                    setSurgeMeter(m => Math.min(100, m + 10));
                    return next;
                  });
                } else {
                  soundEngine.playHit(false);
                }
                break; // Target hit, stop checking other targets for this projectile
              }
            }
          }

          // If shot hit a target or travelled into deep space (MISSED), clean it up
          if (hit || p.mesh.position.z < -45) {
            scene.remove(p.mesh);
            projectilesRef.current.splice(i, 1);
          }
        }

        // Update Shatter Shards
        for (let i = shardsRef.current.length - 1; i >= 0; i--) {
          const shard = shardsRef.current[i];
          shard.mesh.position.x += shard.vx;
          shard.mesh.position.y += shard.vy;
          shard.mesh.position.z += shard.vz;
          shard.vy -= 0.01;
          shard.mesh.rotation.x += shard.rx;
          shard.mesh.rotation.y += shard.ry;
          shard.mesh.rotation.z += shard.rz;
          shard.life += 1;
          const progress = shard.life / shard.maxLife;
          shard.mesh.scale.setScalar(Math.max(0.01, 1 - progress));
          if (shard.life >= shard.maxLife) {
            scene.remove(shard.mesh);
            shardsRef.current.splice(i, 1);
          }
        }

        // Move Enemy Formation & Check Defense Threshold
        const waveSpeed = (isSurgeActiveRef.current ? 0.4 : 1.0) * (0.8 + waveRef.current * 0.14);
        const waveTime = timestamp * 0.0016 * waveSpeed;
        let breached = false;

        enemiesRef.current.forEach(e => {
          e.mesh.position.x = e.initialX + Math.sin(waveTime) * 2.4;
          e.mesh.position.y = e.initialY + Math.cos(waveTime * 1.5) * 0.35;
          e.mesh.position.z += 0.012 * waveSpeed;

          if (e.mesh.position.z > ship.position.z - 1.2) {
            breached = true;
          }
        });

        if (breached) {
          soundEngine.playGameOver();
          setLives(l => {
            const next = l - 1;
            if (next <= 0) {
              setGameState('gameover');
            }
            return Math.max(0, next);
          });
          enemiesRef.current.forEach(e => {
            e.mesh.position.z = e.initialZ;
          });
        }

        // Wave Cleared
        if (enemiesRef.current.length === 0) {
          soundEngine.playWaveStart();
          setWave(w => {
            const next = w + 1;
            spawnWaveEnemies(next);
            return next;
          });
          setLives(l => Math.min(5, l + 1));
        }
      }

      renderer.render(scene, camera);
      animFrameIdRef.current = requestAnimationFrame(gameLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, [settings.reducedMotion, gameState]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        keysRef.current.left = true;
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        keysRef.current.right = true;
      } else if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
        keysRef.current.fire = true;
        if (gameState === 'playing') e.preventDefault();
      } else if (e.code === 'KeyF' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        triggerSurge();
      } else if (e.code === 'KeyP') {
        setGameState(prev => (prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        keysRef.current.left = false;
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        keysRef.current.right = false;
      } else if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp') {
        keysRef.current.fire = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  // Pointer drag to steer
  const handlePointerMove = (e: React.PointerEvent) => {
    if (gameState !== 'playing' || !mountRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    playerPosRef.current.targetX = normX * 9.5;
  };

  const startGame = () => {
    soundEngine.playWaveStart();
    setGameState('playing');
    setScore(0);
    setWave(1);
    setLives(3);
    setStreak(0);
    setSurgeMeter(0);
    setIsSurgeActive(false);
    spawnWaveEnemies(1);
    if (onGamePlayed) onGamePlayed();
  };

  const progress = getHarmonicProgress(score);

  return (
    <div className="w-full flex flex-col items-center">
      {/* 3D Viewport Stage */}
      <div
        id="design-invaders-3d-stage"
        className="relative w-full max-w-[860px] h-[520px] sm:h-[580px] rounded-3xl overflow-hidden bg-[#070b16] border border-slate-800/80 shadow-2xl select-none"
        onPointerMove={handlePointerMove}
        onPointerDown={() => {
          if (gameState === 'playing') fireTorpedo();
        }}
      >
        <div ref={mountRef} className="w-full h-full cursor-crosshair" />

        {/* Top HUD */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-3 pointer-events-none z-20">
          {/* Score & Multiplier */}
          <div className="flex items-center gap-3 bg-[#0c1427]/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-800 text-xs shadow-lg">
            <Trophy className="w-4 h-4 text-[#dfb15b]" />
            <div>
              <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Mastery Score</div>
              <div className="text-base font-extrabold text-white font-mono leading-none">
                {score.toLocaleString()} <span className="text-[#dfb15b] text-xs">PTS</span>
              </div>
            </div>
            {streak > 2 && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#dfb15b]/20 text-[#fde047] border border-[#dfb15b]/30 animate-pulse">
                {streak}x STREAK
              </span>
            )}
          </div>

          {/* Progress toward next unlock */}
          <div className="hidden sm:flex flex-col items-center bg-[#0c1427]/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-800 text-xs shadow-lg min-w-[220px]">
            <div className="flex items-center justify-between w-full text-[10px] font-mono text-slate-400 mb-1">
              <span>TIER {progress.currentTier + 1} PROGRESS</span>
              <span className="text-[#38bdf8] font-bold">{progress.nextThreshold} PTS</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#080d1a] overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-[#c41230] via-[#672288] to-[#dfb15b] transition-all duration-300"
                style={{ width: `${progress.progressPercent}%` }}
              />
            </div>
          </div>

          {/* Lives & Sound Controls */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="flex items-center gap-1 bg-[#0c1427]/90 backdrop-blur-md px-3 py-2 rounded-2xl border border-slate-800 text-xs">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={`w-2.5 h-4 rounded-sm transition ${
                    i < lives ? 'bg-[#c41230] shadow-sm shadow-[#c41230]/50' : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
            <button
              id="sound-toggle-3d-btn"
              onClick={() => {
                const muted = soundEngine.toggleMute();
                onUpdateSettings({ soundEnabled: !muted });
              }}
              className="p-2 rounded-2xl bg-[#0c1427]/90 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
              title="Toggle Audio"
            >
              {soundEngine.getMuted() ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-[#dfb15b]" />}
            </button>
          </div>
        </div>

        {/* Bottom Bar: Precision Surge */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 pointer-events-none z-20">
          <div className="flex items-center gap-2.5 bg-[#0c1427]/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800 pointer-events-auto shadow-lg">
            <Zap
              className={`w-4 h-4 ${
                surgeMeter >= 100 || isSurgeActive
                  ? 'text-[#dfb15b] animate-bounce'
                  : 'text-slate-500'
              }`}
            />
            <div className="flex flex-col min-w-[130px] sm:min-w-[180px]">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-300 font-bold uppercase tracking-wider">Velocity Surge</span>
                <span className={isSurgeActive ? 'text-[#dfb15b] font-bold' : 'text-slate-400'}>
                  {isSurgeActive ? 'SURGE ACTIVE' : `${surgeMeter}%`}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#080d1a] overflow-hidden border border-slate-800 mt-1">
                <div
                  className={`h-full transition-all duration-200 ${
                    isSurgeActive
                      ? 'bg-gradient-to-r from-[#dfb15b] via-[#c41230] to-[#672288] animate-pulse'
                      : 'bg-[#dfb15b]'
                  }`}
                  style={{ width: `${isSurgeActive ? 100 : surgeMeter}%` }}
                />
              </div>
            </div>
            <button
              id="activate-surge-btn"
              onClick={triggerSurge}
              disabled={surgeMeter < 100 || isSurgeActive}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition ${
                surgeMeter >= 100 && !isSurgeActive
                  ? 'bg-[#dfb15b] hover:bg-[#e5c07b] text-[#080d1a] shadow-md shadow-[#dfb15b]/30'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              Surge [F]
            </button>
          </div>
        </div>

        {/* Start / Intro Screen */}
        {gameState === 'menu' && (
          <div className="absolute inset-0 bg-[#070b16]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30 animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#c41230] via-[#672288] to-[#dfb15b] p-0.5 shadow-2xl mb-4">
              <div className="w-full h-full bg-[#080d1a] rounded-[14px] flex items-center justify-center">
                <Crosshair className="w-8 h-8 text-[#dfb15b]" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
              DESIGN INVADERS <span className="text-[#dfb15b]">3D</span>
            </h1>
            <p className="max-w-md text-xs sm:text-sm text-slate-300 mb-6 leading-relaxed">
              Dismantle hostile UX anti-patterns across three-dimensional space. Aim with precision to hit targets or sweep past them. Earn score milestones to unlock Jonny Coke&apos;s 25+ year portfolio archive and CV!
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
              <button
                id="start-game-3d-btn"
                onClick={startGame}
                className="px-7 py-3 rounded-2xl bg-gradient-to-r from-[#c41230] to-[#672288] hover:opacity-95 text-white font-extrabold text-sm shadow-xl shadow-[#c41230]/25 flex items-center gap-2 transition hover:scale-105"
              >
                <Play className="w-4 h-4 fill-current" />
                Launch 3D Mission
              </button>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
              <span>← / → or Drag: Steer</span>
              <span>•</span>
              <span>Space / Tap: Shoot</span>
              <span>•</span>
              <span>F / Shift: Velocity Surge</span>
            </div>
          </div>
        )}

        {/* Paused Screen */}
        {gameState === 'paused' && (
          <div className="absolute inset-0 bg-[#070b16]/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30">
            <h2 className="text-2xl font-bold text-white mb-4">Flight Paused</h2>
            <button
              onClick={() => setGameState('playing')}
              className="px-6 py-2.5 rounded-xl bg-[#dfb15b] hover:bg-[#e5c07b] text-[#080d1a] font-bold text-xs transition"
            >
              Resume Flight
            </button>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-[#070b16]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-rose-500 mb-1">
              MISSION CONCLUDED
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Anti-pattern barriers breached the defense boundary.
            </p>
            <div className="p-4 rounded-2xl bg-[#0c1427] border border-slate-800 max-w-sm w-full mb-4 text-center">
              <div className="text-xs text-slate-400 font-mono">Final Mastery Score</div>
              <div className="text-3xl font-black text-[#dfb15b] font-mono my-1">
                {score.toLocaleString()} PTS
              </div>
              <div className="text-xs text-slate-400">
                Reached Wave {wave} • {unlockedProjects.length} Portfolio Works Unlocked
              </div>
            </div>

            {!scoreSubmitted ? (
              <div className="flex items-center gap-2 max-w-sm w-full mb-4">
                <input
                  type="text"
                  maxLength={3}
                  placeholder="INITIALS"
                  value={playerInitials}
                  onChange={e => setPlayerInitials(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-2 rounded-xl bg-[#080d1a] border border-slate-700 text-white font-mono text-center tracking-widest text-sm focus:border-[#dfb15b] focus:outline-none"
                />
                <button
                  onClick={() => {
                    if (playerInitials.trim()) {
                      saveScore(playerInitials.trim(), score, wave, unlockedProjects.length);
                      setScoreSubmitted(true);
                    }
                  }}
                  disabled={!playerInitials.trim()}
                  className="px-4 py-2 rounded-xl bg-[#dfb15b] disabled:bg-slate-800 text-[#080d1a] disabled:text-slate-500 font-bold text-xs transition"
                >
                  Save Score
                </button>
              </div>
            ) : (
              <div className="text-xs text-emerald-400 mb-4">✓ Score successfully logged!</div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={startGame}
                className="px-5 py-2.5 rounded-xl bg-[#c41230] hover:bg-[#d3192b] text-white font-bold text-xs flex items-center gap-1.5 transition"
              >
                <RotateCcw className="w-4 h-4" />
                Play Again
              </button>
              <button
                onClick={() => onOpenPortfolio()}
                className="px-5 py-2.5 rounded-xl bg-[#0c1427] hover:bg-slate-850 border border-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition"
              >
                Inspect Portfolio
              </button>
            </div>
          </div>
        )}

        {/* Milestone Unlock Banner */}
        {earnedProjectBanner && (
          <div className="absolute inset-0 bg-[#070b16]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-40 animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-[#dfb15b]/20 border border-[#dfb15b]/40 flex items-center justify-center text-[#dfb15b] mb-3 shadow-lg shadow-[#dfb15b]/20">
              <Unlock className="w-8 h-8" />
            </div>
            <div className="text-[11px] font-mono text-[#dfb15b] uppercase tracking-widest mb-1">
              MILESTONE ACHIEVED
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-1">
              {earnedProjectBanner.title}
            </h3>
            <p className="text-xs text-slate-300 max-w-md mb-2 font-medium">
              {earnedProjectBanner.subtitle}
            </p>
            <p className="text-xs text-slate-400 max-w-sm mb-6 line-clamp-2">
              {earnedProjectBanner.summary}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const targetId = earnedProjectBanner.id;
                  setEarnedProjectBanner(null);
                  onOpenPortfolio(targetId);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#dfb15b] to-[#e5c07b] text-[#080d1a] font-extrabold text-xs shadow-lg shadow-[#dfb15b]/30 flex items-center gap-1.5 transition hover:scale-105"
              >
                Inspect Work
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setEarnedProjectBanner(null)}
                className="px-4 py-2.5 rounded-xl bg-[#0c1427] hover:bg-slate-850 text-slate-300 border border-slate-700 text-xs font-semibold transition"
              >
                Continue Flight
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Under-Game Milestone Progression Ladder */}
      <div className="w-full max-w-[860px] mt-4 p-4 rounded-3xl bg-[#0c1427]/90 border border-slate-800 text-xs backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#dfb15b] animate-pulse" />
            <span className="font-mono text-slate-200 uppercase tracking-wider text-[11px] font-bold">
              Harmonic Progression Matrix
            </span>
          </div>
          <span className="text-slate-400 text-[11px]">
            Points unlock verified client case studies, publications, and credentials
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {HARMONIC_TIERS.map(tier => {
            const projectsInTier = PORTFOLIO_PROJECTS.filter(p => p.harmonicTier === tier.tier);
            const isUnlocked = score >= tier.score || projectsInTier.some(p => unlockedProjects.includes(p.id));
            return (
              <div
                key={tier.tier}
                className={`p-3 rounded-2xl border transition ${
                  isUnlocked
                    ? 'bg-[#dfb15b]/10 border-[#dfb15b]/30 text-[#fde047]'
                    : 'bg-[#080d1a]/80 border-slate-850 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                  <span className="font-bold">{tier.score} PTS</span>
                  {isUnlocked ? (
                    <span className="text-emerald-400 flex items-center gap-0.5">
                      <Unlock className="w-3 h-3" /> Unlocked
                    </span>
                  ) : (
                    <span className="text-slate-500 flex items-center gap-0.5">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  )}
                </div>
                <div className="font-semibold text-xs text-white truncate">
                  {tier.label.split(':')[1] || tier.label}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                  {projectsInTier.map(p => p.title).join(', ') || 'Career Milestone'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
