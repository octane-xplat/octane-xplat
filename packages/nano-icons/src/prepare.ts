import type { IconifyIcon } from '@iconify/types'
import { iconToSVG } from '@iconify/utils/lib/svg/build'
import type { NanoIconOptions, PreparedNanoIcon } from './props'

// Strategy borrowed from react-native-nano-icons (see README): prepare once per
// immutable input, keep tint materialization separate, and bound what is
// retained. Keys are the resolved IconifyIcon objects owned by
// @octane-xplat/icons — collection replacement clears that registry cache and
// drops the objects, so these WeakMap entries release with them.
const MAX_VARIANTS_PER_ICON = 32
const prepared = new WeakMap<IconifyIcon, Map<string, PreparedNanoIcon>>()

/**
 * Prepare normalized icon geometry once and share it across equal instances.
 * Returns the same frozen object for the same icon data and options. The body
 * keeps `currentColor` and the artwork's definition IDs; per-instance
 * uniqueness and tint are `materializeNanoIcon`'s job.
 * @throws RangeError if size is not finite and positive.
 */
export function prepareNanoIcon(icon: IconifyIcon, options: NanoIconOptions = {}): PreparedNanoIcon {
	const size = options.size ?? 24
	if (!Number.isFinite(size) || size <= 0) {
		throw new RangeError('Icon size must be finite and positive')
	}

	const rotate = options.rotate ?? 0
	const hFlip = options.hFlip === true
	const vFlip = options.vFlip === true
	const key = `${size}|${rotate}|${hFlip ? 1 : 0}|${vFlip ? 1 : 0}`

	let variants = prepared.get(icon)
	if (!variants) {
		variants = new Map()
		prepared.set(icon, variants)
	}

	const hit = variants.get(key)
	if (hit) {
		// Map preserves insertion order; re-set marks the entry as most recent.
		variants.delete(key)
		variants.set(key, hit)
		return hit
	}

	const result = iconToSVG(icon, { height: size, rotate, hFlip, vFlip })
	const entry: PreparedNanoIcon = Object.freeze({
		body: result.body,
		viewBox: result.attributes.viewBox,
		width: Number(result.attributes.width),
		height: Number(result.attributes.height),
	})

	if (variants.size >= MAX_VARIANTS_PER_ICON) {
		variants.delete(variants.keys().next().value as string)
	}

	variants.set(key, entry)
	return entry
}
