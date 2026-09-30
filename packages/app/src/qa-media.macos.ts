// macOS twin — the share leaf resolves on the AppKit host (the host presents
// NSSharingServicePicker itself). The remaining media leaves carry only
// web/native export conditions, so their triggers stay unsupported.
import { share } from '@octane-xplat/share'

export async function runQaTrigger(key: string): Promise<string> {
	if (key === 'share') {
		try {
			return 'result: ' + (await share.text('octane-xplat human QA'))
		} catch (e) {
			return 'error: ' + (e instanceof Error ? e.message : String(e))
		}
	}

	return 'unsupported on this target';
}

export function releaseQaTrigger(_key: string): void {}
