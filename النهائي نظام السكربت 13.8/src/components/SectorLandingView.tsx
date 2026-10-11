import React from 'react';
import { ArrowLeft, CheckCircle2, ShieldCheck, Sparkles, FileText, Users } from 'lucide-react';
import { SwatEmblem } from './Emblems';
import { Sector } from '../types';

interface SectorLandingViewProps {
  sector: Sector;
  onStart: () => void;
  voiceCount: number;
  customLogoUrl?: string | null;
}

export const SectorLandingView: React.FC<SectorLandingViewProps> = ({
  sector,
  onStart,
  voiceCount,
  customLogoUrl,
}) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col items-center text-center">
      {/* Central Tactical Crest */}
      <div className="relative mb-6 group">
        <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl group-hover:bg-blue-500/30 transition-all duration-500" />
        <div className="relative p-2 rounded-full border border-blue-500/30 bg-[#0b0f19] shadow-2xl overflow-hidden w-36 h-36 flex items-center justify-center">
          {customLogoUrl ? (
            <img
              src={customLogoUrl}
              alt={sector.nameAr}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <SwatEmblem className="w-32 h-32 md:w-36 md:h-36 drop-shadow-[0_0_25px_rgba(37,99,235,0.4)]" />
          )}
        </div>
      </div>

      {/* Main Title & Description */}
      <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
        منشئ تقارير الأحداث
      </h1>
      <p className="text-sm font-mono text-blue-400 font-bold mt-1 tracking-wider">
        PRAVA RP — {sector.nameEn.toUpperCase()}
      </p>

      <p className="max-w-xl text-slate-300 text-sm md:text-base mt-3 leading-relaxed">
        ارفع صورة التجمع، دقق الأسماء، حدد تفاصيل الحدث، واحصل على رسالة ديسكورد جاهزة للنسخ بالقالب الرسمي مع مطابقة ومنشنات أفراد الفويس تلقائياً.
      </p>

      {/* Primary Action Button: "ابدأ" */}
      <div className="mt-8 flex flex-col items-center gap-3 w-full max-w-xs">
        <button
          onClick={onStart}
          className="w-full py-3.5 px-8 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold text-base shadow-lg shadow-blue-600/30 flex items-center justify-center gap-3 transition-all cursor-pointer group"
        >
          <span>ابدأ الآن</span>
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1.5 transition-transform" />
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>الروم الصوتي جاهز: <span className="text-white font-bold font-mono">{voiceCount}</span> عضواً بانتظار المطابقة</span>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl mt-12 text-right">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-950/60 border border-blue-800/50 text-blue-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100">فحص الآيديات في الصورة</h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-normal">
              التعرف التلقائي على أرقام الآيديات فوق الرؤوس ومطابقتها مع أرقام اللعبة في الروم الصوتي.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-950/60 border border-blue-800/50 text-blue-400 shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100">منشنات ديسكورد حقيقية</h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-normal">
              توليد منشنات المستخدمين الحاضرين تلقائياً لإشعار كافة أفراد السناريو في روم التوثيق.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-950/60 border border-blue-800/50 text-blue-400 shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100">نسخ موحد للصورة والنص</h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-normal">
              زر واحد ينسخ الصورة والنص ويفتح شات الديسكورد مباشرة مع دعم اختصارات اللصق السريعة.
            </p>
          </div>
        </div>
      </div>

      {/* Changelog & Updates Card */}
      <div className="w-full max-w-3xl mt-8 p-4 rounded-xl bg-[#090d16]/80 border border-slate-800/80 text-right">
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-2 mb-3">
          <span className="text-xs font-bold text-slate-200">سجل التحديثات وإصدار النظام</span>
          <span className="px-2 py-0.5 rounded bg-blue-950/80 border border-blue-800/60 text-blue-300 text-[10px] font-mono font-bold">
            v12.0
          </span>
        </div>
        <div className="space-y-2 text-xs text-slate-300 font-sans">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>حفظ الجلسة الحالية وحفظ آخر 10 سناريوهات في الذاكرة المحلية (LocalStorage).</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>مطابقة فورية لمنشنات الديسكورد (<code className="font-mono text-blue-300 text-[11px]">&lt;@UserID&gt;</code>) بناءً على الرتبة والكود.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>دعم الفحص التفاعلي للصورة (تكبير الماوس والسحب وتحديد آيدي جديد يدوياً).</span>
          </div>
        </div>
      </div>
    </div>
  );
};
