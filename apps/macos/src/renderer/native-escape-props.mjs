// AppKit has no NativeScript Core device globals or iOS/Android escape bags.
export function applyEscapeProps() {}

export function nativeAccessibilityRole(role) {
	return role
}

export function nativeAccessibilityState(state) {
	if (state?.disabled) {
		return 'disabled'
	}

	if (state?.selected) {
		return 'selected'
	}

	if (state?.checked === true) {
		return 'checked'
	}

	if (state?.checked === false) {
		return 'unchecked'
	}

	return undefined
}
