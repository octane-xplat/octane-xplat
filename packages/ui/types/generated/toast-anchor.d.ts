import type { ToastContent, ToastOptions } from './props.js';
/**  FIFO queue. Anchored options use Popover; unanchored options use the
 * RootLayout with top/bottom start/end alignment. */
export declare function showToast(content: ToastContent, options?: ToastOptions): void;
