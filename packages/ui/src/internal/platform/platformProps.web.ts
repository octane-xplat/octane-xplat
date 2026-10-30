/** Apply a web escape-hatch bag after the primitive's standard props. */
export function applyWebProps(el: any, props: Record<string, any> | undefined): void {
	if (!el || !props) {
		return
	}

	for (const [name, value] of Object.entries(props)) {
		if (name.includes('-')) {
			if (value == null) {
				el.removeAttribute(name)
			} else {
				el.setAttribute(name, String(value))
			}
		} else if (value == null) {
			// See applyEscapeProps: nullish must clear, not stringify.
			el.removeAttribute(name)
		} else {
			el[name] = value
		}
	}
}
