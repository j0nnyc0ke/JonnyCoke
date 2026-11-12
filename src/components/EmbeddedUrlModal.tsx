import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Smartphone,
  Tablet,
  Monitor,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface EmbeddedUrlModalProps {
  url: string;
  title: string;
  onClose: () => void;
}

export const EmbeddedUrlModal: React.FC<EmbeddedUrlModalProps> = ({
  url,
  title,
  onClose,
}) => {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [key, setKey] = useState(0);

  const getContainerWidth = () => {
    switch (deviceMode) {
      case 'mobile':
        return 'max-w-[400px]';
      case 'tablet':
        return 'max-w-[768px]';
      default:
        return 'max-w-6xl w-full';
    }
  };

  const getEmbedUrl = (rawUrl: string) => {
    if (rawUrl.includes('youtube.com/shorts/')) {
      const videoId = rawUrl.split('youtube.com/shorts/')[1]?.split('?')[0];
      if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`;
    }
    if (rawUrl.includes('youtube.com/watch')) {
      const match = rawUrl.match(/[?&]v=([^&]+)/);
      if (match?.[1]) return `https://www.youtube.com/embed/${match[1]}?autoplay=1&modestbranding=1&rel=0`;
    }
    if (rawUrl.includes('youtu.be/')) {
      const videoId = rawUrl.split('youtu.be/')[1]?.split('?')[0];
      if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`;
    }
    return rawUrl;
  };

  const iframeSrc = getEmbedUrl(url);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className={`bg-[#0c1427] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh] transition-all duration-300 ${getContainerWidth()}`}
      >
        {/* Header Bar */}
        <div className="bg-[#080d1a] border-b border-slate-800 px-4 py-3 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 truncate">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div className="truncate">
              <h3 className="text-sm font-bold text-white truncate">{title}</h3>
              <p className="text-[11px] font-mono text-slate-400 truncate">{url}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Device Switcher */}
            <div className="hidden sm:flex items-center bg-[#0c1427] border border-slate-800 rounded-xl p-1 gap-1">
              <button
                onClick={() => setDeviceMode('desktop')}
                className={`p-1.5 rounded-lg transition ${
                  deviceMode === 'desktop'
                    ? 'bg-[#dfb15b] text-[#080d1a]'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Desktop View"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDeviceMode('tablet')}
                className={`p-1.5 rounded-lg transition ${
                  deviceMode === 'tablet'
                    ? 'bg-[#dfb15b] text-[#080d1a]'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Tablet View (768px)"
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDeviceMode('mobile')}
                className={`p-1.5 rounded-lg transition ${
                  deviceMode === 'mobile'
                    ? 'bg-[#dfb15b] text-[#080d1a]'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Mobile View (375px)"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Refresh */}
            <button
              onClick={() => {
                setIsIframeLoaded(false);
                setHasError(false);
                setKey(k => k + 1);
              }}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
              title="Reload Frame"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* Open in new tab backup if requested */}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1 text-xs"
              title="Open full page"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition"
              title="Close Embedded Preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Embedded Iframe Container */}
        <div className="relative flex-1 w-full bg-slate-950 overflow-hidden flex flex-col">
          {!isIframeLoaded && !hasError && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0c1427]/90 text-center p-6 space-y-3">
              <div className="w-8 h-8 border-3 border-[#dfb15b] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-semibold text-white">Loading Embedded In-App View...</p>
              <p className="text-xs text-slate-400 max-w-sm">
                Embedding live digital asset directly inside the portfolio without leaving the application.
              </p>
            </div>
          )}

          <iframe
            key={key}
            src={iframeSrc}
            title={title}
            className="w-full h-full border-0 bg-white"
            onLoad={() => setIsIframeLoaded(true)}
            onError={() => setHasError(true)}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          />

          {/* Embedded Footer Note */}
          <div className="bg-[#080d1a] border-t border-slate-850 px-4 py-2 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Embedded In-App Deliverable Frame • Zero external signposting
            </span>
            <span className="font-mono text-slate-500">
              {deviceMode.toUpperCase()} VIEWPORT
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
