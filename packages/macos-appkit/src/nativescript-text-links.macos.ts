import type { View } from '@nativescript/core'
import {
  interop,
  NSAccessibilityCustomAction,
  NSClickGestureRecognizer,
  NSObject,
  NSTextField,
} from '@octane-xplat/platform/macos'
import type { TextLinkRun } from './formatted-text'
import { configureGesture, registerGestureClass } from './gestures'
import { shouldReceivePrimaryClick } from './primary-click'
import { textLinkCharacterIndex } from './text-link-hit-test'

interface ActionSlot {
  readonly action: NSAccessibilityCustomAction
  activate: (() => boolean) | null
}

interface LinkOwner {
  readonly view: View
  readonly native: NSTextField
  readonly recognizer: NSClickGestureRecognizer
  readonly actions: Map<string, ActionSlot>
  runs: readonly TextLinkRun[]
}

const owners = new WeakMap<View, LinkOwner>()
const byRecognizer = new WeakMap<NSClickGestureRecognizer, LinkOwner>()
const byAction = new WeakMap<NSAccessibilityCustomAction, ActionSlot>()

function canActivate(owner: LinkOwner) {
  return (
    owners.get(owner.view) === owner &&
    owner.view.nativeViewProtected === owner.native &&
    owner.view.isEnabled &&
    owner.view.isUserInteractionEnabled &&
    owner.native.window != null
  )
}

class TextLinkTarget extends NSObject {
  static ObjCExposedMethods = {
    'activateRun:': { params: [NSClickGestureRecognizer], returns: interop.types.void },
    'activateAccessibilityRun:': {
      params: [NSAccessibilityCustomAction],
      returns: interop.types.bool,
    },
  }

  static {
    registerGestureClass(this)
  }

  ['activateRun:'](recognizer: NSClickGestureRecognizer) {
    const owner = byRecognizer.get(recognizer)
    if (!owner || !canActivate(owner)) {
      return
    }
    const position = recognizer.locationInView(owner.native)
    const index = textLinkCharacterIndex(owner.native, position)
    if (index !== null) {
      owner.runs
        .find((run) => index >= run.location && index < run.location + run.length)
        ?.handler()
    }
  }

  ['activateAccessibilityRun:'](action: NSAccessibilityCustomAction) {
    return byAction.get(action)?.activate?.() ?? false
  }
}

const target = TextLinkTarget.new()

export function releaseNativeScriptTextLinks(view: View) {
  const owner = owners.get(view)
  if (!owner) {
    return
  }
  owners.delete(view)
  byRecognizer.delete(owner.recognizer)
  owner.recognizer.enabled = false
  owner.native.removeGestureRecognizer(owner.recognizer)
  owner.native.accessibilityCustomActions = []
  for (const slot of owner.actions.values()) {
    slot.activate = null
  }
}

export function syncNativeScriptTextLinks(view: View, native: NSTextField, runs: TextLinkRun[]) {
  if (runs.length === 0) {
    releaseNativeScriptTextLinks(view)
    return
  }
  let owner = owners.get(view)
  if (owner && owner.native !== native) {
    releaseNativeScriptTextLinks(view)
    owner = undefined
  }
  if (!owner) {
    const recognizer = NSClickGestureRecognizer.alloc().initWithTargetAction(target, 'activateRun:')
    configureGesture(recognizer, (event) => shouldReceivePrimaryClick(native, event, () => false))
    native.addGestureRecognizer(recognizer)
    owner = { view, native, recognizer, actions: new Map(), runs }
    owners.set(view, owner)
    byRecognizer.set(recognizer, owner)
  }
  owner.runs = runs
  const current = owner
  const enabled = view.isEnabled && view.isUserInteractionEnabled
  const text = String(native.attributedStringValue.string)
  for (const slot of current.actions.values()) {
    slot.activate = null
  }
  current.recognizer.enabled = enabled
  native.accessibilityCustomActions = enabled
    ? runs.map((run, index) => {
        const name = 'Open link ' + text.substring(run.location, run.location + run.length)
        const key = index + ':' + name
        let slot = current.actions.get(key)
        if (!slot) {
          const actionSlot: ActionSlot = {
            action: NSAccessibilityCustomAction.alloc().initWithNameTargetSelector(
              name,
              target,
              'activateAccessibilityRun:',
            ),
            activate: null,
          }
          slot = actionSlot
          current.actions.set(key, slot)
          byAction.set(slot.action, slot)
        }
        slot.activate = () => {
          if (!canActivate(current)) {
            return false
          }
          run.handler()
          return true
        }
        return slot.action
      })
    : []
}
