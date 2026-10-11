import React, { useState } from 'react';
import pravaLogoImg from '../assets/images/prava_official_logo_1791140034987.jpg';

interface BravaEmblemProps {
  className?: string;
  customLogoUrl?: string | null;
}

export const BravaEmblem: React.FC<BravaEmblemProps> = ({
  className = 'w-16 h-16',
  customLogoUrl,
}) => {
  const [hasError, setHasError] = useState(false);

  // If user uploaded their exact original PRAVA LOG.png, prioritize it 100%
  const activeSrc = customLogoUrl || pravaLogoImg;

  if (!hasError && activeSrc) {
    return (
      <div className={`relative rounded-full overflow-hidden border-2 border-amber-500/80 shadow-xl shadow-amber-500/25 bg-slate-950 flex items-center justify-center shrink-0 ${className}`}>
        <img
          src={activeSrc}
          alt="Prava RP Official Logo"
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="brava_gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="50%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id="shield_stroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
      </defs>
      
      {/* Outer Glow Shield */}
      <path
        d="M60 6L98 22V56C98 84 60 108 60 108C60 108 22 84 22 56V22L60 6Z"
        fill="#0c1322"
        stroke="url(#shield_stroke)"
        strokeWidth="2.5"
      />
      
      {/* Inner Shield */}
      <path
        d="M60 14L90 26V54C90 77 60 97 60 97C60 97 30 77 30 54V26L60 14Z"
        fill="#0f172a"
        stroke="#1e293b"
        strokeWidth="1.5"
      />

      {/* Wings motif */}
      <path
        d="M40 45C45 40 54 38 60 44C66 38 75 40 80 45C72 48 68 56 60 62C52 56 48 48 40 45Z"
        fill="url(#brava_gold)"
        opacity="0.9"
      />

      {/* Palm & Swords / Star */}
      <circle cx="60" cy="52" r="5" fill="#f8fafc" />
      <path
        d="M60 30L62.5 37H70L64 41.5L66.5 48.5L60 44L53.5 48.5L56 41.5L50 37H57.5L60 30Z"
        fill="#fbbf24"
      />

      {/* Swords crossed */}
      <line x1="42" y1="42" x2="78" y2="78" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
      <line x1="78" y1="42" x2="42" y2="78" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />

      {/* Monogram PRAVA text curved base */}
      <text
        x="60"
        y="84"
        textAnchor="middle"
        fill="#fde68a"
        fontSize="8"
        fontWeight="900"
        letterSpacing="1.5"
        fontFamily="sans-serif"
      >
        PRAVA RP
      </text>
    </svg>
  );
};

export const SwatEmblem: React.FC<{ className?: string }> = ({ className = 'w-24 h-24' }) => (
  <svg
    viewBox="0 0 140 140"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <radialGradient id="swat_rim" cx="50%" cy="50%" r="50%">
        <stop offset="70%" stopColor="#1e293b" />
        <stop offset="95%" stopColor="#0f172a" />
        <stop offset="100%" stopColor="#3b82f6" />
      </radialGradient>
      <linearGradient id="metal" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e2e8f0" />
        <stop offset="50%" stopColor="#94a3b8" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
    </defs>

    {/* Outer Ring with notches */}
    <circle cx="70" cy="70" r="66" fill="#090d16" stroke="#2563eb" strokeWidth="2" />
    <circle cx="70" cy="70" r="62" fill="url(#swat_rim)" stroke="#334155" strokeWidth="1.5" />
    <circle cx="70" cy="70" r="56" fill="#070a10" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />

    {/* Circular text simulation */}
    <circle cx="70" cy="70" r="48" fill="#0b0f19" stroke="#3b82f6" strokeWidth="1" />

    {/* Tactical Star / Target */}
    <circle cx="70" cy="70" r="28" fill="#111827" stroke="#3b82f6" strokeWidth="1.5" />
    
    {/* Crosshairs */}
    <line x1="70" y1="36" x2="70" y2="104" stroke="#60a5fa" strokeWidth="1.2" strokeDasharray="2 4" />
    <line x1="36" y1="70" x2="104" y2="70" stroke="#60a5fa" strokeWidth="1.2" strokeDasharray="2 4" />

    {/* Central SWAT Eagle Crest */}
    <path
      d="M52 64C56 60 62 57 70 59C78 57 84 60 88 64C82 68 78 76 70 82C62 76 58 68 52 64Z"
      fill="url(#metal)"
    />

    {/* Text SWAT */}
    <text
      x="70"
      y="74"
      textAnchor="middle"
      fill="#ffffff"
      fontSize="12"
      fontWeight="900"
      letterSpacing="2"
      fontFamily="sans-serif"
    >
      SWAT
    </text>

    <text
      x="70"
      y="88"
      textAnchor="middle"
      fill="#93c5fd"
      fontSize="5.5"
      fontWeight="700"
      letterSpacing="1"
      fontFamily="sans-serif"
    >
      TACTICAL UNIT
    </text>

    {/* Small stars */}
    <circle cx="34" cy="70" r="2" fill="#3b82f6" />
    <circle cx="106" cy="70" r="2" fill="#3b82f6" />
  </svg>
);
