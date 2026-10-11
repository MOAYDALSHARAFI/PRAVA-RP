import { Sector, VoiceMember, EventType, LocationItem, ImageTag, RoleCategoriesConfig } from '../types';

export const SECTORS: Sector[] = [
  {
    id: 'swat',
    nameAr: 'سوات',
    nameEn: 'Special Weapons and Tactics',
    code: 'SWAT',
    isActive: true,
    statusBadge: 'مفعل',
    description: 'قوات التدخل السريع والعمليات التكتيكية الخاصة والمداهمات عالية الخطورة.',
    accentColor: '#3b82f6',
  },
  {
    id: 'public_security',
    nameAr: 'الأمن العام',
    nameEn: 'Public Security',
    code: 'PS',
    isActive: false,
    statusBadge: 'قريباً',
    description: 'دوريات الأمن الميداني وحفظ النظام ومباشرة البلاغات العامة.',
    accentColor: '#10b981',
  },
  {
    id: 'armed_forces',
    nameAr: 'القوات المسلحة',
    nameEn: 'Armed Forces',
    code: 'AF',
    isActive: false,
    statusBadge: 'قريباً',
    description: 'حماية المنشآت السيادية والعمليات المشتركة وتأمين الحدود الحضرية.',
    accentColor: '#eab308',
  },
  {
    id: 'general_investigation',
    nameAr: 'المباحث العامة',
    nameEn: 'General Investigation',
    code: 'GS',
    isActive: false,
    statusBadge: 'قريباً',
    description: 'التحريات وجمع الأدلة والمراقبة والتحقيق في الجرائم المنظمة.',
    accentColor: '#8b5cf6',
  },
];

export const INITIAL_VOICE_MEMBERS: VoiceMember[] = [];

export const EVENT_TYPES: EventType[] = [
  { id: 'robbery', name: 'سرقة', iconName: 'Siren' },
  { id: 'raid', name: 'مداهمة', iconName: 'Flame' },
  { id: 'callout', name: 'بلاغ', iconName: 'OctagonAlert' },
  { id: 'backup', name: 'مساندة', iconName: 'Handshake' },
  { id: 'briefing', name: 'توزيع مهام', iconName: 'ClipboardList' },
  { id: 'event', name: 'فعالية', iconName: 'PartyPopper' },
  { id: 'training', name: 'تدريب', iconName: 'Target' },
  {
    id: 'checkpoint',
    name: 'نقطة تفتيش',
    iconName: 'OctagonAlert',
    hasSubStages: true,
    subStages: [
      { id: 'start_checkpoint', label: 'بداية التفتيش' },
      { id: 'end_checkpoint', label: 'نهاية التفتيش' },
    ],
  },
  {
    id: 'sweep',
    name: 'تمشيط',
    iconName: 'ShieldAlert',
    hasSubStages: true,
    requiresGrid: true,
    subStages: [
      { id: 'start_sweep', label: 'بداية التمشيط' },
      { id: 'end_sweep', label: 'نهاية التمشيط' },
    ],
  },
];

export const DEFAULT_GANGS = ['CL', 'VS', 'RELOAD', 'BLD', 'ARCANE', 'GROOVE'];

export const LOCATIONS: LocationItem[] = [
  // البنوك
  { id: 'b-1', name: 'البنك المركزي', category: 'البنوك' },
  { id: 'b-2', name: 'البنك الثاني', category: 'البنوك' },
  { id: 'b-3', name: 'بنك المطار', category: 'البنوك' },
  { id: 'b-4', name: 'بنك برافا', category: 'البنوك' },

  // المصانع
  { id: 'f-1', name: 'مصنع البقر', category: 'المصانع' },
  { id: 'f-2', name: 'مصنع القوارب', category: 'المصانع' },
  { id: 'f-3', name: 'مصنع الدجاج', category: 'المصانع' },
  { id: 'f-4', name: 'مصنع الخشب', category: 'المصانع' },
  { id: 'f-5', name: 'مصنع الذهب', category: 'المصانع' },

  // المترو
  { id: 'm-1', name: 'المترو الاول', category: 'المترو' },
  { id: 'm-2', name: 'المترو الثاني', category: 'المترو' },
  { id: 'm-3', name: 'مترو بهامس', category: 'المترو' },
  { id: 'm-4', name: 'مترو المطار', category: 'المترو' },
  { id: 'm-5', name: 'مترو المدينة', category: 'المترو' },

  // مواقع أخرى / السرقات
  { id: 'o-1', name: 'الاستوديو', category: 'مواقع أخرى' },
  { id: 'o-2', name: 'البوب كات', category: 'مواقع أخرى' },
  { id: 'o-3', name: 'الخياط', category: 'مواقع أخرى' },
  { id: 'o-4', name: 'مسرح', category: 'مواقع أخرى' },
  { id: 'o-5', name: 'ملاهي', category: 'مواقع أخرى' },
  { id: 'o-6', name: 'المجوهرات', category: 'مواقع أخرى' },
  { id: 'o-7', name: 'الدسكو', category: 'مواقع أخرى' },
];

export const SAMPLE_IMAGE_TAGS: ImageTag[] = [
  { id: 'tag-1', text: '264636', x: 29.5, y: 56.5, status: 'matched', matchedMemberId: 'm-15' },
  { id: 'tag-2', text: '-2935', x: 32.2, y: 55.8, status: 'matched', matchedMemberId: 'm-14' },
  { id: 'tag-3', text: '422', x: 34.5, y: 55.2, status: 'matched', matchedMemberId: 'm-8' },
  { id: 'tag-4', text: '1551', x: 33.7, y: 64.0, status: 'matched', matchedMemberId: 'm-12' },
  { id: 'tag-5', text: '-410', x: 39.3, y: 65.2, status: 'matched', matchedMemberId: 'm-13' },
];

export const ACCEPTANCE_RULES = [
  { id: 1, text: 'التاريخ والوقت واضحين في أسفل/أعلى الشاشة.', required: true },
  { id: 2, text: 'الخريطة المصغرة (Minimap) ظاهرة بالصورة بوضوح.', required: true },
  { id: 3, text: 'مسؤول التوثيق غير مسجل دخوله في وضع الإدارة (No Admin Duty).', required: true },
  { id: 4, text: 'الصورة حديثة ولم يمضِ عليها أكثر من 24 ساعة.', required: true },
  { id: 5, text: 'لقطة شاشة أصلية كاملة بدون قص أو تعديل بالفوتوشوب.', required: true },
];

export const DEFAULT_DISCORD_TEMPLATE = `\`\`\`
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

export const DEFAULT_SECTOR_TEMPLATES = {
  swat: `\`\`\`ansi
[2;33m[2;43m[2;40m- ⚡ 𝐒.𝐖.𝐀.𝐓 ⚡ -
\`\`\`
\`\`\`diff
- { تـقـريـر عـن الـحـدث } -
\`\`\`

\`\`\`
تم السيطرة ( {event} {stage} )  وتم توجيه الوحدات لكل من يحاول زعزعة أمن الدولة من قبل وحوش السوات
\`\`\`

\`\`\`
- 🌟♕ الــقــادة ({leadersCount}) ♕🌟 -
\`\`\`
{leadersList}

\`\`\`
- ⭐️ ضـبـاط الـسـوات ({officersCount}) ⭐️ -
\`\`\`
{officersList}

\`\`\`
- ⚡ الأفـراد الـمـشـاركـيـن ({soldiersCount}) ⚡ -
\`\`\`
{soldiersList}

**منشنات أفراد السناريو:**
{mentions}`,

  public_security: `\`\`\`
**【 سيرفر {serverName} — مديرية الأمن العام (Public Security) 】**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 **نوع البلاغ / المهمة:** {event} {stage}
{locationLine}⏰ **وقت تسجيل البلاغ:** {dateTime}
👤 **مشرف الدورية / الضابط المناوب:** {officer}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👑 **قادة الميدان والقطاع ({leadersCount}):**
{leadersList}

⭐️ **الضباط المشرفون ({officersCount}):**
{officersList}

⚡ **الدوريات والأفراد الميدانيين ({soldiersCount}):**
{soldiersList}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👥 **إجمالي الحضور:** {attendanceCount}
📷 **توثيق البلاغ الميداني:** [الصورة مرفقة]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#{serverCode} #PublicSecurity #Police
\`\`\`

**منشنات أفراد المهمة:**
{mentions}`,

  armed_forces: `\`\`\`
**【 سيرفر {serverName} — قيادة القوات المسلحة (Armed Forces) 】**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎖️ **نوع العملية العسكرية:** {event} {stage}
{locationLine}⏰ **ساعة الصفر والتوقيت:** {dateTime}
👤 **قائد التشكيل العسكري:** {officer}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👑 **هيئة القيادة والعمليات ({leadersCount}):**
{leadersList}

⭐️ **ضباط العمليات الميدانية ({officersCount}):**
{officersList}

⚡ **الأفراد والجنود المقاتلين ({soldiersCount}):**
{soldiersList}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛡️ **القوة الإجمالية المشاركة:** {attendanceCount} مقاتل
📷 **التوثيق التكتيكي للعملية:** [الصورة مرفقة]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#{serverCode} #ArmedForces #MilitaryOperations
\`\`\`

**منشنات التشكيل العسكري:**
{mentions}`,

  general_investigation: `\`\`\`
**【 سيرفر {serverName} — جهاز المباحث العامة (General Investigation) 】**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📁 **ملف التحري / القضية:** {event} {stage}
{locationLine}⏰ **توقيت الرصد والمتابعة:** {dateTime}
👤 **المحقق المسؤول:** {officer}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👑 **قيادة التحريات والمباحث ({leadersCount}):**
{leadersList}

⭐️ **المحققون والضباط المشرفون ({officersCount}):**
{officersList}

⚡ **الأفراد ومساعدو التحري ({soldiersCount}):**
{soldiersList}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👥 **إجمالي الفريق المشارك:** {attendanceCount}
📷 **الأدلة والتوثيق الجنائي:** [الصورة مرفقة]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#{serverCode} #GeneralInvestigation #SecretService
\`\`\`

**منشنات المحققين:**
{mentions}`,
};

export const DEFAULT_ROLE_CATEGORIES: RoleCategoriesConfig = {
  leaderRanks: [],
  officerRanks: [],
  soldierRanks: [],
  leaderRoleIds: [],
  officerRoleIds: [],
  soldierRoleIds: [],
  discordRoles: [],
  discordRoleMappings: {},
  strictDiscordRolesOnly: true,
  gangs: DEFAULT_GANGS,
};

export const DEFAULT_DEVELOPER_SETTINGS = {
  serverName: 'PRAVA ROLEPLAY',
  serverSubtitle: 'MINISTRY OF INTERIOR',
  developerPin: '1022',
  discordWebhook: '',
  discordChannelUrl: 'https://discord.com/app',
  discordBotToken: '',
  discordGuildId: '',
  discordVoiceChannelId: '',
  sectorStatus: {
    swat: true,
    public_security: false,
    armed_forces: false,
    general_investigation: false,
  },
  sectorLogos: {
    swat: null,
    public_security: null,
    armed_forces: null,
    general_investigation: null,
  },
  sectorChannels: {
    swat: 'https://discord.com/channels/123/swat-reports',
    public_security: 'https://discord.com/channels/123/security-reports',
    armed_forces: 'https://discord.com/channels/123/armed-reports',
    general_investigation: 'https://discord.com/channels/123/investigation-reports',
  },
  sectorVoiceChannels: {
    swat: '🔊 الروم الصوتي - سوات الميداني (SWAT Voice #1)',
    public_security: '🔊 الروم الصوتي - دوريات الأمن العام (PS Voice #1)',
    armed_forces: '🔊 الروم الصوتي - العمليات العسكرية (AF Voice #1)',
    general_investigation: '🔊 الروم الصوتي - غرفة التحريات والمباحث (GS Voice #1)',
  },
  sectorTemplates: DEFAULT_SECTOR_TEMPLATES,
  voiceRoomName: '🔊 الروم الصوتي الميداني - سوات (SWAT Voice #1)',
  messageTemplate: DEFAULT_DISCORD_TEMPLATE,
  roleCategoriesConfig: DEFAULT_ROLE_CATEGORIES,
};

