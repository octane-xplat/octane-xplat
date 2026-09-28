import { isAndroid, isIOS } from '@nativescript/core'
import type { NativeModifier } from './props'
import { applyNativeModifiers } from './apply-native-modifiers.native'

/** Apply the matching native escape-hatch bag after the primitive's props. */
export function applyNativeProps(
	el: any,
	props: {
		ios?: Record<string, any>
		android?: Record<string, any>
		modifiers?: readonly NativeModifier[]
	},
): void {
	if (!el) {
		return
	}

	const bag = isIOS ? props.ios : isAndroid ? props.android : undefined
	if (bag) {
		Object.assign(el, bag)
	}
	applyNativeModifiers(el, props.modifiers)
}
