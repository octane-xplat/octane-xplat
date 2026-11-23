import { NSPopUpButton, type NSObject } from '@octane-xplat/platform/macos'
import type { ActionStore } from './action-store'

export interface PickerControlActions {
  readonly buttonActionTarget: NSObject
  allocate: ActionStore['allocate']
}

export type PopUpControl = ReturnType<typeof buildPopUpControl>

/** Allocate an AppKit pop-up button and its owned control action. */
export function buildPopUpControl({ buttonActionTarget, allocate }: PickerControlActions) {
  const view = NSPopUpButton.alloc().initWithFramePullsDown(
    { origin: { x: 0, y: 0 }, size: { width: 120, height: 26 } },
    false,
  )
  view.target = buttonActionTarget
  view.action = 'controlChanged:'
  view.translatesAutoresizingMaskIntoConstraints = false

  const action = allocate(view)
  try {
    view.tag = action.id
  } catch (error) {
    action.release()
    throw error
  }

  return { view, action }
}
