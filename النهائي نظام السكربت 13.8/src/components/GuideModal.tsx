import React from 'react';
import { BookOpen, CheckCircle2, ShieldCheck, X, Camera, Users, Sparkles, Send } from 'lucide-react';
import { ACCEPTANCE_RULES } from '../data/initialData';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#0e1422] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 text-right max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-950/80 border border-blue-800/60 text-blue-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">دليل وشرح الاستخدام الرسمي</h2>
              <p className="text-[11px] text-slate-400">نظام توثيق السناريوهات — سيرفر برافا (Prava RP)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Steps Walkthrough */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-blue-400">خطوات توثيق السناريو:</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-2 text-white font-bold">
                <span className="w-5 h-5 rounded-md bg-blue-600/30 text-blue-400 flex items-center justify-center text-[11px] font-mono">1</span>
                <span>تحديث الفويس والبدء</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                ادخل على قطاع سوات، وتأكد من تواجد أفراد السناريو في الروم الصوتي بالديسكورد واضغط "ابدأ".
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-2 text-white font-bold">
                <span className="w-5 h-5 rounded-md bg-blue-600/30 text-blue-400 flex items-center justify-center text-[11px] font-mono">2</span>
                <span>فحص الصورة والآيديات</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                ارفع لقطة شاشة التجمع أو الصقها بالحافظة (Ctrl+V)؛ سيتعرف النظام تلقائياً على الآيديات ويطابقها مع أسماء الفويس.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-2 text-white font-bold">
                <span className="w-5 h-5 rounded-md bg-blue-600/30 text-blue-400 flex items-center justify-center text-[11px] font-mono">3</span>
                <span>تفاصيل الحدث والموقع</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                اختر نوع الحدث (بلاغ، تفتيش، تمشيط، مداهمة...). تظهر قوائم المواقع المصنفة أو مراحل التفتيش والتمشيط تلقائياً.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
              <div className="flex items-center gap-2 text-white font-bold">
                <span className="w-5 h-5 rounded-md bg-blue-600/30 text-blue-400 flex items-center justify-center text-[11px] font-mono">4</span>
                <span>النسخ والإرسال للديسكورد</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                انسخ الصورة والنص بضغطة زر وتوجه لروم الديسكورد، واستخدم Ctrl+V للصورة و Ctrl+Shift+V للنص المنسق مع المنشنات!
              </p>
            </div>
          </div>
        </div>

        {/* Official Rules Checklist */}
        <div className="p-4 rounded-xl bg-[#090d16] border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>شروط قبول واعتماد لقطة التوثيق:</span>
          </div>
          <ul className="space-y-1 text-xs text-slate-300">
            {ACCEPTANCE_RULES.map((rule) => (
              <li key={rule.id} className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>{rule.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 cursor-pointer"
          >
            فهمت، حسناً
          </button>
        </div>
      </div>
    </div>
  );
};
