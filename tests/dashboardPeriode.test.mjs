import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

async function load(entry) {
  const result = await build({ entryPoints: [entry], bundle: true, write: false, format: 'esm' });
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
}
const { distribusiPeringkat } = await load('src/utils/dashboardStats.ts');
const { akhirSatuBulan } = await load('src/utils/periode.ts');
const criteria = ['C1', 'C2', 'C3'].map(kode => ({ kode, aktif: true }));

test('distribution accounts for all 20 students and groups ranks 5 and above', () => {
  const students = Array.from({ length: 20 }, (_, index) => ({ peringkat: index + 1, nilai_kriteria: { C1: 85, C2: 85, C3: 85 } }));
  const result = distribusiPeringkat(students, criteria);
  assert.equal(result.total, 20);
  assert.equal(result.evaluated, 20);
  assert.deepEqual(result.buckets.map(bucket => bucket.value), [1, 1, 1, 1, 16]);
  assert.equal(result.buckets.reduce((sum, bucket) => sum + bucket.value, 0), 20);
});

test('partial or absent grades stay unranked; a complete zero score is valid', () => {
  const students = [
    { peringkat: 1, nilai_kriteria: {} },
    { peringkat: 2, nilai_kriteria: { C1: 80, C2: 75 } },
    { peringkat: 3, nilai_kriteria: { C1: 0, C2: 0, C3: 0 } },
  ];
  const result = distribusiPeringkat(students, criteria);
  assert.equal(result.evaluated, 1);
  assert.equal(result.unranked, 2);
  assert.equal(result.buckets.find(bucket => bucket.name === 'Peringkat 1').value, 0);
  assert.equal(result.buckets.reduce((sum, bucket) => sum + bucket.value, 0), 3);
});

test('no criteria or no students never produces fabricated ranking totals', () => {
  assert.equal(distribusiPeringkat([], criteria).total, 0);
  assert.equal(distribusiPeringkat([{ peringkat: 1, nilai_kriteria: { C1: 90 } }], []).unranked, 1);
});

test('one-month PKL periods include the last day of the month and handle February', () => {
  assert.equal(akhirSatuBulan('2026-01-01'), '2026-01-31');
  assert.equal(akhirSatuBulan('2026-02-01'), '2026-02-28');
  assert.equal(akhirSatuBulan('2028-02-01'), '2028-02-29');
  assert.equal(akhirSatuBulan('2026-11-01'), '2026-11-30');
  assert.equal(akhirSatuBulan('2026-01-15'), '2026-02-14');
  assert.equal(akhirSatuBulan('invalid'), '');
  assert.equal(akhirSatuBulan('2026-02-30'), '');
});
