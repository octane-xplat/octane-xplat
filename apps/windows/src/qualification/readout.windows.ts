import { Application, Image, TextBase, type View } from '@nativescript/core'

/** Numeric host readout complements UIA; it does not establish accessibility. */
export function layoutReadout() {
	const nodes: Record<string, unknown>[] = []
	const visit = (view: View, parent: number | null) => {
		const index = nodes.length
		const location = view.getLocationOnScreen()
		const size = view.getActualSize()
		nodes.push({
			index,
			parent,
			id: view.id,
			className: view.className,
			type: view.constructor.name,
			text: view instanceof TextBase ? view.text : undefined,
			label: view.accessibilityLabel,
			requestedWidth: view.width,
			masonWidth: (view as any)._styleHelper?.width,
			image:
				view instanceof Image
					? {
							width: view.imageSource?.width ?? 0,
							height: view.imageSource?.height ?? 0,
							isLoading: view.isLoading,
						}
					: undefined,
			box: location
				? { x: location.x, y: location.y, width: size.width, height: size.height }
				: null,
		})
		view.eachChildView((child) => {
			visit(child, index)
			return true
		})
	}
	const root = Application.getRootView()
	if (root) {
		visit(root, null)
	}
	return nodes
}
