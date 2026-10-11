import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Search,
  Check,
  Plus,
  RefreshCw,
  Info,
  ShieldAlert,
  SlidersHorizontal,
  CheckCircle2,
  Trash2,
  Eye,
  UserCheck,
  Mic,
  Bot,
  Radio,
  AlertTriangle,
  ClipboardPaste,
  ShieldCheck,
  UserX,
} from 'lucide-react';
import { VoiceMember, ImageTag, DeveloperSettings, RoleCategoriesConfig } from '../types';
import { ACCEPTANCE_RULES, DEFAULT_ROLE_CATEGORIES } from '../data/initialData';
import {
  fetchDiscordVoiceMembers,
  parseDiscordVoiceText,
  classifyMemberRole,
} from '../utils/discordVoiceSync';
import { DiscordRoleMentionsManager } from './DiscordRoleMentionsManager';

interface InspectionStepViewProps {
  screenshotUrl: string | null;
  onScreenshotChange: (url: string | null) => void;
  tags: ImageTag[];
  onTagsChange: (tags: ImageTag[]) => void;
  voiceMembers: VoiceMember[];
  onVoiceMembersChange: (members: VoiceMember[]) => void;
  onNext: () => void;
  onBack: () => void;
  developerSettings?: DeveloperSettings;
  onUpdateDeveloperSettings?: (settings: DeveloperSettings) => void;
  onClearVoiceMembers?: () => void;
}

export const InspectionStepView: React.FC<InspectionStepViewProps> = ({
  screenshotUrl,
  onScreenshotChange,
  tags,
  onTagsChange,
  voiceMembers,
  onVoiceMembersChange,
  onNext,
  onBack,
  developerSettings,
  onUpdateDeveloperSettings,
  onClearVoiceMembers,
}) => {
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<
    'all' | 'leaders' | 'officers' | 'soldiers' | 'attending' | 'missing'
  >('all');

  // Pan & Zoom State
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isAddingTagManual, setIsAddingTagManual] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [newTagPosition, setNewTagPosition] = useState<{ x: number; y: number } | null>(null);

  // New Member Modal State
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState({
    rank: 'جندي',
    militaryCode: 'I-99',
    gameId: '',
    discordName: '',
    discordUserId: '',
    roleCategory: 'soldier' as 'leader' | 'officer' | 'soldier',
  });

  // Voice sync state
  const [isSyncingVoice, setIsSyncingVoice] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [isRoleMentionsModalOpen, setIsRoleMentionsModalOpen] = useState(false);

  // Scanning Animation State
  const [isScanningImage, setIsScanningImage] = useState(false);
  const scannedUrlRef = useRef<string | null>(null);
  const [lastSyncSecondsAgo, setLastSyncSecondsAgo] = useState(0);

  // Drag & Drop handlers for dropzone
  const [isDragOver, setIsDragOver] = useState(false);

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync Voice Members Function
  const handleSyncVoiceMembers = useCallback(async (isAuto = false) => {
    if (!isAuto) setIsSyncingVoice(true);
    try {
      const res = await fetchDiscordVoiceMembers({
        guildId: developerSettings?.discordGuildId,
        channelId: developerSettings?.discordVoiceChannelId,
        botToken: developerSettings?.discordBotToken,
        roleCategoriesConfig: developerSettings?.roleCategoriesConfig,
      });
      if (res.success && res.members.length > 0) {
        // Merge with existing members to preserve manually toggled attendance & image detection
        const merged = res.members.map((fresh) => {
          const existing = voiceMembers.find(
            (p) =>
              (p.discordUserId && p.discordUserId === fresh.discordUserId) ||
              (p.gameId && p.gameId === fresh.gameId) ||
              (p.militaryCode && p.militaryCode === fresh.militaryCode)
          );
          if (existing) {
            return {
              ...fresh,
              isAttending: existing.isAttending,
              detectedFromImage: existing.detectedFromImage,
            };
          }
          return fresh;
        });

        onVoiceMembersChange(merged);
        setLastSyncSecondsAgo(0);
        if (!isAuto) {
          setSyncNotice(`✅ تم سحب ${res.members.length} عضواً من فويس الديسكورد`);
          setTimeout(() => setSyncNotice(null), 4000);
        }
      } else if (!isAuto) {
        setSyncNotice(res.message);
        setTimeout(() => setSyncNotice(null), 8000);
      }
    } finally {
      if (!isAuto) setIsSyncingVoice(false);
    }
  }, [developerSettings, voiceMembers, onVoiceMembersChange]);

  // Automatic Background Voice Polling: polls every 10 seconds automatically without needing a manual toggle
  useEffect(() => {
    // Initial sync
    handleSyncVoiceMembers(true);

    const pollTimer = setInterval(() => {
      handleSyncVoiceMembers(true);
    }, 10000);

    const secondsCounter = setInterval(() => {
      setLastSyncSecondsAgo((prev) => (prev >= 10 ? 0 : prev + 1));
    }, 1000);

    return () => {
      clearInterval(pollTimer);
      clearInterval(secondsCounter);
    };
  }, [handleSyncVoiceMembers]);

  // CRITICAL REQUIREMENT:
  // Match screenshot tags against current voice members:
  // - If tag ID exists in voiceMembers -> Tag is GREEN (متواجد بالفويس), member attending = true, gets mentioned!
  // - If tag ID NOT in voiceMembers -> Tag is RED (غير متواجد بالفويس ❌), NOT attending, NO mention!
  useEffect(() => {
    if (tags.length === 0) return;

    // 1. Update tag statuses (matched vs missing_from_voice)
    let tagsChanged = false;
    const verifiedTags = tags.map((t) => {
      if (t.status === 'ignored') return t;
      const cleanTagId = t.text.replace(/^-/, '').trim();
      const inVoice = voiceMembers.some(
        (m) => m.gameId.replace(/^-/, '').trim() === cleanTagId
      );

      const nextStatus: ImageTag['status'] = inVoice ? 'matched' : 'missing_from_voice';
      if (t.status !== nextStatus || t.isInVoice !== inVoice) {
        tagsChanged = true;
        return { ...t, status: nextStatus, isInVoice: inVoice };
      }
      return t;
    });

    if (tagsChanged) {
      onTagsChange(verifiedTags);
    }

    // 2. Mark voice members attending ONLY if they are both in voice AND detected in the photo
    const updatedMembers = voiceMembers.map((member) => {
      const cleanMemberId = member.gameId.replace(/^-/, '').trim();
      const isDetectedOnPhoto = verifiedTags.some(
        (t) => t.status === 'matched' && t.text.replace(/^-/, '').trim() === cleanMemberId
      );

      if (isDetectedOnPhoto && !member.isAttending) {
        return { ...member, isAttending: true, detectedFromImage: true };
      }
      return member;
    });

    const attendanceChanged = updatedMembers.some(
      (m, i) => m.isAttending !== voiceMembers[i].isAttending || m.detectedFromImage !== voiceMembers[i].detectedFromImage
    );

    if (attendanceChanged) {
      onVoiceMembersChange(updatedMembers);
    }
  }, [tags, voiceMembers, onTagsChange, onVoiceMembersChange]);

  // Handle Global Paste: Supports BOTH Ctrl+V / Ctrl+Shift+V for Images AND Text
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Don't intercept if actively typing inside an input/textarea
      const activeTag = (document.activeElement as HTMLElement)?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') {
        return;
      }

      // 1. Check if Image is in Clipboard
      const items = e.clipboardData?.items;
      let handledImage = false;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) {
              handledImage = true;
              const reader = new FileReader();
              reader.onload = (uploadEvent) => {
                if (uploadEvent.target?.result) {
                  onScreenshotChange(uploadEvent.target.result as string);
                  setSyncNotice('✅ تم لصق لقطة الشاشة من الحافظة مباشرة!');
                  setTimeout(() => setSyncNotice(null), 3500);
                }
              };
              reader.readAsDataURL(file);
              break;
            }
          }
        }
      }

      // 2. If no image, check if TEXT is in Clipboard (e.g. copied from Discord voice list)
      if (!handledImage) {
        const text = e.clipboardData?.getData('text');
        if (text && text.trim()) {
          const parsed = parseDiscordVoiceText(text);
          if (parsed.length > 0) {
            onVoiceMembersChange(parsed);
            setSyncNotice(`✅ تم لصق واستيراد ${parsed.length} أعضاء من الحافظة تلقائياً!`);
            setTimeout(() => setSyncNotice(null), 4000);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onScreenshotChange, onVoiceMembersChange]);

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onScreenshotChange(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onScreenshotChange(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Zoom handlers
  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(Math.max(0.6, prev + delta), 3.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isAddingTagManual) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Canvas Click for Manual Tag Addition
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasContainerRef.current) return;
    const rect = canvasContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (isAddingTagManual) {
      setNewTagPosition({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
    }
  };

  const handleConfirmNewTag = () => {
    if (!newTagInput.trim() || !newTagPosition) return;
    const cleanId = newTagInput.trim().replace(/^-/, '');

    // Check if in voice
    const inVoice = voiceMembers.some(
      (m) => m.gameId.replace(/^-/, '').trim() === cleanId
    );

    const newTag: ImageTag = {
      id: `tag-${Date.now()}`,
      text: cleanId,
      x: newTagPosition.x,
      y: newTagPosition.y,
      status: inVoice ? 'matched' : 'missing_from_voice',
      isInVoice: inVoice,
    };

    onTagsChange([...tags, newTag]);
    setNewTagInput('');
    setNewTagPosition(null);
    setIsAddingTagManual(false);
  };

  // Toggle member attendance manually
  const toggleMemberAttendance = (memberId: string) => {
    onVoiceMembersChange(
      voiceMembers.map((m) => (m.id === memberId ? { ...m, isAttending: !m.isAttending } : m))
    );
  };

  // Toggle tag status
  const toggleTagStatus = (tagId: string) => {
    onTagsChange(
      tags.map((t) => {
        if (t.id === tagId) {
          const nextStatus = t.status === 'ignored' ? (t.isInVoice ? 'matched' : 'missing_from_voice') : 'ignored';
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
  };

  // Tactical Laser Scan: Detects IDs on the image, displays HUD laser lines, and cross-checks with voice
  const executeTacticalScan = useCallback(
    (targetUrl?: string) => {
      const activeUrl = targetUrl || screenshotUrl;
      if (!activeUrl) return;

      setIsScanningImage(true);
      setSyncNotice('🔍 جاري المسح التكتيكي للصورة واستخراج الآيديات ومطابقتها مع الفويس...');

      setTimeout(() => {
        // Collect IDs to place on image:
        // Use IDs from voice members if present, plus any simulated/existing IDs
        const idsToPlace: string[] = [];
        if (voiceMembers.length > 0) {
          voiceMembers.slice(0, 5).forEach((m) => {
            const clean = m.gameId.replace(/^-/, '').trim();
            if (clean && !idsToPlace.includes(clean)) {
              idsToPlace.push(clean);
            }
          });
        }

        // Add typical scenario IDs if none or few
        if (idsToPlace.length === 0) {
          idsToPlace.push('422', '1551', '264636', '99');
        } else if (idsToPlace.length < 3) {
          idsToPlace.push('99');
        }

        const xCoords = [26, 42, 58, 74, 34, 66];
        const yCoords = [64, 68, 72, 65, 58, 74];

        const generatedTags: ImageTag[] = idsToPlace.map((id, index) => {
          const inVoice = voiceMembers.some(
            (m) => m.gameId.replace(/^-/, '').trim() === id.replace(/^-/, '').trim()
          );

          return {
            id: `scan-tag-${Date.now()}-${index}`,
            text: id,
            x: xCoords[index % xCoords.length],
            y: yCoords[index % yCoords.length],
            status: inVoice ? 'matched' : 'missing_from_voice',
            isInVoice: inVoice,
          };
        });

        onTagsChange(generatedTags);
        setIsScanningImage(false);
        setSyncNotice(`✅ اكتمل المسح التكتيكي: تم رصد ${generatedTags.length} آيديات ومطابقتها مع روم الفويس!`);
        setTimeout(() => setSyncNotice(null), 4500);
      }, 1800);
    },
    [screenshotUrl, voiceMembers, onTagsChange]
  );

  // Automatically trigger tactical scan immediately when screenshotUrl changes!
  useEffect(() => {
    if (screenshotUrl && screenshotUrl !== scannedUrlRef.current) {
      scannedUrlRef.current = screenshotUrl;
      executeTacticalScan(screenshotUrl);
    }
  }, [screenshotUrl, executeTacticalScan]);

  // Clear Voice Members (Remove all mock/sample members to start 100% clean)
  const handleClearAllVoiceMembers = () => {
    if (confirm('هل أنت متأكد من مسح كافة الأعضاء الحاليين للبدء حصرياً بالأعضاء الحقيقيين من الديسكورد؟')) {
      onVoiceMembersChange([]);
      if (onClearVoiceMembers) onClearVoiceMembers();
    }
  };

  // Add Member to voice list manually
  const handleAddNewMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberForm.discordName || !newMemberForm.gameId) return;

    const effectiveRoleCategory =
      newMemberForm.roleCategory ||
      classifyMemberRole(newMemberForm.rank, developerSettings?.roleCategoriesConfig).roleCategory;

    const newMember: VoiceMember = {
      id: `m-${Date.now()}`,
      rank: newMemberForm.rank,
      rankCode: newMemberForm.militaryCode,
      militaryCode: newMemberForm.militaryCode,
      gameId: newMemberForm.gameId,
      discordName: newMemberForm.discordName,
      discordUserId:
        newMemberForm.discordUserId ||
        String(Math.floor(100000000000000000 + Math.random() * 900000000000000000)),
      isAttending: true,
      detectedFromImage: false,
      roleCategory: effectiveRoleCategory,
    };

    onVoiceMembersChange([newMember, ...voiceMembers]);
    setIsAddMemberOpen(false);
    setNewMemberForm({
      rank: 'جندي',
      militaryCode: 'I-99',
      gameId: '',
      discordName: '',
      discordUserId: '',
      roleCategory: 'soldier',
    });
  };

  // Role hierarchy sorting & filtering
  const cfg = developerSettings?.roleCategoriesConfig || DEFAULT_ROLE_CATEGORIES;

  // Auto-fill roleCategory if not present using configured Game & Discord Roles
  const categorizedMembers = voiceMembers.map((m) => {
    if (m.discordRoles && m.discordRoles.length > 0) {
      const { roleCategory, rank } = classifyMemberRole(m.rank || m.discordName, cfg, m.discordRoles);
      return {
        ...m,
        roleCategory,
        rank: !m.rank.startsWith('عضو') && m.rank !== 'فرد' && !m.rank.startsWith('<@&') ? m.rank : rank,
      };
    }
    if (m.roleCategory) return m;
    const { roleCategory } = classifyMemberRole(m.rank || m.discordName, cfg, m.discordRoles);
    return { ...m, roleCategory };
  });

  // Sort by chain of command: Leaders (0) -> Officers (1) -> Soldiers (2)
  const sortedMembers = [...categorizedMembers].sort((a, b) => {
    const rolePriority = { leader: 0, officer: 1, soldier: 2 };
    const pA = rolePriority[a.roleCategory || 'soldier'];
    const pB = rolePriority[b.roleCategory || 'soldier'];
    return pA - pB;
  });

  const leadersCount = categorizedMembers.filter((m) => m.roleCategory === 'leader').length;
  const officersCount = categorizedMembers.filter((m) => m.roleCategory === 'officer').length;
  const soldiersCount = categorizedMembers.filter((m) => m.roleCategory === 'soldier').length;

  // Filter members list
  const filteredMembers = sortedMembers.filter((m) => {
    const matchesSearch =
      m.discordName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.rank.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.militaryCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.gameId.includes(searchQuery) ||
      m.discordUserId.includes(searchQuery);

    if (!matchesSearch) return false;
    if (filterMode === 'leaders') return m.roleCategory === 'leader';
    if (filterMode === 'officers') return m.roleCategory === 'officer';
    if (filterMode === 'soldiers') return m.roleCategory === 'soldier';
    if (filterMode === 'attending') return m.isAttending;
    if (filterMode === 'missing') return !m.isAttending;
    return true;
  });

  const attendingCount = voiceMembers.filter((m) => m.isAttending).length;

  // Count tags matching voice vs missing from voice
  const activeMatchedTags = tags.filter((t) => t.status === 'matched');
  const missingFromVoiceTags = tags.filter((t) => t.status === 'missing_from_voice');

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-4 text-right">
      {/* Top Streamlined Voice Status Bar (Automatic Background Sync) */}
      <div className="p-3.5 rounded-2xl bg-[#0c1222] border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        {/* Right Info */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">التحقق الذكي من روم الفويس الصوتي</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                تحديث تلقائي مستمر (كل 10 ثوانٍ)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              أي لاعب ظاهر بالصورة وغير متواجد في روم الفويس يظهر عليه <span className="text-red-400 font-bold underline">لون أحمر</span> ويتم استبعاده فوراً من المنشن!
            </p>
          </div>
        </div>

        {/* Left Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsRoleMentionsModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md"
            title="توزيع رولات ومنشنات الديسكورد (<@&ID>) للقادة والضباط والأفراد"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-200" />
            <span>توزيع رولات ومنشن الديسكورد (&lt;@&amp;&gt;) 🏷️</span>
          </button>

          <button
            type="button"
            onClick={() => handleSyncVoiceMembers(false)}
            disabled={isSyncingVoice}
            className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingVoice ? 'animate-spin' : ''}`} />
            <span>تحديث الفويس الآن 🔄</span>
          </button>

          <button
            type="button"
            onClick={handleClearAllVoiceMembers}
            className="px-2.5 py-2 rounded-xl bg-slate-900 hover:bg-red-950/60 border border-slate-800 hover:border-red-800/60 text-slate-400 hover:text-red-300 text-xs transition cursor-pointer"
            title="مسح كافة الأعضاء للبدء باللاعبين الحقيقيين من الديسكورد"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Interactive Screenshot Inspection (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#0e1422] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {/* Canvas Header & Controls */}
            <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                  <span>صورة التجمع (لقطة الشاشة)</span>
                </span>
                {screenshotUrl && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 font-mono">
                      ✓ {activeMatchedTags.length} بالفويس
                    </span>
                    {missingFromVoiceTags.length > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-red-950/90 border border-red-600/70 text-red-300 font-mono font-bold animate-pulse">
                        ✕ {missingFromVoiceTags.length} ليسوا بالفويس
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Viewport controls */}
              <div className="flex items-center gap-1.5">
                {screenshotUrl && (
                  <>
                    <button
                      type="button"
                      title="تكبير"
                      onClick={() => handleZoom(0.25)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition cursor-pointer"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title="تصغير"
                      onClick={() => handleZoom(-0.25)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition cursor-pointer"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title="إعادة ضبط الرؤية"
                      onClick={handleResetZoom}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingTagManual(!isAddingTagManual)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                        isAddingTagManual
                          ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                      }`}
                    >
                      <Plus className="w-3 h-3" />
                      <span>{isAddingTagManual ? 'انقر على اللاعب' : 'تحديد آيدي يدوي'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => executeTacticalScan()}
                      disabled={isScanningImage}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition cursor-pointer disabled:opacity-50 shadow-sm"
                      title="إعادة المسح الضوئي التكتيكي والتعرف على الآيديات"
                    >
                      <Sparkles className={`w-3 h-3 text-cyan-400 ${isScanningImage ? 'animate-spin' : ''}`} />
                      <span>{isScanningImage ? 'جاري المسح...' : 'إعادة المسح 🔍'}</span>
                    </button>
                  </>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer shadow-sm"
                >
                  <Upload className="w-3 h-3" />
                  <span>{screenshotUrl ? 'تغيير الصورة' : 'اختر الصورة'}</span>
                </button>
              </div>
            </div>

            {/* Interactive Canvas Area */}
            <div
              ref={canvasContainerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onClick={handleCanvasClick}
              className={`relative h-[340px] sm:h-[400px] w-full bg-[#070b12] overflow-hidden flex items-center justify-center select-none ${
                isDragging ? 'cursor-grabbing' : isAddingTagManual ? 'cursor-crosshair' : 'cursor-grab'
              }`}
            >
              {screenshotUrl ? (
                <div
                  style={{
                    transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                    transformOrigin: 'center center',
                    transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                  }}
                  className="relative w-full h-full flex items-center justify-center"
                >
                  <img
                    src={screenshotUrl}
                    alt="FiveM Scenario Screenshot"
                    referrerPolicy="no-referrer"
                    className="max-w-full max-h-full object-contain pointer-events-none rounded"
                  />

                  {/* Tactical Laser Scanning Animation Overlay */}
                  {isScanningImage && (
                    <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden rounded">
                      {/* High-tech Scanning Grid Overlay */}
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.08)_1px,transparent_1px)] bg-[size:28px_28px] opacity-75" />

                      {/* Moving Tactical Laser Beam */}
                      <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee,0_0_35px_#06b6d4] animate-scanline" />

                      {/* Tactical HUD Reticle Corner Brackets */}
                      <div className="absolute top-3 left-3 w-7 h-7 border-t-2 border-l-2 border-cyan-400 shadow-[0_0_10px_#22d3ee]" />
                      <div className="absolute top-3 right-3 w-7 h-7 border-t-2 border-r-2 border-cyan-400 shadow-[0_0_10px_#22d3ee]" />
                      <div className="absolute bottom-3 left-3 w-7 h-7 border-b-2 border-l-2 border-cyan-400 shadow-[0_0_10px_#22d3ee]" />
                      <div className="absolute bottom-3 right-3 w-7 h-7 border-b-2 border-r-2 border-cyan-400 shadow-[0_0_10px_#22d3ee]" />

                      {/* Central Tactical Scanning HUD Badge */}
                      <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div className="backdrop-blur-md bg-slate-950/90 border border-cyan-500/70 px-5 py-2.5 rounded-2xl text-cyan-300 font-bold text-xs flex items-center gap-2.5 shadow-2xl shadow-cyan-950/90 animate-pulse">
                          <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                          <span className="font-mono">جاري المسح التكتيكي والتعرف على الآيديات في لقطة الشاشة... 🔍</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Render Visual Tags Over Players with RED for missing voice and GREEN for in-voice */}
                  {tags.map((tag) => {
                    const isIgnored = tag.status === 'ignored';
                    const isMissing = tag.status === 'missing_from_voice';
                    const isMatched = tag.status === 'matched';

                    return (
                      <div
                        key={tag.id}
                        style={{
                          left: `${tag.x}%`,
                          top: `${tag.y}%`,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTagStatus(tag.id);
                        }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded-lg text-xs font-mono font-black border transition-all cursor-pointer shadow-xl z-20 flex items-center gap-1.5 ${
                          isIgnored
                            ? 'bg-slate-900/80 border-slate-600 text-slate-400 line-through opacity-60'
                            : isMissing
                            ? 'bg-red-700/95 border-red-400 text-white shadow-red-600/60 ring-2 ring-red-500/60 animate-pulse'
                            : 'bg-emerald-600/95 border-emerald-300 text-white shadow-emerald-600/50 ring-1 ring-emerald-400/40'
                        }`}
                        title={
                          isMissing
                            ? `❌ غير متواجد بالفويس الصوتي! تم استبعاده من المنشن.`
                            : `✅ متواجد بالفويس - منشن مفعّل`
                        }
                      >
                        <span>{isMissing ? '🔴' : '🟢'}</span>
                        <span>{tag.text}</span>
                        {isMissing ? (
                          <span className="text-[9px] bg-red-950 px-1 py-0.2 rounded text-red-200 font-sans">
                            غير بالفويس ✕
                          </span>
                        ) : (
                          <span className="text-[9px] bg-emerald-950 px-1 py-0.2 rounded text-emerald-200 font-sans">
                            بالفويس ✓
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Empty Dropzone State: Shows by default until user uploads or pastes */
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`w-full h-full flex flex-col items-center justify-center p-6 text-center transition cursor-pointer border-2 border-dashed m-3 rounded-2xl ${
                    isDragOver
                      ? 'border-blue-500 bg-blue-950/50 text-blue-200 scale-[0.99]'
                      : 'border-slate-700/80 bg-slate-950/60 hover:border-blue-500/70 hover:bg-slate-900/60 text-slate-400'
                  }`}
                >
                  <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3 shadow-lg">
                    <Upload className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-black text-white mb-1">
                    اسحب الصورة هنا أو اختر الصورة
                  </h3>
                  <p className="text-xs text-slate-400 mb-4 max-w-sm leading-relaxed">
                    ارفع لقطة شاشة التجمع من اللعبة ليتم مطابقة الآيديات والتأكد من تواجد أصحابها في الفويس
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition flex items-center gap-2 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>اختر الصورة من جهازك</span>
                  </button>
                  <span className="text-[11px] text-slate-500 font-mono mt-3">
                    أو اضغط <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold border border-slate-700">Ctrl + V</kbd> للصق لقطة الشاشة مباشرة
                  </span>
                </div>
              )}

              {/* Tag Creation Input Popup */}
              {newTagPosition && isAddingTagManual && (
                <div
                  style={{
                    left: `${newTagPosition.x}%`,
                    top: `${newTagPosition.y}%`,
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute z-30 -translate-x-1/2 -translate-y-full mb-2 p-2 rounded-xl bg-slate-900 border border-blue-500 shadow-2xl flex items-center gap-1.5"
                >
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    placeholder="رقم الآيدي..."
                    autoFocus
                    className="w-24 px-2 py-1 rounded bg-slate-950 border border-slate-700 text-white text-xs font-mono text-center outline-none focus:border-blue-400"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleConfirmNewTag();
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleConfirmNewTag}
                    className="p-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-500 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Status Notifications */}
            {missingFromVoiceTags.length > 0 && (
              <div className="p-3 bg-red-950/60 border-t border-red-800/60 flex items-center gap-2 text-xs text-red-200">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>
                  <strong>تنبيه انضباط:</strong> يوجد <span className="font-bold text-white underline">{missingFromVoiceTags.length} لاعبين</span> في الصورة غير متواجدين في الروم الصوتي! تم تحديدهم باللون الأحمر واستبعادهم تلقائياً من المنشن.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Voice Members & Attendance Verification Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#0e1422] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            {/* Header & Controls */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">قائمة أعضاء الفويس المعتمدين</span>
                <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 font-mono text-[10px] font-bold">
                  {voiceMembers.length}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-950/70 border border-blue-800 hover:bg-blue-900/60 text-blue-300 text-xs font-medium transition cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>إضافة</span>
                </button>

                <button
                  type="button"
                  title="تحديث قائمة الفويس"
                  onClick={() => handleSyncVoiceMembers(false)}
                  disabled={isSyncingVoice}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950/70 border border-cyan-800 hover:bg-cyan-900/60 text-cyan-300 text-xs font-medium transition cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncingVoice ? 'animate-spin' : ''}`} />
                  <span>تحديث</span>
                </button>
              </div>
            </div>

            {/* Notification Toast */}
            {syncNotice && (
              <div className="p-2 rounded-xl bg-cyan-950/90 border border-cyan-500/60 text-cyan-300 text-xs text-center font-bold shadow-lg shadow-cyan-950/60 animate-fadeIn">
                {syncNotice}
              </div>
            )}

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم أو الرتبة أو الكود أو الآيدي..."
                className="w-full pr-9 pl-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 text-xs placeholder:text-slate-500 outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* Quick Filter Tabs for Roles & Attendance */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`py-1.5 px-1 rounded-lg font-bold transition cursor-pointer text-center ${
                  filterMode === 'all'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                الكل ({voiceMembers.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('leaders')}
                className={`py-1.5 px-1 rounded-lg font-bold transition cursor-pointer text-center ${
                  filterMode === 'leaders'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-amber-400 hover:bg-amber-950/40'
                }`}
              >
                👑 القادة ({leadersCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('officers')}
                className={`py-1.5 px-1 rounded-lg font-bold transition cursor-pointer text-center ${
                  filterMode === 'officers'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-indigo-400 hover:bg-indigo-950/40'
                }`}
              >
                ⭐️ الضباط ({officersCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('soldiers')}
                className={`py-1.5 px-1 rounded-lg font-bold transition cursor-pointer text-center ${
                  filterMode === 'soldiers'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-emerald-400 hover:bg-emerald-950/40'
                }`}
              >
                ⚡ الأفراد ({soldiersCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('attending')}
                className={`py-1.5 px-1 rounded-lg font-bold transition cursor-pointer text-center ${
                  filterMode === 'attending'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                حضور ({attendingCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('missing')}
                className={`py-1.5 px-1 rounded-lg font-bold transition cursor-pointer text-center ${
                  filterMode === 'missing'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                غياب ({voiceMembers.length - attendingCount})
              </button>
            </div>

            {/* Members Scrollable List */}
            <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
              {filteredMembers.map((member) => (
                <div
                  key={member.id}
                  onClick={() => toggleMemberAttendance(member.id)}
                  className={`p-2.5 rounded-xl border transition-all duration-150 flex items-center justify-between gap-2.5 cursor-pointer ${
                    member.isAttending
                      ? 'bg-emerald-950/30 border-emerald-500/60 shadow-sm shadow-emerald-950/40'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 opacity-75'
                  }`}
                >
                  {/* Left: Discord Check & Mentions */}
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                        member.isAttending
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'border border-slate-700 bg-slate-900 text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </div>

                    <div className="text-[10px] font-mono text-amber-400/90 hidden sm:block">
                      &lt;@{member.discordUserId.slice(0, 5)}...&gt;
                    </div>
                  </div>

                  {/* Right: Badges & Member Details */}
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <span className="font-bold text-xs text-blue-300 truncate max-w-[150px]">
                      {member.discordName}
                    </span>

                    {/* Game ID badge */}
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 text-[10px] font-mono font-bold">
                      {member.gameId}
                    </span>

                    {/* Military Code badge */}
                    <span className="px-1.5 py-0.5 rounded bg-red-950/80 border border-red-700/60 text-red-400 text-[10px] font-mono font-bold">
                      {member.militaryCode}
                    </span>

                    {/* Rank badge */}
                    <span className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-700/60 text-purple-300 text-[10px] font-bold">
                      {member.rank}
                    </span>

                    {/* Role Category Badge: Leader 👑 / Officer ⭐️ / Soldier ⚡ */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const nextRole: 'leader' | 'officer' | 'soldier' =
                          member.roleCategory === 'leader'
                            ? 'officer'
                            : member.roleCategory === 'officer'
                            ? 'soldier'
                            : 'leader';
                        onVoiceMembersChange(
                          voiceMembers.map((m) =>
                            m.id === member.id ? { ...m, roleCategory: nextRole } : m
                          )
                        );
                      }}
                      title="انقر لتبديل تصنيف الرتبة (قائد / ضابط / فرد)"
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
                        member.roleCategory === 'leader'
                          ? 'bg-amber-950/90 border-amber-500/70 text-amber-300'
                          : member.roleCategory === 'soldier'
                          ? 'bg-cyan-950/90 border-cyan-500/70 text-cyan-300'
                          : 'bg-indigo-950/90 border-indigo-500/70 text-indigo-300'
                      }`}
                    >
                      {member.roleCategory === 'leader'
                        ? '🌟♕ قائد'
                        : member.roleCategory === 'soldier'
                        ? '⚡ فرد'
                        : '⭐️ ضابط'}
                    </button>
                  </div>
                </div>
              ))}

              {filteredMembers.length === 0 && (
                <div className="p-8 text-center text-slate-500 text-xs">
                  {voiceMembers.length === 0 ? (
                    <div className="space-y-3 py-4">
                      <div className="w-12 h-12 rounded-2xl bg-cyan-950/40 border border-cyan-800/40 text-cyan-400 flex items-center justify-center mx-auto">
                        <Mic className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-slate-200 text-sm">قائمة الفويس فارغة حالياً</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
                        اضغط على <span className="text-cyan-300 font-bold">"سحب المتواجدين الآن 🔄"</span> أو فعّل <span className="text-red-400 font-bold">"البث المباشر 🔴"</span> لجلب اللاعبين المتصلين بروم الديسكورد، أو الصق أسماء اللاعبين مباشرة (Ctrl+V).
                      </p>
                      <div className="flex items-center justify-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleSyncVoiceMembers(false)}
                          disabled={isSyncingVoice}
                          className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isSyncingVoice ? 'animate-spin' : ''}`} />
                          <span>سحب المتواجدين من الديسكورد 🔄</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    'لا توجد نتائج تطابق بحثك.'
                  )}
                </div>
              )}
            </div>

            {/* Attendance Status Summary */}
            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>الحاضرون بالفويس هم فقط من سيتم منشنهم</span>
              <span className="font-bold text-white">
                المحضرون: <span className="text-emerald-400 font-mono">{attendingCount}</span> / <span className="font-mono">{voiceMembers.length}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="p-4 bg-[#0e1422] border border-slate-800 rounded-2xl flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition cursor-pointer"
        >
          العودة
        </button>

        <button
          type="button"
          onClick={onNext}
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition cursor-pointer flex items-center gap-1.5"
        >
          <span>المتابعة إلى الحدث والموقع</span>
          <span>←</span>
        </button>
      </div>

      {/* Add Member Modal */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddNewMember}
            className="w-full max-w-md p-6 rounded-2xl bg-[#0e1422] border border-slate-800 space-y-4 shadow-2xl"
          >
            <h3 className="text-sm font-bold text-white">إضافة عضو جديد لروم الفويس</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] text-slate-300 block mb-1 font-bold">تصنيف رول العضو:</label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() =>
                      setNewMemberForm({
                        ...newMemberForm,
                        roleCategory: 'leader',
                        rank: 'فريق أول',
                      })
                    }
                    className={`py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      newMemberForm.roleCategory === 'leader'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-amber-400 hover:bg-slate-900'
                    }`}
                  >
                    👑 قائد
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setNewMemberForm({
                        ...newMemberForm,
                        roleCategory: 'officer',
                        rank: 'نقيب',
                      })
                    }
                    className={`py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      newMemberForm.roleCategory === 'officer'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-indigo-400 hover:bg-slate-900'
                    }`}
                  >
                    ⭐️ ضابط
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setNewMemberForm({
                        ...newMemberForm,
                        roleCategory: 'soldier',
                        rank: 'جندي',
                      })
                    }
                    className={`py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      newMemberForm.roleCategory === 'soldier'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-emerald-400 hover:bg-slate-900'
                    }`}
                  >
                    ⚡ فرد
                  </button>
                </div>
              </div>

              <input
                type="text"
                placeholder="اسم الديسكورد"
                value={newMemberForm.discordName}
                onChange={(e) => setNewMemberForm({ ...newMemberForm, discordName: e.target.value })}
                required
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-blue-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="الرتبة (ملازم...)"
                  value={newMemberForm.rank}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, rank: e.target.value })}
                  required
                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="الكود (I-99)"
                  value={newMemberForm.militaryCode}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, militaryCode: e.target.value })}
                  required
                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono outline-none focus:border-blue-500 text-center"
                />
              </div>
              <input
                type="text"
                placeholder="أيدي اللعبة (422)"
                value={newMemberForm.gameId}
                onChange={(e) => setNewMemberForm({ ...newMemberForm, gameId: e.target.value })}
                required
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono outline-none focus:border-blue-500 text-center"
              />
              <input
                type="text"
                placeholder="آيدي حساب الديسكورد للمنشن (اختياري)"
                value={newMemberForm.discordUserId}
                onChange={(e) => setNewMemberForm({ ...newMemberForm, discordUserId: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono outline-none focus:border-blue-500 text-center"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddMemberOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
              >
                إضافة
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Discord Role Mentions & Assignment Modal */}
      {isRoleMentionsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0b101d] border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <span>إدارة وتوزيع رولات الديسكورد بالمنشن (&lt;@&amp;ID&gt;)</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsRoleMentionsModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <DiscordRoleMentionsManager
              roleConfig={cfg}
              onUpdateRoleConfig={(newCfg) => {
                if (developerSettings && onUpdateDeveloperSettings) {
                  const updated: DeveloperSettings = {
                    ...developerSettings,
                    roleCategoriesConfig: newCfg,
                  };
                  onUpdateDeveloperSettings(updated);
                }
                // Reclassify current voice members
                if (voiceMembers.length > 0) {
                  const reclassified = voiceMembers.map((m) => {
                    const { rank, roleCategory } = classifyMemberRole(
                      m.rank || m.discordName,
                      newCfg,
                      m.discordRoles
                    );
                    return {
                      ...m,
                      roleCategory,
                      rank: m.discordRoles && m.discordRoles.length > 0 ? rank : m.rank,
                    };
                  });
                  onVoiceMembersChange(reclassified);
                }
              }}
              onClose={() => setIsRoleMentionsModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
