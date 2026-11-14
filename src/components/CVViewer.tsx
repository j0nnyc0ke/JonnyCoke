import React, { useState } from 'react';
import { ARCVExperience } from './ARCVExperience';
import { CVDocument } from './CVDocument';
import { soundEngine } from '../game/audio';
import {
  Sparkles,
  FileText,
  Printer,
  Lock,
  Play,
  Gamepad2,
  ArrowLeft,
} from 'lucide-react';

interface CVViewerProps {
  onBack: () => void;
  onSelectProject: (projectId: string) => void;
  onOpenAssetManager?: () => void;
  customLinks?: { title: string; url: string; note: string }[];
  isEarned?: boolean;
  score?: number;
  requiredScore?: number;
  onPlayToEarn?: () => void;
  onPlayPong?: () => void;
  onUnlockCV?: () => void;
  initialMode?: 'ar' | 'document';
}

export const CVViewer: React.FC<CVViewerProps> = ({
  onBack,
  onSelectProject,
  onOpenAssetManager,
  isEarned = false,
  score = 0,
  requiredScore = 500,
  onPlayToEarn,
  onPlayPong,
  onUnlockCV,
  initialMode = 'document',
}) => {
  // Sub-view: 'ar' (Augmented Reality 3D & Camera) | 'document' (Print / Clean PDF Document)
  const [cvMode, setCvMode] = useState<'ar' | 'document'>(initialMode);
  const [bypassUnlock, setBypassUnlock] = useState<boolean>(false);

  if (!isEarned && !bypassUnlock) {
    const progress = Math.min(100, Math.round((score / requiredScore) * 100));
    return (
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center py-12 px-4 animate-in fade-in duration-300">
        <div className="w-full bg-[#0c1427]/95 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl backdrop-blur-xl text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#dfb15b]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#c41230]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Official Monogram Logo in Lock Screen */}
          <div className="w-20 h-28 mx-auto mb-4 flex items-center justify-center">
            <img src="./image.png?v=3" alt="Official Jonny Coke Logo" className="w-full h-full object-contain drop-shadow" />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono bg-[#dfb15b]/15 text-[#dfb15b] border border-[#dfb15b]/30 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            EXECUTIVE CREDENTIALS &amp; AR TARGET
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
            Jonny Coke — Executive CV &amp; AR QR Code
          </h2>

          <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed mb-6">
            Review Jonny Coke&apos;s verified 25+ year leadership career timeline, physical AR marker target, and scannable QR code. Play any arcade challenge to earn entry, or activate direct recruiter access below.
          </p>

          {/* Progress Bar */}
          <div className="w-full max-w-md mx-auto bg-[#080d1a] border border-slate-800 rounded-2xl p-4 mb-6 text-left">
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-slate-400">Current Arcade Score</span>
              <span className="text-[#dfb15b] font-bold">
                {score.toLocaleString()} / {requiredScore.toLocaleString()} PTS ({progress}%)
              </span>
            </div>
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-[#c41230] via-[#672288] to-[#dfb15b] transition-all duration-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Instant Recruiter Direct Unlock */}
          <div className="mb-6 p-4 rounded-2xl bg-[#080d1a] border border-[#dfb15b]/40 max-w-md mx-auto flex flex-col items-center gap-2">
            <span className="text-xs font-mono text-[#dfb15b] font-bold">DIRECT RECRUITER &amp; CLIENT REVIEW</span>
            <button
              id="cv-direct-unlock-btn"
              onClick={() => {
                soundEngine.playLevelUp();
                setBypassUnlock(true);
                onUnlockCV?.();
              }}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-[#dfb15b] to-[#c41230] hover:opacity-95 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition"
            >
              <Sparkles className="w-4 h-4" />
              View Full CV &amp; QR Code Instantly
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {onPlayPong && (
              <button
                id="cv-play-pong-btn"
                onClick={onPlayPong}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs flex items-center justify-center gap-2 transition border border-slate-700"
              >
                <Gamepad2 className="w-4 h-4 text-[#dfb15b]" />
                Play Pong vs A.T.S. Bot
              </button>
            )}
            <button
              id="cv-play-to-earn-btn"
              onClick={onPlayToEarn || onBack}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs flex items-center justify-center gap-2 transition border border-slate-700"
            >
              <Play className="w-4 h-4 fill-current text-[#dfb15b]" />
              Play Design Invaders
            </button>
            <button
              onClick={onBack}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#080d1a] hover:bg-slate-850 border border-slate-750 text-slate-300 hover:text-white text-xs font-semibold transition"
            >
              Return
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
      {/* 1. TOP CV MODE SWITCHER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 print:hidden">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-[#dfb15b] transition group self-start"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to 3D Experience
        </button>

        {/* Central Segmented Mode Switcher */}
        <div className="flex items-center bg-[#070b16] p-1.5 rounded-2xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => {
              soundEngine.playClick();
              setCvMode('ar');
            }}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
              cvMode === 'ar'
                ? 'bg-gradient-to-r from-[#dfb15b] to-[#c41230] text-black font-extrabold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Augmented Reality (AR) CV</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              setCvMode('document');
            }}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
              cvMode === 'document'
                ? 'bg-[#dfb15b] text-[#080d1a] font-bold shadow-md shadow-[#dfb15b]/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-850'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Print / PDF Document</span>
          </button>
        </div>

        {/* Quick Print Shortcut */}
        <button
          onClick={() => {
            if (cvMode !== 'document') setCvMode('document');
            setTimeout(() => window.print(), 100);
          }}
          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0c1427] hover:bg-slate-800 text-slate-300 border border-slate-800 transition flex items-center gap-1.5 self-start sm:self-auto"
          title="Print or Save as Clean PDF"
        >
          <Printer className="w-3.5 h-3.5 text-[#dfb15b]" />
          <span>Save PDF</span>
        </button>
      </div>

      {/* 2. ACTIVE VIEW MODE */}
      {cvMode === 'ar' && (
        <ARCVExperience
          onSelectProject={onSelectProject}
          onOpenDocumentView={() => setCvMode('document')}
          onOpenAssetManager={onOpenAssetManager}
        />
      )}

      {cvMode === 'document' && (
        <CVDocument
          onBack={onBack}
          onSelectProject={onSelectProject}
          onOpenAssetManager={onOpenAssetManager}
          onLaunchAR={() => setCvMode('ar')}
        />
      )}
    </div>
  );
};
