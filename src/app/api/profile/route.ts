import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getProfileByGithubId,
  isUsernameTaken,
  isUsernameReserved,
  createProfile,
  updateProfile,
} from '@/lib/redis-data';
import { AgentProfile, Capability } from '@/types';

async function getSession() {
  const session = await auth();
  if (!session?.user) return null;
  const user = session.user as Record<string, unknown>;
  return {
    email: user.email as string,
    name: user.name as string,
    image: user.image as string,
    githubId: user.githubId as string,
    githubUsername: user.githubUsername as string,
  };
}

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Username availability check
  const check = req.nextUrl.searchParams.get('check');
  if (check) {
    const reserved = isUsernameReserved(check);
    const taken = reserved ? true : await isUsernameTaken(check);
    return NextResponse.json({ username: check, available: !taken, reserved });
  }

  const profile = await getProfileByGithubId(user.githubId);
  return NextResponse.json({ profile });
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user already has a profile
  const existing = await getProfileByGithubId(user.githubId);
  if (existing) {
    return NextResponse.json({ error: 'Profile already exists' }, { status: 409 });
  }

  const body = await req.json();
  const { username, displayName, bio, website, capabilities } = body;

  // Validate username
  if (!username || !/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(username)) {
    return NextResponse.json(
      { error: 'Username must be 3-40 chars, lowercase alphanumeric and hyphens' },
      { status: 400 },
    );
  }

  if (isUsernameReserved(username)) {
    return NextResponse.json({ error: 'Username is reserved' }, { status: 400 });
  }

  if (await isUsernameTaken(username)) {
    return NextResponse.json({ error: 'Username is taken' }, { status: 409 });
  }

  const now = new Date().toISOString();
  const profile: AgentProfile = {
    username,
    displayName: displayName || user.name || username,
    bio: bio || '',
    avatarUrl: user.image || '',
    website: website || '',
    githubId: user.githubId,
    email: user.email || '',
    capabilities: (capabilities || []) as Capability[],
    isPublished: false,
    createdAt: now,
    updatedAt: now,
  };

  await createProfile(profile);
  return NextResponse.json({ profile }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const existing = await getProfileByGithubId(user.githubId);
  if (!existing) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const body = await req.json();
  const { displayName, bio, website, capabilities, isPublished, walletAddress } = body;

  const updates: Partial<AgentProfile> = {};
  if (displayName !== undefined) updates.displayName = displayName;
  if (bio !== undefined) updates.bio = bio;
  if (website !== undefined) updates.website = website;
  if (capabilities !== undefined) updates.capabilities = capabilities;
  if (isPublished !== undefined) updates.isPublished = isPublished;
  if (walletAddress !== undefined) {
    if (walletAddress !== '' && !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json(
        { error: 'Invalid wallet address. Must be a valid EVM address (0x...)' },
        { status: 400 },
      );
    }
    updates.walletAddress = walletAddress;
  }

  await updateProfile(existing.username, updates);
  const updated = await getProfileByGithubId(user.githubId);
  return NextResponse.json({ profile: updated });
}
