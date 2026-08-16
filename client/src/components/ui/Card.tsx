import React from "react";
import { cn } from "@/lib/cn";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  padding?: "none" | "sm" | "md";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ interactive, padding = "md", className, children, onClick, onKeyDown, ...rest }, ref) => {
    const clickable = interactive && !!onClick;
    return (
      <div
        ref={ref}
        role={clickable ? "button" : undefined}
        tabIndex={clickable ? 0 : undefined}
        onClick={onClick}
        onKeyDown={
          clickable
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  (onClick as React.MouseEventHandler<HTMLDivElement>)(e as unknown as React.MouseEvent<HTMLDivElement>);
                }
                onKeyDown?.(e);
              }
            : onKeyDown
        }
        className={cn(
          "rounded-lg border border-border bg-surface shadow-elevation1 overflow-hidden",
          padding === "md" && "p-4",
          padding === "sm" && "p-3",
          interactive &&
            "transition-all duration-200 ease-out hover:shadow-elevation3 hover:-translate-y-0.5 cursor-pointer",
          className
        )}
        {...rest}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";
