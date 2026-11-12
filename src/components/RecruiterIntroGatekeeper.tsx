import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  Play,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Sliders,
  Sparkles,
  FileText,
  ArrowRight,
  Flame,
  Award,
  Maximize2,
  X,
  Radio,
  Disc,
  Crosshair,
  Volume2,
  VolumeX,
  Music,
  Film,
  Video,
  Pause,
  Upload,
  ExternalLink,
} from 'lucide-react';
import { soundEngine } from '../game/audio';
import { jigsawVoiceEngine } from '../game/jigsawVoiceEngine';
import { AUTHENTIC_JONNYCOKE_IMAGES, AuthenticSubpageImage } from '../data/portfolioData';
import { ReelToReelDeck } from './ReelToReelDeck';

interface RecruiterIntroGatekeeperProps {
  onComplete: () => void;
  onDismissWithoutPassing?: () => void;
}

export const RecruiterIntroGatekeeper: React.FC<RecruiterIntroGatekeeperProps> = ({
  onComplete,
  onDismissWithoutPassing,
}) => {
  // Audio tape state
  const [tapePlaying, setTapePlaying] = useState(true);
  const [tapeTranscriptIndex, setTapeTranscriptIndex] = useState(0);
  const [tapeCounter, setTapeCounter] = useState(1);
  const [loopIteration, setLoopIteration] = useState<number>(1);
  const transcriptIndexRef = useRef(0);
  const tapePlayingRef = useRef(true);
  const loopIterationRef = useRef<number>(1);

  // Audio Playback states
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState<boolean>(false);
  // Transparency for Jigsaw protocol chamber (66% opacity)
  const [chamberOpacity, setChamberOpacity] = useState<number>(0.66);
  const [hasUserInteracted, setHasUserInteracted] = useState<boolean>(false);
  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(false);
  const [audioMuted, setAudioMuted] = useState<boolean>(false);
  const [voiceVolume, setVoiceVolume] = useState<number>(0.95); // High clarity Tobin Bell horror voice
  const [voiceSpeed, setVoiceSpeed] = useState<number>(1.0); // Authentic tempo (mastered with scary low pitch & crisp delivery)
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);

  // Cassette Tape Visual: Default to authentic analog mechanical deck (spinning spools, CrO2 Chrome shell)
  const [tapeVideoUrl, setTapeVideoUrl] = useState<string>('');
  const [tapeVisualMode, setTapeVisualMode] = useState<'video' | 'analog'>('analog');
  const [videoHasError, setVideoHasError] = useState<boolean>(false);
  const tapeVideoRef = useRef<HTMLVideoElement | null>(null);

  // Beethoven's Moonlight Sonata (Op. 27 No. 2 - Adagio sostenuto) Ambient Accompaniment
  // Set to a steady, single balanced level (no ducking or volume jumps)
  const moonlightAudioRef = useRef<HTMLAudioElement | null>(null);
  const [moonlightVolume, setMoonlightVolume] = useState<number>(0.28); // Steady balanced background level
  const [moonlightEnabled, setMoonlightEnabled] = useState<boolean>(true);
  const [musicIsPlaying, setMusicIsPlaying] = useState<boolean>(false);

  // Detect mobile device
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        window.innerWidth < 768;
      setIsMobileDevice(isMobile);
    }
  }, []);

  // Play Moonlight Sonata in the background at a single steady level
  const playMoonlightSonata = (vol = moonlightVolume) => {
    if (typeof window === 'undefined' || !moonlightEnabled) return;
    try {
      if (!moonlightAudioRef.current) {
        const audio = new Audio('/audio/moonlight_sonata.mp3');
        audio.loop = true;
        audio.playbackRate = 0.88; // slow, mournful, and eerie
        audio.volume = audioMuted ? 0 : vol;
        audio.muted = audioMuted;
        moonlightAudioRef.current = audio;
      }
      const audio = moonlightAudioRef.current;
      audio.playbackRate = 0.88;
      audio.volume = audioMuted ? 0 : vol;
      audio.muted = audioMuted;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setMusicIsPlaying(true);
            setAutoplayBlocked(false);
          })
          .catch((err) => {
            console.warn('Moonlight Sonata play blocked by autoplay policy:', err);
            setMusicIsPlaying(false);
            setAutoplayBlocked(true);
          });
      }
    } catch (err) {
      console.warn('Moonlight Sonata initialization note:', err);
    }
  };

  const pauseMoonlightSonata = () => {
    if (moonlightAudioRef.current) {
      try {
        moonlightAudioRef.current.pause();
        setMusicIsPlaying(false);
      } catch {}
    }
  };

  const stopMoonlightSonata = () => {
    if (moonlightAudioRef.current) {
      try {
        moonlightAudioRef.current.pause();
        moonlightAudioRef.current.currentTime = 0;
        setMusicIsPlaying(false);
      } catch {}
      moonlightAudioRef.current = null;
    }
  };

  // Maintain steady, single-level audio without ducking or jumping between lines
  useEffect(() => {
    if (moonlightAudioRef.current && tapePlaying && !audioMuted && moonlightEnabled) {
      moonlightAudioRef.current.volume = moonlightVolume;
      moonlightAudioRef.current.muted = false;
    }
  }, [tapePlaying, audioMuted, moonlightEnabled, moonlightVolume]);

  // Keep tapePlayingRef synchronized
  useEffect(() => {
    tapePlayingRef.current = tapePlaying;
  }, [tapePlaying]);

  useEffect(() => {
    if (!tapePlaying) return;
    const interval = setInterval(() => {
      setTapeCounter(c => c + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [tapePlaying]);

  // Synchronize tape video playback and speed with cassette state
  useEffect(() => {
    if (!tapeVideoRef.current) return;
    try {
      tapeVideoRef.current.playbackRate = voiceSpeed;
      if (tapePlaying) {
        const p = tapeVideoRef.current.play();
        if (p !== undefined) p.catch(() => {});
      } else {
        tapeVideoRef.current.pause();
      }
    } catch {}
  }, [tapePlaying, voiceSpeed, tapeVisualMode]);

  // Active Tab: 'saw_trials' | 'ats_canisters'
  const [activeTab, setActiveTab] = useState<'saw_trials' | 'ats_canisters'>('saw_trials');

  // Trial 1: Kerning Gallows (Target tracking = 0, range -50 to +50)
  const [kerningValue, setKerningValue] = useState<number>(34);
  const [kerningPassed, setKerningPassed] = useState<boolean>(false);

  // Trial 2: WCAG Contrast Guillotine
  const [selectedContrastKey, setSelectedContrastKey] = useState<string | null>(null);
  const [contrastPassed, setContrastPassed] = useState<boolean>(false);
  const [contrastError, setContrastError] = useState<string | null>(null);

  // Trial 3: Authentic Artifact Dissection (Images from jonnycoke.com subpages)
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(null);
  const [artifactPassed, setArtifactPassed] = useState<boolean>(false);
  const [artifactError, setArtifactError] = useState<string | null>(null);
  const [inspectingArtifact, setInspectingArtifact] = useState<AuthenticSubpageImage | null>(null);
  const [failedArtifactImages, setFailedArtifactImages] = useState<Record<string, boolean>>({});

  // Trial 3 AR Video Demonstration State (dynamic MP4 showcase)
  const [videoIsPlaying, setVideoIsPlaying] = useState<boolean>(true);
  const [videoProgress, setVideoProgress] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(16);
  const [videoMuted, setVideoMuted] = useState<boolean>(true);
  const modalVideoRef = useRef<HTMLVideoElement | null>(null);

  // Brent Council Shisha Leaflet multi-page inspection state
  const [shishaPreviewPage, setShishaPreviewPage] = useState<number>(1);

  // Trial 4 (Alternative): Recruiter ATS Sins & Client Spec-Work Traps
  const [puncturedCanisters, setPuncturedCanisters] = useState<string[]>([]);
  const [canisterFilter, setCanisterFilter] = useState<'all' | 'client' | 'recruiter'>('all');
  const [lastPuncturedRetort, setLastPuncturedRetort] = useState<{
    label: string;
    retort: string;
    tag: string;
  } | null>(null);

  interface ToxicCanister {
    id: string;
    label: string;
    category: 'recruiter' | 'client';
    categoryLabel: string;
    tag: string;
    retort: string;
  }

  const TOXIC_CANISTERS: ToxicCanister[] = [
    // Client Spec-Work & Cheap Exploitation Traps
    {
      id: 'cl1',
      label: '“This will be good for your portfolio”',
      category: 'client',
      categoryLabel: 'Client Cheap Work Trope',
      tag: 'CLIENT TRAP',
      retort: 'I work like everything I do could be a portfolio piece! Quality is non-negotiable.',
    },
    {
      id: 'cl2',
      label: '“I want it to look professional”',
      category: 'client',
      categoryLabel: 'Client Under-Appreciation',
      tag: 'CLIENT TRAP',
      retort: 'Design IS my profession — 25+ years of verified commercial craftsmanship, not a weekend hobby!',
    },
    {
      id: 'cl3',
      label: '“Can you just do a quick spec mockup first?”',
      category: 'client',
      categoryLabel: 'Unpaid Spec Work',
      tag: 'CLIENT TRAP',
      retort: 'You are paying for the 25 years of mastery it took to execute it with precision in 20 minutes.',
    },
    {
      id: 'cl4',
      label: '“No budget now, but huge exposure later!”',
      category: 'client',
      categoryLabel: 'Exposure Currency',
      tag: 'CLIENT TRAP',
      retort: 'People die of exposure. Adobe CC subscriptions and studio rent require real commercial currency.',
    },
    {
      id: 'cl5',
      label: '“It should only take 5 minutes in Photoshop”',
      category: 'client',
      categoryLabel: 'Effort Minimisation',
      tag: 'CLIENT TRAP',
      retort: 'Vector geometry, typographic hierarchy, and WCAG AAA contrast are engineered, not slapped together.',
    },
    {
      id: 'cl6',
      label: '“Can you make it pop without senior rates?”',
      category: 'client',
      categoryLabel: 'Buzzword Low-Balling',
      tag: 'CLIENT TRAP',
      retort: 'Proportion, mathematical rhythm, and optical kerning command market attention—not empty buzzwords.',
    },

    // Recruiter Automated Screening Sins
    {
      id: 'r1',
      label: 'Unpaid 40hr Take-Home Brief',
      category: 'recruiter',
      categoryLabel: 'Automated Recruiter Sin',
      tag: 'RECRUITER SIN',
      retort: 'Exploitative spec briefs disguised as tests devalue seasoned human craftsmanship.',
    },
    {
      id: 'r2',
      label: 'Rockstar Ninja (Junior Salary)',
      category: 'recruiter',
      categoryLabel: 'Automated Recruiter Sin',
      tag: 'RECRUITER SIN',
      retort: 'Senior 25+ year leadership requires transparent, equitable commercial compensation.',
    },
    {
      id: 'r3',
      label: 'Competitive Salary (DOE / Zero Perks)',
      category: 'recruiter',
      categoryLabel: 'Automated Recruiter Sin',
      tag: 'RECRUITER SIN',
      retort: 'Vague salary ranges conceal under-market pay scales. Transparency is standard.',
    },
    {
      id: 'r4',
      label: 'Ghosted After 4 Interview Rounds',
      category: 'recruiter',
      categoryLabel: 'Automated Recruiter Sin',
      tag: 'RECRUITER SIN',
      retort: 'Basic professional dignity requires honest, timely closing communication.',
    },
    {
      id: 'r5',
      label: 'Demanding 10 Yrs Experience in 2021 Tool',
      category: 'recruiter',
      categoryLabel: 'Automated Recruiter Sin',
      tag: 'RECRUITER SIN',
      retort: 'Foundational typographic perception and visual problem solving outlive transient software.',
    },
    {
      id: 'r6',
      label: 'Auto-Rejected by ATS in 4 Seconds',
      category: 'recruiter',
      categoryLabel: 'Automated Recruiter Sin',
      tag: 'RECRUITER SIN',
      retort: 'Algorithms cannot perceive optical balance, brand resonance, or accessibility.',
    },
  ];

  // Overall Clearance State
  const [clearanceGranted, setClearanceGranted] = useState(false);

  // Countdown timer for psychological tension
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes

  const tapeTranscriptLines = [
    'RECORDING INITIALIZED // SUITE 8B ARCHIVE...',
    'Hello, Recruiter... I want to play a game!',
    'For years, you glanced at 15+ years of master craftsmanship for an average of 4.7 seconds!',
    'You fed human creativity into heartless ATS keyword grinders, ghosted seasoned designers after 40-hour briefs, and demanded 8 years of AI in 2017!',
    'Now, the tables are turned! You are in my Reverse-Recruiter Chamber!',
    'If you want to view my verified portfolio and CV, you must prove you possess genuine design perception! Choose your path: 3 Graphic Design Tests... or Confess.',
    'Proceed... or Ghost?!',
  ];

  // Spoken lines for fallback (with explicit phonetic separation for AI, ATS, CV)
  const spokenTapeLines = [
    'Recording initialized! Suite eight B archive.',
    'Hello, Recruiter! I want to play a game!',
    'For years, you glanced at fifteen plus years of master craftsmanship, for an average of four point seven seconds!',
    'You fed human creativity into heartless A T S keyword grinders, ghosted seasoned designers after forty-hour briefs, and demanded eight years of A I in 2017!',
    'Now, the tables are turned! You are in my Reverse-Recruiter Chamber!',
    'If you want to view my verified portfolio and C V, you must prove you possess genuine design perception! Choose your path: three graphic design tests... or confess!',
    'Proceed... or Ghost?!',
  ];

  // Stop active voice and cancel timeouts cleanly
  const stopVoice = () => {
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
    jigsawVoiceEngine.stop();
    if (voiceAudioRef.current) {
      try {
        voiceAudioRef.current.pause();
        voiceAudioRef.current.currentTime = 0;
      } catch {}
    }
    if (tapeVideoRef.current) {
      try {
        tapeVideoRef.current.pause();
      } catch {}
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    setIsSpeaking(false);
  };

  // Speak line using authentic Jigsaw pre-generated audio
  // Uses Web Audio API engine first so iOS Safari and mobile Chrome do not block playback between lines
  const speakCurrentLine = (lineIdx: number) => {
    if (typeof window === 'undefined') return;

    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }

    // Ensure audio context and soundEngine are active and unmuted
    soundEngine.unmute();
    soundEngine.resumeContext();

    const advanceToNextLine = () => {
      setIsSpeaking(false);
      if (tapeVideoRef.current) {
        try {
          tapeVideoRef.current.pause();
        } catch {}
      }

      if (lineIdx < tapeTranscriptLines.length - 1 && tapePlayingRef.current) {
        speechTimeoutRef.current = setTimeout(() => {
          if (!tapePlayingRef.current) return;
          const nextIdx = lineIdx + 1;
          transcriptIndexRef.current = nextIdx;
          setTapeTranscriptIndex(nextIdx);
          soundEngine.playSawTapeHiss();
          speakCurrentLine(nextIdx);
        }, 380); // Tense, menacing cadence between lines (NO awkward long pauses)
      } else if (loopIterationRef.current < 2 && tapePlayingRef.current) {
        loopIterationRef.current += 1;
        setLoopIteration(loopIterationRef.current);
        soundEngine.playSawTapeHiss();
        speechTimeoutRef.current = setTimeout(() => {
          if (!tapePlayingRef.current) return;
          transcriptIndexRef.current = 0;
          setTapeTranscriptIndex(0);
          soundEngine.playSawTapeHiss();
          speakCurrentLine(0);
        }, 1200);
      } else {
        soundEngine.playSawTapeHiss();
      }
    };

    // 1. Primary: High-fidelity Web Audio Buffer engine (zero latency, immune to iOS gesture expiry in setTimeout)
    jigsawVoiceEngine.playLine(
      lineIdx,
      audioMuted ? 0 : voiceVolume,
      voiceSpeed,
      () => {
        setIsSpeaking(true);
        setAutoplayBlocked(false);
        soundEngine.playSawVoiceBlip();
        if (tapeVideoRef.current) {
          try {
            tapeVideoRef.current.playbackRate = voiceSpeed;
            tapeVideoRef.current.play().catch(() => {});
          } catch {}
        }
      },
      () => {
        advanceToNextLine();
      },
      () => {
        console.warn(`Web Audio play blocked or not yet interacted for line_${lineIdx}`);
        if (!hasUserInteracted) {
          setAutoplayBlocked(true);
          setIsSpeaking(false);
        } else {
          fallbackWebAudioOrSpeech(lineIdx);
        }
      }
    );
  };

  // Secondary fallback using SpeechSynthesis with guaranteed phonetic clarity
  const fallbackWebAudioOrSpeech = (lineIdx: number) => {
    soundEngine.playSawVoiceBlip();
    soundEngine.playSawTapeHiss();

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const rawText = spokenTapeLines[lineIdx] || spokenTapeLines[0];
        // Enforce phonetic pronunciation: AI as "A I", ATS as "A T S", CV as "C V"
        const text = rawText
          .replace(/\bAI\b/g, 'A I')
          .replace(/\bATS\b/g, 'A T S')
          .replace(/\bCV\b/g, 'C V');
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Prefer deep authoritative male voices in browser speech synthesis; strictly exclude cartoonish novelty voices
        const voices = window.speechSynthesis.getVoices();
        const noveltyNames = ['fred', 'junior', 'albert', 'zarvox', 'trinoids', 'bad news', 'bahh', 'bells', 'boing', 'bubbles', 'cellos', 'good news', 'hysterical', 'pipe organ', 'whisper', 'kathy', 'princess'];
        const maleVoice = voices.find(v => {
          const name = v.name.toLowerCase();
          const isNovelty = noveltyNames.some(nov => name.includes(nov));
          if (isNovelty) return false;
          return (
            name.includes('male') ||
            name.includes('daniel') ||
            name.includes('david') ||
            name.includes('george') ||
            name.includes('oliver') ||
            name.includes('guy') ||
            name.includes('roger') ||
            name.includes('rishi') ||
            name.includes('christopher') ||
            name.includes('alex') ||
            name.includes('tom') ||
            name.includes('uk english male') ||
            name.includes('us english male')
          ) && v.lang.startsWith('en');
        });
        if (maleVoice) {
          utterance.voice = maleVoice;
        }

        utterance.pitch = 0.55; // Deep, sinister horror villain pitch
        utterance.rate = 0.82; // Chilling, slow, deliberate horror cadence
        utterance.volume = audioMuted ? 0 : voiceVolume;

        utterance.onstart = () => {
          setIsSpeaking(true);
          if (tapeVideoRef.current) {
            try {
              tapeVideoRef.current.playbackRate = 1.0;
              tapeVideoRef.current.play().catch(() => {});
            } catch {}
          }
        };
        utterance.onend = () => {
          setIsSpeaking(false);
          if (tapeVideoRef.current) {
            try {
              tapeVideoRef.current.pause();
            } catch {}
          }
          if (lineIdx < spokenTapeLines.length - 1 && tapePlayingRef.current) {
            speechTimeoutRef.current = setTimeout(() => {
              if (!tapePlayingRef.current) return;
              const nextIdx = lineIdx + 1;
              transcriptIndexRef.current = nextIdx;
              setTapeTranscriptIndex(nextIdx);
              speakCurrentLine(nextIdx);
            }, 380);
          } else if (loopIterationRef.current < 2 && tapePlayingRef.current) {
            loopIterationRef.current += 1;
            setLoopIteration(loopIterationRef.current);
            speechTimeoutRef.current = setTimeout(() => {
              if (!tapePlayingRef.current) return;
              transcriptIndexRef.current = 0;
              setTapeTranscriptIndex(0);
              speakCurrentLine(0);
            }, 1200);
          }
        };
        utterance.onerror = () => {
          setIsSpeaking(false);
        };
        window.speechSynthesis.speak(utterance);
        return;
      } catch {}
    }

    // Ultimate fallback: procedural blip + advance timer ONLY if tape is active and user has engaged
    setIsSpeaking(true);
    speechTimeoutRef.current = setTimeout(() => {
      setIsSpeaking(false);
      if (lineIdx < tapeTranscriptLines.length - 1 && tapePlayingRef.current && !autoplayBlocked) {
        const nextIdx = lineIdx + 1;
        transcriptIndexRef.current = nextIdx;
        setTapeTranscriptIndex(nextIdx);
        speakCurrentLine(nextIdx);
      } else if (loopIterationRef.current < 2 && tapePlayingRef.current && !autoplayBlocked) {
        loopIterationRef.current += 1;
        setLoopIteration(loopIterationRef.current);
        transcriptIndexRef.current = 0;
        setTapeTranscriptIndex(0);
        speakCurrentLine(0);
      }
    }, 4000);
  };

  // Dedicated unblock handler triggered by user gesture (guaranteed mobile audio activation)
  const handleGlobalUnblock = async () => {
    soundEngine.unmute();
    soundEngine.resumeContext();
    await jigsawVoiceEngine.unlock();
    soundEngine.playSawVoiceBlip();
    setAutoplayBlocked(false);
    setHasUserInteracted(true);
    setTapePlaying(true);
    playMoonlightSonata();
    speakCurrentLine(transcriptIndexRef.current);
  };

  // Automatic Audio Playback on Mount + Mobile User Interaction Unblock
  useEffect(() => {
    soundEngine.unmute();
    soundEngine.resumeContext();
    soundEngine.playSawTapeHiss();
    
    // Attempt playback on mount (allowed on desktop, handled gracefully on mobile)
    playMoonlightSonata();
    speakCurrentLine(0);

    // Immediate autoplay unblock: activate on first touch, click, key, mouse move, or scroll
    const handleInitialUserGesture = async () => {
      soundEngine.unmute();
      soundEngine.resumeContext();
      await jigsawVoiceEngine.unlock();
      soundEngine.playSawVoiceBlip();
      setAutoplayBlocked(false);
      setHasUserInteracted(true);
      playMoonlightSonata();
      speakCurrentLine(transcriptIndexRef.current);
      cleanupGestureListeners();
    };

    const cleanupGestureListeners = () => {
      window.removeEventListener('pointerdown', handleInitialUserGesture);
      window.removeEventListener('pointermove', handleInitialUserGesture);
      window.removeEventListener('mousemove', handleInitialUserGesture);
      window.removeEventListener('wheel', handleInitialUserGesture);
      window.removeEventListener('scroll', handleInitialUserGesture);
      window.removeEventListener('keydown', handleInitialUserGesture);
      window.removeEventListener('touchstart', handleInitialUserGesture);
      window.removeEventListener('touchend', handleInitialUserGesture);
      window.removeEventListener('click', handleInitialUserGesture);
    };

    window.addEventListener('pointerdown', handleInitialUserGesture, { once: true });
    window.addEventListener('pointermove', handleInitialUserGesture, { once: true, passive: true });
    window.addEventListener('mousemove', handleInitialUserGesture, { once: true, passive: true });
    window.addEventListener('wheel', handleInitialUserGesture, { once: true, passive: true });
    window.addEventListener('scroll', handleInitialUserGesture, { once: true, passive: true });
    window.addEventListener('keydown', handleInitialUserGesture, { once: true });
    window.addEventListener('touchstart', handleInitialUserGesture, { once: true, passive: true });
    window.addEventListener('touchend', handleInitialUserGesture, { once: true, passive: true });
    window.addEventListener('click', handleInitialUserGesture, { once: true });

    return () => {
      stopVoice();
      stopMoonlightSonata();
      cleanupGestureListeners();
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check if primary trials are satisfied (NO bypasses or skips)
  const allTrialsPassed = kerningPassed && contrastPassed && artifactPassed;
  const atsPassed = puncturedCanisters.length >= 4;

  useEffect(() => {
    if ((allTrialsPassed || atsPassed) && !clearanceGranted) {
      setClearanceGranted(true);
      soundEngine.playSawVictory();
      try {
        localStorage.setItem('recruiter_gatekeeper_passed', 'true');
      } catch {}
    }
  }, [allTrialsPassed, atsPassed, clearanceGranted]);

  const handleToggleTape = async () => {
    if (!tapePlaying) {
      soundEngine.unmute();
      soundEngine.resumeContext();
      await jigsawVoiceEngine.unlock();
      soundEngine.playSawTapeHiss();
      setTapePlaying(true);
      setAutoplayBlocked(false);
      setHasUserInteracted(true);
      playMoonlightSonata();
      if (tapeTranscriptIndex === tapeTranscriptLines.length - 1 && loopIterationRef.current >= 2) {
        loopIterationRef.current = 1;
        setLoopIteration(1);
        transcriptIndexRef.current = 0;
        setTapeTranscriptIndex(0);
        speakCurrentLine(0);
      } else {
        speakCurrentLine(tapeTranscriptIndex);
      }
    } else {
      setTapePlaying(false);
      pauseMoonlightSonata();
      stopVoice();
    }
  };

  const handleReplayCurrentLine = async () => {
    soundEngine.unmute();
    soundEngine.resumeContext();
    await jigsawVoiceEngine.unlock();
    soundEngine.playSawTapeHiss();
    setTapePlaying(true);
    setAutoplayBlocked(false);
    setHasUserInteracted(true);
    playMoonlightSonata();
    speakCurrentLine(tapeTranscriptIndex);
  };

  const handleSelectLine = async (index: number) => {
    soundEngine.unmute();
    soundEngine.resumeContext();
    await jigsawVoiceEngine.unlock();
    soundEngine.playSawTapeHiss();
    setTapeTranscriptIndex(index);
    transcriptIndexRef.current = index;
    setTapePlaying(true);
    setAutoplayBlocked(false);
    setHasUserInteracted(true);
    playMoonlightSonata();
    speakCurrentLine(index);
  };

  const handleNextLine = () => {
    if (tapeTranscriptIndex < tapeTranscriptLines.length - 1) {
      handleSelectLine(tapeTranscriptIndex + 1);
    }
  };

  const handlePrevLine = () => {
    if (tapeTranscriptIndex > 0) {
      handleSelectLine(tapeTranscriptIndex - 1);
    }
  };

  const handleToggleMute = () => {
    const nowMuted = soundEngine.toggleMute();
    setAudioMuted(nowMuted);
    jigsawVoiceEngine.setVolume(nowMuted ? 0 : voiceVolume);
    if (voiceAudioRef.current) {
      voiceAudioRef.current.muted = nowMuted;
    }
    if (moonlightAudioRef.current) {
      moonlightAudioRef.current.muted = nowMuted;
    }
  };

  // Trial 1: Kerning slider change
  const handleKerningChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setKerningValue(val);
    if (Math.abs(val) <= 2 && !kerningPassed) {
      soundEngine.playSawClank();
      setKerningPassed(true);
    }
  };

  // Trial 2: WCAG Contrast Swatch choice
  const handleSelectContrast = (key: string) => {
    setSelectedContrastKey(key);
    if (key === 'safe_gold') {
      soundEngine.playSawClank();
      setContrastPassed(true);
      setContrastError(null);
    } else {
      soundEngine.playSawBuzz();
      setContrastPassed(false);
      setContrastError(
        key === 'trap_slate'
          ? 'FATAL ERROR: 2.1:1 Contrast Ratio! Illegible grey text on dark background violates WCAG AA standards. The guillotine tension increases!'
          : 'FATAL ERROR: 3.4:1 Optical Vibration! Harsh red creates chromatic aberration and eye strain. Contrast threshold failed!'
      );
    }
  };

  // Trial 3: Artifact selection (The BDA Dietetics Today AR Cover is the correct answer!)
  const handleSelectArtifact = (artifact: AuthenticSubpageImage) => {
    setSelectedArtifactId(artifact.id);
    if (artifact.id === 'dt-ar-cover') {
      soundEngine.playSawVictory();
      setArtifactPassed(true);
      setArtifactError(null);
    } else {
      soundEngine.playSawBuzz();
      setArtifactPassed(false);
      setArtifactError(
        `INCORRECT ARTIFACT: "${artifact.title}" is a remarkable commercial deliverable from ${artifact.sourcePage}, but not the sector’s first-ever Augmented Reality publication. Re-examine the evidence.`
      );
    }
  };

  // Trial 4: Puncture Recruiter & Client Spec-Work Canister
  const handlePunctureCanister = (canister: ToxicCanister) => {
    if (!puncturedCanisters.includes(canister.id)) {
      soundEngine.playHit();
      setPuncturedCanisters(prev => [...prev, canister.id]);
      setLastPuncturedRetort({
        label: canister.label,
        retort: canister.retort,
        tag: canister.tag,
      });
    }
  };

  // Option 2: Formal Recruiter & Client Confession (Instantly punctures all toxic canisters)
  const handleConfessAll = () => {
    soundEngine.playSawVictory();
    setPuncturedCanisters(TOXIC_CANISTERS.map(c => c.id));
    setLastPuncturedRetort({
      label: 'All Recruiter & Client Tropes Confessed',
      retort: 'You have repented of all exploitative spec work and automated screening sins! Full clearance granted.',
      tag: 'FULL CONFESSION',
    });
  };

  const handleEnterPlatform = () => {
    stopVoice();
    stopMoonlightSonata();
    soundEngine.playClick();
    onComplete();
  };

  // Format time mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-start sm:items-center bg-black/15 text-slate-100 overflow-y-auto selection:bg-[#dfb15b] selection:text-[#080d1a] p-2.5 sm:p-6 lg:p-8">
      {/* Background Animated Logo Loop Video (1080p Loop Embedded Behind the Chamber) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <video
          src="/assets/aistudio/background-loop_61a5c01d.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover scale-100 filter brightness-100 contrast-105"
        />
        {/* Soft edge vignette to preserve logo brilliance */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(0,0,0,0.5)_100%)] pointer-events-none" />
      </div>

      {/* Main Chamber Card - Translucent Glassmorphic Surface with 66% Opacity */}
      <div
        style={{
          backgroundColor: `rgba(7, 12, 23, ${chamberOpacity})`,
        }}
        className="relative z-10 max-w-5xl w-full my-3 sm:my-auto border-2 border-red-700/60 rounded-2xl sm:rounded-3xl shadow-[0_0_100px_rgba(220,38,38,0.35)] p-3.5 sm:p-8 lg:p-10 backdrop-blur-md space-y-5 sm:space-y-7 animate-in fade-in zoom-in-95 duration-300 transition-[background-color] duration-300"
      >
        
        {/* Top Industrial Bar & CCTV Tape Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-red-900/40">
          <div className="flex items-center gap-4">
            {/* Jigsaw Stylized Graphic Designer Puppet Icon */}
            <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-black border-2 border-red-600/70 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-[0_0_25px_rgba(220,38,38,0.4)]">
              <img
                src="/image.png?v=3"
                alt="Jonny Coke Logo"
                className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-1 left-1.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                <span className="text-[8px] font-mono text-red-400 font-bold">REC</span>
              </div>
              <div className="absolute bottom-1 inset-x-1 text-center bg-red-950/80 rounded py-0.2">
                <span className="text-[7px] font-mono text-red-300 tracking-tighter">CAM 04: JIGSAW</span>
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-950/80 text-red-400 border border-red-600/50 uppercase tracking-widest">
                <ShieldAlert className="w-3 h-3 text-red-500 animate-pulse" />
                JIGSAW GRAPHIC DESIGN PROTOCOL // REVERSE-RECRUITER &amp; CLIENT CHAMBER
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight mt-1">
                &ldquo;I Want To Play A Game, Recruiter... Or Client.&rdquo;
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Jonny Coke • Senior Graphic &amp; Digital Designer • 25+ Years Master Craftsmanship
              </p>
            </div>
          </div>

          {/* Psychological Countdown & Clearance Terminal */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-6 shrink-0 gap-1.5">
            <div className="flex items-center gap-3">
              <div className="text-left sm:text-right">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                  TIME TO AUTOMATED GHOSTING
                </div>
                <div className="text-lg sm:text-xl font-mono font-black text-red-500 tracking-widest drop-shadow-[0_0_10px_rgba(239,68,68,0.6)]">
                  {formatTime(timeLeft)}
                </div>
              </div>
              {onDismissWithoutPassing && (
                <button
                  id="saw-close-chamber-btn"
                  onClick={() => {
                    stopVoice();
                    onDismissWithoutPassing();
                  }}
                  className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-red-950 text-slate-400 hover:text-red-300 border border-slate-700 hover:border-red-600 transition"
                  title="Close Chamber"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="text-xs font-mono font-bold flex items-center gap-1.5">
              {clearanceGranted ? (
                <div className="flex items-center gap-1 text-emerald-400 bg-emerald-950/40 border border-emerald-500/50 px-2.5 py-1 rounded-lg">
                  <Unlock className="w-3.5 h-3.5" />
                  <span>EARNED CLEARANCE</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-400 bg-red-950/30 border border-red-600/40 px-2.5 py-1 rounded-lg">
                  <Lock className="w-3.5 h-3.5" />
                  <span>VAULT LOCKED</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* REVERSE-RECRUITER & SPEC-CLIENT DIRECTIVE: WHY YOU ARE BEING TESTED */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#090d18] border-2 border-red-900/70 shadow-2xl space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-red-950/90 pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
              <span className="text-xs font-mono font-black text-red-400 uppercase tracking-widest">
                REVERSE-RECRUITER &amp; CLIENT DIRECTIVE // WHY YOU ARE BEING TESTED
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#dfb15b] bg-[#dfb15b]/10 px-2.5 py-0.5 rounded-full border border-[#dfb15b]/30">
              JONNY COKE • 25+ YRS MASTER CRAFTSMANSHIP
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed">
            <div className="p-3.5 rounded-xl bg-black/60 border border-slate-800 space-y-1.5">
              <div className="text-[11px] font-mono font-bold text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>THE RECRUITER &amp; CLIENT DILEMMA</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                For years, corporate hiring pipelines glanced at 25+ years of master design craft for <strong>4.7 seconds</strong> or discarded it into algorithmic ATS grinders. Meanwhile, prospective clients routinely try to squeeze cheaper or unpaid spec work with tropes like <em>&ldquo;this will be good for your portfolio&rdquo;</em> (I work like everything I do could be a portfolio piece!) or demand <em>&ldquo;make it look professional&rdquo;</em> (Design is my profession of 25+ years, not a weekend hobby!).
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-black/60 border border-slate-800 space-y-1.5">
              <div className="text-[11px] font-mono font-bold text-red-400 flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5" />
                <span>THE REVERSE PROTOCOL</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                The tables are turned. Whether you are a corporate recruiter or an ambitious prospective client, you cannot simply demand free spec briefs or download the Executive portfolio without respect. Prove visual perception through <strong>3 Graphic Design Tests</strong>, or confess the toxic hiring/client tropes below!
              </p>
            </div>
          </div>

          {/* Dual Path Directives */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-700/50 flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-black text-white flex items-center gap-1.5">
                  <Crosshair className="w-3.5 h-3.5 text-red-400" />
                  OPTION 1: 3 Graphic Design Tests
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-red-600/80 text-white font-bold">
                  SKILL PATH
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Prove design perception across 3 technical trials: <strong>1. Kerning Gallows</strong> (optical spacing), <strong>2. WCAG Contrast Guillotine</strong> (AAA 7:1 ratio), and <strong>3. Authentic Artifacts</strong> (inspect real commercial work).
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-700/50 flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-black text-white flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  OPTION 2: Confess
                </span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-600 text-black font-bold">
                  CONFESSION PATH
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Cannot pass the design trials? Confess recruiting or client spec-work sins by puncturing <strong>4 toxic canisters</strong> (unpaid take-homes, &ldquo;good for your portfolio&rdquo;, &ldquo;make it professional&rdquo;, ghosting) to purge your conscience and gain instant clearance.
              </p>
            </div>
          </div>
        </div>

        {/* AUTOPLAY UNBLOCK NOTICE IF BROWSER BLOCKED AUDIO / TAP TO ENGAGE SOUND */}
        {(!hasUserInteracted || autoplayBlocked || !musicIsPlaying) && (
          <div
            id="saw-unblock-audio-banner"
            onClick={handleGlobalUnblock}
            className="p-4 rounded-2xl bg-gradient-to-r from-red-950 via-red-900 to-red-950 border-2 border-red-500 flex flex-col sm:flex-row items-center justify-between gap-4 cursor-pointer shadow-[0_0_35px_rgba(239,68,68,0.7)] animate-pulse"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-red-600 flex items-center justify-center text-white shrink-0 shadow-lg">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-mono font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <span>JIGSAW AUDIO &amp; MOONLIGHT SONATA READY</span>
                  <span className="px-2 py-0.5 rounded bg-amber-400 text-black text-[9px] font-black uppercase animate-bounce">
                    CLICK TO ACTIVATE SOUND
                  </span>
                </div>
                <div className="text-[11px] text-red-200 mt-0.5">
                  Web browsers block autoplay until you click. Click anywhere on this banner to engage Jigsaw&apos;s voice and Beethoven&apos;s Moonlight Sonata.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleGlobalUnblock();
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-black shrink-0 shadow-lg flex items-center justify-center gap-2 hover:scale-105 transition"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>CLICK TO ACTIVATE AUDIO</span>
            </button>
          </div>
        )}

        {/* EERIE VINTAGE REEL-TO-REEL TAPE RECORDER DECK */}
        <div className="bg-[#0b0f19]/70 backdrop-blur-md border-2 border-red-950/80 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-2xl">
          {/* Top Deck Header: Status, Counter & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
            <div className="flex flex-wrap items-center gap-3">
              {/* Pulsing Rec/Play LED */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/60 border border-slate-800">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isSpeaking
                      ? 'bg-red-500 shadow-[0_0_12px_#ef4444] animate-ping'
                      : tapePlaying
                      ? 'bg-amber-500 animate-pulse'
                      : 'bg-slate-700'
                  }`}
                />
                <span className="text-[10px] font-mono font-black tracking-widest text-slate-200">
                  {isSpeaking ? 'VOICE TRANSMITTING' : tapePlaying ? 'DECK ARMED' : 'DECK PAUSED'}
                </span>
              </div>

              {/* Digital Tape Counter */}
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-black border border-slate-850 font-mono text-xs">
                <span className="text-slate-500 text-[9px] uppercase tracking-wider mr-1">TAPE</span>
                <span className="text-red-500 font-black tracking-widest text-sm drop-shadow-[0_0_6px_rgba(239,68,68,0.5)]">
                  {String(tapeCounter).padStart(3, '0')}
                </span>
              </div>

              {/* Line Position Indicator */}
              <div className="px-2.5 py-1 rounded-md bg-black/50 border border-slate-800 font-mono text-[10px] text-slate-400">
                LINE <span className="text-red-400 font-bold">{tapeTranscriptIndex + 1}</span> / {tapeTranscriptLines.length}
              </div>

              {/* Loop Counter Indicator */}
              <div className="px-2.5 py-1 rounded-md bg-black/50 border border-slate-800 font-mono text-[10px] text-slate-400">
                LOOP <span className="text-amber-400 font-bold">{loopIteration}</span> / 2
              </div>

              {/* Audio Source Badge */}
              <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded bg-black/40 border border-slate-850 text-[9px] font-mono text-slate-400">
                <span className="text-red-400">MASTER AUDIO:</span>
                <span className="text-slate-300 font-semibold">JIGSAW VOCAL TAPE (PCM)</span>
              </div>
            </div>

            {/* Deck Play / Pause Mechanical Buttons & Navigation */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                id="saw-prev-line-btn"
                onClick={handlePrevLine}
                disabled={tapeTranscriptIndex <= 0}
                className="px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1 bg-[#151926] text-slate-300 border border-slate-700 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
                title="Previous voice line"
              >
                ◀ PREV
              </button>

              <button
                id="saw-play-tape-btn"
                onClick={handleToggleTape}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition shadow-lg ${
                  tapePlaying
                    ? 'bg-red-950/80 text-red-300 border border-red-700/80 hover:bg-red-900/90'
                    : 'bg-red-600 text-white hover:bg-red-500 shadow-red-900/50 scale-105'
                }`}
              >
                {tapePlaying ? (
                  <>
                    <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                    <span>PAUSE REEL</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>PLAY REEL</span>
                  </>
                )}
              </button>

              <button
                id="saw-replay-line-btn"
                onClick={handleReplayCurrentLine}
                className="px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 bg-[#181d2a] text-red-300 border border-red-900 hover:bg-red-950/80 hover:border-red-700 transition"
                title="Replay current line"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>REPLAY LINE</span>
              </button>

              <button
                id="saw-next-line-btn"
                onClick={handleNextLine}
                disabled={tapeTranscriptIndex >= tapeTranscriptLines.length - 1}
                className="px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1 bg-[#151926] text-slate-300 border border-slate-700 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
                title="Next voice line"
              >
                NEXT ▶
              </button>

              <button
                id="saw-mute-btn"
                onClick={handleToggleMute}
                className={`p-2 rounded-xl text-xs font-mono border transition ${
                  audioMuted
                    ? 'bg-amber-950/60 text-amber-400 border-amber-800/80'
                    : 'bg-[#151926] text-slate-400 border-slate-700 hover:text-white'
                }`}
                title={audioMuted ? 'Unmute Audio' : 'Mute Audio'}
              >
                {audioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Voice Volume Control */}
              <div className="flex items-center gap-1.5 bg-[#151926] px-2 py-1 rounded-xl border border-red-900/60 text-xs font-mono">
                <span className="text-[10px] text-red-400 font-bold">VOICE VOL:</span>
                <button
                  onClick={() => {
                    const newVol = Math.max(0.30, Math.round((voiceVolume - 0.05) * 100) / 100);
                    setVoiceVolume(newVol);
                    jigsawVoiceEngine.setVolume(newVol);
                    if (voiceAudioRef.current) voiceAudioRef.current.volume = newVol;
                  }}
                  disabled={voiceVolume <= 0.35}
                  className="w-4 h-4 rounded bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold text-xs disabled:opacity-30"
                  title="Make Voice Quieter"
                >
                  -
                </button>
                <span className="text-red-300 font-bold w-8 text-center text-[10px]">
                  {Math.round(voiceVolume * 100)}%
                </span>
                <button
                  onClick={() => {
                    const newVol = Math.min(1.00, Math.round((voiceVolume + 0.05) * 100) / 100);
                    setVoiceVolume(newVol);
                    jigsawVoiceEngine.setVolume(newVol);
                    if (voiceAudioRef.current) voiceAudioRef.current.volume = newVol;
                  }}
                  disabled={voiceVolume >= 0.98}
                  className="w-4 h-4 rounded bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold text-xs disabled:opacity-30"
                  title="Raise Voice Volume"
                >
                  +
                </button>
                <span className="text-[8px] px-1.5 py-0.2 rounded bg-red-950 text-red-400 font-bold border border-red-800/60 hidden sm:inline">
                  HORROR GRAVEL
                </span>
              </div>

              {/* Moonlight Sonata Piano Score Volume & Toggle */}
              <div className="flex items-center gap-1.5 bg-[#151926] px-2 py-1 rounded-xl border border-slate-700/80 text-xs font-mono">
                <Music className="w-3.5 h-3.5 text-[#dfb15b]" />
                <span className="text-[10px] text-slate-300 font-bold hidden sm:inline">MOONLIGHT BGM:</span>
                <button
                  onClick={() => {
                    const next = !moonlightEnabled;
                    setMoonlightEnabled(next);
                    if (!next) pauseMoonlightSonata();
                    else playMoonlightSonata();
                  }}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition cursor-pointer ${
                    moonlightEnabled && musicIsPlaying
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-700'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                  title="Toggle Moonlight Sonata background music"
                >
                  {moonlightEnabled && musicIsPlaying ? 'ON' : 'OFF'}
                </button>
                <button
                  onClick={() => {
                    const newVol = Math.max(0.08, Math.round((moonlightVolume - 0.04) * 100) / 100);
                    setMoonlightVolume(newVol);
                    if (moonlightAudioRef.current) {
                      moonlightAudioRef.current.volume = isSpeaking ? Math.min(newVol * 0.35, 0.08) : newVol;
                    }
                  }}
                  disabled={moonlightVolume <= 0.10}
                  className="w-4 h-4 rounded bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold text-xs disabled:opacity-30 cursor-pointer"
                  title="Lower Moonlight Sonata volume"
                >
                  -
                </button>
                <span className="text-amber-300 font-bold w-7 text-center text-[10px]">
                  {Math.round(moonlightVolume * 100)}%
                </span>
                <button
                  onClick={() => {
                    const newVol = Math.min(0.60, Math.round((moonlightVolume + 0.04) * 100) / 100);
                    setMoonlightVolume(newVol);
                    if (moonlightAudioRef.current) {
                      moonlightAudioRef.current.volume = isSpeaking ? Math.min(newVol * 0.35, 0.08) : newVol;
                    }
                  }}
                  disabled={moonlightVolume >= 0.55}
                  className="w-4 h-4 rounded bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold text-xs disabled:opacity-30 cursor-pointer"
                  title="Raise Moonlight Sonata volume"
                >
                  +
                </button>
              </div>

              {/* Voice Cadence / Speed Control */}
              <button
                id="saw-speed-btn"
                onClick={() => {
                  const nextSpeed = voiceSpeed === 1.00 ? 1.15 : voiceSpeed === 1.15 ? 0.92 : 1.00;
                  setVoiceSpeed(nextSpeed);
                  jigsawVoiceEngine.setSpeed(nextSpeed);
                  if (voiceAudioRef.current) {
                    voiceAudioRef.current.playbackRate = nextSpeed;
                    try {
                      if ('preservesPitch' in voiceAudioRef.current) {
                        (voiceAudioRef.current as unknown as { preservesPitch: boolean }).preservesPitch = false;
                      }
                    } catch {}
                  }
                  if (tapeVideoRef.current) {
                    try {
                      tapeVideoRef.current.playbackRate = nextSpeed;
                    } catch {}
                  }
                }}
                className="px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 bg-[#151926] text-amber-300 border border-amber-800/80 hover:bg-amber-950/40 hover:border-amber-600 transition"
                title="Toggle Voice Pace: Horror Sprint (1.00x) / Relentless Hunt (1.15x) / Deep Dread (0.92x)"
              >
                <span className="text-[10px] text-slate-400">PACE:</span>
                <span className="font-mono text-amber-400">
                  {voiceSpeed === 1.15 ? '1.15x RELENTLESS HUNT' : voiceSpeed === 0.92 ? '0.92x DEEP DREAD' : '1.00x HORROR SPRINT'}
                </span>
              </button>

              {/* Tape Display Mode Toggle: Reel-to-Reel Studio Deck vs Video Mode */}
              <button
                id="saw-tape-mode-btn"
                onClick={() => {
                  setTapeVisualMode(m => (m === 'video' ? 'analog' : 'video'));
                  setVideoHasError(false);
                }}
                className="px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 bg-[#151926] text-red-300 border border-red-900/80 hover:bg-red-950/40 hover:border-red-700 transition"
                title="Switch between Studio Reel-to-Reel Machine and Video Reel"
              >
                <Film className="w-3.5 h-3.5 text-red-400" />
                <span className="text-[10px] text-slate-400">DISPLAY:</span>
                <span className="font-mono text-red-400">
                  {tapeVisualMode === 'video' && !videoHasError ? 'VIDEO REEL' : 'REEL-TO-REEL MACHINE'}
                </span>
              </button>
            </div>
          </div>

          {/* STUDIO REEL-TO-REEL MACHINE OR VIDEO REEL */}
          <div className="my-4">
            {tapeVisualMode === 'video' && !videoHasError ? (
              <div className="p-4 rounded-xl bg-[#070a12]/70 backdrop-blur-sm border border-slate-800/80 shadow-inner flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="w-full max-w-[360px] aspect-[16/10] bg-black rounded-xl border-2 border-red-900/80 p-2 shadow-2xl relative flex flex-col justify-between overflow-hidden select-none">
                  {/* Embedded Video Element */}
                  <div className="relative w-full h-full rounded-lg overflow-hidden bg-black flex items-center justify-center">
                    <video
                      ref={tapeVideoRef}
                      src={tapeVideoUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      onError={() => {
                        console.warn('Video failed to load from URL, falling back to analog reel-to-reel deck');
                        setVideoHasError(true);
                      }}
                    />
                    {/* CRT Scanline & Phosphor Overlay */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.45)_50%)] bg-[length:100%_4px] pointer-events-none" />

                    {/* Top HUD Overlay */}
                    <div className="absolute top-2 inset-x-2 flex items-center justify-between text-[9px] font-mono pointer-events-none drop-shadow z-10">
                      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/80 border border-red-800 text-red-400 font-bold">
                        <span className={`w-2 h-2 rounded-full ${tapePlaying ? 'bg-red-500 animate-ping' : 'bg-red-900'}`} />
                        REC // REEL-102423
                      </span>
                      <span className="px-2 py-0.5 rounded bg-black/80 border border-slate-800 text-amber-400 font-bold">
                        15 IPS MASTER
                      </span>
                    </div>

                    {/* Bottom HUD Overlay */}
                    <div className="absolute bottom-2 inset-x-2 flex items-center justify-between text-[8px] font-mono pointer-events-none drop-shadow z-10">
                      <span className="px-1.5 py-0.5 rounded bg-black/80 text-slate-300">
                        SUITE 8B ARCHIVE
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-black/80 text-emerald-400 font-bold">
                        {tapePlaying ? `${voiceSpeed}x HORROR AUDIO` : 'PAUSED'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-1.5 px-1 flex items-center justify-between text-[8px] font-mono text-slate-400">
                    <span className="truncate max-w-[200px] text-slate-500" title={tapeVideoUrl}>
                      SRC: video-102423_medium.mp4
                    </span>
                    <button
                      onClick={() => setTapeVisualMode('analog')}
                      className="text-red-400 hover:text-red-300 underline font-bold"
                    >
                      View Reel-To-Reel Machine
                    </button>
                  </div>
                </div>

                {/* Stereo Analog Audio Output for Video Mode */}
                <div className="w-full md:w-auto flex-1 flex flex-col justify-center space-y-3 p-3 bg-black/40 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span className="flex items-center gap-1.5 font-bold text-white">
                      <Disc className={`w-3.5 h-3.5 ${tapePlaying ? 'animate-spin text-red-500' : 'text-slate-600'}`} />
                      STEREO REEL AUDIO OUTPUT
                    </span>
                    <span className="text-[#dfb15b] font-mono">
                      {tapePlaying ? 'ACTIVE • 44.1 kHz' : 'IDLE'}
                    </span>
                  </div>

                  <div className="flex items-end justify-between gap-1.5 h-14 bg-black/70 p-2 rounded-lg border border-slate-850">
                    {[45, 80, 65, 95, 50, 75, 85, 60, 90, 70, 85, 40, 65, 90, 55, 80].map((baseHeight, idx) => {
                      const animatedHeight = tapePlaying
                        ? `${Math.max(15, (baseHeight + (tapeCounter * 17 + idx * 23) % 45))}%`
                        : '8%';
                      const isRedPeak = idx >= 13;
                      const isAmberMid = idx >= 9 && idx < 13;
                      return (
                        <div key={idx} className="w-full flex flex-col justify-end items-center h-full">
                          <div
                            className={`w-full rounded-t-sm transition-all duration-150 ${
                              isRedPeak
                                ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.7)]'
                                : isAmberMid
                                ? 'bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.5)]'
                                : 'bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.5)]'
                            }`}
                            style={{ height: animatedHeight }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between text-[8px] font-mono text-slate-500 px-1">
                    <span>-20 dB</span>
                    <span>-12 dB</span>
                    <span>-6 dB</span>
                    <span className="text-amber-400">0 dB</span>
                    <span className="text-red-400 font-bold">+3 dB CLIP</span>
                  </div>
                </div>
              </div>
            ) : (
              <ReelToReelDeck
                isPlaying={tapePlaying}
                isSpeaking={isSpeaking}
                speed={voiceSpeed}
                counter={tapeCounter}
                onTogglePlay={handleToggleTape}
                onPrevLine={handlePrevLine}
                onNextLine={handleNextLine}
                onReplayLine={handleReplayCurrentLine}
                canPrev={tapeTranscriptIndex > 0}
                canNext={tapeTranscriptIndex < tapeTranscriptLines.length - 1}
                currentLineIndex={tapeTranscriptIndex}
                totalLines={tapeTranscriptLines.length}
                loopIteration={loopIteration}
              />
            )}
          </div>

          {/* BEETHOVEN'S MOONLIGHT SONATA AMBIENT SCORE STRIP */}
          <div className="mb-4 p-2.5 rounded-xl bg-black/60 border border-amber-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-[10px] font-mono">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-amber-950/50 border border-amber-800/60 text-amber-400">
                <Music className={`w-3.5 h-3.5 ${tapePlaying && !audioMuted && moonlightEnabled ? 'animate-pulse text-amber-300' : 'text-slate-500'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-amber-300 tracking-wider">
                    BEETHOVEN: MOONLIGHT SONATA (OP. 27 NO. 2)
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-950/80 text-[8px] text-amber-400 border border-amber-800/60 uppercase">
                    {audioMuted
                      ? 'MUTED'
                      : !moonlightEnabled
                      ? 'DISABLED'
                      : tapePlaying
                      ? isSpeaking
                        ? 'PLAYING SOFTLY (DUCKED -22dB // SOFT MENACING VOICE)'
                        : 'PLAYING (ADAGIO SOSTENUTO // EERIE SCORE)'
                      : 'PAUSED WITH TAPE'}
                  </span>
                </div>
                <div className="text-[9px] text-slate-400">
                  Soft, calm, menacing classical accompaniment score-tracked behind Jigsaw&apos;s quiet, calculated voice
                </div>
              </div>
            </div>

            {/* Volume & Toggle Controls */}
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                onClick={() => {
                  const newEnabled = !moonlightEnabled;
                  setMoonlightEnabled(newEnabled);
                  if (!newEnabled) {
                    pauseMoonlightSonata();
                  } else if (tapePlaying && !audioMuted) {
                    playMoonlightSonata();
                  }
                }}
                className={`px-2.5 py-1 rounded text-[9px] font-bold border transition ${
                  moonlightEnabled && !audioMuted
                    ? 'bg-amber-950/50 text-amber-300 border-amber-700/60 hover:bg-amber-900/50'
                    : 'bg-slate-900 text-slate-500 border-slate-800'
                }`}
                title="Toggle Moonlight Sonata Background Music"
              >
                {moonlightEnabled ? 'SCORE ON' : 'SCORE OFF'}
              </button>

              <div className="flex items-center gap-1.5 bg-black/80 px-2 py-1 rounded border border-slate-800">
                <span className="text-[9px] text-slate-400">SCORE VOL:</span>
                <button
                  onClick={() => {
                    const newVol = Math.max(0.005, Math.round((moonlightVolume - 0.005) * 1000) / 1000);
                    setMoonlightVolume(newVol);
                    if (moonlightAudioRef.current) {
                      moonlightAudioRef.current.volume = isSpeaking ? Math.min(newVol * 0.2, 0.003) : Math.min(newVol, 0.015);
                    }
                  }}
                  disabled={moonlightVolume <= 0.005}
                  className="w-4 h-4 rounded bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold text-xs disabled:opacity-30"
                  title="Make Background Music Softer"
                >
                  -
                </button>
                <span className="text-amber-400 font-bold w-10 text-center text-[10px]">
                  {(moonlightVolume * 100).toFixed(1)}%
                </span>
                <button
                  onClick={() => {
                    const newVol = Math.min(0.035, Math.round((moonlightVolume + 0.005) * 1000) / 1000);
                    setMoonlightVolume(newVol);
                    if (moonlightAudioRef.current) {
                      moonlightAudioRef.current.volume = isSpeaking ? Math.min(newVol * 0.2, 0.003) : Math.min(newVol, 0.015);
                    }
                  }}
                  disabled={moonlightVolume >= 0.035}
                  className="w-4 h-4 rounded bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center font-bold text-xs disabled:opacity-30"
                  title="Raise Background Music Volume"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Typewriter Transcript with Interactive Line Selectors */}
          <div className="pt-2 font-mono text-xs sm:text-sm text-slate-200 space-y-2 leading-relaxed bg-[#070b14] p-3.5 rounded-xl border border-slate-850">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-red-400 font-bold uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-red-500 animate-ping' : 'bg-red-800'}`} />
                <span>VOICE REEL-TO-REEL TRANSCRIPT • LINE {tapeTranscriptIndex + 1} OF {tapeTranscriptLines.length}:</span>
              </div>
              <span className="text-slate-400 font-normal">Click any line below to speak immediately</span>
            </div>

            {/* Currently Active Spoken Line */}
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/80 shadow-inner">
              <p className="text-red-300 font-bold text-sm sm:text-base leading-snug">
                &ldquo;{tapeTranscriptLines[tapeTranscriptIndex]}&rdquo;
              </p>
            </div>

            {/* Interactive Sentence Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 pt-1">
              {tapeTranscriptLines.map((line, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectLine(idx)}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-mono transition text-left flex items-start gap-1.5 ${
                    idx === tapeTranscriptIndex
                      ? 'bg-red-950 text-white border-2 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                      : 'bg-black/60 text-slate-400 border border-slate-800 hover:text-slate-200 hover:border-slate-700'
                  }`}
                  title={line}
                >
                  <span className={`font-bold shrink-0 ${idx === tapeTranscriptIndex ? 'text-red-400' : 'text-slate-600'}`}>
                    {idx + 1}.
                  </span>
                  <span className="truncate">{line}</span>
                </button>
              ))}
            </div>

            <p className="text-slate-400 text-xs italic pt-1">
              {isSpeaking
                ? 'Authentic Jigsaw vocal tape actively transmitting from Suite 8B archive.'
                : tapePlaying
                ? 'Reel-to-reel deck armed. Click "PLAY REEL" or any line above to trigger sinister audio monologue.'
                : 'Tape paused. Click "PLAY REEL" to resume vocal transmission.'}
            </p>
          </div>
        </div>

        {/* Recruiter Directive Banner: Clear options to take 3 Graphic Design Tests OR Confess */}
        <div className="flex items-center justify-center pt-1 pb-1">
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('saw-trials-section');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            className="group px-6 py-2.5 rounded-full bg-gradient-to-r from-red-950 via-red-900/90 to-red-950 border border-red-600 hover:border-red-400 text-red-200 hover:text-white text-xs font-mono font-bold flex items-center gap-2.5 shadow-xl shadow-red-950/80 hover:scale-105 transition-all cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="tracking-wide">▼ 3 GRAPHIC DESIGN TESTS &nbsp;OR&nbsp; CONFESS ▼</span>
            <ArrowRight className="w-3.5 h-3.5 rotate-90 text-red-400 group-hover:translate-y-0.5 transition-transform" />
          </button>
        </div>

        {/* Tab Switcher: 3 Graphic Design Tests "or" Confess */}
        <div id="saw-trials-section" className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 pb-1 scroll-mt-20 bg-[#060a15] p-3.5 rounded-2xl border border-red-950/80 shadow-lg">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-red-500 animate-pulse" />
            <span>CHOOSE YOUR OPTION:</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-center">
            {/* OPTION 1: 3 Graphic Design Tests */}
            <button
              id="saw-tab-trials-btn"
              onClick={() => {
                soundEngine.playSawClank();
                setActiveTab('saw_trials');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition ${
                activeTab === 'saw_trials'
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-900/60 ring-2 ring-red-400 scale-102'
                  : 'bg-[#090e1b] text-slate-300 hover:text-white border border-slate-800 hover:border-red-900'
              }`}
            >
              <Crosshair className="w-4 h-4 text-amber-400" />
              <span>3 Graphic Design Tests</span>
              {(kerningPassed && contrastPassed && artifactPassed) && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              )}
            </button>

            {/* "or" separator */}
            <span className="px-3 py-1 rounded-full text-xs font-mono font-black uppercase tracking-widest bg-red-950/90 text-red-400 border border-red-800/80 shadow-inner">
              or
            </span>

            {/* OPTION 2: Confess */}
            <button
              id="saw-tab-ats-btn"
              onClick={() => {
                soundEngine.playSawClank();
                setActiveTab('ats_canisters');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition ${
                activeTab === 'ats_canisters'
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-900/60 ring-2 ring-red-400 scale-102'
                  : 'bg-[#090e1b] text-slate-300 hover:text-white border border-slate-800 hover:border-red-900'
              }`}
            >
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Confess</span>
              {atsPassed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />}
            </button>
          </div>
        </div>

        {/* TAB 1: 3 GRAPHIC DESIGN TESTS */}
        {activeTab === 'saw_trials' && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-xs font-mono text-red-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-amber-400" />
                <span className="font-bold">OPTION 1: COMPLETE ALL 3 GRAPHIC DESIGN TESTS</span>
              </div>
              <span className="text-[11px] text-[#dfb15b] font-bold">
                {[kerningPassed, contrastPassed, artifactPassed].filter(Boolean).length} / 3 Completed
              </span>
            </div>
            {/* Trial 1: The Kerning Gallows */}
            <div className={`p-5 rounded-2xl border transition-all ${
              kerningPassed
                ? 'bg-emerald-950/20 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                : 'bg-[#0b1120] border-slate-800'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-red-950 border border-red-600 text-red-400 font-mono font-bold text-xs flex items-center justify-center">
                    1
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      Trial I: The Kerning Gallows (Optical Balance)
                    </h3>
                    <p className="text-xs text-slate-400">
                      The hydraulic press hovers above the typeset letters. Adjust the letter-spacing to the optical harmonic zero.
                    </p>
                  </div>
                </div>

                <div className="font-mono text-xs font-bold">
                  {kerningPassed ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      HYDRAULIC CLAMP DISENGAGED
                    </span>
                  ) : (
                    <span className="text-red-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-bounce" />
                      HAZARD: HYDRAULIC PRESSURE AT {Math.abs(kerningValue * 2)} PSI
                    </span>
                  )}
                </div>
              </div>

              {/* Typographic Preview Display */}
              <div className="my-5 p-6 rounded-xl bg-black border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-2 left-3 text-[10px] font-mono text-slate-500">
                  OPTICAL TENSION CALIBRATION // TRACKING: {kerningValue}
                </div>

                {/* The Word being kerned */}
                <div
                  className="text-2xl sm:text-4xl font-mono font-black tracking-widest text-[#dfb15b] transition-all select-none duration-75 text-center"
                  style={{ letterSpacing: `${kerningValue / 4}px` }}
                >
                  R E C R U I T E R
                </div>

                <div className="mt-3 text-[11px] font-mono text-slate-400">
                  {Math.abs(kerningValue) <= 2 ? (
                    <span className="text-emerald-400 font-bold">
                      ✓ PERFECT HARMONIC PROPORTION LOCKED (0.00 OPTICAL OFFSET)
                    </span>
                  ) : (
                    <span className="text-amber-400">
                      ⚠ Unbalanced letterspacing detected. Slide to target 0.
                    </span>
                  )}
                </div>
              </div>

              {/* Slider Control */}
              <div className="flex items-center gap-4">
                <span className="text-xs font-mono text-slate-400 shrink-0">-50 Tight</span>
                <input
                  id="saw-kerning-slider"
                  type="range"
                  min="-50"
                  max="50"
                  value={kerningValue}
                  onChange={handleKerningChange}
                  className="w-full accent-red-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
                <span className="text-xs font-mono text-slate-400 shrink-0">+50 Loose</span>
              </div>
            </div>

            {/* Trial 2: The WCAG Contrast Guillotine */}
            <div className={`p-5 rounded-2xl border transition-all ${
              contrastPassed
                ? 'bg-emerald-950/20 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                : 'bg-[#0b1120] border-slate-800'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-red-950 border border-red-600 text-red-400 font-mono font-bold text-xs flex items-center justify-center">
                    2
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      Trial II: The WCAG Contrast Guillotine
                    </h3>
                    <p className="text-xs text-slate-400">
                      The blade is suspended by an optical circuit. Choose the only swatch that achieves WCAG AAA compliance (8.0:1+).
                    </p>
                  </div>
                </div>

                <div className="font-mono text-xs font-bold">
                  {contrastPassed ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      BLADE SEVERED (AAA VERIFIED)
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      BLADE SUSPENDED OVER CANDIDATE CV
                    </span>
                  )}
                </div>
              </div>

              {/* 3 Swatches */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
                <button
                  id="saw-contrast-trap1-btn"
                  onClick={() => handleSelectContrast('trap_slate')}
                  className={`p-4 rounded-xl border text-left transition relative ${
                    selectedContrastKey === 'trap_slate'
                      ? 'border-red-600 bg-red-950/30'
                      : 'border-slate-800 bg-[#1e293b] hover:border-slate-700'
                  }`}
                >
                  <div className="text-[10px] font-mono text-slate-400 mb-1">SWATCH ALPHA</div>
                  <div className="text-sm font-bold text-[#475569]">
                    Faint Slate on Charcoal
                  </div>
                  <div className="text-[10px] font-mono text-red-400 mt-2">
                    Ratio: 2.1:1 (FAIL)
                  </div>
                </button>

                <button
                  id="saw-contrast-trap2-btn"
                  onClick={() => handleSelectContrast('trap_red')}
                  className={`p-4 rounded-xl border text-left transition relative ${
                    selectedContrastKey === 'trap_red'
                      ? 'border-red-600 bg-red-950/30'
                      : 'border-slate-800 bg-[#171717] hover:border-slate-700'
                  }`}
                >
                  <div className="text-[10px] font-mono text-slate-400 mb-1">SWATCH BETA</div>
                  <div className="text-sm font-bold text-[#dc2626]">
                    Vibrating Crimson on Pitch
                  </div>
                  <div className="text-[10px] font-mono text-amber-400 mt-2">
                    Ratio: 3.4:1 (FATIGUE)
                  </div>
                </button>

                <button
                  id="saw-contrast-safe-btn"
                  onClick={() => handleSelectContrast('safe_gold')}
                  className={`p-4 rounded-xl border text-left transition relative ${
                    selectedContrastKey === 'safe_gold'
                      ? 'border-emerald-500 bg-emerald-950/40 shadow-lg shadow-emerald-950/50'
                      : 'border-amber-500/40 bg-[#080d1a] hover:border-amber-400'
                  }`}
                >
                  <div className="text-[10px] font-mono text-[#dfb15b] mb-1 font-bold">SWATCH GAMMA (KEY)</div>
                  <div className="text-sm font-bold text-[#dfb15b]">
                    Radiant Gold on Slate Vault
                  </div>
                  <div className="text-[10px] font-mono text-emerald-400 mt-2 font-bold">
                    Ratio: 8.6:1 (WCAG AAA PASS)
                  </div>
                  {contrastPassed && (
                    <div className="absolute top-2 right-2 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                </button>
              </div>

              {contrastError && (
                <div className="p-3 rounded-xl bg-red-950/50 border border-red-600 text-xs font-mono text-red-200 animate-shake">
                  {contrastError}
                </div>
              )}
            </div>

            {/* Trial 3: Authentic Artifact Dissection (Real Scraped Images from jonnycoke.com) */}
            <div className={`p-5 rounded-2xl border transition-all ${
              artifactPassed
                ? 'bg-emerald-950/20 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                : 'bg-[#0b1120] border-slate-800'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-red-950 border border-red-600 text-red-400 font-mono font-bold text-xs flex items-center justify-center">
                    3
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      Trial III: The Authentic Artifact Dissection
                    </h3>
                    <p className="text-xs text-slate-400">
                      Inspect these 4 verified physical &amp; digital deliverables from Jonny Coke’s commercial archives. Identify which artifact was the UK membership publishing sector’s <strong className="text-white">FIRST-EVER Augmented Reality magazine</strong>.
                    </p>
                  </div>
                </div>

                <div className="font-mono text-xs font-bold">
                  {artifactPassed ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      AR SEED RECOGNIZED // FINAL SEAL BROKEN
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      INSPECT THE 4 ARTIFACTS
                    </span>
                  )}
                </div>
              </div>

              {/* 4 Containment Pods featuring real scraped images */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 my-4">
                {AUTHENTIC_JONNYCOKE_IMAGES.slice(0, 4).map(artifact => {
                  const isSelected = selectedArtifactId === artifact.id;
                  const isCorrect = artifact.id === 'dt-ar-cover';

                  return (
                    <div
                      key={artifact.id}
                      className={`group relative rounded-xl border p-2 flex flex-col justify-between transition cursor-pointer ${
                        isSelected
                          ? isCorrect
                            ? 'bg-emerald-950/40 border-emerald-500 shadow-lg'
                            : 'bg-red-950/40 border-red-600'
                          : 'bg-[#080d1a] border-slate-800 hover:border-slate-700'
                      }`}
                      onClick={() => handleSelectArtifact(artifact)}
                    >
                      {/* Image or Video Thumbnail with zoom trigger */}
                      <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden bg-[#070c18] mb-2 border border-slate-800/80">
                        {artifact.id === 'dt-ar-cover' || artifact.videoUrl ? (
                          <div className="relative w-full h-full bg-black group-hover:scale-105 transition-transform duration-300 rounded-lg overflow-hidden border border-red-950/80">
                            <iframe
                              src="https://www.youtube.com/embed/FWwvsqd4Gcg?autoplay=1&mute=1&loop=1&playlist=FWwvsqd4Gcg&playsinline=1&controls=0&rel=0&modestbranding=1"
                              title="Dietetics Today Augmented Reality Cover (BDA) - YouTube Demonstration"
                              className="w-full h-full border-0 pointer-events-none"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                            />
                            <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/90 text-[8px] font-mono text-red-400 border border-red-600/50 flex items-center gap-1 shadow z-10">
                              <Film className="w-2.5 h-2.5 text-red-500" />
                              <span>YOUTUBE AR SHORTS</span>
                            </div>
                            <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/90 text-[8px] font-mono text-emerald-400 border border-emerald-500/40 flex items-center gap-1 shadow z-10">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              <span>VERIFIED CV AR</span>
                            </div>
                          </div>
                        ) : failedArtifactImages[artifact.id] ? (
                          <div className="w-full h-full bg-gradient-to-b from-[#111827] to-[#080d1a] flex flex-col items-center justify-center p-2 text-center select-none">
                            <FileText className="w-6 h-6 text-[#dfb15b] mb-1.5" />
                            <span className="text-[10px] font-bold text-white line-clamp-2 leading-tight">
                              {artifact.title}
                            </span>
                            <span className="text-[8px] font-mono text-slate-400 mt-1">
                              {artifact.category}
                            </span>
                          </div>
                        ) : (
                          <div className="relative w-full h-full">
                            <img
                              src={artifact.imageUrl}
                              alt={artifact.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              referrerPolicy="no-referrer"
                              onError={() => setFailedArtifactImages(prev => ({ ...prev, [artifact.id]: true }))}
                            />
                            {artifact.id === 'msn-racing-campaign' && (
                              <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-red-950/90 text-[8px] font-mono text-red-300 border border-red-600/50 flex items-center gap-1 shadow">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                                <span>MSN-3 // AUTOSPORT</span>
                              </div>
                            )}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectingArtifact(artifact);
                          }}
                          className="absolute bottom-1.5 right-1.5 p-1 rounded-md bg-black/80 text-white hover:text-[#dfb15b] transition text-[10px] flex items-center gap-1 z-10"
                        >
                          <Maximize2 className="w-3 h-3" />
                        </button>
                        {artifact.id !== 'dt-ar-cover' && !artifact.videoUrl && (
                          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/85 text-[9px] font-mono text-[#dfb15b] border border-[#dfb15b]/30">
                            {artifact.id === 'geo-mag-cover'
                              ? 'GSL // PPA NOMINATED COVER'
                              : artifact.id === 'brent-shisha-campaign'
                              ? 'BRENT COUNCIL // A5 LEAFLET'
                              : artifact.id === 'msn-racing-campaign'
                              ? 'AUTOSPORT // MSN-3 CAMPAIGN'
                              : artifact.sourcePage}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="text-[11px] font-bold text-white leading-snug line-clamp-2">
                          {artifact.title}
                        </div>
                        <div className="text-[10px] text-slate-400 line-clamp-2">
                          {artifact.category}
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`w-full mt-2 py-1 rounded text-[10px] font-mono font-bold flex items-center justify-center gap-1 transition ${
                          isSelected && isCorrect
                            ? 'bg-emerald-600 text-white'
                            : isSelected && !isCorrect
                            ? 'bg-red-800 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {isSelected && isCorrect ? '✓ CORRECT ARTIFACT' : 'SELECT ARTIFACT'}
                      </button>
                    </div>
                  );
                })}
              </div>

              {artifactError && (
                <div className="p-3 rounded-xl bg-red-950/50 border border-red-600 text-xs font-mono text-red-200">
                  {artifactError}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CONFESS */}
        {activeTab === 'ats_canisters' && (
          <div className="space-y-4 p-5 bg-[#0b1120] border border-slate-800 rounded-2xl animate-in fade-in-50 duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-red-950 text-red-400 border border-red-800 mb-1">
                  OPTION 2: CONFESS
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-red-400" />
                  Confess: Acknowledge &amp; Vent Recruiter ATS Sins &amp; Client Spec-Work Traps
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Admit to automated screening sins or prospective client spec-work tropes (&ldquo;good for your portfolio&rdquo;, &ldquo;make it professional&rdquo;). Puncture at least <strong>4 canisters</strong> to vent the chamber and unlock clearance.
                </p>
              </div>

              <div className="flex items-center gap-2.5 self-start sm:self-auto">
                <button
                  id="confess-all-sins-btn"
                  onClick={handleConfessAll}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-black font-mono font-black text-xs shadow-md shadow-red-900/50 flex items-center gap-1.5 transition cursor-pointer"
                  title="Confess all recruiting and client spec-work tropes to vent the chamber"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confess All Sins</span>
                </button>
                <div className="text-xs font-mono font-bold text-[#dfb15b] px-3 py-1.5 rounded-xl bg-[#080d1a] border border-slate-800 shrink-0">
                  {puncturedCanisters.length} / 4 Punctured
                </div>
              </div>
            </div>

            {/* Filter Pills: All / Client Spec-Work Traps / Recruiter ATS Sins */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5 bg-black/50 p-1 rounded-xl border border-slate-800 text-xs font-mono">
                <button
                  onClick={() => setCanisterFilter('all')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer font-bold ${
                    canisterFilter === 'all'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ALL CANISTERS ({TOXIC_CANISTERS.length})
                </button>
                <button
                  onClick={() => setCanisterFilter('client')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer font-bold flex items-center gap-1 ${
                    canisterFilter === 'client'
                      ? 'bg-amber-600 text-black shadow-sm'
                      : 'text-amber-400 hover:text-amber-300'
                  }`}
                >
                  <span>CLIENT SPEC-WORK TRAPS ({TOXIC_CANISTERS.filter(c => c.category === 'client').length})</span>
                </button>
                <button
                  onClick={() => setCanisterFilter('recruiter')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer font-bold ${
                    canisterFilter === 'recruiter'
                      ? 'bg-red-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  RECRUITER ATS SINS ({TOXIC_CANISTERS.filter(c => c.category === 'recruiter').length})
                </button>
              </div>

              <span className="text-[10px] font-mono text-slate-400">
                Click any canister below to puncture &amp; reveal Jonny Coke&apos;s retort
              </span>
            </div>

            {/* Live Punctured Retort Banner */}
            {lastPuncturedRetort && (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-red-950/80 via-black to-amber-950/60 border border-[#dfb15b]/60 shadow-lg space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                  <span className="text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    PUNCTURED: {lastPuncturedRetort.label}
                  </span>
                  <span className="px-2 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {lastPuncturedRetort.tag}
                  </span>
                </div>
                <div className="text-xs sm:text-sm font-serif italic text-white flex items-start gap-2 pt-0.5">
                  <span className="text-[#dfb15b] font-bold not-italic font-mono text-xs shrink-0">Jonny Coke:</span>
                  <span>&ldquo;{lastPuncturedRetort.retort}&rdquo;</span>
                </div>
              </div>
            )}

            {/* Canisters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {TOXIC_CANISTERS.filter(c => canisterFilter === 'all' || c.category === canisterFilter).map(canister => {
                const punctured = puncturedCanisters.includes(canister.id);
                const isClient = canister.category === 'client';
                return (
                  <button
                    key={canister.id}
                    id={`toxic-canister-${canister.id}`}
                    onClick={() => handlePunctureCanister(canister)}
                    className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between gap-2.5 cursor-pointer ${
                      punctured
                        ? 'bg-emerald-950/30 border-emerald-500/60 text-emerald-300 shadow-emerald-950/20'
                        : isClient
                        ? 'bg-amber-950/20 border-amber-700/50 text-slate-200 hover:border-amber-400 hover:bg-amber-900/30 shadow-md'
                        : 'bg-red-950/20 border-red-700/50 text-slate-200 hover:border-red-500 hover:bg-red-900/30 shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          punctured
                            ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-600/40'
                            : isClient
                            ? 'bg-amber-950/80 text-amber-400 border border-amber-600/40'
                            : 'bg-red-950/80 text-red-400 border border-red-600/40'
                        }`}
                      >
                        {canister.tag}
                      </span>
                      <div className="shrink-0">
                        {punctured ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Flame className="w-4 h-4 text-red-500 animate-pulse" />
                        )}
                      </div>
                    </div>

                    <div className="text-xs font-mono font-bold text-white">
                      {canister.label}
                    </div>

                    {punctured ? (
                      <div className="text-[10px] font-mono text-emerald-400/90 pt-1 border-t border-emerald-900/60 italic leading-snug">
                        &ldquo;{canister.retort}&rdquo;
                      </div>
                    ) : (
                      <div className="text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800 flex items-center justify-between">
                        <span>Click to puncture &amp; vent</span>
                        <span className="text-red-400 font-bold">VENT</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* BOTTOM CLEARANCE UNLOCK BAR */}
        <div className="pt-4 border-t border-red-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-mono">
            {clearanceGranted ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                INITIATION PASSED // PROCEED TO ARCADE
              </span>
            ) : (
              <span className="text-slate-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                Complete the 3 Graphic Design Tests or Confess to proceed.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              id="saw-enter-site-btn"
              disabled={!clearanceGranted}
              onClick={handleEnterPlatform}
              className={`px-6 py-3 rounded-xl font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition ${
                clearanceGranted
                  ? 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-lg shadow-emerald-500/30 scale-105 animate-pulse'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
              }`}
            >
              <span>ENTER THE ARCADE (PLAY GAMES TO UNLOCK PORTFOLIO &amp; CV)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ARTIFACT INSPECTION LIGHTBOX MODAL */}
      {inspectingArtifact && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-3xl w-full bg-[#090e1b] border border-amber-500/40 rounded-2xl p-5 space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <div className="text-[10px] font-mono text-[#dfb15b] uppercase font-bold">
                  EVIDENCE FILE // {inspectingArtifact.sourcePage}
                </div>
                <h3 className="text-base font-bold text-white">{inspectingArtifact.title}</h3>
              </div>
              <button
                onClick={() => setInspectingArtifact(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* EVIDENCE MEDIA CONTAINER: VIDEO OR IMAGE */}
            {inspectingArtifact.id === 'dt-ar-cover' || inspectingArtifact.videoUrl ? (
              <div
                className="relative flex flex-col items-center justify-center overflow-hidden rounded-xl bg-black border border-red-900/60 p-3"
              >
                <div className="w-full max-w-sm aspect-[9/16] max-h-[52vh] rounded-2xl overflow-hidden border-2 border-red-800/80 shadow-2xl relative bg-black flex items-center justify-center">
                  <iframe
                    src="https://www.youtube.com/embed/FWwvsqd4Gcg?autoplay=1&mute=0&loop=1&playlist=FWwvsqd4Gcg&playsinline=1&rel=0"
                    title="Dietetics Today AR Cover - YouTube Demonstration"
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                  <div className="absolute top-2 left-2 px-2 py-1 rounded bg-black/85 border border-red-500/60 text-[9px] font-mono text-red-300 flex items-center gap-1.5 backdrop-blur-sm z-10">
                    <Film className="w-3 h-3 text-red-500" />
                    <span>VERIFIED AR VIDEO (BLIPPAR ENGINE)</span>
                  </div>
                  <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/85 border border-emerald-500/40 text-[9px] font-mono text-emerald-400 flex items-center gap-1.5 backdrop-blur-sm z-10">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>CV VERIFIED WORK</span>
                  </div>
                </div>

                {/* Video Playback & Upload Controls Bar */}
                <div className="w-full mt-3 p-2 rounded-lg bg-[#0b1222] border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <a
                      href="https://youtube.com/shorts/FWwvsqd4Gcg?si=779uiQqzg0WxBYoi"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-md bg-red-600/30 hover:bg-red-600/50 border border-red-500/40 text-red-200 text-[10px] font-mono flex items-center gap-1.5 transition"
                    >
                      <ExternalLink className="w-3 h-3 text-red-400" />
                      <span>Open YouTube Short</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        if (modalVideoRef.current) {
                          if (modalVideoRef.current.paused) {
                            modalVideoRef.current.play();
                            setVideoIsPlaying(true);
                          } else {
                            modalVideoRef.current.pause();
                            setVideoIsPlaying(false);
                          }
                        }
                      }}
                      className="p-1.5 rounded-md bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/40 transition flex items-center gap-1"
                      title={videoIsPlaying ? 'Pause Video' : 'Play Video'}
                    >
                      {videoIsPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (modalVideoRef.current) {
                          modalVideoRef.current.currentTime = 0;
                          modalVideoRef.current.play();
                          setVideoIsPlaying(true);
                        }
                      }}
                      className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="Restart Video"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (modalVideoRef.current) {
                          modalVideoRef.current.muted = !videoMuted;
                          setVideoMuted(!videoMuted);
                        }
                      }}
                      className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title={videoMuted ? 'Unmute Audio' : 'Mute Audio'}
                    >
                      {videoMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>

                    <span className="text-[11px] text-slate-400">
                      {Math.floor(videoProgress)}s / {Math.floor(videoDuration)}s
                    </span>
                  </div>

                  {/* Scrub Slider */}
                  <div className="flex-1 min-w-[120px] max-w-[240px]">
                    <input
                      type="range"
                      min={0}
                      max={videoDuration || 16}
                      step={0.1}
                      value={videoProgress}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setVideoProgress(val);
                        if (modalVideoRef.current) modalVideoRef.current.currentTime = val;
                      }}
                      className="w-full accent-cyan-400 h-1 bg-slate-700 rounded cursor-pointer"
                    />
                  </div>

                  {/* Verified AR Deliverable Badge */}
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono font-bold">
                      VERIFIED AR MP4
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative max-h-[60vh] flex items-center justify-center overflow-hidden rounded-xl bg-black border border-slate-800 p-2">
                {failedArtifactImages[inspectingArtifact.id] ? (
                  <div className="p-8 text-center flex flex-col items-center justify-center bg-[#090f1d] rounded-xl w-full">
                    <FileText className="w-12 h-12 text-[#dfb15b] mb-3" />
                    <h4 className="text-sm font-bold text-white mb-1">{inspectingArtifact.title}</h4>
                    <p className="text-xs text-slate-400 max-w-sm">{inspectingArtifact.description}</p>
                    <div className="mt-3 px-3 py-1 rounded bg-black/60 border border-slate-700 font-mono text-[10px] text-amber-300">
                      Source: {inspectingArtifact.sourcePage}
                    </div>
                  </div>
                ) : (
                  <div className="relative flex flex-col items-center justify-center w-full">
                    <img
                      src={
                        inspectingArtifact.id === 'msn-racing-campaign'
                          ? (inspectingArtifact.imageUrl || '/portfolio/MSN-3.png')
                          : inspectingArtifact.id === 'brent-shisha-campaign'
                          ? (shishaPreviewPage === 2
                              ? '/assets/aistudio/shisha_campaign_p2.png'
                              : shishaPreviewPage === 3
                              ? '/assets/aistudio/shisha_campaign_p3.png'
                              : shishaPreviewPage === 4
                              ? '/assets/aistudio/IMG_6001_6f94d77f.jpeg'
                              : shishaPreviewPage === 5
                              ? '/assets/aistudio/IMG_5999_15e8dad9.jpeg'
                              : shishaPreviewPage === 6
                              ? '/assets/aistudio/image_e4980fe9.png'
                              : '/assets/aistudio/shisha_campaign_cover.png')
                          : inspectingArtifact.id === 'geo-mag-cover'
                          ? '/assets/aistudio/IMG_5996_7f12e8e4.jpeg'
                          : inspectingArtifact.imageUrl
                      }
                      alt={inspectingArtifact.title}
                      className="max-h-[55vh] w-auto object-contain rounded"
                      referrerPolicy="no-referrer"
                      onError={() => setFailedArtifactImages(prev => ({ ...prev, [inspectingArtifact.id]: true }))}
                    />

                    {/* Brent Council Shisha Leaflet Multi-Page & PDF Bar */}
                    {inspectingArtifact.id === 'brent-shisha-campaign' && (
                      <div className="w-full mt-3 p-2.5 rounded-lg bg-[#0b1222] border border-amber-900/40 flex flex-col gap-2.5 text-xs font-mono">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] text-amber-400 font-bold mr-1">CIVIC PORTFOLIO EXHIBITS:</span>
                            {[
                              { page: 1, label: '1: Shisha Front' },
                              { page: 2, label: '2: Shisha Inside' },
                              { page: 3, label: '3: Shisha Back' },
                              { page: 4, label: '4: Reggae Roots Spread' },
                              { page: 5, label: '5: Grime Crime Page' },
                              { page: 6, label: '6: Mayor Wembley Tour' },
                            ].map(p => (
                              <button
                                key={p.page}
                                type="button"
                                onClick={() => setShishaPreviewPage(p.page)}
                                className={`px-2 py-1 rounded text-[10px] font-bold border transition ${
                                  shishaPreviewPage === p.page
                                    ? 'bg-amber-500 text-black border-amber-400 shadow'
                                    : 'bg-black/60 text-slate-300 border-slate-700 hover:text-white'
                                }`}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <a
                          href="/assets/aistudio/7904_Shisha_Leaflet_A5_v12_0497d3ed.pdf"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-md bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-amber-200 text-[10px] font-mono flex items-center gap-1.5 transition"
                        >
                          <FileText className="w-3 h-3 text-amber-400" />
                          <span>Open PDF (7904_Shisha_Leaflet_A5_v12)</span>
                        </a>
                      </div>
                    )}

                    {/* Geoscientist Cover High-Res Direct Link Bar */}
                    {inspectingArtifact.id === 'geo-mag-cover' && (
                      <div className="w-full mt-3 p-2.5 rounded-lg bg-[#0b1222] border border-cyan-900/40 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-bold text-[10px]">
                            ★ PPA COVER OF THE YEAR NOMINEE (GSL)
                          </span>
                          <span className="text-[11px] text-slate-300">
                            Vol 27 No 4, May 2017: &ldquo;Blowing Hot &amp; Cold&rdquo; Award-Nominated Physical Print Cover
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href="https://geoscientist.online/wp-content/uploads/2025/05/Geoscientist-2017_27_04-May.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-md bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-amber-200 text-[10px] font-mono flex items-center gap-1.5 transition"
                          >
                            <FileText className="w-3 h-3 text-amber-400" />
                            <span>Open May 2017 Issue PDF</span>
                          </a>
                          <a
                            href="/assets/aistudio/IMG_5996_7f12e8e4.jpeg"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-md bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-200 text-[10px] font-mono flex items-center gap-1.5 transition"
                          >
                            <ExternalLink className="w-3 h-3 text-cyan-400" />
                            <span>View Nominated Cover Scan</span>
                          </a>
                        </div>
                      </div>
                    )}

                    {inspectingArtifact.id === 'msn-racing-campaign' && (
                      <div className="w-full mt-3 p-2.5 rounded-lg bg-[#0b1222] border border-red-900/40 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-700/60 font-bold text-[10px]">
                            MSN-3.PNG AUTOSPORT PRESS
                          </span>
                          <span className="text-[11px] text-slate-300">
                            &ldquo;Just In Time For Father’s Day // Try 6 Issues for £6&rdquo;
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-md bg-red-950/80 border border-red-700/60 text-red-300 text-[10px] font-mono font-bold">
                            VERIFIED PRINT SPEC
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <p className="text-xs text-slate-300 font-mono leading-relaxed">
              {inspectingArtifact.description}
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                <span className="text-[#dfb15b] font-bold">VERIFIED REPOSITORY DELIVERABLE:</span>
                {inspectingArtifact.id === 'geo-mag-cover' && (
                  <span className="text-slate-300">
                    IMG_5996_7f12e8e4.jpeg (PPA Award Nominated Cover // May 2017 Vol 27 No 4)
                  </span>
                )}
                {inspectingArtifact.id === 'brent-shisha-campaign' && (
                  <span className="text-slate-300">
                    7904_Shisha_Leaflet_A5_v12_0497d3ed.pdf
                  </span>
                )}
                {inspectingArtifact.id === 'msn-racing-campaign' && (
                  <span className="text-slate-300">
                    /portfolio/MSN-3.png
                  </span>
                )}
                {inspectingArtifact.id === 'dt-ar-cover' && (
                  <span className="text-slate-300">
                    YouTube AR Demonstration // BDA Century One
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  handleSelectArtifact(inspectingArtifact);
                  setInspectingArtifact(null);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold transition shrink-0"
              >
                Select This Artifact in Trial III
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
