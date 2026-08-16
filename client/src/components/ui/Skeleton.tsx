import React from "react";
import { cn } from "@/lib/cn";

export const Skeleton = ({ className }: { className?: string }) => (
  <div
    aria-hidden="true"
    className={cn("animate-pulse rounded-md bg-skeleton", className)}
  />
);

export const DishCardSkeleton = () => (
  <div className="rounded-lg border border-border bg-surface overflow-hidden">
    <Skeleton className="aspect-video w-full rounded-none" />
    <div className="p-4 flex flex-col gap-2">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-9 w-full mt-2" />
    </div>
  </div>
);

export const RestaurantCardSkeleton = () => (
  <div className="rounded-lg border border-border bg-surface overflow-hidden">
    <Skeleton className="aspect-video w-full rounded-none" />
    <div className="p-4 flex flex-col gap-3">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <div className="flex justify-between">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  </div>
);

export const CardGridSkeleton = ({
  count = 6,
  item: Item = RestaurantCardSkeleton,
}: {
  count?: number;
  item?: React.ComponentType;
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
    {Array.from({ length: count }).map((_, i) => (
      <Item key={i} />
    ))}
  </div>
);
