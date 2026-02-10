import { redis } from './redis';
import { AgentProfile, AgentRatingSummary, Capability, CategoryId, Review } from '@/types';

// ─── Key Helpers ─────────────────────────────────────────────

const KEYS = {
  profile: (username: string) => `agentpages:profile:${username}`,
  usernames: 'agentpages:usernames',
  usernameByGithub: (githubId: string) => `agentpages:username:by-github:${githubId}`,
  published: 'agentpages:published',
  category: (cat: CategoryId) => `agentpages:category:${cat}`,
  searchNames: 'agentpages:search:names',
  review: (username: string, githubId: string) => `agentpages:review:${username}:${githubId}`,
  reviews: (username: string) => `agentpages:reviews:${username}`,
  ratingSum: (username: string) => `agentpages:rating:sum:${username}`,
  ratingCount: (username: string) => `agentpages:rating:count:${username}`,
};

// ─── Reserved usernames ──────────────────────────────────────

const RESERVED_USERNAMES = new Set([
  'api', 'admin', 'settings', 'login', 'directory',
  'about', 'help', 'support', 'docs', 'blog',
  'static', 'public', 'assets', 'favicon', 'hire',
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
    walletAddress: profile.walletAddress || '',
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
    walletAddress: data.walletAddress || '',
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

// ─── Reviews ─────────────────────────────────────────────────

function serializeReview(review: Review): Record<string, string> {
  return {
    id: review.id,
    agentUsername: review.agentUsername,
    reviewerGithubId: review.reviewerGithubId,
    reviewerDisplayName: review.reviewerDisplayName,
    reviewerAvatarUrl: review.reviewerAvatarUrl,
    rating: String(review.rating),
    comment: review.comment,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  };
}

function deserializeReview(data: Record<string, string>): Review {
  return {
    id: data.id,
    agentUsername: data.agentUsername || '',
    reviewerGithubId: data.reviewerGithubId || '',
    reviewerDisplayName: data.reviewerDisplayName || '',
    reviewerAvatarUrl: data.reviewerAvatarUrl || '',
    rating: parseInt(data.rating || '0', 10),
    comment: data.comment || '',
    createdAt: data.createdAt || '',
    updatedAt: data.updatedAt || '',
  };
}

export async function getReview(username: string, githubId: string): Promise<Review | null> {
  const data = await redis.hgetall(KEYS.review(username, githubId));
  if (!data || Object.keys(data).length === 0) return null;
  return deserializeReview(data as Record<string, string>);
}

export async function getReviews(
  username: string,
  offset: number = 0,
  limit: number = 10,
): Promise<Review[]> {
  const githubIds = await redis.zrange(KEYS.reviews(username), offset, offset + limit - 1, {
    rev: true,
  });
  if (!githubIds.length) return [];

  const pipeline = redis.pipeline();
  for (const gid of githubIds) {
    pipeline.hgetall(KEYS.review(username, gid as string));
  }
  const results = await pipeline.exec();
  return results
    .filter(
      (r): r is Record<string, string> =>
        r !== null && typeof r === 'object' && Object.keys(r).length > 0,
    )
    .map(deserializeReview);
}

export async function createOrUpdateReview(
  review: Review,
  oldRating?: number,
): Promise<void> {
  const pipeline = redis.pipeline();

  // Store the review hash
  pipeline.hset(
    KEYS.review(review.agentUsername, review.reviewerGithubId),
    serializeReview(review),
  );

  // Add/update in sorted set (score = timestamp for ordering)
  pipeline.zadd(KEYS.reviews(review.agentUsername), {
    score: new Date(review.updatedAt).getTime(),
    member: review.reviewerGithubId,
  });

  // Update running sum/count atomically
  if (oldRating !== undefined) {
    // Updating existing review: adjust sum by difference
    const diff = review.rating - oldRating;
    pipeline.incrby(KEYS.ratingSum(review.agentUsername), diff);
  } else {
    // New review: add to sum and increment count
    pipeline.incrby(KEYS.ratingSum(review.agentUsername), review.rating);
    pipeline.incr(KEYS.ratingCount(review.agentUsername));
  }

  await pipeline.exec();
}

export async function getAgentRating(username: string): Promise<AgentRatingSummary> {
  const pipeline = redis.pipeline();
  pipeline.get(KEYS.ratingSum(username));
  pipeline.get(KEYS.ratingCount(username));
  const [sum, count] = await pipeline.exec();

  const totalReviews = parseInt(String(count || '0'), 10);
  const ratingSum = parseInt(String(sum || '0'), 10);

  return {
    averageRating: totalReviews > 0 ? ratingSum / totalReviews : 0,
    totalReviews,
  };
}

export async function getAgentRatings(
  usernames: string[],
): Promise<Record<string, AgentRatingSummary>> {
  if (!usernames.length) return {};

  const pipeline = redis.pipeline();
  for (const u of usernames) {
    pipeline.get(KEYS.ratingSum(u));
    pipeline.get(KEYS.ratingCount(u));
  }
  const results = await pipeline.exec();

  const ratings: Record<string, AgentRatingSummary> = {};
  for (let i = 0; i < usernames.length; i++) {
    const sum = parseInt(String(results[i * 2] || '0'), 10);
    const count = parseInt(String(results[i * 2 + 1] || '0'), 10);
    ratings[usernames[i]] = {
      averageRating: count > 0 ? sum / count : 0,
      totalReviews: count,
    };
  }
  return ratings;
}
