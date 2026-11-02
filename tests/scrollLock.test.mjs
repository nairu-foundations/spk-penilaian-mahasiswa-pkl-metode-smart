import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const bundle = await build({ entryPoints: ['src/lib/scrollLock.ts'], bundle: true, write: false, format: 'esm' });
const { lockBodyScroll } = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));
globalThis.document = { body: { style: { overflow: '' } } };

test('closing a dialog restores the original scroll setting', () => {
  document.body.style.overflow = 'auto';
  const close = lockBodyScroll();
  assert.equal(document.body.style.overflow, 'hidden');
  close();
  assert.equal(document.body.style.overflow, 'auto');
});

test('closing the form before its success overlay keeps scroll locked until both close', () => {
  document.body.style.overflow = '';
  const closeForm = lockBodyScroll();
  const closeSuccess = lockBodyScroll();
  closeForm();
  assert.equal(document.body.style.overflow, 'hidden');
  closeSuccess();
  assert.equal(document.body.style.overflow, '');
});

test('out-of-order and repeated cleanup cannot unlock an active dialog or leave the body stuck', () => {
  document.body.style.overflow = 'scroll';
  const closeForm = lockBodyScroll();
  const closeSuccess = lockBodyScroll();
  closeSuccess();
  closeSuccess();
  assert.equal(document.body.style.overflow, 'hidden');
  closeForm();
  assert.equal(document.body.style.overflow, 'scroll');
});
