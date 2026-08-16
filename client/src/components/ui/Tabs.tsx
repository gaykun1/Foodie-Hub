"use client";
import React, { useRef } from "react";
import Link, { LinkProps } from "next/link";
import { cn } from "@/lib/cn";

export const tabClasses = (active: boolean) =>
  cn(
    "px-4 h-10 inline-flex items-center justify-center rounded-md text-sm font-semibold transition-colors whitespace-nowrap",
    active ? "bg-surface text-brand shadow-elevation1" : "text-inkMuted hover:text-ink"
  );

const handleRovingKeyDown = (container: HTMLElement | null) => (e: React.KeyboardEvent) => {
  if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) return;
  const tabs = Array.from(container?.querySelectorAll<HTMLElement>('[role="tab"]') ?? []);
  const currentIndex = tabs.indexOf(document.activeElement as HTMLElement);
  if (currentIndex === -1) return;
  e.preventDefault();
  let nextIndex = currentIndex;
  if (e.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
  if (e.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
  if (e.key === "Home") nextIndex = 0;
  if (e.key === "End") nextIndex = tabs.length - 1;
  tabs[nextIndex]?.focus();
};

interface TabListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const TabList = ({ children, className, ...rest }: TabListProps) => {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      role="tablist"
      onKeyDown={handleRovingKeyDown(ref.current)}
      className={cn("inline-flex gap-1 p-1 rounded-lg bg-sand-100 w-fit overflow-x-auto max-w-full", className)}
      {...rest}
    >
      {children}
    </div>
  );
};

interface TabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active: boolean;
}

export const Tab = React.forwardRef<HTMLButtonElement, TabProps>(({ active, className, children, ...rest }, ref) => (
  <button ref={ref} role="tab" aria-selected={active} tabIndex={active ? 0 : -1} className={cn(tabClasses(active), className)} {...rest}>
    {children}
  </button>
));
Tab.displayName = "Tab";

// Route-driven variant — for tab bars that navigate between pages (e.g. a
// restaurant's About / Menu / Reviews) rather than switching in-page panels.
interface TabLinkProps extends LinkProps {
  active: boolean;
  className?: string;
  children: React.ReactNode;
}

export const TabLink = ({ active, className, children, ...rest }: TabLinkProps) => (
  <Link role="tab" aria-selected={active} aria-current={active ? "page" : undefined} className={cn(tabClasses(active), className)} {...rest}>
    {children}
  </Link>
);
