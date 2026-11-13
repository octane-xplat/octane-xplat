import { Application } from '@nativescript/core'
import { View } from '@octane-xplat/nativescript-mason-core/view'
import { createNativeScriptRoot } from '@nativescript-community/octane'
import { Home } from '../Home.tsrx'
import { prepareHomeApplication, acceptHomeApplication } from './home-application.js'
import resolved from 'xplat-prerender:artifact'
import sheets from 'xplat-prerender:styles'

/** Ordinary renderer path: no native claim factories or adopted view handles. */
export function renderFallbackHome(activity, seed = resolved.seed, existingWindow) {
  if (!Application.android.nativeApp) Application.android.init(activity.getApplication())
  const window = existingWindow ?? prepareHomeApplication(activity)
  const host = new View()
  host.width = '100%'
  host.height = '100%'
  host.style.display = 'flex'
  host.style.flexDirection = 'column'
  const scheme = Application.systemAppearance() === 'dark' ? 'dark' : 'light'
  host.className = 'ns-root ' + (scheme === 'dark' ? 'ns-dark' : 'xds-light')
  host.css = sheets.map((sheet) => sheet.css).join('\n')
  host._setupAsRootView(activity)
  host.callLoaded()
  const root = createNativeScriptRoot(host)
  const prepared = root.prepare(Home, seed)
  if (prepared.status !== 'prepared') throw new Error('Ordinary fallback Home suspended')
  prepared.commit()
  acceptHomeApplication(activity, host, window)
  activity.recordHomeProof(
    JSON.stringify({
      phase: 'ordinary-fallback',
      adoptionFactoryInstalled: false,
      liveTheme: scheme,
    }),
  )
  activity.acceptFallbackRoot(host.nativeViewProtected)
  return { root, host }
}
