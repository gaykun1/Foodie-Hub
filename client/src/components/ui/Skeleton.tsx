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

export const OrderCardSkeleton = () => (
  <div className="rounded-lg border border-border bg-surface p-4 flex flex-col gap-4">
    <div className="flex items-center gap-3">
      <Skeleton className="size-14 rounded-md shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
    <Skeleton className="h-4 w-2/3" />
    <div className="flex gap-2">
      <Skeleton className="h-9 w-28" />
      <Skeleton className="h-9 w-28" />
    </div>
  </div>
);

export const OrderListSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="grid gap-4 lg:grid-cols-2">
    {Array.from({ length: count }).map((_, i) => (
      <OrderCardSkeleton key={i} />
    ))}
  </div>
);

export const ListRowSkeleton = () => (
  <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4">
    <Skeleton className="size-10 rounded-full shrink-0" />
    <div className="flex-1 flex flex-col gap-2">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-2/3" />
    </div>
    <Skeleton className="h-8 w-24" />
  </div>
);

export const ListSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="flex flex-col gap-3">
    {Array.from({ length: count }).map((_, i) => (
      <ListRowSkeleton key={i} />
    ))}
  </div>
);

export const FormSkeleton = ({ fields = 4 }: { fields?: number }) => (
  <div className="flex flex-col gap-4">
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} className="flex flex-col gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-11 w-full" />
      </div>
    ))}
    <Skeleton className="h-11 w-40 mt-2" />
  </div>
);
