import React from 'react';
import { Lock, ArrowLeft, Shield, Sparkles, Settings } from 'lucide-react';
import { BravaEmblem } from './Emblems';
import { Sector } from '../types';

interface SectorSelectViewProps {
  sectors: Sector[];
  onSelectSector: (sector: Sector) => void;
  customLogoUrl: string | null;
  onOpenSettings: () => void;
  serverName: string;
  serverSubtitle: string;
  sectorLogos?: { [key: string]: string | null };
  sectorStatus?: { [key: string]: boolean };
}

export const SectorSelectView: React.FC<SectorSelectViewProps> = ({
  sectors,
  onSelectSector,
  customLogoUrl,
  onOpenSettings,
  serverName,
  serverSubtitle,
  sectorLogos,
  sectorStatus,
}) => {
  return (
    <div className="min-h-screen text-inherit flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
      {/* Top Controls: Developer Settings Button */}
      <div className="absolute top-4 left-4 z-20">
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/70 text-slate-300 hover:text-white text-xs font-medium backdrop-blur transition cursor-pointer shadow-lg"
          title="الإعدادات وإعدادات المطور"
        >
          <Settings className="w-3.5 h-3.5 text-amber-400" />
          <span>الإعدادات والمظهر</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-lg bg-[#0e1422]/90 border border-slate-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative z-10 text-center">
        {/* Server Crest / Brava Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <BravaEmblem
              customLogoUrl={customLogoUrl}
              className="w-28 h-28 md:w-32 md:h-32 drop-shadow-[0_0_30px_rgba(245,158,11,0.4)]"
            />
            <div className="absolute -bottom-1 -right-1 bg-amber-500 p-1.5 rounded-full text-slate-950 shadow-md">
              <Shield className="w-4 h-4 font-bold" />
            </div>
          </div>

          <h1 className="text-2xl font-black mt-4 tracking-tight text-white">
            نظام تصوير السناريوهات
          </h1>
          <p className="text-xs font-mono font-bold tracking-widest text-amber-400 mt-1">
            {serverName.toUpperCase()} — {serverSubtitle.toUpperCase()}
          </p>
          <div className="h-0.5 w-20 bg-gradient-to-r from-transparent via-amber-500 to-transparent mt-3" />
        </div>

        {/* Sectors Grid */}
        <div className="space-y-3 mb-6">
          {sectors.map((sector) => {
            const isClickable = sectorStatus
              ? sectorStatus[sector.id] ?? sector.isActive
              : sector.isActive;

            return (
              <button
                key={sector.id}
                disabled={!isClickable}
                onClick={() => isClickable && onSelectSector(sector)}
                className={`w-full text-right p-4 rounded-xl border transition-all duration-200 flex items-center justify-between group ${
                  isClickable
                    ? 'bg-slate-900/90 border-blue-600/60 hover:border-blue-500 hover:bg-slate-800/90 shadow-md shadow-blue-950/40 cursor-pointer scale-[1.01]'
                    : 'bg-slate-950/50 border-slate-800/60 opacity-55 cursor-not-allowed hover:border-slate-800'
                }`}
              >
                {/* Left side badge & indicator */}
                <div className="flex items-center gap-2">
                  {isClickable ? (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-950/80 border border-blue-500/50 text-blue-300 text-[11px] font-bold">
                      <Sparkles className="w-3 h-3 text-blue-400 animate-pulse" />
                      مفعل
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-700/60 text-slate-400 text-[11px] font-medium">
                      <Lock className="w-3 h-3 text-slate-500" />
                      قريباً
                    </span>
                  )}
                  {isClickable && (
                    <ArrowLeft className="w-4 h-4 text-blue-400 group-hover:-translate-x-1 transition-transform" />
                  )}
                </div>

                {/* Right side sector info */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <span className="font-bold text-slate-100 text-sm group-hover:text-blue-300 transition-colors">
                        {sector.nameAr}
                      </span>
                      <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-800/70 text-slate-400 border border-slate-700/50">
                        {sector.code}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {sector.nameEn}
                    </div>
                  </div>
                  <div
                    className={`w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center font-bold text-xs font-mono border shrink-0 ${
                      isClickable
                        ? 'bg-blue-600/20 border-blue-500/60 text-blue-300'
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    {sectorLogos?.[sector.id] ? (
                      <img
                        src={sectorLogos[sector.id]!}
                        alt={sector.nameAr}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      sector.code
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Notice for unlisted sectors */}
        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 mb-6">
          قطاعك لا يظهر؟ تواصل مع رئاسة قطاعك بسيرفر برافا ليطلبوا الإضافة.
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800/60 text-[11px] text-slate-500 flex flex-col items-center gap-1 font-mono">
          <div>
            Made for <span className="text-amber-400 font-bold">{serverName}</span>
          </div>
          <div>All tactical rights reserved — Prava Ministry</div>
        </div>
      </div>
    </div>
  );
};
