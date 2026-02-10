import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getProfileByUsername,
  getReview,
  getReviews,
  createOrUpdateReview,
  getAgentRating,
} from '@/lib/redis-data';
import { Review } from '@/types';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const { searchParams } = req.nextUrl;
  const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));

  try {
    const [reviews, rating] = await Promise.all([
      getReviews(username, offset, limit),
      getAgentRating(username),
    ]);

    return NextResponse.json({ reviews, rating });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user as Record<string, unknown>;
  const reviewerGithubId = user.githubId as string;

  try {
    const body = await req.json();
    const { rating, comment } = body;

    // Validate rating
    if (typeof rating !== 'number' || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json(
        { error: 'Rating must be an integer between 1 and 5' },
        { status: 400 },
      );
    }

    // Validate comment
    if (typeof comment !== 'string' || comment.length > 1000) {
      return NextResponse.json(
        { error: 'Comment must be a string with max 1000 characters' },
        { status: 400 },
      );
    }

    // Check that the agent exists
    const profile = await getProfileByUsername(username);
    if (!profile || !profile.isPublished) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Reject self-review
    if (reviewerGithubId === profile.githubId) {
      return NextResponse.json({ error: 'Cannot review your own agent' }, { status: 400 });
    }

    // Check for existing review
    const existing = await getReview(username, reviewerGithubId);
    const now = new Date().toISOString();

    const review: Review = {
      id: `${username}:${reviewerGithubId}`,
      agentUsername: username,
      reviewerGithubId,
      reviewerDisplayName: (user.name as string) || '',
      reviewerAvatarUrl: (user.image as string) || '',
      rating,
      comment,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    await createOrUpdateReview(review, existing?.rating);

    return NextResponse.json({ review }, { status: existing ? 200 : 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
