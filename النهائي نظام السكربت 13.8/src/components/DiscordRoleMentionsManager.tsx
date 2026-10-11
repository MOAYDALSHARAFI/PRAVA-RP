import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Trash2,
  Plus,
  ShieldAlert,
  ArrowRightLeft,
  Crown,
  Star,
  Zap,
  Info,
} from 'lucide-react';
import { RoleCategoriesConfig, DiscordServerRole } from '../types';
import { extractRoleIds } from '../utils/discordVoiceSync';

interface DiscordRoleMentionsManagerProps {
  roleConfig: RoleCategoriesConfig;
  onUpdateRoleConfig: (updated: RoleCategoriesConfig) => void;
  onClose?: () => void;
}

// Sample roles provided by user
const SAMPLE_USER_ROLES = [
  '<@&1528036945618538618>',
  '<@&1528036944007659520>',
  '<@&1528036937561014293>',
  '<@&152803697433647225>',
];

export const DiscordRoleMentionsManager: React.FC<DiscordRoleMentionsManagerProps> = ({
  roleConfig,
  onUpdateRoleConfig,
  onClose,
}) => {
  const [inputText, setInputText] = useState('');
  const [directLeaderInput, setDirectLeaderInput] = useState('');
  const [directOfficerInput, setDirectOfficerInput] = useState('');
  const [directSoldierInput, setDirectSoldierInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [roleCustomNames, setRoleCustomNames] = useState<Record<string, string>>({});

  // Extract all role IDs from the input text
  const detectedRoleIds = useMemo(() => {
    return extractRoleIds(inputText);
  }, [inputText]);

  // Current categorized role IDs and ranks
  const leaderRoleIds = roleConfig.leaderRoleIds || [];
  const officerRoleIds = roleConfig.officerRoleIds || [];
  const soldierRoleIds = roleConfig.soldierRoleIds || [];
  const leaderRanks = roleConfig.leaderRanks || [];
  const officerRanks = roleConfig.officerRanks || [];
  const soldierRanks = roleConfig.soldierRanks || [];
  const discordRoles = roleConfig.discordRoles || [];
  const mappings = roleConfig.discordRoleMappings || {};

  // Find assignment status for a given role ID
  const getRoleAssignment = (id: string): 'leader' | 'officer' | 'soldier' | 'unassigned' => {
    if (mappings[id] === 'leader' || leaderRoleIds.includes(id)) return 'leader';
    if (mappings[id] === 'officer' || officerRoleIds.includes(id)) return 'officer';
    if (mappings[id] === 'soldier' || soldierRoleIds.includes(id)) return 'soldier';
    const found = discordRoles.find((r) => r.id === id);
    if (found?.category && found.category !== 'unassigned') return found.category;
    return 'unassigned';
  };

  const getRoleName = (id: string): string => {
    if (roleCustomNames[id]) return roleCustomNames[id];
    const found = discordRoles.find((r) => r.id === id);
    if (found?.name && !found.name.startsWith('<@&')) return found.name;
    return `<@&${id}>`;
  };

  const showNotification = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  // Assign a single role ID to a specific category
  const handleAssignRole = (id: string, category: 'leader' | 'officer' | 'soldier' | 'unassigned') => {
    let newLeaderIds = leaderRoleIds.filter((r) => r !== id);
    let newOfficerIds = officerRoleIds.filter((r) => r !== id);
    let newSoldierIds = soldierRoleIds.filter((r) => r !== id);
    const newMappings = { ...mappings };
    const newDiscordRoles: DiscordServerRole[] = [...discordRoles];

    if (category === 'leader') {
      newLeaderIds.push(id);
      newMappings[id] = 'leader';
    } else if (category === 'officer') {
      newOfficerIds.push(id);
      newMappings[id] = 'officer';
    } else if (category === 'soldier') {
      newSoldierIds.push(id);
      newMappings[id] = 'soldier';
    } else {
      delete newMappings[id];
    }

    // Sync discordRoles array
    const existingIdx = newDiscordRoles.findIndex((r) => r.id === id);
    const customName = roleCustomNames[id] || (existingIdx !== -1 ? newDiscordRoles[existingIdx].name : `<@&${id}>`);

    if (existingIdx !== -1) {
      newDiscordRoles[existingIdx] = {
        ...newDiscordRoles[existingIdx],
        category,
        name: customName,
      };
    } else if (category !== 'unassigned') {
      newDiscordRoles.push({
        id,
        name: customName,
        category,
      });
    }

    const updatedCfg: RoleCategoriesConfig = {
      ...roleConfig,
      leaderRoleIds: Array.from(new Set(newLeaderIds)),
      officerRoleIds: Array.from(new Set(newOfficerIds)),
      soldierRoleIds: Array.from(new Set(newSoldierIds)),
      discordRoles: newDiscordRoles,
      discordRoleMappings: newMappings,
      strictDiscordRolesOnly: true,
    };

    onUpdateRoleConfig(updatedCfg);

    const catName =
      category === 'leader'
        ? '👑 القادة'
        : category === 'officer'
        ? '⭐️ الضباط'
        : category === 'soldier'
        ? '⚡ الأفراد'
        : 'تم إلغاء التعيين';
    showNotification(`✅ تم تعيين الرول <@&${id}> في ${catName}!`);
  };

  // Direct addition of role mention or rank name to a category
  const handleAddDirect = (category: 'leader' | 'officer' | 'soldier', text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const extracted = extractRoleIds(trimmed);
    if (extracted.length > 0) {
      // Add all extracted IDs
      let newLeaderIds = [...leaderRoleIds];
      let newOfficerIds = [...officerRoleIds];
      let newSoldierIds = [...soldierRoleIds];
      const newMappings = { ...mappings };
      const newDiscordRoles = [...discordRoles];

      extracted.forEach((id) => {
        newLeaderIds = newLeaderIds.filter((r) => r !== id);
        newOfficerIds = newOfficerIds.filter((r) => r !== id);
        newSoldierIds = newSoldierIds.filter((r) => r !== id);

        if (category === 'leader') newLeaderIds.push(id);
        else if (category === 'officer') newOfficerIds.push(id);
        else newSoldierIds.push(id);

        newMappings[id] = category;

        const existing = newDiscordRoles.find((r) => r.id === id);
        if (existing) {
          existing.category = category;
        } else {
          newDiscordRoles.push({
            id,
            name: `<@&${id}>`,
            category,
          });
        }
      });

      const updatedCfg: RoleCategoriesConfig = {
        ...roleConfig,
        leaderRoleIds: Array.from(new Set(newLeaderIds)),
        officerRoleIds: Array.from(new Set(newOfficerIds)),
        soldierRoleIds: Array.from(new Set(newSoldierIds)),
        discordRoles: newDiscordRoles,
        discordRoleMappings: newMappings,
        strictDiscordRolesOnly: true,
      };

      onUpdateRoleConfig(updatedCfg);
      showNotification(`✅ تمت إضافة ${extracted.length} رول إلى ${category === 'leader' ? '👑 القادة' : category === 'officer' ? '⭐️ الضباط' : '⚡ الأفراد'}!`);
    } else {
      // Plain text rank
      let newLeaderRanks = [...leaderRanks];
      let newOfficerRanks = [...officerRanks];
      let newSoldierRanks = [...soldierRanks];

      if (category === 'leader' && !newLeaderRanks.includes(trimmed)) newLeaderRanks.push(trimmed);
      else if (category === 'officer' && !newOfficerRanks.includes(trimmed)) newOfficerRanks.push(trimmed);
      else if (category === 'soldier' && !newSoldierRanks.includes(trimmed)) newSoldierRanks.push(trimmed);

      const updatedCfg: RoleCategoriesConfig = {
        ...roleConfig,
        leaderRanks: Array.from(new Set(newLeaderRanks)),
        officerRanks: Array.from(new Set(newOfficerRanks)),
        soldierRanks: Array.from(new Set(newSoldierRanks)),
      };
      onUpdateRoleConfig(updatedCfg);
      showNotification(`✅ تمت إضافة الرتبة "${trimmed}"!`);
    }

    if (category === 'leader') setDirectLeaderInput('');
    else if (category === 'officer') setDirectOfficerInput('');
    else setDirectSoldierInput('');
  };

  // Remove role ID or text rank
  const handleRemove = (category: 'leader' | 'officer' | 'soldier', item: string) => {
    const isId = /^[0-9]{15,22}$/.test(item);

    let newLeaderIds = [...leaderRoleIds];
    let newOfficerIds = [...officerRoleIds];
    let newSoldierIds = [...soldierRoleIds];
    let newLeaderRanks = [...leaderRanks];
    let newOfficerRanks = [...officerRanks];
    let newSoldierRanks = [...soldierRanks];
    const newMappings = { ...mappings };
    const newDiscordRoles = [...discordRoles];

    if (isId) {
      newLeaderIds = newLeaderIds.filter((r) => r !== item);
      newOfficerIds = newOfficerIds.filter((r) => r !== item);
      newSoldierIds = newSoldierIds.filter((r) => r !== item);
      delete newMappings[item];
      const rIdx = newDiscordRoles.findIndex((r) => r.id === item);
      if (rIdx !== -1) newDiscordRoles[rIdx].category = 'unassigned';
    } else {
      if (category === 'leader') newLeaderRanks = newLeaderRanks.filter((r) => r !== item);
      else if (category === 'officer') newOfficerRanks = newOfficerRanks.filter((r) => r !== item);
      else newSoldierRanks = newSoldierRanks.filter((r) => r !== item);
    }

    const updatedCfg: RoleCategoriesConfig = {
      ...roleConfig,
      leaderRoleIds: newLeaderIds,
      officerRoleIds: newOfficerIds,
      soldierRoleIds: newSoldierIds,
      leaderRanks: newLeaderRanks,
      officerRanks: newOfficerRanks,
      soldierRanks: newSoldierRanks,
      discordRoles: newDiscordRoles,
      discordRoleMappings: newMappings,
      strictDiscordRolesOnly: true,
    };
    onUpdateRoleConfig(updatedCfg);
    showNotification(`🗑️ تم الحذف: ${item}`);
  };

  // Move an item from one category to another
  const handleMoveCategory = (
    fromCat: 'leader' | 'officer' | 'soldier',
    toCat: 'leader' | 'officer' | 'soldier',
    item: string
  ) => {
    const isId = /^[0-9]{15,22}$/.test(item);
    if (isId) {
      handleAssignRole(item, toCat);
    } else {
      handleRemove(fromCat, item);
      handleAddDirect(toCat, item);
    }
  };

  // Batch assign all detected IDs to a specific category
  const handleBatchAssign = (category: 'leader' | 'officer' | 'soldier') => {
    if (detectedRoleIds.length === 0) return;

    let newLeaderIds = [...leaderRoleIds];
    let newOfficerIds = [...officerRoleIds];
    let newSoldierIds = [...soldierRoleIds];
    const newMappings = { ...mappings };
    const newDiscordRoles = [...discordRoles];

    detectedRoleIds.forEach((id) => {
      newLeaderIds = newLeaderIds.filter((r) => r !== id);
      newOfficerIds = newOfficerIds.filter((r) => r !== id);
      newSoldierIds = newSoldierIds.filter((r) => r !== id);

      if (category === 'leader') newLeaderIds.push(id);
      else if (category === 'officer') newOfficerIds.push(id);
      else newSoldierIds.push(id);

      newMappings[id] = category;

      const existing = newDiscordRoles.find((r) => r.id === id);
      const name = roleCustomNames[id] || (existing ? existing.name : `<@&${id}>`);
      if (existing) {
        existing.category = category;
        existing.name = name;
      } else {
        newDiscordRoles.push({ id, name, category });
      }
    });

    const updatedCfg: RoleCategoriesConfig = {
      ...roleConfig,
      leaderRoleIds: Array.from(new Set(newLeaderIds)),
      officerRoleIds: Array.from(new Set(newOfficerIds)),
      soldierRoleIds: Array.from(new Set(newSoldierIds)),
      discordRoles: newDiscordRoles,
      discordRoleMappings: newMappings,
      strictDiscordRolesOnly: true,
    };

    onUpdateRoleConfig(updatedCfg);
    const catName = category === 'leader' ? '👑 القادة' : category === 'officer' ? '⭐️ الضباط' : '⚡ الأفراد';
    showNotification(`✅ تم تعيين جميع الرولات المكتشفة (${detectedRoleIds.length}) في ${catName}!`);
  };

  // Sequential Auto-Distribution: 1st -> Leaders, 2nd -> Officers, remaining -> Soldiers!
  const handleSequentialDistribution = () => {
    if (detectedRoleIds.length === 0) return;

    let newLeaderIds = [...leaderRoleIds];
    let newOfficerIds = [...officerRoleIds];
    let newSoldierIds = [...soldierRoleIds];
    const newMappings = { ...mappings };
    const newDiscordRoles = [...discordRoles];

    detectedRoleIds.forEach((id, index) => {
      newLeaderIds = newLeaderIds.filter((r) => r !== id);
      newOfficerIds = newOfficerIds.filter((r) => r !== id);
      newSoldierIds = newSoldierIds.filter((r) => r !== id);

      let targetCat: 'leader' | 'officer' | 'soldier';
      if (index === 0) targetCat = 'leader'; // First role to Leaders 👑
      else if (index === 1) targetCat = 'officer'; // Second role to Officers ⭐️
      else targetCat = 'soldier'; // Remaining to Soldiers ⚡

      if (targetCat === 'leader') newLeaderIds.push(id);
      else if (targetCat === 'officer') newOfficerIds.push(id);
      else newSoldierIds.push(id);

      newMappings[id] = targetCat;

      const existing = newDiscordRoles.find((r) => r.id === id);
      const name = roleCustomNames[id] || (existing ? existing.name : `<@&${id}>`);
      if (existing) {
        existing.category = targetCat;
        existing.name = name;
      } else {
        newDiscordRoles.push({ id, name, category: targetCat });
      }
    });

    const updatedCfg: RoleCategoriesConfig = {
      ...roleConfig,
      leaderRoleIds: Array.from(new Set(newLeaderIds)),
      officerRoleIds: Array.from(new Set(newOfficerIds)),
      soldierRoleIds: Array.from(new Set(newSoldierIds)),
      discordRoles: newDiscordRoles,
      discordRoleMappings: newMappings,
      strictDiscordRolesOnly: true,
    };

    onUpdateRoleConfig(updatedCfg);
    showNotification(`⚡ تم التوزيع الذكي: الرول الأول في القادة 👑، الثاني في الضباط ⭐️، والباقي في الأفراد ⚡!`);
  };

  // Clear all roles and mappings
  const handleClearAllRoles = () => {
    const updatedCfg: RoleCategoriesConfig = {
      ...roleConfig,
      leaderRoleIds: [],
      officerRoleIds: [],
      soldierRoleIds: [],
      leaderRanks: [],
      officerRanks: [],
      soldierRanks: [],
      discordRoles: [],
      discordRoleMappings: {},
      strictDiscordRolesOnly: true,
    };
    onUpdateRoleConfig(updatedCfg);
    showNotification('🗑️ تم تفريغ كافة الرولات والرتب المخصصة.');
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans" dir="rtl">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/70 via-indigo-950/60 to-purple-950/70 border border-cyan-800/40 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-md">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>تحديد رولات ومنشنات الديسكورد</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-900/80 text-cyan-300 font-mono border border-cyan-700/60 font-normal">
                  &lt;@&amp;ID&gt;
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                الصق رولات الديسكورد كمنشنات أو آيديات مباشرة، وحدد رول القادة، الضباط، والأفراد بضغطة زر واحدة!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setInputText(SAMPLE_USER_ROLES.join(' '))}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="تجربة رولات المقترحة من الديسكورد"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>📋 تجربة منشنات جاهزة</span>
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                إغلاق
              </button>
            )}
          </div>
        </div>

        {/* Live Notification Toast */}
        {notice && (
          <div className="p-2.5 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-xs font-bold text-center animate-fadeIn shadow-lg">
            {notice}
          </div>
        )}
      </div>

      {/* Main Mentions Input Area */}
      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 shadow-inner">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
            <span>الصق منشنات الرولات هنا:</span>
            <span className="text-[11px] text-slate-500 font-normal">
              (يقبل منشنات متعددة مثل &lt;@&amp;1528036945618538618&gt; أو أرقام الآيدي)
            </span>
          </label>
          {inputText && (
            <button
              type="button"
              onClick={() => setInputText('')}
              className="text-[11px] text-slate-400 hover:text-red-400 transition cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>مسح النص</span>
            </button>
          )}
        </div>

        <textarea
          rows={3}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="مثال: <@&1528036945618538618> <@&1528036944007659520> <@&1528036937561014293> <@&1528036797433647225>"
          className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700/80 text-white font-mono text-xs placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition leading-relaxed"
          dir="ltr"
        />

        {/* Quick Detected Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-900">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono text-xs font-bold">
              {detectedRoleIds.length} رول مكتشف
            </span>
            {detectedRoleIds.length > 0 && (
              <span className="text-xs text-slate-400">
                اختر تعيين الرولات بالأسفل أو وزّعها تلقائياً:
              </span>
            )}
          </div>

          {detectedRoleIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSequentialDistribution}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-indigo-600 to-emerald-600 hover:opacity-90 text-white text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-md"
                title="توزيع تسلسلي: الرول الأول قادة، الثاني ضباط، والباقي أفراد"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>⚡ توزيع ذكي (الأول قادة 👑، الثاني ضباط ⭐️، الباقي أفراد ⚡)</span>
              </button>

              <button
                type="button"
                onClick={() => handleBatchAssign('officer')}
                className="px-2.5 py-1.5 rounded-xl bg-indigo-950 hover:bg-indigo-900 border border-indigo-700 text-indigo-300 text-xs font-bold transition cursor-pointer flex items-center gap-1"
              >
                <Star className="w-3 h-3" />
                <span>تعيين الكل كضباط ⭐️</span>
              </button>

              <button
                type="button"
                onClick={() => handleBatchAssign('soldier')}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 text-xs font-bold transition cursor-pointer flex items-center gap-1"
              >
                <Zap className="w-3 h-3" />
                <span>تعيين الكل كأفراد ⚡</span>
              </button>

              <button
                type="button"
                onClick={() => handleBatchAssign('leader')}
                className="px-2.5 py-1.5 rounded-xl bg-amber-950 hover:bg-amber-900 border border-amber-700 text-amber-300 text-xs font-bold transition cursor-pointer flex items-center gap-1"
              >
                <Crown className="w-3 h-3" />
                <span>تعيين الكل كقادة 👑</span>
              </button>
            </div>
          )}
        </div>

        {/* Detected Roles Quick-Assign Cards */}
        {detectedRoleIds.length > 0 && (
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <span>قائمة الرولات المكتشفة من النص المكتوب:</span>
              <span className="text-[10px] text-slate-500 font-normal">
                (اضغط على الفئة المناسبة لكل رول)
              </span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {detectedRoleIds.map((id, idx) => {
                const currentStatus = getRoleAssignment(id);
                return (
                  <div
                    key={id}
                    className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between gap-2.5 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-400 text-[10px] font-bold flex items-center justify-center font-mono">
                          {idx + 1}
                        </span>
                        <div className="text-right">
                          <div className="font-mono text-xs font-bold text-white flex items-center gap-1.5" dir="ltr">
                            <span className="text-cyan-400">&lt;@&amp;{id}&gt;</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(`<@&${id}>`, id)}
                              className="text-slate-500 hover:text-slate-300 transition cursor-pointer p-0.5"
                              title="نسخ المنشن"
                            >
                              {copiedId === id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          <span className="text-[10px] font-mono text-slate-500 block" dir="ltr">
                            ID: {id}
                          </span>
                        </div>
                      </div>

                      {/* Current Category Pill */}
                      <div>
                        {currentStatus === 'leader' && (
                          <span className="px-2 py-0.5 rounded-lg bg-amber-950 border border-amber-600 text-amber-300 text-[11px] font-bold flex items-center gap-1">
                            <Crown className="w-3 h-3" />
                            <span>قائد</span>
                          </span>
                        )}
                        {currentStatus === 'officer' && (
                          <span className="px-2 py-0.5 rounded-lg bg-indigo-950 border border-indigo-600 text-indigo-300 text-[11px] font-bold flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            <span>ضابط</span>
                          </span>
                        )}
                        {currentStatus === 'soldier' && (
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-950 border border-emerald-600 text-emerald-300 text-[11px] font-bold flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            <span>فرد</span>
                          </span>
                        )}
                        {currentStatus === 'unassigned' && (
                          <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 text-[11px] font-medium">
                            غير مصنف بعد
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Assignment Buttons */}
                    <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => handleAssignRole(id, 'leader')}
                        className={`py-1 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                          currentStatus === 'leader'
                            ? 'bg-amber-500 text-slate-950 shadow-md ring-1 ring-amber-400'
                            : 'bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-800/60'
                        }`}
                      >
                        <Crown className="w-3 h-3" />
                        <span>👑 قادة</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAssignRole(id, 'officer')}
                        className={`py-1 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                          currentStatus === 'officer'
                            ? 'bg-indigo-600 text-white shadow-md ring-1 ring-indigo-400'
                            : 'bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-800/60'
                        }`}
                      >
                        <Star className="w-3 h-3" />
                        <span>⭐️ ضباط</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAssignRole(id, 'soldier')}
                        className={`py-1 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                          currentStatus === 'soldier'
                            ? 'bg-emerald-600 text-white shadow-md ring-1 ring-emerald-400'
                            : 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60'
                        }`}
                      >
                        <Zap className="w-3 h-3" />
                        <span>⚡ أفراد</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Categorized Lists: Leaders | Officers | Soldiers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. LEADERS (القادة) */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-amber-900/50 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
                <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>👑 القادة (Leaders):</span>
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-300 font-mono text-[11px] font-bold">
                {leaderRoleIds.length + leaderRanks.length}
              </span>
            </div>

            {/* Direct Input */}
            <div className="flex gap-1.5">
              <input
                type="text"
                value={directLeaderInput}
                onChange={(e) => setDirectLeaderInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddDirect('leader', directLeaderInput);
                  }
                }}
                placeholder="منشن <@&ID> أو اسم رول قائد..."
                className="flex-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => handleAddDirect('leader', directLeaderInput)}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer shrink-0"
              >
                +
              </button>
            </div>

            {/* Chips List */}
            <div className="space-y-1.5 min-h-[100px] max-h-60 overflow-y-auto p-1">
              {/* Role IDs */}
              {leaderRoleIds.map((id) => (
                <div
                  key={id}
                  className="p-2 rounded-xl bg-amber-950/70 border border-amber-700/60 flex items-center justify-between gap-1 text-xs"
                >
                  <div className="overflow-hidden">
                    <span className="font-mono text-[11px] text-amber-200 block truncate" dir="ltr">
                      &lt;@&amp;{id}&gt;
                    </span>
                    <span className="text-[10px] text-amber-400/70 truncate block">{getRoleName(id)}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMoveCategory('leader', 'officer', id)}
                      className="px-1.5 py-0.5 rounded bg-indigo-950 hover:bg-indigo-900 text-indigo-300 text-[10px] font-bold border border-indigo-800 transition cursor-pointer"
                      title="نقل للضباط"
                    >
                      ⭐️
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveCategory('leader', 'soldier', id)}
                      className="px-1.5 py-0.5 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-[10px] font-bold border border-emerald-800 transition cursor-pointer"
                      title="نقل للأفراد"
                    >
                      ⚡
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove('leader', id)}
                      className="text-amber-400 hover:text-red-400 text-sm font-bold px-1 transition cursor-pointer"
                      title="حذف"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}

              {/* Text Ranks */}
              {leaderRanks.map((rank) => (
                <div
                  key={rank}
                  className="p-2 rounded-xl bg-amber-950/50 border border-amber-800/40 flex items-center justify-between gap-1 text-xs"
                >
                  <span className="text-amber-200 font-bold truncate">{rank}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMoveCategory('leader', 'officer', rank)}
                      className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 text-[10px] border border-indigo-800"
                      title="نقل للضباط"
                    >
                      ⭐️
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveCategory('leader', 'soldier', rank)}
                      className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] border border-emerald-800"
                      title="نقل للأفراد"
                    >
                      ⚡
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove('leader', rank)}
                      className="text-amber-400 hover:text-red-400 text-sm font-bold px-1"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}

              {leaderRoleIds.length === 0 && leaderRanks.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-500">
                  لا توجد رولات قادة مخصصة بعد.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. OFFICERS (الضباط) */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-900/50 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-indigo-400 shadow-sm shadow-indigo-400/50" />
                <h4 className="text-xs font-bold text-indigo-300 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-indigo-400" />
                  <span>⭐️ الضباط (Officers):</span>
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800 text-indigo-300 font-mono text-[11px] font-bold">
                {officerRoleIds.length + officerRanks.length}
              </span>
            </div>

            {/* Direct Input */}
            <div className="flex gap-1.5">
              <input
                type="text"
                value={directOfficerInput}
                onChange={(e) => setDirectOfficerInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddDirect('officer', directOfficerInput);
                  }
                }}
                placeholder="منشن <@&ID> أو اسم رول ضابط..."
                className="flex-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => handleAddDirect('officer', directOfficerInput)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer shrink-0"
              >
                +
              </button>
            </div>

            {/* Chips List */}
            <div className="space-y-1.5 min-h-[100px] max-h-60 overflow-y-auto p-1">
              {/* Role IDs */}
              {officerRoleIds.map((id) => (
                <div
                  key={id}
                  className="p-2 rounded-xl bg-indigo-950/70 border border-indigo-700/60 flex items-center justify-between gap-1 text-xs"
                >
                  <div className="overflow-hidden">
                    <span className="font-mono text-[11px] text-indigo-200 block truncate" dir="ltr">
                      &lt;@&amp;{id}&gt;
                    </span>
                    <span className="text-[10px] text-indigo-400/70 truncate block">{getRoleName(id)}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMoveCategory('officer', 'leader', id)}
                      className="px-1.5 py-0.5 rounded bg-amber-950 hover:bg-amber-900 text-amber-300 text-[10px] font-bold border border-amber-800 transition cursor-pointer"
                      title="نقل للقادة"
                    >
                      👑
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveCategory('officer', 'soldier', id)}
                      className="px-1.5 py-0.5 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-[10px] font-bold border border-emerald-800 transition cursor-pointer"
                      title="نقل للأفراد"
                    >
                      ⚡
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove('officer', id)}
                      className="text-indigo-400 hover:text-red-400 text-sm font-bold px-1 transition cursor-pointer"
                      title="حذف"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}

              {/* Text Ranks */}
              {officerRanks.map((rank) => (
                <div
                  key={rank}
                  className="p-2 rounded-xl bg-indigo-950/50 border border-indigo-800/40 flex items-center justify-between gap-1 text-xs"
                >
                  <span className="text-indigo-200 font-bold truncate">{rank}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMoveCategory('officer', 'leader', rank)}
                      className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 text-[10px] border border-amber-800"
                      title="نقل للقادة"
                    >
                      👑
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveCategory('officer', 'soldier', rank)}
                      className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] border border-emerald-800"
                      title="نقل للأفراد"
                    >
                      ⚡
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove('officer', rank)}
                      className="text-indigo-400 hover:text-red-400 text-sm font-bold px-1"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}

              {officerRoleIds.length === 0 && officerRanks.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-500">
                  لا توجد رولات ضباط مخصصة بعد.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. SOLDIERS (الأفراد) */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-900/50 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>⚡ الأفراد (Soldiers):</span>
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 font-mono text-[11px] font-bold">
                {soldierRoleIds.length + soldierRanks.length}
              </span>
            </div>

            {/* Direct Input */}
            <div className="flex gap-1.5">
              <input
                type="text"
                value={directSoldierInput}
                onChange={(e) => setDirectSoldierInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddDirect('soldier', directSoldierInput);
                  }
                }}
                placeholder="منشن <@&ID> أو اسم رول فرد..."
                className="flex-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => handleAddDirect('soldier', directSoldierInput)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer shrink-0"
              >
                +
              </button>
            </div>

            {/* Chips List */}
            <div className="space-y-1.5 min-h-[100px] max-h-60 overflow-y-auto p-1">
              {/* Role IDs */}
              {soldierRoleIds.map((id) => (
                <div
                  key={id}
                  className="p-2 rounded-xl bg-emerald-950/70 border border-emerald-700/60 flex items-center justify-between gap-1 text-xs"
                >
                  <div className="overflow-hidden">
                    <span className="font-mono text-[11px] text-emerald-200 block truncate" dir="ltr">
                      &lt;@&amp;{id}&gt;
                    </span>
                    <span className="text-[10px] text-emerald-400/70 truncate block">{getRoleName(id)}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMoveCategory('soldier', 'leader', id)}
                      className="px-1.5 py-0.5 rounded bg-amber-950 hover:bg-amber-900 text-amber-300 text-[10px] font-bold border border-amber-800 transition cursor-pointer"
                      title="نقل للقادة"
                    >
                      👑
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveCategory('soldier', 'officer', id)}
                      className="px-1.5 py-0.5 rounded bg-indigo-950 hover:bg-indigo-900 text-indigo-300 text-[10px] font-bold border border-indigo-800 transition cursor-pointer"
                      title="نقل للضباط"
                    >
                      ⭐️
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove('soldier', id)}
                      className="text-emerald-400 hover:text-red-400 text-sm font-bold px-1 transition cursor-pointer"
                      title="حذف"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}

              {/* Text Ranks */}
              {soldierRanks.map((rank) => (
                <div
                  key={rank}
                  className="p-2 rounded-xl bg-emerald-950/50 border border-emerald-800/40 flex items-center justify-between gap-1 text-xs"
                >
                  <span className="text-emerald-200 font-bold truncate">{rank}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMoveCategory('soldier', 'leader', rank)}
                      className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 text-[10px] border border-amber-800"
                      title="نقل للقادة"
                    >
                      👑
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveCategory('soldier', 'officer', rank)}
                      className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 text-[10px] border border-indigo-800"
                      title="نقل للضباط"
                    >
                      ⭐️
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove('soldier', rank)}
                      className="text-emerald-400 hover:text-red-400 text-sm font-bold px-1"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}

              {soldierRoleIds.length === 0 && soldierRanks.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-500">
                  لا توجد رولات أفراد مخصصة بعد.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info & Reset */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            يتم حفظ الرولات تلقائياً وتطبيقها فوراً على جميع الأعضاء المسحوبين وفي تقرير الديسكورد النهائي.
          </span>
        </div>

        <button
          type="button"
          onClick={handleClearAllRoles}
          className="px-3 py-1.5 rounded-xl bg-red-950/50 hover:bg-red-900/60 border border-red-800/60 text-red-300 text-xs font-bold transition cursor-pointer flex items-center gap-1 shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>تفريغ كافة الرولات والبدء من جديد</span>
        </button>
      </div>
    </div>
  );
};
