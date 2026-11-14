import React, { useState, useEffect } from 'react';
import { DesignInvaders3D } from './game/DesignInvaders3D';
import { DesignInvadersCanvas } from './game/DesignInvadersCanvas';
import { AsteroidsCanvas } from './game/AsteroidsCanvas';
import { PongCanvas } from './game/PongCanvas';
import { ThreeBackground } from './components/ThreeBackground';
import { ThreeShowcaseStage } from './components/ThreeShowcaseStage';
import { PortfolioViewer } from './components/PortfolioViewer';
import { CVViewer } from './components/CVViewer';
import { LeaderboardModal } from './components/LeaderboardModal';
import { MotionCursorTrail } from './components/MotionCursorTrail';
import { AccessibilitySettings } from './game/types';
import { CREATOR_PROFILE, PORTFOLIO_PROJECTS } from './data/portfolioData';
import { getLeaderboard } from './game/leaderboard';
import { soundEngine } from './game/audio';
import {
  Gamepad2,
  Trophy,
  Briefcase,
  FileText,
  Sparkles,
  Volume2,
  VolumeX,
  Eye,
  Sliders,
  UploadCloud,
  Move3d,
  Layers,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Rocket,
  Bot,
  Download,
  FolderArchive,
  X,
} from 'lucide-react';
import { RecruiterIntroGatekeeper } from './components/RecruiterIntroGatekeeper';

export default function App() {
  // Navigation View: '3d' | '2d' | 'portfolio' | 'cv'
  const [currentView, setCurrentView] = useState<'3d' | '2d' | 'portfolio' | 'cv'>('3d');
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);

  // Active 2D Game: 'asteroids' | 'pong' | 'invaders'
  const [active2dGame, setActive2dGame] = useState<'asteroids' | 'pong' | 'invaders'>('asteroids');

  // Unique arcade games played tracker for progressive 1/3 unlock (1 game = 1/3, 2 games = 2/3, 3+ games = 3/3)
  const [playedGames, setPlayedGames] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('coke_unique_games_played');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Progression notification toast
  const [progressionToast, setProgressionToast] = useState<{
    gameName: string;
    fraction: string;
    caseStudyCount: number;
  } | null>(null);

  // Recruiter Gatekeeper: The site MUST start in the reverse recruiters chamber
  const [gatekeeperDismissed, setGatekeeperDismissed] = useState<boolean>(false);
  const [showGatekeeperModal, setShowGatekeeperModal] = useState<boolean>(false);

  // All content must be locked and inaccessible until games are played
  const [unlockedProjects, setUnlockedProjects] = useState<string[]>([]);

  // Accessibility & gameplay settings
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    reducedMotion: false,
    soundEnabled: true,
    autoFire: false,
  });

  // Modals
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showPrivateExportModal, setShowPrivateExportModal] = useState(false);

  // Private owner export shortcut (Press Shift+D or open with ?download=true)
  // Kept 100% invisible to normal public website visitors
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        setShowPrivateExportModal(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    if (window.location.search.includes('download=true') || window.location.search.includes('export=true')) {
      setShowPrivateExportModal(true);
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const PORTFOLIO_REQUIRED_SCORE = 300;
  const CV_REQUIRED_SCORE = 600;

  // High score tracking & earned access
  const [topScore, setTopScore] = useState<number>(0);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [portfolioEarned, setPortfolioEarned] = useState<boolean>(() => {
    return localStorage.getItem('coke_portfolio_earned') === 'true';
  });
  const [cvEarned, setCvEarned] = useState<boolean>(() => {
    return localStorage.getItem('coke_cv_earned') === 'true';
  });

  // Synchronize progressive unlock based on unique arcade games played
  useEffect(() => {
    const uniqueCount = playedGames.length;
    if (uniqueCount > 0) {
      let unlockedSliceCount = 0;
      if (uniqueCount === 1) unlockedSliceCount = Math.ceil(PORTFOLIO_PROJECTS.length / 3);
      else if (uniqueCount === 2) unlockedSliceCount = Math.ceil((PORTFOLIO_PROJECTS.length * 2) / 3);
      else if (uniqueCount >= 3) {
        unlockedSliceCount = PORTFOLIO_PROJECTS.length;
        setPortfolioEarned(true);
      }
      const projectsToUnlock = PORTFOLIO_PROJECTS.slice(0, unlockedSliceCount).map(p => p.id);
      setUnlockedProjects(existing => Array.from(new Set([...existing, ...projectsToUnlock])));
    }
  }, [playedGames]);

  // Handle unique game played progression event
  const handleGamePlayed = (gameId: string) => {
    setPlayedGames(prev => {
      if (prev.includes(gameId)) return prev;
      const next = [...prev, gameId];
      try {
        localStorage.setItem('coke_unique_games_played', JSON.stringify(next));
      } catch {}

      const uniqueCount = next.length;
      let unlockedSliceCount = 0;
      if (uniqueCount === 1) unlockedSliceCount = Math.ceil(PORTFOLIO_PROJECTS.length / 3);
      else if (uniqueCount === 2) unlockedSliceCount = Math.ceil((PORTFOLIO_PROJECTS.length * 2) / 3);
      else if (uniqueCount >= 3) {
        unlockedSliceCount = PORTFOLIO_PROJECTS.length;
        setPortfolioEarned(true);
        try { localStorage.setItem('coke_portfolio_earned', 'true'); } catch {}
      }

      const projectsToUnlock = PORTFOLIO_PROJECTS.slice(0, unlockedSliceCount).map(p => p.id);
      setUnlockedProjects(existing => Array.from(new Set([...existing, ...projectsToUnlock])));

      soundEngine.playLevelUp();

      const gameNames: Record<string, string> = {
        '3d-invaders': 'Design Invaders 3D',
        '2d-invaders': 'Design Invaders 2D',
        'asteroids': 'Vector Asteroids',
        'pong': 'Pong vs A.T.S. Bot',
      };

      setProgressionToast({
        gameName: gameNames[gameId] || gameId,
        fraction: `${Math.min(3, uniqueCount)}/3`,
        caseStudyCount: unlockedSliceCount,
      });

      setTimeout(() => setProgressionToast(null), 5000);
      return next;
    });
  };

  useEffect(() => {
    const scores = getLeaderboard();
    if (scores.length > 0) {
      const top = scores[0].score;
      setTopScore(top);
      if (top >= PORTFOLIO_REQUIRED_SCORE) {
        setPortfolioEarned(true);
        localStorage.setItem('coke_portfolio_earned', 'true');
      }
      if (top >= CV_REQUIRED_SCORE) {
        setCvEarned(true);
        localStorage.setItem('coke_cv_earned', 'true');
      }
    }
  }, []);

  const handleScoreUpdate = (newScore: number) => {
    setCurrentScore(newScore);
    if (newScore >= PORTFOLIO_REQUIRED_SCORE && !portfolioEarned) {
      setPortfolioEarned(true);
      localStorage.setItem('coke_portfolio_earned', 'true');
    }
    if (newScore >= CV_REQUIRED_SCORE && !cvEarned) {
      setCvEarned(true);
      localStorage.setItem('coke_cv_earned', 'true');
    }
  };

  const handleUpdateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const handleUnlockProject = (projectId: string) => {
    setUnlockedProjects(prev => (prev.includes(projectId) ? prev : [...prev, projectId]));
  };

  const handleOpenPortfolioWithProject = (projectId?: string) => {
    if (projectId) setSelectedProjectId(projectId);
    setCurrentView('portfolio');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenCV = () => {
    setCvEarned(true);
    try {
      localStorage.setItem('coke_cv_earned', 'true');
    } catch {}
    setCurrentView('cv');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      className={`min-h-screen text-slate-100 flex flex-col selection:bg-[#dfb15b] selection:text-[#080d1a] relative ${
        settings.highContrast ? 'bg-[#030508]' : 'bg-[#080d1a]'
      }`}
    >
      {/* Dynamic Ambient 3D Background */}
      <ThreeBackground
        reducedMotion={settings.reducedMotion}
        intensity={currentView === '3d' ? 'immersive' : 'ambient'}
      />

      {/* Motion-Reactive Cursor Trail (Appears exclusively in 3D and 2D Arcade views; respects reducedMotion) */}
      <MotionCursorTrail
        enabled={(currentView === '3d' || currentView === '2d') && gatekeeperDismissed && !showGatekeeperModal}
        reducedMotion={settings.reducedMotion}
      />

      {/* PROMINENT HEADER WITH LOGO (image.png) */}
      <header className="sticky top-0 z-40 bg-[#080d1a]/85 backdrop-blur-xl border-b border-slate-800/80 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Logo & Designer Identity */}
          <button
            id="brand-header-home-btn"
            onClick={() => {
              setCurrentView('3d');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-3.5 text-left group focus:outline-none"
          >
            {/* Prominent Logo Container - OFFICIAL Jonny Coke Monogram */}
            <div className="h-14 sm:h-16 w-10 sm:w-12 flex items-center justify-center transition group-hover:scale-105 shrink-0">
              <img
                src="./image.png?v=3"
                alt="Official Jonny Coke Logo"
                className="w-full h-full object-contain drop-shadow-md"
                referrerPolicy="no-referrer"
              />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-extrabold text-white tracking-tight group-hover:text-[#dfb15b] transition">
                  {CREATOR_PROFILE.name}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#dfb15b]/15 text-[#dfb15b] border border-[#dfb15b]/30 hidden sm:inline-block">
                  SENIOR DESIGNER
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium truncate max-w-[200px] sm:max-w-xs">
                Accessibility &amp; Motion Specialist
              </p>
            </div>
          </button>

          {/* Primary View Navigation */}
          <nav className="hidden md:flex items-center gap-1.5 bg-[#0c1427]/90 p-1.5 rounded-2xl border border-slate-800 text-xs font-semibold">
            <button
              id="nav-tab-3d"
              onClick={() => {
                soundEngine.playClick();
                setCurrentView('3d');
              }}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 ${
                currentView === '3d'
                  ? 'bg-gradient-to-r from-[#c41230] to-[#672288] text-white shadow-md shadow-[#c41230]/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Move3d className="w-3.5 h-3.5" />
              <span>3D Experience</span>
            </button>

            <button
              id="nav-tab-2d"
              onClick={() => {
                soundEngine.playClick();
                setCurrentView('2d');
              }}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 ${
                currentView === '2d'
                  ? 'bg-[#dfb15b] text-[#080d1a] shadow-md shadow-[#dfb15b]/20 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>2D Arcade</span>
            </button>

            <button
              id="nav-tab-portfolio"
              onClick={() => {
                soundEngine.playClick();
                setCurrentView('portfolio');
              }}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 ${
                currentView === 'portfolio'
                  ? 'bg-gradient-to-r from-[#0c1427] to-[#1e1b4b] border border-[#dfb15b]/40 text-[#dfb15b] font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Portfolio</span>
              {!portfolioEarned && (
                <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Lock className="w-2.5 h-2.5" />
                  Earn
                </span>
              )}
            </button>

            <button
              id="nav-tab-cv"
              onClick={() => {
                soundEngine.playClick();
                handleOpenCV();
              }}
              className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 ${
                currentView === 'cv'
                  ? 'bg-gradient-to-r from-[#dfb15b] to-[#c41230] text-black shadow-md shadow-amber-500/20 font-black'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>CV &amp; QR Code</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-black/40 text-amber-300 border border-amber-500/30">
                AR
              </span>
            </button>
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2">
            <button
              id="header-recruiter-gatekeeper-btn"
              onClick={() => {
                soundEngine.playSawClank();
                setShowGatekeeperModal(true);
              }}
              className="px-2.5 sm:px-3 py-2 rounded-xl bg-red-950/70 hover:bg-red-900/80 border border-red-700/60 text-red-300 hover:text-white transition flex items-center gap-1.5 text-xs font-mono font-bold shadow-md shadow-red-950/50"
              title="Reverse-Recruiter Chamber (Jigsaw Gatekeeper)"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              <span className="hidden sm:inline-block">Recruiter Chamber</span>
            </button>

            <button
              id="header-leaderboard-btn"
              onClick={() => setShowLeaderboard(true)}
              className="p-2.5 rounded-xl bg-[#0c1427] hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-[#dfb15b] transition flex items-center gap-1.5 text-xs font-mono"
              title="Arcade Hall of Fame"
            >
              <Trophy className="w-4 h-4 text-[#dfb15b]" />
              <span className="hidden sm:inline-block font-bold">
                {topScore > 0 ? topScore.toLocaleString() : 'Scores'}
              </span>
            </button>

            <button
              id="header-sound-btn"
              onClick={() => {
                const muted = soundEngine.toggleMute();
                handleUpdateSettings({ soundEnabled: !muted });
              }}
              className="p-2.5 rounded-xl bg-[#0c1427] hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
              title={settings.soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
            >
              {settings.soundEnabled ? (
                <Volume2 className="w-4 h-4 text-[#dfb15b]" />
              ) : (
                <VolumeX className="w-4 h-4 text-rose-400" />
              )}
            </button>

            <button
              id="header-settings-toggle-btn"
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className="p-2.5 rounded-xl bg-[#0c1427] hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition"
              title="Accessibility & Display Settings"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex md:hidden border-t border-slate-850 bg-[#0c1427]/95 px-2 py-1.5 justify-around text-xs font-semibold">
          <button
            onClick={() => setCurrentView('3d')}
            className={`py-1.5 px-2.5 rounded-lg flex items-center gap-1 ${
              currentView === '3d' ? 'text-[#dfb15b] font-bold' : 'text-slate-400'
            }`}
          >
            <Move3d className="w-3.5 h-3.5" />
            <span>3D Play</span>
          </button>
          <button
            onClick={() => setCurrentView('2d')}
            className={`py-1.5 px-2.5 rounded-lg flex items-center gap-1 ${
              currentView === '2d' ? 'text-[#dfb15b] font-bold' : 'text-slate-400'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>2D Play</span>
          </button>
          <button
            onClick={() => setCurrentView('portfolio')}
            className={`py-1.5 px-2.5 rounded-lg flex items-center gap-1 ${
              currentView === 'portfolio' ? 'text-[#dfb15b] font-bold' : 'text-slate-400'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Portfolio</span>
            {!portfolioEarned && <Lock className="w-2.5 h-2.5 text-amber-400" />}
          </button>
          <button
            onClick={() => setCurrentView('cv')}
            className={`py-1.5 px-2.5 rounded-lg flex items-center gap-1 ${
              currentView === 'cv' ? 'text-[#dfb15b] font-bold' : 'text-slate-400'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#dfb15b]" />
            <span>AR CV</span>
            {!cvEarned && <Lock className="w-2.5 h-2.5 text-amber-400" />}
          </button>
        </div>
      </header>

      {/* Settings Dropdown Popover */}
      {showSettingsMenu && (
        <div className="fixed top-24 right-4 sm:right-8 z-50 w-72 bg-[#0c1427] border border-slate-800 rounded-2xl p-4 shadow-2xl text-xs space-y-3">
          <div className="font-bold text-white uppercase font-mono tracking-wider text-[11px] pb-2 border-b border-slate-800 flex items-center justify-between">
            <span>ACCESSIBILITY CONTROLS</span>
            <button
              onClick={() => setShowSettingsMenu(false)}
              className="text-slate-500 hover:text-white"
            >
              ✕
            </button>
          </div>
          <label className="flex items-center justify-between cursor-pointer text-slate-300">
            <span>High Contrast</span>
            <input
              type="checkbox"
              checked={settings.highContrast}
              onChange={e => handleUpdateSettings({ highContrast: e.target.checked })}
              className="accent-[#dfb15b]"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer text-slate-300">
            <span>Reduced Motion</span>
            <input
              type="checkbox"
              checked={settings.reducedMotion}
              onChange={e => handleUpdateSettings({ reducedMotion: e.target.checked })}
              className="accent-[#dfb15b]"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer text-slate-300">
            <span>Auto-Fire Cannons</span>
            <input
              type="checkbox"
              checked={settings.autoFire}
              onChange={e => handleUpdateSettings({ autoFire: e.target.checked })}
              className="accent-[#dfb15b]"
            />
          </label>
        </div>
      )}

      {/* MAIN CONTAINER CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* VIEW 1: 3D SPATIAL EXPERIENCE & 3D INVADERS */}
        {currentView === '3d' && (
          <div className="space-y-12 animate-in fade-in duration-300">
            {/* 3D Game Section */}
            <section className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-[#dfb15b]/15 text-[#dfb15b] border border-[#dfb15b]/30">
                    <Sparkles className="w-3.5 h-3.5" />
                    REAL-TIME 3D COLLISION DETECTION ENGINE
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1 tracking-tight">
                    Design Invaders 3D: Defend Accessible Interfaces
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    id="switch-to-2d-mode-btn"
                    onClick={() => setCurrentView('2d')}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#0c1427] hover:bg-slate-800 text-slate-300 border border-slate-800 transition flex items-center gap-1.5"
                  >
                    <Gamepad2 className="w-3.5 h-3.5 text-[#dfb15b]" />
                    Switch to 2D Canvas Mode
                  </button>
                  <button
                    id="hero-open-cv-btn"
                    onClick={handleOpenCV}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-[#dfb15b] to-[#c41230] text-black hover:opacity-90 transition flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Launch AR CV</span>
                  </button>
                </div>
              </div>

              {/* 3D Game Canvas & Controls */}
              <DesignInvaders3D
                onOpenPortfolio={handleOpenPortfolioWithProject}
                onOpenLeaderboard={() => setShowLeaderboard(true)}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                unlockedProjects={unlockedProjects}
                onUnlockProject={handleUnlockProject}
                onScoreUpdate={handleScoreUpdate}
                onGamePlayed={() => handleGamePlayed('3d-invaders')}
              />
            </section>

            {/* 3D WebGL Showcase Stage */}
            <section className="pt-6 border-t border-slate-800/80">
              <ThreeShowcaseStage
                onSelectProject={handleOpenPortfolioWithProject}
                onOpenCV={handleOpenCV}
                reducedMotion={settings.reducedMotion}
                isGatekeeperActive={!gatekeeperDismissed || showGatekeeperModal}
              />
            </section>
          </div>
        )}

        {/* VIEW 2: 2D RETRO CANVAS ARCADE */}
        {currentView === '2d' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* 2D Arcade Top Controls & Progressive Unlock HUD */}
            <div className="p-4 sm:p-5 rounded-3xl bg-[#070b16] border border-slate-800 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#dfb15b]/15 text-[#dfb15b] border border-[#dfb15b]/30 inline-flex items-center gap-1.5">
                    <Gamepad2 className="w-3.5 h-3.5" />
                    2D RETRO VECTOR SUITE • {Math.min(3, playedGames.length)}/3 PORTFOLIO UNLOCKED
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    ({unlockedProjects.length} of {PORTFOLIO_PROJECTS.length} Case Studies Live)
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1 tracking-tight">
                  {active2dGame === 'asteroids' && 'Vector Asteroids: Inertia & Multi-Stage Fracturing'}
                  {active2dGame === 'pong' && 'Pong vs A.T.S. Bot: Defeat the Automated Screen to Earn CV'}
                  {active2dGame === 'invaders' && 'Design Invaders 2D: Retro Vector Canvas Engine'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Play any arcade game to unlock 1/3 of the portfolio. Defeating the A.T.S. Bot in Pong awards instant Executive CV access.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start lg:self-auto">
                <button
                  onClick={() => setCurrentView('3d')}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#0c1427] hover:bg-slate-800 text-slate-300 border border-slate-800 transition flex items-center gap-1.5"
                >
                  <Move3d className="w-3.5 h-3.5 text-[#dfb15b]" />
                  Switch to 3D Space View
                </button>
                <button
                  onClick={handleOpenCV}
                  className="px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-[#dfb15b] to-[#c41230] text-black hover:opacity-90 transition flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Launch AR CV</span>
                </button>
              </div>
            </div>

            {/* 2D ARCADE GAME SELECTOR TABS */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                id="arcade-tab-asteroids"
                onClick={() => setActive2dGame('asteroids')}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold font-mono transition flex items-center gap-2 border whitespace-nowrap ${
                  active2dGame === 'asteroids'
                    ? 'bg-sky-500/15 border-sky-500/40 text-sky-300 shadow-md shadow-sky-500/10'
                    : 'bg-[#0a0f1d] border-slate-800 text-slate-400 hover:text-white hover:border-slate-750'
                }`}
              >
                <Rocket className="w-4 h-4 text-sky-400" />
                <span>Vector Asteroids</span>
                <span className="px-1.5 py-0.5 text-[9px] rounded bg-sky-500/20 text-sky-300 font-sans font-semibold">
                  NEW INERTIA
                </span>
                {playedGames.includes('asteroids') && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
              </button>

              <button
                id="arcade-tab-pong"
                onClick={() => setActive2dGame('pong')}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold font-mono transition flex items-center gap-2 border whitespace-nowrap ${
                  active2dGame === 'pong'
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 shadow-md shadow-rose-500/10'
                    : 'bg-[#0a0f1d] border-slate-800 text-slate-400 hover:text-white hover:border-slate-750'
                }`}
              >
                <Bot className="w-4 h-4 text-rose-400" />
                <span>Pong vs A.T.S. Bot</span>
                <span className="px-1.5 py-0.5 text-[9px] rounded bg-amber-500/20 text-amber-300 font-sans font-semibold">
                  CV UNLOCK
                </span>
                {playedGames.includes('pong') && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
              </button>

              <button
                id="arcade-tab-invaders"
                onClick={() => setActive2dGame('invaders')}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold font-mono transition flex items-center gap-2 border whitespace-nowrap ${
                  active2dGame === 'invaders'
                    ? 'bg-[#dfb15b]/15 border-[#dfb15b]/40 text-[#dfb15b] shadow-md shadow-[#dfb15b]/10'
                    : 'bg-[#0a0f1d] border-slate-800 text-slate-400 hover:text-white hover:border-slate-750'
                }`}
              >
                <Gamepad2 className="w-4 h-4 text-[#dfb15b]" />
                <span>Design Invaders 2D</span>
                {playedGames.includes('2d-invaders') && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
              </button>
            </div>

            {/* RENDER CURRENT 2D ARCADE GAME */}
            {active2dGame === 'asteroids' && (
              <AsteroidsCanvas
                onOpenPortfolio={handleOpenPortfolioWithProject}
                onOpenLeaderboard={() => setShowLeaderboard(true)}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onGamePlayed={() => handleGamePlayed('asteroids')}
                onScoreUpdate={handleScoreUpdate}
              />
            )}

            {active2dGame === 'pong' && (
              <PongCanvas
                onUnlockCV={() => {
                  setCvEarned(true);
                  try {
                    localStorage.setItem('coke_cv_earned', 'true');
                  } catch {}
                }}
                onNavigateToCV={handleOpenCV}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onGamePlayed={() => handleGamePlayed('pong')}
              />
            )}

            {active2dGame === 'invaders' && (
              <DesignInvadersCanvas
                onOpenPortfolio={handleOpenPortfolioWithProject}
                onOpenLeaderboard={() => setShowLeaderboard(true)}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                unlockedProjects={unlockedProjects}
                onUnlockProject={handleUnlockProject}
                onScoreUpdate={handleScoreUpdate}
                onGamePlayed={() => handleGamePlayed('2d-invaders')}
              />
            )}
          </div>
        )}

        {/* VIEW 3: CASE STUDIES & PORTFOLIO */}
        {currentView === 'portfolio' && (
          <PortfolioViewer
            unlockedProjectIds={unlockedProjects}
            selectedProjectId={selectedProjectId}
            onSelectProject={id => setSelectedProjectId(id)}
            onBackToGame={() => setCurrentView('3d')}
            onOpen3DStage={() => setCurrentView('3d')}
            onOpenCV={handleOpenCV}
            highScore={topScore}
            isEarned={portfolioEarned}
            score={Math.max(currentScore, topScore)}
            requiredScore={PORTFOLIO_REQUIRED_SCORE}
            onPlayToEarn={() => {
              setCurrentView('3d');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            playedGames={playedGames}
            onNavigateToGame={gameId => {
              if (gameId === '3d-invaders') {
                setCurrentView('3d');
              } else {
                setCurrentView('2d');
                if (gameId === 'asteroids' || gameId === 'pong') {
                  setActive2dGame(gameId);
                } else {
                  setActive2dGame('invaders');
                }
              }
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* VIEW 4: CV */}
        {currentView === 'cv' && (
          <CVViewer
            onBack={() => setCurrentView('3d')}
            onSelectProject={handleOpenPortfolioWithProject}
            isEarned={cvEarned}
            score={Math.max(currentScore, topScore)}
            requiredScore={CV_REQUIRED_SCORE}
            onPlayToEarn={() => {
              setCurrentView('3d');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onPlayPong={() => {
              setCurrentView('2d');
              setActive2dGame('pong');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onUnlockCV={() => {
              setCvEarned(true);
              try {
                localStorage.setItem('coke_cv_earned', 'true');
              } catch {}
            }}
          />
        )}

        {/* PROGRESSIVE UNLOCK TOAST NOTIFICATION */}
        {progressionToast && (
          <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-[#090e1d] border border-[#dfb15b]/60 shadow-2xl text-white flex items-center gap-3 animate-in slide-in-from-bottom-5">
            <div className="w-10 h-10 rounded-xl bg-[#dfb15b]/20 text-[#dfb15b] flex items-center justify-center font-bold shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono uppercase font-bold text-[#dfb15b]">
                Progressive Portfolio Unlock • {progressionToast.fraction} Complete
              </div>
              <div className="text-xs font-semibold text-white">
                {progressionToast.gameName} played! {progressionToast.caseStudyCount} case studies now unlocked.
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="mt-16 bg-[#040812] border-t border-slate-800/80 py-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Identity */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-9 flex items-center justify-center shrink-0">
                <img
                  src="./image.png?v=3"
                  alt="Jonny Coke Logo (C monogram with purple J)"
                  className="w-full h-full object-contain drop-shadow"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <span className="font-extrabold text-white text-sm block">
                  {CREATOR_PROFILE.name}
                </span>
                <span className="text-[11px] text-[#dfb15b] font-medium">
                  {CREATOR_PROFILE.title}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              25+ years of strategic visual communication, accessibility compliance (WCAG 2.2 AAA), and spatial motion design.
            </p>
          </div>

          {/* Col 2: Navigation Links */}
          <div>
            <h4 className="font-mono text-white font-bold uppercase tracking-wider text-[11px] mb-3">
              Core Experiences
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <button
                  onClick={() => {
                    setCurrentView('3d');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#dfb15b] transition flex items-center gap-1"
                >
                  <Move3d className="w-3 h-3 text-[#dfb15b]" />
                  3D Spatial Game &amp; Stage
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentView('2d');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#dfb15b] transition flex items-center gap-1"
                >
                  <Gamepad2 className="w-3 h-3 text-[#dfb15b]" />
                  2D Retro Arcade Edition
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentView('portfolio');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-[#dfb15b] transition flex items-center gap-1"
                >
                  <Briefcase className="w-3 h-3 text-[#dfb15b]" />
                  Portfolio &amp; Geoscientist Archive
                </button>
              </li>
              <li>
                <button
                  onClick={handleOpenCV}
                  className="hover:text-[#dfb15b] transition flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-[#dfb15b]" />
                  Augmented Reality (AR) CV
                </button>
              </li>
              <li>
                <button
                  onClick={handleOpenCV}
                  className="hover:text-[#dfb15b] transition flex items-center gap-1 text-slate-400"
                >
                  <FileText className="w-3 h-3 text-slate-400" />
                  CV (Print / PDF Document)
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Contact & Direct Inquiries */}
          <div>
            <h4 className="font-mono text-white font-bold uppercase tracking-wider text-[11px] mb-3">
              Direct Contact
            </h4>
            <div className="space-y-2 text-slate-300 text-[11px]">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#dfb15b] shrink-0" />
                <span>{CREATOR_PROFILE.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#dfb15b] shrink-0" />
                <span>{CREATOR_PROFILE.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#dfb15b] shrink-0" />
                <a
                  href={`mailto:${CREATOR_PROFILE.email}`}
                  className="hover:text-[#dfb15b] transition"
                >
                  {CREATOR_PROFILE.email}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5 text-[#dfb15b] shrink-0" />
                <a
                  href={CREATOR_PROFILE.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#dfb15b] transition"
                >
                  jonnycoke.com
                </a>
              </div>
            </div>
          </div>

          {/* Col 4: Verified Deliverables */}
          <div>
            <h4 className="font-mono text-white font-bold uppercase tracking-wider text-[11px] mb-3">
              Verified Deliverables
            </h4>
            <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
              Serving the Commonwealth Secretariat, Transport for London, Geological Society of London, and DeWalt &amp; Stanley.
            </p>
            <button
              onClick={() => {
                setCurrentView('portfolio');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full py-2 px-3 rounded-xl bg-[#0c1427] hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] font-semibold transition flex items-center justify-center gap-1.5"
            >
              <Briefcase className="w-3.5 h-3.5 text-[#dfb15b]" />
              View Full Portfolio Archive
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-6 border-t border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400 font-mono">
          <span>© {new Date().getFullYear()} Jonny Coke. All rights reserved.</span>
          <span>Crafted with Three.js WebGL &amp; Harmonic Mathematical Foundations</span>
        </div>
      </footer>

      {/* MODALS */}
      {(!gatekeeperDismissed || showGatekeeperModal) && (
        <RecruiterIntroGatekeeper
          onComplete={() => {
            setGatekeeperDismissed(true);
            setShowGatekeeperModal(false);
            setPortfolioEarned(true);
            setCvEarned(true);
            try {
              localStorage.setItem('recruiter_gatekeeper_passed', 'true');
              localStorage.setItem('coke_portfolio_earned', 'true');
              localStorage.setItem('coke_cv_earned', 'true');
            } catch {}
          }}
          onDismissWithoutPassing={() => setShowGatekeeperModal(false)}
        />
      )}

      <LeaderboardModal isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} />

      {/* PRIVATE OWNER DEPLOYMENT EXPORT MODAL (Triggered only by Shift+D or ?download=true) */}
      {showPrivateExportModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md"
          onClick={() => setShowPrivateExportModal(false)}
        >
          <div
            className="relative w-full max-w-xl bg-[#090d18] border-2 border-emerald-600/70 rounded-2xl shadow-[0_0_50px_rgba(5,150,105,0.4)] overflow-hidden text-slate-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-gradient-to-r from-emerald-950/70 to-slate-900">
              <div className="flex items-center gap-2.5">
                <FolderArchive className="w-5 h-5 text-emerald-400" />
                <h3 className="font-mono text-sm sm:text-base font-bold text-white">
                  Owner Deployment Package Download
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPrivateExportModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 space-y-4 text-xs font-mono">
              <p className="text-slate-300 leading-relaxed">
                Choose the zip archive structure that matches your preferred IONOS extraction method:
              </p>

              {/* Package 1: Root-Level Package (No nested dist folder) */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-emerald-600/50 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-bold text-[10px]">
                      RECOMMENDED FOR IONOS
                    </span>
                    <span className="text-white font-bold text-sm">Package 1: Root-Level Files</span>
                  </div>
                  <span className="text-emerald-400 text-[11px]">(285 MB)</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  <strong>NO <code className="text-emerald-300">dist/</code> subfolder inside.</strong> All files (<code className="text-slate-300">index.html</code>, <code className="text-slate-300">.htaccess</code>, <code className="text-slate-300">assets/</code>) sit directly at the root of the archive. When you unpack in your domain&apos;s folder, everything lands directly in place.
                </p>
                <div className="pt-1">
                  <a
                    href="/jonnycoke-deploy-package.zip"
                    download="jonnycoke-deploy-package.zip"
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>DOWNLOAD ROOT-LEVEL ZIP (jonnycoke-deploy-package.zip)</span>
                  </a>
                </div>
              </div>

              {/* Package 2: With dist/ Folder Wrapper */}
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                      FOLDER WRAPPER
                    </span>
                    <span className="text-white font-bold text-sm">Package 2: With dist/ Folder</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">(285 MB)</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Contains the <code className="text-amber-300">dist/</code> parent folder wrapper (<code className="text-slate-400">dist/index.html</code>, <code className="text-slate-400">dist/assets/</code>). Use this if you prefer unpacking into a separate <code className="text-slate-300">dist/</code> folder.
                </p>
                <div className="pt-1">
                  <a
                    href="/jonnycoke_with_dist_folder.zip"
                    download="jonnycoke_with_dist_folder.zip"
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold flex items-center justify-center gap-2 border border-slate-700 transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>DOWNLOAD WITH dist/ FOLDER (jonnycoke_with_dist_folder.zip)</span>
                  </a>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-black/50 border border-slate-850 text-slate-400 text-[10px] flex items-center justify-between">
                <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-white border border-slate-700">Shift + D</kbd> anytime in preview to toggle this modal.</span>
                <button
                  type="button"
                  onClick={() => setShowPrivateExportModal(false)}
                  className="text-slate-500 hover:text-white underline"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
