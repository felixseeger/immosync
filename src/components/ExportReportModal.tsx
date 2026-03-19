import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Download,
  FileJson,
  RefreshCw,
  Loader2,
  ImageOff,
  Sparkles,
} from 'lucide-react';
import type { ExportStatus } from '../hooks/useReportExport';
import type { ReportSnapshot } from '../utils/reportPromptBuilder';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface ExportReportModalProps {
  open: boolean;
  status: ExportStatus;
  pdfUrl: string | null;
  errorMessage: string | null;
  snapshot: ReportSnapshot | null;
  onClose: () => void;
  onRegenerate: () => void;
  onDownloadPdf: (dateStr: string) => void;
  onDownloadJson: (snapshot: ReportSnapshot) => void;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Animated spinner + label shown while PDF is generating */
const GeneratingState: React.FC = () => (
  <div className="flex flex-col items-center justify-center gap-5 py-16 px-8 text-center">
    {/* Pulsing ring */}
    <div className="relative flex items-center justify-center">
      <span className="absolute inline-flex h-16 w-16 rounded-full bg-accent/20 animate-ping" />
      <div className="relative z-10 w-14 h-14 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center">
        <Loader2 size={28} className="text-accent animate-spin" />
      </div>
    </div>

    <div>
      <p className="text-base font-semibold text-gray-900 dark:text-white mb-1">
        Preparing your PDF report…
      </p>
      <p className="text-sm text-gray-500 dark:text-zinc-400 max-w-xs">
        Compiling dashboard KPIs and property inventory into a professional document.
      </p>
    </div>

    {/* Shimmer progress bar */}
    <div className="w-full max-w-xs h-1.5 rounded-full bg-gray-200 dark:bg-zinc-800 overflow-hidden">
      <div className="h-full w-1/2 rounded-full bg-accent skeleton-shimmer" />
    </div>
  </div>
);

/** Error state with retry + JSON fallback */
const ErrorState: React.FC<{
  message: string;
  onRetry: () => void;
  onJson: () => void;
  hasSnapshot: boolean;
}> = ({ message, onRetry, onJson, hasSnapshot }) => (
  <div className="flex flex-col items-center justify-center gap-5 py-16 px-8 text-center">
    <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
      <ImageOff size={26} className="text-red-400" />
    </div>

    <div>
      <p className="text-base font-semibold text-gray-900 dark:text-white mb-2">
        Report generation failed
      </p>
      <p className="text-sm text-red-400 max-w-sm leading-relaxed">{message}</p>
    </div>

    <div className="flex gap-3 flex-wrap justify-center">
      <button
        type="button"
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border-2 border-accent bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
      >
        <RefreshCw size={15} />
        Try again
      </button>

      {hasSnapshot && (
        <button
          type="button"
          onClick={onJson}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border-2 border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <FileJson size={15} />
          Download JSON instead
        </button>
      )}
    </div>
  </div>
);

/** Success state — PDF ready + download actions */
const SuccessState: React.FC<{
  pdfUrl: string;
  dateStr: string;
  onDownloadPdf: () => void;
  onDownloadJson: () => void;
  onRegenerate: () => void;
}> = ({ pdfUrl, onDownloadPdf, onDownloadJson, onRegenerate }) => (
  <div className="flex flex-col gap-5">
    {/* PDF Preview area */}
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 h-[300px] flex items-center justify-center"
    >
      <div className="text-center px-6">
        <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
          <Download size={32} className="text-blue-500" />
        </div>
        <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">Report Ready</p>
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          Your Performance Report PDF is ready for download.
        </p>
      </div>
      
      {/* Generated badge */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-xs text-white/80">
        <Sparkles size={11} className="text-accent" />
        SiteSync Intelligence
      </div>
    </motion.div>

    {/* Action row */}
    <div className="flex gap-3 flex-wrap">
      {/* Primary: Download PDF */}
      <button
        type="button"
        onClick={onDownloadPdf}
        className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border-2 border-accent bg-accent text-black hover:bg-accent/90 transition-colors"
      >
        <Download size={15} />
        Download PDF
      </button>

      {/* Secondary: Download JSON */}
      <button
        type="button"
        onClick={onDownloadJson}
        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border-2 border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <FileJson size={15} />
        JSON
      </button>

      {/* Tertiary: Regenerate */}
      <button
        type="button"
        onClick={onRegenerate}
        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border-2 border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
        title="Generate a new version"
      >
        <RefreshCw size={15} />
        Refresh
      </button>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------
const ExportReportModal: React.FC<ExportReportModalProps> = ({
  open,
  status,
  pdfUrl,
  errorMessage,
  snapshot,
  onClose,
  onRegenerate,
  onDownloadPdf,
  onDownloadJson,
}) => {
  const dateStr = snapshot?.exportedAt?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            role="dialog"
            aria-modal="true"
            aria-label="Export Report"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="glass rounded-2xl w-full max-w-2xl shadow-2xl pointer-events-auto flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center">
                    <FileJson size={16} className="text-accent" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                      Export Performance Report
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-zinc-500 leading-tight">
                      Dashboard KPIs & Property Inventory
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-lg text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white transition-colors"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {status === 'generating' && (
                    <motion.div
                      key="generating"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <GeneratingState />
                    </motion.div>
                  )}

                  {status === 'error' && errorMessage && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ErrorState
                        message={errorMessage}
                        onRetry={onRegenerate}
                        onJson={() => snapshot && onDownloadJson(snapshot)}
                        hasSnapshot={!!snapshot}
                      />
                    </motion.div>
                  )}

                  {status === 'success' && pdfUrl && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <SuccessState
                        pdfUrl={pdfUrl}
                        dateStr={dateStr}
                        onDownloadPdf={() => onDownloadPdf(dateStr)}
                        onDownloadJson={() => snapshot && onDownloadJson(snapshot)}
                        onRegenerate={onRegenerate}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ExportReportModal;
