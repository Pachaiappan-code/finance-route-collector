import { Star } from "lucide-react";

export function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={13}
          className={n <= rating ? "fill-warning text-warning" : "text-border"}
        />
      ))}
    </span>
  );
}
