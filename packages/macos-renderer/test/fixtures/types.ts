import { createMacOSRoot, registerFontFamily } from '@octane-xplat/macos-renderer'
import type { MacOSRootOptions } from '@octane-xplat/macos-renderer'
import type { XplatMacOSOptions } from '@octane-xplat/cli/macos/vite'
import type { JSX } from '@octane-xplat/macos-renderer/intrinsics'
import type { jsx } from '@octane-xplat/macos-renderer/jsx-runtime'
import type { jsxs } from '@octane-xplat/macos-renderer/jsx-dev-runtime'

declare const host: Parameters<typeof createMacOSRoot>[0]
declare const descriptor: Parameters<typeof registerFontFamily>[1][number]['descriptor']
const options: MacOSRootOptions = { fontFamily: 'system-ui' }
createMacOSRoot(host, options).unmount()
registerFontFamily('Test', [{ weight: 400, descriptor }])
const preset: XplatMacOSOptions = { root: '.', packaged: true }
const label: JSX.IntrinsicElements['label'] = {
	id: 'label',
	text: 'Hello',
	style: { fontSize: 20 },
}

void preset
void label
void (null as unknown as typeof jsx)
void (null as unknown as typeof jsxs)
// @ts-expect-error family names must be strings
createMacOSRoot(host, { fontFamily: 7 })
// @ts-expect-error face weights must be numbers
registerFontFamily('Test', [{ weight: 'bold', descriptor }])
