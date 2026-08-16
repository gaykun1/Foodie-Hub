import React from "react";
import { cn } from "@/lib/cn";

export const Spinner = ({ size = 24, className }: { size?: number; className?: string }) => (
  <span
    role="status"
    aria-label="Loading"
    className={cn("inline-block animate-spin rounded-full border-[3px] border-border border-t-brand", className)}
    style={{ width: size, height: size }}
  />
);

export const PageSpinner = () => (
  <div className="flex items-center justify-center py-24">
    <Spinner size={32} />
  </div>
);
