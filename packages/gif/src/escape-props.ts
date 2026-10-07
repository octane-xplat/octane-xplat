import { isAndroid, isIOS } from '@nativescript/core'

/** Apply only the active device's escape bag after the shared props — the
 *  same convention @octane-xplat/ui uses, kept local so this leaf does not
 *  depend on ui. */
export function applyEscapeProps(view: any, props: { ios?: any; android?: any }): void {
	if (!view) {
		return
	}

	const bag = isIOS ? props.ios : isAndroid ? props.android : undefined
	if (bag) {
		Object.assign(view, bag)
	}
}
