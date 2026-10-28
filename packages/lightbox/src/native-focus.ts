/** Attempt keyboard focus only after the presenting native layer detaches.
 * This does not move VoiceOver/TalkBack accessibility focus. */
export function restoreNativeFocus(
	layer: { parent?: unknown } | null | undefined,
	targets: () => readonly any[],
	isCurrent: () => boolean,
) {
	let timer: ReturnType<typeof setTimeout> | undefined
	let cancelled = false
	let attempts = 0
	const check = () => {
		if (cancelled || !isCurrent() || !layer) return
		if (layer.parent) {
			if (++attempts < 100) timer = setTimeout(check, 16)
			return
		}
		for (const target of targets()) {
			if (!target?.parent || target.isLoaded === false || typeof target.focus !== 'function') continue
			if (target.focus()) break
		}
	}
	timer = setTimeout(check, 0)
	return () => { cancelled = true; if (timer !== undefined) clearTimeout(timer) }
}
