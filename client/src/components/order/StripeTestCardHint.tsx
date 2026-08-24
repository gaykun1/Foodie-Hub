"use client";
import { CreditCard, Copy, Check } from "lucide-react";
import { useState } from "react";
import { STRIPE_TEST_CARD, isDemoMode } from "@/lib/demo";

/**
 * Surfaces the Stripe test card on the checkout screen when the deployment is
 * running in demo mode.
 *
 * The payment step is where a demo silently dies: the visitor has a real Stripe
 * Elements form in front of them and no card that will work. Putting the number
 * one click away — rather than in a README they are not reading — is the
 * difference between seeing the tracking screen and giving up here.
 */
export const StripeTestCardHint = () => {
  const [copied, setCopied] = useState(false);

  if (!isDemoMode()) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(STRIPE_TEST_CARD.number.replace(/\s/g, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be denied; the number is visible either way.
    }
  };

  return (
    <div className="rounded-[var(--radius-md)] border border-dashed border-teal-300 bg-teal-50 p-4">
      <div className="flex items-start gap-3">
        <CreditCard size={18} className="mt-0.5 shrink-0 text-teal-800" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-teal-800">This is a demo — use Stripe&apos;s test card</p>
          <p className="mt-1 text-xs leading-5 text-teal-800/80">
            No real payment is taken. Expiry: {STRIPE_TEST_CARD.expiry}. CVC: {STRIPE_TEST_CARD.cvc}.
            Postcode: {STRIPE_TEST_CARD.postcode}.
          </p>
          <button
            type="button"
            onClick={copy}
            className="mt-2 inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-teal-300 bg-surface px-3 py-1.5 font-mono text-sm font-bold text-ink transition-colors hover:bg-teal-100 cursor-pointer"
          >
            {STRIPE_TEST_CARD.number}
            {copied ? <Check size={14} className="text-teal-700" /> : <Copy size={14} className="text-inkMuted" />}
            <span className="sr-only">{copied ? "Copied" : "Copy test card number"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
