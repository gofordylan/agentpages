'use client';

import { useState, useEffect, useCallback } from 'react';
import { Review, AgentRatingSummary } from '@/types';
import { StarRating } from './StarRating';
import { Loader2, Send } from 'lucide-react';

interface ReviewSectionProps {
  agentUsername: string;
  currentUserGithubId?: string;
  agentGithubId: string;
}

interface ReviewsResponse {
  reviews: Review[];
  total: number;
  rating: AgentRatingSummary;
}

export function ReviewSection({
  agentUsername,
  currentUserGithubId,
  agentGithubId,
}: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [ratingSummary, setRatingSummary] = useState<AgentRatingSummary>({
    averageRating: 0,
    totalReviews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);

  // Form state
  const [formRating, setFormRating] = useState(0);
  const [formComment, setFormComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [hasExistingReview, setHasExistingReview] = useState(false);

  const limit = 10;
  const canReview = currentUserGithubId && currentUserGithubId !== agentGithubId;

  const fetchReviews = useCallback(async (loadMore = false) => {
    const currentOffset = loadMore ? offset : 0;
    if (loadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(currentOffset),
      });
      const res = await fetch(`/api/agents/${agentUsername}/reviews?${params}`);
      if (!res.ok) throw new Error('Failed to fetch reviews');

      const data: ReviewsResponse = await res.json();

      if (loadMore) {
        setReviews((prev) => [...prev, ...data.reviews]);
      } else {
        setReviews(data.reviews);
      }
      setTotal(data.total);
      setRatingSummary(data.rating);
      setOffset(currentOffset + data.reviews.length);

      // Check if current user has already reviewed
      if (currentUserGithubId) {
        const allReviews = loadMore
          ? [...reviews, ...data.reviews]
          : data.reviews;
        const existing = allReviews.find(
          (r) => r.reviewerGithubId === currentUserGithubId
        );
        if (existing) {
          setHasExistingReview(true);
          setFormRating(existing.rating);
          setFormComment(existing.comment);
        }
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [agentUsername, currentUserGithubId, offset, reviews]);

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentUsername]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRating) return;

    setSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch(`/api/agents/${agentUsername}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: formRating, comment: formComment }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit review');
      }

      setHasExistingReview(true);
      // Refresh reviews
      setOffset(0);
      await fetchReviews();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const hasMore = reviews.length < total;

  return (
    <div className="mt-10">
      <h2 className="font-heading text-lg font-semibold text-text-primary mb-4">
        Reviews
      </h2>

      {/* Rating Summary */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 text-accent animate-spin" />
        </div>
      ) : (
        <>
          {ratingSummary.totalReviews > 0 && (
            <div className="mb-6">
              <StarRating
                rating={ratingSummary.averageRating}
                totalReviews={ratingSummary.totalReviews}
              />
            </div>
          )}

          {/* Review Form */}
          {canReview && (
            <form
              onSubmit={handleSubmit}
              className="mb-8 rounded-xl border border-border-subtle bg-white p-5"
            >
              <p className="text-sm font-medium text-text-primary mb-3">
                {hasExistingReview ? 'Update your review' : 'Write a review'}
              </p>

              {submitError && (
                <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">
                  {submitError}
                </div>
              )}

              <div className="mb-3">
                <StarRating
                  rating={formRating}
                  interactive
                  onChange={setFormRating}
                />
              </div>

              <textarea
                value={formComment}
                onChange={(e) => setFormComment(e.target.value.slice(0, 1000))}
                placeholder="Share your experience with this agent..."
                rows={3}
                className="w-full rounded-lg border border-border-subtle px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none"
              />
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[10px] text-text-muted">
                  {formComment.length}/1000
                </span>
                <button
                  type="submit"
                  disabled={submitting || !formRating}
                  className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-accent-hover hover:-translate-y-px disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {submitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  {hasExistingReview ? 'Update' : 'Submit'}
                </button>
              </div>
            </form>
          )}

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-strong py-8 text-center">
              <p className="text-sm text-text-muted">No reviews yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-xl border border-border-subtle bg-white p-4"
                >
                  <div className="flex items-start gap-3">
                    {review.reviewerAvatarUrl ? (
                      <img
                        src={review.reviewerAvatarUrl}
                        alt=""
                        className="h-8 w-8 rounded-full border border-border-subtle"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-xs font-medium text-accent">
                        {review.reviewerDisplayName?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {review.reviewerDisplayName}
                        </p>
                        <time className="text-[10px] text-text-muted flex-shrink-0">
                          {new Date(review.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </time>
                      </div>
                      <div className="mt-0.5">
                        <StarRating rating={review.rating} size="small" />
                      </div>
                      {review.comment && (
                        <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Load More */}
              {hasMore && (
                <div className="text-center pt-2">
                  <button
                    onClick={() => fetchReviews(true)}
                    disabled={loadingMore}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle bg-white px-4 py-2 text-sm font-medium text-text-secondary transition-all hover:bg-bg-secondary"
                  >
                    {loadingMore && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Load more reviews
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
