"use client";
import { useState } from "react";
import { Sparkles, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { DEMO_ACCOUNTS } from "@/lib/demo";

/**
 * One-click sign-in for the public demo.
 *
 * A recruiter opening the live link has no way to invent working credentials,
 * and typing them from the README is friction that loses people. Rendered only
 * when the deployment opts in via NEXT_PUBLIC_DEMO_MODE, so a real deployment
 * never advertises shared logins.
 */
export const DemoCredentials = ({ onUse }: { onUse: (username: string, password: string) => void }) => {
  const [expanded, setExpanded] = useState(false);

  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") return null;

  return (
    <div className="rounded-[var(--radius-sm)] border border-dashed border-brand/40 bg-ember-50/60 p-3">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-2 text-left cursor-pointer"
      >
        <Sparkles size={16} className="text-brand shrink-0" />
        <span className="text-sm font-semibold text-ink flex-1">Try a demo account</span>
        <ChevronDown size={16} className={cn("text-inkMuted transition-transform", expanded && "rotate-180")} />
      </button>

      {expanded && (
        <ul className="mt-3 flex flex-col gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <li key={account.username}>
              <button
                type="button"
                onClick={() => onUse(account.username, account.password)}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-left transition-colors hover:border-brand cursor-pointer"
              >
                <span className="block text-sm font-semibold text-ink">{account.label}</span>
                <span className="block text-xs text-inkMuted">
                  {account.username} &middot; {account.password}
                </span>
                <span className="block text-xs text-inkMuted mt-0.5">{account.description}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
