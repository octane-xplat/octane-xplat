/** @jsxImportSource @xplat/macos/renderer */
import type { AppleSignInButtonProps } from './types'

/** Explicit placeholder — the AppKit host has no Apple sign-in button. */
export function AppleSignInButton(_props: AppleSignInButtonProps) @{
	<label className="vx-unsupported">Sign in with Apple is unsupported by the AppKit host</label>
}
