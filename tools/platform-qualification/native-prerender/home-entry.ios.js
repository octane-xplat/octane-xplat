import '@nativescript/core/globals'
import { Application } from '@nativescript/core'
import { writeProbeDiagnostic } from './write-native-diagnostic.ios.js'

// Both paths live in one app bundle. Rejected native input must select ordinary
// rendering without needing the packager to choose a different JS entry.
Promise.resolve()
  .then(async () => {
    const snapshot = JSON.parse(
      String(
        NSString.stringWithContentsOfFileEncodingError(
          NSHomeDirectory() + '/Documents/native-home.json',
          4,
          null,
        ),
      ),
    )
    const theme = Application.systemAppearance() === 'dark' ? 'dark' : 'light'
    if (snapshot.artifactRejected || snapshot.theme !== theme)
      await import('./home-fallback.ios.js')
    else await import('./home-adoption.ios.js')
  })
  .catch((error) => {
    writeProbeDiagnostic('entry-error.txt', String(error.stack ?? error))
  })
