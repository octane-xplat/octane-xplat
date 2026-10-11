export function notificationBody(body?: string): string {
	// Plugin 7.0.0 moves the title into the body when body is falsy.
	// A blank body keeps the title slot and satisfies its iOS delivery fallback.
	return body || ' '
}
