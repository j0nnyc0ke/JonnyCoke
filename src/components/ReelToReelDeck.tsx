import React, { useState, useEffect } from 'react';
import {
  Play,
  Square,
  RotateCcw,
  Sparkles,
  Disc,
  Activity,
  Maximize2,
  X,
  Sliders,
  CheckCircle2,
  Eye,
  Camera,
} from 'lucide-react';

// 4K Photorealistic Studio Assets
import reelDeck4kImg from '../assets/images/reel_recorder_deck_1794286594961.jpg';
import studioNabReelImg from '../assets/images/studio_nab_reel_1794286593708.jpg';

interface ReelToReelDeckProps {
  isPlaying: boolean;
  isSpeaking: boolean;
  speed: number;
  counter: number;
  onTogglePlay: () => void;
  onPrevLine: () => void;
  onNextLine: () => void;
  onReplayLine: () => void;
  canPrev: boolean;
  canNext: boolean;
  currentLineIndex: number;
  totalLines: number;
  loopIteration?: number;
}

export const ReelToReelDeck: React.FC<ReelToReelDeckProps> = ({
  isPlaying,
  isSpeaking,
  speed,
  counter,
  onTogglePlay,
  onPrevLine,
  onNextLine,
  onReplayLine,
  canPrev,
  canNext,
  currentLineIndex,
  totalLines,
  loopIteration = 1,
}) => {
  // VU Meter needle angles (-38deg at rest to +28deg peak)
  const [vuLeft, setVuLeft] = useState<number>(-38);
  const [vuRight, setVuRight] = useState<number>(-38);
  const [tapeSpeedSetting, setTapeSpeedSetting] = useState<'15 IPS' | '7.5 IPS'>('15 IPS');
  const [visualMode, setVisualMode] = useState<'interactive_4k' | 'studio_photo_4k'>('interactive_4k');
  const [show4kLightbox, setShow4kLightbox] = useState<boolean>(false);
  const [reelImageLoaded, setReelImageLoaded] = useState<boolean>(true);

  // Dynamic analog needle animation
  useEffect(() => {
    let animId: number;
    const updateMeters = () => {
      if (isSpeaking) {
        // High vocal energy
        const base = -8 + Math.sin(Date.now() / 85) * 16 + (Math.random() - 0.5) * 12;
        const left = Math.min(Math.max(base + (Math.random() - 0.5) * 6, -38), 24);
        const right = Math.min(Math.max(base + (Math.random() - 0.5) * 8, -38), 26);
        setVuLeft(left);
        setVuRight(right);
      } else if (isPlaying) {
        // Subtle ambient score movement
        const base = -22 + Math.sin(Date.now() / 150) * 8 + (Math.random() - 0.5) * 5;
        setVuLeft(Math.min(Math.max(base, -38), 10));
        setVuRight(Math.min(Math.max(base + (Math.random() - 0.5) * 4, -38), 10));
      } else {
        // Rest position
        setVuLeft(-38);
        setVuRight(-38);
      }
      animId = requestAnimationFrame(updateMeters);
    };

    animId = requestAnimationFrame(updateMeters);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, isSpeaking]);

  // Dynamic rotation duration based on voice speed
  const spinDuration = isPlaying ? `${Math.max(1.1, 3.0 / speed)}s` : '0s';

  return (
    <div className="w-full bg-gradient-to-b from-[#151a24] via-[#0d111a] to-[#070a10] border-2 border-red-950/80 rounded-2xl p-3.5 sm:p-5 relative overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.85)] select-none">
      {/* Heavy Industrial Metallic Texture & CRT Scanlines */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(220,38,38,0.1),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.25)_51%)] bg-[length:100%_4px] opacity-40 pointer-events-none" />

      {/* 4 Precision Hex Bolts in Chassis Corners */}
      <span className="absolute top-2 left-2.5 w-2 h-2 rounded-full bg-slate-500/80 flex items-center justify-center text-[7px] text-slate-900 font-mono font-bold leading-none shadow-sm">×</span>
      <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-slate-500/80 flex items-center justify-center text-[7px] text-slate-900 font-mono font-bold leading-none shadow-sm">×</span>
      <span className="absolute bottom-2 left-2.5 w-2 h-2 rounded-full bg-slate-500/80 flex items-center justify-center text-[7px] text-slate-900 font-mono font-bold leading-none shadow-sm">×</span>
      <span className="absolute bottom-2 right-2.5 w-2 h-2 rounded-full bg-slate-500/80 flex items-center justify-center text-[7px] text-slate-900 font-mono font-bold leading-none shadow-sm">×</span>

      {/* TOP STUDIO BADGE & 4K CALIBRATION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-800/80 relative z-10">
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Studio Brand Plate */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-black/75 border border-red-900/60 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_8px_#ef4444] animate-pulse" />
            <span className="text-[10px] font-mono font-black tracking-widest text-red-300">
              STUDER / REVOX B77-MKII
            </span>
            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-black tracking-wider flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              4K ULTRA-HD
            </span>
          </div>

          {/* Transport State LED */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/50 border border-slate-800 text-[10px] font-mono">
            <span
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                isSpeaking
                  ? 'bg-red-500 shadow-[0_0_12px_#ef4444] animate-ping'
                  : isPlaying
                  ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                  : 'bg-slate-700'
              }`}
            />
            <span className="font-bold text-slate-300">
              {isSpeaking ? 'REEL TRANSMITTING' : isPlaying ? 'MOTOR ENGAGED' : 'STANDBY'}
            </span>
          </div>

          {/* Digital Optical Counter */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black border border-slate-850 font-mono text-xs shadow-inner">
            <span className="text-slate-500 text-[9px] uppercase tracking-wider mr-1">TAPE IDX</span>
            <span className="text-red-500 font-black tracking-widest text-sm drop-shadow-[0_0_6px_rgba(239,68,68,0.6)]">
              {String(counter).padStart(3, '0')}
            </span>
          </div>
        </div>

        {/* Mode Selector & 4K Lightbox Launcher */}
        <div className="flex items-center gap-2 self-start sm:self-auto text-[9px] font-mono">
          {/* Visual Mode Toggle */}
          <div className="flex items-center p-0.5 rounded-lg bg-black/70 border border-slate-800">
            <button
              type="button"
              onClick={() => setVisualMode('interactive_4k')}
              className={`px-2 py-1 rounded text-[9px] font-bold transition flex items-center gap-1 ${
                visualMode === 'interactive_4k'
                  ? 'bg-red-950 text-white border border-red-700/60 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Disc className="w-3 h-3" />
              <span>4K REELS</span>
            </button>
            <button
              type="button"
              onClick={() => setVisualMode('studio_photo_4k')}
              className={`px-2 py-1 rounded text-[9px] font-bold transition flex items-center gap-1 ${
                visualMode === 'studio_photo_4k'
                  ? 'bg-red-950 text-white border border-red-700/60 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Camera className="w-3 h-3" />
              <span>4K STUDIO SHOT</span>
            </button>
          </div>

          {/* 4K Zoom Lightbox Trigger */}
          <button
            type="button"
            onClick={() => setShow4kLightbox(true)}
            className="px-2 py-1 rounded-lg bg-[#1a2233] hover:bg-slate-800 text-teal-300 border border-teal-600/40 font-bold transition flex items-center gap-1"
            title="Inspect 4K Ultra-HD Master Photography"
          >
            <Maximize2 className="w-3 h-3" />
            <span className="hidden md:inline">INSPECT 4K</span>
          </button>

          {/* Tape Speed Setting */}
          <button
            type="button"
            onClick={() => setTapeSpeedSetting(s => s === '15 IPS' ? '7.5 IPS' : '15 IPS')}
            className="px-2 py-1 rounded bg-[#161c28] hover:bg-slate-800 text-amber-300 border border-slate-700 font-bold transition flex items-center gap-1"
            title="Toggle tape transport speed"
          >
            <span>{tapeSpeedSetting}</span>
          </button>
        </div>
      </div>

      {/* ================= MODE 1: INTERACTIVE 4K REELS & MECHANICAL HEADBLOCK ================= */}
      {visualMode === 'interactive_4k' && (
        <div className="my-4 p-3.5 sm:p-5 rounded-xl bg-gradient-to-b from-[#0a0e17] via-[#060910] to-[#030509] border border-slate-800/90 shadow-[inset_0_4px_30px_rgba(0,0,0,0.95)] relative overflow-hidden">
          
          {/* Realistic Brushed Gunmetal Chassis Surface */}
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.03)_0%,transparent_50%,rgba(0,0,0,0.5)_100%)] pointer-events-none" />
          
          {/* Horizontal Brushed Aluminum Headblock Deck Trim */}
          <div className="absolute top-1/2 left-4 right-4 h-20 -translate-y-1/2 bg-gradient-to-b from-[#1e2536] via-[#10141f] to-[#090c14] rounded-lg border border-slate-700/60 pointer-events-none opacity-85 shadow-lg" />

          {/* PHYSICAL TAPE PATH RIBBON (Spans continuously between Left Supply Reel and Right Take-Up Reel) */}
          <div className="absolute top-[82px] sm:top-[105px] left-[15%] right-[15%] h-2.5 bg-gradient-to-b from-[#341b12] via-[#522b1c] to-[#20100a] rounded-sm shadow-[0_1px_8px_rgba(0,0,0,0.95)] z-10 pointer-events-none">
            {/* Subtle tape oxide sheen animation */}
            <div
              className={`w-full h-full opacity-60 ${
                isPlaying ? 'bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] animate-pulse' : ''
              }`}
            />
          </div>

          {/* TWO LARGE 4K PHOTOREALISTIC OPEN REELS & CENTRAL MAGNETIC HEADBLOCK */}
          <div className="relative z-20 flex flex-col md:flex-row items-center justify-between gap-6 px-1 sm:px-4">
            
            {/* ================= LEFT SUPPLY REEL (4K Photorealistic NAB Reel) ================= */}
            <div className="flex flex-col items-center">
              <div className="relative w-40 h-40 sm:w-52 sm:h-52 rounded-full bg-black/90 border-4 border-slate-700/80 shadow-[0_15px_40px_rgba(0,0,0,0.95),inset_0_0_30px_rgba(0,0,0,0.9)] flex items-center justify-center group">
                
                {/* Outer Metallic Flange Rim Highlight */}
                <div className="absolute inset-0.5 rounded-full border border-slate-500/40 pointer-events-none" />
                
                {/* Thick Dark Ferric Oxide Tape Pancake Spool Background */}
                <div className="absolute inset-2 sm:inset-3 rounded-full bg-gradient-to-br from-[#3b2015] via-[#24130c] to-[#120704] border-2 border-[#4d2a1b] shadow-inner" />
                
                {/* ROTATING 4K STUDIO NAB METAL REEL */}
                <div
                  style={{
                    animation: isPlaying ? `spin ${spinDuration} linear infinite` : 'none',
                  }}
                  className="relative w-36 h-36 sm:w-48 sm:h-48 rounded-full overflow-hidden transition-transform duration-300 shadow-2xl flex items-center justify-center"
                >
                  {reelImageLoaded ? (
                    <img
                      src={studioNabReelImg}
                      alt="4K Studio NAB Aluminum Tape Reel"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded-full filter drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]"
                      onError={() => setReelImageLoaded(false)}
                    />
                  ) : (
                    /* Fallback High-Fidelity SVG Metal Reel */
                    <div className="w-full h-full rounded-full border-4 border-slate-400 bg-slate-800 flex items-center justify-center">
                      <div className="w-2 h-full bg-slate-300" />
                      <div className="w-2 h-full bg-slate-300 rotate-60 absolute" />
                      <div className="w-2 h-full bg-slate-300 -rotate-60 absolute" />
                    </div>
                  )}

                  {/* Dynamic Specular Sheen Overlay */}
                  <div className="absolute inset-0 rounded-full bg-[radial-gradient(ellipse_at_35%_25%,rgba(255,255,255,0.22)_0%,transparent_60%)] pointer-events-none" />
                </div>

                {/* Center Solid Aluminum NAB Spindle Adapter with Red Tension Locking Pin */}
                <div className="absolute z-20 w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-slate-200 via-slate-400 to-slate-600 border-2 border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.9),inset_0_1px_3px_rgba(255,255,255,0.9)] flex items-center justify-center pointer-events-none">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-red-700 border-2 border-red-500 shadow-inner flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-black shadow-sm" />
                  </div>
                  {/* 3 Precision NAB Locking Lugs */}
                  <div className="absolute w-1 h-3.5 bg-slate-900 rounded -top-1" />
                  <div className="absolute w-1 h-3.5 bg-slate-900 rounded -bottom-1" />
                  <div className="absolute h-1 w-3.5 bg-slate-900 rounded -left-1" />
                </div>
              </div>

              {/* Left Supply Reel Label */}
              <div className="mt-2 text-center font-mono">
                <span className="text-[10px] font-bold text-slate-200 uppercase tracking-widest block">
                  SUPPLY REEL • 10.5&quot; NAB
                </span>
                <span className="text-[8px] text-red-400 font-bold">
                  2500 FT MASTER TAPE PACK
                </span>
              </div>
            </div>

            {/* ================= CENTRAL MAGNETIC HEADBLOCK & TENSION ASSEMBLY ================= */}
            <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl bg-gradient-to-b from-[#1a2233] via-[#101522] to-[#090d16] border-2 border-slate-700/80 shadow-2xl z-30 max-w-[260px] w-full">
              {/* Machine Engraving Plate */}
              <div className="w-full flex items-center justify-between pb-2 border-b border-slate-800 text-[8px] font-mono text-slate-400">
                <span className="font-bold text-red-400 tracking-wider">3-HEAD SYSTEM</span>
                <span className="text-amber-400 font-bold">1/4&quot; TAPE PATH</span>
              </div>

              {/* Tension Guide Roller (Left) & Head Cluster */}
              <div className="flex items-center justify-between w-full py-2.5 px-1">
                {/* Left Tension Guide Pin */}
                <div className="flex flex-col items-center gap-0.5">
                  <div className={`w-3.5 h-3.5 rounded-full bg-gradient-to-br from-slate-200 to-slate-500 border border-slate-400 shadow-sm ${isPlaying ? 'animate-pulse' : ''}`} />
                  <span className="text-[6px] font-mono text-slate-400">GUIDE</span>
                </div>

                {/* Central Precision 3-Head Cluster */}
                <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-black/85 border border-slate-800 shadow-inner">
                  {/* 1. Erase Head */}
                  <div className="flex flex-col items-center gap-0.5" title="Erase Head">
                    <div className="w-4 h-6 rounded-sm bg-gradient-to-b from-slate-400 to-slate-700 border border-slate-400 shadow-sm flex items-center justify-center">
                      <div className="w-0.5 h-4 bg-black" />
                    </div>
                    <span className="text-[6px] font-mono text-slate-400">ERASE</span>
                  </div>

                  {/* 2. Record Head (with active red optical pulse during Jigsaw speech) */}
                  <div className="flex flex-col items-center gap-0.5" title="Record Head">
                    <div className={`w-4 h-6 rounded-sm border transition-colors shadow-sm flex items-center justify-center ${
                      isSpeaking
                        ? 'bg-red-950 border-red-500 shadow-[0_0_8px_#ef4444]'
                        : 'bg-gradient-to-b from-slate-400 to-slate-700 border-slate-400'
                    }`}>
                      <div className={`w-0.5 h-4 ${isSpeaking ? 'bg-red-400' : 'bg-black'}`} />
                    </div>
                    <span className={`text-[6px] font-mono font-bold ${isSpeaking ? 'text-red-400' : 'text-slate-500'}`}>
                      REC
                    </span>
                  </div>

                  {/* 3. Repro / Play Head (with warm audio pickup glow) */}
                  <div className="flex flex-col items-center gap-0.5" title="Playback / Repro Head">
                    <div className={`w-4 h-6 rounded-sm border transition-colors shadow-sm flex items-center justify-center ${
                      isPlaying
                        ? 'bg-amber-950/80 border-amber-500 shadow-[0_0_8px_#f59e0b]'
                        : 'bg-gradient-to-b from-slate-400 to-slate-700 border-slate-400'
                    }`}>
                      <div className={`w-0.5 h-4 ${isPlaying ? 'bg-amber-400' : 'bg-black'}`} />
                    </div>
                    <span className={`text-[6px] font-mono font-bold ${isPlaying ? 'text-amber-400' : 'text-slate-500'}`}>
                      REPRO
                    </span>
                  </div>
                </div>

                {/* Right Capstan & Rubber Pinch Roller */}
                <div className="flex flex-col items-center gap-0.5">
                  <div
                    className={`w-4 h-4 rounded-full bg-zinc-900 border-2 border-slate-300 shadow-sm ${
                      isPlaying ? 'animate-[spin_1s_linear_infinite]' : ''
                    }`}
                  />
                  <span className="text-[6px] font-mono text-slate-400">CAPSTAN</span>
                </div>
              </div>

              {/* Head Shield Cover Bar */}
              <div className="w-full bg-[#1b2333] border border-slate-700 py-1 px-2.5 rounded flex items-center justify-between text-[8px] font-mono shadow">
                <span className="text-slate-300 font-bold tracking-tight">STUDER MASTER HEADBLOCK</span>
                <span className={`flex items-center gap-1 font-bold ${isPlaying ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <Disc className={`w-2.5 h-2.5 ${isPlaying ? 'animate-spin' : ''}`} />
                  {isPlaying ? 'SOLENOID ENGAGED' : 'STANDBY'}
                </span>
              </div>
            </div>

            {/* ================= RIGHT TAKE-UP REEL (4K Photorealistic NAB Reel) ================= */}
            <div className="flex flex-col items-center">
              <div className="relative w-40 h-40 sm:w-52 sm:h-52 rounded-full bg-black/90 border-4 border-slate-700/80 shadow-[0_15px_40px_rgba(0,0,0,0.95),inset_0_0_30px_rgba(0,0,0,0.9)] flex items-center justify-center group">
                
                {/* Outer Metallic Flange Rim Highlight */}
                <div className="absolute inset-0.5 rounded-full border border-slate-500/40 pointer-events-none" />
                
                {/* Ferric Oxide Tape Pancake Spool Background */}
                <div className="absolute inset-2 sm:inset-3 rounded-full bg-gradient-to-br from-[#3b2015] via-[#24130c] to-[#120704] border-2 border-[#4d2a1b] shadow-inner" />
                
                {/* ROTATING 4K STUDIO NAB METAL REEL */}
                <div
                  style={{
                    animation: isPlaying ? `spin ${spinDuration} linear infinite` : 'none',
                  }}
                  className="relative w-36 h-36 sm:w-48 sm:h-48 rounded-full overflow-hidden transition-transform duration-300 shadow-2xl flex items-center justify-center"
                >
                  {reelImageLoaded ? (
                    <img
                      src={studioNabReelImg}
                      alt="4K Studio NAB Aluminum Tape Reel"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded-full filter drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]"
                      onError={() => setReelImageLoaded(false)}
                    />
                  ) : (
                    <div className="w-full h-full rounded-full border-4 border-slate-400 bg-slate-800 flex items-center justify-center">
                      <div className="w-2 h-full bg-slate-300" />
                      <div className="w-2 h-full bg-slate-300 rotate-60 absolute" />
                      <div className="w-2 h-full bg-slate-300 -rotate-60 absolute" />
                    </div>
                  )}

                  {/* Dynamic Specular Sheen Overlay */}
                  <div className="absolute inset-0 rounded-full bg-[radial-gradient(ellipse_at_35%_25%,rgba(255,255,255,0.22)_0%,transparent_60%)] pointer-events-none" />
                </div>

                {/* Center Solid Aluminum NAB Spindle Adapter */}
                <div className="absolute z-20 w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-slate-200 via-slate-400 to-slate-600 border-2 border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.9),inset_0_1px_3px_rgba(255,255,255,0.9)] flex items-center justify-center pointer-events-none">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-red-700 border-2 border-red-500 shadow-inner flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-black shadow-sm" />
                  </div>
                  {/* 3 Precision NAB Locking Lugs */}
                  <div className="absolute w-1 h-3.5 bg-slate-900 rounded -top-1" />
                  <div className="absolute w-1 h-3.5 bg-slate-900 rounded -bottom-1" />
                  <div className="absolute h-1 w-3.5 bg-slate-900 rounded -left-1" />
                </div>
              </div>

              {/* Right Take-Up Reel Label */}
              <div className="mt-2 text-center font-mono">
                <span className="text-[10px] font-bold text-slate-200 uppercase tracking-widest block">
                  TAKE-UP REEL • 10.5&quot; NAB
                </span>
                <span className="text-[8px] text-amber-400 font-bold">
                  AUDIO MASTER RECEIVER
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODE 2: 4K STUDIO MASTER PHOTOGRAPH (FULL RESOLUTION OVERVIEW) ================= */}
      {visualMode === 'studio_photo_4k' && (
        <div className="my-4 rounded-xl bg-black border-2 border-red-950 overflow-hidden relative shadow-2xl group">
          <div className="relative aspect-[16/9] w-full">
            <img
              src={reelDeck4kImg}
              alt="4K Studio Master Open Reel-to-Reel Tape Deck"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            
            {/* Live Audio Glow & VU Meter Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

            {/* Glowing Active Status Badge */}
            <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-md border border-red-700/80 text-white font-mono text-xs shadow-lg">
              <span className={`w-2.5 h-2.5 rounded-full ${isSpeaking ? 'bg-red-500 animate-ping' : isPlaying ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`} />
              <span className="font-bold">4K STUDIO MASTER SHOT</span>
              <span className="text-red-400 text-[10px]">3840 × 2160 ULTRA-HD</span>
            </div>

            {/* Zoom / Lightbox Trigger Button */}
            <button
              type="button"
              onClick={() => setShow4kLightbox(true)}
              className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-black/80 hover:bg-black text-teal-300 border border-teal-500/50 backdrop-blur-md font-mono text-xs flex items-center gap-1.5 shadow-lg transition"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>EXPAND 4K</span>
            </button>

            {/* Overlay Transport Status Banner */}
            <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-xl bg-black/85 backdrop-blur-md border border-slate-800 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">STATUS:</span>
                <span className="text-white font-bold">{isSpeaking ? 'VOCAL TRANSMISSION ACTIVE' : isPlaying ? 'PLAYING AMBIENT MASTER' : 'PAUSED'}</span>
              </div>
              <div className="text-amber-400 font-bold">
                VU: L {vuLeft.toFixed(0)}dB / R {vuRight.toFixed(0)}dB
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOWER ELECTRONICS & DUAL ANALOG VU NEEDLE METERS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        
        {/* TWIN VINTAGE ILLUMINATED ANALOG VU NEEDLE METERS */}
        <div className="p-3 rounded-xl bg-black/70 border border-slate-800 flex flex-col justify-between shadow-inner">
          <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pb-1.5 border-b border-slate-850">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              BALANCED ANALOG VU METERS
            </span>
            <span className="text-amber-400">STUDIO CALIBRATED 0VU = +4dBu</span>
          </div>

          {/* DUAL METERS: CH 1 (LEFT) & CH 2 (RIGHT) */}
          <div className="grid grid-cols-2 gap-3 py-2">
            
            {/* METER 1: LEFT CHANNEL */}
            <div className="relative h-20 bg-gradient-to-b from-[#2a2216] via-[#1a150e] to-[#0c0906] rounded-lg border-2 border-[#785b34]/70 p-2 overflow-hidden shadow-[inset_0_0_15px_rgba(245,158,11,0.25)] flex flex-col justify-between">
              {/* Dial Scale Markings */}
              <div className="flex items-center justify-between text-[7px] font-mono text-amber-200/80 px-1 pt-0.5">
                <span>-20</span>
                <span>-10</span>
                <span>-5</span>
                <span>-1</span>
                <span className="text-amber-400 font-bold">0</span>
                <span className="text-red-500 font-black">+3</span>
              </div>

              {/* Red Peak Danger Zone Arc (0 to +3 dB) */}
              <div className="absolute top-2 right-2 w-8 h-1 bg-red-600 rounded-full opacity-80" />

              {/* Physical Rotating Needle */}
              <div className="relative w-full h-9 flex justify-center items-end">
                <div
                  style={{
                    transform: `rotate(${vuLeft}deg)`,
                    transformOrigin: 'bottom center',
                  }}
                  className="w-0.5 h-10 bg-gradient-to-t from-red-600 to-amber-200 shadow-[0_0_3px_#f59e0b] transition-transform duration-75 ease-out"
                />
                {/* Needle Pivot Screw */}
                <div className="absolute -bottom-1 w-3 h-3 rounded-full bg-slate-900 border border-amber-600/80 z-10" />
              </div>

              <div className="flex items-center justify-between text-[7px] font-mono text-amber-300 font-bold px-1">
                <span>CH 1 • LEFT</span>
                <span className={vuLeft > 15 ? 'text-red-500 animate-pulse font-black' : 'text-slate-500'}>
                  {vuLeft > 15 ? 'PEAK' : 'NORMAL'}
                </span>
              </div>
            </div>

            {/* METER 2: RIGHT CHANNEL */}
            <div className="relative h-20 bg-gradient-to-b from-[#2a2216] via-[#1a150e] to-[#0c0906] rounded-lg border-2 border-[#785b34]/70 p-2 overflow-hidden shadow-[inset_0_0_15px_rgba(245,158,11,0.25)] flex flex-col justify-between">
              {/* Dial Scale Markings */}
              <div className="flex items-center justify-between text-[7px] font-mono text-amber-200/80 px-1 pt-0.5">
                <span>-20</span>
                <span>-10</span>
                <span>-5</span>
                <span>-1</span>
                <span className="text-amber-400 font-bold">0</span>
                <span className="text-red-500 font-black">+3</span>
              </div>

              {/* Red Peak Danger Zone Arc (0 to +3 dB) */}
              <div className="absolute top-2 right-2 w-8 h-1 bg-red-600 rounded-full opacity-80" />

              {/* Physical Rotating Needle */}
              <div className="relative w-full h-9 flex justify-center items-end">
                <div
                  style={{
                    transform: `rotate(${vuRight}deg)`,
                    transformOrigin: 'bottom center',
                  }}
                  className="w-0.5 h-10 bg-gradient-to-t from-red-600 to-amber-200 shadow-[0_0_3px_#f59e0b] transition-transform duration-75 ease-out"
                />
                {/* Needle Pivot Screw */}
                <div className="absolute -bottom-1 w-3 h-3 rounded-full bg-slate-900 border border-amber-600/80 z-10" />
              </div>

              <div className="flex items-center justify-between text-[7px] font-mono text-amber-300 font-bold px-1">
                <span>CH 2 • RIGHT</span>
                <span className={vuRight > 15 ? 'text-red-500 animate-pulse font-black' : 'text-slate-500'}>
                  {vuRight > 15 ? 'PEAK' : 'NORMAL'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* HEAVY-DUTY REEL-TO-REEL TRANSPORT CONTROLS */}
        <div className="p-3 rounded-xl bg-black/70 border border-slate-800 flex flex-col justify-between shadow-inner">
          <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pb-1.5 border-b border-slate-850">
            <span className="font-bold text-slate-200">STUDIO MASTER TRANSPORT</span>
            <span className="text-red-400 font-bold">SOLENOID ACTIVATED</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2">
            {/* PREV LINE / REWIND */}
            <button
              type="button"
              id="saw-reel-prev-btn"
              onClick={onPrevLine}
              disabled={!canPrev}
              className="py-2.5 px-2 rounded-xl text-xs font-mono font-bold flex flex-col items-center justify-center gap-1 bg-[#151926] text-slate-300 border border-slate-700 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition shadow"
              title="Rewind to previous line"
            >
              <span className="text-sm">◀◀</span>
              <span className="text-[9px]">REWIND</span>
            </button>

            {/* MASTER PLAY / PAUSE BUTTON */}
            <button
              type="button"
              id="saw-reel-play-btn"
              onClick={onTogglePlay}
              className={`py-2.5 px-3 rounded-xl text-xs font-mono font-bold flex flex-col items-center justify-center gap-1 transition shadow-lg col-span-1 ${
                isPlaying
                  ? 'bg-amber-950 text-amber-300 border border-amber-600 hover:bg-amber-900'
                  : 'bg-red-600 text-white hover:bg-red-500 shadow-red-900/60 scale-102'
              }`}
              title={isPlaying ? 'Pause Reel' : 'Play Reel'}
            >
              {isPlaying ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current text-amber-400" />
                  <span className="text-[10px]">PAUSE REEL</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current text-white" />
                  <span className="text-[10px]">PLAY REEL</span>
                </>
              )}
            </button>

            {/* REPLAY LINE */}
            <button
              type="button"
              id="saw-reel-replay-btn"
              onClick={onReplayLine}
              className="py-2.5 px-2 rounded-xl text-xs font-mono font-bold flex flex-col items-center justify-center gap-1 bg-[#1a1f2e] text-red-300 border border-red-900 hover:bg-red-950/80 hover:border-red-700 transition shadow"
              title="Replay current line"
            >
              <RotateCcw className="w-3.5 h-3.5 text-red-400" />
              <span className="text-[9px]">REPLAY</span>
            </button>

            {/* NEXT LINE / FAST FORWARD */}
            <button
              type="button"
              id="saw-reel-next-btn"
              onClick={onNextLine}
              disabled={!canNext}
              className="py-2.5 px-2 rounded-xl text-xs font-mono font-bold flex flex-col items-center justify-center gap-1 bg-[#151926] text-slate-300 border border-slate-700 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition shadow"
              title="Fast forward to next line"
            >
              <span className="text-sm">▶▶</span>
              <span className="text-[9px]">FAST FWD</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-[8px] font-mono text-slate-400 pt-1">
            <span>SERVO DIRECT-DRIVE</span>
            <span className="text-[#dfb15b]">CLICK ANY TRANSCRIPT LINE BELOW TO PLAY DIRECTLY</span>
          </div>
        </div>
      </div>

      {/* ================= 4K ULTRA-HD LIGHTBOX MODAL ================= */}
      {show4kLightbox && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-black/95 backdrop-blur-xl animate-in fade-in duration-200"
          onClick={() => setShow4kLightbox(false)}
        >
          <div
            className="relative w-full max-w-5xl bg-[#080b12] border-2 border-red-800/80 rounded-2xl shadow-[0_0_80px_rgba(220,38,38,0.3)] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-black/80">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                <h3 className="font-mono text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  STUDER / REVOX B77-MKII MASTER TAPE MACHINE
                  <span className="text-[10px] px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-700 font-mono">
                    4K ULTRA-HD INSPECTION
                  </span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShow4kLightbox(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 4K High-Res View Container */}
            <div className="p-3 sm:p-5 flex flex-col items-center">
              <div className="relative rounded-xl overflow-hidden border border-slate-800 shadow-2xl w-full max-h-[70vh]">
                <img
                  src={reelDeck4kImg}
                  alt="4K Studio Master Tape Recorder Deck"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto max-h-[70vh] object-contain mx-auto"
                />
              </div>

              {/* Technical Specifications Bar */}
              <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-[11px] font-mono text-slate-300">
                <div className="p-2.5 rounded-lg bg-black/60 border border-slate-800">
                  <span className="text-slate-500 block text-[9px]">REEL FORMAT</span>
                  <span className="font-bold text-white">10.5&quot; NAB Metal Flanges</span>
                </div>
                <div className="p-2.5 rounded-lg bg-black/60 border border-slate-800">
                  <span className="text-slate-500 block text-[9px]">TAPE SPEED</span>
                  <span className="font-bold text-amber-400">15 IPS Studio Master</span>
                </div>
                <div className="p-2.5 rounded-lg bg-black/60 border border-slate-800">
                  <span className="text-slate-500 block text-[9px]">HEADS</span>
                  <span className="font-bold text-red-400">3-Head Repro Cluster</span>
                </div>
                <div className="p-2.5 rounded-lg bg-black/60 border border-slate-800">
                  <span className="text-slate-500 block text-[9px]">CALIBRATION</span>
                  <span className="font-bold text-emerald-400">0VU = +4dBu Balanced</span>
                </div>
              </div>
            </div>

            {/* Lightbox Footer */}
            <div className="px-5 py-3 border-t border-slate-800 bg-black/70 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">
                Click anywhere outside or press Close to return to the interactive deck.
              </span>
              <button
                type="button"
                onClick={() => setShow4kLightbox(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs transition"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
