// Linux webview declarations — the web surface, with openWindow widened to
// the host-window handle and colorScheme unchanged in signature (the linux
// leaf only changes where the value comes from).
import type * as P from './props'

export * from './index.web'

export interface LinuxWindowHandle {
	readonly id: string
	readonly closed: Promise<void>
	close(): void
	setTitle(title: string): void
}

export declare function openWindow(
	options?: P.OpenWindowOptions & {
		kind?: 'regular' | 'dialog'
		title?: string
		size?: { width: number; height: number }
	},
): LinuxWindowHandle | Window | null
