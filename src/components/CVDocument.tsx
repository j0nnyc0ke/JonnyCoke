import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { CREATOR_PROFILE } from '../data/portfolioData';
import { EmbeddedUrlModal } from './EmbeddedUrlModal';
import {
  Briefcase,
  GraduationCap,
  Award,
  CheckCircle2,
  Printer,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  ArrowLeft,
  FileText,
  ShieldCheck,
  PlusCircle,
  Monitor,
  QrCode,
  Layers,
  ChevronRight,
  Download,
  Eye,
} from 'lucide-react';

interface CVDocumentProps {
  onBack: () => void;
  onSelectProject: (projectId: string) => void;
  onOpenAssetManager?: () => void;
  onLaunchAR?: () => void;
  roleFilter?: string;
}

export const CVDocument: React.FC<CVDocumentProps> = ({
  onBack,
  onSelectProject,
  onOpenAssetManager,
  onLaunchAR,
  roleFilter = 'all',
}) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [embeddedPreview, setEmbeddedPreview] = useState<{ url: string; title: string } | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [qrGenerating, setQrGenerating] = useState<boolean>(true);

  useEffect(() => {
    QRCode.toDataURL('https://jonnycoke.com/', {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 400,
      color: {
        dark: '#080d1a',
        light: '#ffffff',
      },
    })
      .then(url => {
        setQrCodeDataUrl(url);
        setQrGenerating(false);
      })
      .catch(err => {
        console.warn('QR code generation note:', err);
        setQrGenerating(false);
      });
  }, []);

  const handleDownloadQR = () => {
    if (!qrCodeDataUrl) return;
    const a = document.createElement('a');
    a.href = qrCodeDataUrl;
    a.download = 'jonny_coke_portfolio_qr.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(CREATOR_PROFILE.email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(CREATOR_PROFILE.phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Action Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 print:hidden">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-[#dfb15b] transition group self-start"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to 3D Experience
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          {onLaunchAR && (
            <button
              onClick={onLaunchAR}
              className="px-3.5 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-[#dfb15b] to-[#c41230] text-black hover:opacity-90 transition flex items-center gap-1.5 shadow-md shadow-amber-500/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Launch Augmented Reality Mode
            </button>
          )}

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#dfb15b] text-[#080d1a] hover:bg-[#e5c07b] transition flex items-center gap-1.5 shadow-md shadow-[#dfb15b]/20"
            title="Print or Save as Clean PDF Document"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Main Printed / Digital CV Container */}
      <div className="bg-[#0c1427]/95 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
        {/* Subtle Accents */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#c41230]/10 rounded-full blur-3xl pointer-events-none print:hidden" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#dfb15b]/10 rounded-full blur-3xl pointer-events-none print:hidden" />

        {/* 1. Header with Monogram Logo & Contact Details */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-slate-800 print:border-neutral-300 pb-8">
          <div className="flex items-start gap-4">
            {/* Prominent Monogram Logo */}
            <div className="w-20 h-28 sm:w-24 sm:h-32 shrink-0 flex items-center justify-center">
              <img
                src="/image.png?v=3"
                alt="Jonny Coke Logo"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono bg-[#dfb15b]/15 text-[#dfb15b] border border-[#dfb15b]/30 mb-2.5 print:border-neutral-400 print:text-neutral-700">
                <ShieldCheck className="w-3.5 h-3.5" />
                Senior Graphic &amp; Digital Designer • Accessibility &amp; Motion Specialist
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white print:text-black tracking-tight">
                {CREATOR_PROFILE.name}
              </h1>
              <p className="text-sm sm:text-base text-slate-300 print:text-neutral-700 font-medium mt-1">
                25+ Years of Industry Leadership • Print, Digital &amp; Motion
              </p>
              <p className="text-xs sm:text-sm text-slate-300 print:text-neutral-700 max-w-2xl mt-3 leading-relaxed">
                {CREATOR_PROFILE.bio}
              </p>
            </div>
          </div>

          {/* Contact Details Card */}
          <div className="flex flex-col gap-2.5 bg-[#080d1a]/90 print:bg-neutral-50 p-5 rounded-2xl border border-slate-800 print:border-neutral-300 text-xs min-w-[260px] self-start">
            <div className="flex items-center gap-2 text-slate-300 print:text-neutral-800">
              <MapPin className="w-4 h-4 text-[#dfb15b] print:text-neutral-600 shrink-0" />
              <span>{CREATOR_PROFILE.location}</span>
            </div>
            <button
              onClick={handleCopyPhone}
              className="flex items-center justify-between text-slate-300 print:text-neutral-800 hover:text-[#dfb15b] text-left transition group"
            >
              <span className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#dfb15b] print:text-neutral-600 shrink-0" />
                <span>{CREATOR_PROFILE.phone}</span>
              </span>
              <span className="text-[10px] text-slate-400 group-hover:text-[#dfb15b] font-mono print:hidden">
                {copiedPhone ? 'Copied!' : 'Copy'}
              </span>
            </button>
            <button
              onClick={handleCopyEmail}
              className="flex items-center justify-between text-slate-300 print:text-neutral-800 hover:text-[#dfb15b] text-left transition group"
            >
              <span className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#dfb15b] print:text-neutral-600 shrink-0" />
                <span>{CREATOR_PROFILE.email}</span>
              </span>
              <span className="text-[10px] text-slate-400 group-hover:text-[#dfb15b] font-mono print:hidden">
                {copiedEmail ? 'Copied!' : 'Copy'}
              </span>
            </button>
            <a
              href={CREATOR_PROFILE.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-slate-300 print:text-neutral-800 hover:text-[#dfb15b] transition"
            >
              <ExternalLink className="w-4 h-4 text-[#dfb15b] print:text-neutral-600 shrink-0" />
              <span>jonnycoke.com</span>
            </a>
            <a
              href={CREATOR_PROFILE.portfolioUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-slate-300 print:text-neutral-800 hover:text-[#dfb15b] transition"
            >
              <FileText className="w-4 h-4 text-[#dfb15b] print:text-neutral-600 shrink-0" />
              <span>jonnycoke.com</span>
            </a>

            {/* Embedded Live Scannable QR Code Card */}
            <div className="mt-2 pt-3 border-t border-slate-800 print:border-neutral-300 flex flex-col items-center gap-2 text-center bg-black/40 print:bg-white p-3 rounded-xl border border-slate-800/80 print:border-neutral-200">
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#dfb15b] print:text-neutral-800 font-bold uppercase tracking-wider">
                <QrCode className="w-3.5 h-3.5" />
                <span>Live Portfolio &amp; AR QR Code</span>
              </div>
              {qrCodeDataUrl ? (
                <div className="relative group p-1.5 bg-white rounded-lg shadow-md border border-neutral-300">
                  <img
                    src={qrCodeDataUrl}
                    alt="Scannable QR Code for Jonny Coke Portfolio & AR CV"
                    className="w-24 h-24 object-contain"
                  />
                  {/* Subtle centered brand dot in QR */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-5 h-5 rounded-full bg-[#080d1a] border border-[#dfb15b] flex items-center justify-center p-0.5 shadow">
                      <img src="/image.png?v=3" alt="" className="w-full h-full object-contain" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-24 h-24 bg-white/10 rounded-lg flex items-center justify-center text-[10px] font-mono text-slate-400">
                  Generating QR...
                </div>
              )}
              <span className="text-[10px] text-slate-400 print:text-neutral-600 max-w-[190px] leading-tight">
                Scan with any smartphone to open mobile AR CV &amp; portfolio
              </span>
              <div className="flex items-center gap-1.5 mt-1 print:hidden">
                <button
                  onClick={handleDownloadQR}
                  className="px-2 py-1 rounded bg-[#dfb15b]/15 hover:bg-[#dfb15b]/25 text-[#dfb15b] border border-[#dfb15b]/30 text-[10px] font-mono flex items-center gap-1 transition"
                  title="Download PNG for print or phone"
                >
                  <Download className="w-3 h-3" />
                  Save QR
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 1.5 Dedicated Quick-Action Banner: View CV & QR Code Direct Access */}
        <div className="my-6 p-4 rounded-2xl bg-gradient-to-r from-[#dfb15b]/10 via-[#c41230]/10 to-[#4a2377]/10 border border-[#dfb15b]/30 print:hidden flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white p-1 shrink-0 shadow-md">
              {qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} alt="QR Code" className="w-full h-full object-contain" />
              ) : (
                <QrCode className="w-full h-full text-black" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#dfb15b] uppercase tracking-wider">
                  Verified Executive CV &amp; AR QR Target
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Ready to Review
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Official CV document updated with complete 25+ year leadership timeline, recent freelance consultancy, and AR publishing milestones.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <a
              href="/portfolio/JCokePortfolio181219.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-[#080d1a] hover:bg-slate-800 text-white text-xs font-semibold border border-slate-700 flex items-center justify-center gap-1.5 transition"
            >
              <Eye className="w-3.5 h-3.5 text-[#dfb15b]" />
              Open Original PDF
            </a>
            <button
              onClick={handleDownloadQR}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-[#dfb15b] hover:bg-[#e5c07b] text-[#080d1a] text-xs font-bold flex items-center justify-center gap-1.5 transition shadow"
            >
              <Download className="w-3.5 h-3.5" />
              Download QR Code
            </button>
          </div>
        </div>

        {/* 2. Key Accreditations & Honors */}
        <div className="py-8 border-b border-slate-800 print:border-neutral-300">
          <h2 className="text-xs font-mono uppercase tracking-widest text-[#dfb15b] print:text-neutral-700 mb-4 flex items-center gap-2">
            <Award className="w-4 h-4" />
            Distinguished Career Milestones &amp; Honors
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {CREATOR_PROFILE.awards.map(award => (
              <div
                key={award}
                className="p-3.5 rounded-2xl bg-[#080d1a]/70 print:bg-white border border-slate-800 print:border-neutral-300 flex items-start gap-2.5 text-xs text-slate-200 print:text-neutral-800"
              >
                <CheckCircle2 className="w-4 h-4 text-[#dfb15b] print:text-neutral-700 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{award}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Core Competencies Matrix */}
        <div className="py-8 border-b border-slate-800 print:border-neutral-300">
          <h2 className="text-xs font-mono uppercase tracking-widest text-[#dfb15b] print:text-neutral-700 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Core Technical &amp; Creative Competencies
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CREATOR_PROFILE.skills.map(group => (
              <div
                key={group.category}
                className="p-4 rounded-2xl bg-[#080d1a]/70 print:bg-white border border-slate-800 print:border-neutral-300"
              >
                <h3 className="text-xs font-bold text-white print:text-neutral-900 uppercase font-mono mb-2.5">
                  {group.category}
                </h3>
                <ul className="text-xs text-slate-300 print:text-neutral-800 space-y-1.5">
                  {group.items.map(item => (
                    <li key={item} className="flex items-start gap-1.5">
                      <span className="text-[#dfb15b] print:text-neutral-400 shrink-0">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Complete Professional Experience Timeline */}
        <div className="py-8 border-b border-slate-800 print:border-neutral-300">
          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 className="text-xs font-mono uppercase tracking-widest text-[#dfb15b] print:text-neutral-700 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Comprehensive Professional Experience Timeline
            </h2>
          </div>

          <div className="space-y-8">
            {/* Role 1 */}
            <div className="relative pl-6 border-l-2 border-[#dfb15b]/40 print:border-neutral-400 pb-2">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#dfb15b] border-4 border-[#0c1427] print:border-white" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                <div>
                  <span className="text-sm sm:text-base font-bold text-white print:text-black">
                    Freelance Senior Designer &amp; Creative Consultant
                  </span>
                  <span className="text-xs text-[#dfb15b] print:text-neutral-700 font-semibold ml-2">
                    Various Commercial Clients &amp; Charities
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-400 print:text-neutral-600">
                  Mar 2024 – Present
                </span>
              </div>
              <p className="text-xs text-slate-300 print:text-neutral-800 leading-relaxed">
                Delivering end-to-end branding, digital campaigns, and multimedia content across diverse sectors.
                Increased client engagement by up to 45% through targeted social media and campaign design.
                Designed fully accessible websites, video content, and digital assets aligned with WCAG 2.2 standards.
              </p>
            </div>

            {/* Role 2 */}
            <div className="relative pl-6 border-l-2 border-[#dfb15b]/40 print:border-neutral-400 pb-2">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#dfb15b] border-4 border-[#0c1427] print:border-white" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                <div>
                  <span className="text-sm sm:text-base font-bold text-white print:text-black">
                    Digital Content Assistant
                  </span>
                  <span className="text-xs text-[#dfb15b] print:text-neutral-700 font-semibold ml-2">
                    Commonwealth Secretariat – London
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-400 print:text-neutral-600">
                  Jul 2023 – Mar 2024
                </span>
              </div>
              <p className="text-xs text-slate-300 print:text-neutral-800 leading-relaxed mb-3">
                Assisted staff in coordinating international assemblies attended by members of the Royal Family and distinguished High Commissioners.
                Collaborated on the global &quot;Commonwealth Says NO MORE&quot; campaign tackling domestic and sexual violence.
                Compiled responsive HTML editions of the Commonwealth Blue Charter newsletters achieving 45% email open rates.
                Produced videos with accessible captions, social media content, analytics, and digital graphics.
              </p>
              <div className="flex flex-wrap gap-2 text-[11px] print:hidden">
                <button
                  onClick={() => onSelectProject('commonwealth')}
                  className="px-3 py-1 rounded-lg bg-[#dfb15b]/15 text-[#dfb15b] hover:bg-[#dfb15b]/25 border border-[#dfb15b]/30 transition flex items-center gap-1 font-semibold"
                >
                  <Briefcase className="w-3 h-3" />
                  View Commonwealth Case Study
                </button>
                <button
                  onClick={() =>
                    setEmbeddedPreview({
                      url: 'https://thecommonwealth.org/our-work/commonwealth-says-no-more',
                      title: 'The Commonwealth — Commonwealth Says NO MORE Campaign',
                    })
                  }
                  className="px-3 py-1 rounded-lg bg-[#080d1a] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition flex items-center gap-1"
                >
                  <Monitor className="w-3 h-3 text-[#dfb15b]" />
                  Embedded Commonwealth Campaign
                </button>
              </div>
            </div>

            {/* Role 3 */}
            <div className="relative pl-6 border-l-2 border-[#dfb15b]/40 print:border-neutral-400 pb-2">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#dfb15b] border-4 border-[#0c1427] print:border-white" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                <div>
                  <span className="text-sm sm:text-base font-bold text-white print:text-black">
                    Digital Content Executive
                  </span>
                  <span className="text-xs text-[#dfb15b] print:text-neutral-700 font-semibold ml-2">
                    Dragonfly Venture / WIP (DeWalt &amp; Stanley Workwear) – St Albans
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-400 print:text-neutral-600">
                  Aug 2022 – Oct 2022
                </span>
              </div>
              <p className="text-xs text-slate-300 print:text-neutral-800 leading-relaxed mb-3">
                Managed creative assets for digital marketing of licensed global power brands (DeWalt &amp; Stanley Workwear).
                Created Point of Sale (POS) retail store displays, HTML emails, branded packaging labels, and collaborated directly with 3D designers and stakeholders to produce promotional videos and animations.
              </p>
            </div>

            {/* Role 4 */}
            <div className="relative pl-6 border-l-2 border-[#dfb15b]/40 print:border-neutral-400 pb-2">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#dfb15b] border-4 border-[#0c1427] print:border-white" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                <div>
                  <span className="text-sm sm:text-base font-bold text-white print:text-black">
                    Freelance Graphic Designer
                  </span>
                  <span className="text-xs text-[#dfb15b] print:text-neutral-700 font-semibold ml-2">
                    Daltec Ltd – Watford
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-400 print:text-neutral-600">
                  Apr 2022 – May 2022
                </span>
              </div>
              <p className="text-xs text-slate-300 print:text-neutral-800 leading-relaxed">
                Branded packaging labels, social media campaigns, promotional motion graphics, and structured HTML emails for vehicle electronics distributor.
              </p>
            </div>

            {/* Role 5 */}
            <div className="relative pl-6 border-l-2 border-[#dfb15b]/40 print:border-neutral-400 pb-2">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#dfb15b] border-4 border-[#0c1427] print:border-white" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                <div>
                  <span className="text-sm sm:text-base font-bold text-white print:text-black">
                    Lead Designer (Freelance)
                  </span>
                  <span className="text-xs text-[#dfb15b] print:text-neutral-700 font-semibold ml-2">
                    Transport for London (TfL) – London
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-400 print:text-neutral-600">
                  Jan 2022 – Mar 2022
                </span>
              </div>
              <p className="text-xs text-slate-300 print:text-neutral-800 leading-relaxed mb-3">
                Served as lead designer for Issue 25 of On Route, TfL&apos;s magazine serving London&apos;s Taxi and Private Hire trade.
                Collaborated closely with the editor and an accessibility expert to author fully WCAG-accessible tagged PDFs.
                Additionally designed TfL&apos;s official travel editorial spreads for Metro commuter newspaper.
              </p>
              <div className="flex flex-wrap gap-2 text-[11px] print:hidden">
                <button
                  onClick={() =>
                    setEmbeddedPreview({
                      url: 'https://content.tfl.gov.uk/on-route-issue-25.pdf',
                      title: 'Transport for London — On Route Magazine (Issue 25)',
                    })
                  }
                  className="px-3 py-1 rounded-lg bg-[#c41230]/20 text-[#fca5a5] hover:bg-[#c41230]/30 border border-[#c41230]/40 transition flex items-center gap-1 font-semibold"
                >
                  <FileText className="w-3 h-3" />
                  View Embedded TfL On Route Issue 25
                </button>
              </div>
            </div>

            {/* Role 6 */}
            <div className="relative pl-6 border-l-2 border-[#dfb15b]/40 print:border-neutral-400 pb-2">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#dfb15b] border-4 border-[#0c1427] print:border-white" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                <div>
                  <span className="text-sm sm:text-base font-bold text-white print:text-black">
                    Communications Graphic Designer (Freelance)
                  </span>
                  <span className="text-xs text-[#dfb15b] print:text-neutral-700 font-semibold ml-2">
                    Brent Council – London
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-400 print:text-neutral-600">
                  Jan 2020 – Mar 2020
                </span>
              </div>
              <p className="text-xs text-slate-300 print:text-neutral-800 leading-relaxed mb-3">
                Designed public health campaign literature (&quot;Shisha: The facts&quot;), Brent Magazine editorial spreads, library service collateral, Mayor of Brent ceremonial presentations, pull-up banners, and civic infographics.
              </p>
              <div className="flex flex-wrap gap-2 text-[11px] print:hidden">
                <button
                  onClick={() =>
                    setEmbeddedPreview({
                      url: '/assets/aistudio/7904_Shisha_Leaflet_A5_v12_0497d3ed.pdf',
                      title: 'Brent Council "Shisha: The Facts" Public Health A5 Leaflet',
                    })
                  }
                  className="px-3 py-1 rounded-lg bg-[#080d1a] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition flex items-center gap-1"
                >
                  <FileText className="w-3 h-3 text-[#dfb15b]" />
                  Verified A5 Campaign Leaflet (PDF)
                </button>
              </div>
            </div>

            {/* Role 7 */}
            <div className="relative pl-6 border-l-2 border-[#dfb15b]/40 print:border-neutral-400 pb-2">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#dfb15b] border-4 border-[#0c1427] print:border-white" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                <div>
                  <span className="text-sm sm:text-base font-bold text-white print:text-black">
                    Marketing Graphic Designer
                  </span>
                  <span className="text-xs text-[#dfb15b] print:text-neutral-700 font-semibold ml-2">
                    Motorsport Network (Autosport / F1) – Richmond upon Thames
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-400 print:text-neutral-600">
                  May 2019 – Nov 2019
                </span>
              </div>
              <p className="text-xs text-slate-300 print:text-neutral-800 leading-relaxed mb-3">
                Digital and print marketing collateral, animated advertising banners (MPUs), social media assets, digital adverts, print adverts, and A/B conversion testing for global racing media brands.
              </p>
              <div className="flex flex-wrap gap-2 text-[11px] print:hidden">
                <button
                  onClick={() =>
                    setEmbeddedPreview({
                      url: '/portfolio/MSN-3.png',
                      title: 'Motorsport Network (Autosport / F1) Marketing Deliverables',
                    })
                  }
                  className="px-3 py-1 rounded-lg bg-[#080d1a] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition flex items-center gap-1"
                >
                  <Monitor className="w-3 h-3 text-[#dfb15b]" />
                  Motorsport Network MSN-3 Press Asset
                </button>
              </div>
            </div>

            {/* Role 8 - Century One AR Pioneer */}
            <div className="relative pl-6 border-l-2 border-[#dfb15b]/40 print:border-neutral-400 pb-2">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#dfb15b] border-4 border-[#0c1427] print:border-white" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                <div>
                  <span className="text-sm sm:text-base font-bold text-white print:text-black">
                    Production / Editorial Graphic Designer
                  </span>
                  <span className="text-xs text-[#dfb15b] print:text-neutral-700 font-semibold ml-2">
                    Century One Publishing – St Albans
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-400 print:text-neutral-600">
                  May 2015 – May 2019 (4 Years)
                </span>
              </div>
              <p className="text-xs text-slate-300 print:text-neutral-800 leading-relaxed mb-3">
                Led publication design and production across trade union and membership organisations. In 2018/19, created the sector&apos;s first-ever Augmented Reality (AR) version of a trade union publication. Finalist for PPA Awards (Cover of the Year &amp; Membership Magazine of the Year). Grew social media channels to 15,000+ followers. Sole production designer on Geoscientist magazine (Geological Society of London) across 28+ monthly issues.
              </p>
              <div className="flex flex-wrap gap-2 text-[11px] print:hidden">
                <button
                  onClick={() => onSelectProject('geoscientist')}
                  className="px-3 py-1 rounded-lg bg-[#0d9488]/20 text-[#2dd4bf] hover:bg-[#0d9488]/30 border border-[#0d9488]/40 transition flex items-center gap-1 font-semibold"
                >
                  <FileText className="w-3 h-3" />
                  Geoscientist (29 Issues Archive)
                </button>
                <button
                  onClick={() => onSelectProject('scope-ipem')}
                  className="px-3 py-1 rounded-lg bg-[#0284c7]/20 text-[#38bdf8] hover:bg-[#0284c7]/30 border border-[#0284c7]/40 transition flex items-center gap-1 font-semibold"
                >
                  <Award className="w-3 h-3 text-[#38bdf8]" />
                  Scope (PPA Finalist • 7 Artwork Pieces)
                </button>
                <button
                  onClick={() => onSelectProject('taxi-ltda')}
                  className="px-3 py-1 rounded-lg bg-[#ea580c]/20 text-[#fdba74] hover:bg-[#ea580c]/30 border border-[#ea580c]/40 transition flex items-center gap-1 font-semibold"
                >
                  <Sparkles className="w-3 h-3 text-[#fbbf24]" />
                  TAXI Magazine (LTDA • 3 Artwork Pieces)
                </button>
                <button
                  onClick={() =>
                    setEmbeddedPreview({
                      url: '/portfolio/dt_magazine_cover.png',
                      title: 'Dietetics Today AR Project Cover Archive',
                    })
                  }
                  className="px-3 py-1 rounded-lg bg-[#080d1a] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition flex items-center gap-1"
                >
                  <Monitor className="w-3 h-3 text-[#dfb15b]" />
                  Dietetics Today AR Cover
                </button>
                <a
                  href="https://youtube.com/shorts/FWwvsqd4Gcg?si=779uiQqzg0WxBYoi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 rounded-lg bg-red-950/40 hover:bg-red-900/50 text-red-300 hover:text-white border border-red-800/60 transition flex items-center gap-1 font-semibold"
                >
                  <ExternalLink className="w-3 h-3 text-red-400" />
                  YouTube AR Video Demo
                </a>
              </div>
            </div>

            {/* Role 9 */}
            <div className="relative pl-6 border-l-2 border-[#dfb15b]/40 print:border-neutral-400 pb-2">
              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#dfb15b] border-4 border-[#0c1427] print:border-white" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                <div>
                  <span className="text-sm sm:text-base font-bold text-white print:text-black">
                    Web &amp; Graphic Designer
                  </span>
                  <span className="text-xs text-[#dfb15b] print:text-neutral-700 font-semibold ml-2">
                    JT Holiday Group (Jetline) – London
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-400 print:text-neutral-600">
                  Nov 2014 – May 2015
                </span>
              </div>
              <p className="text-xs text-slate-300 print:text-neutral-800 leading-relaxed mb-3">
                Editing and reskinning commercial travel websites, responsive HTML email campaigns, UK National Press advertisements, multi-page travel brochures, and vector typography.
              </p>
            </div>
          </div>
        </div>

        {/* 5. Formal Education & Qualifications */}
        <div className="py-8">
          <h2 className="text-xs font-mono uppercase tracking-widest text-[#dfb15b] print:text-neutral-700 mb-4 flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            Education &amp; Formal Design Credentials
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CREATOR_PROFILE.education.map(edu => (
              <div
                key={edu.degree}
                className="p-4 rounded-2xl bg-[#080d1a]/70 print:bg-white border border-slate-800 print:border-neutral-300"
              >
                <div className="text-sm font-bold text-white print:text-black mb-1">{edu.degree}</div>
                <div className="text-xs text-[#dfb15b] print:text-neutral-700 font-semibold">
                  {edu.institution}
                </div>
                <div className="text-[11px] font-mono text-slate-400 print:text-neutral-600 mt-2">
                  {edu.period}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 print:text-neutral-600 mt-6 italic">
            * References and verified academic portfolios available upon request.
          </p>
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
    </div>
  );
};
