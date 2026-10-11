import React, { useState, useEffect } from 'react';
import {
  Siren,
  Handshake,
  Flame,
  ClipboardList,
  PartyPopper,
  Target,
  OctagonAlert,
  ShieldAlert,
  Search,
  Building,
  Train,
  Factory,
  MapPin,
  Clock,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  Plus,
  Users,
} from 'lucide-react';
import { EVENT_TYPES, LOCATIONS, DEFAULT_GANGS } from '../data/initialData';

interface EventStepViewProps {
  selectedEventType: string;
  onEventTypeChange: (type: string) => void;
  customEventType: string;
  onCustomEventTypeChange: (val: string) => void;
  subStage: string;
  onSubStageChange: (stage: string) => void;
  selectedLocation: string;
  onLocationChange: (loc: string) => void;
  gridNumber: string;
  onGridNumberChange: (grid: string) => void;
  dateTime: string;
  onDateTimeChange: (dt: string) => void;
  targetGang?: string;
  onTargetGangChange?: (gang: string) => void;
  gangsList?: string[];
  onAddGang?: (gang: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const EventStepView: React.FC<EventStepViewProps> = ({
  selectedEventType,
  onEventTypeChange,
  customEventType,
  onCustomEventTypeChange,
  subStage,
  onSubStageChange,
  selectedLocation,
  onLocationChange,
  gridNumber,
  onGridNumberChange,
  dateTime,
  onDateTimeChange,
  targetGang = '',
  onTargetGangChange,
  gangsList = DEFAULT_GANGS,
  onAddGang,
  onNext,
  onBack,
}) => {
  const [locationSearch, setLocationSearch] = useState('');
  const [newGangInput, setNewGangInput] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({
    البنوك: true,
    المصانع: true,
    المترو: true,
    'مواقع أخرى': true,
  });

  const getEventIcon = (iconName: string) => {
    switch (iconName) {
      case 'Siren':
        return <Siren className="w-6 h-6 text-red-400" />;
      case 'Handshake':
        return <Handshake className="w-6 h-6 text-amber-400" />;
      case 'Flame':
        return <Flame className="w-6 h-6 text-orange-400" />;
      case 'ClipboardList':
        return <ClipboardList className="w-6 h-6 text-blue-400" />;
      case 'PartyPopper':
        return <PartyPopper className="w-6 h-6 text-pink-400" />;
      case 'Target':
        return <Target className="w-6 h-6 text-purple-400" />;
      case 'OctagonAlert':
        return <OctagonAlert className="w-6 h-6 text-red-500" />;
      case 'ShieldAlert':
        return <ShieldAlert className="w-6 h-6 text-cyan-400" />;
      default:
        return <MapPin className="w-6 h-6 text-blue-400" />;
    }
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  const setNowTime = () => {
    const now = new Date();
    const formatted = now.toISOString().slice(0, 16);
    onDateTimeChange(formatted);
  };

  // Conditions based on user request:
  // 1. التوزيع بدون موقع الحدث
  const isBriefing = selectedEventType === 'briefing';
  // 2. الفعاليه بدون موقع الحدث
  const isEvent = selectedEventType === 'event';
  // 3. التمشيط بدون موقع الحدث (مع بداية/نهاية)
  const isSweep = selectedEventType === 'sweep';
  // 4. التدريب يكتبه كتابه مافي خيارات
  const isTraining = selectedEventType === 'training';
  // 5. التفتيش موقع الحدث بدون تخير يكتب مربع التفتيش فقط (مع بداية/نهاية)
  const isCheckpoint = selectedEventType === 'checkpoint';
  // 6. المداهمة — اختيار وإضافة العصابة
  const isRaid = selectedEventType === 'raid';
  // 7. السرقة والبلاغ والمساندة — تظهر المناطق الـ 21 المصنفة
  const isRobbery = selectedEventType === 'robbery';
  const hasCategorizedLocations = isRobbery || selectedEventType === 'callout' || selectedEventType === 'backup';

  // Automatically adjust location defaults when event changes
  useEffect(() => {
    if (isBriefing) {
      onLocationChange('بدون موقع (توزيع مهام)');
    } else if (isEvent) {
      onLocationChange('بدون موقع (فعالية عامة)');
    } else if (isSweep) {
      onLocationChange('تمشيط أمني ميداني');
    } else if (isCheckpoint && (selectedLocation.includes('البنك') || selectedLocation.includes('بدون'))) {
      onLocationChange('مربع 101');
    } else if (isTraining && (selectedLocation.includes('البنك') || selectedLocation.includes('بدون'))) {
      onLocationChange('ميدان الرماية التكتيكي');
    } else if (isRaid) {
      onLocationChange(targetGang ? `مقر عصابة ${targetGang}` : 'مقر العصابة');
    } else if (hasCategorizedLocations && (selectedLocation.includes('مربع') || selectedLocation.includes('بدون') || selectedLocation.includes('مقر'))) {
      onLocationChange('البنك المركزي');
    }
  }, [selectedEventType]);

  const filteredLocations = LOCATIONS.filter((l) =>
    l.name.toLowerCase().includes(locationSearch.toLowerCase())
  );

  const categories = ['البنوك', 'المصانع', 'المترو', 'مواقع أخرى'] as const;

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-6">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <span className="text-xs font-mono font-bold text-blue-400">الخطوة 3 / 4</span>
          <h2 className="text-xl font-black text-white mt-0.5">الحدث والموقع</h2>
        </div>
        <div className="text-xs text-slate-400">
          حدد نوع ومرحلة وموقع الحدث وفق تعليمات القطاع
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Right Column: 01 ما نوع الحدث؟ (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-[#0e1422] border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <span className="text-xs font-bold text-slate-200">01 ما نوع الحدث؟</span>
              <span className="text-[11px] text-slate-400">اختر من القائمة أدناه أو اكتب نوعاً مخصصاً</span>
            </div>

            {/* Grid of Event Types */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {EVENT_TYPES.map((ev) => {
                const isSelected = selectedEventType === ev.id && !customEventType.trim();

                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => {
                      onEventTypeChange(ev.id);
                      onCustomEventTypeChange('');
                      if (ev.id === 'checkpoint') {
                        onSubStageChange('بداية التفتيش');
                      } else if (ev.id === 'sweep') {
                        onSubStageChange('بداية التمشيط');
                      } else {
                        onSubStageChange('');
                      }
                    }}
                    className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 shadow-md shadow-blue-950/60 scale-[1.02]'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 shadow-inner">
                      {getEventIcon(ev.iconName)}
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        isSelected ? 'text-white' : 'text-slate-300'
                      }`}
                    >
                      {ev.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Sub-Stage Options (for Checkpoint & Sweep) */}
            {isCheckpoint && (
              <div className="p-4 rounded-xl bg-slate-950/80 border border-blue-900/40 space-y-2.5 animate-fadeIn">
                <span className="text-xs font-bold text-blue-400 block">
                  مرحلة التفتيش:
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => onSubStageChange('بداية التفتيش')}
                    className={`py-3 px-4 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      subStage === 'بداية التفتيش' || !subStage
                        ? 'bg-blue-600 text-white border-blue-400 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>بداية التفتيش</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSubStageChange('نهاية التفتيش')}
                    className={`py-3 px-4 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      subStage === 'نهاية التفتيش'
                        ? 'bg-blue-600 text-white border-blue-400 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    <span>نهاية التفتيش</span>
                  </button>
                </div>
              </div>
            )}

            {isSweep && (
              <div className="p-4 rounded-xl bg-slate-950/80 border border-blue-900/40 space-y-2.5 animate-fadeIn">
                <span className="text-xs font-bold text-blue-400 block">
                  مرحلة التمشيط:
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => onSubStageChange('بداية التمشيط')}
                    className={`py-3 px-4 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      subStage === 'بداية التمشيط' || !subStage
                        ? 'bg-blue-600 text-white border-blue-400 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span>بداية التمشيط</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSubStageChange('نهاية التمشيط')}
                    className={`py-3 px-4 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                      subStage === 'نهاية التمشيط'
                        ? 'bg-blue-600 text-white border-blue-400 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    <span>نهاية التمشيط</span>
                  </button>
                </div>
              </div>
            )}

            {/* Custom Event Input */}
            <div className="pt-2">
              <label className="text-xs text-slate-400 block mb-1">نوع آخر (مخصص):</label>
              <input
                type="text"
                value={customEventType}
                onChange={(e) => {
                  onCustomEventTypeChange(e.target.value);
                  if (e.target.value.trim()) {
                    onSubStageChange('');
                  }
                }}
                placeholder="اكتب هنا نوعاً غير موجود في الخيارات — الكتابة تلغي الاختيار أعلاه"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs placeholder:text-slate-500 outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* Date & Time Picker */}
            <div className="pt-3 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>تاريخ ووقت الحدث (اختياري):</span>
                </label>
                <span className="text-[11px] text-slate-500">إن ترك فارغاً يُستخدم الوقت الحالي</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="datetime-local"
                  value={dateTime}
                  onChange={(e) => onDateTimeChange(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={setNowTime}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-bold border border-slate-700 transition cursor-pointer"
                >
                  الآن
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Left Column: 03 أين وقع الحدث؟ (5 cols) Dynamic based on selected event */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-[#0e1422] border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <span className="text-xs font-bold text-slate-200">03 موقع الحدث</span>
              <span className="text-[11px] text-blue-400 font-bold truncate max-w-[170px]">
                {selectedLocation}
              </span>
            </div>

            {/* Case 1: التوزيع بدون موقع الحدث */}
            {isBriefing && (
              <div className="p-6 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-blue-950/80 border border-blue-800 text-blue-400 flex items-center justify-center mx-auto">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-200">توزيع مهام ميداني</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  هذا الحدث لا يتطلب موقعاً، وسيتم اعتماده كـ <span className="text-blue-400 font-bold">توزيع مهام</span> بدون خيارات مواقع.
                </p>
              </div>
            )}

            {/* Case 2: الفعاليه بدون موقع الحدث */}
            {isEvent && (
              <div className="p-6 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-pink-950/80 border border-pink-800 text-pink-400 flex items-center justify-center mx-auto">
                  <PartyPopper className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-200">فعالية عامة</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  هذا الحدث لا يتطلب موقعاً، وسيتم اعتماده كـ <span className="text-pink-400 font-bold">فعالية عامة</span> بدون خيارات مواقع.
                </p>
              </div>
            )}

            {/* Case 3: التمشيط بدون موقع الحدث */}
            {isSweep && (
              <div className="p-6 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-400 flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-200">تمشيط أمني ميداني</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  التمشيط بدون موقع، يتم الاعتماد فقط على مرحلة التمشيط (<span className="text-cyan-400 font-bold">{subStage || 'بداية التمشيط'}</span>).
                </p>
              </div>
            )}

            {/* Case 4: التدريب يكتبه كتابه مافي خيارات */}
            {isTraining && (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-900/50 text-[11px] text-blue-300 flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0 text-blue-400" />
                  <span>اكتب موقع أو نوع التدريب يدوياً (بدون خيارات مسبقة):</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    موقع التدريب (كتابة يدوية):
                  </label>
                  <input
                    type="text"
                    value={selectedLocation}
                    onChange={(e) => onLocationChange(e.target.value)}
                    placeholder="مثال: ميدان الرماية التكتيكي، مهبط الطائرات، التدريب البحري..."
                    className="w-full px-3.5 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>
            )}

            {/* Case 5: التفتيش موقع الحدث بدون تخير يكتب مربع التفتيش فقط */}
            {isCheckpoint && (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-900/50 text-[11px] text-blue-300 flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0 text-blue-400" />
                  <span>اكتب مربع التفتيش فقط بدون تخيير:</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    مربع التفتيش:
                  </label>
                  <input
                    type="text"
                    value={selectedLocation}
                    onChange={(e) => onLocationChange(e.target.value)}
                    placeholder="مثال: مربع 304، مربع 512، مربع 108..."
                    className="w-full px-3.5 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono text-center outline-none focus:border-blue-500 text-sm font-bold"
                  />
                </div>
              </div>
            )}

            {/* Case 6: المداهمة — اختيار وإضافة العصابات (CL, VS, RELOAD, BLD, ARCANE, GROOVE) */}
            {isRaid && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-orange-950/40 border border-orange-800/60 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-300">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span>تحديد العصابة المستهدفة بالمداهمة:</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    اختر العصابة من القائمة أدناه أو اكتب عصابة جديدة لإضافتها للتقرير:
                  </p>
                </div>

                {/* Preset Gangs Grid */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-orange-400" />
                      <span>العصابات المسجلة:</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{gangsList.length} عصابات</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {gangsList.map((g) => {
                      const isSelected = targetGang === g;
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => {
                            onTargetGangChange?.(g);
                            onLocationChange(`مقر عصابة ${g}`);
                          }}
                          className={`py-3 px-3 rounded-xl border text-xs font-black transition flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-orange-600/30 border-orange-500 text-orange-200 shadow-md shadow-orange-950/60 scale-[1.02]'
                              : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
                          }`}
                        >
                          <span className="tracking-wider">{g}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-orange-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Add New Gang Input */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <label className="text-[11px] font-bold text-slate-300 block">
                    إضافة عصابة جديدة للمداهمة:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newGangInput}
                      onChange={(e) => setNewGangInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const clean = newGangInput.trim().toUpperCase();
                          if (clean) {
                            onAddGang?.(clean);
                            onTargetGangChange?.(clean);
                            onLocationChange(`مقر عصابة ${clean}`);
                            setNewGangInput('');
                          }
                        }
                      }}
                      placeholder="اسم العصابة (مثال: BALLAS, VAGOS...)"
                      className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs outline-none focus:border-orange-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const clean = newGangInput.trim().toUpperCase();
                        if (clean) {
                          onAddGang?.(clean);
                          onTargetGangChange?.(clean);
                          onLocationChange(`مقر عصابة ${clean}`);
                          setNewGangInput('');
                        }
                      }}
                      className="px-3 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة</span>
                    </button>
                  </div>
                </div>

                {/* Raid Location Input / Override */}
                <div className="pt-2 border-t border-slate-800/80">
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    موقع / مقر المداهمة:
                  </label>
                  <input
                    type="text"
                    value={selectedLocation}
                    onChange={(e) => onLocationChange(e.target.value)}
                    placeholder="مقر العصابة أو المنطقة..."
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            )}

            {/* Case 7: السرقة والبلاغ والمساندة - تطلع السرقات الـ 21 والمناطق المصنفة */}
            {hasCategorizedLocations && (
              <div className="space-y-3">
                {isRobbery && (
                  <div className="p-2.5 rounded-lg bg-blue-950/40 border border-blue-900/50 text-[11px] text-blue-300 flex items-center justify-between">
                    <span>قائمة السرقات المعتمدة (21 موقعاً):</span>
                    <span className="font-mono font-bold text-blue-400">21 موقع</span>
                  </div>
                )}

                {/* Location Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={selectedLocation}
                    onChange={(e) => {
                      onLocationChange(e.target.value);
                      setLocationSearch(e.target.value);
                    }}
                    placeholder="ابحث عن سرقة أو موقع... أو اكتب موقعاً غير موجود"
                    className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs placeholder:text-slate-500 outline-none focus:border-blue-500 transition"
                  />
                </div>

                {/* Categorized Locations Accordion */}
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {categories.map((cat) => {
                    const catItems = filteredLocations.filter((l) => l.category === cat);
                    if (catItems.length === 0) return null;
                    const isExpanded = expandedCategories[cat] || locationSearch.trim() !== '';

                    return (
                      <div key={cat} className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                        <button
                          type="button"
                          onClick={() => toggleCategory(cat)}
                          className="w-full p-2.5 bg-slate-900/70 hover:bg-slate-900 flex items-center justify-between text-xs font-bold text-slate-200 transition cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            {cat === 'البنوك' && <Building className="w-3.5 h-3.5 text-amber-400" />}
                            {cat === 'المصانع' && <Factory className="w-3.5 h-3.5 text-orange-400" />}
                            {cat === 'المترو' && <Train className="w-3.5 h-3.5 text-blue-400" />}
                            {cat === 'مواقع أخرى' && <MapPin className="w-3.5 h-3.5 text-purple-400" />}
                            <span>{cat === 'مواقع أخرى' ? 'سرقات أخرى ومواقع' : cat}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 font-mono">
                              {catItems.length}
                            </span>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="p-2 space-y-1 bg-slate-950/60 border-t border-slate-800">
                            {catItems.map((loc) => {
                              const isPicked = selectedLocation === loc.name;

                              return (
                                <button
                                  key={loc.id}
                                  type="button"
                                  onClick={() => onLocationChange(loc.name)}
                                  className={`w-full text-right p-2 rounded-lg text-xs transition cursor-pointer flex items-center justify-between ${
                                    isPicked
                                      ? 'bg-blue-600/20 border border-blue-500/70 text-blue-200 font-bold'
                                      : 'hover:bg-slate-900 text-slate-300'
                                  }`}
                                >
                                  <span>{loc.name}</span>
                                  {isPicked && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Actions Bar */}
      <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700 transition cursor-pointer"
        >
          ← الصورة والأفراد
        </button>

        <button
          type="button"
          onClick={onNext}
          className="px-7 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition cursor-pointer"
        >
          <span>إنشاء التقرير</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
};
