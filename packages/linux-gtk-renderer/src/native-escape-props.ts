// GTK has no NativeScript Core device globals or iOS/Android escape bags.
export function applyEscapeProps() {}

export function nativeAccessibilityRole(role: string) {
	return role
}

export function nativeAccessibilityState(state?: Record<string, unknown>) {
	return state
}
