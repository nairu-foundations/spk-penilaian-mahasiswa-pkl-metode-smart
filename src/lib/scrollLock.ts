let lockCount = 0;
let originalOverflow = '';

// Dialogs and success overlays may overlap. Restore scrolling after the last closes.
export function lockBodyScroll(): () => void {
  if (lockCount++ === 0) {
    originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (--lockCount === 0) document.body.style.overflow = originalOverflow;
  };
}
