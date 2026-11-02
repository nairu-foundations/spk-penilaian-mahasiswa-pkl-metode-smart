import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, Check, ShieldCheck } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { lockBodyScroll } from '../../lib/scrollLock';

export const AdminFeedback: React.FC = () => {
  const [notice, setNotice] = useState<{ id: number; message: string } | null>(null);
  const reducedMotion = useReducedMotion();
  const closeButton = useRef<HTMLButtonElement>(null);
  const open = notice !== null;
  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement;
    const unlock = lockBodyScroll();
    closeButton.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault(); event.stopImmediatePropagation(); setNotice(null);
      }
      if (event.key === 'Tab') { event.preventDefault(); closeButton.current?.focus(); }
    };
    window.addEventListener('keydown', handleKey, true);
    return () => {
      window.removeEventListener('keydown', handleKey, true);
      unlock();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [open]);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const show = (event: Event) => {
      const { message } = (event as CustomEvent<{ message: string }>).detail;
      setNotice(current => ({ id: (current?.id ?? 0) + 1, message }));
      clearTimeout(timer);
      timer = setTimeout(() => setNotice(null), 2400);
    };
    window.addEventListener('spk:mutation', show);
    return () => { clearTimeout(timer); window.removeEventListener('spk:mutation', show); };
  }, []);
  return createPortal(
      <AnimatePresence initial={false}>
        {notice && <motion.div className="admin-feedback-fullscreen" role="dialog" aria-modal="true"
          aria-labelledby="admin-feedback-title" aria-describedby="admin-feedback-message"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : .2 }}>
          <div className="admin-feedback-aurora" aria-hidden="true" />
          <div className="admin-feedback-grid" aria-hidden="true" />
          <motion.div className="admin-feedback-content"
            initial={{ y: reducedMotion ? 0 : 24, scale: reducedMotion ? 1 : .94 }}
            animate={{ y: 0, scale: 1 }} transition={{ duration: reducedMotion ? 0 : .35 }}>
            <div key={notice.id} className="admin-feedback-art" aria-hidden="true">
              <div className="admin-feedback-ring" /><div className="admin-feedback-ring admin-feedback-ring-second" />
              {Array.from({ length: 12 }, (_, index) => <i key={index} className="admin-feedback-particle" style={{ '--angle': `${index * 30}deg`, '--delay': `${index % 3 * 65}ms` } as React.CSSProperties} />)}
              <span className="admin-feedback-check"><Check size={54} strokeWidth={3} /></span>
            </div>
            <p className="admin-feedback-eyebrow"><ShieldCheck size={15} /> SMART PKL</p>
            <h2 id="admin-feedback-title">Perubahan berhasil!</h2>
            <p id="admin-feedback-message" aria-live="polite">{notice.message}</p>
            <button ref={closeButton} type="button" className="admin-feedback-continue" onClick={() => setNotice(null)}>Lanjutkan aktivitas <ArrowRight size={17} /></button>
            <p className="admin-feedback-hint">Menutup otomatis · Tekan Esc untuk kembali</p>
            <div key={`timer-${notice.id}`} className="admin-feedback-countdown" aria-hidden="true"><span /></div>
          </motion.div>
        </motion.div>}
      </AnimatePresence>, document.body
  );
};
