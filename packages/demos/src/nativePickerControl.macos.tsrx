/** @jsxImportSource @xplat/macos/renderer */
import { Text } from '@octane-xplat/ui'
import type { NativePickerProps } from '@octane-xplat/native-picker/types'

// @octane-xplat/native-picker ships web/ios/android leaves only; the AppKit
// host has no picker element yet, so the demo renders the seam's notice.
export function NativePicker(props: NativePickerProps) @{
	<Text id={props.id} className="text-sm text-muted">
		{'Native picker is unsupported by the experimental AppKit host.'}
	</Text>;
}
