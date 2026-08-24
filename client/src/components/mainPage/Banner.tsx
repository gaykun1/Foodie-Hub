"use client"
import Link from 'next/link'
import { motion } from 'motion/react'
import { fadeRise } from '@/lib/motion'
import { ArrowRight, MapPin, Sparkles } from 'lucide-react'
import Image from 'next/image'
import { useAppSelector } from '@/hooks/reduxHooks'

const Banner = () => {
  const user = useAppSelector((state) => state.auth.user)
  const location = user?.address?.city
    ? [user.address.street, user.address.city].filter(Boolean).join(', ')
    : 'Choose your delivery location'

  return (
    <section className="relative mt-6 mb-8 min-h-[360px] rounded-xl overflow-hidden bg-sand-900">
      <Image src="/images/foodiehub-hero-v2.png" alt="Artisan pizza and Mediterranean dishes" fill priority sizes="1400px" className="object-cover" />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-sand-950/95 via-sand-950/65 to-transparent" />
      <motion.div
        variants={fadeRise}
        initial="hidden"
        animate="visible"
        className="relative flex min-h-[360px] flex-col justify-center gap-5 items-start max-w-[620px] px-6 py-12 sm:px-10"
      >
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold uppercase tracking-wide backdrop-blur-sm">
          <Sparkles size={14} />
          Discovery to live tracking
        </span>
        <h1 className="font-display font-extrabold text-4xl sm:text-5xl leading-[1.1] text-white">
          Your city&apos;s best food, at your door.
        </h1>
        <p className="text-lg leading-7 text-white/90 max-w-md">
          Find a local favorite, check out with confidence, and follow every step from the kitchen to your door.
        </p>
        <div className="flex w-full max-w-[480px] items-center rounded-[var(--radius-md)] bg-white p-2 shadow-elevation4">
          <div className="flex min-w-0 flex-1 items-center gap-3 px-3 text-sm text-sand-600"><MapPin size={18} className="shrink-0 text-ember-700" /><span className="truncate">{location}</span></div>
          <Link href="/restaurants/category/all-restaurants" className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-ember-700 px-5 text-sm font-bold text-white transition-colors hover:bg-ember-800">Find food <ArrowRight size={16} /></Link>
        </div>
      </motion.div>
    </section>
  )
}

export default Banner
