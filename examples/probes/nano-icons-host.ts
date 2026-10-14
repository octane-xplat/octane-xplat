/** NativeScript-side inspection: labels stacked inside the icon container. */
function rgb(color: any): string | undefined {
	if (!color) {return undefined}
	if (typeof color.r === 'number') {return `rgb(${color.r}, ${color.g}, ${color.b})`}
	return String(color.hex ?? color)
}

export function glyphSnapshot(view: any) {
	const layers = []
	const count = view?.getChildrenCount?.() ?? 0
	for (let i = 0; i < count; i++) {
		const child = view.getChildAt(i)
		if (child?.text !== undefined) {
			layers.push({
				codePoint: String(child.text).codePointAt(0),
				fontFamily: child.style?.fontFamily,
				color: rgb(child.style?.color),
			})
		}
	}

	return {
		layers,
		label: view?.accessibilityLabel,
		width: view?.getActualSize?.().width,
		height: view?.getActualSize?.().height,
	}
}

// {N}-side font check: iOS resolves the internal family name once the font
// is registered; Android resolves by file name inside app/fonts.
import { File, isAndroid, isIOS, knownFolders, path } from '@nativescript/core'

declare const UIFont: { fontWithNameSize?(name: string, size: number): unknown }

export async function fontReady(family: string) {
	if (isIOS) {
		return typeof UIFont !== 'undefined' && UIFont.fontWithNameSize?.(family, 12)
			? 'ready'
			: 'missing'
	}

	if (isAndroid) {
		const exists = File.exists(path.join(knownFolders.currentApp().path, 'fonts', `${family}.ttf`))
		return exists ? 'ready' : 'missing'
	}

	return 'unavailable'
}
