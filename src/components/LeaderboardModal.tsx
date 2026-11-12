import React, { useState, useEffect } from 'react';
import { getLeaderboard, clearLeaderboard, LeaderboardEntry } from '../game/leaderboard';
import { Trophy, Medal, X, RotateCcw, Sparkles } from 'lucide-react';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (isOpen) {
      setEntries(getLeaderboard());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClear = () => {
    if (window.confirm('Reset all arcade high scores to default?')) {
      clearLeaderboard();
      setEntries(getLeaderboard());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0c1427] border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-slate-100">
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#dfb15b]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#dfb15b]/15 border border-[#dfb15b]/30 flex items-center justify-center text-[#dfb15b]">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-1.5">
                ARCADE HALL OF FAME
              </h3>
              <p className="text-xs text-slate-400">Design Invaders High Scores</p>
            </div>
          </div>
          <button
            id="close-leaderboard-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Entries List */}
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {entries.map((entry, idx) => {
            const isTop3 = idx < 3;
            return (
              <div
                key={entry.id}
                className={`flex items-center justify-between p-3 rounded-2xl border transition ${
                  idx === 0
                    ? 'bg-[#dfb15b]/10 border-[#dfb15b]/40 text-[#dfb15b]'
                    : idx === 1
                    ? 'bg-[#c41230]/10 border-[#c41230]/40 text-slate-200'
                    : idx === 2
                    ? 'bg-[#672288]/10 border-[#672288]/40 text-slate-300'
                    : 'bg-[#080d1a] border-slate-850 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center font-mono font-bold text-xs">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                  </span>
                  <div>
                    <span className="font-mono font-bold text-sm tracking-wider text-white">
                      {entry.initials || entry.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono ml-2">
                      Wave {entry.wave}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-sm text-[#dfb15b]">
                    {entry.score.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    {entry.projectsUnlocked ?? entry.unlockedCount} Unlocked
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800">
          <button
            onClick={handleClear}
            className="text-[11px] text-slate-500 hover:text-rose-400 transition flex items-center gap-1 font-mono"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Defaults
          </button>
          <button
            onClick={onClose}
            className="py-2 px-4 rounded-xl bg-[#dfb15b] hover:bg-[#e5c07b] text-[#080d1a] font-bold text-xs transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
