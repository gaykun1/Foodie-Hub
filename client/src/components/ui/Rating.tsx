import React from "react";
import { calculateStars } from "@/utils/rating";
import { cn } from "@/lib/cn";

interface RatingProps {
  value: number;
  size?: number;
  className?: string;
}

export const Rating = ({ value, size, className }: RatingProps) => (
  <span
    className={cn("inline-flex items-center gap-0.5", className)}
    role="img"
    aria-label={`${value.toFixed(1)} out of 5 stars`}
  >
    {calculateStars(value, size)}
  </span>
);
