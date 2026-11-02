import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { lockBodyScroll } from '../../lib/scrollLock';
import { X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
}) => {
  const reducedMotion = useReducedMotion();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const unlock = lockBodyScroll();
    const previousFocus = document.activeElement;
    const focusable = () => Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]'
    ) ?? []).filter(element => element.getClientRects().length > 0);
    const input = dialogRef.current?.querySelector<HTMLElement>('input:not(:disabled), select:not(:disabled), textarea:not(:disabled)');
    (input ?? focusable()[0])?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
      if (e.key === 'Tab' && dialogRef.current?.contains(document.activeElement)) {
        const elements = focusable();
        const target = e.shiftKey ? elements[elements.length - 1] : elements[0];
        if ((e.shiftKey && document.activeElement === elements[0]) || (!e.shiftKey && document.activeElement === elements[elements.length - 1])) {
          e.preventDefault(); target?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      unlock();
      window.removeEventListener('keydown', handleKeyDown);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [isOpen]);

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  }[maxWidth];

  return createPortal(
    <AnimatePresence>
    {isOpen && <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden overscroll-contain"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : .18 }}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Dialog box */}
      <motion.div
        ref={dialogRef}
        role="dialog" aria-modal="true" aria-label={title}
        initial={{ y: reducedMotion ? 0 : 14, scale: reducedMotion ? 1 : .98 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: reducedMotion ? 0 : 8, scale: reducedMotion ? 1 : .98 }}
        transition={{ duration: reducedMotion ? 0 : .18 }}
        className={`relative w-full ${maxWidthClass} max-h-[calc(100dvh-2rem)] flex flex-col bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 z-10 overflow-hidden`}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {title}
          </h3>
          <button
            type="button" aria-label="Tutup dialog"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 min-h-0 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </motion.div>
    </motion.div>}
    </AnimatePresence>, document.body
  );
};
