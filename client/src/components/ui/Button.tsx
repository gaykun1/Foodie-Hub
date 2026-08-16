"use client";
import React from "react";
import Link, { LinkProps } from "next/link";
import { cn } from "@/lib/cn";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "success";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-[var(--radius-sm)] transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-[52px] px-6 text-base",
};

const variants: Record<ButtonVariant, string> = {
  primary: "bg-brand text-onBrand hover:bg-brandHover",
  secondary: "bg-surfaceRaised text-ink border border-border hover:bg-sand-100",
  ghost: "bg-transparent text-ink hover:bg-surfaceRaised",
  outline: "bg-transparent text-brand border border-border hover:bg-surfaceRaised",
  danger: "bg-danger text-white hover:bg-dangerHover",
  success: "bg-success100 text-success800 hover:bg-teal-100",
};

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

type ButtonProps = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    children?: React.ReactNode;
  };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", loading, fullWidth, icon, className, children, disabled, ...rest },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(base, sizes[size], variants[variant], fullWidth && "w-full", className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...rest}
      >
        {loading ? <Loader2 className="animate-spin" size={16} /> : icon}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

type ButtonLinkProps = CommonProps &
  LinkProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    children?: React.ReactNode;
  };

export const ButtonLink = React.forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  ({ variant = "primary", size = "md", fullWidth, icon, className, children, ...rest }, ref) => {
    return (
      <Link
        ref={ref}
        className={cn(base, sizes[size], variants[variant], fullWidth && "w-full", className)}
        {...rest}
      >
        {icon}
        {children}
      </Link>
    );
  }
);
ButtonLink.displayName = "ButtonLink";
