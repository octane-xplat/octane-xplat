/** @jsxImportSource @octane-xplat/macos-renderer */
import type { PagerProps } from './props'

/** Explicit placeholder until the AppKit host has a paging surface. */
export function Pager(_props: PagerProps) @{
	<label className="vx-unsupported">Pager is unsupported by the AppKit host</label>
}
