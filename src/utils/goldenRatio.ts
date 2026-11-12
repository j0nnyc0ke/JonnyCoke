// Mathematical Golden Ratio & Spiral Architecture
// Used to govern spatial grids, harmonic layout proportions, and milestone unlock thresholds

export const PHI = 1.618033988749895;

export const HARMONIC_TIERS = [
  { score: 55, label: 'Tier 1: Foundation & Identity', tier: 1 },
  { score: 144, label: 'Tier 2: Public Sector & Transport Systems', tier: 2 },
  { score: 233, label: 'Tier 3: Global Diplomacy & Royal Assemblies', tier: 3 },
  { score: 377, label: 'Tier 4: Academic Publishing & Geological Fellowship', tier: 4 },
  { score: 610, label: 'Tier 5: Clinical Publishing & Augmented Reality', tier: 5 },
  { score: 987, label: 'Tier 6: High Velocity Media & PPA Honors', tier: 6 },
  { score: 1597, label: 'Tier 7: Sensory-Conscious Social Architecture', tier: 7 },
  { score: 2584, label: 'Tier 8: Career Retrospective & CV', tier: 8 },
] as const;

/**
 * Calculates a 2D coordinate along a natural logarithmic spiral
 * @param index - Point index along the growth trajectory
 * @param scale - Radial expansion constant
 */
export function getGoldenSpiralPoint(index: number, scale: number = 0.4) {
  // Golden divergence angle: ~137.5 degrees (2 * PI * (1 - 1/PHI))
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const theta = index * goldenAngle;
  const radius = scale * Math.sqrt(index);
  return {
    x: radius * Math.cos(theta),
    y: radius * Math.sin(theta),
    radius,
    theta,
  };
}

/**
 * Calculates progress toward the next harmonic milestone
 */
export function getHarmonicProgress(score: number): {
  currentTier: number;
  nextThreshold: number;
  progressPercent: number;
  tierLabel: string;
} {
  for (let i = 0; i < HARMONIC_TIERS.length; i++) {
    const tier = HARMONIC_TIERS[i];
    if (score < tier.score) {
      const prevScore = i === 0 ? 0 : HARMONIC_TIERS[i - 1].score;
      const progress = Math.min(
        100,
        Math.max(0, ((score - prevScore) / (tier.score - prevScore)) * 100)
      );
      return {
        currentTier: i,
        nextThreshold: tier.score,
        progressPercent: progress,
        tierLabel: tier.label,
      };
    }
  }

  return {
    currentTier: HARMONIC_TIERS.length,
    nextThreshold: HARMONIC_TIERS[HARMONIC_TIERS.length - 1].score,
    progressPercent: 100,
    tierLabel: 'Tier 8: Complete Portfolio & CV Access',
  };
}
