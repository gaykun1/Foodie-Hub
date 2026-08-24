"use client"
import { ArrowRight, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { ordersApi } from '@/api'
import { errorMessage as apiErrorMessage } from '@/lib/apiClient'
import { motion } from 'motion/react'
import { Card } from '@/components/ui/Card'
import { PageSpinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ButtonLink } from '@/components/ui/Button'
import { clearPendingCheckout, readPendingCheckout } from '@/utils/pendingCheckout'

type FinalizeState = "finalizing" | "success" | "error";

const FinalizeOrder = () => {
  const { id } = useParams() as { id: string };
  const searchParams = useSearchParams();
  const [state, setState] = useState<FinalizeState>("finalizing");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const finalize = async () => {
      const paymentIntentId = searchParams.get("payment_intent");
      const pending = readPendingCheckout(id);

      // The server independently re-verifies with Stripe that this PaymentIntent
      // actually succeeded (and for the right amount) before it'll finalize the
      // order — this call is not itself the source of truth, just the trigger.
      if (!paymentIntentId || !pending) {
        setState("error");
        setErrorMessage("We couldn't confirm this payment. If you were charged, check Your Orders — otherwise please try again.");
        return;
      }

      try {
        await ordersApi.finalizeOrder({
          formData: pending.formData,
          shipping: pending.shipping,
          percent: pending.percent,
          cartId: pending.cartId ?? "",
          paymentIntentId,
        });
        clearPendingCheckout(id);
        setState("success");
      } catch (err) {
        console.error(err);
        clearPendingCheckout(id);
        setState("error");
        setErrorMessage(apiErrorMessage(err, "Payment didn't go through, so this order wasn't placed. Please try again."));
      }
    }
    finalize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (state === "finalizing") {
    return (
      <div className="flex items-center justify-center py-24 px-4">
        <PageSpinner />
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex items-center justify-center py-24 px-4">
        <Card className="max-w-[480px] w-full">
          <EmptyState
            icon={<XCircle size={22} />}
            title="We couldn't confirm your order"
            description={errorMessage}
            action={<ButtonLink href="/orders">Go to your orders</ButtonLink>}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-24 px-4">
      <Card className="flex flex-col gap-6 items-center py-14 px-8 max-w-[480px] w-full text-center">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="flex items-center justify-center size-16 rounded-full bg-success100 text-success700"
        >
          <CheckCircle2 size={36} />
        </motion.div>
        <div className="flex flex-col gap-1">
          <h1 className="section-title">Thank you for your order!</h1>
          <p className="text-inkMuted">We&apos;re getting it ready — you can track its progress from your orders page.</p>
        </div>
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 h-12 px-6 rounded-[var(--radius-sm)] bg-brand text-onBrand font-semibold text-lg group hover:bg-brandHover transition-colors"
        >
          <span>Go to your orders</span>
          <ArrowRight className="transition-transform group-hover:translate-x-1" size={20} />
        </Link>
      </Card>
    </div>
  )
}

// useSearchParams needs a Suspense boundary or Next.js de-opts/errors on build.
const Page = () => (
  <Suspense fallback={<div className="flex items-center justify-center py-24 px-4"><PageSpinner /></div>}>
    <FinalizeOrder />
  </Suspense>
);

export default Page
