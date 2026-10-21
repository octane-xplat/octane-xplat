// Vitest alias target for @octane-xplat/nativescript-masonkit — a recording fake
// for the universal-driver tests. The real package evaluates platform
// globals (__ANDROID__/__APPLE__) at import and touches native APIs, so it
// can't load under node. The fake records style writes per view: mason
// containers expose `_styleHelper`, and foreign children bind through
// `Style.fromView` — the two surfaces the driver patch actually calls.
// Reads return the last write so style-write assertions reflect state.

function makeRecordingStyle() {
	const writes: Record<string, unknown> = {}
	const target: Record<string, any> = {}
	return new Proxy(target, {
		set(t, key, value) {
			t[key] = value
			writes[key as string] = value
			return true
		},
		get(t, key) {
			if (key === '__writes') {
				return writes
			}
			if (key === 'style_view') {
				return {}
			}
			if (key === 'copyTextStyleTo') {
				return () => {}
			}
			return t[key]
		},
	})
}

export type MasonRecordingStyle = ReturnType<typeof makeRecordingStyle> & {
	__writes: Record<string, unknown>
}

const styleByView = new WeakMap<object, MasonRecordingStyle>()

function styleForView(view: unknown): MasonRecordingStyle | undefined {
	if (typeof view !== 'object' || view === null) {
		return undefined
	}
	let style = styleByView.get(view)
	if (!style) {
		style = makeRecordingStyle() as MasonRecordingStyle
		styleByView.set(view, style)
	}
	return style
}

export function masonStyleOf(view: unknown): MasonRecordingStyle | undefined {
	if (typeof view === 'object' && view !== null) {
		return (view as any)._styleHelper ?? styleByView.get(view)
	}
	return undefined
}

export class View {
	_styleHelper = styleForView(this) ?? (makeRecordingStyle() as MasonRecordingStyle)
	style = this._styleHelper
	parent: unknown = null
	children: any[] = []
	nativeViewProtected = {}
	on(_event: string, _cb: unknown) {}
	off(_event: string, _cb: unknown) {}
	addChild(child: any) {
		this.children.push(child)
		child.parent = this
	}
	insertChild(child: any, index: number) {
		this.children.splice(index, 0, child)
		child.parent = this
	}
	removeChild(child: any) {
		this.children.splice(this.children.indexOf(child), 1)
		child.parent = null
	}
	getChildrenCount() {
		return this.children.length
	}
	eachChildView(fn: (v: any) => boolean) {
		this.children.forEach(fn)
	}
	getChildIndex(child: any) {
		return this.children.indexOf(child)
	}
}

export class Scroll extends View {}
export class Text extends View {}

export const Style = { fromView: styleForView }
export function registerElement() {}
export function registerAlongsideCore() {}
