/** AppKit doesn't have NativeScript's attached-property bridge. Platform
 * escape bags are therefore intentionally ignored by this experimental leaf. */
export function applyEscapeProps(_view: unknown, _props: unknown): void {}

export function nativeAccessibilityRole(role?: string): string | undefined {
	return role
}

export function nativeAccessibilityState(
	state?: Record<string, boolean | undefined>,
): Record<string, boolean | undefined> | undefined {
	return state
}
