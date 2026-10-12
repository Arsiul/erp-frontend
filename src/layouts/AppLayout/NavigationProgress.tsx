import { AnimatePresence, motion } from 'motion/react';
import { useNavigation } from 'react-router';

/** Barra superior que aparece mientras se carga una pantalla diferida. */
export function NavigationProgress() {
  const isLoading = useNavigation().state === 'loading';

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          role="progressbar"
          aria-label="Cargando pantalla"
          className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-primary-500"
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 0.85, transition: { duration: 2.5, ease: 'easeOut' } }}
          exit={{ scaleX: 1, opacity: 0, transition: { duration: 0.3 } }}
        />
      )}
    </AnimatePresence>
  );
}
