// Port of upstream SandboxShell.tsx — AppShell + SideNav frame for the
// (sandbox) route group. The FULLSCREEN_PATHS bypass mirrors upstream;
// pending pages under those paths render unframed like upstream.

import { AppShell } from '@octane-xplat/ui'
import { useRouterState } from '@octane-xplat/ui/routing'
import { SandboxNav } from './SandboxNav'

const FULLSCREEN_PATHS = [
	'/pages/color-studio',
	'/pages/palette-generator',
	'/pages/mobile-spacing',
	'/pages/mobile-type',
	'/pages/tap-targets',
]

export function SandboxShell(props: { children?: any }) @{
	const pathname = useRouterState().route?.href ?? ''
	const isFullscreen = FULLSCREEN_PATHS.some((p) => pathname.startsWith(p))

	if (isFullscreen) {
		return props.children
	}

	return (
		<AppShell sideNav={<SandboxNav />} contentPadding={0}>
			{props.children}
		</AppShell>
	)
}
