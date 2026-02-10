export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { getProfileByUsername, getAgentRating } from '@/lib/redis-data';
import { auth } from '@/lib/auth';
import { CATEGORY_MAP } from '@/lib/categories';
import {
  Bot, Globe, Github, ExternalLink, Shield, Zap, Clock,
  Calendar, Briefcase, ShoppingCart, Users, Search,
  MessageSquare, Database, Code, DollarSign, Palette,
} from 'lucide-react';
import { ContactMethod, ApprovalMode } from '@/types';
import { StarRating } from '@/components/StarRating';
import { ReviewSection } from '@/components/ReviewSection';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Calendar, Briefcase, ShoppingCart, Users, Search,
  MessageSquare, Database, Code, DollarSign, Palette, Zap,
};

const CONTACT_LABELS: Record<ContactMethod, string> = {
  api: 'REST API',
  webhook: 'Webhook',
  email: 'Email',
  mcp: 'MCP Server',
};

const APPROVAL_LABELS: Record<ApprovalMode, { label: string; color: string }> = {
  autonomous: { label: 'Autonomous', color: 'text-green-600 bg-green-50' },
  human_approval: { label: 'Human Approval', color: 'text-amber-600 bg-amber-50' },
  conditional: { label: 'Conditional', color: 'text-blue-600 bg-blue-50' },
};

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const [profile, rating, session] = await Promise.all([
    getProfileByUsername(username),
    getAgentRating(username),
    auth(),
  ]);

  if (!profile || !profile.isPublished) {
    notFound();
  }

  const publicCaps = profile.capabilities.filter((c) => c.isPublic);
  const currentUserGithubId = session?.user
    ? (session.user as unknown as Record<string, unknown>).githubId as string | undefined
    : undefined;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      {/* Header */}
      <div className="flex items-start gap-5">
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt=""
            className="h-16 w-16 rounded-2xl border border-border-subtle"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
            <Bot className="h-8 w-8 text-accent" />
          </div>
        )}
        <div>
          <h1 className="font-heading text-2xl font-bold text-text-primary">
            {profile.displayName || profile.username}
          </h1>
          <p className="text-sm text-text-muted">@{profile.username}</p>
          <div className="mt-2 flex items-center gap-3">
            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-accent hover:underline"
              >
                <Globe className="h-3 w-3" />
                {profile.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </a>
            )}
            {profile.githubId && (
              <span className="flex items-center gap-1 text-xs text-text-muted">
                <Github className="h-3 w-3" />
                GitHub verified
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="mt-6 text-text-secondary leading-relaxed">{profile.bio}</p>
      )}

      {/* Rating Summary */}
      {rating.totalReviews > 0 && (
        <div className="mt-4">
          <StarRating rating={rating.averageRating} totalReviews={rating.totalReviews} />
        </div>
      )}

      {/* Machine-readable endpoint hint */}
      <div className="mt-6 rounded-lg bg-bg-secondary px-4 py-2.5 font-mono text-xs text-text-muted">
        <span className="text-accent">GET</span>{' '}
        /api/agents/{profile.username}
        <span className="ml-2 text-text-muted opacity-60">— JSON endpoint for agent-to-agent discovery</span>
      </div>

      {/* Capabilities */}
      {publicCaps.length > 0 && (
        <div className="mt-10">
          <h2 className="font-heading text-lg font-semibold text-text-primary mb-4">
            Capabilities ({publicCaps.length})
          </h2>
          <div className="space-y-3">
            {publicCaps.map((cap) => {
              const cat = CATEGORY_MAP[cap.category];
              const CatIcon = (cat && ICON_MAP[cat.icon]) || Zap;
              const approval = APPROVAL_LABELS[cap.approvalMode];

              return (
                <div
                  key={cap.id}
                  className="rounded-xl border border-border-subtle bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/8">
                        <CatIcon className="h-4 w-4 text-accent" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-text-primary">{cap.name}</h3>
                        {cat && <p className="text-xs text-text-muted">{cat.name}</p>}
                      </div>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${approval.color}`}>
                      {approval.label}
                    </span>
                  </div>

                  {cap.description && (
                    <p className="mt-3 text-sm text-text-secondary">{cap.description}</p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />
                      {CONTACT_LABELS[cap.contactMethod]}
                    </span>
                    {cap.scope && (
                      <span className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        {cap.scope}
                      </span>
                    )}
                    {cap.availability && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {cap.availability}
                      </span>
                    )}
                  </div>

                  {cap.contactEndpoint && (
                    <div className="mt-3 rounded-md bg-bg-secondary px-3 py-1.5 font-mono text-xs text-text-muted break-all">
                      {cap.contactEndpoint}
                    </div>
                  )}

                  {cap.price && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="bg-emerald-50 text-emerald-600 text-[10px] font-medium px-1.5 py-0.5 rounded">
                        {cap.price}
                      </span>
                      <div className="rounded-md bg-bg-secondary px-3 py-1.5 font-mono text-xs text-text-muted">
                        <span className="text-accent">GET</span>{' '}
                        /api/hire/{profile.username}/{cap.id}
                        <span className="ml-2 rounded bg-amber-50 text-amber-600 text-[10px] font-medium px-1 py-0.5">
                          402
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reviews */}
      <ReviewSection
        agentUsername={profile.username}
        currentUserGithubId={currentUserGithubId}
        agentGithubId={profile.githubId}
      />

      {/* Footer */}
      <div className="mt-12 border-t border-border-subtle pt-6 text-center text-xs text-text-muted">
        Registered on {new Date(profile.createdAt).toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric',
        })}
      </div>
    </div>
  );
}
