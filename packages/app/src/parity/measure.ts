import { Application, RootLayout, Utils, getRootLayout } from '@nativescript/core'
import { getStack } from '@octane-xplat/ui/routing'
import { STYLE_FACETS } from './style-facets'

// Measured-dump seam (native leaf) — same JSON shape as measure.web.ts.
// Boxes are stage-of-cell relative dips: getLocationOnScreen reports
// screen coordinates, so rel = child.loc − cell's .parity-box loc.
const round = (n: number) => Math.round(n * 100) / 100

function resolvedFontOf(view: any) {
	const nativeView =
		view?.nativeTextViewProtected ??
		view?.nativeViewProtected?.titleLabel ??
		view?.nativeViewProtected

	if (Application.android) {
		const typeface = nativeView?.getTypeface?.() ?? nativeView?.getPaint?.()?.getTypeface?.()
		if (!typeface) {
			return undefined
		}

		const paint = nativeView?.getPaint?.()
		const metrics = paint?.getFontMetrics?.()
		const lineHeight = metrics
			? Utils.layout.toDeviceIndependentPixels(Number(metrics.descent) - Number(metrics.ascent))
			: undefined

		const layout = nativeView?.getLayout?.()
		const dip = (value: unknown) => {
			const pixels = Number(value)
			return Number.isFinite(pixels)
				? round(Utils.layout.toDeviceIndependentPixels(pixels))
				: undefined
		}

		const layoutLineCount = Number(layout?.getLineCount?.())
		const layoutLines =
			Number.isFinite(layoutLineCount) && layoutLineCount > 0
				? Array.from({ length: Math.min(layoutLineCount, 4) }, (_, index) => ({
						top: dip(layout.getLineTop?.(index)),
						bottom: dip(layout.getLineBottom?.(index)),
					}))
				: undefined

		return {
			family: typeface.getFamilyName?.() ? String(typeface.getFamilyName()) : undefined,
			weight: typeface.getWeight?.() === undefined ? undefined : Number(typeface.getWeight()),
			size: dip(paint?.getTextSize?.()),
			lineHeight: lineHeight === undefined ? undefined : round(lineHeight),
			lineSpacingExtra: dip(nativeView?.getLineSpacingExtra?.()),
			lineSpacingMultiplier: nativeView?.getLineSpacingMultiplier?.(),
			layoutLineHeight: dip(nativeView?.getLineHeight?.()),
			actualLayout: layout
				? {
						lineCount: Number.isFinite(layoutLineCount) ? layoutLineCount : undefined,
						height: dip(layout.getHeight?.()),
						lines: layoutLines,
						measuredHeight: dip(nativeView?.getMeasuredHeight?.()),
						viewHeight: dip(nativeView?.getHeight?.()),
					}
				: undefined,
		}
	}

	if (!Application.ios) {
		// Windows leaf: read the XAML TextBlock/Control's resolved font
		// (FontFamily.Source, FontSize, FontWeight.Weight, LineHeight) plus
		// Foreground color. Guarded — non-text controls have no font surface.
		try {
			if (!nativeView) {
				return undefined
			}

			const family = nativeView.FontFamily?.Source
			const size = Number(nativeView.FontSize)
			const weight = Number(nativeView.FontWeight?.Weight)
			const lineHeight = Number(nativeView.LineHeight)
			const color = nativeView.Foreground?.Color
			const hex =
				color && typeof color.A === 'number'
					? '#' +
						(((color.A << 24) | (color.R << 16) | (color.G << 8) | color.B) >>> 0)
							.toString(16)
							.padStart(8, '0')
					: undefined

			if (family === undefined && !Number.isFinite(size)) {
				return undefined
			}

			return {
				family: family ? String(family) : undefined,
				size: Number.isFinite(size) ? round(size) : undefined,
				weight: Number.isFinite(weight) ? weight : undefined,
				lineHeight: Number.isFinite(lineHeight) && lineHeight > 0 ? round(lineHeight) : undefined,
				color: hex,
			}
		} catch {
			return undefined
		}
	}

	const font = nativeView?.font ?? nativeView?.searchTextField?.font
	if (!font) {
		return undefined
	}

	const traitsKey = (globalThis as any).UIFontDescriptorTraitsAttribute ?? 'NSCTFontTraitsAttribute'
	const weightKey = (globalThis as any).UIFontWeightTrait ?? 'NSCTFontWeightTrait'
	const descriptorWeight = font.fontDescriptor?.objectForKey?.(traitsKey)?.objectForKey?.(weightKey)

	return {
		family: font.familyName ? String(font.familyName) : undefined,
		face: font.fontName ? String(font.fontName) : undefined,
		size: Number.isFinite(Number(font.pointSize)) ? round(Number(font.pointSize)) : undefined,
		lineHeight: Number.isFinite(Number(font.lineHeight))
			? round(Number(font.lineHeight))
			: undefined,
		weight: Number.isFinite(Number(descriptorWeight)) ? round(Number(descriptorWeight)) : undefined,
	}
}

function rootLayoutFor(view: any): RootLayout | undefined {
	for (let parent = view?.parent; parent; parent = parent.parent) {
		if (parent instanceof RootLayout) {
			return parent
		}
	}

	return getRootLayout()
}

// Windows style facets arrive as Length ({value, unit}) / Color ({hex})
// objects — serialize them so they compare with web the way scalar values
// do. Other platforms keep the plain String(v) path byte-identical.
function facetScalar(v: any, windows: boolean): string {
	if (windows && typeof v === 'object' && v !== null) {
		if (typeof v.value === 'number' && (v.unit === 'dip' || v.unit === 'px')) {
			return String(
				round(v.unit === 'px' ? Utils.layout.toDeviceIndependentPixels(v.value) : v.value),
			)
		}

		if (typeof v.hex === 'string') {
			return v.hex
		}
	}

	return String(v)
}

function styleOf(view: any, windows: boolean): Record<string, string> {
	const out: Record<string, string> = {}
	const s = view?.style ?? {}
	for (const f of STYLE_FACETS) {
		let v = s[f]
		if (v === undefined || v === null) {
			v = view?.[f]
		}

		// Windows keeps a `padding` shorthand in the style bag while the
		// per-side keys stay 0 — fall back to the effective (computed) inset.
		if (
			windows &&
			(v === 0 || v === '0' || v === undefined || v === null) &&
			f.startsWith('padding')
		) {
			const edge = f.slice('padding'.length)
			const eff = view?.[`effectivePadding${edge}`]
			if (eff !== undefined && eff !== null && eff !== 0) {
				v = eff
			}
		}

		if (v !== undefined && v !== null && v !== '') {
			out[f] = facetScalar(v, windows)
		}
	}

	return out
}

function contentBoxOf(
	view: any,
	loc: { x: number; y: number },
	size: { width: number; height: number },
	boxLoc: { x: number; y: number },
) {
	const inset = (edge: 'Left' | 'Top' | 'Right' | 'Bottom') => {
		const px =
			Number(view?.[`effectivePadding${edge}`] ?? 0) +
			Number(view?.[`effectiveBorder${edge}Width`] ?? 0)

		return Utils.layout.toDeviceIndependentPixels(px)
	}

	const left = inset('Left')
	const top = inset('Top')
	const right = inset('Right')
	const bottom = inset('Bottom')

	return {
		x: round(loc.x - boxLoc.x + left),
		y: round(loc.y - boxLoc.y + top),
		w: round(Math.max(0, size.width - left - right)),
		h: round(Math.max(0, size.height - top - bottom)),
	}
}

function nodeFor(view: any, boxView: any, boxLoc: { x: number; y: number }, windows: boolean) {
	const loc = view.getLocationOnScreen?.()
	const size = view.getActualSize?.()
	const classes: string[] = view?.cssClasses ? [...view.cssClasses] : []
	const textControl = hasClass(view, 'vx-input') || hasClass(view, 'vx-textarea')
	const placeholder = textControl && view?.hint ? String(view.hint) : undefined
	const placeholderColor = textControl ? view?.style?.placeholderColor : undefined
	const resolvedFont = resolvedFontOf(view)
	return {
		tag: String(view?.typeName ?? view?.constructor?.name ?? 'view').toLowerCase(),
		id: view?.id || undefined,
		classes,
		box:
			loc && size
				? {
						x: round(loc.x - boxLoc.x),
						y: round(loc.y - boxLoc.y),
						w: round(size.width),
						h: round(size.height),
					}
				: null,
		style: styleOf(view, windows),
		text: typeof view?.text === 'string' && view.text ? view.text : undefined,
		resolvedFont,
		contentBox: textControl && loc && size ? contentBoxOf(view, loc, size, boxLoc) : undefined,
		placeholder,
		placeholderStyle:
			placeholder && placeholderColor
				? {
						color: String(placeholderColor),
						opacity: String(round(Number(placeholderColor.a ?? 255) / 255)),
					}
				: undefined,
	}
}

function childrenOf(view: any, out: any[] = [], visited = new Set<any>()): any[] {
	const visit = (child: any) => {
		if (!child || visited.has(child)) {
			return
		}

		visited.add(child)
		out.push(child)
		childrenOf(child, out, visited)
	}

	view?.eachChildView?.((child: any) => {
		visit(child)
		return true
	})

	// ui-pager exposes Android's adapter-backed page through getChildView(),
	// but it does not enumerate that page from eachChildView().
	if (hasClass(view, 'vx-pager')) {
		const index =
			Number.isInteger(view.selectedIndex) && view.selectedIndex >= 0 ? view.selectedIndex : 0

		visit(view.getChildView?.(index))
	}

	return out
}

function hasClass(view: any, cls: string) {
	return view?.cssClasses?.has?.(cls) === true
}

export function measureTree(stageView: any, target: string) {
	const cells: Record<string, any[]> = {}
	const rootNodes = childrenOf(rootLayoutFor(stageView))
	for (const v of childrenOf(stageView)) {
		if (!hasClass(v, 'parity-cell')) {
			continue
		}

		const name = String(v.id ?? '').replace(/^cell-/, '')
		const box = childrenOf(v).find((c) => hasClass(c, 'parity-box')) ?? v
		const boxLoc = box.getLocationOnScreen?.()
		if (!boxLoc) {
			continue
		}

		const marker = `parity-portal--${name}`
		const portalRoot = rootNodes.find((c) => hasClass(c, marker))
		const portalNodes = portalRoot ? [portalRoot, ...childrenOf(portalRoot)] : []
		cells[name] = [box, ...childrenOf(box), ...portalNodes].map((c) =>
			nodeFor(c, box, boxLoc, target === 'windows'),
		)
	}

	return { target, cells }
}

/** Same seam as the web leaf — the sweep calls __xplatParity() once the
 *  parity route is pushed on the root stack. Each platform leaf supplies
 *  the host view containing #parity-stage (ios/android: the current
 *  stack page; windows: the app root). */
export function installParityDumpFor(target: string, hostOf: () => any) {
	;(globalThis as any).__xplatParity = () => {
		const host = hostOf()
		const stage = host?.getViewById?.('parity-stage')
		return stage ? measureTree(stage, target) : null
	}
}

// Measured-dump seam — the nativescript default leaf serves ios/android
// and windows (no measure.windows.ts sibling: the windows harness app
// mounts ParityStage without a router, so its stage is found from the app
// root view instead of the root stack). Same JSON shape as measure.web.ts.
export function installParityDump() {
	const windows = Boolean(Application.windows) || Boolean((globalThis as any).__WINDOWS__)
	const target = Application.android ? 'android' : windows ? 'windows' : 'ios'
	installParityDumpFor(target, () => {
		if (windows) {
			return (Application.getRootView?.() ?? getRootLayout()) as any
		}

		const page = getStack('root')?.currentPage as any
		return page
	})
}
