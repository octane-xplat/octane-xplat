// Real app entry for the normal-app startup proof. This is the create
// template's native main.ts with one change: renderWithStartup (the
// @octane-xplat/native-prerender/startup export) replaces
// renderNativeScriptApp so the opt-in startup artifact can be adopted through
// the ordinary Application.run/Page path. Without a packaged artifact or on
// any rejection the same call renders ordinarily.
import { Application, Frame, Page } from '@nativescript/core'
import { renderWithStartup } from '@octane-xplat/native-prerender/startup'
import { prepareFullScreenPage } from '@octane-xplat/ui/nativescript'
import { Screen } from './Screen.tsrx'
import '@octane-xplat/ui/theme/tokens.css'
import './style.css'
import startup from './startup.json'
import sheets from './sheets.json'
import { writeStartupOutcome } from './startup-outcome'

const entry = {
  create: () => {
    const frame = new Frame()
    const page = prepareFullScreenPage(new Page())
    page.actionBarHidden = true
    renderWithStartup(page, Screen, {}, {
      artifact: startup,
      sheets,
      onOutcome: writeStartupOutcome,
    })
    frame.navigate({ create: () => page })
    return frame
  },
}

if (Application.started) {
  Application.resetRootView(entry)
} else {
  Application.run(entry)
}
