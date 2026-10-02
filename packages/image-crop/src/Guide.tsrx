/** @jsxImportSource @nativescript-community/octane */
import { View } from '@octane-xplat/ui'
import type { ViewProps } from '@octane-xplat/ui'
export function Guide(props: ViewProps) @{
	<View {...props} ios={{ isUserInteractionEnabled: false }} android={{ isUserInteractionEnabled: false }} />
}
