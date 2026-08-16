"use client"
import { motion } from 'motion/react'
import { fadeRise } from '@/lib/motion'
import { Bike } from 'lucide-react'

const JobBanner = () => {
  return (
    <section className="relative mt-6 mb-8 rounded-xl overflow-hidden bg-gradient-to-br from-teal-600 via-teal-700 to-ember-700">
      <div aria-hidden="true" className="absolute -top-20 -right-20 size-64 rounded-full bg-ember-400/25 blur-3xl" />
      <motion.div
        variants={fadeRise}
        initial="hidden"
        animate="visible"
        className="relative flex flex-col gap-4 items-start max-w-[560px] px-6 py-14 sm:px-12 sm:py-16"
      >
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold uppercase tracking-wide backdrop-blur-sm">
          <Bike size={14} />
          We&apos;re hiring couriers
        </span>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl leading-tight text-white">
          Join our courier team!
        </h1>
        <p className="text-lg leading-7 text-white/90 max-w-md">
          Flexible schedule, decent pay, friendly team. Bring happiness to our clients!
        </p>
      </motion.div>
    </section>
  )
}

export default JobBanner
