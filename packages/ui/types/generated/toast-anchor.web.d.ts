import type { ToastContent, ToastOptions } from './props.js';
/**  FIFO queue. `anchor` uses the same portal positioning as Popover; without
 * one, top/bottom and their start/end alignment variants use the viewport. */
export declare function showToast(content: ToastContent, options?: ToastOptions): void;
