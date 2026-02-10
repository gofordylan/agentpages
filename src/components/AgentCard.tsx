import Link from 'next/link';
import { AgentProfile, AgentRatingSummary } from '@/types';
import { CapabilityBadge } from './CapabilityBadge';
import { StarRating } from './StarRating';
import { Bot, ExternalLink } from 'lucide-react';

interface AgentCardProps {
  profile: AgentProfile;
  rating?: AgentRatingSummary;
}

export function AgentCard({ profile, rating }: AgentCardProps) {
  const publicCaps = profile.capabilities.filter((c) => c.isPublic);
  const uniqueCategories = [...new Set(publicCaps.map((c) => c.category))];
  const hasPaidCapability = publicCaps.some((c) => c.price);

  return (
    <Link
      href={`/${profile.username}`}
      className="group block rounded-xl border border-border-subtle bg-white p-5 transition-all hover:shadow-lg hover:-translate-y-0.5"
    >
      <div className="flex items-start gap-3">
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt=""
            className="h-10 w-10 rounded-full border border-border-subtle"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
            <Bot className="h-5 w-5 text-accent" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-heading text-sm font-semibold text-text-primary group-hover:text-accent transition-colors">
              {profile.displayName || profile.username}
            </h3>
            <ExternalLink className="h-3 w-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-xs text-text-muted">@{profile.username}</p>
        </div>
      </div>

      {profile.bio && (
        <p className="mt-3 text-sm text-text-secondary line-clamp-2">{profile.bio}</p>
      )}

      {(rating?.totalReviews ?? 0) > 0 && rating && (
        <div className="mt-2">
          <StarRating rating={rating.averageRating} totalReviews={rating.totalReviews} size="small" />
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {hasPaidCapability && (
          <span className="bg-emerald-50 text-emerald-600 text-[10px] font-medium px-1.5 py-0.5 rounded">
            Paid
          </span>
        )}
      </div>

      {uniqueCategories.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {uniqueCategories.slice(0, 4).map((cat) => (
            <CapabilityBadge key={cat} category={cat} />
          ))}
          {uniqueCategories.length > 4 && (
            <span className="inline-flex items-center rounded-full bg-bg-secondary px-2.5 py-1 text-xs text-text-muted">
              +{uniqueCategories.length - 4}
            </span>
          )}
        </div>
      )}

      <div className="mt-3 text-xs text-text-muted">
        {publicCaps.length} {publicCaps.length === 1 ? 'capability' : 'capabilities'}
      </div>
    </Link>
  );
}
