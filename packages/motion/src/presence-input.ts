export function blockInput(node: any): () => void {
	const enabled = node.isUserInteractionEnabled
	const iosHidden = node.ios?.accessibilityElementsHidden
	const androidImportance = node.android?.getImportantForAccessibility?.()
	node.ios?.endEditing?.(true)
	const focused = node.android?.findFocus?.()
	if (focused) {
		const platform = globalThis as any
		const context = focused.getContext()
		context
			.getSystemService(platform.android.content.Context.INPUT_METHOD_SERVICE)
			?.hideSoftInputFromWindow(focused.getWindowToken(), 0)

		focused.clearFocus()
	}

	node.isUserInteractionEnabled = false
	if (node.ios) {
		node.ios.accessibilityElementsHidden = true
	}
	node.android?.setImportantForAccessibility?.(4) // IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS
	return () => {
		node.isUserInteractionEnabled = enabled
		if (node.ios) {
			node.ios.accessibilityElementsHidden = iosHidden
		}
		if (androidImportance !== undefined) {
			node.android?.setImportantForAccessibility?.(androidImportance)
		}
	}
}
