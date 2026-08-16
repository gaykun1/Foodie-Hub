"use client"
import Link from 'next/link'
import { motion } from 'motion/react'
import { fadeRise } from '@/lib/motion'
import { Copy, Sparkles } from 'lucide-react'
import { useState } from 'react'

const Discount = () => {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText("FEAST20");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — the code is still visible to copy manually
    }
  };

  return (
    <motion.section
      variants={fadeRise}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      className="relative mb-16 rounded-xl overflow-hidden bg-gradient-to-br from-teal-700 to-teal-900 px-6 py-10 sm:px-12 sm:py-14 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left"
    >
      <div className="flex flex-col gap-2 items-center sm:items-start">
        <span className="inline-flex items-center gap-2 text-teal-100 text-xs font-semibold uppercase tracking-wide">
          <Sparkles size={14} />
          Limited-time offer
        </span>
        <h2 className="font-display font-bold text-2xl sm:text-3xl leading-tight text-white">
          Weekend Feast: 20% Off All Orders!
        </h2>
        <p className="text-teal-50/90 max-w-md">
          Don&apos;t miss out on our limited-time offer. Use the code below at checkout for delicious savings.
        </p>
      </div>
      <div className="flex flex-col items-center gap-3 shrink-0">
        <button
          onClick={copyCode}
          className="flex items-center gap-2 px-4 h-11 rounded-[var(--radius-sm)] border border-dashed border-white/40 text-white font-mono font-semibold tracking-wider cursor-pointer hover:bg-white/10 transition-colors"
        >
          FEAST20
          <Copy size={16} />
        </button>
        <span className="text-xs text-teal-100 h-4">{copied ? "Copied!" : "Tap to copy"}</span>
        <Link
          href="/promocode"
          className="text-sm font-semibold text-white underline underline-offset-4 hover:text-teal-100 transition-colors"
        >
          Claim Your Deal
        </Link>
      </div>
    </motion.section>
  )
}

export default Discount
