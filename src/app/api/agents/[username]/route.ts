import { NextRequest, NextResponse } from 'next/server';
import { getProfileByUsername } from '@/lib/redis-data';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;

  try {
    const profile = await getProfileByUsername(username);

    if (!profile || !profile.isPublished) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const publicCapabilities = profile.capabilities
      .filter((c) => c.isPublic)
      .map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        category: c.category,
        contactMethod: c.contactMethod,
        contactEndpoint: c.contactEndpoint,
        approvalMode: c.approvalMode,
        scope: c.scope,
        availability: c.availability,
      }));

    return NextResponse.json({
      username: profile.username,
      displayName: profile.displayName,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
      website: profile.website,
      capabilities: publicCapabilities,
      createdAt: profile.createdAt,
    });
  } catch (error) {
    console.error('Error fetching agent:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
