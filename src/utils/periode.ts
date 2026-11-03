export function akhirSatuBulan(start: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) return '';
  const date = new Date(`${start}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== start) return '';
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const lastDayNextMonth = new Date(Date.UTC(year, month + 2, 0)).getUTCDate();
  const exclusiveEnd = new Date(Date.UTC(year, month + 1, Math.min(date.getUTCDate(), lastDayNextMonth)));
  exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() - 1);
  return exclusiveEnd.toISOString().slice(0, 10);
}

export function rentangPeriode(period?: { tanggal_mulai: string; tanggal_selesai: string }): string {
  if (!period?.tanggal_mulai || !period.tanggal_selesai) return 'Belum ada periode';
  const format = (date: string) => new Date(`${date}T00:00:00Z`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  return `${format(period.tanggal_mulai)} – ${format(period.tanggal_selesai)}`;
}
