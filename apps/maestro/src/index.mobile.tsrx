/** @jsxImportSource @octane-xplat/jsx */
import { Application, Page } from '@nativescript/core'
import { renderNativeScriptApp } from '@octane-xplat/nativescript-octane'
import { install as installGestureHandler } from '@nativescript-community/gesturehandler'
import { prepareFullScreenPage } from '@octane-xplat/ui/nativescript'
import LightboxGallery from './LightboxGallery.tsrx'
import MediaPick from './MediaPick.tsrx'
import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import '@octane-xplat/ui/theme/utilities.css'
import './app.css'

installGestureHandler()

// iOS launch arguments surface in NSProcessInfo; '-mediaProbe' swaps the
// gallery for the media cancellation probe. Android keeps the gallery.
const mediaProbe = (() => {
  if (typeof NSProcessInfo === 'undefined') {
    return false
  }

  const args = NSProcessInfo.processInfo.arguments

  for (let i = 0; i < args.count; i += 1) {
    if (String(args.objectAtIndex(i)).includes('mediaProbe')) {
      return true
    }
  }

  return false
})()

Application.run({
  create() {
    const page = prepareFullScreenPage(new Page())

    page.actionBarHidden = true
    renderNativeScriptApp(page, mediaProbe ? MediaPick : LightboxGallery)
    return page
  },
})
