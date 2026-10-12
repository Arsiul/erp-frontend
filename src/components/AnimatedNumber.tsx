import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import { useEffect } from 'react';

export interface AnimatedNumberProps {
  value: number;
  format: (value: number) => string;
  className?: string;
}

/**
 * Número que cuenta hasta su valor sin re-renderizar React en cada cuadro.
 * Los lectores de pantalla reciben solo el valor final.
 */
export function AnimatedNumber({ value, format, className }: AnimatedNumberProps) {
  const reduceMotion = useReducedMotion();
  const motionValue = useMotionValue(reduceMotion ? value : 0);
  const text = useTransform(motionValue, format);

  useEffect(() => {
    if (reduceMotion) {
      motionValue.set(value);
      return;
    }
    const controls = animate(motionValue, value, { duration: 1.1, ease: [0.22, 1, 0.36, 1] });
    return () => {
      controls.stop();
    };
  }, [motionValue, value, reduceMotion]);

  return (
    <span className={className}>
      <span className="sr-only">{format(value)}</span>
      <motion.span aria-hidden>{text}</motion.span>
    </span>
  );
}
