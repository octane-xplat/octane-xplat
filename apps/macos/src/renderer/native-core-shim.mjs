// The shared pan leaf imports Utils eagerly, but this spike doesn't implement
// NativeScript gestures. Fail explicitly if pan velocity is ever requested.
export const Utils = {
	layout: {
		getDisplayDensity() {
			throw new Error('NativeScript display density is unavailable in the AppKit spike')
		},
	},
}
