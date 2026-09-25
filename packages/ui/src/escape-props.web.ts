/** Apply DOM escape props after the primitive's own props. Dash-named keys
 *  are attributes; other keys use the DOM property where available. */
export function applyEscapeProps(element: any, props: { web?: any }): void {
	if (!element || !props.web) {
		return
	}

	for (const [key, value] of Object.entries(props.web)) {
		if (key.includes('-')) {
			if (value == null || value === false) {
				element.removeAttribute(key)
			} else {
				element.setAttribute(key, value === true ? '' : String(value))
			}
		} else if (key in element) {
			try {
				element[key] = value
			} catch {
				element.setAttribute(key, String(value))
			}
		} else if (value != null) {
			element.setAttribute(key, String(value))
		}
	}
}
