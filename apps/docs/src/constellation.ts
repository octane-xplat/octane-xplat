/** Random, bounded twinkling while the card is at its scroll origin. */
export function animateConstellation(host: HTMLElement, content: HTMLElement) {
	const elements = [...host.querySelectorAll('polygon')]
	const limit = Math.floor(elements.length * 0.8)
	const minimum = Math.min(limit, Math.ceil(elements.length * 0.5))
	const active = new Map<SVGPolygonElement, Animation>()
	const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
	let timer: ReturnType<typeof setTimeout> | undefined
	let disposed = false

	const stop = () => {
		clearTimeout(timer)
		timer = undefined
		for (const animation of active.values()) {
			animation.cancel()
		}
		active.clear()
	}

	const enabled = () => !disposed && content.scrollTop <= 0 && !reducedMotion.matches
	const startFade = () => {
		const available = elements.filter((element) => !active.has(element))
		const element = available[Math.floor(Math.random() * available.length)]
		const animation = element.animate([{ opacity: 1 }, { opacity: 0.35 }, { opacity: 1 }], {
			duration: 2340 + Math.random() * 2340,
			easing: 'ease-in-out',
		})

		active.set(element, animation)
		animation.onfinish = () => {
			if (active.get(element) !== animation) {
				return
			}
			active.delete(element)
			if (enabled()) {
				ensureMinimum()
			} else {
				stop()
			}
		}
	}

	const ensureMinimum = () => {
		while (active.size < minimum) {
			startFade()
		}
	}

	const schedule = () => {
		timer = setTimeout(
			() => {
				timer = undefined
				if (!enabled()) {
					stop()
					return
				}

				if (active.size < limit) {
					startFade()
				}

				schedule()
			},
			100 + Math.random() * 200,
		)
	}

	const sync = () => {
		if (!enabled()) {
			stop()
		} else if (timer === undefined && limit > 0 && typeof elements[0]?.animate === 'function') {
			ensureMinimum()
			schedule()
		}
	}

	content.addEventListener('scroll', sync, { passive: true })
	reducedMotion.addEventListener('change', sync)
	sync()
	return () => {
		disposed = true
		stop()
		content.removeEventListener('scroll', sync)
		reducedMotion.removeEventListener('change', sync)
	}
}
