"use client"
import Link from 'next/link'
import { motion } from 'motion/react'
import { fadeRise } from '@/lib/motion'
import { UtensilsCrossed } from 'lucide-react'

const Banner = () => {
  return (
    <section className="relative mt-6 mb-12 rounded-xl overflow-hidden bg-gradient-to-br from-ember-600 via-ember-500 to-ember-700">
      <div
        aria-hidden="true"
        className="absolute -top-24 -right-24 size-72 rounded-full bg-teal-400/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-32 -left-16 size-80 rounded-full bg-ember-300/30 blur-3xl"
      />
      <motion.div
        variants={fadeRise}
        initial="hidden"
        animate="visible"
        className="relative flex flex-col gap-5 items-start max-w-[560px] px-6 py-16 sm:px-12 sm:py-20"
      >
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold uppercase tracking-wide backdrop-blur-sm">
          <UtensilsCrossed size={14} />
          Local flavor, delivered fast
        </span>
        <h1 className="font-display font-extrabold text-4xl sm:text-5xl leading-[1.1] text-white">
          Taste the City, Delivered to Your Door!
        </h1>
        <p className="text-lg leading-7 text-white/90 max-w-md">
          Discover local gems, exclusive deals, and your next favorite meal, all at your fingertips.
        </p>
        <Link
          href="/restaurants/category/all-restaurants"
          className="inline-flex items-center justify-center h-[52px] px-6 rounded-[var(--radius-sm)] bg-white text-ember-700 font-semibold text-base transition-colors hover:bg-ember-50"
        >
          Explore Restaurants
        </Link>
      </motion.div>
    </section>
  )
}

export default Banner
