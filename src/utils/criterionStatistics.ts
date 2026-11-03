import type { MahasiswaPKL } from '../types';

export function statistikKriteria(students: MahasiswaPKL[], code: string) {
  const entries = students.flatMap(student => {
    const value = student.nilai_kriteria?.[code];
    return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100
      ? [{ id: student.id, name: student.nama, value }] : [];
  }).sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
  const values = entries.map(entry => entry.value).sort((a, b) => a - b);
  const n = values.length;
  const mean = n ? values.reduce((sum, value) => sum + value, 0) / n : null;
  const median = n ? (values[Math.floor((n - 1) / 2)] + values[Math.floor(n / 2)]) / 2 : null;
  const deviation = mean === null ? null : Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / n);
  const bins = [[0, 20], [20, 40], [40, 60], [60, 80], [80, 100]].map(([min, max], index) => {
    const count = values.filter(value => value >= min && (index === 4 ? value <= max : value < max)).length;
    return { name: index === 4 ? '80–100' : `${min}–<${max}`, count, percent: n ? count / n * 100 : 0 };
  });
  return { entries, count: n, missing: students.length - n, mean, median, min: n ? values[0] : null, max: n ? values[n - 1] : null, deviation, bins };
}
