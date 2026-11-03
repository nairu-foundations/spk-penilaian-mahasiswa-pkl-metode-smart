import type { Kriteria, MahasiswaPKL } from '../types';

export function distribusiPeringkat(students: MahasiswaPKL[], criteria: Kriteria[]) {
  const active = criteria.filter(criterion => criterion.aktif);
  const evaluated = students.filter(student => active.length > 0 && active.every(criterion => {
    const score = student.nilai_kriteria?.[criterion.kode];
    return typeof score === 'number' && Number.isFinite(score) && score >= 0 && score <= 100;
  }));
  const buckets = [1, 2, 3, 4, 5].map((rank, index) => ({
    name: rank === 5 ? 'Peringkat 5+' : `Peringkat ${rank}`,
    value: evaluated.filter(student => rank === 5 ? (student.peringkat ?? 0) >= 5 : student.peringkat === rank).length,
    color: ['#2563eb', '#38bdf8', '#f59e0b', '#10b981', '#a855f7'][index],
  }));
  const unranked = students.length - buckets.reduce((total, bucket) => total + bucket.value, 0);
  if (unranked > 0) buckets.push({ name: 'Belum diperingkat', value: unranked, color: '#94a3b8' });
  return { buckets, evaluated: evaluated.length, unranked, total: students.length };
}
