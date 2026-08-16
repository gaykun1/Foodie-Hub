"use client";
import React from "react";
import { cn } from "@/lib/cn";

interface FieldChromeProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  wrapperClassName?: string;
}

const FieldLabel = ({ id, label, required }: { id: string; label: string; required?: boolean }) => (
  <label htmlFor={id} className="text-sm font-medium text-ink">
    {label}
    {required && (
      <span className="text-danger" aria-hidden="true">
        {" "}
        *
      </span>
    )}
  </label>
);

const FieldMessage = ({ id, error, hint }: { id: string; error?: string; hint?: string }) => {
  if (error) {
    return (
      <p id={`${id}-error`} role="alert" className="text-xs font-medium text-danger">
        {error}
      </p>
    );
  }
  if (hint) {
    return (
      <p id={`${id}-hint`} className="text-xs text-inkMuted">
        {hint}
      </p>
    );
  }
  return null;
};

const describedBy = (id: string, error?: string, hint?: string) =>
  error ? `${id}-error` : hint ? `${id}-hint` : undefined;

const inputClasses =
  "w-full h-11 px-3 rounded-[var(--radius-sm)] border bg-surface text-ink placeholder:text-inkSubtle transition-colors outline-none disabled:opacity-50 disabled:cursor-not-allowed";

const borderClasses = (hasError?: boolean) =>
  hasError
    ? "border-danger focus-visible:border-danger"
    : "border-border focus-visible:border-brand";

type InputProps = FieldChromeProps &
  React.InputHTMLAttributes<HTMLInputElement> & { leftSlot?: React.ReactNode; rightSlot?: React.ReactNode };

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ id, label, error, hint, required, wrapperClassName, className, leftSlot, rightSlot, ...rest }, ref) => (
    <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
      <FieldLabel id={id} label={label} required={required} />
      <div className="relative">
        {leftSlot && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-inkSubtle pointer-events-none">
            {leftSlot}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy(id, error, hint)}
          className={cn(inputClasses, borderClasses(!!error), leftSlot ? "pl-10" : "", rightSlot ? "pr-10" : "", className)}
          {...rest}
        />
        {rightSlot && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-inkSubtle">
            {rightSlot}
          </span>
        )}
      </div>
      <FieldMessage id={id} error={error} hint={hint} />
    </div>
  )
);
Input.displayName = "Input";

type TextareaProps = FieldChromeProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ id, label, error, hint, required, wrapperClassName, className, ...rest }, ref) => (
    <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
      <FieldLabel id={id} label={label} required={required} />
      <textarea
        ref={ref}
        id={id}
        aria-invalid={!!error || undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(inputClasses, "h-auto min-h-[96px] py-2 resize-y", borderClasses(!!error), className)}
        {...rest}
      />
      <FieldMessage id={id} error={error} hint={hint} />
    </div>
  )
);
Textarea.displayName = "Textarea";

type SelectProps = FieldChromeProps & React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ id, label, error, hint, required, wrapperClassName, className, children, ...rest }, ref) => (
    <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
      <FieldLabel id={id} label={label} required={required} />
      <select
        ref={ref}
        id={id}
        aria-invalid={!!error || undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(inputClasses, "appearance-none bg-no-repeat pr-8", borderClasses(!!error), className)}
        {...rest}
      >
        {children}
      </select>
      <FieldMessage id={id} error={error} hint={hint} />
    </div>
  )
);
Select.displayName = "Select";
