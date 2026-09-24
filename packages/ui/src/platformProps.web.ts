/** Apply a web escape-hatch bag after the primitive's standard props. */
export function applyWebProps(el: any, props: Record<string, any> | undefined) {
	if (!el || !props) return
	for (const [name, value] of Object.entries(props)) {
		if (name.includes('-')) el.setAttribute(name, String(value))
		else el[name] = value
	}
}
