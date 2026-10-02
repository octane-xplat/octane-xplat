/** Normalize a JSX children value to a flat array — children may be a
 *  single node, an array, or nested arrays from `.map` calls. */
export function toChildArray(children: any): any[] {
	const out: any[] = []
	const walk = (node: any) => {
		if (node == null || node === false) {
			return
		}
		if (Array.isArray(node)) {
			for (const child of node) {
				walk(child)
			}
		} else {
			out.push(node)
		}
	}

	walk(children)
	return out
}
