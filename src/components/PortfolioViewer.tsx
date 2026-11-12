import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PORTFOLIO_PROJECTS,
  CREATOR_PROFILE,
  GEOSCIENTIST_PDF_ARCHIVE,
  MASTER_PORTFOLIO_PAGES,
} from '../data/portfolioData';
import { ArtworkGallery } from './ArtworkGallery';
import { EmbeddedUrlModal } from './EmbeddedUrlModal';
import {
  ExternalLink,
  Lock,
  Unlock,
  CheckCircle2,
  FileText,
  Sparkles,
  Heart,
  BookOpen,
  Move3d,
  UploadCloud,
  FileDown,
  Play,
  KeyRound,
  Filter,
  Monitor,
  Eye,
  Gamepad2,
  Rocket,
  Bot,
  Trophy,
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
  Globe,
  Download,
} from 'lucide-react';

interface Props {
  unlockedProjectIds: string[];
  selectedProjectId?: string;
  onSelectProject?: (id: string) => void;
  onBackToGame: () => void;
  onOpen3DStage: () => void;
  onOpenCV: () => void;
  onOpenAssetManager?: () => void;
  highScore: number;
  isEarned?: boolean;
  score?: number;
  requiredScore?: number;
  onPlayToEarn?: () => void;
  playedGames?: string[];
  onNavigateToGame?: (gameId: string) => void;
}

export const PortfolioViewer: React.FC<Props> = ({
  unlockedProjectIds,
  selectedProjectId,
  onSelectProject,
  onBackToGame,
  onOpen3DStage,
  onOpenCV,
  onOpenAssetManager,
  isEarned = false,
  score = 0,
  requiredScore = 300,
  onPlayToEarn,
  playedGames = [],
  onNavigateToGame,
}) => {
  const [activeTab, setActiveTab] = useState<string>(
    selectedProjectId || PORTFOLIO_PROJECTS[0].id
  );
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [navDirection, setNavDirection] = useState<number>(0);
  const [embeddedPreview, setEmbeddedPreview] = useState<{ url: string; title: string } | null>(
    null
  );
  const [showMasterPdfModal, setShowMasterPdfModal] = useState<boolean>(false);
  const [currentPdfPage, setCurrentPdfPage] = useState<number>(1);

  // Sensory calibration simulator state (for HeartNeuro)
  const [sensoryMode, setSensoryMode] = useState<'soft' | 'calm' | 'standard'>('soft');
  const [activeIntentBadge, setActiveIntentBadge] = useState<string>('Detailed Discussions');

  const categories = [
    { id: 'all', label: 'All Works' },
    { id: 'Diplomacy & Global Public Service', label: 'Diplomacy & Royal Assemblies' },
    { id: 'Scientific Publishing & Editorial Systems', label: 'Scientific Publishing' },
    { id: 'Augmented Reality & Award-Winning Publishing', label: 'AR & Motion' },
    { id: 'Sensory-Conscious Product Architecture', label: 'Sensory & Inclusive UX' },
  ];

  const filteredProjects = PORTFOLIO_PROJECTS.filter(p => {
    if (filterCategory === 'all') return true;
    return p.category === filterCategory;
  });

  const activeProject =
    PORTFOLIO_PROJECTS.find(p => p.id === activeTab) || filteredProjects[0] || PORTFOLIO_PROJECTS[0];
  const isUnlocked = unlockedProjectIds.includes(activeProject.id);

  const currentIdx = filteredProjects.findIndex(p => p.id === activeTab);

  const handleSelectCard = (id: string) => {
    const curIdx = filteredProjects.findIndex(p => p.id === activeTab);
    const targetIdx = filteredProjects.findIndex(p => p.id === id);
    setNavDirection(targetIdx > curIdx ? 1 : targetIdx < curIdx ? -1 : 0);
    setActiveTab(id);
    if (onSelectProject) onSelectProject(id);
  };

  const handlePrevProject = () => {
    const curIdx = filteredProjects.findIndex(p => p.id === activeTab);
    if (curIdx > 0) {
      const prev = filteredProjects[curIdx - 1];
      setNavDirection(-1);
      setActiveTab(prev.id);
      if (onSelectProject) onSelectProject(prev.id);
    }
  };

  const handleNextProject = () => {
    const curIdx = filteredProjects.findIndex(p => p.id === activeTab);
    if (curIdx >= 0 && curIdx < filteredProjects.length - 1) {
      const next = filteredProjects[curIdx + 1];
      setNavDirection(1);
      setActiveTab(next.id);
      if (onSelectProject) onSelectProject(next.id);
    }
  };

  const handleCategoryChange = (catId: string) => {
    setFilterCategory(catId);
    const newFiltered = PORTFOLIO_PROJECTS.filter(p => {
      if (catId === 'all') return true;
      return p.category === catId;
    });
    if (newFiltered.length > 0 && !newFiltered.some(p => p.id === activeTab)) {
      setNavDirection(1);
      setActiveTab(newFiltered[0].id);
      if (onSelectProject) onSelectProject(newFiltered[0].id);
    }
  };

  // Sync selectedProjectId prop if updated externally
  useEffect(() => {
    if (selectedProjectId && selectedProjectId !== activeTab) {
      const curIdx = filteredProjects.findIndex(p => p.id === activeTab);
      const targetIdx = filteredProjects.findIndex(p => p.id === selectedProjectId);
      setNavDirection(targetIdx > curIdx ? 1 : targetIdx < curIdx ? -1 : 0);
      setActiveTab(selectedProjectId);
    }
  }, [selectedProjectId]);

  // Arrow key navigation for smoother UX
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        embeddedPreview
      ) {
        return;
      }
      if (showMasterPdfModal) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          setCurrentPdfPage(p => Math.min(MASTER_PORTFOLIO_PAGES.length, p + 1));
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          setCurrentPdfPage(p => Math.max(1, p - 1));
        } else if (e.key === 'Escape') {
          setShowMasterPdfModal(false);
        }
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        const curIdx = filteredProjects.findIndex(p => p.id === activeTab);
        if (curIdx >= 0 && curIdx < filteredProjects.length - 1) {
          e.preventDefault();
          const next = filteredProjects[curIdx + 1];
          setNavDirection(1);
          setActiveTab(next.id);
          if (onSelectProject) onSelectProject(next.id);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        const curIdx = filteredProjects.findIndex(p => p.id === activeTab);
        if (curIdx > 0) {
          e.preventDefault();
          const prev = filteredProjects[curIdx - 1];
          setNavDirection(-1);
          setActiveTab(prev.id);
          if (onSelectProject) onSelectProject(prev.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredProjects, activeTab, onSelectProject, showMasterPdfModal, embeddedPreview]);

  // Keep active project card scrolled into view in left list during navigation
  useEffect(() => {
    const cardEl = document.getElementById(`project-card-${activeTab}`);
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeTab]);

  const getYoutubeEmbedUrl = (url: string) => {
    if (url.includes('/shorts/')) {
      const parts = url.split('/shorts/')[1];
      const id = parts.split('?')[0].split('/')[0];
      return `https://www.youtube.com/embed/${id}?rel=0`;
    }
    if (url.includes('youtu.be/')) {
      const parts = url.split('youtu.be/')[1];
      const id = parts.split('?')[0].split('/')[0];
      return `https://www.youtube.com/embed/${id}?rel=0`;
    }
    if (url.includes('watch?v=')) {
      const parts = url.split('watch?v=')[1];
      const id = parts.split('&')[0];
      return `https://www.youtube.com/embed/${id}?rel=0`;
    }
    return url;
  };

  if (playedGames.length === 0 && !isEarned) {
    return (
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center py-12 px-4 animate-in fade-in duration-300">
        <div className="w-full bg-[#0c1427]/95 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl backdrop-blur-xl text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#dfb15b]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#c41230]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-20 h-20 rounded-2xl bg-[#dfb15b]/15 border border-[#dfb15b]/30 flex items-center justify-center text-[#dfb15b] mx-auto mb-5 shadow-lg">
            <Lock className="w-10 h-10" />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono bg-[#dfb15b]/15 text-[#dfb15b] border border-[#dfb15b]/30 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            ALL CONTENT LOCKED // ACCESS MUST BE EARNED
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
            Portfolio Access Locked
          </h2>

          <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed mb-6">
            All portfolio case studies and CV credentials are locked until you play arcade games to prove your engagement. There are no passes or skips.
            <br />
            <span className="font-mono text-[#dfb15b] font-semibold mt-2.5 inline-block">
              1 Game = 1/3 Unlocked • 2 Games = 2/3 Unlocked • 3+ Games = Complete Portfolio Access
            </span>
          </p>

          {/* Quick Arcade Launch Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-xl mx-auto mb-8">
            <button
              onClick={() => onNavigateToGame ? onNavigateToGame('asteroids') : onBackToGame()}
              className="p-3 rounded-xl bg-[#080d1a] border border-slate-800 hover:border-[#dfb15b]/50 text-left transition flex flex-col gap-1 text-xs"
            >
              <Rocket className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-white">Asteroids</span>
              <span className="text-[10px] text-slate-400">Vector Physics</span>
            </button>
            <button
              onClick={() => onNavigateToGame ? onNavigateToGame('pong') : onBackToGame()}
              className="p-3 rounded-xl bg-[#080d1a] border border-slate-800 hover:border-[#dfb15b]/50 text-left transition flex flex-col gap-1 text-xs"
            >
              <Bot className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-white">Pong</span>
              <span className="text-[10px] text-slate-400">vs A.T.S. (&ldquo;A T S&rdquo;) Bot (CV)</span>
            </button>
            <button
              onClick={() => onNavigateToGame ? onNavigateToGame('3d-invaders') : onBackToGame()}
              className="p-3 rounded-xl bg-[#080d1a] border border-slate-800 hover:border-[#dfb15b]/50 text-left transition flex flex-col gap-1 text-xs"
            >
              <Gamepad2 className="w-4 h-4 text-sky-400" />
              <span className="font-bold text-white">Invaders 3D</span>
              <span className="text-[10px] text-slate-400">Spatial Engine</span>
            </button>
            <button
              onClick={() => onNavigateToGame ? onNavigateToGame('2d-invaders') : onBackToGame()}
              className="p-3 rounded-xl bg-[#080d1a] border border-slate-800 hover:border-[#dfb15b]/50 text-left transition flex flex-col gap-1 text-xs"
            >
              <Gamepad2 className="w-4 h-4 text-purple-400" />
              <span className="font-bold text-white">Invaders 2D</span>
              <span className="text-[10px] text-slate-400">Classic Canvas</span>
            </button>
          </div>

          <div className="flex items-center justify-center">
            <button
              id="portfolio-play-to-earn-btn"
              onClick={onPlayToEarn || onBackToGame}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#c41230] to-[#672288] hover:opacity-95 text-white font-extrabold text-xs shadow-lg shadow-[#c41230]/20 flex items-center gap-2 transition"
            >
              <Play className="w-4 h-4 fill-current" />
              Enter Arcade to Play &amp; Unlock
            </button>
          </div>
        </div>
      </div>
    );
  }

  const projectCardVariants = {
    initial: (dir: number) => ({
      opacity: 0,
      x: dir > 0 ? 36 : dir < 0 ? -36 : 0,
      scale: 0.985,
    }),
    animate: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        x: { type: 'spring', stiffness: 360, damping: 30 },
        opacity: { duration: 0.22, ease: 'easeOut' },
        scale: { duration: 0.22, ease: 'easeOut' },
      },
    },
    exit: (dir: number) => ({
      opacity: 0,
      x: dir > 0 ? -36 : dir < 0 ? 36 : 0,
      scale: 0.985,
      transition: {
        x: { type: 'spring', stiffness: 360, damping: 30 },
        opacity: { duration: 0.16, ease: 'easeIn' },
        scale: { duration: 0.16, ease: 'easeIn' },
      },
    }),
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 py-4 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="mb-6 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0c1427]/95 via-[#080d1a] to-[#040812] border border-slate-800 text-slate-100 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-[#dfb15b]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-[#c41230]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#dfb15b]/15 border border-[#dfb15b]/30 text-[#dfb15b] text-xs font-semibold font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              VERIFIED PORTFOLIO MATRIX • 25+ YEARS CRAFT
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {CREATOR_PROFILE.name}
            </h1>
            <p className="text-sm font-semibold text-[#dfb15b]">
              {CREATOR_PROFILE.title}
            </p>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Every case study and digital archive represents verified deliverables across the Commonwealth
              Secretariat, Transport for London, Geological Society of London, DeWalt &amp; Stanley, and
              award-winning publishing systems.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="portfolio-header-pdf-btn"
              onClick={() => setShowMasterPdfModal(true)}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-900 to-slate-900 hover:from-indigo-800 hover:to-slate-800 text-indigo-200 border border-indigo-700/50 font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-indigo-950/40"
            >
              <BookOpen className="w-4 h-4 text-indigo-300" />
              Master Folio (33 Pages)
            </button>
            <button
              id="portfolio-header-3d-btn"
              onClick={onOpen3DStage}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#c41230] to-[#672288] hover:opacity-95 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-[#c41230]/20"
            >
              <Move3d className="w-4 h-4" />
              3D Spatial Stage
            </button>
            <button
              id="portfolio-header-cv-btn"
              onClick={onOpenCV}
              className="py-2.5 px-4 rounded-xl bg-[#dfb15b] hover:bg-[#e5c07b] text-[#080d1a] font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-[#dfb15b]/20"
            >
              <FileText className="w-4 h-4" />
              CV
            </button>
          </div>
        </div>
      </div>

      {/* PROGRESSIVE PORTFOLIO UNLOCK HUD (1/3 per Unique Game Played) */}
      <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-[#090f1e]/95 border border-slate-800 shadow-xl flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-[#dfb15b]">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-white font-mono uppercase tracking-wide">
                  Arcade Progression: {Math.min(3, playedGames.length)}/3 Complete Portfolio Access
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#dfb15b]/15 text-[#dfb15b] border border-[#dfb15b]/30">
                  {Math.min(3, playedGames.length) >= 3 ? '100% UNLOCKED' : `${Math.round((Math.min(3, playedGames.length) / 3) * 100)}% UNLOCKED`}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Each unique arcade game played unlocks 1/3 of the verified case studies ({unlockedProjectIds.length} of {PORTFOLIO_PROJECTS.length} accessible). There are no skips or passes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-mono text-slate-400">
            <span>Games Played: <strong className="text-[#dfb15b]">{playedGames.length}</strong> / 3 Needed</span>
          </div>
        </div>

        {/* 3-Stage Segmented Progress Bar */}
        <div className="w-full grid grid-cols-3 gap-2">
          <div className={`h-2 rounded-full transition-all duration-500 ${playedGames.length >= 1 ? 'bg-gradient-to-r from-sky-500 to-indigo-500 shadow-sm shadow-sky-500/30' : 'bg-slate-850'}`} />
          <div className={`h-2 rounded-full transition-all duration-500 ${playedGames.length >= 2 ? 'bg-gradient-to-r from-indigo-500 to-amber-500 shadow-sm shadow-amber-500/30' : 'bg-slate-850'}`} />
          <div className={`h-2 rounded-full transition-all duration-500 ${playedGames.length >= 3 ? 'bg-gradient-to-r from-amber-500 to-emerald-500 shadow-sm shadow-emerald-500/30' : 'bg-slate-850'}`} />
        </div>

        {/* Interactive 4 Games Quick-Nav & Verification Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-850/80">
          <span className="text-[10px] font-mono text-slate-500 uppercase">Arcade Suite:</span>
          
          <button
            onClick={() => onNavigateToGame ? onNavigateToGame('3d-invaders') : onOpen3DStage()}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono flex items-center gap-1.5 transition border ${
              playedGames.includes('3d-invaders')
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            <Move3d className="w-3 h-3 text-[#dfb15b]" />
            <span>Design Invaders 3D</span>
            {playedGames.includes('3d-invaders') && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
          </button>

          <button
            onClick={() => onNavigateToGame ? onNavigateToGame('2d-invaders') : onBackToGame()}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono flex items-center gap-1.5 transition border ${
              playedGames.includes('2d-invaders')
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            <Gamepad2 className="w-3 h-3 text-[#dfb15b]" />
            <span>Design Invaders 2D</span>
            {playedGames.includes('2d-invaders') && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
          </button>

          <button
            onClick={() => onNavigateToGame ? onNavigateToGame('asteroids') : onBackToGame()}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono flex items-center gap-1.5 transition border ${
              playedGames.includes('asteroids')
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            <Rocket className="w-3 h-3 text-sky-400" />
            <span>Vector Asteroids</span>
            {playedGames.includes('asteroids') ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <span className="text-[9px] text-[#dfb15b] font-bold">+1/3</span>}
          </button>

          <button
            onClick={() => onNavigateToGame ? onNavigateToGame('pong') : onBackToGame()}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono flex items-center gap-1.5 transition border ${
              playedGames.includes('pong')
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            <Bot className="w-3 h-3 text-rose-400" />
            <span>A.T.S. (&ldquo;A T S&rdquo;) Pong (CV Unlock)</span>
            {playedGames.includes('pong') ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <span className="text-[9px] text-amber-400 font-bold">+1/3 &amp; CV</span>}
          </button>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-5 scrollbar-none">
        <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-1" />
        {categories.map(cat => {
          const isActive = filterCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`relative px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                isActive
                  ? 'text-[#080d1a] font-bold'
                  : 'bg-[#0c1427]/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeCategoryPill"
                  className="absolute inset-0 bg-[#dfb15b] rounded-xl shadow-md shadow-[#dfb15b]/20 -z-0"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Golden Ratio Proportions: 38.2% List Column (5 cols) : 61.8% Case Study Column (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Project Selector */}
        <div className="lg:col-span-5 space-y-2.5 max-h-[760px] overflow-y-auto pr-1">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((p, idx) => {
              const projectUnlocked = unlockedProjectIds.includes(p.id);
              const isSelected = activeProject.id === p.id;
              return (
                <motion.div
                  key={p.id}
                  layout="position"
                  initial={{ opacity: 0, y: 16, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{
                    opacity: 0,
                    y: -12,
                    scale: 0.95,
                    transition: { duration: 0.16, ease: 'easeIn' },
                  }}
                  transition={{
                    duration: 0.22,
                    delay: Math.min(idx * 0.025, 0.16),
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  whileHover={{ scale: 1.015, x: 2 }}
                  whileTap={{ scale: 0.985 }}
                >
                  <button
                    id={`project-card-${p.id}`}
                    onClick={() => handleSelectCard(p.id)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all relative overflow-hidden group ${
                      isSelected
                        ? 'bg-[#0c1427] border-[#dfb15b]/80 shadow-lg shadow-[#dfb15b]/10'
                        : projectUnlocked
                        ? 'bg-[#0c1427]/70 border-slate-800 hover:border-slate-700 text-slate-300'
                        : 'bg-[#080d1a]/80 border-slate-850 opacity-75 hover:opacity-100'
                    }`}
                  >
                    {/* Animated Active Card Selection Background Glow */}
                    {isSelected && (
                      <motion.div
                        layoutId="activeCardGlow"
                        className="absolute inset-0 bg-gradient-to-r from-[#dfb15b]/10 via-[#dfb15b]/5 to-transparent pointer-events-none rounded-2xl border border-[#dfb15b]/80"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}

                    {/* Animated Accent Bar */}
                    {isSelected ? (
                      <motion.div
                        layoutId="activeCardAccentBar"
                        className="absolute left-0 top-0 bottom-0 w-1.5 shadow-sm shadow-[#dfb15b]"
                        style={{ backgroundColor: p.color }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    ) : (
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1"
                        style={{ backgroundColor: p.color }}
                      />
                    )}

                    <div className="flex items-center justify-between gap-2 pl-2 relative z-10">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className="font-bold text-xs sm:text-sm text-white truncate max-w-[200px]">
                          {p.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#080d1a] border border-slate-800 text-[#dfb15b]">
                          Tier {p.harmonicTier} ({p.unlockScore} PTS)
                        </span>
                        {projectUnlocked ? (
                          <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                            <Unlock className="w-3 h-3" />
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                            <Lock className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="pl-4 mt-1 flex items-center justify-between text-[11px] text-slate-400 relative z-10">
                      <span className="truncate">{p.organisation}</span>
                      {p.artworkPieces && p.artworkPieces.length > 0 && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#dfb15b]/15 text-[#dfb15b] border border-[#dfb15b]/30 shrink-0 ml-1.5">
                          {p.artworkPieces.length} Artwork Pieces
                        </span>
                      )}
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Right Column: Case Study Deep Dive */}
        <div className="lg:col-span-7 flex flex-col">
          {/* Quick Case Study Navigation Bar */}
          <div className="flex items-center justify-between gap-2 mb-3 px-1 text-xs">
            <button
              onClick={handlePrevProject}
              disabled={currentIdx <= 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0c1427] hover:bg-slate-800 disabled:opacity-25 disabled:pointer-events-none text-slate-300 hover:text-white border border-slate-800 transition font-mono text-[11px] shadow-sm"
              aria-label="Previous Case Study"
              title="Previous Case Study (Arrow Left)"
            >
              <ChevronLeft className="w-4 h-4 text-[#dfb15b]" />
              <span className="hidden sm:inline font-semibold">Prev Project</span>
              <kbd className="hidden md:inline px-1 py-0.2 rounded bg-slate-850 text-slate-400 text-[9px] border border-slate-700">←</kbd>
            </button>

            <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
              <span className="text-[#dfb15b] font-bold">
                {currentIdx >= 0 ? String(currentIdx + 1).padStart(2, '0') : '01'}
              </span>
              <span>/</span>
              <span>{String(filteredProjects.length).padStart(2, '0')}</span>
              <span className="hidden sm:inline text-slate-600">•</span>
              <span className="hidden sm:inline text-slate-400 truncate max-w-[200px]">
                {activeProject.category}
              </span>
            </div>

            <button
              onClick={handleNextProject}
              disabled={currentIdx < 0 || currentIdx >= filteredProjects.length - 1}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0c1427] hover:bg-slate-800 disabled:opacity-25 disabled:pointer-events-none text-slate-300 hover:text-white border border-slate-800 transition font-mono text-[11px] shadow-sm"
              aria-label="Next Case Study"
              title="Next Case Study (Arrow Right)"
            >
              <span className="hidden sm:inline font-semibold">Next Project</span>
              <kbd className="hidden md:inline px-1 py-0.2 rounded bg-slate-850 text-slate-400 text-[9px] border border-slate-700">→</kbd>
              <ChevronRight className="w-4 h-4 text-[#dfb15b]" />
            </button>
          </div>

          {/* AnimatePresence for Case Study Project Card Entrance & Exit */}
          <AnimatePresence mode="wait" custom={navDirection}>
            <motion.div
              key={activeProject.id}
              custom={navDirection}
              variants={projectCardVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="bg-[#0c1427]/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden"
            >
              {/* Decorative background glow accents matched to project color */}
              <div
                className="absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-10"
                style={{ backgroundColor: activeProject.color }}
              />

              {!isUnlocked ? (
                <div className="py-14 px-6 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[#dfb15b]/10 border border-[#dfb15b]/30 flex items-center justify-center text-[#dfb15b] mb-4 shadow-lg">
                    <Lock className="w-8 h-8" />
                  </div>
                  <div className="text-xs font-mono text-[#dfb15b] uppercase tracking-widest mb-1">
                    TIER {activeProject.harmonicTier} LOCKED
                  </div>
                  <h3 className="text-xl font-extrabold text-white mb-2">{activeProject.title}</h3>
                  <p className="text-xs text-slate-300 max-w-md mb-6 leading-relaxed">
                    This case study is locked. Play arcade games (Vector Asteroids, Pong vs A.T.S. Bot, Design Invaders 3D, Design Invaders 2D) to unlock more tiers ({playedGames.length}/3 games played). There are no skips or passes.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={onBackToGame}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#c41230] to-[#672288] text-white font-extrabold text-xs shadow-lg shadow-[#c41230]/20 flex items-center gap-2 transition hover:opacity-95"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      Play Arcade Games to Unlock
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Project Header */}
                  <div className="border-b border-slate-800 pb-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span
                        className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
                        style={{
                          backgroundColor: `${activeProject.color}20`,
                          color: activeProject.accentColor,
                          border: `1px solid ${activeProject.color}40`,
                        }}
                      >
                        {activeProject.category}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {activeProject.timeframe}
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      {activeProject.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-[#dfb15b] font-semibold mt-0.5">
                      {activeProject.organisation}
                    </p>
                    <p className="text-xs text-slate-300 mt-2 italic leading-relaxed">
                      {activeProject.subtitle}
                    </p>
                  </div>

                  {/* Key Metrics */}
                  {activeProject.metrics && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {activeProject.metrics.map(m => (
                        <div
                          key={m.label}
                          className="p-3 rounded-2xl bg-[#080d1a]/80 border border-slate-800"
                        >
                          <div className="text-[10px] text-slate-400 font-mono uppercase">
                            {m.label}
                          </div>
                          <div className="text-xs font-bold text-white mt-0.5">{m.value}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Executive Overview */}
                  <div>
                    <h4 className="text-xs font-mono uppercase text-[#dfb15b] tracking-wider mb-2">
                      Executive Overview
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                      {activeProject.summary}
                    </p>
                  </div>

                  {/* Key Highlights */}
                  <div>
                    <h4 className="text-xs font-mono uppercase text-[#dfb15b] tracking-wider mb-2">
                      Key Highlights &amp; Measurable Deliverables
                    </h4>
                    <ul className="space-y-2">
                      {activeProject.keyHighlights.map((kh, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{kh}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* SPECIAL EMBED: GEOSCIENTIST 29-PDF ARCHIVE EXPLORER */}
                  {activeProject.id === 'geoscientist' && (
                    <div className="p-5 rounded-2xl bg-[#080d1a]/90 border border-teal-500/30 space-y-3.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-teal-400" />
                          <span className="text-xs font-bold text-white">
                            Geoscientist Monthly PDF Archive (29 Issues, 2015 – 2017)
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800/60">
                          Sole Art Director • 28+ Issues
                        </span>
                      </div>

                      {/* FEATURED: PPA COVER OF THE YEAR NOMINEE (MAY 2017) */}
                      <div className="p-3 rounded-xl bg-gradient-to-r from-amber-950/60 via-[#0e172a] to-teal-950/50 border-2 border-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.18)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src="/assets/aistudio/IMG_5996_7f12e8e4.jpeg"
                            alt="Geoscientist May 2017 Cover (PPA Award Nominee)"
                            className="w-12 h-16 object-cover rounded-md border border-amber-400/60 shadow"
                          />
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-2 py-0.5 rounded bg-amber-500 text-black font-black text-[9px] uppercase tracking-wider">
                                ★ PPA COVER OF THE YEAR NOMINEE
                              </span>
                              <span className="text-xs font-bold text-white">
                                May 2017 (Vol 27 No 4)
                              </span>
                            </div>
                            <p className="text-[11px] text-amber-200/90 mt-0.5 font-medium">
                              &ldquo;Blowing Hot &amp; Cold: The History of Climate-Change Science from 1750 to 1900&rdquo;
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href="https://geoscientist.online/wp-content/uploads/2025/05/Geoscientist-2017_27_04-May.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs flex items-center gap-1.5 transition shadow"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                            <span>Open Nominated PDF</span>
                          </a>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400">
                        Browse and open any of the 29 official Geological Society Fellowship editions art-directed by Jonny Coke:
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                        {GEOSCIENTIST_PDF_ARCHIVE.map(issue => (
                          <a
                            key={issue.label}
                            href={issue.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`px-2.5 py-1.5 rounded-xl text-[11px] flex items-center justify-between transition group ${
                              issue.isPpaNominee
                                ? 'bg-amber-950/40 border border-amber-500/60 text-amber-200 hover:bg-amber-900/50'
                                : 'bg-[#0c1427] hover:bg-teal-500/20 text-slate-300 hover:text-white border border-slate-800 hover:border-teal-500/40'
                            }`}
                          >
                            <span className="truncate">{issue.label}</span>
                            <FileDown className={`w-3 h-3 shrink-0 ml-1 ${issue.isPpaNominee ? 'text-amber-400' : 'text-slate-500 group-hover:text-teal-400'}`} />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SPECIAL EMBED: COMMONWEALTH BLUE CHARTER & CAMPAIGNS */}
                  {activeProject.id === 'commonwealth' && (
                    <div className="p-5 rounded-2xl bg-[#08152e]/90 border border-sky-500/40 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-sky-400" />
                          <span className="text-xs font-bold text-white">
                            Commonwealth Blue Charter &amp; Global Diplomacy Deliverables
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/60">
                          45% Verified Open Rate
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Authored responsive HTML email editions for ocean action working groups and collaborated on global human rights initiatives:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        <a
                          href="https://mailchi.mp/78e00ecd00e9/commonwealth-blue-charter-newsletter-issue-5409973?e=%5BUNIQID%5D"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 rounded-xl bg-[#091325] hover:bg-sky-950/50 border border-sky-800/60 hover:border-sky-500 text-slate-200 transition flex items-center justify-between group shadow"
                        >
                          <div>
                            <div className="text-[10px] font-mono text-sky-400 font-bold">RESPONSIVE HTML NEWSLETTER</div>
                            <div className="text-xs font-bold text-white mt-0.5">Blue Charter (Issue 5409973)</div>
                            <div className="text-[10px] text-slate-400 mt-1">Direct Mailchimp Digital Broadcast</div>
                          </div>
                          <ExternalLink className="w-4 h-4 text-sky-400 group-hover:translate-x-0.5 transition" />
                        </a>

                        <a
                          href="https://thecommonwealth.org/our-work/commonwealth-says-no-more"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 rounded-xl bg-[#091325] hover:bg-sky-950/50 border border-sky-800/60 hover:border-sky-500 text-slate-200 transition flex items-center justify-between group shadow"
                        >
                          <div>
                            <div className="text-[10px] font-mono text-rose-400 font-bold">GLOBAL ADVOCACY</div>
                            <div className="text-xs font-bold text-white mt-0.5">Commonwealth Says NO MORE</div>
                            <div className="text-[10px] text-slate-400 mt-1">Domestic Violence Campaign (56 Nations)</div>
                          </div>
                          <ExternalLink className="w-4 h-4 text-rose-400 group-hover:translate-x-0.5 transition" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* SPECIAL EMBED: TRANSPORT FOR LONDON ON ROUTE ISSUE 25 */}
                  {activeProject.id === 'tfl' && (
                    <div className="p-5 rounded-2xl bg-[#1c0d12]/90 border border-rose-500/40 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-rose-400" />
                          <span className="text-xs font-bold text-white">
                            TfL On Route Magazine (Issue 25) • 32-Page Accessible Tagged PDF
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-rose-300 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/60">
                          Official TfL Publication
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Sole lead designer for the landmark 32-page publication serving London&apos;s Taxi and Private Hire industry. Collaborated closely with TfL editors and an accessibility expert to ensure full public-sector WCAG accessibility compliance.
                      </p>
                      <div className="flex flex-wrap items-center gap-2.5 pt-1">
                        <a
                          href="https://content.tfl.gov.uk/on-route-issue-25.pdf"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-mono font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-red-950/60"
                        >
                          <FileDown className="w-4 h-4" />
                          <span>Open Official TfL On Route Issue #25 (PDF)</span>
                        </a>
                        <button
                          onClick={() =>
                            setEmbeddedPreview({
                              url: 'https://content.tfl.gov.uk/on-route-issue-25.pdf',
                              title: 'Transport for London — On Route Magazine (Issue 25)',
                            })
                          }
                          className="px-3.5 py-2 rounded-xl bg-black/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-mono transition flex items-center gap-1.5"
                        >
                          <Monitor className="w-3.5 h-3.5 text-rose-400" />
                          <span>Preview in Lightbox</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SPECIAL EMBED: HEARTNEURO SENSORY SIMULATOR */}
                  {activeProject.id === 'heartneuro' && (
                    <div className="p-5 rounded-2xl bg-[#1e1b4b]/40 border border-[#672288]/40">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <Heart className="w-4 h-4 text-[#c084fc]" />
                          <span className="text-xs font-bold text-white">
                            HeartNeuro Sensory-Conscious UI Patterns
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-[#c084fc]">
                          Inclusive Design Architecture
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mb-3 leading-relaxed">
                        Experience the sensory-conscious modes engineered by Jonny Coke to prevent cognitive fatigue and overwhelm:
                      </p>
                      <div className="flex items-center gap-2 my-2">
                        <span className="text-[11px] text-slate-400 font-mono">Contrast Calibration:</span>
                        {(['soft', 'calm', 'standard'] as const).map(mode => (
                          <button
                            key={mode}
                            onClick={() => setSensoryMode(mode)}
                            className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase transition ${
                              sensoryMode === mode
                                ? 'bg-[#672288] text-white'
                                : 'bg-[#080d1a] text-slate-400 border border-slate-800'
                            }`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1.5 my-2">
                        {['Detailed Discussions', 'Quiet Companionship', 'Low Battery Mode', 'Text Only'].map(
                          badge => (
                            <button
                              key={badge}
                              onClick={() => setActiveIntentBadge(badge)}
                              className={`px-3 py-1 rounded-full text-[10px] font-medium transition ${
                                activeIntentBadge === badge
                                  ? 'bg-[#672288]/40 text-[#e9d5ff] border border-[#c084fc]'
                                  : 'bg-[#080d1a] text-slate-400 border border-slate-800'
                              }`}
                            >
                              ✓ {badge}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Visual Deliverables & Artwork Gallery */}
                  {activeProject.artworkPieces && activeProject.artworkPieces.length > 0 && (
                    <ArtworkGallery
                      artworkPieces={activeProject.artworkPieces}
                      projectName={activeProject.title}
                      accentColor={activeProject.accentColor}
                    />
                  )}

                  {/* EMBEDDED VIDEO SHOWCASE (Zero external signposting) */}
                  {activeProject.videoUrl && (
                    <div className="space-y-3 pt-4 border-t border-slate-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Play className="w-4 h-4 text-[#dfb15b] fill-current" />
                          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                            Embedded 3D Motion Launch &amp; Commercial Reel
                          </h4>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Embedded In-App Player
                        </span>
                      </div>
                      <div className="relative w-full max-w-2xl mx-auto aspect-video rounded-2xl overflow-hidden border-2 border-slate-700/80 bg-black shadow-2xl">
                        <iframe
                          src={getYoutubeEmbedUrl(activeProject.videoUrl)}
                          title={`${activeProject.title} Video Showcase`}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  )}

                  {/* In-App Embedded Live Deliverables & Previews */}
                  <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-800">
                    {activeProject.externalUrl && (
                      <button
                        id={`project-embedded-preview-${activeProject.id}`}
                        onClick={() =>
                          setEmbeddedPreview({
                            url: activeProject.externalUrl!,
                            title: `${activeProject.title} — Live Deliverable`,
                          })
                        }
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#c41230] to-[#672288] text-white font-bold text-xs flex items-center gap-1.5 transition shadow-md shadow-[#c41230]/20 hover:opacity-95"
                      >
                        <Monitor className="w-3.5 h-3.5" />
                        <span>Open Embedded Live View</span>
                      </button>
                    )}
                    {activeProject.sampleUrl && (
                      <button
                        onClick={() =>
                          setEmbeddedPreview({
                            url: activeProject.sampleUrl!,
                            title: `${activeProject.title} — Official Sample Document`,
                          })
                        }
                        className="px-4 py-2 rounded-xl bg-[#080d1a] hover:bg-slate-850 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <FileDown className="w-3.5 h-3.5 text-[#dfb15b]" />
                        <span>View Embedded Document</span>
                      </button>
                    )}
                    {activeProject.additionalUrls &&
                      activeProject.additionalUrls.map(u => (
                        <button
                          key={u.label}
                          onClick={() =>
                            setEmbeddedPreview({
                              url: u.url,
                              title: `${activeProject.title} — ${u.label}`,
                            })
                          }
                          className="px-3 py-1.5 rounded-xl bg-[#080d1a] text-slate-300 hover:text-white border border-slate-800 text-xs font-medium flex items-center gap-1 transition"
                        >
                          <Eye className="w-3 h-3 text-[#dfb15b]" />
                          <span>{u.label}</span>
                        </button>
                      ))}
                    {activeProject.isPlaceholder && (
                      <span className="text-xs text-slate-500 italic">
                        * Physical print specimen archive on file with Jonny Coke.
                      </span>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Embedded In-App Preview Modal */}
      {embeddedPreview && (
        <EmbeddedUrlModal
          url={embeddedPreview.url}
          title={embeddedPreview.title}
          onClose={() => setEmbeddedPreview(null)}
        />
      )}

      {/* Master 33-Page Portfolio Modal */}
      {showMasterPdfModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-2 sm:p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-5xl h-full max-h-[92vh] bg-[#0c1427] border border-slate-700/80 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="px-4 py-3.5 border-b border-slate-800 flex items-center justify-between bg-[#080d1a]/90">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                    Jonny Coke Master Portfolio Archive
                    <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                      Page {currentPdfPage} of {MASTER_PORTFOLIO_PAGES.length}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Review and adjust spreads 1 at a time • Use Left/Right Arrow keys or dropdown to jump
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* 1 at a time Page Selector Dropdown */}
                <select
                  value={currentPdfPage}
                  onChange={(e) => setCurrentPdfPage(Number(e.target.value))}
                  className="bg-[#0c1427] border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 font-mono cursor-pointer focus:outline-none focus:border-[#dfb15b]"
                  title="Jump to specific spread (1 to 33)"
                >
                  {MASTER_PORTFOLIO_PAGES.map((p) => (
                    <option key={p.pageNumber} value={p.pageNumber}>
                      Page {p.pageNumber}: Spread {p.pageNumber}
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-1 border border-slate-800 rounded-xl p-0.5 bg-[#0c1427]">
                  <button
                    disabled={currentPdfPage <= 1}
                    onClick={() => setCurrentPdfPage(prev => Math.max(1, prev - 1))}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition"
                    title="Previous Page (Left Arrow)"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] font-mono font-bold px-1.5 text-[#dfb15b]">
                    {currentPdfPage}/{MASTER_PORTFOLIO_PAGES.length}
                  </span>
                  <button
                    disabled={currentPdfPage >= MASTER_PORTFOLIO_PAGES.length}
                    onClick={() => setCurrentPdfPage(prev => Math.min(MASTER_PORTFOLIO_PAGES.length, prev + 1))}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition"
                    title="Next Page (Right Arrow)"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => setShowMasterPdfModal(false)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition ml-1"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Main Viewport */}
            <div className="flex-1 bg-black/90 relative flex items-center justify-center p-4 overflow-hidden">
              <img
                src={MASTER_PORTFOLIO_PAGES[currentPdfPage - 1]?.imageUrl}
                alt={`Jonny Coke Portfolio Page ${currentPdfPage}`}
                className="max-h-full max-w-full object-contain rounded shadow-2xl border border-slate-800"
              />

              {/* Previous Page Button */}
              <button
                disabled={currentPdfPage <= 1}
                onClick={() => setCurrentPdfPage(prev => Math.max(1, prev - 1))}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-850 text-white border border-slate-700 disabled:opacity-30 disabled:pointer-events-none transition shadow-lg"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Next Page Button */}
              <button
                disabled={currentPdfPage >= MASTER_PORTFOLIO_PAGES.length}
                onClick={() => setCurrentPdfPage(prev => Math.min(MASTER_PORTFOLIO_PAGES.length, prev + 1))}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-850 text-white border border-slate-700 disabled:opacity-30 disabled:pointer-events-none transition shadow-lg"
                aria-label="Next Page"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Filmstrip Navigation Footer */}
            <div className="p-3 bg-[#080d1a] border-t border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-thin">
              {MASTER_PORTFOLIO_PAGES.map((page) => (
                <button
                  key={page.pageNumber}
                  onClick={() => setCurrentPdfPage(page.pageNumber)}
                  className={`flex-shrink-0 relative rounded-md overflow-hidden border-2 transition ${
                    currentPdfPage === page.pageNumber
                      ? 'border-[#dfb15b] ring-2 ring-[#dfb15b]/30'
                      : 'border-slate-800 hover:border-slate-600 opacity-60 hover:opacity-100'
                  }`}
                  style={{ width: '64px', height: '46px' }}
                >
                  <img
                    src={page.imageUrl}
                    alt={`Spread ${page.pageNumber}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <span className="absolute bottom-0.5 right-0.5 px-1 rounded text-[8px] font-mono font-bold bg-black/80 text-white">
                    {page.pageNumber}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
