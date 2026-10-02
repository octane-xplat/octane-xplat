/** Inspect native SVGView source and accessibility properties without visual analysis. */
export function iconSnapshot(view: any) {
	const body = String(view?.src ?? '')
	return {
		body,
		width: Number(body.match(/\bwidth="([^"]+)"/)?.[1]),
		height: Number(body.match(/\bheight="([^"]+)"/)?.[1]),
		label: view?.accessibilityLabel,
		decorative: view?.accessible === false,
	}
}
