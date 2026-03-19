import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  FileDown,
  RefreshCw,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  FileText,
  Palette,
  Printer,
} from 'lucide-react';
import type { ExposeStep } from '../hooks/useExposeGeneration';
import { useLanguage } from '../contexts/LanguageContext';

/* ------------------------------------------------------------------ */
/*  Props                                                             */
/* ------------------------------------------------------------------ */
interface ExposeGenerationModalProps {
  open: boolean;
  step: ExposeStep;
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
}

/* ------------------------------------------------------------------ */
/*  Step indicator                                                    */
/* ------------------------------------------------------------------ */
const STEPS: { key: ExposeStep; icon: React.ElementType }[] = [
  { key: 'building-prompt', icon: FileText },
  { key: 'generating-layout', icon: Palette },
  { key: 'rendering-pdf', icon: Printer },
];

function stepIndex(step: ExposeStep): number {
  const idx = STEPS.findIndex((s) => s.key === step);
  if (step === 'success') return STEPS.length;
  if (step === 'error') return -1;
  return idx;
}

const StepIndicator: React.FC<{ current: ExposeStep }> = ({ current }) => {
  const { t } = useLanguage();
  const ci = stepIndex(current);
  const labels = t.expose.steps;

  return (
    <div className="flex items-center justify-between gap-2 px-2">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        const done = ci > i;
        const active = ci === i;

        return (
          <React.Fragment key={s.key}>
            {i > 0 && (
              <div
                className={`flex-1 h-0.5 rounded-full transition-colors duration-500 ${
                  done ? 'bg-accent' : 'bg-gray-200 dark:bg-zinc-700'
                }`}
              />
            )}
            <div className="flex flex-col items-center gap-1.5 min-w-[64px]">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                  done
                    ? 'bg-accent border-accent text-black'
                    : active
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-gray-300 dark:border-zinc-600 text-gray-400 dark:text-zinc-500'
                }`}
              >
                {done ? <CheckCircle2 size={16} /> : <Icon size={16} />}
              </div>
              <span
                className={`text-[10px] font-medium leading-tight text-center ${
                  done || active
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-400 dark:text-zinc-500'
                }`}
              >
                {labels[i]}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  State bodies                                                      */
/* ------------------------------------------------------------------ */

const GeneratingBody: React.FC<{ step: ExposeStep }> = ({ step }) => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center gap-6 py-10">
      <StepIndicator current={step} />

      <div className="relative flex items-center justify-center mt-4">
        <span className="absolute inline-flex h-16 w-16 rounded-full bg-accent/20 animate-ping" />
        <div className="relative z-10 w-14 h-14 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center">
          <Loader2 size={28} className="text-accent animate-spin" />
        </div>
      </div>

      <p className="text-sm text-gray-500 dark:text-zinc-400 text-center max-w-xs">
        {t.expose.generatingHint}
      </p>

      <div className="w-full max-w-xs h-1.5 rounded-full bg-gray-200 dark:bg-zinc-800 overflow-hidden">
        <div className="h-full w-1/2 rounded-full bg-accent skeleton-shimmer" />
      </div>
    </div>
  );
};

const SuccessBody: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center gap-5 py-10">
      <StepIndicator current="success" />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        className="w-16 h-16 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center mt-2"
      >
        <CheckCircle2 size={30} className="text-green-500" />
      </motion.div>

      <div className="text-center">
        <p className="text-base font-semibold text-gray-900 dark:text-white mb-1">
          {t.expose.successTitle}
        </p>
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          {t.expose.successHint}
        </p>
      </div>
    </div>
  );
};

const ErrorBody: React.FC<{ message: string; onRetry: () => void }> = ({
  message,
  onRetry,
}) => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center gap-5 py-10 text-center">
      <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
        <AlertTriangle size={26} className="text-red-400" />
      </div>

      <div>
        <p className="text-base font-semibold text-gray-900 dark:text-white mb-2">
          {t.expose.errorTitle}
        </p>
        <p className="text-sm text-red-400 max-w-sm leading-relaxed">{message}</p>
      </div>

      <button
        type="button"
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border-2 border-accent bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
      >
        <RefreshCw size={15} />
        {t.expose.retry}
      </button>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Modal                                                             */
/* ------------------------------------------------------------------ */
const ExposeGenerationModal: React.FC<ExposeGenerationModalProps> = ({
  open,
  step,
  error,
  onClose,
  onRetry,
}) => {
  const { t } = useLanguage();
  const isProcessing =
    step === 'building-prompt' ||
    step === 'generating-layout' ||
    step === 'rendering-pdf';

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="expose-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={!isProcessing ? onClose : undefined}
            aria-hidden
          />

          {/* Panel */}
          <motion.div
            key="expose-panel"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            role="dialog"
            aria-modal="true"
            aria-label={t.expose.modalTitle}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="glass rounded-2xl w-full max-w-lg shadow-2xl pointer-events-auto flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center">
                    <Sparkles size={16} className="text-accent" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                      {t.expose.modalTitle}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-zinc-500 leading-tight">
                      {t.expose.modalSubtitle}
                    </p>
                  </div>
                </div>

                {!isProcessing && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-2 rounded-lg text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white transition-colors"
                    aria-label={t.propertyDetail.close}
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              {/* Body */}
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {isProcessing && (
                    <motion.div
                      key="generating"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <GeneratingBody step={step} />
                    </motion.div>
                  )}

                  {step === 'success' && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <SuccessBody />
                    </motion.div>
                  )}

                  {step === 'error' && error && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <ErrorBody message={error} onRetry={onRetry} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer – close on success */}
              {step === 'success' && (
                <div className="px-6 pb-5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 border-accent bg-accent text-black hover:bg-accent/90 transition-colors"
                  >
                    <FileDown size={16} />
                    {t.expose.close}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ExposeGenerationModal;
