// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
// Fixed browser-side operation, serialized internally. This is not an expression-evaluation API.
export function inspectDOM({ control, offset = 0, limit = 20, focus = false }) {
	const selector = '[id],[data-testid]'
	const matches = control
		? [...document.querySelectorAll(selector)].filter(
				(el) => (control.kind === 'id' ? el.id : el.getAttribute('data-testid')) === control.name,
			)
		: [...document.querySelectorAll(selector)]

	if (control && matches.length !== 1) {
		return {
			error: {
				code: matches.length ? 'ambiguous_selection' : 'not_found',
				message: `Stable control matched ${matches.length} hosts.`,
			},
		}
	}

	const controls = matches.slice(offset, offset + limit).map((el) => {
		const frame = el.getBoundingClientRect()
		const hidden =
			frame.width <= 0 || frame.height <= 0 || getComputedStyle(el).visibility !== 'visible'

		const privateSelector = 'input[type=password],input[type=hidden],[data-xplat-private]'
		const sensitive =
			el.matches(privateSelector) ||
			!!el.closest('[data-xplat-private]') ||
			!!el.querySelector(privateSelector)

		const x = frame.x + frame.width / 2
		const y = frame.y + frame.height / 2
		const hit = document.elementFromPoint(x, y)
		const disabled = el.matches(':disabled') || el.getAttribute('aria-disabled') === 'true'
		if (focus && !hidden && !disabled && !sensitive) {
			el.focus()
		}

		return {
			id: el.id || null,
			testID: el.getAttribute('data-testid'),
			tag: el.tagName.toLowerCase(),
			role: el.getAttribute('role'),
			text: sensitive ? '[redacted]' : (el.innerText ?? el.textContent ?? '').slice(0, 500),
			value: sensitive
				? '[redacted]'
				: typeof el.value === 'string'
					? el.value.slice(0, 500)
					: null,
			checked: typeof el.checked === 'boolean' ? el.checked : null,
			disabled,
			hidden,
			sensitive,
			focused: document.activeElement === el,
			hitTarget: hit === el || el.contains(hit),
			frame: { x: frame.x, y: frame.y, width: frame.width, height: frame.height },
		}
	})

	return {
		controls,
		total: matches.length,
		nextOffset: offset + controls.length < matches.length ? offset + controls.length : null,
	}
}
