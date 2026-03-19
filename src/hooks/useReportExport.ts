import { useState, useCallback } from 'react';
import { generateDashboardReportPdf } from '../utils/reportPdfGenerator';
import type { ReportSnapshot } from '../utils/reportPromptBuilder';
import type { Property } from '../types';

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------
export type ExportStatus = 'idle' | 'generating' | 'success' | 'error';

export interface UseReportExportReturn {
  /** Current status of the export pipeline */
  status: ExportStatus;
  /** Blob URL of the generated PDF — only set on 'success' */
  pdfUrl: string | null;
  /** Human-readable error message — only set on 'error' */
  errorMessage: string | null;
  /** Whether to show the modal (open after clicking Export Report) */
  modalOpen: boolean;
  /** Call this when user clicks "Export Report" — opens modal and fires generation */
  openExport: (snapshot: ReportSnapshot, properties: Property[]) => void;
  /** Re-run generation with the same snapshot */
  regenerate: () => void;
  /** Download the generated PDF */
  downloadPdf: (dateStr: string) => void;
  /** Download the raw JSON report */
  downloadJson: (snapshot: ReportSnapshot) => void;
  /** Close the modal and reset state */
  closeModal: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useReportExport(): UseReportExportReturn {
  const [status, setStatus]           = useState<ExportStatus>('idle');
  const [pdfUrl, setPdfUrl]           = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modalOpen, setModalOpen]     = useState(false);
  const [lastSnapshot, setLastSnapshot] = useState<ReportSnapshot | null>(null);
  const [lastProperties, setLastProperties] = useState<Property[]>([]);

  // ── core generation ────────────────────────────────────────────────────
  const runGeneration = useCallback(async (snapshot: ReportSnapshot, properties: Property[]) => {
    setStatus('generating');
    setPdfUrl(null);
    setErrorMessage(null);

    try {
      const doc = await generateDashboardReportPdf(snapshot, properties);
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setStatus('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate PDF report.';
      setErrorMessage(msg);
      setStatus('error');
    }
  }, []);

  // ── public actions ─────────────────────────────────────────────────────
  const openExport = useCallback(
    (snapshot: ReportSnapshot, properties: Property[]) => {
      setLastSnapshot(snapshot);
      setLastProperties(properties);
      setModalOpen(true);
      runGeneration(snapshot, properties);
    },
    [runGeneration],
  );

  const regenerate = useCallback(() => {
    if (!lastSnapshot) return;
    runGeneration(lastSnapshot, lastProperties);
  }, [lastSnapshot, lastProperties, runGeneration]);

  const downloadPdf = useCallback(
    (dateStr: string) => {
      if (!pdfUrl) return;
      const a       = document.createElement('a');
      a.href        = pdfUrl;
      a.download    = `immosync-performance-report-${dateStr}.pdf`;
      a.click();
    },
    [pdfUrl],
  );

  const downloadJson = useCallback((snapshot: ReportSnapshot) => {
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: 'application/json',
    });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `immosync-report-${snapshot.exportedAt.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    // Small delay before resetting so the exit animation can complete
    setTimeout(() => {
      setStatus('idle');
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
      setErrorMessage(null);
    }, 300);
  }, [pdfUrl]);

  return {
    status,
    pdfUrl,
    errorMessage,
    modalOpen,
    openExport,
    regenerate,
    downloadPdf,
    downloadJson,
    closeModal,
  };
}
