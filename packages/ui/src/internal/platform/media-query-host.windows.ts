import { Application, Screen, type View } from '@nativescript/core'
import { Windows } from '@octane-xplat/platform/windows'

type KnownBoolean = boolean | null

/** @internal Null means that the host could not establish the capability. */
export interface WindowsMediaTraits {
	width: number
	height: number
	pointer: 'none' | 'coarse' | 'fine' | null
	anyFine: KnownBoolean
	anyCoarse: KnownBoolean
	anyNone: KnownBoolean
	hover: KnownBoolean
	anyHover: KnownBoolean
	reducedMotion: KnownBoolean
}

function presence(read: () => unknown): KnownBoolean {
	try {
		const value = read()
		return typeof value === 'boolean'
			? value
			: typeof value === 'number' && Number.isFinite(value) && value >= 0
				? value > 0
				: null
	} catch {
		return null
	}
}

/** @internal Sample capabilities; mouse, then pen, then touch selects primary input. */
export function readWindowsMediaTraits(): WindowsMediaTraits {
	const input = Windows?.Devices?.Input
	let mouse = presence(() => new input.MouseCapabilities().MousePresent)
	let touch = presence(() => new input.TouchCapabilities().TouchPresent)
	let pen = false
	let penHover: KnownBoolean = false
	let complete = false
	try {
		const devices = input.PointerDevice.GetPointerDevices()
		const types = input.PointerDeviceType
		const count = devices.Size ?? devices.Count
		if (typeof count === 'number' && Number.isSafeInteger(count) && count >= 0) {
			complete = true
			for (let index = 0; index < count; index++) {
				const device = devices.GetAt(index)
				const type = device.PointerDeviceType
				if (
					(types.Mouse != null && type === types.Mouse) ||
					(types.Touchpad != null && type === types.Touchpad)
				) {
					mouse = true
				} else if (types.Touch != null && type === types.Touch) {
					touch = true
				} else if (types.Pen != null && type === types.Pen) {
					pen = true
					const hover = presence(() => device.MaxPointersWithZDistance)
					if (hover === true) {
						penHover = true
					} else if (hover === null && penHover !== true) {
						penHover = null
					}
				} else {
					complete = false
				}
			}
		}
	} catch {
		complete = false
	}
	const animations = presence(() => new Windows.UI.ViewManagement.UISettings().AnimationsEnabled)
	const fine = mouse === true || pen
	const coarse = touch === true
	const pointer = fine ? 'fine' : coarse ? 'coarse' : complete ? 'none' : null
	return {
		width: Screen.mainScreen.widthDIPs,
		height: Screen.mainScreen.heightDIPs,
		pointer,
		anyFine: fine ? true : complete ? false : null,
		anyCoarse: coarse ? true : complete ? false : null,
		anyNone: fine || coarse ? false : complete ? true : null,
		hover: mouse === true ? true : pen ? penHover : coarse || pointer === 'none' ? false : null,
		anyHover: mouse === true || penHover === true ? true : complete ? penHover : null,
		reducedMotion: animations === null ? null : !animations,
	}
}

function featureMatches(name: string, value: string, traits: WindowsMediaTraits): KnownBoolean {
	const dimension = /^(?:(min|max)-)?(width|height)$/.exec(name)
	if (dimension) {
		const size = dimension[2] === 'width' ? traits.width : traits.height
		if (!Number.isFinite(size) || size < 0) {
			return null
		}

		if (!value && !dimension[1]) {
			return size > 0
		}

		if (!/^(?:\d+(?:\.\d*)?|\.\d+)px$/.test(value)) {
			return null
		}

		const bound = Number.parseFloat(value)
		if (dimension[1] === 'min') {
			return size >= bound
		}

		if (dimension[1] === 'max') {
			return size <= bound
		}

		return size === bound
	}
	if (name === 'orientation') {
		if (
			!Number.isFinite(traits.width) ||
			!Number.isFinite(traits.height) ||
			traits.width < 0 ||
			traits.height < 0
		) {
			return null
		}

		if (value === 'portrait') {
			return traits.height >= traits.width
		}

		if (value === 'landscape') {
			return traits.width > traits.height
		}

		return null
	}
	if (name === 'pointer') {
		if (traits.pointer === null) {
			return null
		}

		if (!value) {
			return traits.pointer !== 'none'
		}

		return ['none', 'fine', 'coarse'].includes(value) ? value === traits.pointer : null
	}
	if (name === 'any-pointer') {
		switch (value) {
			case 'fine':
				return traits.anyFine
			case 'coarse':
				return traits.anyCoarse
			case 'none':
				return traits.anyNone
			case '':
				return traits.anyNone === null ? null : !traits.anyNone
			default:
				return null
		}
	}
	if (name === 'prefers-reduced-motion') {
		if (value === 'reduce' || value === '') {
			return traits.reducedMotion
		}

		return value === 'no-preference' && traits.reducedMotion !== null ? !traits.reducedMotion : null
	}
	if (name === 'hover' || name === 'any-hover') {
		const hover = name === 'hover' ? traits.hover : traits.anyHover
		if (value === 'hover' || value === '') {
			return hover
		}

		return value === 'none' && hover !== null ? !hover : null
	}
	return null
}

function termMatches(term: string, traits: WindowsMediaTraits): KnownBoolean {
	const match = /^(not\s+)?\(\s*([a-z-]+)\s*(?::\s*([^()]+))?\s*\)$/i.exec(term.trim())
	if (!match) {
		return null
	}
	const result = featureMatches(
		match[2].toLowerCase(),
		match[3]?.trim().toLowerCase() ?? '',
		traits,
	)
	if (result === null) {
		return null
	}
	return match[1] ? !result : result
}

/** @internal Existing native feature grammar; and binds before or/comma. */
export function matchesWindowsMediaQuery(query: string, traits: WindowsMediaTraits): boolean {
	return query
		.split(/,|\s+or\s+/i)
		.some((branch) =>
			branch.split(/\s+and\s+/i).every((term) => termMatches(term, traits) === true),
		)
}

/** @internal Listen for primary-window resize/lifecycle and initial root layout. */
export function observeWindowsMediaTraits(changed: () => void): () => void {
	let active = true
	let root: View | undefined
	const rootEvents = ['loaded', 'layoutChanged']
	const appEvents = [
		...new Set([
			Application.orientationChangedEvent,
			Application.launchEvent,
			Application.resumeEvent,
		]),
	]
	const refresh = () => {
		if (!active) {
			return
		}
		bindRoot()
		changed()
	}
	const bindRoot = () => {
		const next = Application.getRootView() ?? undefined
		if (root === next) {
			return
		}
		for (const event of rootEvents) {
			root?.off(event, refresh)
		}
		root = next
		for (const event of rootEvents) {
			root?.on(event, refresh)
		}
	}
	bindRoot()
	for (const event of appEvents) {
		Application.on(event, refresh)
	}
	return () => {
		if (!active) {
			return
		}
		active = false
		for (const event of appEvents) {
			Application.off(event, refresh)
		}
		for (const event of rootEvents) {
			root?.off(event, refresh)
		}
		root = undefined
	}
}
