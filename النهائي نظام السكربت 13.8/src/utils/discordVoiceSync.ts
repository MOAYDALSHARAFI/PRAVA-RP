import { VoiceMember, RoleCategoriesConfig, DeveloperSettings, DiscordServerRole } from '../types';
import { DEFAULT_ROLE_CATEGORIES } from '../data/initialData';

/**
 * Normalizes Eastern Arabic / Persian digits to standard ASCII digits (0-9)
 * e.g. ١٥٥٦٦ -> 15566
 */
export function normalizeArabicDigits(str: string): string {
  if (!str) return '';
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

  return str
    .replace(/[٠-٩]/g, (d) => String(arabicDigits.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(persianDigits.indexOf(d)));
}

/**
 * Extracts numeric Discord IDs (Guild ID and Channel ID) or Invite Codes from any link, path, or string
 */
export function extractDiscordIds(input: string): {
  guildId?: string;
  channelId?: string;
  inviteCode?: string;
} {
  if (!input) return {};
  const trimmed = normalizeArabicDigits(input.trim());

  // Pattern 1: channels/<guild_id>/<channel_id>
  const channelLinkMatch = trimmed.match(/channels\/([0-9]{15,22})\/([0-9]{15,22})/i);
  if (channelLinkMatch) {
    return {
      guildId: channelLinkMatch[1],
      channelId: channelLinkMatch[2],
    };
  }

  // Pattern 2: discord.gg/<invite_code> or discord.com/invite/<invite_code>
  const inviteMatch = trimmed.match(/(?:discord\.gg\/|discord\.com\/invite\/)([a-zA-Z0-9_-]+)/i);
  if (inviteMatch) {
    return {
      inviteCode: inviteMatch[1],
    };
  }

  // Pattern 3: Comma or space separated IDs (e.g. "1556636121939841056 1556636124099772469")
  const multiIdMatch = trimmed.match(/([0-9]{15,22})[\s,;]+([0-9]{15,22})/);
  if (multiIdMatch) {
    return {
      guildId: multiIdMatch[1],
      channelId: multiIdMatch[2],
    };
  }

  // Pattern 4: Standalone 15-22 digit numeric ID
  const rawIdMatch = trimmed.match(/([0-9]{15,22})/);
  if (rawIdMatch) {
    return {
      channelId: rawIdMatch[1],
      guildId: rawIdMatch[1],
    };
  }

  return {};
}

/**
 * Extracts Discord Role IDs from any input text (supports mentions <@&123456789>, raw IDs, or space/newline-separated lists)
 */
export function extractRoleIds(input: string): string[] {
  if (!input) return [];
  const normalized = normalizeArabicDigits(input);
  const ids: string[] = [];

  // Match Discord role mentions: <@&123456789>, <@& 123456789>, &123456789, @&123456789
  const mentionMatches = normalized.match(/<@&?\s*([0-9]{15,22})\s*>/g);
  if (mentionMatches) {
    mentionMatches.forEach((m) => {
      const match = m.match(/<@&?\s*([0-9]{15,22})\s*>/);
      if (match && match[1] && !ids.includes(match[1])) {
        ids.push(match[1]);
      }
    });
  }

  // Match @&123456789 or &123456789
  const ampersandMatches = normalized.match(/@?&\s*([0-9]{15,22})/g);
  if (ampersandMatches) {
    ampersandMatches.forEach((m) => {
      const match = m.match(/@?&\s*([0-9]{15,22})/);
      if (match && match[1] && !ids.includes(match[1])) {
        ids.push(match[1]);
      }
    });
  }

  // Match raw 15-22 digit numeric snowflake IDs
  const rawDigitMatches = normalized.match(/\b([0-9]{15,22})\b/g);
  if (rawDigitMatches) {
    rawDigitMatches.forEach((d) => {
      if (!ids.includes(d)) ids.push(d);
    });
  }

  return ids;
}

/**
 * Classifies a nickname / rank / Discord roles into 'leader' | 'officer' | 'soldier'
 * using configured Game Roles and Discord Role Mappings.
 */
export function classifyMemberRole(
  lineOrRank: string,
  config?: RoleCategoriesConfig,
  memberDiscordRoles?: string[]
): { rank: string; roleCategory: 'leader' | 'officer' | 'soldier' } {
  const cfg = config || DEFAULT_ROLE_CATEGORIES;
  const raw = (lineOrRank || '').trim();
  const lower = raw.toLowerCase();

  // Extract any inline role mentions or IDs in the string itself
  const inlineRoleIds = extractRoleIds(raw);
  const allRoleIds = Array.from(new Set([...(memberDiscordRoles || []), ...inlineRoleIds]));

  // 1. Direct Discord Role ID / Mention Mapping (Highest Accuracy when linked with Discord Server)
  if (allRoleIds.length > 0) {
    const mappings = cfg.discordRoleMappings || {};
    const rolesList = cfg.discordRoles || [];
    const leaderRoleIds = cfg.leaderRoleIds || [];
    const officerRoleIds = cfg.officerRoleIds || [];
    const soldierRoleIds = cfg.soldierRoleIds || [];

    // Check for Leader roles first
    for (const rId of allRoleIds) {
      if (mappings[rId] === 'leader' || leaderRoleIds.includes(rId)) {
        const found = rolesList.find((r) => r.id === rId);
        return { rank: found?.name || `<@&${rId}>`, roleCategory: 'leader' };
      }
    }
    // Check for Officer roles
    for (const rId of allRoleIds) {
      if (mappings[rId] === 'officer' || officerRoleIds.includes(rId)) {
        const found = rolesList.find((r) => r.id === rId);
        return { rank: found?.name || `<@&${rId}>`, roleCategory: 'officer' };
      }
    }
    // Check for Soldier roles
    for (const rId of allRoleIds) {
      if (mappings[rId] === 'soldier' || soldierRoleIds.includes(rId)) {
        const found = rolesList.find((r) => r.id === rId);
        return { rank: found?.name || `<@&${rId}>`, roleCategory: 'soldier' };
      }
    }
    // If member has Discord roles on the server, use their highest role name as their rank!
    const nonEveryoneRole = rolesList.find((r) => allRoleIds.includes(r.id) && r.name !== '@everyone');
    if (nonEveryoneRole) {
      const cat = (nonEveryoneRole.category && nonEveryoneRole.category !== 'unassigned') ? nonEveryoneRole.category : 'soldier';
      return { rank: nonEveryoneRole.name, roleCategory: cat };
    }
  }

  // 2. If strictDiscordRolesOnly is active, only match against Discord Roles by name
  if (cfg.strictDiscordRolesOnly && cfg.discordRoles && cfg.discordRoles.length > 0) {
    for (const dRole of cfg.discordRoles) {
      if (dRole.name && (raw.includes(dRole.name) || lower.includes(dRole.name.toLowerCase()))) {
        const cat = dRole.category && dRole.category !== 'unassigned' ? dRole.category : 'soldier';
        return { rank: dRole.name, roleCategory: cat };
      }
    }
    return { rank: 'عضو', roleCategory: 'soldier' };
  }

  // 3. Check Leaders (القادة) - by name / keywords
  for (const r of cfg.leaderRanks) {
    if (r && (raw.includes(r) || lower.includes(r.toLowerCase()))) {
      return { rank: r, roleCategory: 'leader' };
    }
  }

  // 4. Check Officers (الضباط) - by name / keywords
  for (const r of cfg.officerRanks) {
    if (r && (raw.includes(r) || lower.includes(r.toLowerCase()))) {
      return { rank: r, roleCategory: 'officer' };
    }
  }

  // 5. Check Soldiers (الأفراد) - by name / keywords
  for (const r of cfg.soldierRanks) {
    if (r && (raw.includes(r) || lower.includes(r.toLowerCase()))) {
      return { rank: r, roleCategory: 'soldier' };
    }
  }

  // Fallback: Default to "عضو" (Member) so regular members never get fake military ranks like 'جندي'
  return { rank: 'عضو', roleCategory: 'soldier' };
}

/**
 * Parses raw text copied from Discord voice channel (e.g. user list, nicknames)
 * Correctly distinguishes military code (e.g. I-14) from player game ID (e.g. 1551)
 * and classifies members into Leaders, Officers, and Soldiers using game role rules.
 */
export function parseDiscordVoiceText(
  rawText: string,
  roleConfig?: RoleCategoriesConfig
): VoiceMember[] {
  if (!rawText) return [];
  const normalizedText = normalizeArabicDigits(rawText);

  const lines = normalizedText
    .split(/[\n,;]+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const members: VoiceMember[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // Detect rank & roleCategory using configured Game Roles
    const { rank, roleCategory } = classifyMemberRole(line, roleConfig);

    // 1. Detect military code first (e.g. I-85, I-14, S-01, AF-22)
    const codeMatch = line.match(/([A-Z]{1,4}-[0-9]{1,4})/i) || line.match(/(-[0-9]{2,5})/);
    const militaryCode = codeMatch ? codeMatch[0] : `I-${String(10 + (i % 89))}`;

    // 2. Remove military code before searching for player Game ID so digits in code (e.g. 14 in I-14) are not falsely taken as game ID!
    const lineWithoutCode = codeMatch ? line.replace(codeMatch[0], ' ') : line;

    // 3. Search for Game ID (isolated 1 to 6 digits)
    const bracketMatch = lineWithoutCode.match(/[\[\(]([0-9]{1,6})[\]\)]/);
    const hashMatch = lineWithoutCode.match(/(?:#|ID:?|آيدي:?)\s*([0-9]{1,6})/i);
    const endMatch = lineWithoutCode.match(/\b([0-9]{1,6})\s*$/);
    const anyMatch = lineWithoutCode.match(/\b([0-9]{1,6})\b/);

    let gameId = '';
    if (bracketMatch) gameId = bracketMatch[1];
    else if (hashMatch) gameId = hashMatch[1];
    else if (endMatch) gameId = endMatch[1];
    else if (anyMatch) gameId = anyMatch[1];
    else gameId = String(Math.floor(100 + Math.random() * 900));

    // Discord User ID for mention (if <@123...>)
    const mentionMatch = line.match(/<@!?([0-9]{15,22})>/);
    const discordUserId = mentionMatch
      ? mentionMatch[1]
      : String(Math.floor(100000000000000000 + Math.random() * 900000000000000000));

    // Cleaned discord name
    const cleanedName = line.replace(/<@!?([0-9]+)>/, '').trim();

    members.push({
      id: `m-sync-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
      rank,
      rankCode: militaryCode,
      militaryCode,
      gameId,
      discordName: cleanedName,
      discordUserId,
      isAttending: false,
      roleCategory,
    });
  }

  return members;
}

export interface VoiceSyncResult {
  success: boolean;
  members: VoiceMember[];
  message: string;
  isWidgetDisabled?: boolean;
  serverName?: string;
  channelName?: string;
  source?: 'widget' | 'bot_gateway' | 'bot_rest';
  detectedGuildId?: string;
  detectedChannelId?: string;
  wasSwapped?: boolean;
}

/**
 * Connect to Discord Gateway WebSocket to fetch live voice states in real-time
 */
export async function fetchVoiceMembersViaGateway(
  botToken: string,
  targetGuildId?: string,
  targetChannelId?: string,
  roleConfig?: RoleCategoriesConfig
): Promise<{ success: boolean; members: VoiceMember[]; message: string; channelName?: string }> {
  return new Promise((resolve) => {
    const cleanToken = botToken.trim().replace(/^Bot\s+/i, '');
    let resolved = false;

    // Increase safety timeout to 7 seconds for slower networks
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        try {
          ws.close();
        } catch (_) {}
        resolve({
          success: false,
          members: [],
          message: 'انتهت مهلة الاتصال بالبث المباشر لبوت الديسكورد (Gateway Timeout)',
        });
      }
    }, 7000);

    let ws: WebSocket;
    try {
      ws = new WebSocket('wss://gateway.discord.gg/?v=10&encoding=json');
    } catch (err: any) {
      clearTimeout(timeout);
      return resolve({
        success: false,
        members: [],
        message: `فشل فتح اتصال البث المباشر (WebSocket): ${err?.message || ''}`,
      });
    }

    // Pre-fetch guild members cache via REST if possible to resolve nicks and Discord roles
    let membersCache = new Map<string, any>();
    if (targetGuildId) {
      fetch(`/api/discord/v10/guilds/${targetGuildId}/members?limit=1000`, {
        headers: { Authorization: `Bot ${cleanToken}` },
      })
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => {
          if (Array.isArray(data)) {
            data.forEach((m) => {
              if (m.user?.id) membersCache.set(m.user.id, m);
            });
          }
        })
        .catch(() => {});
    }

    ws.onmessage = async (event) => {
      try {
        const payload = JSON.parse(event.data.toString());

        // Opcode 10: HELLO -> Send IDENTIFY
        if (payload.op === 10) {
          ws.send(
            JSON.stringify({
              op: 2,
              d: {
                token: cleanToken,
                intents: 129, // GUILDS (1) + GUILD_VOICE_STATES (128)
                properties: {
                  os: 'browser',
                  browser: 'prava-discord-sync',
                  device: 'prava-discord-sync',
                },
              },
            })
          );
        }

        // Opcode 0: Dispatch events
        if (payload.op === 0 && payload.t === 'GUILD_CREATE') {
          const guild = payload.d;

          // Check if this is the target guild (or take first available guild if target not specified)
          if (!targetGuildId || guild.id === targetGuildId) {
            const currentGuildId = guild.id;
            const voiceStates: Array<{ user_id: string; channel_id: string }> = guild.voice_states || [];

            // Filter for members in target voice channel, or all voice members in guild if no specific channel
            let channelVoiceStates = voiceStates;
            if (targetChannelId && targetChannelId !== '123456789012345678') {
              const matchedInTarget = voiceStates.filter((vs) => vs.channel_id === targetChannelId);
              if (matchedInTarget.length > 0) {
                channelVoiceStates = matchedInTarget;
              } else if (voiceStates.length > 0) {
                // If specific channel has none but other channel has users, fallback to all voice users
                channelVoiceStates = voiceStates;
              }
            }

            // Find channel name if available
            const channelObj = (guild.channels || []).find((c: any) =>
              channelVoiceStates[0] ? c.id === channelVoiceStates[0].channel_id : false
            );
            const channelName = channelObj?.name || 'روم الفويس';

            if (channelVoiceStates.length === 0) {
              if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                try {
                  ws.close();
                } catch (_) {}
                resolve({
                  success: true,
                  members: [],
                  message: `✅ متصل بالبوت وبسيرفر "${guild.name}" بنجاح، لكن لا يوجد أعضاء متصلون في روم الفويس حالياً.`,
                });
              }
              return;
            }

            // Merge any members in guild.members into cache
            if (Array.isArray(guild.members)) {
              guild.members.forEach((m: any) => {
                if (m.user?.id) membersCache.set(m.user.id, m);
              });
            }

            // For each voice state, ensure we have their member details (REST fetch individually if not in cache)
            const resolvedMembers: VoiceMember[] = [];

            for (let i = 0; i < channelVoiceStates.length; i++) {
              const vs = channelVoiceStates[i];
              let gm = membersCache.get(vs.user_id);

              if (!gm) {
                try {
                  const indRes = await fetch(`/api/discord/v10/guilds/${currentGuildId}/members/${vs.user_id}`, {
                    headers: { Authorization: `Bot ${cleanToken}` },
                  });
                  if (indRes.ok) {
                    gm = await indRes.json();
                    if (gm?.user?.id) membersCache.set(gm.user.id, gm);
                  }
                } catch (_) {}
              }

              const displayName = gm?.nick || gm?.user?.global_name || gm?.user?.username || `عضو فويس #${i + 1}`;
              const memberRoles: string[] = Array.isArray(gm?.roles) ? gm.roles : [];

              // Classify role strictly using Discord Roles
              const { rank, roleCategory } = classifyMemberRole(displayName, roleConfig, memberRoles);

              // Extract military code
              const codeMatch = displayName.match(/([A-Z]{1,4}-[0-9]{1,4})/i) || displayName.match(/(-[0-9]{2,5})/);
              const militaryCode = codeMatch ? codeMatch[0] : `I-${String(10 + (i % 89))}`;

              // Remove military code before extracting player ID
              const nameWithoutCode = codeMatch ? displayName.replace(codeMatch[0], ' ') : displayName;
              const bracketMatch = nameWithoutCode.match(/[\[\(]([0-9]{1,6})[\]\)]/);
              const hashMatch = nameWithoutCode.match(/(?:#|ID:?|آيدي:?)\s*([0-9]{1,6})/i);
              const endMatch = nameWithoutCode.match(/\b([0-9]{1,6})\s*$/);
              const anyMatch = nameWithoutCode.match(/\b([0-9]{1,6})\b/);

              let gameId = '';
              if (bracketMatch) gameId = bracketMatch[1];
              else if (hashMatch) gameId = hashMatch[1];
              else if (endMatch) gameId = endMatch[1];
              else if (anyMatch) gameId = anyMatch[1];
              else gameId = String(Math.floor(100 + Math.random() * 900));

              resolvedMembers.push({
                id: `m-dc-${vs.user_id}-${Date.now()}`,
                rank,
                rankCode: militaryCode,
                militaryCode,
                gameId,
                discordName: displayName,
                discordUserId: vs.user_id,
                isAttending: true,
                roleCategory,
                discordRoles: memberRoles,
              });
            }

            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              try {
                ws.close();
              } catch (_) {}
              resolve({
                success: true,
                members: resolvedMembers,
                message: `✅ تم سحب ${resolvedMembers.length} عضواً متواجداً بروم الفويس (${channelName}) عبر البوت بنجاح!`,
                channelName,
              });
            }
          }
        }
      } catch (e) {
        console.warn('Gateway message parsing error:', e);
      }
    };

    ws.onerror = (err) => {
      console.warn('Gateway WebSocket error:', err);
    };

    ws.onclose = (event) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        if (event.code === 4004) {
          resolve({
            success: false,
            members: [],
            message: '❌ توكن البوت (Bot Token) غير صحيح أو منتهي الصلاحية (Discord Error 4004).',
          });
        } else if (event.code === 4014) {
          resolve({
            success: false,
            members: [],
            message:
              '⚠️ البوت بحاجة لصلاحية Voice States Intent في صفحة مطوري الديسكورد (Discord Developer Portal > Bot > Privileged Gateway Intents).',
          });
        } else {
          resolve({
            success: false,
            members: [],
            message: `أغلق اتصال البوت برمز: ${event.code}`,
          });
        }
      }
    };
  });
}

/**
 * Fetch connected voice members from Discord via Bot Token, Guild Widget, or REST API
 */
export async function fetchDiscordVoiceMembers(config: {
  guildId?: string;
  channelId?: string;
  botToken?: string;
  roleCategoriesConfig?: RoleCategoriesConfig;
}): Promise<VoiceSyncResult> {
  try {
    let cleanGuildId = normalizeArabicDigits(config.guildId?.trim() || '');
    let cleanChannelId = normalizeArabicDigits(config.channelId?.trim() || '');
    const cleanBotToken = config.botToken?.trim() || '';

    // If channelId is the old placeholder '123456789012345678', treat as empty
    if (cleanChannelId === '123456789012345678') {
      cleanChannelId = '';
    }

    // Smart extraction from Channel ID field if URL or combined ID was entered
    if (cleanChannelId.includes('channels/')) {
      const extracted = extractDiscordIds(cleanChannelId);
      if (extracted.channelId) cleanChannelId = extracted.channelId;
      if (extracted.guildId && !cleanGuildId) cleanGuildId = extracted.guildId;
    } else {
      const rawMatch = cleanChannelId.match(/([0-9]{15,22})/);
      if (rawMatch) cleanChannelId = rawMatch[1];
    }

    // Smart extraction from Guild ID field if invite link or URL was entered
    if (cleanGuildId.includes('discord.gg/') || cleanGuildId.includes('/invite/') || /^[a-zA-Z0-9_-]{4,16}$/.test(cleanGuildId)) {
      const extracted = extractDiscordIds(cleanGuildId);
      const inviteCode = extracted.inviteCode || cleanGuildId;
      if (inviteCode && !/^[0-9]+$/.test(inviteCode)) {
        try {
          const inviteRes = await fetch(`/api/discord/v10/invites/${inviteCode}`);
          if (inviteRes.ok) {
            const inviteData = await inviteRes.json();
            if (inviteData?.guild?.id) {
              cleanGuildId = inviteData.guild.id;
            }
          }
        } catch (e) {
          console.warn('Invite resolution error:', e);
        }
      }
    } else if (cleanGuildId.includes('channels/')) {
      const extracted = extractDiscordIds(cleanGuildId);
      if (extracted.guildId) cleanGuildId = extracted.guildId;
      if (extracted.channelId && !cleanChannelId) cleanChannelId = extracted.channelId;
    } else {
      const rawMatch = cleanGuildId.match(/([0-9]{15,22})/);
      if (rawMatch) cleanGuildId = rawMatch[1];
    }

    // 1. PRIMARY METHOD WITH BOT TOKEN: Use Discord Gateway & REST for 100% accurate live voice states
    if (cleanBotToken) {
      // First, if cleanChannelId is provided, fetch channel metadata to verify & get exact guild_id
      if (cleanChannelId) {
        try {
          const chRes = await fetch(`/api/discord/v10/channels/${cleanChannelId}`, {
            headers: { Authorization: `Bot ${cleanToken(cleanBotToken)}` },
          });
          if (chRes.ok) {
            const chData = await chRes.json();
            if (chData?.guild_id && !cleanGuildId) {
              cleanGuildId = chData.guild_id;
            }
          }
        } catch (err) {
          console.warn('Channel check error:', err);
        }
      }

      // Try Discord Gateway WebSocket connection
      try {
        const gwRes = await fetchVoiceMembersViaGateway(cleanBotToken, cleanGuildId, cleanChannelId, config.roleCategoriesConfig);
        if (gwRes.success && gwRes.members.length > 0) {
          return {
            success: true,
            members: gwRes.members,
            message: gwRes.message,
            channelName: gwRes.channelName,
            source: 'bot_gateway',
            detectedGuildId: cleanGuildId,
            detectedChannelId: cleanChannelId,
          };
        } else if (gwRes.success && gwRes.members.length === 0) {
          return {
            success: true,
            members: [],
            message: gwRes.message,
            source: 'bot_gateway',
            detectedGuildId: cleanGuildId,
            detectedChannelId: cleanChannelId,
          };
        }
      } catch (e) {
        console.warn('Gateway sync failed, falling back to widget / rest:', e);
      }
    }

    // 2. CHECK DISCORD SERVER WIDGET (The zero-bot solution for website voice sync)
    let candidateGuildId = cleanGuildId;
    let wasSwapped = false;

    // Helper to query widget
    const queryWidget = async (gid: string) => {
      try {
        const res = await fetch(`/api/discord/guilds/${gid}/widget.json`);
        return res;
      } catch (e) {
        return null;
      }
    };

    let widgetRes = candidateGuildId ? await queryWidget(candidateGuildId) : null;

    // Automatic ID Swap Detection: If candidate guild returned 404 and channelId has 15-22 digits, test channelId as guildId!
    if ((!widgetRes || widgetRes.status === 404) && cleanChannelId && /^[0-9]{15,22}$/.test(cleanChannelId)) {
      const swappedRes = await queryWidget(cleanChannelId);
      if (swappedRes && swappedRes.ok) {
        widgetRes = swappedRes;
        const temp = cleanGuildId;
        cleanGuildId = cleanChannelId;
        cleanChannelId = temp;
        wasSwapped = true;
      }
    }

    if (widgetRes) {
      if (widgetRes.ok) {
        const data = await widgetRes.json();
        const serverName = data.name || 'سيرفر الديسكورد';

        if (Array.isArray(data.members)) {
          // Filter by voice channel if specified, or all active voice users
          let voiceUsers = data.members.filter((m: any) =>
            cleanChannelId ? String(m.channel_id) === cleanChannelId : !!m.channel_id
          );

          // If filtering by specific channelId yielded 0 users, but there ARE users in another voice channel on this server:
          if (voiceUsers.length === 0 && cleanChannelId) {
            const allVoiceUsers = data.members.filter((m: any) => !!m.channel_id);
            if (allVoiceUsers.length > 0) {
              voiceUsers = allVoiceUsers;
            }
          }

          if (voiceUsers.length > 0) {
            const parsed: VoiceMember[] = voiceUsers.map((u: any, idx: number) => {
              const name = u.nick || u.username || `عضو فويس #${idx + 1}`;
              const { rank, roleCategory } = classifyMemberRole(name, config.roleCategoriesConfig);
              const codeMatch = name.match(/([A-Z]{1,4}-[0-9]{1,4})/i) || name.match(/(-[0-9]{2,5})/);
              const militaryCode = codeMatch ? codeMatch[0] : `I-${String(10 + (idx % 89))}`;
              const nameWithoutCode = codeMatch ? name.replace(codeMatch[0], ' ') : name;
              const bracketMatch = nameWithoutCode.match(/[\[\(]([0-9]{1,6})[\]\)]/);
              const hashMatch = nameWithoutCode.match(/(?:#|ID:?|آيدي:?)\s*([0-9]{1,6})/i);
              const endMatch = nameWithoutCode.match(/\b([0-9]{1,6})\s*$/);
              const anyMatch = nameWithoutCode.match(/\b([0-9]{1,6})\b/);
              let gameId = '';
              if (bracketMatch) gameId = bracketMatch[1];
              else if (hashMatch) gameId = hashMatch[1];
              else if (endMatch) gameId = endMatch[1];
              else if (anyMatch) gameId = anyMatch[1];
              else gameId = String(Math.floor(100 + Math.random() * 900));

              return {
                id: `m-w-${u.id || idx}-${Date.now()}`,
                rank,
                rankCode: militaryCode,
                militaryCode,
                gameId,
                discordName: name,
                discordUserId: u.id ? String(u.id) : String(Date.now() + idx),
                isAttending: true,
                roleCategory,
              };
            });

            const swapNotice = wasSwapped
              ? ' (تم تصحيح ترتيب رقم السيرفر ورقم الروم تلقائياً)'
              : '';

            return {
              success: true,
              members: parsed,
              serverName,
              source: 'widget',
              wasSwapped,
              detectedGuildId: cleanGuildId,
              detectedChannelId: cleanChannelId,
              message: `✅ تم سحب ${parsed.length} عضواً متواجداً بروم الفويس من سيرفر "${serverName}"${swapNotice} بنجاح!`,
            };
          } else {
            return {
              success: true,
              members: [],
              serverName,
              source: 'widget',
              wasSwapped,
              detectedGuildId: cleanGuildId,
              detectedChannelId: cleanChannelId,
              message: `✅ أداة السيرفر متصلة بسيرفر "${serverName}" بنجاح، ولكن الروم الصوتي فارغ حالياً (لا يوجد أعضاء متصلون في هذا الروم الآن).`,
            };
          }
        }
      } else if (widgetRes.status === 403) {
        const errData = await widgetRes.json().catch(() => ({}));
        if (errData.code === 50004 || errData.message?.includes('Widget Disabled') || widgetRes.status === 403) {
          // If bot token is provided but gateway failed, try REST bot members fetch
          if (cleanBotToken && cleanGuildId) {
            try {
              const botMembersRes = await fetch(`/api/discord/v10/guilds/${cleanGuildId}/members?limit=1000`, {
                headers: { Authorization: `Bot ${cleanToken(cleanBotToken)}` },
              });
              if (botMembersRes.ok) {
                const bMembers = await botMembersRes.json();
                if (Array.isArray(bMembers) && bMembers.length > 0) {
                  const parsed: VoiceMember[] = bMembers.map((m: any, idx: number) => {
                    const line = `${m.nick || m.user?.global_name || m.user?.username || 'عضو'}`;
                    const memberRoles = Array.isArray(m.roles) ? m.roles : [];
                    const { rank, roleCategory } = classifyMemberRole(line, config.roleCategoriesConfig, memberRoles);
                    const codeMatch = line.match(/([A-Z]{1,4}-[0-9]{1,4})/i) || line.match(/(-[0-9]{2,5})/);
                    const militaryCode = codeMatch ? codeMatch[0] : `I-${String(10 + (idx % 89))}`;
                    const gameIdMatch = line.match(/[\[\(]([0-9]{1,6})[\]\)]/) || line.match(/(?:#|ID:?|آيدي:?)\s*([0-9]{1,6})/i) || line.match(/\b([0-9]{1,6})\b/);
                    const gameId = gameIdMatch ? gameIdMatch[1] : String(Math.floor(100 + Math.random() * 900));
                    
                    return {
                      id: `m-bot-${m.user?.id || idx}-${Date.now()}`,
                      rank,
                      rankCode: militaryCode,
                      militaryCode,
                      gameId,
                      discordName: line,
                      discordUserId: m.user?.id || String(Date.now()),
                      isAttending: true,
                      roleCategory,
                      discordRoles: memberRoles,
                    };
                  });
                  return {
                    success: true,
                    members: parsed,
                    source: 'bot_rest',
                    message: `✅ تم الاتصال عبر البوت وسحب ${parsed.length} عضواً مسجلين في السيرفر وتصنيف رتبهم بدقة!`,
                  };
                }
              }
            } catch (_) {}
          }

          return {
            success: false,
            members: [],
            isWidgetDisabled: true,
            detectedGuildId: cleanGuildId,
            detectedChannelId: cleanChannelId,
            message:
              '⚠️ أداة السيرفر (Server Widget) غير مفعلة في سيرفر الديسكورد (خطأ 50004). لتفعيلها في 5 ثوانٍ: ديسكورد > إعدادات السيرفر > الأداة (Widget) > فعّل "تفعيل أداة السيرفر (Enable Server Widget)". أو أدخل توكن البوت في الأسفل للسحب الفوري.',
          };
        }
      } else if (widgetRes.status === 404) {
        return {
          success: false,
          members: [],
          detectedGuildId: cleanGuildId,
          detectedChannelId: cleanChannelId,
          message: `❌ لم يتم العثور على سيرفر ديسكورد بهذا الرقم (${cleanGuildId}). تأكد من نسخ آيدي السيرفر الصحيح.`,
        };
      }
    }

    // Default guidance if neither succeeded
    if (!cleanGuildId && !cleanChannelId && !cleanBotToken) {
      return {
        success: false,
        members: [],
        message: 'يرجى إدخال آيدي سيرفر الديسكورد أو آيدي روم الفويس في إعدادات المطور للبدء بالسحب التلقائي.',
      };
    }

    return {
      success: true,
      members: [],
      message: 'لم يتم العثور على أعضاء متصلين حالياً. تأكد من تفعيل "أداة السيرفر (Widget)" في إعدادات الديسكورد أو يمكنك نسخ أسماء المتواجدين ولصقها مباشرة.',
    };
  } catch (error: any) {
    return {
      success: false,
      members: [],
      message: error?.message || 'فشل الاتصال بروم الفويس',
    };
  }
}

function cleanToken(token: string): string {
  return token.trim().replace(/^Bot\s+/i, '');
}

export interface DiagnosticReport {
  guildIdStatus: { valid: boolean; value: string; message: string };
  channelIdStatus: { valid: boolean; value: string; message: string };
  widgetStatus: { ok: boolean; statusText: string; code?: number };
  botStatus: { provided: boolean; ok?: boolean; message?: string };
  recommendation: string;
  canAutoFixSwap?: boolean;
}

/**
 * Diagnostic test that tests every number and setting, returning clear status
 */
export async function runDiscordDiagnostic(config: {
  guildId?: string;
  channelId?: string;
  botToken?: string;
}): Promise<DiagnosticReport> {
  const normGuild = normalizeArabicDigits(config.guildId?.trim() || '');
  const normChannel = normalizeArabicDigits(config.channelId?.trim() || '');
  const hasBot = !!config.botToken?.trim();

  const report: DiagnosticReport = {
    guildIdStatus: {
      valid: /^[0-9]{15,22}$/.test(normGuild),
      value: normGuild || 'غير محدد',
      message: /^[0-9]{15,22}$/.test(normGuild)
        ? '✓ تنسيق آيدي السيرفر صحيح (رقم ديسكورد)'
        : normGuild
        ? '⚠️ الرقم لا يبدو كآيدي سيرفر قياسي (يتكون عادة من 17-20 رقماً)'
        : 'لم يتم إدخال آيدي السيرفر',
    },
    channelIdStatus: {
      valid: /^[0-9]{15,22}$/.test(normChannel),
      value: normChannel || 'غير محدد',
      message: /^[0-9]{15,22}$/.test(normChannel)
        ? '✓ تنسيق آيدي الروم صحيح'
        : normChannel
        ? '⚠️ الرقم لا يبدو كآيدي روم قياسي'
        : 'لم يتم إدخال آيدي الروم (سيتم فحص جميع رومات الفويس)',
    },
    widgetStatus: { ok: false, statusText: 'لم يتم الفحص بعد' },
    botStatus: { provided: hasBot },
    recommendation: '',
  };

  // Test Widget
  if (normGuild) {
    try {
      const res = await fetch(`/api/discord/guilds/${normGuild}/widget.json`);
      if (res.ok) {
        const d = await res.json();
        report.widgetStatus = { ok: true, statusText: `مفعلة وتعمل بنجاح - السيرفر: "${d.name || normGuild}"` };
      } else if (res.status === 403) {
        report.widgetStatus = {
          ok: false,
          code: 50004,
          statusText: 'مقفلة في السيرفر (Widget Disabled - خطأ 50004). تحتاج تفعيل من إعدادات ديسكورد.',
        };
      } else if (res.status === 404) {
        // Test if channelId is actually the guildId
        if (normChannel && /^[0-9]{15,22}$/.test(normChannel)) {
          const swapCheck = await fetch(`/api/discord/guilds/${normChannel}/widget.json`);
          if (swapCheck.ok) {
            report.canAutoFixSwap = true;
            report.widgetStatus = {
              ok: true,
              statusText: 'تم العثور على السيرفر ولكن الأرقام معكوسة! رقم السيرفر موجود في خانة الروم.',
            };
          } else {
            report.widgetStatus = { ok: false, code: 404, statusText: 'السيرفر غير موجود بهذا الآيدي (Unknown Guild).' };
          }
        } else {
          report.widgetStatus = { ok: false, code: 404, statusText: 'السيرفر غير موجود بهذا الآيدي (Unknown Guild).' };
        }
      }
    } catch (e: any) {
      report.widgetStatus = { ok: false, statusText: `فشل الاتصال: ${e?.message || ''}` };
    }
  }

  // Test Bot Token if provided
  if (hasBot) {
    try {
      const token = cleanToken(config.botToken!);
      const testRes = await fetch('/api/discord/v10/users/@me', {
        headers: { Authorization: `Bot ${token}` },
      });
      if (testRes.ok) {
        const botData = await testRes.json();
        report.botStatus = {
          provided: true,
          ok: true,
          message: `✓ توكن البوت صالح ومتصل باسم: "${botData.username || 'Bot'}"`,
        };
      } else if (testRes.status === 401) {
        report.botStatus = {
          provided: true,
          ok: false,
          message: '❌ توكن البوت غير صالح أو منتهي الصلاحية (401 Unauthorized)',
        };
      } else {
        report.botStatus = {
          provided: true,
          ok: false,
          message: `استجابة البوت غير متوقعة: كود ${testRes.status}`,
        };
      }
    } catch (e: any) {
      report.botStatus = {
        provided: true,
        ok: false,
        message: `تعذر التحقق من البوت: ${e?.message || ''}`,
      };
    }
  }

  // Recommendation synthesis
  if (report.canAutoFixSwap) {
    report.recommendation = '💡 تم رصد أن رقم السيرفر ورقم الروم مقلوبين! اضغط على زر "تبديل وتصحيح الأرقام" لتصليحها فوراً.';
  } else if (report.widgetStatus.ok) {
    report.recommendation = '✅ الأرقام وأداة السيرفر تعملان بنسبة 100%! يمكنك الآن سحب الأعضاء بنجاح.';
  } else if (report.widgetStatus.code === 50004) {
    report.recommendation =
      '⚠️ الأرقام صحيحة لكن أداة السيرفر (Widget) غير مفعلة في ديسكورد. ادخل إعدادات سيرفر ديسكورد > الأداة (Widget) > تفعيل، أو استخدم توكن البوت.';
  } else if (report.widgetStatus.code === 404) {
    report.recommendation =
      '❌ تأكد من رقم السيرفر (Guild ID)، يمكنك نسخه بالضغط بالزر الأيمن على اسم السيرفر في ديسكورد > نسخ معرف السيرفر (Copy Server ID).';
  } else if (report.botStatus.ok) {
    report.recommendation = '✅ توكن البوت صالح ومتصل، السحب سيعمل عبر البوت بنجاح!';
  } else {
    report.recommendation = 'تأكد من تفعيل أداة السيرفر في ديسكورد أو لصق الرابط الكامل من ديسكورد.';
  }

  return report;
}

/**
 * Fetches all roles from a Discord Guild via Discord REST API using the Bot Token.
 * Automatically classifies them into Leader, Officer, or Soldier based on role names.
 */
export async function fetchDiscordGuildRoles(
  botToken: string,
  guildId: string
): Promise<{ success: boolean; roles: DiscordServerRole[]; message: string }> {
  const cleanGuild = normalizeArabicDigits(guildId || '').trim().replace(/[^0-9]/g, '');
  const cleanTok = cleanToken(botToken || '');

  if (!cleanGuild) {
    return {
      success: false,
      roles: [],
      message: '❌ يرجى إدخال آيدي سيرفر الديسكورد (Server ID) أولاً لسحب الرولات.',
    };
  }

  if (!cleanTok) {
    return {
      success: false,
      roles: [],
      message: '❌ يرجى إدخال توكن بوت الديسكورد (Bot Token) أولاً للتمكن من قراءة رتب السيرفر عبر الـ API.',
    };
  }

  try {
    const res = await fetch(`/api/discord/v10/guilds/${cleanGuild}/roles`, {
      headers: {
        Authorization: `Bot ${cleanTok}`,
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        return {
          success: false,
          roles: [],
          message: '❌ توكن بوت الديسكورد غير صالح أو منتهي الصلاحية (Unauthorized 401). تأكد من صحة التوكن.',
        };
      }
      if (res.status === 403) {
        return {
          success: false,
          roles: [],
          message: '❌ البوت لا يمتلك صلاحية قراءة الرتب في هذا السيرفر أو لم تتم دعوته إليه (Forbidden 403). تأكد من دعوة البوت للسيرفر ومنحه صلاحية عرض الرتب.',
        };
      }
      if (res.status === 404) {
        return {
          success: false,
          roles: [],
          message: `❌ لم يتم العثور على سيرفر برقم الآيدي (${cleanGuild}). تأكد من رقم معرف السيرفر (Copy Server ID).`,
        };
      }
      return {
        success: false,
        roles: [],
        message: `❌ فشل الاتصال بديسكورد (كود الخطأ: ${res.status}).`,
      };
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      return {
        success: false,
        roles: [],
        message: '❌ استجابة غير متوقعة من ديسكورد (البيانات المستلمة ليست مصفوفة رولات).',
      };
    }

    // Filter out @everyone
    const filteredRoles = data.filter((r: any) => r.name !== '@everyone');

    // Sort by position descending (highest role in hierarchy first)
    filteredRoles.sort((a: any, b: any) => (b.position || 0) - (a.position || 0));

    // Smart auto-detection of role category
    const autoCategorized: DiscordServerRole[] = filteredRoles.map((r: any) => {
      const name = r.name || '';
      const lower = name.toLowerCase();

      let category: 'leader' | 'officer' | 'soldier' | 'unassigned' = 'unassigned';

      // Leader keywords
      const leaderWords = [
        'قائد', 'قيادة', 'فريق', 'لواء', 'عميد', 'عقيد', 'كبار', 'حاكم', 'وزير',
        'commander', 'chief', 'head', 'high command', 'colonel', 'general', 'lead',
        'crown', 'king', '👑', '♕', '⭐', '🌟'
      ];
      // Officer keywords
      const officerWords = [
        'ضابط', 'ضباط', 'مقدم', 'رائد', 'نقيب', 'ملازم', 'تحري', 'مشرف',
        'officer', 'captain', 'major', 'lieutenant', 'cpt', 'lt', 'maj', 'ltc', '⭐️'
      ];
      // Soldier keywords
      const soldierWords = [
        'فرد', 'أفراد', 'رقيب', 'عريف', 'جندي', 'مستجد', 'طالب', 'عضو', 'سوات', 'ميداني',
        'soldier', 'enlisted', 'sergeant', 'corporal', 'private', 'trooper', 'recruit',
        'cadet', 'member', 'operator', '⚡', '🛡️', '👮'
      ];

      if (leaderWords.some((w) => name.includes(w) || lower.includes(w.toLowerCase()))) {
        category = 'leader';
      } else if (officerWords.some((w) => name.includes(w) || lower.includes(w.toLowerCase()))) {
        category = 'officer';
      } else if (soldierWords.some((w) => name.includes(w) || lower.includes(w.toLowerCase()))) {
        category = 'soldier';
      }

      return {
        id: String(r.id),
        name: r.name,
        color: r.color || 0,
        position: r.position || 0,
        category,
      };
    });

    return {
      success: true,
      roles: autoCategorized,
      message: `✅ تم سحب ${autoCategorized.length} رول من سيرفر الديسكورد بنجاح وتصنيفها تلقائياً!`,
    };
  } catch (err: any) {
    return {
      success: false,
      roles: [],
      message: `❌ خطأ في الاتصال بسيرفر الديسكورد: ${err?.message || 'خطأ غير معروف'}`,
    };
  }
}

