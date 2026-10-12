import { stagger, type Transition, type Variants } from 'motion/react';

/** Misma curva que --ease-out-soft en CSS, para que todo el sistema se mueva igual. */
export const EASE_OUT_SOFT = [0.22, 1, 0.36, 1] as const;

export const SPRING_SNAPPY: Transition = { type: 'spring', stiffness: 420, damping: 34 };

export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { delayChildren: stagger(0.06, { startDelay: 0.02 }) } },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT_SOFT } },
};
