import type { Variants, Transition } from "motion/react";

export const springTransition: Transition = { type: "spring", stiffness: 380, damping: 32 };
export const easeTransition: Transition = { duration: 0.2, ease: [0.16, 1, 0.3, 1] };

export const fadeRise: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: easeTransition },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: easeTransition },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: springTransition },
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.12 } },
};

export const drawerFromRight: Variants = {
  hidden: { x: "100%" },
  visible: { x: 0, transition: springTransition },
  exit: { x: "100%", transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: easeTransition },
};
