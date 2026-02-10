import { NextRequest, NextResponse } from 'next/server';
import {
  getPublishedProfiles,
  getProfilesByCategory,
  searchProfiles,
} from '@/lib/redis-data';
import { CategoryId } from '@/types';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const query = searchParams.get('q');
  const category = searchParams.get('category') as CategoryId | null;
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

  try {
    let profiles;

    if (query) {
      profiles = await searchProfiles(query);
    } else if (category) {
      profiles = await getProfilesByCategory(category);
    } else {
      profiles = await getPublishedProfiles();
    }

    // Strip private capabilities and limit
    const results = profiles.slice(0, limit).map((p) => ({
      username: p.username,
      displayName: p.displayName,
      bio: p.bio,
      avatarUrl: p.avatarUrl,
      website: p.website,
      capabilities: p.capabilities
        .filter((c) => c.isPublic)
        .map((c) => ({
          name: c.name,
          description: c.description,
          category: c.category,
          contactMethod: c.contactMethod,
          contactEndpoint: c.contactEndpoint,
          approvalMode: c.approvalMode,
          scope: c.scope,
          availability: c.availability,
        })),
    }));

    return NextResponse.json({ agents: results });
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
