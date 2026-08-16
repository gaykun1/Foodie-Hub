import React from "react";
import { cn } from "@/lib/cn";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState = ({ icon, title, description, action, className }: EmptyStateProps) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center text-center gap-3 py-16 px-6 rounded-lg border border-dashed border-border",
      className
    )}
  >
    <div className="flex items-center justify-center size-12 rounded-full bg-sand-100 text-inkSubtle">
      {icon ?? <Inbox size={22} />}
    </div>
    <div className="flex flex-col gap-1">
      <h3 className="font-semibold text-ink">{title}</h3>
      {description && <p className="text-sm text-inkMuted max-w-sm">{description}</p>}
    </div>
    {action}
  </div>
);
