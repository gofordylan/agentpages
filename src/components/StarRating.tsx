'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  totalReviews?: number;
  size?: 'small' | 'normal';
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export function StarRating({
  rating,
  totalReviews,
  size = 'normal',
  interactive = false,
  onChange,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = interactive && hoverRating > 0 ? hoverRating : rating;
  const starSize = size === 'small' ? 'h-3.5 w-3.5' : 'h-4.5 w-4.5';

  return (
    <div className="flex items-center gap-1.5">
      <div
        className="flex items-center gap-0.5"
        onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = displayRating >= star;
          const halfFilled = !filled && displayRating >= star - 0.5;

          return (
            <button
              key={star}
              type="button"
              disabled={!interactive}
              className={`relative ${interactive ? 'cursor-pointer' : 'cursor-default'} disabled:cursor-default`}
              onMouseEnter={interactive ? () => setHoverRating(star) : undefined}
              onClick={interactive ? () => onChange?.(star) : undefined}
            >
              {/* Empty star (background) */}
              <Star className={`${starSize} text-gray-300`} />
              {/* Filled overlay */}
              {(filled || halfFilled) && (
                <Star
                  className={`${starSize} absolute inset-0 fill-current text-amber-400`}
                  style={halfFilled ? { clipPath: 'inset(0 50% 0 0)' } : undefined}
                />
              )}
            </button>
          );
        })}
      </div>
      {rating > 0 && !interactive && (
        <span className={`font-medium text-text-primary ${size === 'small' ? 'text-xs' : 'text-sm'}`}>
          {rating.toFixed(1)}
        </span>
      )}
      {totalReviews !== undefined && !interactive && (
        <span className={`text-text-muted ${size === 'small' ? 'text-[10px]' : 'text-xs'}`}>
          ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </div>
  );
}
