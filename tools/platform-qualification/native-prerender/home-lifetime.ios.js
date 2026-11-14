import { Utils } from '@nativescript/core'
import { GestureTypes } from '@nativescript/core/ui/gestures'
import { writeProbeDiagnostic } from './write-native-diagnostic.ios.js'

// Optional destructive qualification: retire fixture references after the native
// identity checks, then unmount the adopted Home. The owning Page/viewport stay.
export function qualifyHomeLifetime({
  root,
  host,
  nativeHost,
  wrappers,
  nativeViews,
  oldNodes,
  oldParents,
  claims,
}) {
  const file = (name) => NSHomeDirectory() + '/Documents/' + name
  if (!NSFileManager.defaultManager.fileExistsAtPath(file('home-lifetime'))) return
  const deadline = Date.now() + 10000
  const check = (value, message) => {
    if (!value) throw new Error('Home lifetime: ' + message)
  }
  const failed = (error) => writeProbeDiagnostic('entry-error.txt', String(error.stack ?? error))
  function release() {
    try {
      if (!NSFileManager.defaultManager.fileExistsAtPath(file('native-handover.json'))) {
        check(Date.now() < deadline, 'native bootstrap did not release its references')
        setTimeout(release, 10)
        return
      }
      Promise.resolve(root.unmount())
        .then(() => {
          check(
            host.getChildrenCount() === 0 && nativeHost.subviews.count === 0,
            'root still mounted',
          )
          check(claims.pendingCount === 0, 'claims remain')
          check(
            wrappers.every((view) => !view.isLoaded),
            'wrappers still loaded',
          )
          check(
            wrappers
              .filter((view) => view.id === 'home-complete' || view.id === 'home-reset')
              .every((view) => (view.getGestureObservers(GestureTypes.tap)?.length ?? 0) === 0),
            'Button observers remain',
          )
          nativeViews.length = 0
          wrappers.length = 0
          oldNodes.length = 0
          oldParents.length = 0
          globalThis.__sharedHomeAdoption = null
          let gcPasses = 0
          function collect() {
            try {
              Utils.GC()
              gcPasses++
              writeProbeDiagnostic(
                'lifetime-js.json',
                JSON.stringify({
                  passed: gcPasses === 8,
                  gcPasses,
                  hostChildren: host.getChildrenCount(),
                  nativeChildren: nativeHost.subviews.count,
                  pendingClaims: claims.pendingCount,
                  buttonObserversDetached: true,
                }),
              )
              if (gcPasses < 8) setTimeout(collect, 50)
            } catch (error) {
              failed(error)
            }
          }
          setTimeout(collect, 0)
        })
        .catch(failed)
    } catch (error) {
      failed(error)
    }
  }
  setTimeout(release, 0)
}
