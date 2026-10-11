export type AppTheme = 'navy' | 'white' | 'gold';

export interface Sector {
  id: string;
  nameAr: string;
  nameEn: string;
  isActive: boolean;
  statusBadge: string;
  code: string;
  description: string;
  accentColor: string;
  customLogoUrl?: string | null;
}

export interface VoiceMember {
  id: string;
  rank: string;
  rankCode: string;
  militaryCode: string;
  gameId: string;
  discordName: string;
  discordUserId: string;
  isAttending: boolean;
  detectedFromImage?: boolean;
  roleCategory?: 'leader' | 'officer' | 'soldier';
  discordRoles?: string[];
}

export interface ImageTag {
  id: string;
  text: string;
  x: number; // percentage of image width
  y: number; // percentage of image height
  status: 'matched' | 'missing_from_voice' | 'needs_decision' | 'ignored';
  matchedMemberId?: string;
  isInVoice?: boolean;
}

export interface EventType {
  id: string;
  name: string;
  iconName: string;
  hasSubStages?: boolean;
  requiresGrid?: boolean;
  subStages?: { id: string; label: string }[];
}

export interface LocationItem {
  id: string;
  name: string;
  category: 'البنوك' | 'المترو' | 'المصانع' | 'مواقع أخرى';
}

export interface ScenarioReport {
  id: string;
  sectorId: string;
  sectorName: string;
  eventType: string;
  subStage?: string;
  location: string;
  gridNumber?: string;
  dateTime: string;
  officerInCharge: string;
  attendingMembers: VoiceMember[];
  screenshotUrl?: string;
  targetGang?: string;
  formattedMessage: string;
  createdAt: string;
}

export interface TemplateSettings {
  headerTitle: string;
  includeMentionsList: boolean;
  includeRawMentionsBlock: boolean;
  discordWebhookUrl?: string;
  discordChannelUrl?: string;
}

export interface DeveloperSettings {
  serverName: string;
  serverSubtitle: string;
  developerPin: string;
  discordWebhook: string;
  discordChannelUrl: string;
  discordBotToken: string;
  discordGuildId: string;
  discordVoiceChannelId: string;
  sectorStatus: {
    swat: boolean;
    public_security: boolean;
    armed_forces: boolean;
    general_investigation: boolean;
  };
  sectorLogos: {
    swat: string | null;
    public_security: string | null;
    armed_forces: string | null;
    general_investigation: string | null;
  };
  sectorChannels: {
    swat: string;
    public_security: string;
    armed_forces: string;
    general_investigation: string;
  };
  sectorVoiceChannels: {
    swat: string;
    public_security: string;
    armed_forces: string;
    general_investigation: string;
  };
  sectorTemplates: {
    swat: string;
    public_security: string;
    armed_forces: string;
    general_investigation: string;
  };
  voiceRoomName: string;
  messageTemplate: string;
  roleCategoriesConfig?: RoleCategoriesConfig;
}

export interface DiscordServerRole {
  id: string;
  name: string;
  color?: number;
  position?: number;
  category?: 'leader' | 'officer' | 'soldier' | 'unassigned';
}

export interface RoleCategoriesConfig {
  leaderRanks: string[];
  officerRanks: string[];
  soldierRanks: string[];
  leaderRoleIds?: string[];
  officerRoleIds?: string[];
  soldierRoleIds?: string[];
  discordRoles?: DiscordServerRole[];
  discordRoleMappings?: Record<string, 'leader' | 'officer' | 'soldier'>;
  strictDiscordRolesOnly?: boolean;
  gangs?: string[];
}
