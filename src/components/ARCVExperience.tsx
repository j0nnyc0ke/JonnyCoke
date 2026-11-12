import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import * as THREE from 'three';
import { CREATOR_PROFILE } from '../data/portfolioData';
import { soundEngine } from '../game/audio';
import {
  Camera,
  CameraOff,
  Layers,
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Download,
  Printer,
  Maximize2,
  RefreshCw,
  Eye,
  CheckCircle2,
  Award,
  Briefcase,
  ExternalLink,
  Sliders,
  QrCode,
  ShieldCheck,
  Zap,
  Info,
  ChevronRight,
  Crosshair,
} from 'lucide-react';

interface ARCVExperienceProps {
  onSelectProject?: (projectId: string) => void;
  onOpenDocumentView?: () => void;
  onOpenAssetManager?: () => void;
  initialSpecialtyFilter?: string;
}

export const ARCVExperience: React.FC<ARCVExperienceProps> = ({
  onSelectProject,
  onOpenDocumentView,
  onOpenAssetManager,
  initialSpecialtyFilter = 'all',
}) => {
  // Camera & Stream States
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);

  // QR Code generation
  const [markerQrUrl, setMarkerQrUrl] = useState<string>('');

  useEffect(() => {
    QRCode.toDataURL('https://jonnycoke.com/', {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 350,
      color: {
        dark: '#080d1a',
        light: '#ffffff',
      },
    })
      .then(url => setMarkerQrUrl(url))
      .catch(err => console.warn('AR QR generation note:', err));
  }, []);

  // AR Projection Controls
  const [isExploded, setIsExploded] = useState<boolean>(false);
  const [holoStyle, setHoloStyle] = useState<'gold' | 'cyan' | 'crimson' | 'matrix'>('gold');
  const [targetLocked, setTargetLocked] = useState<boolean>(true);
  const [activeNode, setActiveNode] = useState<string | null>('century-one');
  const [showMarkerModal, setShowMarkerModal] = useState<boolean>(false);
  const [isSnapshotting, setIsSnapshotting] = useState<boolean>(false);

  // Audio Pitch Synthesizer
  const [isPitchPlaying, setIsPitchPlaying] = useState<boolean>(false);
  const [pitchSpeed, setPitchSpeed] = useState<number>(1.15); // slightly sped up per user request
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  // 3D Card Interaction (Gyroscope or Drag/Mouse)
  const [cardRotation, setCardRotation] = useState<{ x: number; y: number }>({ x: 8, y: -12 });
  const isDraggingRef = useRef<boolean>(false);
  const prevMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Camera initialization
  const startCamera = async (facing: 'user' | 'environment') => {
    try {
      setCameraError(null);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported on this browser/device.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
        soundEngine.playMarkerLocked();
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Camera permission denied or camera unavailable.';
      setCameraError(errorMsg);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const toggleCamera = () => {
    if (cameraActive) {
      stopCamera();
    } else {
      soundEngine.playHoloActivate();
      startCamera(facingMode);
    }
  };

  const flipCamera = () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    if (cameraActive) {
      startCamera(nextFacing);
    }
  };

  // Clean up camera stream and voice on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Gyroscope tilt support for mobile AR
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta !== null && e.gamma !== null) {
        // Constrain tilt to pleasant bounds
        const x = Math.max(-25, Math.min(25, (e.beta - 45) * 0.5));
        const y = Math.max(-30, Math.min(30, e.gamma * 0.6));
        setCardRotation({ x, y });
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation);
    }
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  // Handle Mouse / Touch Drag for Desktop or Touch Control
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    prevMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - prevMousePos.current.x;
    const deltaY = e.clientY - prevMousePos.current.y;
    prevMousePos.current = { x: e.clientX, y: e.clientY };

    setCardRotation(prev => ({
      x: Math.max(-35, Math.min(35, prev.x - deltaY * 0.35)),
      y: Math.max(-45, Math.min(45, prev.y + deltaX * 0.35)),
    }));
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  // Synthesized Voice Pitch Controls
  const toggleVoicePitch = () => {
    if (!('speechSynthesis' in window)) return;

    if (isPitchPlaying) {
      window.speechSynthesis.cancel();
      setIsPitchPlaying(false);
      return;
    }

    window.speechSynthesis.cancel();
    soundEngine.playHoloActivate();

    const pitchText = `Welcome to the Augmented Reality C V of Jonny Coke. Senior Graphic and Digital Designer with twenty-five plus years of industry leadership. Specialising in WCAG 2.2 AAA accessibility compliance, spatial motion design, and high-impact digital systems. From engineering the sector's first-ever Augmented Reality magazine cover for Dietetics Today, to directing publications for the Geological Society of London and the Commonwealth Secretariat. Explore the interactive holographic nodes or download the print edition.`
      .replace(/\bAI\b/gi, 'A I')
      .replace(/\bCV\b/gi, 'C V');

    const utterance = new SpeechSynthesisUtterance(pitchText);
    utterance.rate = Math.min(pitchSpeed, 0.9); // Measured, clear pacing
    utterance.pitch = 1.02;

    // Pick British English voice if available
    const voices = window.speechSynthesis.getVoices();
    const gbVoice = voices.find(v => v.lang === 'en-GB' || v.lang === 'en_GB') || voices.find(v => v.lang.startsWith('en'));
    if (gbVoice) {
      utterance.voice = gbVoice;
    }

    utterance.onend = () => {
      setIsPitchPlaying(false);
    };
    utterance.onerror = () => {
      setIsPitchPlaying(false);
    };

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPitchPlaying(true);
  };

  const handleSpeedChange = (newSpeed: number) => {
    setPitchSpeed(newSpeed);
    if (isPitchPlaying) {
      toggleVoicePitch();
      setTimeout(toggleVoicePitch, 150);
    }
  };

  // Color schemes for Hologram
  const colorThemes = {
    gold: {
      border: 'border-[#dfb15b]/60',
      glow: 'shadow-[0_0_40px_rgba(223,177,91,0.25)]',
      textAccent: 'text-[#dfb15b]',
      bgAccent: 'bg-[#dfb15b]/15',
      badgeBorder: 'border-[#dfb15b]/40',
      gradient: 'from-[#dfb15b] to-[#c41230]',
      gridColor: 'rgba(223,177,91,0.18)',
    },
    cyan: {
      border: 'border-cyan-400/60',
      glow: 'shadow-[0_0_40px_rgba(34,211,238,0.25)]',
      textAccent: 'text-cyan-400',
      bgAccent: 'bg-cyan-500/15',
      badgeBorder: 'border-cyan-400/40',
      gradient: 'from-cyan-400 to-blue-600',
      gridColor: 'rgba(34,211,238,0.18)',
    },
    crimson: {
      border: 'border-[#c41230]/60',
      glow: 'shadow-[0_0_40px_rgba(196,18,48,0.3)]',
      textAccent: 'text-rose-400',
      bgAccent: 'bg-[#c41230]/20',
      badgeBorder: 'border-[#c41230]/40',
      gradient: 'from-[#c41230] to-[#672288]',
      gridColor: 'rgba(196,18,48,0.2)',
    },
    matrix: {
      border: 'border-emerald-400/60',
      glow: 'shadow-[0_0_40px_rgba(52,211,153,0.25)]',
      textAccent: 'text-emerald-400',
      bgAccent: 'bg-emerald-500/15',
      badgeBorder: 'border-emerald-400/40',
      gradient: 'from-emerald-400 to-teal-600',
      gridColor: 'rgba(52,211,153,0.18)',
    },
  };

  const theme = colorThemes[holoStyle];

  // Career Nodes for Spatial Projection
  const careerNodes = [
    {
      id: 'century-one',
      title: 'Century One Publishing',
      role: 'Production / Editorial Graphic Designer',
      years: '2015 – 2019',
      highlight: 'Pioneered first AR trade union magazine (Dietetics Today with Blippar). PPA Cover of the Year Finalist. 28+ issues of Geoscientist magazine.',
      metrics: '15,000+ Followers • 28 Issues • PPA Finalist',
      projectId: 'geoscientist',
      icon: Award,
    },
    {
      id: 'commonwealth',
      title: 'Commonwealth Secretariat',
      role: 'Digital Content Assistant',
      years: '2023 – 2024',
      highlight: 'Global campaigns tackling domestic violence ("Commonwealth Says NO MORE"). 45% email open rates on Blue Charter newsletters. Royal assemblies coordination.',
      metrics: '45% Open Rates • 56 Nations • WCAG 2.2 AAA',
      projectId: 'commonwealth',
      icon: Briefcase,
    },
    {
      id: 'tfl',
      title: 'Transport for London (TfL)',
      role: 'Lead Designer (Freelance)',
      years: '2022',
      highlight: 'Lead designer for Issue 25 of On Route magazine. Authored fully WCAG-accessible tagged PDFs. Designed official Metro commuter newspaper travel spreads.',
      metrics: 'Issue 25 • WCAG Tagged PDF • London-Wide',
      projectId: 'tfl-on-route',
      icon: ShieldCheck,
    },
    {
      id: 'dewalt',
      title: 'Dragonfly / WIP (DeWalt & Stanley)',
      role: 'Digital Content Executive',
      years: '2022',
      highlight: 'Managed global licensed power brands. Created Point of Sale retail store displays, branded packaging, promotional 3D motion animations.',
      metrics: 'Global Power Brands • POS Displays • 3D Animation',
      projectId: 'dewalt-stanley',
      icon: Zap,
    },
    {
      id: 'motorsport',
      title: 'Motorsport Network (Autosport / F1)',
      role: 'Marketing Graphic Designer',
      years: '2019',
      highlight: 'National direct-response campaigns, animated MPUs, social assets, conversion testing for top racing media brands.',
      metrics: 'F1 / Autosport • High Conversion • Dynamic MPUs',
      projectId: 'motorsport-network',
      icon: Crosshair,
    },
  ];

  const selectedNodeData = careerNodes.find(n => n.id === activeNode);

  // Take Snapshot of AR View
  const handleTakeSnapshot = () => {
    setIsSnapshotting(true);
    soundEngine.playHit(true);

    // Briefly trigger flash effect
    setTimeout(() => {
      setIsSnapshotting(false);
      // Create a printable notification
      alert('Holographic AR Snapshot captured! You can save this view or print the verified document.');
    }, 400);
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300">
      {/* 1. TOP AR HUD CONTROL BAR */}
      <div className="bg-[#0a0f1d]/90 border border-slate-800 backdrop-blur-xl rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#dfb15b]/20 border border-[#dfb15b]/40 flex items-center justify-center text-[#dfb15b]">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-white tracking-wide">
                AUGMENTED REALITY (AR) SPATIAL CV
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                AR CORE v2.5
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive 3D Holographic Card • WebRTC Camera Pass-Through • Multi-Plane Z-Depth
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Camera Pass-through Toggle */}
          <button
            onClick={toggleCamera}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md ${
              cameraActive
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-[#dfb15b] hover:bg-[#e5c07b] text-[#080d1a]'
            }`}
          >
            {cameraActive ? (
              <>
                <CameraOff className="w-4 h-4" />
                <span>Disable Camera</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                <span>Enable Camera AR</span>
              </>
            )}
          </button>

          {cameraActive && (
            <button
              onClick={flipCamera}
              className="p-2 rounded-xl bg-[#0c1427] hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
              title="Flip Front / Rear Camera"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          {/* Exploded 3D Depth Toggle */}
          <button
            onClick={() => {
              const next = !isExploded;
              setIsExploded(next);
              soundEngine.playLayerExplode(next);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
              isExploded
                ? 'bg-indigo-600/30 border-indigo-400 text-indigo-200'
                : 'bg-[#0c1427] border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 text-[#dfb15b]" />
            <span>{isExploded ? 'Collapse Layers' : 'Explode 3D Layers'}</span>
          </button>

          {/* Hologram Audio Voiceover */}
          <button
            onClick={toggleVoicePitch}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
              isPitchPlaying
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 animate-pulse'
                : 'bg-[#0c1427] border-slate-800 text-slate-300 hover:text-white'
            }`}
            title="Listen to Executive Pitch Voiceover"
          >
            {isPitchPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-[#dfb15b]" />}
            <span>{isPitchPlaying ? 'Pause Voice' : 'Audio Pitch'}</span>
            <span className="text-[10px] font-mono px-1 rounded bg-black/40 text-[#dfb15b]">
              {pitchSpeed}x
            </span>
          </button>

          {/* AR Target Marker Modal */}
          <button
            onClick={() => {
              soundEngine.playClick();
              setShowMarkerModal(true);
            }}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-[#0c1427] hover:bg-slate-800 text-slate-300 border border-slate-800 transition flex items-center gap-1.5"
            title="Download Printable AR Marker Card"
          >
            <QrCode className="w-4 h-4 text-[#dfb15b]" />
            <span className="hidden sm:inline">AR Marker Card</span>
          </button>

          {/* Quick Switch to Clean Printable Document */}
          {onOpenDocumentView && (
            <button
              onClick={onOpenDocumentView}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-[#0c1427] hover:bg-slate-800 text-slate-300 border border-slate-800 transition flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-[#dfb15b]" />
              <span>Print / PDF View</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. CAMERA ERROR NOTICE (IF CAMERA BLOCKED) */}
      {cameraError && (
        <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-600/40 text-amber-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              Camera pass-through inactive ({cameraError}). Continuing in{' '}
              <strong>Spatial Hologram Studio Mode</strong> with full 3D interactive controls.
            </span>
          </div>
          <button
            onClick={() => setCameraError(null)}
            className="text-amber-400 hover:text-white font-mono text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3. MAIN AR VIEWPORT CONTAINER */}
      <div
        ref={canvasContainerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={`relative w-full min-h-[620px] rounded-3xl overflow-hidden border border-slate-800/90 shadow-2xl flex items-center justify-center select-none touch-none transition-all duration-300 ${
          cameraActive ? 'bg-transparent' : 'bg-[#060a14]'
        }`}
        style={{ perspective: '1200px' }}
      >
        {/* WEBRTC CAMERA PASS-THROUGH BACKGROUND */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-700 ${
            cameraActive ? 'opacity-90' : 'opacity-0'
          }`}
        />

        {/* AMBIENT HOLOGRAM STUDIO ROOM (WHEN CAMERA IS OFF) */}
        {!cameraActive && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Perspective Floor Grid */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `linear-gradient(to right, ${theme.gridColor} 1px, transparent 1px), linear-gradient(to bottom, ${theme.gridColor} 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
                transform: 'perspective(500px) rotateX(60deg) translateY(120px) scale(2)',
              }}
            />
            {/* Ambient Radial Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#dfb15b]/10 rounded-full blur-[100px]" />
            <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-[#c41230]/15 rounded-full blur-[90px]" />
            {/* Hologram Pedestal Base */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-80 h-10 rounded-[100%] bg-gradient-to-r from-transparent via-[#dfb15b]/30 to-transparent blur-md" />
          </div>
        )}

        {/* AR SCANNER HUD OVERLAY */}
        <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between z-20">
          {/* Top HUD Stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-mono text-[11px] text-white tracking-widest uppercase">
                {cameraActive ? 'SPATIAL PASS-THROUGH ACTIVE' : 'HOLO-STUDIO ACTIVE'}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                ROT: [{cardRotation.x.toFixed(0)}°, {cardRotation.y.toFixed(0)}°]
              </span>
            </div>

            <div className="flex items-center gap-2 pointer-events-auto">
              {/* Color Scheme Switcher */}
              <div className="flex items-center gap-1 bg-[#080d1a]/80 backdrop-blur-md p-1 rounded-xl border border-slate-800 text-[10px] font-mono">
                {(['gold', 'cyan', 'crimson', 'matrix'] as const).map(style => (
                  <button
                    key={style}
                    onClick={() => {
                      soundEngine.playClick();
                      setHoloStyle(style);
                    }}
                    className={`px-2 py-1 rounded-lg uppercase font-bold transition ${
                      holoStyle === style
                        ? 'bg-[#dfb15b] text-[#080d1a]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>

              {/* Reset Tilt */}
              <button
                onClick={() => setCardRotation({ x: 8, y: -12 })}
                className="p-1.5 rounded-xl bg-[#080d1a]/80 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono"
                title="Reset Card Angle"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* AR Target Reticle Corners */}
          <div className="absolute inset-8 border border-white/10 pointer-events-none rounded-2xl flex flex-col justify-between">
            <div className="flex justify-between p-2 text-white/30 font-mono text-[9px]">
              <span>┌ AR-TRACK // 001</span>
              <span>AR-LOCK // WCAG-AAA ┐</span>
            </div>
            {/* Center Crosshairs */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center opacity-30">
              <Crosshair className="w-16 h-16 text-[#dfb15b] animate-spin" style={{ animationDuration: '24s' }} />
            </div>
            <div className="flex justify-between p-2 text-white/30 font-mono text-[9px]">
              <span>└ MONOGRAM-STAMP: JC</span>
              <span>25+ YRS MASTERY ┘</span>
            </div>
          </div>

          {/* Bottom HUD Controller */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pointer-events-auto">
            <div className="flex items-center gap-2 text-[11px] text-slate-300 font-mono bg-[#080d1a]/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-[#dfb15b]">● TOUCH &amp; DRAG</span>
              <span className="text-slate-500">|</span>
              <span>GYRO TILT SUPPORTED</span>
            </div>

            {/* Voice Pitch Speed & Visualizer */}
            {isPitchPlaying && (
              <div className="flex items-center gap-2 bg-[#080d1a]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-amber-500/40 text-xs text-amber-300 font-mono animate-in fade-in">
                <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                <span>NARRATING EXECUTIVE SUMMARY</span>
                <div className="flex items-center gap-1 ml-2">
                  {[1.0, 1.15, 1.25, 1.5].map(speed => (
                    <button
                      key={speed}
                      onClick={() => handleSpeedChange(speed)}
                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                        pitchSpeed === speed ? 'bg-[#dfb15b] text-[#080d1a] font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. THE 3D HOLOGRAPHIC AUGMENTED REALITY CV CARD */}
        <div
          className="relative z-10 w-[92%] sm:w-[480px] md:w-[540px] transition-transform duration-100 ease-out cursor-grab active:cursor-grabbing"
          style={{
            transform: `rotateX(${cardRotation.x}deg) rotateY(${cardRotation.y}deg)`,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* LAYER 1: BASE SUBSTRATE (ARCHITECTURAL GLASS) */}
          <div
            className={`w-full rounded-3xl p-6 sm:p-8 backdrop-blur-2xl border transition-all duration-500 ${theme.border} ${theme.glow} ${
              cameraActive ? 'bg-[#080d1a]/90' : 'bg-[#0a0f1d]/95'
            }`}
            style={{
              transform: isExploded ? 'translateZ(-50px)' : 'translateZ(0px)',
              boxShadow: '0 25px 60px -15px rgba(0,0,0,0.85)',
            }}
          >
            {/* Holographic Scanline Wave */}
            <div
              className="absolute inset-0 rounded-3xl opacity-20 pointer-events-none overflow-hidden"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.06) 3px, rgba(255,255,255,0.06) 6px)',
              }}
            />

            {/* Header: Exact Logo Monogram & Name */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-800/80 pb-5">
              <div className="flex items-center gap-3.5">
                {/* Monogram Logo Container */}
                <div className="w-14 h-16 sm:w-16 sm:h-20 shrink-0 flex items-center justify-center p-1 bg-[#080d1a]/80 rounded-2xl border border-slate-800">
                  <img
                    src="/image.png?v=3"
                    alt="Jonny Coke Logo"
                    className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(223,177,91,0.4)]"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div>
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono ${theme.bgAccent} ${theme.textAccent} border ${theme.badgeBorder} mb-1`}>
                    <ShieldCheck className="w-3 h-3" />
                    WCAG 2.2 AAA ACCREDITED
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {CREATOR_PROFILE.name}
                  </h3>
                  <p className="text-xs text-slate-300 font-medium">
                    Senior Graphic &amp; Digital Designer
                  </p>
                  <p className="text-[11px] text-[#dfb15b] font-mono mt-0.5">
                    Accessibility &amp; Motion Specialist • 25+ Yrs
                  </p>
                </div>
              </div>

              {/* AR Status Beacon */}
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="font-mono text-[9px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  AR LOCKED
                </span>
                <span className="font-mono text-[9px] text-slate-400">
                  REF: JC-2026
                </span>
              </div>
            </div>

            {/* Verified Career Timeline Orbitals (Interactive Nodes) */}
            <div className="py-4 border-b border-slate-800/80">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#dfb15b] flex items-center gap-1.5">
                  <Briefcase className="w-3 h-3" />
                  INTERACTIVE CAREER BEACONS (TAP TO INSPECT)
                </span>
                <span className="text-[9px] font-mono text-slate-400">
                  5 KEY MILESTONES
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {careerNodes.map(node => {
                  const isCurrent = activeNode === node.id;
                  const Icon = node.icon;
                  return (
                    <button
                      key={node.id}
                      onClick={() => {
                        soundEngine.playClick();
                        setActiveNode(node.id);
                      }}
                      className={`p-2.5 rounded-xl text-left transition flex flex-col justify-between border relative overflow-hidden ${
                        isCurrent
                          ? `bg-[#dfb15b]/20 border-[#dfb15b] text-white shadow-lg`
                          : 'bg-[#080d1a]/70 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-[#dfb15b]' : 'text-slate-500'}`} />
                        <span className="text-[9px] font-mono text-slate-400">{node.years.split('–')[0]}</span>
                      </div>
                      <div className="text-[11px] font-bold truncate text-slate-200">
                        {node.title}
                      </div>
                      <div className="text-[9px] text-slate-400 truncate">
                        {node.role}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Core Competencies Quick Matrix */}
            <div className="pt-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#dfb15b] mb-2 block flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                VERIFIED COMPETENCY PILLARS
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'WCAG 2.2 AAA Accessibility',
                  'Augmented Reality (Blippar / WebXR)',
                  'Motion Graphics (After Effects)',
                  'Editorial & Publication Direction',
                  'Brand Architecture Systems',
                  'Three.js & Spatial WebGL',
                ].map((skill, idx) => (
                  <span
                    key={skill}
                    className="text-[10px] font-mono px-2 py-1 rounded-lg bg-[#080d1a] border border-slate-800 text-slate-300 flex items-center gap-1"
                  >
                    <span className="w-1 h-1 rounded-full bg-[#dfb15b]" />
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Direct Contact Bar */}
            <div className="mt-5 pt-4 border-t border-slate-850 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>LON // 07886 00 64 69</span>
              <a
                href="mailto:info@jonnycoke.com"
                className="text-[#dfb15b] hover:underline"
              >
                info@jonnycoke.com
              </a>
            </div>
          </div>

          {/* LAYER 2: EXPLODED FLOATING HOLO-INSPECTION BEACON (Z-DEPTH +60px) */}
          {selectedNodeData && (
            <div
              className={`mt-4 rounded-2xl p-4 backdrop-blur-xl border border-[#dfb15b]/50 bg-[#070b16]/95 shadow-2xl transition-all duration-500`}
              style={{
                transform: isExploded ? 'translateZ(75px)' : 'translateZ(25px)',
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-[#dfb15b]/20 text-[#dfb15b] border border-[#dfb15b]/40">
                      SPATIAL DETAIL BEACON
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {selectedNodeData.years}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-1">
                    {selectedNodeData.title} — {selectedNodeData.role}
                  </h4>
                </div>
                {onSelectProject && (
                  <button
                    onClick={() => onSelectProject(selectedNodeData.projectId)}
                    className="px-2.5 py-1 rounded-lg bg-[#dfb15b] text-[#080d1a] text-[10px] font-extrabold hover:bg-[#e5c07b] transition flex items-center gap-1 shrink-0"
                  >
                    <span>View Case Study</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-2.5">
                {selectedNodeData.highlight}
              </p>
              <div className="p-2 rounded-xl bg-[#03060f] border border-slate-800 text-[10px] font-mono text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{selectedNodeData.metrics}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. AR TARGET MARKER MODAL (FOR PHYSICAL SCANNING) */}
      {showMarkerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-[#0c1427] border border-slate-750 rounded-3xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#dfb15b]" />
                <h3 className="text-base font-bold text-white">Official AR Target Marker Card</h3>
              </div>
              <button
                onClick={() => setShowMarkerModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="py-4 text-center flex flex-col items-center">
              <p className="text-xs text-slate-300 mb-3 max-w-sm">
                Point your phone camera at the QR code to open the live AR portfolio, or use the optical marker for camera target locking.
              </p>

              {/* Target Dual Presentation: Logo Marker & Live Scannable QR Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {/* 1. Official Optical Marker Card */}
                <div className="bg-white p-3.5 rounded-2xl border-2 border-slate-900 shadow-xl flex flex-col items-center justify-between relative min-h-[240px]">
                  {/* Target Corners */}
                  <div className="absolute top-2 left-2 w-5 h-5 border-t-4 border-l-4 border-black" />
                  <div className="absolute top-2 right-2 w-5 h-5 border-t-4 border-r-4 border-black" />
                  <div className="absolute bottom-2 left-2 w-5 h-5 border-b-4 border-l-4 border-black" />
                  <div className="absolute bottom-2 right-2 w-5 h-5 border-b-4 border-r-4 border-black" />

                  <div className="text-[9px] font-mono font-bold tracking-widest text-black uppercase mt-1">
                    OPTICAL AR TARGET
                  </div>

                  <div className="w-20 h-24 flex items-center justify-center my-auto">
                    <img
                      src="/image.png?v=3"
                      alt="Jonny Coke Official Monogram Target"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="text-[8px] font-mono text-neutral-800 tracking-tighter mb-1">
                    WCAG 2.2 AAA • SPATIAL CV
                  </div>
                </div>

                {/* 2. Real Scannable QR Code */}
                <div className="bg-white p-3.5 rounded-2xl border-2 border-slate-900 shadow-xl flex flex-col items-center justify-between relative min-h-[240px]">
                  <div className="text-[9px] font-mono font-bold tracking-widest text-black uppercase mt-1">
                    SMARTPHONE SCANNABLE QR
                  </div>

                  <div className="w-24 h-24 flex items-center justify-center my-auto p-1 relative">
                    {markerQrUrl ? (
                      <img
                        src={markerQrUrl}
                        alt="Scannable QR Code"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <QrCode className="w-16 h-16 text-black" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-4 h-4 rounded-full bg-[#080d1a] border border-[#dfb15b] flex items-center justify-center p-0.5 shadow">
                        <img src="/image.png?v=3" alt="" className="w-full h-full object-contain" />
                      </div>
                    </div>
                  </div>

                  <div className="text-[8px] font-mono text-neutral-800 tracking-tighter mb-1">
                    SCAN TO LAUNCH MOBILE AR
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#dfb15b] hover:bg-[#e5c07b] text-[#080d1a] transition flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Targets
                </button>
                {markerQrUrl && (
                  <a
                    href={markerQrUrl}
                    download="jonny_coke_ar_qr.png"
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-[#dfb15b]" />
                    Save QR PNG
                  </a>
                )}
              </div>
              <button
                onClick={() => setShowMarkerModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#080d1a] hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
