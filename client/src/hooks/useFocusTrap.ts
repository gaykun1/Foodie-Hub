"use client";
import { useEffect, RefObject } from "react";
import { getFocusable } from "./useDismissable";

// Traps Tab/Shift+Tab focus within the container while active, moves focus
// into it on activation, and restores focus to the previously focused
// element on deactivation. Used by Modal/Drawer/DropdownMenu.
export function useFocusTrap(active: boolean, containerRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!active || !containerRef.current) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const container = containerRef.current;
    const focusable = getFocusable(container);
    (focusable[0] ?? container).focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = getFocusable(container);
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [active, containerRef]);
}
