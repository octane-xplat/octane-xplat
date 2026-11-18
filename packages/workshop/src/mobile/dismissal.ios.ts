import {
  UIKeyCommand,
  UIKeyModifierFlags,
  UIMenuElementAttributes,
  UIViewController,
} from '@octane-xplat/platform/ios'

import type { DismissalHost, ShellDismissal } from './dismissal.mobile'

export type { DismissalHost, ShellDismissal } from './dismissal.mobile'

// iOS hardware Escape: a disabled-by-default key command on the page view
// controller resolves through the responder chain to the page's supported
// escape hook, so story views nearer the first responder and presented
// story modals keep priority. Enabling it only while a shell dismissal is
// available leaves the key (and marked-text composition) with the story.
// Hosts without UIViewController.addKeyCommand (iOS 15) keep the toolbar
// and accessibility-escape paths only.
export function installDismissal(host: DismissalHost): ShellDismissal {
  const { page, controller, dismissAllowed, tryDismiss } = host
  const vc = (page as any).ios as UIViewController | undefined

  if (!vc?.respondsToSelector?.('addKeyCommand:')) {
    return { sync() {}, release() {} }
  }

  const command = UIKeyCommand.keyCommandWithInputModifierFlagsAction(
    UIKeyInputEscape,
    0 as UIKeyModifierFlags,
    'accessibilityPerformEscape',
  )

  const previous = page.onAccessibilityPerformEscape

  // The VoiceOver escape gesture and the key command reach the same
  // hook; both apply shell dismissal before any earlier handler.
  page.onAccessibilityPerformEscape = () => {
    if (dismissAllowed() && tryDismiss()) {
      return true
    }

    return previous?.() ?? false
  }

  vc.addKeyCommand(command)
  // UIMenuElementAttributes.Disabled is an ambient const enum, which this
  // configuration reads only in type position.
  const sync = () => {
    command.attributes =
      controller.panel || controller.stageOnly
        ? (0 as UIMenuElementAttributes)
        : (1 as UIMenuElementAttributes)
  }

  sync()
  return {
    sync,
    release() {
      page.onAccessibilityPerformEscape = previous
      vc.removeKeyCommand(command)
    },
  }
}
