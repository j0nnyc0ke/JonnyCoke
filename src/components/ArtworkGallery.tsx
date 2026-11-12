import React, { useState, useEffect } from 'react';
import { PortfolioArtworkPiece } from '../data/portfolioData';
import {
  Maximize2,
  Download,
  Upload,
  Check,
  FileCheck,
  RotateCcw,
  X,
  Layers,
  Sparkles,
  Info,
  Copy,
  FileImage,
  Play,
  Film,
} from 'lucide-react';

interface Props {
  artworkPieces: PortfolioArtworkPiece[];
  projectName: string;
  accentColor?: string;
}

export const ArtworkGallery: React.FC<Props> = ({
  artworkPieces,
  projectName,
  accentColor = '#dfb15b',
}) => {
  const [selectedPiece, setSelectedPiece] = useState<PortfolioArtworkPiece | null>(null);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [uploadToast, setUploadToast] = useState<string | null>(null);

  // Load any previously saved user overrides from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('jonny_coke_artwork_overrides');
      if (saved) {
        setOverrides(JSON.parse(saved));
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const handleFileDrop = (pieceId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, SVG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      const result = e.target?.result as string;
      if (result) {
        const next = { ...overrides, [pieceId]: result };
        setOverrides(next);
        try {
          localStorage.setItem('jonny_coke_artwork_overrides', JSON.stringify(next));
        } catch {
          // LocalStorage quota may be exceeded on huge images
        }
        setUploadToast(`Loaded custom asset for: ${file.name}`);
        setTimeout(() => setUploadToast(null), 3500);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetOverride = (pieceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = { ...overrides };
    delete next[pieceId];
    setOverrides(next);
    try {
      localStorage.setItem('jonny_coke_artwork_overrides', JSON.stringify(next));
    } catch {
      // Ignore
    }
  };

  const copyFilename = (filename: string, pieceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(filename);
    setCopiedId(pieceId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!artworkPieces || artworkPieces.length === 0) return null;

  return (
    <div className="space-y-4 pt-4 border-t border-slate-800/80">
      {/* Gallery Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#dfb15b]" />
            <h4 className="text-sm font-bold text-white tracking-wide">
              Portfolio Deliverables &amp; Artwork Gallery
            </h4>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#dfb15b]/15 text-[#dfb15b] border border-[#dfb15b]/30">
              {artworkPieces.length} Verified Pieces
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Archival pre-press packaging, POS retail display, 3D launch stills &amp; marketing assets for {projectName}.
          </p>
        </div>

        {uploadToast && (
          <div className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-xl flex items-center gap-1.5 animate-in fade-in">
            <Check className="w-3.5 h-3.5" />
            <span>{uploadToast}</span>
          </div>
        )}
      </div>

      {/* Grid of Artwork Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {artworkPieces.map(piece => {
          const isOverridden = Boolean(overrides[piece.id]);
          const currentSrc = overrides[piece.id] || piece.previewUrl;
          const isDragging = draggingId === piece.id;

          return (
            <div
              key={piece.id}
              onDragOver={e => {
                e.preventDefault();
                setDraggingId(piece.id);
              }}
              onDragLeave={() => setDraggingId(null)}
              onDrop={e => {
                e.preventDefault();
                setDraggingId(null);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileDrop(piece.id, e.dataTransfer.files[0]);
                }
              }}
              onClick={() => setSelectedPiece(piece)}
              className={`group relative rounded-2xl bg-[#090f1e] border transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between ${
                isDragging
                  ? 'border-[#dfb15b] scale-[1.01] shadow-xl shadow-[#dfb15b]/20 ring-2 ring-[#dfb15b]'
                  : 'border-slate-800/90 hover:border-slate-700 hover:shadow-xl hover:shadow-black/40'
              }`}
            >
              {/* Card Image Stage */}
              <div className="relative w-full aspect-[16/10] bg-[#060a14] overflow-hidden flex items-center justify-center border-b border-slate-800/60">
                {brokenImages[piece.id] && !isOverridden ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-b from-[#0b1222] to-[#060a14] relative select-none">
                    <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-[#dfb15b] mb-2 group-hover:scale-110 transition-transform shadow-inner">
                      <FileImage className="w-5 h-5 text-[#dfb15b]" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-200 line-clamp-1 max-w-[90%]">
                      {piece.title}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 mt-1">
                      {piece.dimensions || piece.fileType}
                    </span>
                  </div>
                ) : (
                  <img
                    src={currentSrc}
                    alt={piece.title}
                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={() => setBrokenImages(prev => ({ ...prev, [piece.id]: true }))}
                  />
                )}

                {/* Overlay Badge for Video, Overridden, or Vector Spec */}
                {piece.videoUrl ? (
                  <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md bg-amber-500 text-black font-mono font-black text-[10px] flex items-center gap-1.5 shadow-lg shadow-amber-500/30 animate-pulse">
                    <Play className="w-3 h-3 fill-current" />
                    <span>HD VIDEO LAUNCH</span>
                  </div>
                ) : isOverridden ? (
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-emerald-500/90 text-black font-mono font-bold text-[10px] flex items-center gap-1 shadow-md">
                    <FileCheck className="w-3 h-3" />
                    <span>USER FILE LOADED</span>
                  </div>
                ) : (
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-slate-300 font-mono text-[10px] border border-slate-700/60 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-[#dfb15b]" />
                    <span>AUTHENTIC SPEC</span>
                  </div>
                )}

                {/* Inspect Button Prompt on Hover */}
                <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-white text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-lg">
                    <Maximize2 className="w-3.5 h-3.5" />
                    Inspect Details
                  </span>
                </div>

                {/* Reset button if overridden */}
                {isOverridden && (
                  <button
                    onClick={e => handleResetOverride(piece.id, e)}
                    title="Reset to default artwork"
                    className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/80 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700 text-xs transition"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Card Meta Content */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#dfb15b] font-semibold">
                      {piece.category}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {piece.dimensions}
                    </span>
                  </div>

                  <h5 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#dfb15b] transition-colors leading-snug">
                    {piece.title}
                  </h5>

                  <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                    {piece.description}
                  </p>
                </div>

                {/* Tech Specs Badges */}
                {piece.specs && piece.specs.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {piece.specs.map((spec, sIdx) => (
                      <span
                        key={sIdx}
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/50"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                )}

                {/* Filename & Quick Actions Footer */}
                <div className="pt-2 border-t border-slate-800/70 flex items-center justify-between gap-2">
                  <button
                    onClick={e => copyFilename(piece.filename, piece.id, e)}
                    title="Click to copy original filename"
                    className="text-[10px] font-mono text-slate-400 hover:text-white flex items-center gap-1 truncate max-w-[200px]"
                  >
                    <Copy className="w-3 h-3 shrink-0 text-[#dfb15b]" />
                    <span className="truncate">{piece.filename}</span>
                    {copiedId === piece.id && (
                      <span className="text-[9px] text-emerald-400 font-bold ml-1">Copied!</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox / High-Res Inspection Modal */}
      {selectedPiece && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedPiece(null)}
        >
          <div
            className="relative w-full max-w-5xl max-h-[92vh] bg-[#0c1427] border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-[#080d1a]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#dfb15b]/15 border border-[#dfb15b]/30 flex items-center justify-center text-[#dfb15b]">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    {selectedPiece.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                    <span className="text-[#dfb15b] font-semibold">{selectedPiece.category}</span>
                    <span>•</span>
                    <span>{selectedPiece.dimensions}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedPiece(null)}
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Stage Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#050811] flex flex-col items-center justify-center">
              <div className="w-full max-h-[58vh] flex items-center justify-center bg-[#070b16] rounded-2xl border border-slate-800/80 p-2 sm:p-4 overflow-hidden relative shadow-inner">
                {selectedPiece.videoUrl ? (
                  <div className="w-full flex flex-col items-center justify-center">
                    <video
                      src={selectedPiece.videoUrl}
                      poster={selectedPiece.previewUrl}
                      controls
                      autoPlay
                      loop
                      playsInline
                      className="max-h-[52vh] max-w-full rounded-xl shadow-2xl border border-slate-700/60"
                    />
                    <div className="mt-2 flex items-center gap-2 text-[11px] font-mono text-amber-400">
                      <Film className="w-3.5 h-3.5" />
                      <span>Full HD 1080p 3D Launch Animation Commercial Master</span>
                    </div>
                  </div>
                ) : brokenImages[selectedPiece.id] && !overrides[selectedPiece.id] ? (
                  <div className="w-full h-64 sm:h-80 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-[#0b1224] to-[#070b16] rounded-xl border border-slate-800/80">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#dfb15b] mb-3">
                      <FileImage className="w-7 h-7" />
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1">{selectedPiece.title}</h4>
                    <p className="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed">
                      Original web asset awaiting local file supply. Drag and drop your image file here or click &quot;Upload Local File&quot; below to connect it.
                    </p>
                    <div className="px-3 py-1 rounded-md bg-slate-900 border border-slate-700 font-mono text-[10px] text-slate-300">
                      Target filename: {selectedPiece.filename}
                    </div>
                  </div>
                ) : (
                  <img
                    src={overrides[selectedPiece.id] || selectedPiece.previewUrl}
                    alt={selectedPiece.title}
                    className="max-h-[52vh] max-w-full object-contain rounded-lg"
                    onError={() => setBrokenImages(prev => ({ ...prev, [selectedPiece.id]: true }))}
                  />
                )}
              </div>

              {/* Information & Specifications Drawer */}
              <div className="w-full p-4 rounded-2xl bg-[#0c1427] border border-slate-800 text-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-white">Commercial Deliverable Overview</h5>
                    <p className="text-[11px] text-slate-300 leading-relaxed max-w-2xl">
                      {selectedPiece.description}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-[#dfb15b]" />
                    <span>Original Archive File:</span>
                    <strong className="text-slate-200">{selectedPiece.filename}</strong>
                  </div>

                  {selectedPiece.specs && (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPiece.specs.map((spec, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
