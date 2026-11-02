import React, { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

export const AdminFeedback: React.FC = () => {
  const [notice, setNotice] = useState<{ id: number; message: string } | null>(null);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const show = (event: Event) => {
      const { message } = (event as CustomEvent<{ message: string }>).detail;
      setNotice(current => ({ id: (current?.id ?? 0) + 1, message }));
      clearTimeout(timer);
      timer = setTimeout(() => setNotice(null), 3500);
    };
    window.addEventListener('spk:mutation', show);
    return () => { clearTimeout(timer); window.removeEventListener('spk:mutation', show); };
  }, []);
  return (
    <div className="admin-feedback" role="status" aria-live="polite" aria-atomic="true">
      <AnimatePresence initial={false}>
        {notice && <motion.div key={notice.id} className="admin-feedback-card"
          initial={{ opacity: 0, y: reducedMotion ? 0 : 12, scale: reducedMotion ? 1 : .98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: reducedMotion ? 0 : -8 }} transition={{ duration: reducedMotion ? 0 : .2 }}>
          <CheckCircle2 size={21} aria-hidden="true" />
          <span>{notice.message}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Tutup notifikasi"><X size={16} /></button>
        </motion.div>}
      </AnimatePresence>
    </div>
  );
};
