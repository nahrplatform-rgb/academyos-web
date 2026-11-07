import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listenForVisibleResume } from './visible-resume';

test('visible returns pair focus/visibility without a freshness timeout; later returns still refresh', async () => {
  const win = new EventTarget();
  const doc = Object.assign(new EventTarget(), { visibilityState: 'visible' });
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const oldDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'window', { value: win, configurable: true });
  Object.defineProperty(globalThis, 'document', { value: doc, configurable: true });
  let reads = 0;
  const stop = listenForVisibleResume(() => { reads++; });
  const visibility = (state: string) => { doc.visibilityState = state; doc.dispatchEvent(new Event('visibilitychange')); };
  try {
    win.dispatchEvent(new Event('focus'));
    await new Promise(resolve => setTimeout(resolve, 40));
    visibility('visible');
    assert.equal(reads, 1, 'unchanged visibility does not repeat a focus read');
    win.dispatchEvent(new Event('blur'));
    visibility('hidden');
    visibility('visible');
    await new Promise(resolve => setTimeout(resolve, 40));
    win.dispatchEvent(new Event('focus'));
    assert.equal(reads, 2, 'visible then focus is one return even if the first read is fast');
    win.dispatchEvent(new Event('blur'));
    win.dispatchEvent(new Event('focus'));
    assert.equal(reads, 3, 'distinct window return immediately checks again');
    visibility('hidden');
    win.dispatchEvent(new Event('focus'));
    assert.equal(reads, 3, 'background focus cannot fetch private tasks');
    stop();
    visibility('visible');
    win.dispatchEvent(new Event('focus'));
    assert.equal(reads, 3, 'unmounted listeners cannot refresh');
  } finally {
    stop();
    if (oldWindow) Object.defineProperty(globalThis, 'window', oldWindow);
    else Reflect.deleteProperty(globalThis, 'window');
    if (oldDocument) Object.defineProperty(globalThis, 'document', oldDocument);
    else Reflect.deleteProperty(globalThis, 'document');
  }
});
