import { redis } from './redis';
import { AgentProfile, Capability, CategoryId } from '@/types';

// ─── Key Helpers ─────────────────────────────────────────────

const KEYS = {
  profile: (username: string) => `agentpages:profile:${username}`,
  usernames: 'agentpages:usernames',
  usernameByGithub: (githubId: string) => `agentpages:username:by-github:${githubId}`,
  published: 'agentpages:published',
  category: (cat: CategoryId) => `agentpages:category:${cat}`,
  searchNames: 'agentpages:search:names',
};

// ─── Reserved usernames ──────────────────────────────────────

const RESERVED_USERNAMES = new Set([
  'api', 'admin', 'settings', 'login', 'directory',
  'about', 'help', 'support', 'docs', 'blog',
  'static', 'public', 'assets', 'favicon',
]);

export function isUsernameReserved(username: string): boolean {
  return RESERVED_USERNAMES.has(username.toLowerCase());
}

// ─── Serialization ───────────────────────────────────────────

function serializeProfile(profile: AgentProfile): Record<string, string> {
  return {
    username: profile.username,
    displayName: profile.displayName,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl,
    website: profile.website,
    githubId: profile.githubId,
    email: profile.email,
    capabilities: JSON.stringify(profile.capabilities),
    isPublished: profile.isPublished ? '1' : '0',
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

function deserializeProfile(data: Record<string, string>): AgentProfile {
  let capabilities: Capability[] = [];
  try {
    capabilities = JSON.parse(data.capabilities || '[]');
  } catch {
    capabilities = [];
  }

  return {
    username: data.username,
    displayName: data.displayName || '',
    bio: data.bio || '',
    avatarUrl: data.avatarUrl || '',
    website: data.website || '',
    githubId: data.githubId || '',
    email: data.email || '',
    capabilities,
    isPublished: data.isPublished === '1',
    createdAt: data.createdAt || '',
    updatedAt: data.updatedAt || '',
  };
}

// ─── Profile CRUD ────────────────────────────────────────────

export async function getProfileByUsername(username: string): Promise<AgentProfile | null> {
  const data = await redis.hgetall(KEYS.profile(username));
  if (!data || Object.keys(data).length === 0) return null;
  return deserializeProfile(data as Record<string, string>);
}

export async function getProfileByGithubId(githubId: string): Promise<AgentProfile | null> {
  const username = await redis.get<string>(KEYS.usernameByGithub(githubId));
  if (!username) return null;
  return getProfileByUsername(username);
}

export async function isUsernameTaken(username: string): Promise<boolean> {
  return await redis.sismember(KEYS.usernames, username) === 1;
}

export async function createProfile(profile: AgentProfile): Promise<void> {
  const pipeline = redis.pipeline();
  pipeline.hset(KEYS.profile(profile.username), serializeProfile(profile));
  pipeline.sadd(KEYS.usernames, profile.username);
  pipeline.set(KEYS.usernameByGithub(profile.githubId), profile.username);

  // Add to search index (lowercase for prefix search)
  pipeline.zadd(KEYS.searchNames, {
    score: 0,
    member: `${profile.username.toLowerCase()}:${profile.username}`,
  });

  if (profile.isPublished) {
    pipeline.sadd(KEYS.published, profile.username);
    for (const cap of profile.capabilities) {
      if (cap.isPublic) {
        pipeline.sadd(KEYS.category(cap.category), profile.username);
      }
    }
  }

  await pipeline.exec();
}

export async function updateProfile(
  username: string,
  updates: Partial<AgentProfile>,
): Promise<void> {
  const existing = await getProfileByUsername(username);
  if (!existing) throw new Error(`Profile ${username} not found`);

  const updated: AgentProfile = {
    ...existing,
    ...updates,
    username: existing.username, // username is immutable
    githubId: existing.githubId, // githubId is immutable
    updatedAt: new Date().toISOString(),
  };

  const pipeline = redis.pipeline();
  pipeline.hset(KEYS.profile(username), serializeProfile(updated));

  // Update search index with new display name
  // Remove old entry, add new
  pipeline.zrem(KEYS.searchNames, `${existing.username.toLowerCase()}:${existing.username}`);
  pipeline.zadd(KEYS.searchNames, {
    score: 0,
    member: `${updated.username.toLowerCase()}:${updated.username}`,
  });

  // Sync published set
  if (updated.isPublished) {
    pipeline.sadd(KEYS.published, username);
  } else {
    pipeline.srem(KEYS.published, username);
  }

  // Rebuild category sets for this user
  const allCategories: CategoryId[] = [
    'scheduling', 'freelance', 'purchasing', 'social', 'research',
    'communication', 'data', 'development', 'finance', 'creative', 'other',
  ];

  // Remove from all categories first
  for (const cat of allCategories) {
    pipeline.srem(KEYS.category(cat), username);
  }

  // Re-add to relevant categories if published
  if (updated.isPublished) {
    const activeCategories = new Set(
      updated.capabilities.filter((c) => c.isPublic).map((c) => c.category)
    );
    for (const cat of activeCategories) {
      pipeline.sadd(KEYS.category(cat), username);
    }
  }

  await pipeline.exec();
}

// ─── Directory queries ───────────────────────────────────────

export async function getPublishedProfiles(): Promise<AgentProfile[]> {
  const usernames = await redis.smembers(KEYS.published);
  if (!usernames.length) return [];

  const pipeline = redis.pipeline();
  for (const u of usernames) {
    pipeline.hgetall(KEYS.profile(u));
  }
  const results = await pipeline.exec();
  return results
    .filter((r): r is Record<string, string> => r !== null && typeof r === 'object' && Object.keys(r).length > 0)
    .map(deserializeProfile);
}

export async function getProfilesByCategory(category: CategoryId): Promise<AgentProfile[]> {
  const usernames = await redis.smembers(KEYS.category(category));
  if (!usernames.length) return [];

  const pipeline = redis.pipeline();
  for (const u of usernames) {
    pipeline.hgetall(KEYS.profile(u));
  }
  const results = await pipeline.exec();
  return results
    .filter((r): r is Record<string, string> => r !== null && typeof r === 'object' && Object.keys(r).length > 0)
    .map(deserializeProfile);
}

export async function searchProfiles(query: string): Promise<AgentProfile[]> {
  const prefix = query.toLowerCase();
  // ZRANGE with BYLEX for prefix search
  const matches = await redis.zrange(
    KEYS.searchNames,
    `[${prefix}`,
    `[${prefix}\xff`,
    { byLex: true, offset: 0, count: 20 }
  );

  if (!matches.length) return [];

  const usernames = (matches as string[]).map((m) => m.split(':')[1]).filter(Boolean);
  if (!usernames.length) return [];

  const pipeline = redis.pipeline();
  for (const u of usernames) {
    pipeline.hgetall(KEYS.profile(u));
  }
  const results = await pipeline.exec();
  return results
    .filter((r): r is Record<string, string> => r !== null && typeof r === 'object' && Object.keys(r).length > 0)
    .map(deserializeProfile)
    .filter((p) => p.isPublished);
}

export async function getRecentProfiles(limit: number = 6): Promise<AgentProfile[]> {
  const profiles = await getPublishedProfiles();
  return profiles
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}
