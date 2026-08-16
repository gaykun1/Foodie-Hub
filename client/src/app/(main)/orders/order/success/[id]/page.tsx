"use client"
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { Card } from '@/components/ui/Card'

const Page = () => {
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

export default Page
