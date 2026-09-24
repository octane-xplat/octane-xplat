import { signal$ } from 'octane/signals';

/**
 * Universal signal-read seam: the native harness sets this from ambient code
 * and asserts the reading component re-renders. Replaces the hand-rolled
 * external-store leaf the nativescript renderer used to require.
 */
export const probeSignal$ = signal$('sig-off');
