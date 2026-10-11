import React from 'react';
import { Clock, Copy, Trash2, X, Check, Users, MapPin, Shield } from 'lucide-react';
import { ScenarioReport } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: ScenarioReport[];
  onClearHistory: () => void;
  onCopyReport: (text: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  reports,
  onClearHistory,
  onCopyReport,
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (report: ScenarioReport) => {
    onCopyReport(report.formattedMessage);
    setCopiedId(report.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#0e1422] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-right max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-950/80 border border-blue-800/60 text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">آخر التقارير المحفوظة</h2>
              <p className="text-[11px] text-slate-400">سجل آخر 10 جلسات وسناريوهات موثقة</p>
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

        {/* Content list */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {reports.map((rep) => (
            <div
              key={rep.id}
              className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition flex items-center justify-between gap-3"
            >
              <button
                type="button"
                onClick={() => handleCopy(rep)}
                className="px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-300 hover:bg-blue-600/30 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0"
              >
                {copiedId === rep.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>تم النسخ!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ التقرير</span>
                  </>
                )}
              </button>

              <div className="text-right space-y-1">
                <div className="flex items-center justify-end gap-2">
                  <span className="text-xs font-bold text-white">{rep.eventType}</span>
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 font-mono">
                    {rep.sectorName}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500" /> {rep.location}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-500" /> {rep.attendingMembers.length} أفراد
                  </span>
                  <span>•</span>
                  <span className="font-mono text-slate-500">{rep.createdAt}</span>
                </div>
              </div>
            </div>
          ))}

          {reports.length === 0 && (
            <div className="p-12 text-center text-slate-500 text-xs">
              لا توجد تقارير محفوظة حتى الآن. ستظهر هنا السناريوهات التي تقوم بنسخها.
            </div>
          )}
        </div>

        {/* Footer */}
        {reports.length > 0 && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
            <button
              type="button"
              onClick={onClearHistory}
              className="text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>مسح السجل</span>
            </button>
            <span className="text-slate-500 font-mono text-[11px]">
              {reports.length} تقارير محفوظة
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
