import { TrayError } from './errors.js'
import type {
	TrayIcon,
	TrayMenuItem,
	TrayOptions,
	TrayPlatformIcons,
	TrayRadioOption,
	TrayUpdate,
} from './types.js'

export type TrayPlatform = 'macos' | 'linux' | 'windows'

/** User callbacks must never crash the host. */
export function safeCall(callback: (() => void) | undefined): void {
	if (typeof callback !== 'function') {
		return
	}
	try {
		callback()
	} catch (error) {
		console.error('[tray] callback failed', error)
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requireString(value: unknown, field: string, code: 'invalid-options' | 'invalid-menu'): string {
	if (typeof value !== 'string' || value.length === 0) {
		throw new TrayError(code, `tray ${field} must be a non-empty string`)
	}
	return value
}

function requireOptional(
	value: unknown,
	field: string,
	predicate: (value: unknown) => boolean,
	expected: string,
) {
	if (value !== undefined && !predicate(value)) {
		throw new TrayError('invalid-menu', `tray menu ${field} must be ${expected}`)
	}
}

function validateRadioOption(option: unknown, path: string): asserts option is TrayRadioOption {
	if (!isRecord(option)) {
		throw new TrayError('invalid-menu', `tray menu ${path} must be an object`)
	}
	requireString(option.key, `${path}.key`, 'invalid-menu')
	if (typeof option.label !== 'string') {
		throw new TrayError('invalid-menu', `tray menu ${path}.label must be a string`)
	}
	requireOptional(option.value, `${path}.value`, (v) => typeof v === 'string', 'a string')
	requireOptional(
		option.isDisabled,
		`${path}.isDisabled`,
		(v) => typeof v === 'boolean',
		'a boolean',
	)
}

function validateMenuLevel(items: unknown, path: string): asserts items is readonly TrayMenuItem[] {
	if (!Array.isArray(items)) {
		throw new TrayError('invalid-menu', `tray menu ${path} must be an array`)
	}
	const keys = new Set<string>()
	for (const [index, item] of items.entries()) {
		const at = path === 'menu' ? `menu[${index}]` : `${path}.items[${index}]`
		if (!isRecord(item) || typeof item.type !== 'string') {
			throw new TrayError('invalid-menu', `tray ${at} must have a string type`)
		}
		const key = requireString(item.key, `${at}.key`, 'invalid-menu')
		if (keys.has(key)) {
			throw new TrayError('invalid-menu', `tray ${at}.key "${key}" duplicates a sibling key`)
		}
		keys.add(key)
		requireOptional(
			item.isDisabled,
			`${at}.isDisabled`,
			(v) => typeof v === 'boolean',
			'a boolean',
		)
		switch (item.type) {
			case 'action':
				if (typeof item.label !== 'string') {
					throw new TrayError('invalid-menu', `tray ${at}.label must be a string`)
				}
				requireOptional(item.onSelect, `${at}.onSelect`, (v) => typeof v === 'function', 'a function')
				break
			case 'checkbox':
				if (typeof item.label !== 'string') {
					throw new TrayError('invalid-menu', `tray ${at}.label must be a string`)
				}
				if (typeof item.value !== 'boolean') {
					throw new TrayError('invalid-menu', `tray ${at}.value must be a boolean`)
				}
				requireOptional(
					item.onValueChange,
					`${at}.onValueChange`,
					(v) => typeof v === 'function',
					'a function',
				)
				break
			case 'radio-group':
				if (item.label !== undefined && typeof item.label !== 'string') {
					throw new TrayError('invalid-menu', `tray ${at}.label must be a string`)
				}
				if (item.value !== undefined && typeof item.value !== 'string') {
					throw new TrayError('invalid-menu', `tray ${at}.value must be a string`)
				}
				requireOptional(
					item.onValueChange,
					`${at}.onValueChange`,
					(v) => typeof v === 'function',
					'a function',
				)
				if (!Array.isArray(item.items) || item.items.length === 0) {
					throw new TrayError('invalid-menu', `tray ${at}.items must be a non-empty array`)
				}
				{
					const optionKeys = new Set<string>()
					for (const [optionIndex, option] of item.items.entries()) {
						validateRadioOption(option, `${at}.items[${optionIndex}]`)
						const optionKey = option.key
						if (optionKeys.has(optionKey)) {
							throw new TrayError(
								'invalid-menu',
								`tray ${at}.items[${optionIndex}].key "${optionKey}" duplicates a sibling key`,
							)
						}
						optionKeys.add(optionKey)
					}
				}
				break
			case 'submenu':
			case 'section':
				if (typeof item.label !== 'string') {
					throw new TrayError('invalid-menu', `tray ${at}.label must be a string`)
				}
				validateMenuLevel(item.items, at)
				break
			case 'separator':
				break
			default:
				throw new TrayError('invalid-menu', `tray ${at}.type "${item.type}" is not supported`)
		}
	}
}

/** Validate the row tree; throws `TrayError('invalid-menu')` on malformed rows. */
export function validateTrayMenu(items: readonly TrayMenuItem[]): readonly TrayMenuItem[] {
	validateMenuLevel(items, 'menu')
	return items
}

function isTrayIcon(icon: TrayIcon | TrayPlatformIcons): icon is TrayIcon {
	return (icon as TrayIcon).type === 'file' || (icon as TrayIcon).type === 'named'
}

/** Resolve the icon entry for the current platform; throws `TrayError('invalid-icon')`. */
export function resolvePlatformIcon(
	icon: TrayIcon | TrayPlatformIcons,
	platform: TrayPlatform,
): TrayIcon {
	const resolved = isTrayIcon(icon) ? icon : icon[platform]
	if (!resolved || !isRecord(resolved)) {
		throw new TrayError('invalid-icon', `tray icon is missing for platform "${platform}"`)
	}
	if (resolved.type === 'file') {
		if (typeof resolved.path !== 'string' || resolved.path.length === 0) {
			throw new TrayError('invalid-icon', 'tray file icon needs a non-empty path')
		}
		if (resolved.isTemplate !== undefined && typeof resolved.isTemplate !== 'boolean') {
			throw new TrayError('invalid-icon', 'tray file icon isTemplate must be a boolean')
		}
		return { type: 'file', path: resolved.path, isTemplate: resolved.isTemplate }
	}
	if (resolved.type === 'named') {
		if (typeof resolved.name !== 'string' || resolved.name.length === 0) {
			throw new TrayError('invalid-icon', 'tray named icon needs a non-empty name')
		}
		return { type: 'named', name: resolved.name }
	}
	throw new TrayError('invalid-icon', `tray icon type "${(resolved as TrayIcon).type}" is not supported`)
}

export interface NormalizedTrayOptions {
	id: string
	icon: TrayIcon
	tooltip?: string
	title?: string
	menu?: readonly TrayMenuItem[]
	onActivate?: () => void
}

/** Validate {@link TrayOptions}; throws `TrayError` codes `invalid-options`, `invalid-icon`, `invalid-menu`. */
export function normalizeTrayOptions(
	options: TrayOptions,
	platform: TrayPlatform,
): NormalizedTrayOptions {
	if (typeof options !== 'object' || options === null || Array.isArray(options)) {
		throw new TrayError('invalid-options', 'createTray options must be an object')
	}
	requireString(options.id, 'id', 'invalid-options')
	const icon = resolvePlatformIcon(options.icon, platform)
	if (options.tooltip !== undefined && typeof options.tooltip !== 'string') {
		throw new TrayError('invalid-options', 'tray tooltip must be a string')
	}
	if (options.title !== undefined && typeof options.title !== 'string') {
		throw new TrayError('invalid-options', 'tray title must be a string')
	}
	if (options.menu !== undefined) {
		validateTrayMenu(options.menu)
	}
	if (options.onActivate !== undefined && typeof options.onActivate !== 'function') {
		throw new TrayError('invalid-options', 'tray onActivate must be a function')
	}
	return {
		id: options.id,
		icon,
		tooltip: options.tooltip,
		title: options.title,
		menu: options.menu,
		onActivate: options.onActivate,
	}
}

/** Validate {@link TrayUpdate} fields that are present; `null` clears, `undefined` keeps. */
export function normalizeTrayUpdate(changes: TrayUpdate, platform: TrayPlatform): TrayUpdate {
	if (typeof changes !== 'object' || changes === null || Array.isArray(changes)) {
		throw new TrayError('invalid-options', 'tray update must be an object')
	}
	if (changes.icon !== undefined) {
		resolvePlatformIcon(changes.icon, platform)
	}
	if (changes.tooltip !== undefined && changes.tooltip !== null && typeof changes.tooltip !== 'string') {
		throw new TrayError('invalid-options', 'tray tooltip must be a string or null')
	}
	if (changes.title !== undefined && changes.title !== null && typeof changes.title !== 'string') {
		throw new TrayError('invalid-options', 'tray title must be a string or null')
	}
	if (changes.menu !== undefined && changes.menu !== null) {
		validateTrayMenu(changes.menu)
	}
	if (
		changes.onActivate !== undefined &&
		changes.onActivate !== null &&
		typeof changes.onActivate !== 'function'
	) {
		throw new TrayError('invalid-options', 'tray onActivate must be a function or null')
	}
	return changes
}

/** Click dispatch shared by every platform: action runs `onSelect`, checkbox toggles
 * `!value`, radio selects a different option's `value ?? key`, disabled rows do nothing. */
export function dispatchTraySelect(item: TrayMenuItem, option?: TrayRadioOption): void {
	switch (item.type) {
		case 'action':
			if (!item.isDisabled) {
				safeCall(item.onSelect)
			}
			return
		case 'checkbox':
			if (!item.isDisabled) {
				safeCall(() => item.onValueChange?.(!item.value))
			}
			return
		case 'radio-group': {
			if (!option || item.isDisabled || option.isDisabled) {
				return
			}
			const value = option.value ?? option.key
			if (value !== item.value) {
				safeCall(() => item.onValueChange?.(value))
			}
			return
		}
		default:
			return
	}
}
