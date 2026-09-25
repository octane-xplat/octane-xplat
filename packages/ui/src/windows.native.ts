import { Application } from '@nativescript/core';
import type { OpenWindowOptions } from './props';

/** Open another NativeScript window and pass app-owned data to its resolver. */
export function openWindow(options: OpenWindowOptions = {}): void {
	Application.openWindow(options);
}
