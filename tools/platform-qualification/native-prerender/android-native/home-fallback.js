import { Application } from '@nativescript/core'
import { View } from '@octane-xplat/nativescript-mason-core/view'
import { bindNativeView } from '@octane-xplat/nativescript-mason-core/adoption'
import { createNativeScriptRoot } from '@octane-xplat/nativescript-octane'
import { Home } from '../Home.tsrx'
import { prepareHomeApplication, acceptHomeApplication } from './home-application.js'
import resolved from 'xplat-prerender:artifact'
import sheets from 'xplat-prerender:styles'

/** Ordinary renderer path: no native claim factories or adopted view handles. */
export function renderFallbackHome(activity, seed = resolved.seed, existingWindow) {
  if (!Application.android.nativeApp) Application.android.init(activity.getApplication())
  const window = existingWindow ?? prepareHomeApplication(activity)
  const host = new View()
  bindNativeView(
    host,
    new org.octanexplat.prerenderandroid.HomeViewport(
      activity,
      org.nativescript.mason.masonkit.Mason.Companion.getShared(),
    ),
  )
  host.width = '100%'
  host.height = '100%'
  host.style.display = 'flex'
  host.style.flexDirection = 'column'
  const scheme = Application.systemAppearance() === 'dark' ? 'dark' : 'light'
  host.className = 'ns-root ' + (scheme === 'dark' ? 'ns-dark' : 'xds-light')
  host.css = sheets.map((sheet) => sheet.css).join('\n')
  if (!XPLAT_PRERENDER_HOME_STARTUP) {
    host._setupAsRootView(activity)
    host.callLoaded()
  }
  const root = createNativeScriptRoot(host)
  const prepared = root.prepare(Home, seed)
  if (prepared.status !== 'prepared') throw new Error('Ordinary fallback Home suspended')
  if (XPLAT_PRERENDER_HOME_STARTUP) acceptHomeApplication(activity, host, window)
  prepared.commit()
  if (!XPLAT_PRERENDER_HOME_STARTUP) acceptHomeApplication(activity, host, window)
  activity.recordHomeProof(
    JSON.stringify({
      phase: 'ordinary-fallback',
      adoptionFactoryInstalled: false,
      liveTheme: scheme,
    }),
  )
  if (XPLAT_PRERENDER_HOME_STARTUP) activity.acceptStartupRoot(host.nativeViewProtected, 0)
  else activity.acceptFallbackRoot(host.nativeViewProtected)
  return { root, host }
}
