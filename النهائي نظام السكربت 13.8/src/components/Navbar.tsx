import React from 'react';
import { Shield, BookOpen, Clock, Layers, Users, Settings } from 'lucide-react';
import { BravaEmblem } from './Emblems';
import { Sector } from '../types';

interface NavbarProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  selectedSector: Sector | null;
  onSelectSectorClick: () => void;
  onOpenGuide: () => void;
  onOpenHistory: () => void;
  attendanceCount: number;
  totalVoiceCount: number;
  historyCount: number;
  customLogoUrl?: string | null;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentStep,
  onStepChange,
  selectedSector,
  onSelectSectorClick,
  onOpenGuide,
  onOpenHistory,
  attendanceCount,
  totalVoiceCount,
  historyCount,
  customLogoUrl,
  onOpenSettings,
}) => {
  const steps = [
    { num: 1, title: 'البداية', sub: 'تحديث قوائم الموظفين' },
    { num: 2, title: 'الصورة والأفراد', sub: 'رفع + تدقيق' },
    { num: 3, title: 'الحدث والموقع', sub: 'النوع + الموقع + الوقت' },
    { num: 4, title: 'التقرير الجاهز', sub: 'نسخ وإرسال' },
  ];

  return (
    <header className="bg-[#0e1422]/95 backdrop-blur border-b border-slate-800/80 sticky top-0 z-40 transition-all">
      {/* Top Banner Zone */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left Actions & Quick Links */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold transition cursor-pointer"
            title="إعدادات المظهر وإعدادات المطور"
          >
            <Settings className="w-3.5 h-3.5 text-amber-400" />
            <span>الإعدادات والمظهر</span>
          </button>

          <button
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-950/40 border border-blue-800/50 hover:bg-blue-900/50 text-blue-300 text-xs font-medium transition cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span>شرح الاستخدام</span>
          </button>

          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/60 hover:bg-slate-800 text-slate-300 text-xs font-medium transition cursor-pointer relative"
          >
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>آخر التقارير</span>
            {historyCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                {historyCount}
              </span>
            )}
          </button>

          <button
            onClick={onSelectSectorClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/60 hover:bg-slate-800 text-slate-300 text-xs font-medium transition cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>تغيير القطاع</span>
          </button>
        </div>

        {/* Center / Sector Wordmark and Breadcrumb */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="flex items-center justify-end gap-2 text-xs font-semibold tracking-wider text-blue-400 font-mono">
              <span>PRAVA RP</span>
              <span className="text-slate-600">/</span>
              <span>SCENARIO TEMPLATE GENERATOR</span>
            </div>
            <div className="flex items-center justify-end gap-1.5 text-slate-300 text-xs mt-0.5">
              <span className="font-bold text-slate-100">{selectedSector?.nameEn || 'Special Weapons and Tactics'}</span>
              <span className="text-slate-500">—</span>
              <span className="text-slate-400">قسم التوثيق — منشئ تقارير الأحداث</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-950 border border-amber-500/60 flex items-center justify-center p-0.5 shadow-md shrink-0">
            <BravaEmblem customLogoUrl={customLogoUrl} className="w-full h-full" />
          </div>
        </div>
      </div>

      {/* Stepper & Counter Bar */}
      <div className="border-t border-slate-800/60 bg-[#090d16]/70">
        <div className="max-w-7xl mx-auto px-4 py-2 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Quick Realtime Stats */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-900/70 border border-slate-800 text-xs">
              <span className="text-slate-400">الحضور المسجلون:</span>
              <span className="font-mono font-bold text-blue-400 text-sm tabular-nums">
                {attendanceCount}
              </span>
              <span className="text-slate-500 text-[11px]">شخصاً بالقائمة</span>
            </div>

            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-900/70 border border-slate-800 text-xs">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">المتواجدون بالديسكورد:</span>
              <span className="font-mono font-bold text-emerald-400 text-sm tabular-nums">
                {totalVoiceCount}
              </span>
              <span className="text-emerald-500/80 text-[11px]">في الروم الصوتي</span>
            </div>
          </div>

          {/* Stepper Navigation */}
          <nav className="flex items-center gap-1 sm:gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {steps.map((s) => {
              const isActive = currentStep === s.num;
              const isPast = currentStep > s.num;
              return (
                <button
                  key={s.num}
                  onClick={() => onStepChange(s.num)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-right transition cursor-pointer whitespace-nowrap border ${
                    isActive
                      ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm shadow-blue-500/20'
                      : isPast
                      ? 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      : 'bg-transparent border-transparent text-slate-500 hover:text-slate-400'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono font-bold ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : isPast
                        ? 'bg-slate-800 text-blue-300 border border-slate-700'
                        : 'bg-slate-900 text-slate-600 border border-slate-800'
                    }`}
                  >
                    {s.num}
                  </span>
                  <div>
                    <div className="text-xs font-bold leading-tight">{s.title}</div>
                    <div className="text-[10px] text-slate-400 hidden lg:block leading-none mt-0.5">
                      {s.sub}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
