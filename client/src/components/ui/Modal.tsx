"use client";
import React, { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useDismissable } from "@/hooks/useDismissable";
import { fadeIn, scaleIn } from "@/lib/motion";
import { cn } from "@/lib/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

const useLockBodyScroll = (locked: boolean) => {
  useEffect(() => {
    if (!locked) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [locked]);
};

export const Modal = ({ open, onClose, title, children, className }: ModalProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useFocusTrap(open, dialogRef);
  useDismissable(open, dialogRef, onClose);
  useLockBodyScroll(open);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-overlay backdrop-blur-sm"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            aria-hidden="true"
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              "relative bg-surface rounded-lg shadow-elevation4 max-w-lg w-full max-h-[85vh] overflow-y-auto",
              className
            )}
          >
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-surface">
              <h2 id="modal-title" className="font-display font-bold text-lg text-ink">
                {title}
              </h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="p-1.5 rounded-full text-inkMuted hover:bg-surfaceRaised hover:text-ink transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
