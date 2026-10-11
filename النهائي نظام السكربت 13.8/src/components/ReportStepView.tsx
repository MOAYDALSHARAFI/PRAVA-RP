import React, { useState } from 'react';
import {
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  FileText,
  AlertCircle,
  Settings,
  Image as ImageIcon,
  Download,
  Share2,
} from 'lucide-react';
import { Sector, VoiceMember, ScenarioReport, RoleCategoriesConfig } from '../types';
import { DEFAULT_ROLE_CATEGORIES } from '../data/initialData';
import { classifyMemberRole } from '../utils/discordVoiceSync';

interface ReportStepViewProps {
  sector: Sector;
  eventType: string;
  subStage?: string;
  location: string;
  gridNumber?: string;
  dateTime: string;
  screenshotUrl: string | null;
  attendingMembers: VoiceMember[];
  onBack: () => void;
  onReset: () => void;
  onSaveReport: (report: Partial<ScenarioReport>) => void;
  messageTemplate?: string;
  sectorTemplates?: Record<string, string>;
  serverName?: string;
  defaultDiscordChannel?: string;
  targetGang?: string;
  roleCategoriesConfig?: RoleCategoriesConfig;
}

// Convert any image (data URL or remote URL) to PNG Blob for clipboard compatibility
async function convertToPngBlob(imgSource: string): Promise<Blob | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/png');
      } catch (e) {
        console.warn('Canvas export failed:', e);
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = imgSource;
  });
}

export const ReportStepView: React.FC<ReportStepViewProps> = ({
  sector,
  eventType,
  subStage,
  location,
  gridNumber,
  dateTime,
  screenshotUrl,
  targetGang,
  attendingMembers,
  onBack,
  onReset,
  onSaveReport,
  messageTemplate,
  sectorTemplates,
  serverName,
  defaultDiscordChannel,
  roleCategoriesConfig,
}) => {
  const [copySuccessText, setCopySuccessText] = useState(false);
  const [copySuccessImage, setCopySuccessImage] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);
  const [discordChannelUrl, setDiscordChannelUrl] = useState(
    defaultDiscordChannel || 'https://discord.com/app'
  );

  // Format mentions string: Only attending members who are in voice
  const mentionsString = attendingMembers
    .filter((m) => m.discordUserId && m.discordUserId.trim())
    .map((m) => `<@${m.discordUserId}>`)
    .join(' ');

  // Get officer in charge (highest rank / leader / officer or first member)
  const officerInCharge =
    attendingMembers.find((m) => m.roleCategory === 'leader')?.discordName ||
    attendingMembers.find((m) => m.roleCategory === 'officer')?.discordName ||
    attendingMembers[0]?.discordName ||
    'الضابط المناوب';

  // Format localized date
  const formattedDate = dateTime
    ? new Date(dateTime).toLocaleString('ar-SA', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : new Date().toLocaleString('ar-SA', { dateStyle: 'medium', timeStyle: 'short' });

  // Event translation
  const eventLabels: Record<string, string> = {
    robbery: 'سرقة',
    callout: 'بلاغ',
    backup: 'مساندة',
    raid: 'مداهمة',
    briefing: 'توزيع مهام',
    event: 'فعالية',
    training: 'تدريب',
    checkpoint: 'نقطة تفتيش',
    sweep: 'تمشيط',
  };
  const formattedEvent = eventLabels[eventType] || eventType;

  // Format Location Line
  const isNoLocationEvent = ['briefing', 'event', 'training'].includes(eventType);
  const locationLine = isNoLocationEvent
    ? ''
    : eventType.includes('تفتيش')
    ? `📍 **مربع التفتيش:** ${location || 'مربع غير محدد'}\n`
    : targetGang && eventType.includes('مداهمة')
    ? `📍 **مقر المداهمة:** ${location || `مقر عصابة ${targetGang}`}\n🎯 **العصابة:** ${targetGang}\n`
    : `📍 **الموقع:** ${gridNumber ? `${location} — ${gridNumber}` : location || 'الموقع العام'}\n`;

  const formattedLocation = isNoLocationEvent
    ? 'بدون موقع'
    : eventType.includes('تفتيش')
    ? `مربع ${location}`
    : gridNumber
    ? `${location} — ${gridNumber}`
    : location || 'الموقع العام';

  // Format members list string
  const membersListText = attendingMembers
    .map(
      (m) =>
        `• [${m.rank}] ${m.discordName} (الكود: ${m.militaryCode} | أيدي اللعبة: ${m.gameId})`
    )
    .join('\n');

  // Format strictly categorized role lists: Leaders (القادة), Officers (الضباط), Soldiers (الأفراد)
  const cfg = roleCategoriesConfig || DEFAULT_ROLE_CATEGORIES;

  const getMemberCategory = (m: VoiceMember): 'leader' | 'officer' | 'soldier' => {
    if (m.discordRoles && m.discordRoles.length > 0) {
      return classifyMemberRole(m.rank || m.discordName, cfg, m.discordRoles).roleCategory;
    }
    if (m.roleCategory) return m.roleCategory;
    return classifyMemberRole(m.rank || m.discordName, cfg).roleCategory;
  };

  // 1. Leaders (القادة)
  const leaders = attendingMembers.filter((m) => getMemberCategory(m) === 'leader');

  // 2. Officers (الضباط): Strictly NOT in leaders
  const officers = attendingMembers.filter(
    (m) => getMemberCategory(m) === 'officer' && !leaders.some((l) => l.id === m.id)
  );

  // 3. Soldiers / Enlisted (الأفراد): All other participating members (strictly never duplicates with leaders or officers)
  const soldiers = attendingMembers.filter(
    (m) => !leaders.some((l) => l.id === m.id) && !officers.some((o) => o.id === m.id)
  );

  const leadersListText =
    leaders.length > 0
      ? leaders
          .map((m) => `• [${m.rank}] ${m.discordName} (الكود: ${m.militaryCode} | أيدي: ${m.gameId})`)
          .join('\n')
      : '• لا يوجد';

  const officersListText =
    officers.length > 0
      ? officers
          .map((m) => `• [${m.rank}] ${m.discordName} (الكود: ${m.militaryCode} | أيدي: ${m.gameId})`)
          .join('\n')
      : '• لا يوجد';

  const soldiersListText =
    soldiers.length > 0
      ? soldiers
          .map((m) => `• [${m.rank}] ${m.discordName} (الكود: ${m.militaryCode} | أيدي: ${m.gameId})`)
          .join('\n')
      : '• لا يوجد';

  // Build the official Discord Markdown message using Developer's custom template
  const defaultTemplateFallback = `\`\`\`
**【 سيرفر {serverName} — {sectorName} ({sectorCode}) 】**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 **نوع الحدث:** {event} {stage}
{locationLine}⏰ **التاريخ والوقت:** {dateTime}
👤 **مسؤول التوثيق:** {officer}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👑 **قائمة القادة ({leadersCount}):**
{leadersList}

⭐️ **قائمة الضباط ({officersCount}):**
{officersList}

⚡ **قائمة الأفراد ({soldiersCount}):**
{soldiersList}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👥 **إجمالي الحضور:** {attendanceCount}
📷 **التوثيق:** [الصورة مرفقة مع الرسالة]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#{serverCode} #{sectorCode} #Documentation
\`\`\`

**منشنات أفراد السناريو:**
{mentions}`;

  const baseTemplate =
    (sectorTemplates && sectorTemplates[sector.id]) ||
    messageTemplate ||
    defaultTemplateFallback;

  const populatedMessage = baseTemplate
    .replaceAll('{serverName}', serverName || 'برافا')
    .replaceAll('{serverCode}', 'PRAVA_RP')
    .replaceAll('{sectorName}', sector.nameAr)
    .replaceAll('{sectorCode}', sector.code)
    .replaceAll('{event}', formattedEvent)
    .replaceAll('{stage}', subStage ? `(${subStage})` : '')
    .replaceAll('{locationLine}', locationLine)
    .replaceAll('{location}', formattedLocation)
    .replaceAll('{dateTime}', formattedDate)
    .replaceAll('{officer}', officerInCharge)
    .replaceAll('{attendanceCount}', String(attendingMembers.length))
    .replaceAll('{leadersCount}', String(leaders.length))
    .replaceAll('{officersCount}', String(officers.length))
    .replaceAll('{soldiersCount}', String(soldiers.length))
    .replaceAll('{membersList}', membersListText)
    .replaceAll('{leadersList}', leadersListText)
    .replaceAll('{officersList}', officersListText)
    .replaceAll('{soldiersList}', soldiersListText)
    .replaceAll('{gang}', targetGang || '')
    .replaceAll('{targetGang}', targetGang || '')
    .replaceAll('{mentions}', mentionsString);

  const [messageContent, setMessageContent] = useState(populatedMessage);

  // 1. Copy text only to clipboard
  const handleCopyTextOnly = async () => {
    try {
      await navigator.clipboard.writeText(messageContent);
      setCopySuccessText(true);
      setTimeout(() => setCopySuccessText(false), 2500);
      onSaveReport({
        eventType: formattedEvent,
        location: formattedLocation,
        dateTime: formattedDate,
        officerInCharge,
        attendingMembers,
        formattedMessage: messageContent,
      });
      setStatusNotification('✅ تم نسخ نص التقرير بالكامل للحافظة!');
      setTimeout(() => setStatusNotification(null), 3000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // 2. Guaranteed Copy Image Only to Clipboard as PNG
  const handleCopyImageOnly = async () => {
    if (!screenshotUrl) {
      alert('لا توجد صورة لنسخها');
      return;
    }
    try {
      const pngBlob = await convertToPngBlob(screenshotUrl);
      if (pngBlob && typeof ClipboardItem !== 'undefined') {
        const item = new ClipboardItem({ 'image/png': pngBlob });
        await navigator.clipboard.write([item]);
        setCopySuccessImage(true);
        setTimeout(() => setCopySuccessImage(false), 2500);
        setStatusNotification('📷 تم نسخ الصورة للحافظة كـ PNG! اضغط Ctrl+V في ديسكورد لتلتصق فوراً كمرفق.');
        setTimeout(() => setStatusNotification(null), 4500);
      } else {
        alert('تعذر نسخ الصورة للحافظة، يرجى تحميلها كملف.');
      }
    } catch (err) {
      console.error('Failed to copy image: ', err);
      alert('المتصفح منع نسخ الصورة للحافظة. يمكنك استخدام زر "تحميل الصورة" لرفعها مباشرة.');
    }
  };

  // 3. Download image to device
  const handleDownloadImage = () => {
    if (!screenshotUrl) return;
    const a = document.createElement('a');
    a.href = screenshotUrl;
    a.download = `scenario-report-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // 4. Combined Action: Copy text & Prepare image
  const handleCombinedCopyAndOpen = async () => {
    try {
      // First copy text
      await navigator.clipboard.writeText(messageContent);
      onSaveReport({
        eventType: formattedEvent,
        location: formattedLocation,
        dateTime: formattedDate,
        officerInCharge,
        attendingMembers,
        formattedMessage: messageContent,
      });

      // If screenshot exists, also copy image to clipboard as PNG!
      if (screenshotUrl) {
        const pngBlob = await convertToPngBlob(screenshotUrl);
        if (pngBlob && typeof ClipboardItem !== 'undefined') {
          const item = new ClipboardItem({ 'image/png': pngBlob });
          await navigator.clipboard.write([item]);
          setStatusNotification('📷 تم نسخ الصورة للحافظة كـ PNG! اضغط Ctrl+V في ديسكورد لتلتصق الصورة كمرفق، ثم انسخ النص بالزر المخصص.');
        } else {
          setStatusNotification('📋 تم نسخ نص التقرير للحافظة! جاري التوجه لروم الديسكورد.');
        }
      } else {
        setStatusNotification('📋 تم نسخ نص التقرير للحافظة! جاري التوجه لروم الديسكورد.');
      }

      setTimeout(() => setStatusNotification(null), 5000);

      // Open Discord channel
      if (discordChannelUrl) {
        window.open(discordChannelUrl, '_blank');
      }
    } catch (err) {
      console.error('Failed combined copy:', err);
    }
  };

  const characterCount = messageContent.length;
  const isOverDiscordLimit = characterCount > 2000;

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 space-y-6 text-right">
      {/* Step Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <span className="text-xs font-mono font-bold text-blue-400">الخطوة 4 / 4</span>
          <h2 className="text-xl font-black text-white mt-0.5">التقرير النهائي المعتمد</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs hover:bg-slate-800 transition cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span>رابط روم الديسكورد</span>
          </button>
        </div>
      </div>

      {/* Floating Status Notification Toast */}
      {statusNotification && (
        <div className="p-3 rounded-2xl bg-emerald-950/90 border border-emerald-500/70 text-emerald-200 text-xs font-bold text-center shadow-2xl shadow-emerald-950/80 animate-fadeIn">
          {statusNotification}
        </div>
      )}

      {/* Discord Settings drawer (if open) */}
      {isSettingsOpen && (
        <div className="p-4 rounded-xl bg-slate-900/90 border border-blue-900/50 space-y-2 text-right animate-fadeIn">
          <label className="text-xs font-bold text-slate-200 block">
            رابط روم السناريوهات بالديسكورد (يفتح تلقائياً عند النسخ):
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={discordChannelUrl}
              onChange={(e) => setDiscordChannelUrl(e.target.value)}
              placeholder="https://discord.com/channels/..."
              className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono outline-none focus:border-blue-500"
            />
          </div>
        </div>
      )}

      {/* Message Output Card */}
      <div className="p-5 rounded-2xl bg-[#0e1422] border border-slate-800 space-y-3 shadow-xl text-right">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
            <span>الرسالة الجاهزة (قالب الديسكورد مع المنشنات):</span>
          </span>
          <span
            className={`text-xs font-mono tabular-nums font-bold ${
              isOverDiscordLimit ? 'text-red-400' : 'text-slate-400'
            }`}
          >
            {characterCount} / 2000
          </span>
        </div>

        {/* Role Breakdown Stat Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 pb-1">
          <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-600/40 text-center">
            <span className="text-[10px] text-amber-300 font-bold block">👑 رولات القادة</span>
            <span className="text-sm font-black text-amber-400 font-mono">{leaders.length}</span>
          </div>
          <div className="p-2 rounded-xl bg-indigo-950/40 border border-indigo-600/40 text-center">
            <span className="text-[10px] text-indigo-300 font-bold block">⭐️ رولات الضباط</span>
            <span className="text-sm font-black text-indigo-400 font-mono">{officers.length}</span>
          </div>
          <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-600/40 text-center">
            <span className="text-[10px] text-emerald-300 font-bold block">⚡ رولات الأفراد</span>
            <span className="text-sm font-black text-emerald-400 font-mono">{soldiers.length}</span>
          </div>
          <div className="p-2 rounded-xl bg-blue-950/40 border border-blue-600/40 text-center">
            <span className="text-[10px] text-blue-300 font-bold block">👥 إجمالي الحضور</span>
            <span className="text-sm font-black text-blue-400 font-mono">{attendingMembers.length}</span>
          </div>
        </div>

        <textarea
          rows={11}
          value={messageContent}
          onChange={(e) => setMessageContent(e.target.value)}
          className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs leading-relaxed outline-none focus:border-blue-500 transition resize-y"
        />

        {isOverDiscordLimit && (
          <div className="flex items-center gap-2 text-xs text-red-400 p-2 rounded bg-red-950/30 border border-red-800">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>تنبيه: حجم الرسالة يتجاوز الحد الأقصى المسموح به في رسالة ديسكورد واحدة (2000 حرف).</span>
          </div>
        )}
      </div>

      {/* Dedicated Copy Action Buttons (Clear & Guaranteed) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Button 1: Copy Image Only to Clipboard */}
        <div className="p-5 rounded-2xl bg-[#0c1222] border border-blue-600/40 shadow-xl space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
              <ImageIcon className="w-4 h-4" />
              <span>1. نسخ صورة التقرير</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              ينسخ لقطة الشاشة كـ PNG للحافظة، فبمجرد الضغط على <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-blue-300 font-bold border border-slate-700">Ctrl + V</kbd> في شات ديسكورد تلتصق الصورة كمرفق!
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleCopyImageOnly}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition cursor-pointer"
            >
              {copySuccessImage ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>تم نسخ الصورة للحافظة ✓</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>نسخ الصورة للحافظة (Ctrl+V) 📷</span>
                </>
              )}
            </button>

            {screenshotUrl && (
              <button
                type="button"
                onClick={handleDownloadImage}
                className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>أو تحميل الصورة لجهازك 💾</span>
              </button>
            )}
          </div>
        </div>

        {/* Button 2: Copy Text Only to Clipboard */}
        <div className="p-5 rounded-2xl bg-[#0c1222] border border-slate-800 shadow-xl space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>2. نسخ نص التقرير</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              ينسخ نص الرسالة بالكامل منسقاً مع المنشنات، لتلصقه مباشرة في خانة الكتابة بالديسكورد.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleCopyTextOnly}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 transition cursor-pointer"
            >
              {copySuccessText ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>تم نسخ النص بنجاح ✓</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-950" />
                  <span>نسخ نص التقرير بالكامل 📋</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Button 3: Combined Copy & Open Discord */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/30 to-slate-950 border border-purple-800/40 shadow-xl space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
              <Share2 className="w-4 h-4 text-purple-400" />
              <span>3. التوجه للديسكورد مباشرة</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              يقوم بنسخ الصورة والنص ويفتح روم السناريوهات المعتمد في الديسكورد فوراً بنقرة واحدة.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleCombinedCopyAndOpen}
              className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-950/60 transition cursor-pointer"
            >
              <span>فتح روم الديسكورد 🚀</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Footer Actions */}
      <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition cursor-pointer"
        >
          العودة لتعديل البيانات
        </button>

        <button
          type="button"
          onClick={onReset}
          className="px-5 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-800/50 text-red-300 text-xs font-bold transition cursor-pointer"
        >
          إنهاء والبدء بسناريو جديد ↺
        </button>
      </div>
    </div>
  );
};
