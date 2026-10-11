import React, { useState, useRef, useEffect } from 'react';
import {
  Settings,
  Palette,
  Code2,
  X,
  Check,
  Upload,
  Lock,
  Unlock,
  RefreshCw,
  Image as ImageIcon,
  MessageSquare,
  Mic,
  FileText,
  Plus,
  Trash2,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Bot,
  Layers,
  ClipboardPaste,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  Wrench,
  ShieldCheck,
} from 'lucide-react';
import { AppTheme, DeveloperSettings, VoiceMember, DiscordServerRole, RoleCategoriesConfig } from '../types';
import { BravaEmblem, SwatEmblem } from './Emblems';
import {
  DEFAULT_DISCORD_TEMPLATE,
  DEFAULT_DEVELOPER_SETTINGS,
  DEFAULT_SECTOR_TEMPLATES,
  DEFAULT_ROLE_CATEGORIES,
  DEFAULT_GANGS,
} from '../data/initialData';
import { DiscordRoleMentionsManager } from './DiscordRoleMentionsManager';
import {
  parseDiscordVoiceText,
  fetchDiscordVoiceMembers,
  extractDiscordIds,
  runDiscordDiagnostic,
  DiagnosticReport,
  fetchDiscordGuildRoles,
  extractRoleIds,
} from '../utils/discordVoiceSync';
import { compressImage } from '../utils/imageCompressor';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  customLogoUrl: string | null;
  onUploadLogo: (file: File) => void;
  onResetLogo: () => void;
  developerSettings: DeveloperSettings;
  onUpdateDeveloperSettings: (settings: DeveloperSettings) => void;
  voiceMembers: VoiceMember[];
  onVoiceMembersChange: (members: VoiceMember[]) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onThemeChange,
  customLogoUrl,
  onUploadLogo,
  onResetLogo,
  developerSettings,
  onUpdateDeveloperSettings,
  voiceMembers,
  onVoiceMembersChange,
}) => {
  // Main Tabs: 'theme' is FIRST by default
  const [activeTab, setActiveTab] = useState<'theme' | 'developer'>('theme');

  // Developer Sub-Tabs: 'roles' | 'status' | 'templates' | 'voice' | 'sectors' | 'channels' | 'general'
  const [devSection, setDevSection] = useState<'sectors' | 'status' | 'roles' | 'channels' | 'voice' | 'templates' | 'general'>('roles');

  // Selected Sector for Templates sub-tab
  const [selectedTemplateSector, setSelectedTemplateSector] = useState<keyof typeof DEFAULT_SECTOR_TEMPLATES>('swat');

  const [devPinInput, setDevPinInput] = useState('');
  const [isDevUnlocked, setIsDevUnlocked] = useState(false);
  const [pinError, setPinError] = useState(false);

  // Live voice sync feedback
  const [isSyncingVoice, setIsSyncingVoice] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [isWidgetDisabled, setIsWidgetDisabled] = useState(false);
  const [showWidgetGuide, setShowWidgetGuide] = useState(false);

  // Quick bulk paste input
  const [bulkPasteInput, setBulkPasteInput] = useState('');
  const [smartNotice, setSmartNotice] = useState<string | null>(null);

  // Diagnostic Report
  const [diagnosticReport, setDiagnosticReport] = useState<DiagnosticReport | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [logoSaveNotice, setLogoSaveNotice] = useState<string | null>(null);

  // Roles & Ranks inputs
  const [newLeaderRole, setNewLeaderRole] = useState('');
  const [newOfficerRole, setNewOfficerRole] = useState('');
  const [newSoldierRole, setNewSoldierRole] = useState('');
  const [bulkRoleMentionsText, setBulkRoleMentionsText] = useState('');
  const [rolesSaveNotice, setRolesSaveNotice] = useState<string | null>(null);
  const [isFetchingDiscordRoles, setIsFetchingDiscordRoles] = useState(false);
  const [discordRolesFilter, setDiscordRolesFilter] = useState('');
  const [discordRolesNotice, setDiscordRolesNotice] = useState<string | null>(null);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  const handleDownloadZipBlob = async () => {
    try {
      setIsDownloadingZip(true);
      const res = await fetch('/prava-rp-project.zip');
      if (!res.ok) throw new Error('فشل جلب ملف المشروع');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'prava-rp-project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      window.location.href = '/prava-rp-project.zip';
    } finally {
      setIsDownloadingZip(false);
    }
  };

  // Safe developer settings state initialized with deep merge
  const getSafeSettings = (input?: Partial<DeveloperSettings>): DeveloperSettings => ({
    ...DEFAULT_DEVELOPER_SETTINGS,
    ...(input || {}),
    sectorStatus: {
      ...DEFAULT_DEVELOPER_SETTINGS.sectorStatus,
      ...(input?.sectorStatus || {}),
    },
    sectorLogos: {
      ...DEFAULT_DEVELOPER_SETTINGS.sectorLogos,
      ...(input?.sectorLogos || {}),
    },
    sectorChannels: {
      ...DEFAULT_DEVELOPER_SETTINGS.sectorChannels,
      ...(input?.sectorChannels || {}),
    },
    sectorVoiceChannels: {
      ...DEFAULT_DEVELOPER_SETTINGS.sectorVoiceChannels,
      ...(input?.sectorVoiceChannels || {}),
    },
    sectorTemplates: {
      ...DEFAULT_SECTOR_TEMPLATES,
      ...(input?.sectorTemplates || {}),
    },
    messageTemplate: input?.messageTemplate || DEFAULT_DEVELOPER_SETTINGS.messageTemplate,
    voiceRoomName: input?.voiceRoomName || DEFAULT_DEVELOPER_SETTINGS.voiceRoomName,
    discordVoiceChannelId: input?.discordVoiceChannelId || DEFAULT_DEVELOPER_SETTINGS.discordVoiceChannelId,
    discordBotToken: input?.discordBotToken || '',
    discordGuildId: input?.discordGuildId || '',
    roleCategoriesConfig: {
      leaderRanks: [
        ...(input?.roleCategoriesConfig?.leaderRanks || DEFAULT_ROLE_CATEGORIES.leaderRanks),
      ],
      officerRanks: [
        ...(input?.roleCategoriesConfig?.officerRanks || DEFAULT_ROLE_CATEGORIES.officerRanks),
      ],
      soldierRanks: [
        ...(input?.roleCategoriesConfig?.soldierRanks || DEFAULT_ROLE_CATEGORIES.soldierRanks),
      ],
      leaderRoleIds: [
        ...(input?.roleCategoriesConfig?.leaderRoleIds || []),
      ],
      officerRoleIds: [
        ...(input?.roleCategoriesConfig?.officerRoleIds || []),
      ],
      soldierRoleIds: [
        ...(input?.roleCategoriesConfig?.soldierRoleIds || []),
      ],
      discordRoles: [
        ...(input?.roleCategoriesConfig?.discordRoles || DEFAULT_ROLE_CATEGORIES.discordRoles || []),
      ],
      discordRoleMappings: {
        ...(DEFAULT_ROLE_CATEGORIES.discordRoleMappings || {}),
        ...(input?.roleCategoriesConfig?.discordRoleMappings || {}),
      },
      strictDiscordRolesOnly: input?.roleCategoriesConfig?.strictDiscordRolesOnly ?? true,
      gangs: input?.roleCategoriesConfig?.gangs || DEFAULT_GANGS,
    },
  });

  const [settingsForm, setSettingsForm] = useState<DeveloperSettings>(() => getSafeSettings(developerSettings));

  // Sync settings whenever developerSettings prop updates or modal opens
  useEffect(() => {
    if (isOpen) {
      setSettingsForm(getSafeSettings(developerSettings));
    }
  }, [isOpen, developerSettings]);

  // Member Quick Add Form
  const [newMember, setNewMember] = useState({
    rank: 'ملازم',
    militaryCode: 'I-99',
    gameId: '',
    discordName: '',
    discordUserId: '',
  });

  // Target sector for file upload
  const [uploadTargetSector, setUploadTargetSector] = useState<string | null>(null);

  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const sectorFileInputRef = useRef<HTMLInputElement>(null);
  const templateTextareaRef = useRef<HTMLTextAreaElement>(null);

  if (!isOpen) return null;

  const handleUnlockDev = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPin = settingsForm.developerPin || '1022';
    if (devPinInput === targetPin || devPinInput === '1022') {
      setIsDevUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  // Toggle Sector Status (Enabled "مفعل" vs Disabled "قريباً")
  const handleToggleSectorStatus = (secId: keyof typeof DEFAULT_DEVELOPER_SETTINGS.sectorStatus) => {
    const current = settingsForm.sectorStatus?.[secId] ?? false;
    const updated: DeveloperSettings = {
      ...settingsForm,
      sectorStatus: {
        ...(settingsForm.sectorStatus || DEFAULT_DEVELOPER_SETTINGS.sectorStatus),
        [secId]: !current,
      },
    };
    setSettingsForm(updated);
    onUpdateDeveloperSettings(updated);
  };

  // Upload custom sector logo with high-efficiency compression
  const handleSectorLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadTargetSector) {
      try {
        setLogoSaveNotice('جاري معالجة وضغط الشعار لحفظه...');
        const compressedUrl = await compressImage(file, 384, 384, 0.85);
        const updated: DeveloperSettings = {
          ...settingsForm,
          sectorLogos: {
            ...(settingsForm.sectorLogos || DEFAULT_DEVELOPER_SETTINGS.sectorLogos),
            [uploadTargetSector]: compressedUrl,
          },
        };
        setSettingsForm(updated);
        try {
          localStorage.setItem('brava_sector_logo_' + uploadTargetSector, compressedUrl);
        } catch (_) {}
        onUpdateDeveloperSettings(updated);
        setLogoSaveNotice('✅ تم حفظ وتحديث شعار القطاع بنجاح ومزامنته!');
        setTimeout(() => setLogoSaveNotice(null), 4000);
      } catch (err) {
        console.warn('Failed compressing sector logo:', err);
      }
    }
    e.target.value = '';
  };

  const handleResetSectorLogo = (sectorId: string) => {
    const updated: DeveloperSettings = {
      ...settingsForm,
      sectorLogos: {
        ...(settingsForm.sectorLogos || DEFAULT_DEVELOPER_SETTINGS.sectorLogos),
        [sectorId]: null,
      },
    };
    setSettingsForm(updated);
    try {
      localStorage.removeItem('brava_sector_logo_' + sectorId);
    } catch (_) {}
    onUpdateDeveloperSettings(updated);
    setLogoSaveNotice('✓ تم استعادة الشعار الافتراضي للقطاع.');
    setTimeout(() => setLogoSaveNotice(null), 3000);
  };

  // Add / Remove / Reset Game Roles & Ranks & Mentions (<@&...>)
  const handleAddRoleOrMention = (category: 'leader' | 'officer' | 'soldier', text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const currentCfg = settingsForm.roleCategoriesConfig || DEFAULT_ROLE_CATEGORIES;
    const extractedIds = extractRoleIds(trimmed);

    let updatedLeaderRanks = [...(currentCfg.leaderRanks || [])];
    let updatedOfficerRanks = [...(currentCfg.officerRanks || [])];
    let updatedSoldierRanks = [...(currentCfg.soldierRanks || [])];

    let updatedLeaderIds = [...(currentCfg.leaderRoleIds || [])];
    let updatedOfficerIds = [...(currentCfg.officerRoleIds || [])];
    let updatedSoldierIds = [...(currentCfg.soldierRoleIds || [])];

    const updatedMappings = { ...(currentCfg.discordRoleMappings || {}) };
    let updatedDiscordRoles = [...(currentCfg.discordRoles || [])];

    if (extractedIds.length > 0) {
      extractedIds.forEach((roleId) => {
        // Remove from other categories to avoid conflicts
        updatedLeaderIds = updatedLeaderIds.filter((id) => id !== roleId);
        updatedOfficerIds = updatedOfficerIds.filter((id) => id !== roleId);
        updatedSoldierIds = updatedSoldierIds.filter((id) => id !== roleId);

        if (category === 'leader') updatedLeaderIds.push(roleId);
        else if (category === 'officer') updatedOfficerIds.push(roleId);
        else updatedSoldierIds.push(roleId);

        updatedMappings[roleId] = category;

        const roleObj = updatedDiscordRoles.find((r) => r.id === roleId);
        if (roleObj) {
          roleObj.category = category;
        } else {
          updatedDiscordRoles.push({
            id: roleId,
            name: `<@&${roleId}>`,
            category,
          });
        }
      });

      const catLabel = category === 'leader' ? 'القادة 👑' : category === 'officer' ? 'الضباط ⭐️' : 'الأفراد ⚡';
      setRolesSaveNotice(`✅ تمت إضافة ${extractedIds.length} رول ديسكورد (<@&${extractedIds.join('>, <@&')}>) إلى ${catLabel}!`);
    } else {
      // Pure text rank name
      if (category === 'leader') {
        if (!updatedLeaderRanks.includes(trimmed)) updatedLeaderRanks.push(trimmed);
      } else if (category === 'officer') {
        if (!updatedOfficerRanks.includes(trimmed)) updatedOfficerRanks.push(trimmed);
      } else {
        if (!updatedSoldierRanks.includes(trimmed)) updatedSoldierRanks.push(trimmed);
      }
      const catLabel = category === 'leader' ? 'القادة 👑' : category === 'officer' ? 'الضباط ⭐️' : 'الأفراد ⚡';
      setRolesSaveNotice(`✅ تمت إضافة الرتبة "${trimmed}" إلى ${catLabel}!`);
    }

    const updatedCfg: RoleCategoriesConfig = {
      ...currentCfg,
      leaderRanks: Array.from(new Set(updatedLeaderRanks)),
      officerRanks: Array.from(new Set(updatedOfficerRanks)),
      soldierRanks: Array.from(new Set(updatedSoldierRanks)),
      leaderRoleIds: Array.from(new Set(updatedLeaderIds)),
      officerRoleIds: Array.from(new Set(updatedOfficerIds)),
      soldierRoleIds: Array.from(new Set(updatedSoldierIds)),
      discordRoles: updatedDiscordRoles,
      discordRoleMappings: updatedMappings,
      strictDiscordRolesOnly: true,
    };

    const updated: DeveloperSettings = {
      ...settingsForm,
      roleCategoriesConfig: updatedCfg,
    };
    setSettingsForm(updated);
    onUpdateDeveloperSettings(updated);

    if (category === 'leader') setNewLeaderRole('');
    else if (category === 'officer') setNewOfficerRole('');
    else setNewSoldierRole('');

    setTimeout(() => setRolesSaveNotice(null), 3500);
  };

  const handleRemoveRoleOrMention = (category: 'leader' | 'officer' | 'soldier', item: string) => {
    const currentCfg = settingsForm.roleCategoriesConfig || DEFAULT_ROLE_CATEGORIES;
    const extractedIds = extractRoleIds(item);
    const roleId = extractedIds.length > 0 ? extractedIds[0] : (/^[0-9]{15,22}$/.test(item) ? item : null);

    let updatedLeaderRanks = [...(currentCfg.leaderRanks || [])];
    let updatedOfficerRanks = [...(currentCfg.officerRanks || [])];
    let updatedSoldierRanks = [...(currentCfg.soldierRanks || [])];

    let updatedLeaderIds = [...(currentCfg.leaderRoleIds || [])];
    let updatedOfficerIds = [...(currentCfg.officerRoleIds || [])];
    let updatedSoldierIds = [...(currentCfg.soldierRoleIds || [])];

    const updatedMappings = { ...(currentCfg.discordRoleMappings || {}) };
    let updatedDiscordRoles = [...(currentCfg.discordRoles || [])];

    if (roleId) {
      if (category === 'leader') updatedLeaderIds = updatedLeaderIds.filter((id) => id !== roleId);
      else if (category === 'officer') updatedOfficerIds = updatedOfficerIds.filter((id) => id !== roleId);
      else updatedSoldierIds = updatedSoldierIds.filter((id) => id !== roleId);

      delete updatedMappings[roleId];
      const rIdx = updatedDiscordRoles.findIndex((r) => r.id === roleId);
      if (rIdx !== -1) {
        updatedDiscordRoles[rIdx] = { ...updatedDiscordRoles[rIdx], category: 'unassigned' };
      }
    } else {
      if (category === 'leader') updatedLeaderRanks = updatedLeaderRanks.filter((r) => r !== item);
      else if (category === 'officer') updatedOfficerRanks = updatedOfficerRanks.filter((r) => r !== item);
      else updatedSoldierRanks = updatedSoldierRanks.filter((r) => r !== item);
    }

    const updatedCfg: RoleCategoriesConfig = {
      ...currentCfg,
      leaderRanks: updatedLeaderRanks,
      officerRanks: updatedOfficerRanks,
      soldierRanks: updatedSoldierRanks,
      leaderRoleIds: updatedLeaderIds,
      officerRoleIds: updatedOfficerIds,
      soldierRoleIds: updatedSoldierIds,
      discordRoles: updatedDiscordRoles,
      discordRoleMappings: updatedMappings,
      strictDiscordRolesOnly: true,
    };

    const updated: DeveloperSettings = {
      ...settingsForm,
      roleCategoriesConfig: updatedCfg,
    };
    setSettingsForm(updated);
    onUpdateDeveloperSettings(updated);
    setRolesSaveNotice(`🗑️ تم حذف "${item}".`);
    setTimeout(() => setRolesSaveNotice(null), 2500);
  };

  const handleBulkAddRoles = (category: 'leader' | 'officer' | 'soldier') => {
    if (!bulkRoleMentionsText.trim()) return;
    handleAddRoleOrMention(category, bulkRoleMentionsText);
    setBulkRoleMentionsText('');
  };

  const handleResetRolesToDefault = () => {
    const updated: DeveloperSettings = {
      ...settingsForm,
      roleCategoriesConfig: {
        leaderRanks: [...DEFAULT_ROLE_CATEGORIES.leaderRanks],
        officerRanks: [...DEFAULT_ROLE_CATEGORIES.officerRanks],
        soldierRanks: [...DEFAULT_ROLE_CATEGORIES.soldierRanks],
        discordRoles: [...(DEFAULT_ROLE_CATEGORIES.discordRoles || [])],
        discordRoleMappings: { ...(DEFAULT_ROLE_CATEGORIES.discordRoleMappings || {}) },
      },
    };
    setSettingsForm(updated);
    onUpdateDeveloperSettings(updated);
    setRolesSaveNotice('🔄 تمت استعادة رتب ورولات اللعبة الافتراضية بنجاح!');
    setTimeout(() => setRolesSaveNotice(null), 3000);
  };

  // 1. Fetch Discord Roles directly from server via Bot
  const handleFetchDiscordRoles = async () => {
    setIsFetchingDiscordRoles(true);
    setDiscordRolesNotice(null);

    const token = settingsForm.discordBotToken;
    const guildId = settingsForm.discordGuildId;

    if (!guildId) {
      setDiscordRolesNotice('⚠️ يرجى إدخال آيدي سيرفر الديسكورد (Server ID) أولاً في إعدادات الاتصال.');
      setIsFetchingDiscordRoles(false);
      return;
    }

    if (!token) {
      setDiscordRolesNotice('⚠️ يرجى إدخال توكن بوت الديسكورد (Bot Token) في إعدادات الاتصال لقراءة الرتب.');
      setIsFetchingDiscordRoles(false);
      return;
    }

    try {
      const result = await fetchDiscordGuildRoles(token, guildId);
      if (result.success && result.roles.length > 0) {
        // Build role mappings
        const newMappings: Record<string, 'leader' | 'officer' | 'soldier'> = {};
        result.roles.forEach((r) => {
          if (r.category && r.category !== 'unassigned') {
            newMappings[r.id] = r.category;
          }
        });

        // Set ranks lists strictly from real Discord roles
        const leaderNames = result.roles.filter((r) => r.category === 'leader').map((r) => r.name);
        const officerNames = result.roles.filter((r) => r.category === 'officer').map((r) => r.name);
        const soldierNames = result.roles.filter((r) => r.category === 'soldier').map((r) => r.name);

        const currentCfg = settingsForm.roleCategoriesConfig || DEFAULT_ROLE_CATEGORIES;
        const updatedCfg = {
          ...currentCfg,
          leaderRanks: Array.from(new Set(leaderNames)),
          officerRanks: Array.from(new Set(officerNames)),
          soldierRanks: Array.from(new Set(soldierNames)),
          discordRoles: result.roles,
          discordRoleMappings: newMappings,
          strictDiscordRolesOnly: true,
        };

        const updated: DeveloperSettings = {
          ...settingsForm,
          roleCategoriesConfig: updatedCfg,
        };
        setSettingsForm(updated);
        onUpdateDeveloperSettings(updated);
        setDiscordRolesNotice(`✅ تم بنجاح سحب ${result.roles.length} رول من سيرفر الديسكورد وتصنيفها مباشرة!`);
      } else {
        setDiscordRolesNotice(result.message || 'تعذر سحب الرتب من السيرفر.');
      }
    } catch (e: any) {
      setDiscordRolesNotice(`❌ خطأ أثناء السحب: ${e?.message || 'خطأ غير معروف'}`);
    } finally {
      setIsFetchingDiscordRoles(false);
    }
  };

  // Clear all roles and rely strictly on Discord
  const handlePurgeFakeRoles = () => {
    const updatedCfg = {
      leaderRanks: [],
      officerRanks: [],
      soldierRanks: [],
      discordRoles: [],
      discordRoleMappings: {},
      strictDiscordRolesOnly: true,
      gangs: DEFAULT_GANGS,
    };
    const updated: DeveloperSettings = {
      ...settingsForm,
      roleCategoriesConfig: updatedCfg,
    };
    setSettingsForm(updated);
    onUpdateDeveloperSettings(updated);
    setDiscordRolesNotice('🗑️ تم مسح كافة الرتب غير الموجودة في ديسكورد! اسحب رتب سيرفرك الحالية بالزر أعلاه.');
    setTimeout(() => setDiscordRolesNotice(null), 4000);
  };

  // 2. Set classification for a specific Discord Role
  const handleSetDiscordRoleCategory = (
    roleId: string,
    category: 'leader' | 'officer' | 'soldier' | 'unassigned'
  ) => {
    const currentCfg = settingsForm.roleCategoriesConfig || DEFAULT_ROLE_CATEGORIES;
    const rolesList = [...(currentCfg.discordRoles || DEFAULT_ROLE_CATEGORIES.discordRoles || [])];
    const roleIdx = rolesList.findIndex((r) => r.id === roleId);
    if (roleIdx === -1) return;

    rolesList[roleIdx] = {
      ...rolesList[roleIdx],
      category,
    };

    const targetRoleName = rolesList[roleIdx].name;
    const newMappings = { ...(currentCfg.discordRoleMappings || {}) };
    if (category === 'unassigned') {
      delete newMappings[roleId];
    } else {
      newMappings[roleId] = category;
    }

    // Update ranks lists accordingly
    let newLeaderRanks = currentCfg.leaderRanks.filter((r) => r !== targetRoleName);
    let newOfficerRanks = currentCfg.officerRanks.filter((r) => r !== targetRoleName);
    let newSoldierRanks = currentCfg.soldierRanks.filter((r) => r !== targetRoleName);

    if (category === 'leader') newLeaderRanks.push(targetRoleName);
    else if (category === 'officer') newOfficerRanks.push(targetRoleName);
    else if (category === 'soldier') newSoldierRanks.push(targetRoleName);

    const updatedCfg = {
      ...currentCfg,
      leaderRanks: Array.from(new Set(newLeaderRanks)),
      officerRanks: Array.from(new Set(newOfficerRanks)),
      soldierRanks: Array.from(new Set(newSoldierRanks)),
      discordRoles: rolesList,
      discordRoleMappings: newMappings,
    };

    const updated: DeveloperSettings = {
      ...settingsForm,
      roleCategoriesConfig: updatedCfg,
    };
    setSettingsForm(updated);
    onUpdateDeveloperSettings(updated);
  };

  // 3. Load FiveM / Military Ranks Preset
  const handleLoadPresetRoles = () => {
    const updatedCfg = {
      leaderRanks: [...DEFAULT_ROLE_CATEGORIES.leaderRanks],
      officerRanks: [...DEFAULT_ROLE_CATEGORIES.officerRanks],
      soldierRanks: [...DEFAULT_ROLE_CATEGORIES.soldierRanks],
      discordRoles: [...(DEFAULT_ROLE_CATEGORIES.discordRoles || [])],
      discordRoleMappings: { ...(DEFAULT_ROLE_CATEGORIES.discordRoleMappings || {}) },
    };

    const updated: DeveloperSettings = {
      ...settingsForm,
      roleCategoriesConfig: updatedCfg,
    };
    setSettingsForm(updated);
    onUpdateDeveloperSettings(updated);
    setDiscordRolesNotice('📋 تم استيراد حزمة رتب ورولات FiveM العسكرية الجاهزة بنجاح!');
    setTimeout(() => setDiscordRolesNotice(null), 3500);
  };

  // 4. Smart Auto Classify All Discord Roles
  const handleAutoClassifyAll = () => {
    const currentCfg = settingsForm.roleCategoriesConfig || DEFAULT_ROLE_CATEGORIES;
    const rolesList = [...(currentCfg.discordRoles || DEFAULT_ROLE_CATEGORIES.discordRoles || [])];

    const leaderWords = [
      'قائد', 'قيادة', 'فريق', 'لواء', 'عميد', 'عقيد', 'كبار', 'حاكم', 'وزير',
      'commander', 'chief', 'head', 'high command', 'colonel', 'general', 'lead',
      'crown', 'king', '👑', '♕', '⭐', '🌟'
    ];
    const officerWords = [
      'ضابط', 'ضباط', 'مقدم', 'رائد', 'نقيب', 'ملازم', 'تحري', 'مشرف',
      'officer', 'captain', 'major', 'lieutenant', 'cpt', 'lt', 'maj', 'ltc', '⭐️'
    ];
    const soldierWords = [
      'فرد', 'أفراد', 'رقيب', 'عريف', 'جندي', 'مستجد', 'طالب', 'عضو', 'سوات', 'ميداني',
      'soldier', 'enlisted', 'sergeant', 'corporal', 'private', 'trooper', 'recruit',
      'cadet', 'member', 'operator', '⚡', '🛡️', '👮'
    ];

    const newMappings: Record<string, 'leader' | 'officer' | 'soldier'> = {};
    const autoCategorized = rolesList.map((r) => {
      const name = r.name || '';
      const lower = name.toLowerCase();

      let cat: 'leader' | 'officer' | 'soldier' | 'unassigned' = 'unassigned';
      if (leaderWords.some((w) => name.includes(w) || lower.includes(w.toLowerCase()))) {
        cat = 'leader';
      } else if (officerWords.some((w) => name.includes(w) || lower.includes(w.toLowerCase()))) {
        cat = 'officer';
      } else if (soldierWords.some((w) => name.includes(w) || lower.includes(w.toLowerCase()))) {
        cat = 'soldier';
      }

      if (cat !== 'unassigned') newMappings[r.id] = cat;
      return { ...r, category: cat };
    });

    const leaderNames = autoCategorized.filter((r) => r.category === 'leader').map((r) => r.name);
    const officerNames = autoCategorized.filter((r) => r.category === 'officer').map((r) => r.name);
    const soldierNames = autoCategorized.filter((r) => r.category === 'soldier').map((r) => r.name);

    const updatedCfg = {
      ...currentCfg,
      leaderRanks: Array.from(new Set([...currentCfg.leaderRanks, ...leaderNames])),
      officerRanks: Array.from(new Set([...currentCfg.officerRanks, ...officerNames])),
      soldierRanks: Array.from(new Set([...currentCfg.soldierRanks, ...soldierNames])),
      discordRoles: autoCategorized,
      discordRoleMappings: newMappings,
    };

    const updated: DeveloperSettings = {
      ...settingsForm,
      roleCategoriesConfig: updatedCfg,
    };
    setSettingsForm(updated);
    onUpdateDeveloperSettings(updated);
    setDiscordRolesNotice('⚡ تم التصنيف التلقائي الذكي لجميع الرولات وتطبيقها على النظام!');
    setTimeout(() => setDiscordRolesNotice(null), 3500);
  };

  // Update specific sector template
  const handleSectorTemplateChange = (templateText: string) => {
    const updated: DeveloperSettings = {
      ...settingsForm,
      sectorTemplates: {
        ...(settingsForm.sectorTemplates || DEFAULT_SECTOR_TEMPLATES),
        [selectedTemplateSector]: templateText,
      },
    };
    setSettingsForm(updated);
  };

  // Reset selected sector template to its default
  const handleResetCurrentSectorTemplate = () => {
    const defaultForSector = DEFAULT_SECTOR_TEMPLATES[selectedTemplateSector];
    const updated: DeveloperSettings = {
      ...settingsForm,
      sectorTemplates: {
        ...(settingsForm.sectorTemplates || DEFAULT_SECTOR_TEMPLATES),
        [selectedTemplateSector]: defaultForSector,
      },
    };
    setSettingsForm(updated);
  };

  // Insert token into active template
  const insertToken = (token: string) => {
    const textarea = templateTextareaRef.current;
    const currentTemplate =
      settingsForm.sectorTemplates?.[selectedTemplateSector] ||
      DEFAULT_SECTOR_TEMPLATES[selectedTemplateSector];

    if (!textarea) {
      handleSectorTemplateChange(currentTemplate + ' ' + token);
      return;
    }
    const start = textarea.selectionStart ?? currentTemplate.length;
    const end = textarea.selectionEnd ?? currentTemplate.length;
    const newText = currentTemplate.substring(0, start) + token + currentTemplate.substring(end);
    handleSectorTemplateChange(newText);
  };

  // Save all developer settings
  const handleSaveDeveloperSettings = () => {
    onUpdateDeveloperSettings(settingsForm);
  };

  // Helper to instantly persist voice settings changes
  const updateVoiceField = (partial: Partial<DeveloperSettings>) => {
    const updated = { ...settingsForm, ...partial };
    setSettingsForm(updated);
    onUpdateDeveloperSettings(updated);
  };

  // Run Discord Configuration Diagnostics
  const handleRunDiagnostic = async () => {
    setIsDiagnosing(true);
    setSyncFeedback(null);
    try {
      const rep = await runDiscordDiagnostic({
        guildId: settingsForm.discordGuildId,
        channelId: settingsForm.discordVoiceChannelId,
        botToken: settingsForm.discordBotToken,
      });
      setDiagnosticReport(rep);
    } catch (err: any) {
      setSyncFeedback(`خطأ في فحص الاتصال: ${err?.message || ''}`);
    } finally {
      setIsDiagnosing(false);
    }
  };

  // Fix Swapped Guild and Channel IDs
  const handleFixSwappedIds = () => {
    if (!settingsForm.discordVoiceChannelId || !settingsForm.discordGuildId) return;
    const fixed = {
      ...settingsForm,
      discordGuildId: settingsForm.discordVoiceChannelId,
      discordVoiceChannelId: settingsForm.discordGuildId,
    };
    setSettingsForm(fixed);
    onUpdateDeveloperSettings(fixed);
    setDiagnosticReport(null);
    setSyncFeedback('✓ تم تصحيح وتبديل رقم السيرفر ورقم الروم بنجاح وحفظ الإعدادات!');
  };

  // Live Sync Voice Members from Discord
  const handleSyncDiscordVoice = async () => {
    setIsSyncingVoice(true);
    setSyncFeedback(null);
    try {
      const res = await fetchDiscordVoiceMembers({
        guildId: settingsForm.discordGuildId,
        channelId: settingsForm.discordVoiceChannelId,
        botToken: settingsForm.discordBotToken,
      });

      // If IDs were discovered to be swapped, auto-correct and persist
      if (res.wasSwapped && res.detectedGuildId && res.detectedChannelId) {
        const fixed = {
          ...settingsForm,
          discordGuildId: res.detectedGuildId,
          discordVoiceChannelId: res.detectedChannelId,
        };
        setSettingsForm(fixed);
        onUpdateDeveloperSettings(fixed);
      }

      if (res.success && res.members.length > 0) {
        onVoiceMembersChange(res.members);
        setSyncFeedback(`✅ تم سحب ${res.members.length} عضواً بنجاح من فويس الديسكورد وتحديث القائمة!`);
        setIsWidgetDisabled(false);
      } else {
        setSyncFeedback(res.message);
        if (res.isWidgetDisabled) {
          setIsWidgetDisabled(true);
          setShowWidgetGuide(true);
        }
      }
    } catch (e: any) {
      setSyncFeedback(`❌ خطأ في السحب: ${e?.message || 'تعذر الاتصال'}`);
    } finally {
      setIsSyncingVoice(false);
    }
  };

  // Quick Bulk Paste Voice Members
  const handleApplyBulkPaste = () => {
    if (!bulkPasteInput.trim()) return;
    const parsed = parseDiscordVoiceText(bulkPasteInput);
    if (parsed.length > 0) {
      onVoiceMembersChange(parsed);
      setBulkPasteInput('');
      setSyncFeedback(`✅ تم استيراد وتحويل ${parsed.length} عضواً إلى قائمة الفويس!`);
    }
  };

  // Add individual voice member
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.discordName || !newMember.gameId) return;

    const member: VoiceMember = {
      id: `m-${Date.now()}`,
      rank: newMember.rank,
      rankCode: newMember.militaryCode,
      militaryCode: newMember.militaryCode,
      gameId: newMember.gameId,
      discordName: newMember.discordName,
      discordUserId: newMember.discordUserId || String(Math.floor(100000000000000000 + Math.random() * 900000000000000000)),
      isAttending: false,
    };

    onVoiceMembersChange([member, ...voiceMembers]);
    setNewMember({
      rank: 'ملازم',
      militaryCode: 'I-99',
      gameId: '',
      discordName: '',
      discordUserId: '',
    });
  };

  const handleDeleteMember = (id: string) => {
    onVoiceMembersChange(voiceMembers.filter((m) => m.id !== id));
  };

  const sectorNamesList: { id: keyof typeof DEFAULT_DEVELOPER_SETTINGS.sectorLogos; nameAr: string; nameEn: string; code: string }[] = [
    { id: 'swat', nameAr: 'سوات', nameEn: 'Special Weapons and Tactics', code: 'SWAT' },
    { id: 'public_security', nameAr: 'الأمن العام', nameEn: 'Public Security', code: 'PS' },
    { id: 'armed_forces', nameAr: 'القوات المسلحة', nameEn: 'Armed Forces', code: 'AF' },
    { id: 'general_investigation', nameAr: 'المباحث العامة', nameEn: 'General Investigation', code: 'GS' },
  ];

  const safeLogos = settingsForm.sectorLogos || DEFAULT_DEVELOPER_SETTINGS.sectorLogos;
  const safeChannels = settingsForm.sectorChannels || DEFAULT_DEVELOPER_SETTINGS.sectorChannels;
  const safeStatus = settingsForm.sectorStatus || DEFAULT_DEVELOPER_SETTINGS.sectorStatus;
  const safeTemplates = settingsForm.sectorTemplates || DEFAULT_SECTOR_TEMPLATES;

  const availableRoles = settingsForm.roleCategoriesConfig?.discordRoles || DEFAULT_ROLE_CATEGORIES.discordRoles || [];
  const filteredDiscordRoles = availableRoles.filter((r) =>
    !discordRolesFilter.trim() ||
    r.name.toLowerCase().includes(discordRolesFilter.toLowerCase()) ||
    r.id.includes(discordRolesFilter)
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      {/* Hidden file input for sector logos */}
      <input
        type="file"
        ref={sectorFileInputRef}
        onChange={handleSectorLogoUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Hidden file input for main server logo */}
      <input
        type="file"
        ref={logoFileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUploadLogo(file);
        }}
        accept="image/*"
        className="hidden"
      />

      <div className="w-full max-w-5xl bg-[#0b0f19] border border-slate-800 rounded-2xl shadow-2xl flex flex-col h-[94vh] overflow-hidden text-right">
        {/* Header Bar */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">إعدادات النظام والتحكم بالمطور</h2>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-[10px] font-bold border border-blue-500/40">
                  PRAVA CORE v13.5
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                تفعيل وإقفال القطاعات، قوالب مخصصة لكل قطاع، وسحب أفراد الفويس مباشرة من الديسكورد
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Primary Tabs: Theme is FIRST as requested */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-4 pt-2 gap-2 text-xs shrink-0">
          {/* TAB 1: THEME & APPEARANCE (FIRST) */}
          <button
            type="button"
            onClick={() => setActiveTab('theme')}
            className={`py-2.5 px-5 rounded-t-xl font-bold transition flex items-center gap-2 cursor-pointer border-t border-x ${
              activeTab === 'theme'
                ? 'bg-[#0f1422] text-blue-400 border-slate-700 shadow-sm'
                : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Palette className="w-4 h-4 text-blue-400" />
            <span>تصميم وألوان الموقع (الكحلي / الأبيض / الذهبي)</span>
          </button>

          {/* TAB 2: DEVELOPER SETTINGS (SECOND) */}
          <button
            type="button"
            onClick={() => setActiveTab('developer')}
            className={`py-2.5 px-5 rounded-t-xl font-bold transition flex items-center gap-2 cursor-pointer border-t border-x ${
              activeTab === 'developer'
                ? 'bg-[#0f1422] text-amber-300 border-slate-700 shadow-sm'
                : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Code2 className="w-4 h-4 text-amber-400" />
            <span>إعدادات المطور الشاملة</span>
            {isDevUnlocked ? (
              <Unlock className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-amber-400" />
            )}
          </button>
        </div>

        {/* Tab 1: Theme Settings (3 colors) */}
        {activeTab === 'theme' && (
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            <div>
              <h3 className="text-base font-bold text-slate-100">اختر مظهر وألوان الموقع:</h3>
              <p className="text-xs text-slate-400 mt-1">
                يمكنك التبديل فوراً بين 3 تصاميم أساسية، ويتم حفظ اختيارك وتطبيقه تلقائياً:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Option 1: Navy */}
              <button
                type="button"
                onClick={() => onThemeChange('navy')}
                className={`p-4 rounded-2xl border text-right transition cursor-pointer flex flex-col justify-between h-40 relative overflow-hidden group ${
                  currentTheme === 'navy'
                    ? 'border-blue-500 bg-[#0b1329] shadow-xl shadow-blue-950/80 scale-[1.02]'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">
                    {currentTheme === 'navy' && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-sm font-bold text-slate-100">الكحلي التكتيكي</span>
                </div>
                <div className="space-y-2">
                  <div className="h-2.5 w-full bg-blue-600 rounded-full" />
                  <div className="h-2 w-3/4 bg-slate-700 rounded-full" />
                  <div className="h-2 w-1/2 bg-blue-950 rounded-full" />
                </div>
                <span className="text-xs text-blue-400 font-mono">Tactical Navy Blue</span>
              </button>

              {/* Option 2: Clean White */}
              <button
                type="button"
                onClick={() => onThemeChange('white')}
                className={`p-4 rounded-2xl border text-right transition cursor-pointer flex flex-col justify-between h-40 relative overflow-hidden group ${
                  currentTheme === 'white'
                    ? 'border-blue-600 bg-slate-100 text-slate-900 shadow-xl scale-[1.02]'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs">
                    {currentTheme === 'white' && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-sm font-bold text-slate-900">الأبيض القيادي</span>
                </div>
                <div className="space-y-2">
                  <div className="h-2.5 w-full bg-slate-800 rounded-full" />
                  <div className="h-2 w-3/4 bg-blue-600 rounded-full" />
                  <div className="h-2 w-1/2 bg-slate-300 rounded-full" />
                </div>
                <span className="text-xs text-slate-600 font-mono">Command White</span>
              </button>

              {/* Option 3: Prava Gold */}
              <button
                type="button"
                onClick={() => onThemeChange('gold')}
                className={`p-4 rounded-2xl border text-right transition cursor-pointer flex flex-col justify-between h-40 relative overflow-hidden group ${
                  currentTheme === 'gold'
                    ? 'border-amber-500 bg-[#120e06] shadow-xl shadow-amber-950/80 scale-[1.02]'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-slate-950 text-xs">
                    {currentTheme === 'gold' && <Check className="w-3.5 h-3.5 text-slate-950 font-bold" />}
                  </div>
                  <span className="text-sm font-bold text-amber-300">الذهبي الملكي</span>
                </div>
                <div className="space-y-2">
                  <div className="h-2.5 w-full bg-amber-500 rounded-full" />
                  <div className="h-2 w-3/4 bg-amber-700 rounded-full" />
                  <div className="h-2 w-1/2 bg-amber-950 rounded-full" />
                </div>
                <span className="text-xs text-amber-400 font-mono">Prava Luxury Gold</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Full Developer Suite */}
        {activeTab === 'developer' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {!isDevUnlocked ? (
              <div className="flex-1 flex items-center justify-center p-6">
                <form
                  onSubmit={handleUnlockDev}
                  className="w-full max-w-md p-8 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-4 shadow-xl"
                >
                  <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                    <Lock className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-white">منطقة إعدادات المطور المحمية</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    يرجى إدخال رمز المطور للوصول إلى تفعيل وإقفال القطاعات، قوالب الرسائل المنفصلة، وربط فويس الديسكورد.
                  </p>

                  <div className="space-y-3 pt-2">
                    <input
                      type="password"
                      value={devPinInput}
                      onChange={(e) => setDevPinInput(e.target.value)}
                      placeholder="أدخل رمز مرور المطور (PIN Code)"
                      autoFocus
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm text-center font-mono outline-none focus:border-amber-500"
                    />
                    {pinError && (
                      <div className="text-xs text-red-400 font-bold">الرمز غير صحيح، يرجى المحاولة مرة أخرى.</div>
                    )}
                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs transition cursor-pointer"
                    >
                      فتح لوحة المطور
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Developer Sidebar Sub-Sections */}
                <div className="w-full md:w-64 bg-slate-950 border-l border-slate-800 p-3 space-y-1.5 overflow-y-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setDevSection('status')}
                    className={`w-full p-2.5 rounded-xl text-right text-xs font-bold transition flex items-center gap-2.5 cursor-pointer ${
                      devSection === 'status'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>تفعيل وإقفال القطاعات (مفعل/قريباً)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDevSection('roles')}
                    className={`w-full p-2.5 rounded-xl text-right text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                      devSection === 'roles'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span>رولات ورتب اللعبة (قادة/ضباط/أفراد)</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 font-mono text-[9px] font-bold border border-amber-800">
                      مهم ⭐
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDevSection('templates')}
                    className={`w-full p-2.5 rounded-xl text-right text-xs font-bold transition flex items-center gap-2.5 cursor-pointer ${
                      devSection === 'templates'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-purple-400" />
                    <span>قوالب الرسائل (قالب لكل قطاع)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDevSection('voice')}
                    className={`w-full p-2.5 rounded-xl text-right text-xs font-bold transition flex items-center gap-2.5 cursor-pointer ${
                      devSection === 'voice'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <Mic className="w-4 h-4 text-cyan-400" />
                    <span>سحب أفراد الفويس من الديسكورد</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDevSection('sectors')}
                    className={`w-full p-2.5 rounded-xl text-right text-xs font-bold transition flex items-center gap-2.5 cursor-pointer ${
                      devSection === 'sectors'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    <span>شعارات وصور القطاعات</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDevSection('channels')}
                    className={`w-full p-2.5 rounded-xl text-right text-xs font-bold transition flex items-center gap-2.5 cursor-pointer ${
                      devSection === 'channels'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                    <span>رومات الرسائل والويب هوك</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDevSection('general')}
                    className={`w-full p-2.5 rounded-xl text-right text-xs font-bold transition flex items-center gap-2.5 cursor-pointer ${
                      devSection === 'general'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-pink-400" />
                    <span>الشعار وهوية السيرفر</span>
                  </button>

                  <div className="pt-4 border-t border-slate-800 text-[10px] text-slate-500 text-center">
                    جلسة المطور نشطة ومحمية
                  </div>
                </div>

                {/* Sub-Section Content Panel */}
                <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-[#0e1422]">
                  {/* SECTION 1: SECTORS STATUS TOGGLES (ENABLE / DISABLE) */}
                  {devSection === 'status' && (
                    <div className="space-y-4">
                      <div className="border-b border-slate-800 pb-2">
                        <h3 className="text-sm font-bold text-white">إدارة وتفعيل القطاعات (مفعل / قريباً):</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          حدد أي قطاع ترغب بتفعيله الآن ليتمكن الأعضاء من الدخول إليه، أو إقفاله بصفة "قريباً":
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {sectorNamesList.map((sec) => {
                          const isEnabled = safeStatus[sec.id] ?? false;

                          return (
                            <div
                              key={sec.id}
                              className={`p-4 rounded-xl border transition flex items-center justify-between ${
                                isEnabled
                                  ? 'bg-slate-900/90 border-emerald-500/40 shadow-sm'
                                  : 'bg-slate-950/60 border-slate-800/80 opacity-75'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => handleToggleSectorStatus(sec.id)}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                  isEnabled
                                    ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                                    : 'bg-slate-800 text-slate-400 hover:text-white'
                                }`}
                              >
                                {isEnabled ? (
                                  <>
                                    <ToggleRight className="w-4 h-4" />
                                    <span>مفعل الآن</span>
                                  </>
                                ) : (
                                  <>
                                    <ToggleLeft className="w-4 h-4" />
                                    <span>قريباً (مقفل)</span>
                                  </>
                                )}
                              </button>

                              <div className="text-right">
                                <div className="flex items-center gap-2 justify-end">
                                  <span className="text-xs font-bold text-white">{sec.nameAr}</span>
                                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                                    {sec.code}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                                  {sec.nameEn}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 leading-relaxed">
                        💡 عند تفعيل قطاع (مثل الأمن العام)، سيصبح فوراً قابلاً للنقر في شاشة البداية مع شارة "مفعل ✨" ويدخل الأعضاء لنظامه الخاص.
                      </div>
                    </div>
                  )}

                  {/* SECTION: GAME ROLES & RANKS (FIVE M / DISCORD MENTIONS) */}
                  {devSection === 'roles' && (
                    <div className="space-y-6">
                      <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-amber-400" />
                            <span>تخصيص رولات ورتب اللعبة وسيرفر الديسكورد بالمنشن (&lt;@&amp;ID&gt;):</span>
                          </h3>
                          <p className="text-xs text-slate-400 mt-1">
                            اكتب أو الصق منشنات رولات الديسكورد مباشرة مثل &lt;@&amp;1528036945618538618&gt; وعيّن كل رول كـ (<span className="text-amber-400 font-bold">قائد 👑</span> / <span className="text-indigo-400 font-bold">ضابط ⭐️</span> / <span className="text-emerald-400 font-bold">فرد ⚡</span>) لفرز الأعضاء تلقائياً في تقارير الديسكورد.
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={handleResetRolesToDefault}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                            <span>استعادة الافتراضي</span>
                          </button>
                        </div>
                      </div>

                      {rolesSaveNotice && (
                        <div className="p-2.5 rounded-xl bg-amber-950/70 border border-amber-500/60 text-amber-300 font-bold text-xs text-center animate-fadeIn shadow-lg">
                          {rolesSaveNotice}
                        </div>
                      )}

                      {/* Direct Discord Role Mentions Manager */}
                      <DiscordRoleMentionsManager
                        roleConfig={settingsForm.roleCategoriesConfig || DEFAULT_ROLE_CATEGORIES}
                        onUpdateRoleConfig={(updatedCfg) => {
                          const updated: DeveloperSettings = {
                            ...settingsForm,
                            roleCategoriesConfig: updatedCfg,
                          };
                          setSettingsForm(updated);
                          onUpdateDeveloperSettings(updated);
                        }}
                      />

                      {/* OPTIONAL: DISCORD BOT LIVE API ROLES FETCH */}
                      <div className="p-4 rounded-2xl bg-[#090e1a] border border-cyan-500/30 space-y-4 shadow-xl">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <Bot className="w-4 h-4 text-cyan-400" />
                              <h4 className="text-xs font-black text-white">
                                🔗 جلب الرولات تلقائياً عبر البوت (اختياري - Discord API Fetch)
                              </h4>
                              <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono text-[10px] font-bold">
                                {availableRoles.length} رول مسحوب
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1">
                              إذا كان لديك توكن بوت، يمكنك سحب كافة رولات السيرفر دفعة واحدة تلقائياً من ديسكورد.
                            </p>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={handleFetchDiscordRoles}
                              disabled={isFetchingDiscordRoles}
                              className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md disabled:opacity-50"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${isFetchingDiscordRoles ? 'animate-spin' : ''}`} />
                              <span>{isFetchingDiscordRoles ? 'جاري السحب...' : 'سحب الرولات من الديسكورد 📥'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Status Notice */}
                        {discordRolesNotice && (
                          <div className="p-2.5 rounded-xl bg-cyan-950/90 border border-cyan-500/60 text-cyan-200 text-xs font-bold text-center animate-fadeIn shadow-lg">
                            {discordRolesNotice}
                          </div>
                        )}

                        {/* Quick Connection Settings Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs">
                          <div>
                            <span className="text-slate-400 block mb-1 font-medium">معرف سيرفر الديسكورد (Guild / Server ID):</span>
                            <input
                              type="text"
                              value={settingsForm.discordGuildId}
                              onChange={(e) => {
                                const updated = { ...settingsForm, discordGuildId: e.target.value.trim() };
                                setSettingsForm(updated);
                                onUpdateDeveloperSettings(updated);
                              }}
                              placeholder="مثال: 123456789012345678"
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono text-xs outline-none focus:border-cyan-500"
                            />
                          </div>

                          <div>
                            <span className="text-slate-400 block mb-1 font-medium">توكن بوت الديسكورد (Bot Token):</span>
                            <input
                              type="password"
                              value={settingsForm.discordBotToken}
                              onChange={(e) => {
                                const updated = { ...settingsForm, discordBotToken: e.target.value.trim() };
                                setSettingsForm(updated);
                                onUpdateDeveloperSettings(updated);
                              }}
                              placeholder="أدخل توكن البوت للسحب المباشر..."
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono text-xs outline-none focus:border-cyan-500"
                            />
                          </div>
                        </div>

                        {availableRoles.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <span className="text-xs font-bold text-slate-200">
                                رتب ورولات الديسكورد المسحوبة ({availableRoles.length} رول):
                              </span>
                              <button
                                type="button"
                                onClick={handleAutoClassifyAll}
                                className="px-2.5 py-1 rounded-lg bg-indigo-950 border border-indigo-700/60 hover:bg-indigo-900 text-indigo-300 text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-sm"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                                <span>⚡ تصنيف ذكي تلقائي للجميع</span>
                              </button>
                            </div>

                            <div className="max-h-56 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-slate-950 border border-slate-800">
                              {filteredDiscordRoles.map((role) => (
                                <div
                                  key={role.id}
                                  className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-2 hover:border-slate-700 transition"
                                >
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="w-3 h-3 rounded-full shrink-0 border border-white/20 shadow-sm"
                                      style={{
                                        backgroundColor: role.color ? `#${role.color.toString(16).padStart(6, '0')}` : '#64748b',
                                      }}
                                    />
                                    <div>
                                      <span className="font-bold text-xs text-white block">{role.name}</span>
                                      <span className="text-[10px] font-mono text-slate-500">&lt;@&amp;{role.id}&gt;</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
                                    <button
                                      type="button"
                                      onClick={() => handleSetDiscordRoleCategory(role.id, 'leader')}
                                      className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                                        role.category === 'leader'
                                          ? 'bg-amber-500 text-slate-950'
                                          : 'text-amber-400/80 hover:text-amber-300'
                                      }`}
                                    >
                                      👑 قائد
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSetDiscordRoleCategory(role.id, 'officer')}
                                      className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                                        role.category === 'officer'
                                          ? 'bg-indigo-600 text-white'
                                          : 'text-indigo-400/80 hover:text-indigo-300'
                                      }`}
                                    >
                                      ⭐️ ضابط
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSetDiscordRoleCategory(role.id, 'soldier')}
                                      className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                                        role.category === 'soldier'
                                          ? 'bg-emerald-600 text-white'
                                          : 'text-emerald-400/80 hover:text-emerald-300'
                                      }`}
                                    >
                                      ⚡ فرد
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSetDiscordRoleCategory(role.id, 'unassigned')}
                                      className={`px-1.5 py-0.5 rounded text-[10px] transition cursor-pointer ${
                                        !role.category || role.category === 'unassigned'
                                          ? 'bg-slate-800 text-slate-300'
                                          : 'text-slate-500 hover:text-slate-300'
                                      }`}
                                    >
                                      تجاهل
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SECTION 2: SECTOR TEMPLATES (SEPARATE TEMPLATE PER SECTOR) */}
                  {devSection === 'templates' && (
                    <div className="space-y-4">
                      <div className="border-b border-slate-800 pb-2">
                        <h3 className="text-sm font-bold text-white">قوالب الرسائل المنفصلة لكل قطاع:</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          لكل قطاع قالبه الخاص بالكامل؛ اختر القطاع بالأسفل لتعديل صيغة رسالته المعتمدة:
                        </p>
                      </div>

                      {/* Sector Template Tabs */}
                      <div className="flex flex-wrap gap-2">
                        {sectorNamesList.map((sec) => (
                          <button
                            key={sec.id}
                            type="button"
                            onClick={() => setSelectedTemplateSector(sec.id)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                              selectedTemplateSector === sec.id
                                ? 'bg-purple-600 text-white shadow-md'
                                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                            }`}
                          >
                            <span>{sec.nameAr}</span>
                            <span className="font-mono text-[10px] opacity-75">({sec.code})</span>
                          </button>
                        ))}
                      </div>

                      {/* Token Insertion Chips */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-300">
                          انقر لإدراج المتغيرات في قالب ({sectorNamesList.find((s) => s.id === selectedTemplateSector)?.nameAr}):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { token: '{serverName}', label: 'اسم السيرفر' },
                            { token: '{sectorName}', label: 'اسم القطاع' },
                            { token: '{sectorCode}', label: 'كود القطاع' },
                            { token: '{event}', label: 'نوع الحدث' },
                            { token: '{stage}', label: 'المرحلة' },
                            { token: '{locationLine}', label: 'سطر الموقع' },
                            { token: '{dateTime}', label: 'التاريخ والوقت' },
                            { token: '{officer}', label: 'مسؤول التوثيق' },
                            { token: '{attendanceCount}', label: 'إجمالي الحضور' },
                            { token: '{leadersCount}', label: '👑 عدد القادة' },
                            { token: '{officersCount}', label: '⭐️ عدد الضباط' },
                            { token: '{soldiersCount}', label: '⚡ عدد الأفراد' },
                            { token: '{leadersList}', label: '👑 قائمة القادة' },
                            { token: '{officersList}', label: '⭐️ قائمة الضباط' },
                            { token: '{soldiersList}', label: '⚡ قائمة الأفراد الصافية' },
                            { token: '{membersList}', label: 'قائمة الحضور الشاملة' },
                            { token: '{mentions}', label: 'منشنات الديسكورد' },
                          ].map((t) => (
                            <button
                              key={t.token}
                              type="button"
                              onClick={() => insertToken(t.token)}
                              className="px-2 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700 text-purple-300 font-mono text-[10px] transition cursor-pointer"
                            >
                              + {t.label} ({t.token})
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Textarea for Selected Sector Template */}
                      <div>
                        <textarea
                          ref={templateTextareaRef}
                          rows={11}
                          value={
                            safeTemplates[selectedTemplateSector] ||
                            DEFAULT_SECTOR_TEMPLATES[selectedTemplateSector]
                          }
                          onChange={(e) => handleSectorTemplateChange(e.target.value)}
                          className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs leading-relaxed outline-none focus:border-purple-500 transition resize-y"
                        />
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <button
                          type="button"
                          onClick={handleResetCurrentSectorTemplate}
                          className="text-slate-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>استعادة القالب الافتراضي لقطاع ({sectorNamesList.find((s) => s.id === selectedTemplateSector)?.nameAr})</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SECTION 3: DISCORD VOICE CHANNELS & MEMBERS SYNC */}
                  {devSection === 'voice' && (
                    <div className="space-y-4">
                      <div className="border-b border-slate-800 pb-2">
                        <h3 className="text-sm font-bold text-white">سحب أفراد الفويس من الديسكورد مباشرة:</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          ربط الروم الصوتي ليقوم النظام بسحب اللاعبين المتواجدين في فويس الديسكورد بنقرة واحدة:
                        </p>
                      </div>

                      {/* Discord Connection Settings */}
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                          <Bot className="w-4 h-4 text-cyan-400" />
                          <span>إعدادات الاتصال بديسكورد بوت / روم الفويس:</span>
                        </div>

                        {/* Smart Discord Link Extractor */}
                        <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-800/60 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-bold text-blue-300">
                              <Sparkles className="w-4 h-4 text-amber-400" />
                              <span>المساعد الذكي: الصق رابط الروم أو دعوة السيرفر للاستخراج التلقائي</span>
                            </div>
                            <span className="text-[10px] text-blue-400 font-mono">تلقائي ⚡</span>
                          </div>
                          <input
                            type="text"
                            placeholder="الصق أي رابط هنا مثل: https://discord.com/channels/123/456 أو https://discord.gg/..."
                            onChange={(e) => {
                              const val = e.target.value.trim();
                              if (!val) return;
                              const extracted = extractDiscordIds(val);
                              if (extracted.guildId || extracted.channelId || extracted.inviteCode) {
                                const updated = {
                                  ...settingsForm,
                                  discordGuildId: extracted.guildId || extracted.inviteCode || settingsForm.discordGuildId,
                                  discordVoiceChannelId: extracted.channelId || settingsForm.discordVoiceChannelId,
                                };
                                setSettingsForm(updated);
                                onUpdateDeveloperSettings(updated);
                                setSmartNotice(`✓ تم استخراج البيانات تلقائياً: ${extracted.guildId ? `السيرفر (${extracted.guildId})` : ''} ${extracted.channelId ? `| الروم (${extracted.channelId})` : ''}`);
                                setTimeout(() => setSmartNotice(null), 5000);
                              }
                            }}
                            className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs outline-none focus:border-blue-400"
                          />
                          {smartNotice && (
                            <div className="text-[11px] text-emerald-400 font-bold bg-emerald-950/40 p-1.5 rounded-lg border border-emerald-700/50">
                              {smartNotice}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="text-[11px] text-slate-300 block mb-1">
                              آيدي روم الفويس (Voice Channel ID):
                            </label>
                            <input
                              type="text"
                              value={settingsForm.discordVoiceChannelId}
                              onChange={(e) => {
                                const val = e.target.value;
                                const extracted = extractDiscordIds(val);
                                const channelId = extracted.channelId || val;
                                const guildId = extracted.guildId || settingsForm.discordGuildId;
                                updateVoiceField({ discordVoiceChannelId: channelId, discordGuildId: guildId });
                              }}
                              placeholder="مثال: 1556636124099772469"
                              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs outline-none focus:border-cyan-500"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] text-slate-300 block mb-1">
                              آيدي سيرفر الديسكورد (Guild / Server ID):
                            </label>
                            <input
                              type="text"
                              value={settingsForm.discordGuildId}
                              onChange={(e) => {
                                const val = e.target.value;
                                const extracted = extractDiscordIds(val);
                                const guildId = extracted.guildId || extracted.inviteCode || val;
                                updateVoiceField({ discordGuildId: guildId });
                              }}
                              placeholder="مثال: 1556636121939841056 أو رابط الدعوة"
                              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs outline-none focus:border-cyan-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] text-slate-300 block mb-1">
                            توكن البوت (Discord Bot Token - اختياري للسحب التلقائي والمباشر):
                          </label>
                          <input
                            type="password"
                            value={settingsForm.discordBotToken}
                            onChange={(e) => updateVoiceField({ discordBotToken: e.target.value })}
                            placeholder="MTAyOTM4NDc1Ni4..."
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs outline-none focus:border-cyan-500"
                          />
                        </div>

                        {/* Action and Diagnostics Buttons */}
                        <div className="pt-2 flex flex-wrap items-center gap-2.5">
                          <button
                            type="button"
                            onClick={handleSyncDiscordVoice}
                            disabled={isSyncingVoice}
                            className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
                          >
                            <RefreshCw className={`w-4 h-4 ${isSyncingVoice ? 'animate-spin' : ''}`} />
                            <span>{isSyncingVoice ? 'جاري سحب المتواجدين...' : 'سحب ومزامنة المتواجدين في الفويس الآن 🔄'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleRunDiagnostic}
                            disabled={isDiagnosing}
                            className="px-3.5 py-2.5 rounded-xl bg-purple-950/80 hover:bg-purple-900/90 text-purple-200 border border-purple-700/60 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                          >
                            <Wrench className={`w-3.5 h-3.5 text-purple-400 ${isDiagnosing ? 'animate-spin' : ''}`} />
                            <span>{isDiagnosing ? 'جاري الفحص...' : 'فحص وتشخيص الأرقام والاتصال 🔍'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowWidgetGuide(!showWidgetGuide)}
                            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <span>طريقة تفعيل أداة السيرفر (Widget) 💡</span>
                          </button>

                          {syncFeedback && (
                            <span className="text-xs font-semibold text-cyan-300 block w-full mt-1">{syncFeedback}</span>
                          )}
                        </div>

                        {/* Interactive Diagnostic Report Card */}
                        {diagnosticReport && (
                          <div className="p-4 rounded-xl bg-slate-900/95 border border-purple-500/40 space-y-3 animate-fadeIn text-right">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                              <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                                <ShieldCheck className="w-4 h-4 text-purple-400" />
                                <span>تقرير فحص وتشخيص الأرقام والاتصال:</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setDiagnosticReport(null)}
                                className="text-slate-400 hover:text-white text-xs cursor-pointer"
                              >
                                إغلاق ✕
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                              {/* Guild ID Check */}
                              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-400 font-bold">آيدي السيرفر (Guild):</span>
                                  {diagnosticReport.guildIdStatus.valid ? (
                                    <span className="text-emerald-400 flex items-center gap-1 font-bold">
                                      <CheckCircle2 className="w-3.5 h-3.5" /> سليم
                                    </span>
                                  ) : (
                                    <span className="text-amber-400 flex items-center gap-1 font-bold">
                                      <AlertTriangle className="w-3.5 h-3.5" /> تنبيه
                                    </span>
                                  )}
                                </div>
                                <div className="text-slate-300 font-mono text-[10px] truncate">
                                  {diagnosticReport.guildIdStatus.value}
                                </div>
                                <div className="text-[10px] text-slate-400">{diagnosticReport.guildIdStatus.message}</div>
                              </div>

                              {/* Channel ID Check */}
                              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-400 font-bold">آيدي روم الفويس (Channel):</span>
                                  {diagnosticReport.channelIdStatus.valid ? (
                                    <span className="text-emerald-400 flex items-center gap-1 font-bold">
                                      <CheckCircle2 className="w-3.5 h-3.5" /> سليم
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-[10px]">فحص عام</span>
                                  )}
                                </div>
                                <div className="text-slate-300 font-mono text-[10px] truncate">
                                  {diagnosticReport.channelIdStatus.value}
                                </div>
                                <div className="text-[10px] text-slate-400">{diagnosticReport.channelIdStatus.message}</div>
                              </div>

                              {/* Widget Status */}
                              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-400 font-bold">حالة أداة السيرفر (Widget):</span>
                                  {diagnosticReport.widgetStatus.ok ? (
                                    <span className="text-emerald-400 flex items-center gap-1 font-bold">
                                      <CheckCircle2 className="w-3.5 h-3.5" /> نشطة
                                    </span>
                                  ) : (
                                    <span className="text-amber-400 flex items-center gap-1 font-bold">
                                      <AlertTriangle className="w-3.5 h-3.5" /> غير نشطة
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-300 leading-relaxed">
                                  {diagnosticReport.widgetStatus.statusText}
                                </div>
                              </div>

                              {/* Bot Status */}
                              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-400 font-bold">حالة البوت (Bot Token):</span>
                                  {diagnosticReport.botStatus.provided ? (
                                    diagnosticReport.botStatus.ok ? (
                                      <span className="text-emerald-400 flex items-center gap-1 font-bold">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> متصل
                                      </span>
                                    ) : (
                                      <span className="text-red-400 flex items-center gap-1 font-bold">
                                        <AlertTriangle className="w-3.5 h-3.5" /> غير صالح
                                      </span>
                                    )
                                  ) : (
                                    <span className="text-slate-500 text-[10px]">غير مدخل</span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-300 leading-relaxed">
                                  {diagnosticReport.botStatus.message || 'السحب يعمل أيضاً بدون بوت إذا كانت أداة السيرفر مفعلة.'}
                                </div>
                              </div>
                            </div>

                            {/* Recommendation & Auto-Fix */}
                            <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-700/50 flex flex-wrap items-center justify-between gap-2">
                              <div className="text-xs text-purple-200">
                                <strong>النتيجة والتوصية: </strong>
                                <span>{diagnosticReport.recommendation}</span>
                              </div>

                              {diagnosticReport.canAutoFixSwap && (
                                <button
                                  type="button"
                                  onClick={handleFixSwappedIds}
                                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                                >
                                  <ArrowUpDown className="w-3.5 h-3.5" />
                                  <span>تبديل وتصحيح ترتيب الآيديات تلقائياً ⚡</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Step-by-Step Widget Activation Guide */}
                        {(showWidgetGuide || isWidgetDisabled) && (
                          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/50 space-y-3 animate-fadeIn text-right">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                                <AlertCircle className="w-4 h-4 text-amber-400" />
                                <span>خطوات تفعيل أداة السيرفر (Server Widget) في ديسكورد (10 ثوانٍ فقط):</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowWidgetGuide(false);
                                  setIsWidgetDisabled(false);
                                }}
                                className="text-slate-400 hover:text-white text-xs cursor-pointer"
                              >
                                إغلاق ✕
                              </button>
                            </div>

                            <div className="space-y-2 text-xs text-slate-200 leading-relaxed pr-1">
                              <div className="flex items-start gap-2">
                                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">1</span>
                                <p>افتح تطبيق <strong>الديسكورد</strong>، واضغط كليك يمين على اسم السيرفر (سيرفر برافا).</p>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">2</span>
                                <p>اضغط على <strong>إعدادات السيرفر (Server Settings)</strong>.</p>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">3</span>
                                <p>انزل في القائمة الجانبية واختر <strong>الأداة (Widget)</strong>.</p>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">4</span>
                                <p>فعّل زر <strong>"تفعيل أداة السيرفر (Enable Server Widget)"</strong>، وفي خانة القناة الصوتية حدد روم الفويس المطلوب.</p>
                              </div>
                              <div className="flex items-start gap-2 pt-1 border-t border-slate-800">
                                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">✓</span>
                                <p className="text-emerald-300 font-bold">بمجرد تفعيلها في الديسكورد، اضغط زر "سحب ومزامنة المتواجدين" هنا وسيسحب الجميع فوراً وبدون أي بوت!</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Quick Bulk Paste from Discord */}
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                          <ClipboardPaste className="w-4 h-4 text-amber-400" />
                          <span>أو نسخ ولصق مباشر لأسماء المتواجدين بالفويس:</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          انسخ أسماء المتواجدين من فويس الديسكورد والصقهم هنا؛ وسيقوم النظام بتفصيل الرتب والكود العسكري والآيدي تلقائياً:
                        </p>
                        <div className="flex gap-2">
                          <textarea
                            rows={3}
                            value={bulkPasteInput}
                            onChange={(e) => setBulkPasteInput(e.target.value)}
                            placeholder="FY | ⭐ I-85 y3s 422&#10;SWAT | ملازم I-14 Nawaf 1551&#10;264636"
                            className="flex-1 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs outline-none focus:border-amber-500 resize-none"
                          />
                          <button
                            type="button"
                            onClick={handleApplyBulkPaste}
                            className="px-4 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer flex flex-col items-center justify-center gap-1 shrink-0"
                          >
                            <ClipboardPaste className="w-4 h-4" />
                            <span>تحويل واستيراد</span>
                          </button>
                        </div>
                      </div>

                      {/* Current Voice Members List */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-200">الأعضاء المسجلين حالياً في الفويس ({voiceMembers.length}):</span>
                        </div>

                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {voiceMembers.map((m) => (
                            <div
                              key={m.id}
                              className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                            >
                              <button
                                type="button"
                                onClick={() => handleDeleteMember(m.id)}
                                className="text-slate-500 hover:text-red-400 p-1 cursor-pointer"
                                title="حذف"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white">{m.discordName}</span>
                                <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono text-[10px]">{m.gameId}</span>
                                <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-400 font-mono text-[10px]">{m.militaryCode}</span>
                                <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 text-[10px]">{m.rank}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SECTION 4: SECTOR LOGOS */}
                  {devSection === 'sectors' && (
                    <div className="space-y-4">
                      <div className="border-b border-slate-800 pb-2">
                        <h3 className="text-sm font-bold text-white">تعديل صور وشعارات القطاعات الأربعة:</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          ارفع شعاراً مخصصاً لكل قطاع (سوات، الأمن العام، القوات المسلحة، المباحث العامة).
                        </p>
                      </div>

                      {logoSaveNotice && (
                        <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-500/60 text-emerald-300 font-bold text-xs text-center animate-fadeIn shadow-lg">
                          {logoSaveNotice}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {sectorNamesList.map((sec) => {
                          const currentLogo = safeLogos[sec.id];

                          return (
                            <div
                              key={sec.id}
                              className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 shadow-md"
                            >
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setUploadTargetSector(sec.id);
                                    sectorFileInputRef.current?.click();
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-amber-600/20 border border-amber-500/40 hover:bg-amber-600/30 text-amber-300 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                                >
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>تغيير</span>
                                </button>

                                {currentLogo && (
                                  <button
                                    type="button"
                                    onClick={() => handleResetSectorLogo(sec.id)}
                                    className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-red-400 transition cursor-pointer"
                                    title="استعادة الافتراضي"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <div className="text-xs font-bold text-white">{sec.nameAr}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">{sec.code} — {sec.nameEn}</div>
                                  {currentLogo ? (
                                    <span className="text-[10px] text-emerald-400 font-bold">شعار مخصص مفعّل ✓</span>
                                  ) : (
                                    <span className="text-[10px] text-slate-500">الشعار الافتراضي</span>
                                  )}
                                </div>

                                <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 flex items-center justify-center p-1 shrink-0">
                                  {currentLogo ? (
                                    <img
                                      src={currentLogo}
                                      alt={sec.nameAr}
                                      className="w-full h-full object-cover rounded-lg"
                                    />
                                  ) : sec.id === 'swat' ? (
                                    <SwatEmblem className="w-full h-full" />
                                  ) : (
                                    <span className="text-xs font-mono font-bold text-slate-400">{sec.code}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* SECTION 5: DISCORD TEXT CHANNELS */}
                  {devSection === 'channels' && (
                    <div className="space-y-4">
                      <div className="border-b border-slate-800 pb-2">
                        <h3 className="text-sm font-bold text-white">تعديل رومات الرسائل بالديسكورد:</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          حدد رابط روم السناريوهات الخاص بكل قطاع ليتم التوجه إليه تلقائياً عند الضغط على زر النسخ:
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-bold text-blue-400 block mb-1">
                            رابط روم سناريوهات سوات (SWAT Channel URL):
                          </label>
                          <input
                            type="text"
                            value={safeChannels.swat}
                            onChange={(e) =>
                              setSettingsForm({
                                ...settingsForm,
                                sectorChannels: { ...safeChannels, swat: e.target.value },
                              })
                            }
                            placeholder="https://discord.com/channels/..."
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono outline-none focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-emerald-400 block mb-1">
                            رابط روم سناريوهات الأمن العام (Public Security):
                          </label>
                          <input
                            type="text"
                            value={safeChannels.public_security}
                            onChange={(e) =>
                              setSettingsForm({
                                ...settingsForm,
                                sectorChannels: { ...safeChannels, public_security: e.target.value },
                              })
                            }
                            placeholder="https://discord.com/channels/..."
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono outline-none focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-amber-400 block mb-1">
                            رابط روم سناريوهات القوات المسلحة (Armed Forces):
                          </label>
                          <input
                            type="text"
                            value={safeChannels.armed_forces}
                            onChange={(e) =>
                              setSettingsForm({
                                ...settingsForm,
                                sectorChannels: { ...safeChannels, armed_forces: e.target.value },
                              })
                            }
                            placeholder="https://discord.com/channels/..."
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono outline-none focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-purple-400 block mb-1">
                            رابط روم سناريوهات المباحث (General Investigation):
                          </label>
                          <input
                            type="text"
                            value={safeChannels.general_investigation}
                            onChange={(e) =>
                              setSettingsForm({
                                ...settingsForm,
                                sectorChannels: { ...safeChannels, general_investigation: e.target.value },
                              })
                            }
                            placeholder="https://discord.com/channels/..."
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono outline-none focus:border-amber-500"
                          />
                        </div>

                        <div className="pt-2 border-t border-slate-800">
                          <label className="text-xs font-bold text-slate-300 block mb-1">
                            رابط الويب هوك المباشر (Discord Webhook URL - اختياري):
                          </label>
                          <input
                            type="text"
                            value={settingsForm.discordWebhook || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, discordWebhook: e.target.value })}
                            placeholder="https://discord.com/api/webhooks/..."
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SECTION 6: GENERAL SERVER IDENTITY */}
                  {devSection === 'general' && (
                    <div className="space-y-4">
                      <div className="border-b border-slate-800 pb-2">
                        <h3 className="text-sm font-bold text-white">شعار وهوية السيرفر الرئيسية:</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          تثبيت الشعار الرئيسي (PRAVA LOG.png) وتعديل اسم السيرفر ورمز المطور.
                        </p>
                      </div>

                      {/* Logo uploader */}
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => logoFileInputRef.current?.click()}
                            className="py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
                          >
                            <Upload className="w-4 h-4" />
                            <span>رفع وتثبيت الشعار الرسمي (PRAVA LOG.png)</span>
                          </button>

                          {customLogoUrl && (
                            <button
                              type="button"
                              onClick={onResetLogo}
                              className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-red-400 transition cursor-pointer"
                              title="استعادة الشعار المدمج"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-xs font-bold text-white block">الشعار الرئيسي المعتمد</span>
                            <span className="text-[10px] text-slate-400">يثبت لجميع الزوار بدون إمكانية التعديل</span>
                          </div>
                          <BravaEmblem customLogoUrl={customLogoUrl} className="w-14 h-14" />
                        </div>
                      </div>

                      {/* Server Identity Inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-300 block mb-1">اسم السيرفر المعتمد:</label>
                          <input
                            type="text"
                            value={settingsForm.serverName || DEFAULT_DEVELOPER_SETTINGS.serverName}
                            onChange={(e) => setSettingsForm({ ...settingsForm, serverName: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-amber-500 font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-300 block mb-1">الوصف الفرعي:</label>
                          <input
                            type="text"
                            value={settingsForm.serverSubtitle || DEFAULT_DEVELOPER_SETTINGS.serverSubtitle}
                            onChange={(e) => setSettingsForm({ ...settingsForm, serverSubtitle: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>

                      {/* Developer PIN (Masked securely) */}
                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">رمز مرور المطور (PIN Code):</label>
                        <input
                          type="password"
                          value={settingsForm.developerPin || '1022'}
                          onChange={(e) => setSettingsForm({ ...settingsForm, developerPin: e.target.value })}
                          className="w-48 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono text-center outline-none focus:border-amber-500"
                        />
                      </div>

                      {/* Private Owner Backup / Code Download (Hidden behind PIN 1022) */}
                      <div className="pt-4 border-t border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-amber-400" />
                            <span>تنزيل ملفات المشروع (خاص بالمالك فقط 🔒):</span>
                          </label>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          هذا القسم مخفي تماماً عن الزوار، ولا يظهر إلا بعد إدخال رمز المطور (1022). اضغط بالأسفل لبدء التنزيل المباشر داخل المتصفح:
                        </p>
                        <button
                          type="button"
                          onClick={handleDownloadZipBlob}
                          disabled={isDownloadingZip}
                          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isDownloadingZip ? 'animate-spin' : ''}`} />
                          <span>{isDownloadingZip ? 'جاري تجهيز وبدء التنزيل...' : '📦 تنزيل ملفات المشروع (prava-rp-project.zip)'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Bar */}
        <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400">
            {isDevUnlocked && activeTab === 'developer' && (
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>يتم حفظ وتثبيت كافة التغييرات فوراً في النظام</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
            >
              إغلاق
            </button>
            {isDevUnlocked && activeTab === 'developer' && (
              <button
                type="button"
                onClick={() => {
                  handleSaveDeveloperSettings();
                  onClose();
                }}
                className="px-6 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold shadow-lg shadow-amber-600/20 cursor-pointer"
              >
                حفظ وإغلاق
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
