/** @jsxImportSource @octane-xplat/macos-renderer */
import type { GoogleSignInButtonProps } from './types'

/** Explicit placeholder — the AppKit host has no Google sign-in button. */
export function GoogleSignInButton(_props: GoogleSignInButtonProps) @{
	<label className="vx-unsupported">Google Sign-In is unsupported by the AppKit host</label>
}
