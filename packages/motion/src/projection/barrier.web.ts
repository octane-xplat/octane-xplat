import { motionHostElements } from '../host.web'
import type { LayoutBarrier } from './types'

export const layoutSupported = true

const volatileProps = new Set([
	'transform',
	'transform-origin',
	'opacity',
	'border-radius',
	'border-top-left-radius',
	'border-top-right-radius',
	'border-bottom-right-radius',
	'border-bottom-left-radius',
	'box-shadow',
])

function stripVolatile(style: string): string {
	return style
		.split(';')
		.map((decl) => decl.trim())
		.filter((decl) => decl && !volatileProps.has(decl.slice(0, decl.indexOf(':')).trim()))
		.join(';')
}

export const barrier: LayoutBarrier = {
	isMotionHost(node) {
		return node instanceof Element && motionHostElements.has(node)
	},
	schedule(pass) {
		queueMicrotask(pass)
	},
	observe(root) {
		const observer = new MutationObserver((records) => {
			const significant = records.some((record) => {
				if (
					record.type === 'attributes' &&
					record.attributeName === 'style' &&
					record.oldValue != null &&
					root.isMotionHost(record.target) &&
					stripVolatile(record.oldValue) ===
						stripVolatile((record.target as Element).getAttribute('style') ?? '')
				) {
					return false
				}

				return true
			})

			if (significant) {
				root.invalidate('mutation')
			}
		})
		observer.observe(document.documentElement, {
			subtree: true,
			childList: true,
			attributes: true,
			attributeOldValue: true,
			characterData: true,
		})

		const onResize = () => root.invalidate('resize')
		window.addEventListener('resize', onResize)
		return () => {
			observer.disconnect()
			window.removeEventListener('resize', onResize)
		}
	},
}
