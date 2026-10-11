import React, { useState, useEffect } from 'react';
import {
  SECTORS,
  INITIAL_VOICE_MEMBERS,
  SAMPLE_IMAGE_TAGS,
  DEFAULT_DEVELOPER_SETTINGS,
  DEFAULT_ROLE_CATEGORIES,
  DEFAULT_GANGS,
} from './data/initialData';
import { DEFAULT_FIVEM_SCREENSHOT } from './data/defaultImage';
import {
  Sector,
  VoiceMember,
  ImageTag,
  ScenarioReport,
  AppTheme,
  DeveloperSettings,
} from './types';
import { Navbar } from './components/Navbar';
import { SectorSelectView } from './components/SectorSelectView';
import { SectorLandingView } from './components/SectorLandingView';
import { InspectionStepView } from './components/InspectionStepView';
import { EventStepView } from './components/EventStepView';
import { ReportStepView } from './components/ReportStepView';
import { GuideModal } from './components/GuideModal';
import { HistoryModal } from './components/HistoryModal';
import { SettingsModal } from './components/SettingsModal';
import {
  subscribeToSharedSettings,
  saveSharedSettings,
  saveSharedReport,
  loadSharedReports,
} from './services/firebase';
import { compressImage } from './utils/imageCompressor';
import { classifyMemberRole } from './utils/discordVoiceSync';

export default function App() {
  // Navigation State
  const [currentView, setCurrentView] = useState<'sector_select' | 'sector_landing' | 'wizard'>('sector_select');
  const [wizardStep, setWizardStep] = useState<number>(1);

  // Selected Sector (Defaults to SWAT)
  const [selectedSector, setSelectedSector] = useState<Sector>(SECTORS[0]);

  // Theme State: 'navy' | 'white' | 'gold'
  const [theme, setTheme] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem('brava_app_theme') as AppTheme;
      if (saved && ['navy', 'white', 'gold'].includes(saved)) return saved;
    } catch (e) {
      console.warn(e);
    }
    return 'navy';
  });

  const handleThemeChange = (newTheme: AppTheme) => {
    setTheme(newTheme);
    try {
      localStorage.setItem('brava_app_theme', newTheme);
    } catch (e) {
      console.warn(e);
    }
  };

  // Developer / Owner Settings State (Always deeply merged with DEFAULT_DEVELOPER_SETTINGS)
  const [developerSettings, setDeveloperSettings] = useState<DeveloperSettings>(() => {
    try {
      const saved = localStorage.getItem('brava_dev_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_DEVELOPER_SETTINGS,
          ...parsed,
          developerPin: parsed.developerPin === '1234' ? '1022' : (parsed.developerPin || '1022'),
          sectorStatus: {
            ...DEFAULT_DEVELOPER_SETTINGS.sectorStatus,
            ...(parsed.sectorStatus || {}),
          },
          sectorLogos: {
            ...DEFAULT_DEVELOPER_SETTINGS.sectorLogos,
            swat: localStorage.getItem('brava_sector_logo_swat') || parsed.sectorLogos?.swat || null,
            public_security:
              localStorage.getItem('brava_sector_logo_public_security') ||
              parsed.sectorLogos?.public_security ||
              null,
            armed_forces:
              localStorage.getItem('brava_sector_logo_armed_forces') ||
              parsed.sectorLogos?.armed_forces ||
              null,
            general_investigation:
              localStorage.getItem('brava_sector_logo_general_investigation') ||
              parsed.sectorLogos?.general_investigation ||
              null,
          },
          sectorChannels: {
            ...DEFAULT_DEVELOPER_SETTINGS.sectorChannels,
            ...(parsed.sectorChannels || {}),
          },
          sectorTemplates: {
            ...DEFAULT_DEVELOPER_SETTINGS.sectorTemplates,
            ...(parsed.sectorTemplates || {}),
          },
          roleCategoriesConfig: {
            leaderRanks:
              parsed.roleCategoriesConfig?.leaderRanks || DEFAULT_ROLE_CATEGORIES.leaderRanks,
            officerRanks:
              parsed.roleCategoriesConfig?.officerRanks || DEFAULT_ROLE_CATEGORIES.officerRanks,
            soldierRanks:
              parsed.roleCategoriesConfig?.soldierRanks || DEFAULT_ROLE_CATEGORIES.soldierRanks,
          },
          messageTemplate: parsed.messageTemplate || DEFAULT_DEVELOPER_SETTINGS.messageTemplate,
          voiceRoomName: parsed.voiceRoomName || DEFAULT_DEVELOPER_SETTINGS.voiceRoomName,
        };
      }
    } catch (e) {
      console.warn(e);
    }
    return DEFAULT_DEVELOPER_SETTINGS;
  });

  // Real-time synchronization of shared settings across all users and devices
  useEffect(() => {
    const unsubscribe = subscribeToSharedSettings((remote) => {
      setDeveloperSettings((prev) => ({
        ...prev,
        ...remote,
        sectorLogos: {
          ...DEFAULT_DEVELOPER_SETTINGS.sectorLogos,
          swat: localStorage.getItem('brava_sector_logo_swat') || remote.sectorLogos?.swat || prev.sectorLogos?.swat || null,
          public_security:
            localStorage.getItem('brava_sector_logo_public_security') ||
            remote.sectorLogos?.public_security ||
            prev.sectorLogos?.public_security ||
            null,
          armed_forces:
            localStorage.getItem('brava_sector_logo_armed_forces') ||
            remote.sectorLogos?.armed_forces ||
            prev.sectorLogos?.armed_forces ||
            null,
          general_investigation:
            localStorage.getItem('brava_sector_logo_general_investigation') ||
            remote.sectorLogos?.general_investigation ||
            prev.sectorLogos?.general_investigation ||
            null,
        },
      }));
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateDeveloperSettings = async (settings: DeveloperSettings) => {
    setDeveloperSettings(settings);

    // Live update: re-classify current voice members immediately with new role categories
    if (settings.roleCategoriesConfig && voiceMembers.length > 0) {
      setVoiceMembers((prev) =>
        prev.map((m) => {
          const { rank, roleCategory } = classifyMemberRole(
            m.rank || m.discordName,
            settings.roleCategoriesConfig,
            m.discordRoles
          );
          return {
            ...m,
            roleCategory,
            rank: m.discordRoles && m.discordRoles.length > 0 && !m.rank.startsWith('<@&') ? rank : m.rank,
          };
        })
      );
    }

    try {
      localStorage.setItem('brava_dev_settings', JSON.stringify(settings));
      if (settings.sectorLogos) {
        Object.entries(settings.sectorLogos).forEach(([key, val]) => {
          if (val) localStorage.setItem('brava_sector_logo_' + key, val);
          else localStorage.removeItem('brava_sector_logo_' + key);
        });
      }
    } catch (e) {
      console.warn(e);
    }
    // Save to Firestore so it is saved for EVERYONE across all devices and sessions!
    await saveSharedSettings(settings);
  };

  // Exact custom logo uploaded by developer/owner
  const [customLogo, setCustomLogo] = useState<string | null>(() => {
    try {
      return localStorage.getItem('brava_custom_logo');
    } catch (e) {
      return null;
    }
  });

  const handleUploadLogo = async (file: File) => {
    try {
      const compressed = await compressImage(file, 400, 400, 0.85);
      setCustomLogo(compressed);
      try {
        localStorage.setItem('brava_custom_logo', compressed);
      } catch (err) {
        console.warn(err);
      }
    } catch (e) {
      console.warn('Error compressing server logo:', e);
    }
  };

  const handleResetLogo = () => {
    setCustomLogo(null);
    try {
      localStorage.removeItem('brava_custom_logo');
    } catch (e) {
      console.warn(e);
    }
  };

  // Voice Members State (Starts 100% EMPTY - pulled strictly from Discord, never saved with mock users)
  const [voiceMembers, setVoiceMembers] = useState<VoiceMember[]>(() => {
    try {
      localStorage.removeItem('brava_voice_members');
    } catch (e) {
      console.warn(e);
    }
    return [];
  });

  // Screenshot & Tags State (Starts empty with dropzone as requested by user)
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [tags, setTags] = useState<ImageTag[]>([]);

  // Event & Location State
  const [selectedEventType, setSelectedEventType] = useState<string>('robbery');
  const [customEventType, setCustomEventType] = useState<string>('');
  const [subStage, setSubStage] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('البنك المركزي');
  const [gridNumber, setGridNumber] = useState<string>('');
  const [targetGang, setTargetGang] = useState<string>('CL');
  const [gangsList, setGangsList] = useState<string[]>(() => {
    return developerSettings.roleCategoriesConfig?.gangs || DEFAULT_GANGS;
  });

  const handleAddGang = (newGang: string) => {
    const clean = newGang.trim().toUpperCase();
    if (clean && !gangsList.includes(clean)) {
      const updated = [...gangsList, clean];
      setGangsList(updated);
      setTargetGang(clean);
    }
  };

  const [dateTime, setDateTime] = useState<string>(() => {
    return new Date().toISOString().slice(0, 16);
  });

  // Reports History (with localStorage persistence)
  const [reportsHistory, setReportsHistory] = useState<ScenarioReport[]>(() => {
    try {
      const saved = localStorage.getItem('brava_reports_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed reading history from localStorage', e);
    }
    return [];
  });

  // Sync cloud reports on mount
  useEffect(() => {
    loadSharedReports().then((remoteReports) => {
      if (remoteReports.length > 0) {
        setReportsHistory((prev) => {
          const ids = new Set(prev.map((r) => r.id));
          const merged = [...prev];
          remoteReports.forEach((r) => {
            if (!ids.has(r.id)) merged.push(r);
          });
          return merged.slice(0, 20);
        });
      }
    });
  }, []);

  const saveReportToHistory = (reportData: Partial<ScenarioReport>) => {
    const newReport: ScenarioReport = {
      id: `rep-${Date.now()}`,
      sectorId: selectedSector.id,
      sectorName: selectedSector.nameAr,
      eventType: reportData.eventType || selectedEventType,
      subStage: reportData.subStage || subStage,
      location: reportData.location || selectedLocation,
      gridNumber: reportData.gridNumber || gridNumber,
      dateTime: reportData.dateTime || dateTime,
      officerInCharge: reportData.officerInCharge || '',
      attendingMembers: reportData.attendingMembers || voiceMembers.filter((m) => m.isAttending),
      formattedMessage: reportData.formattedMessage || '',
      targetGang: reportData.targetGang || (selectedEventType === 'raid' ? targetGang : undefined),
      createdAt: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
    };

    const updated = [newReport, ...reportsHistory.slice(0, 9)];
    setReportsHistory(updated);
    try {
      localStorage.setItem('brava_reports_history', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed saving history', e);
    }

    // Save report to shared Firestore
    saveSharedReport(newReport).catch(() => {});
  };

  const handleClearHistory = () => {
    setReportsHistory([]);
    try {
      localStorage.removeItem('brava_reports_history');
    } catch (e) {
      console.warn(e);
    }
  };

  // Modals
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Active attending count
  const attendingCount = voiceMembers.filter((m) => m.isAttending).length;

  // View transitions
  const handleSelectSector = (sector: Sector) => {
    setSelectedSector(sector);
    setScreenshotUrl(null);
    setTags([]);
    setCurrentView('sector_landing');
    setWizardStep(1);
  };

  const handleStartFromLanding = () => {
    setCurrentView('wizard');
    setWizardStep(2);
  };

  const handleResetFlow = () => {
    setVoiceMembers(
      voiceMembers.map((m) => ({ ...m, isAttending: false, detectedFromImage: false }))
    );
    setTags([]);
    setScreenshotUrl(null);
    setSelectedEventType('callout');
    setCustomEventType('');
    setSubStage('');
    setGridNumber('');
    setCurrentView('sector_landing');
    setWizardStep(1);
  };

  // Dynamic Theme Container Classes
  const getThemeClasses = () => {
    if (theme === 'white') {
      return 'theme-white bg-slate-100 text-slate-900 selection:bg-blue-600 selection:text-white';
    }
    if (theme === 'gold') {
      return 'theme-gold bg-[#080809] text-amber-50 selection:bg-amber-600 selection:text-slate-950';
    }
    // Default navy
    return 'theme-navy bg-[#070b12] text-slate-100 selection:bg-blue-600 selection:text-white';
  };

  // If in sector selection view
  if (currentView === 'sector_select') {
    return (
      <div className={`min-h-screen ${getThemeClasses()}`}>
        <SectorSelectView
          sectors={SECTORS}
          onSelectSector={handleSelectSector}
          customLogoUrl={customLogo}
          onOpenSettings={() => setIsSettingsOpen(true)}
          serverName={developerSettings.serverName}
          serverSubtitle={developerSettings.serverSubtitle}
          sectorLogos={developerSettings.sectorLogos}
          sectorStatus={developerSettings.sectorStatus}
        />

        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          currentTheme={theme}
          onThemeChange={handleThemeChange}
          customLogoUrl={customLogo}
          onUploadLogo={handleUploadLogo}
          onResetLogo={handleResetLogo}
          developerSettings={developerSettings}
          onUpdateDeveloperSettings={handleUpdateDeveloperSettings}
          voiceMembers={voiceMembers}
          onVoiceMembersChange={setVoiceMembers}
        />
      </div>
    );
  }

  // Active event label
  const activeEventName = customEventType.trim()
    ? customEventType
    : selectedEventType === 'robbery'
    ? 'سرقة'
    : selectedEventType === 'callout'
    ? 'بلاغ'
    : selectedEventType === 'backup'
    ? 'مساندة'
    : selectedEventType === 'raid'
    ? targetGang ? `مداهمة (عصابة ${targetGang})` : 'مداهمة'
    : selectedEventType === 'briefing'
    ? 'توزيع مهام'
    : selectedEventType === 'event'
    ? 'فعالية'
    : selectedEventType === 'training'
    ? 'تدريب'
    : selectedEventType === 'checkpoint'
    ? 'نقطة تفتيش'
    : selectedEventType === 'sweep'
    ? 'تمشيط'
    : 'سناريو ميداني';

  const currentSectorCustomLogo =
    developerSettings.sectorLogos[selectedSector.id as keyof typeof developerSettings.sectorLogos];

  const currentSectorDiscordChannel =
    developerSettings.sectorChannels[selectedSector.id as keyof typeof developerSettings.sectorChannels];

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${getThemeClasses()}`}>
      {/* Tactical Navbar */}
      <Navbar
        currentStep={currentView === 'sector_landing' ? 1 : wizardStep}
        onStepChange={(step) => {
          if (step === 1) {
            setCurrentView('sector_landing');
            setWizardStep(1);
          } else {
            setCurrentView('wizard');
            setWizardStep(step);
          }
        }}
        selectedSector={selectedSector}
        onSelectSectorClick={() => {
          setScreenshotUrl(null);
          setTags([]);
          setCurrentView('sector_select');
        }}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        attendanceCount={attendingCount}
        totalVoiceCount={voiceMembers.length}
        historyCount={reportsHistory.length}
        customLogoUrl={customLogo}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-12">
        {currentView === 'sector_landing' && (
          <SectorLandingView
            sector={selectedSector}
            onStart={handleStartFromLanding}
            voiceCount={voiceMembers.length}
            customLogoUrl={currentSectorCustomLogo}
          />
        )}

        {currentView === 'wizard' && wizardStep === 2 && (
          <InspectionStepView
            screenshotUrl={screenshotUrl}
            onScreenshotChange={setScreenshotUrl}
            tags={tags}
            onTagsChange={setTags}
            voiceMembers={voiceMembers}
            onVoiceMembersChange={setVoiceMembers}
            onNext={() => setWizardStep(3)}
            onBack={() => {
              setCurrentView('sector_landing');
              setWizardStep(1);
            }}
            developerSettings={developerSettings}
            onUpdateDeveloperSettings={handleUpdateDeveloperSettings}
            onClearVoiceMembers={() => setVoiceMembers([])}
          />
        )}

        {currentView === 'wizard' && wizardStep === 3 && (
          <EventStepView
            selectedEventType={selectedEventType}
            onEventTypeChange={setSelectedEventType}
            customEventType={customEventType}
            onCustomEventTypeChange={setCustomEventType}
            subStage={subStage}
            onSubStageChange={setSubStage}
            selectedLocation={selectedLocation}
            onLocationChange={setSelectedLocation}
            gridNumber={gridNumber}
            onGridNumberChange={setGridNumber}
            dateTime={dateTime}
            onDateTimeChange={setDateTime}
            targetGang={targetGang}
            onTargetGangChange={setTargetGang}
            gangsList={gangsList}
            onAddGang={handleAddGang}
            onNext={() => setWizardStep(4)}
            onBack={() => setWizardStep(2)}
          />
        )}

        {currentView === 'wizard' && wizardStep === 4 && (
          <ReportStepView
            sector={selectedSector}
            eventType={activeEventName}
            subStage={subStage}
            location={selectedLocation}
            gridNumber={gridNumber}
            dateTime={dateTime}
            screenshotUrl={screenshotUrl}
            targetGang={selectedEventType === 'raid' ? targetGang : undefined}
            attendingMembers={voiceMembers.filter((m) => m.isAttending)}
            onBack={() => setWizardStep(3)}
            onReset={handleResetFlow}
            onSaveReport={saveReportToHistory}
            messageTemplate={developerSettings.messageTemplate}
            sectorTemplates={developerSettings.sectorTemplates}
            serverName={developerSettings.serverName}
            defaultDiscordChannel={currentSectorDiscordChannel}
            roleCategoriesConfig={developerSettings.roleCategoriesConfig}
          />
        )}
      </main>

      {/* Modals */}
      <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        reports={reportsHistory}
        onClearHistory={handleClearHistory}
        onCopyReport={async (text) => {
          await navigator.clipboard.writeText(text);
        }}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentTheme={theme}
        onThemeChange={handleThemeChange}
        customLogoUrl={customLogo}
        onUploadLogo={handleUploadLogo}
        onResetLogo={handleResetLogo}
        developerSettings={developerSettings}
        onUpdateDeveloperSettings={handleUpdateDeveloperSettings}
        voiceMembers={voiceMembers}
        onVoiceMembersChange={setVoiceMembers}
      />
    </div>
  );
}
