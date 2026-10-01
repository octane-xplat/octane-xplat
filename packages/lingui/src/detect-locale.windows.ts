// OS locale — Windows leaf. The Intl runtime default is the safest source on
// the alpha Windows runtime — no DOM or NativeScript-global assumption.
export function detectSystemLocale(): string | undefined {
	return Intl.DateTimeFormat().resolvedOptions().locale || undefined
}
