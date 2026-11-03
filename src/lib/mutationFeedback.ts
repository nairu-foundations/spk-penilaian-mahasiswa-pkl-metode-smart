// Emit only after the database has confirmed a mutation, never for background reads.
export function notifyMutation(message = 'Perubahan tersimpan di Supabase.') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('spk:mutation', { detail: { message } }));
    window.dispatchEvent(new Event('spk:refresh'));
  }
}
