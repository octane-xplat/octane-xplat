// Exact host diagnostics that can occur during otherwise successful measurement.
const nonFatalMessages = {
	web: new Set(['ResizeObserver loop completed with undelivered notifications.']),
}

export function isNonFatalError(error, target) {
	return nonFatalMessages[target]?.has(error?.message) === true
}
