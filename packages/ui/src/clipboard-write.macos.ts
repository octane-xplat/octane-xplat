import { clipboard } from '@octane-xplat/platform'

/** Use the platform's AppKit write path so copy helpers share the same
 * unavailable/failed-write result and never require clipboard read access. */
export function copyText(text: string): Promise<boolean> {
	return clipboard.writeText(text)
}
