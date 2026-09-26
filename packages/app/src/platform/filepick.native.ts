// files.pick() picker-UI probe — opened on a delay so a driver session
// (idb/simctl or a human) can tap a document after the sweep settles.
// The pick is seeded with files.writeText so 'harness.txt' exists under
// On My iPhone > native in the document browser.
import { Application, knownFolders } from '@nativescript/core'
import { files } from '@octane-xplat/platform'

// iOS only — the document browser is the surface under test; Android's
// SAF intent is covered separately. Rooting the picker at Documents via
// startingFolder leaves one tappable row for unattended drives.
if (Application.ios) {
	setTimeout(async () => {
		try {
			await files.writeText('harness.txt', 'octane-xplat file service')
			console.log('[probe] files.pick presenting — pick harness.txt')
			const f = await files.pick('*/*', { startingFolder: knownFolders.documents().path })
			console.log(
				'[assert] files.pick returns ref: ' + (f ? 'OK (' + f.name + ')' : 'INFO (cancelled)'),
			)

			if (f) {

				const text = await files.readText(f)
				console.log(
					'[assert] files.readText picked file: ' +
						(text === 'octane-xplat file service' ? 'OK' : 'FAIL ' + JSON.stringify(text.slice(0, 60))),
				)

				files.release(f)

			}
		} catch (e) {
			console.log('[assert] files.pick: FAIL ' + (e as Error).message)
		}
	}, 90000)
}
