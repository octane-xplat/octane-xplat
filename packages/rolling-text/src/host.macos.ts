// AppKit refs are NSViews; NativeScript view-property writes do not move them.
export const frame: {
	now: () => number
	request: (callback: () => void) => any
	cancel: (id: number) => void
} = {
	now: () => Date.now(),
	request: (callback: () => void) => setTimeout(callback, 16) as any,
	cancel: (id: number) => clearTimeout(id),
}

export function clipRow(view: any): void {
	if (view) {
		view.wantsLayer = true
		if (view.layer) {
			view.layer.masksToBounds = true
		}
	}
}

export function viewHeight(view: any): number {
	return Math.max(0, Number(view?.bounds?.size?.height ?? 0))
}

export function writeCell(view: any, y: number, opacity: number): void {
	if (!view) {
		return
	}

	const transaction = (globalThis as any).CATransaction
	transaction?.begin()
	try {
		transaction?.setDisableActions(true)
		view.alphaValue = Math.min(1, Math.max(0, opacity))
		view.wantsLayer = true
		// Shared coordinates are y-down; CALayer translation is y-up.
		view.layer?.setValueForKeyPath(-y, 'transform.translation.y')
	} finally {
		transaction?.commit()
	}
}
