import type { MobileNavConfig } from './props'

const CONFIG_KEYS = [
	'hasToggle',
	'isOpen',
	'onOpenChange',
	'content',
	'breakpoint',
	'defaultIsMobile',
] as const

/** Distinguish the plain mobile-nav options object from a portable child.
 *  JSX elements and arrays remain opaque values; no renderer element API is
 *  needed in shared/native modules. */
export function isMobileNavConfig(value: unknown): value is MobileNavConfig {
	if (value == null || typeof value !== 'object' || Array.isArray(value)) {
		return false
	}

	const record = value as Record<string, unknown>
	return (
		Object.keys(record).length === 0 ||
		CONFIG_KEYS.some((key) => Object.prototype.hasOwnProperty.call(record, key))
	)
}
