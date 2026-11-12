export interface BadDesignTerm {
  text: string;
  category: string;
  solutionHint: string;
  hp: number;
  color: string;
  points: number;
}

export const BAD_PRACTICE_TERMS: BadDesignTerm[] = [
  { text: 'Broken Links', category: 'Robustness', solutionHint: 'Valid semantic anchors & redirects', hp: 1, color: '#f43f5e', points: 100 },
  { text: 'Cluttered Layout', category: 'Clarity', solutionHint: 'Generous whitespace & proportional grid', hp: 1, color: '#fb923c', points: 120 },
  { text: 'Poor Contrast', category: 'Perceivable', solutionHint: 'WCAG AAA 7:1 minimum ratio', hp: 1, color: '#facc15', points: 110 },
  { text: 'Missing Alt Text', category: 'Perceivable', solutionHint: 'Descriptive textual equivalents', hp: 1, color: '#a855f7', points: 130 },
  { text: 'Inconsistent Spacing', category: 'Rhythm', solutionHint: 'Structured spatial tokens', hp: 1, color: '#38bdf8', points: 100 },
  { text: 'Keyboard Trap', category: 'Operable', solutionHint: 'Predictable logical tab traversal', hp: 2, color: '#ec4899', points: 180 },
  { text: 'Tiny Tap Targets', category: 'Operable', solutionHint: 'Min 44x44px touch boundary', hp: 2, color: '#e879f9', points: 160 },
  { text: 'Seizure Flashes', category: 'Safety', solutionHint: 'Vestibular-safe kinetic limits', hp: 2, color: '#ef4444', points: 200 },
  { text: 'Invisible Focus', category: 'Operable', solutionHint: 'High-contrast 3px focus indicators', hp: 1, color: '#6366f1', points: 140 },
  { text: 'Nested Modals', category: 'Cognitive', solutionHint: 'Single focus boundary escape', hp: 2, color: '#14b8a6', points: 170 },
  { text: 'Unlabeled Input', category: 'Forms', solutionHint: 'Explicit label & aria-describedby', hp: 1, color: '#06b6d4', points: 130 },
  { text: 'Deceptive Timing', category: 'Autonomy', solutionHint: 'Pause, extend, or eliminate limits', hp: 2, color: '#f97316', points: 190 },
];

export interface InvaderEnemy {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  term: BadDesignTerm;
  hp: number;
  maxHp: number;
  vx: number;
  vy: number;
  initialX: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  radius: number;
  vy: number;
  color: string;
  tokenType: 'dot' | 'square' | 'diamond';
}

export interface ShatterParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  rotation: number;
  vRot: number;
  shape: 'square' | 'pill' | 'check' | 'dot';
}

export interface FloatingNotification {
  id: string;
  text: string;
  x: number;
  y: number;
  alpha: number;
  color: string;
  scale: number;
}

export interface AccessibilitySettings {
  reducedMotion: boolean;
  highContrast: boolean;
  autoFire: boolean;
  soundEnabled: boolean;
}
