// Android share.file leaf — FileProvider-backed ACTION_SEND. The package
// declares its own provider (`${applicationId}.xplatshare`, see
// platforms/android) covering app files, cache, and external storage roots,
// so sandbox paths share in place without a copy step. `content://` URIs
// are already grantable and pass straight through. Native globals resolve
// inside functions so the module stays import-safe in iOS bundles.
//
// ACTION_SEND reports no outcome — this resolves 'shared' once the chooser
// launches; a dismissal looks identical to a completed share.

import { Application, Utils } from '@nativescript/core'
import { fileProviderAuthority, mimeTypeFromName, normalizeFilePath } from './share-paths'
import type { ShareFileOptions, ShareResult } from './types'

declare const android: any
declare const androidx: any
declare const java: any

export async function shareFile(path: string, options?: ShareFileOptions): Promise<ShareResult> {
	const input = normalizeFilePath(path)
	const context = Utils.android.getApplicationContext()
	const activity = Application.android?.foregroundActivity ?? Application.android?.startActivity
	if (!context || !activity) {
		return 'unavailable'
	}

	let uri: any
	if (input.kind === 'content') {
		uri = android.net.Uri.parse(input.uri)
	} else {
		const file = new java.io.File(input.path)
		if (!file.exists()) {
			return 'unavailable'
		}

		try {
			uri = androidx.core.content.FileProvider.getUriForFile(
				context,
				fileProviderAuthority(context.getPackageName()),
				file,
			)
		} catch (error) {
			// Missing provider meta-data means the manifest merge didn't land;
			// an unmapped path means it sits outside the configured roots.
			// Both are integration errors — reject rather than report
			// 'unavailable' so they can't masquerade as a missing capability.
			throw new Error(
				`share.file: cannot expose '${input.path}' via the ${fileProviderAuthority(
					context.getPackageName(),
				)} FileProvider — ${(error as Error)?.message ?? error}`,
			)
		}
	}

	const mimeType =
		options?.mimeType ??
		mimeTypeFromName(input.kind === 'file' ? input.path : input.uri) ??
		'application/octet-stream'

	const intent = new android.content.Intent(android.content.Intent.ACTION_SEND)
	intent.setType(mimeType)
	intent.putExtra(android.content.Intent.EXTRA_STREAM, uri)
	intent.addFlags(android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION)

	// The flag on the chooser alone doesn't propagate the grant on all OEM
	// builds — grant read explicitly to every resolved target.
	const resolved = context.getPackageManager().queryIntentActivities(intent, 0)
	for (let i = 0; i < resolved.size(); i++) {
		context.grantUriPermission(
			resolved.get(i).activityInfo.packageName,
			uri,
			android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION,
		)
	}

	activity.startActivity(android.content.Intent.createChooser(intent, options?.subject ?? null))
	return 'shared'
}
