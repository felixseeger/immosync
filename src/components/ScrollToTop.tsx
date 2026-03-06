import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ScrollToTopProps {
  threshold?: number;
  className?: string;
}

export default function ScrollToTop({
  threshold = 400,
  className = '',
}: ScrollToTopProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > threshold);
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    toggleVisibility();

    return () => window.removeEventListener('scroll', toggleVisibility);
  }, [threshold]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          type="button"
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          onClick={scrollToTop}
          className={`fixed bottom-6 right-6 lg:bottom-10 lg:right-10 z-50 w-12 h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center bg-white/90 dark:bg-app-dark/90 backdrop-blur-md border border-gray-200 dark:border-zinc-800 shadow-lg hover:bg-accent hover:border-accent/50 transition-colors duration-300 group ${className}`}
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5 lg:w-6 lg:h-6 text-gray-900 dark:text-white group-hover:text-gray-900 transition-transform group-hover:-translate-y-1" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
