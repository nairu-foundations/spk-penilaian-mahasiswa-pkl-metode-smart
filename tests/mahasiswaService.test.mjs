import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const bundled = await build({
  entryPoints: ['src/services/mahasiswaService.ts'], bundle: true,
  write: false, format: 'esm', platform: 'node',
  plugins: [{ name: 'database-test-double', setup(builder) {
    builder.onResolve({ filter: /supabaseClient$/ }, () => ({ path: 'database', namespace: 'mock' }));
    builder.onLoad({ filter: /.*/, namespace: 'mock' }, () => ({ contents:
      'export const isSupabaseConfigured = true; export const supabase = globalThis.testDatabase;'
    }));
  } }],
});

let rows;
let failure;
let calls;
globalThis.testDatabase = {
  from(table) {
    assert.ok(['mahasiswa_pkl', 'mahasiswa_pkl_app'].includes(table));
    return {
      select() { return { order: async () => ({ data: structuredClone(rows), error: failure }) }; },
      delete() { return { eq: (_, id) => ({ select: async () => {
        if (failure) return { error: failure };
        const deleted = rows.filter((row) => row.id === id);
        rows = rows.filter((row) => row.id !== id);
        return { data: deleted };
      } }) }; },
    };
  },
  async rpc(name, args) {
    calls.push({ name, args });
    if (failure) return { error: failure };
    if (args.p_replace) rows = [];
    for (const item of args.p_rows) {
      const index = rows.findIndex((row) => row.id === item.id);
      if (index < 0) rows.push(structuredClone(item));
      else rows[index] = structuredClone(item);
    }
    return { data: structuredClone(args.p_rows) };
  },
};

// Separate service instances stand in for browser profiles using one shared database.
const load = async (profile) => (await import('data:text/javascript;base64,' +
  Buffer.from(bundled.outputFiles[0].text + `\n// ${profile}`).toString('base64'))).mahasiswaService;
const chromeA = await load('chrome-a');
const chromeB = await load('chrome-b');
const student = {
  id: 'legacy-browser-id', nama: 'Mahasiswa Uji', email: 'UJI@example.test', nim: '123',
  bagian: 'IT', periode: '2026', tanggal_mulai: '2026-01-01', tanggal_selesai: '2026-06-30',
  no_hp: '08123', status: 'Aktif', nilai_kriteria: { C1: 70, C2: 80, C3: 90 },
};
beforeEach(() => { rows = []; failure = null; calls = []; });

test('save, edit scores, and delete are shared across browser profiles', async () => {
  const [saved] = await chromeA.saveMany([student]);
  assert.match(saved.id, /^[0-9a-f-]{36}$/);
  assert.equal(saved.email, 'uji@example.test');
  assert.deepEqual(await chromeB.list(), [saved]);
  await chromeB.saveMany([{ ...saved, nilai_kriteria: { C1: 99 } }]);
  assert.equal((await chromeA.list())[0].nilai_kriteria.C1, 99);
  await chromeA.remove(saved.id);
  assert.deepEqual(await chromeB.list(), []);
});

test('editing identity preserves scores and database ID', async () => {
  const [saved] = await chromeA.saveMany([student]);
  const { nilai_kriteria, ...identity } = saved;
  const [updated] = await chromeA.saveMany([{ ...identity, nama: 'Nama Baru', email: 'baru@example.test' }]);
  assert.equal(updated.id, saved.id);
  assert.deepEqual(updated.nilai_kriteria, student.nilai_kriteria);
});

test('legacy migration matches email and assigns unique alternative codes', async () => {
  const [saved] = await chromeA.saveMany([{ ...student, kode_alternatif: 'A1' }]);
  const imported = await chromeA.saveMany([
    { ...student, nama: 'Migrated' },
    { ...student, id: 'old-2', email: 'second@example.test', kode_alternatif: 'A1' },
  ]);
  assert.equal(imported[0].id, saved.id);
  assert.equal(imported[1].kode_alternatif, 'A2');
});

test('replace import uses one atomic RPC instead of deleting first', async () => {
  await chromeA.saveMany([student], true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].name, 'save_mahasiswa_pkl_batch');
  assert.equal(calls[0].args.p_replace, true);
});

test('database failures throw rather than falling back to browser storage', async () => {
  failure = { message: 'permission denied' };
  await assert.rejects(chromeA.list(), /permission denied/);
  await assert.rejects(chromeA.saveMany([student]), /permission denied/);
  assert.equal(calls.length, 0);
});

test('invalid scores and duplicate emails are rejected before writing', async () => {
  await assert.rejects(chromeA.saveMany([{ ...student, nilai_kriteria: { C1: 101 } }]), /0 dan 100/);
  await assert.rejects(chromeA.saveMany([student, student]), /berulang/);
  assert.equal(calls.length, 0);
});
