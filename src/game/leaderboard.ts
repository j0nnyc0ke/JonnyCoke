export interface ScoreEntry {
  id: string;
  name: string;
  score: number;
  wave: number;
  date: number;
  unlockedCount: number;
}

export type LeaderboardEntry = ScoreEntry & {
  initials?: string;
  projectsUnlocked?: number;
};

const STORAGE_KEY = 'designInvadersScores';

const DEFAULT_SCORES: ScoreEntry[] = [
  { id: '1', name: 'JCK', score: 2450, wave: 5, date: Date.now() - 86400000 * 3, unlockedCount: 4 },
  { id: '2', name: 'A11', score: 1850, wave: 4, date: Date.now() - 86400000 * 2, unlockedCount: 3 },
  { id: '3', name: 'UXR', score: 1420, wave: 3, date: Date.now() - 86400000, unlockedCount: 3 },
  { id: '4', name: 'W3C', score: 980, wave: 2, date: Date.now() - 3600000 * 12, unlockedCount: 2 },
  { id: '5', name: 'GEO', score: 760, wave: 2, date: Date.now() - 3600000 * 6, unlockedCount: 2 },
  { id: '6', name: 'ACC', score: 540, wave: 1, date: Date.now() - 3600000 * 2, unlockedCount: 1 },
];

export function getLeaderboard(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SCORES));
      return DEFAULT_SCORES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.sort((a: ScoreEntry, b: ScoreEntry) => b.score - a.score);
    }
    return DEFAULT_SCORES;
  } catch {
    return DEFAULT_SCORES;
  }
}

export function saveScore(
  playerName: string,
  score: number,
  wave: number,
  unlockedCount: number
): ScoreEntry[] {
  const cleanName = playerName.trim().toUpperCase().slice(0, 3) || 'YOU';
  const scores = getLeaderboard();
  const newEntry: ScoreEntry = {
    id: 'score_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    name: cleanName,
    score,
    wave,
    date: Date.now(),
    unlockedCount,
  };
  scores.push(newEntry);
  scores.sort((a, b) => b.score - a.score);
  const top10 = scores.slice(0, 10);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(top10));
  } catch {}
  return top10;
}

export function clearLeaderboard(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SCORES));
  } catch {}
}

export function getChallengeShareText(score: number, wave: number): string {
  return `I scored ${score.toLocaleString()} points (Wave ${wave}) in Design Invaders, dismantling bad UX barriers and unlocking Jonny Coke's accessibility portfolio! Can you beat my high score?`;
}
