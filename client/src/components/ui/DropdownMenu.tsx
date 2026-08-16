"use client";
import React, { useRef, RefObject } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useDismissable } from "@/hooks/useDismissable";
import { fadeRise } from "@/lib/motion";
import { cn } from "@/lib/cn";

interface DropdownMenuProps {
  open: boolean;
  onClose: () => void;
  /** Ref covering trigger + panel, used for outside-click detection so the trigger click doesn't self-close. */
  anchorRef: RefObject<HTMLElement | null>;
  align?: "left" | "right";
  className?: string;
  children: React.ReactNode;
}

export const DropdownMenu = ({ open, onClose, anchorRef, align = "right", className, children }: DropdownMenuProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(open, panelRef);
  useDismissable(open, anchorRef, onClose);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          role="menu"
          variants={fadeRise}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn(
            "absolute z-50 top-full mt-2 min-w-[220px] rounded-lg border border-border bg-surface shadow-elevation3 p-2",
            align === "right" ? "right-0" : "left-0",
            className
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const DropdownItem = ({
  children,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    role="menuitem"
    className={cn(
      "w-full flex items-center gap-2 text-left px-3 py-2 rounded-md text-sm font-medium text-ink hover:bg-surfaceRaised transition-colors cursor-pointer",
      className
    )}
    {...rest}
  >
    {children}
  </button>
);
