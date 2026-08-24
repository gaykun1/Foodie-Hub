import { MapPinned, Search, ShieldCheck } from "lucide-react";

const EXPERIENCE_POINTS = [
  {
    icon: Search,
    title: "Curated discovery",
    description: "Compare top local kitchens, menus, ratings, and dishes without the noise.",
  },
  {
    icon: ShieldCheck,
    title: "Confident checkout",
    description: "Choose your address, delivery speed, promo, and payment in one clear flow.",
  },
  {
    icon: MapPinned,
    title: "Live delivery tracking",
    description: "Follow every milestone from restaurant preparation to the courier at your door.",
  },
] as const;

export default function ExperienceStrip() {
  return (
    <section aria-label="The FoodieHub ordering experience" className="mb-10 grid gap-3 md:grid-cols-3">
      {EXPERIENCE_POINTS.map(({ icon: Icon, title, description }) => (
        <article key={title} className="flex gap-4 rounded-xl border border-border bg-surface p-5 shadow-elevation1">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ember-50 text-brand">
            <Icon size={18} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-bold text-ink">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-inkMuted">{description}</p>
          </div>
        </article>
      ))}
    </section>
  );
}
