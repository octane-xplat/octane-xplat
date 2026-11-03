import type { PanEvent, ElementNode } from './model'
import {
  NSButton,
  NSClickGestureRecognizer,
  NSNotification,
  NSObject,
  NSPanGestureRecognizer,
  NSTextField,
  NSTextFieldDelegate,
  NSTextView,
  NSTextViewDelegate,
  interop,
} from '@octane-xplat/platform/macos'
import { configureGesture, swipeDirection, registerGestureClass } from './gestures'
import type { NSControl } from '@octane-xplat/platform/macos'
import { isWritingTextValue, notifyTextValueCommit } from './text-value.ts'
import {
  enforceTextLimit,
  isNormalizingTextLimit,
  recordTextLimitEdit,
  reportTextLimitChange,
} from './text-limit.ts'
import { shouldReceivePrimaryClick } from './primary-click'

import type { createRegistry } from './registry'
import type { createTextElements } from './text-elements'
import type { createCssPseudoState } from './css-pseudo-state'
import type { createInputElements } from './input-elements'

interface Dependencies {
  registry: Pick<ReturnType<typeof createRegistry>, 'cssNodesByView'>
  textElements: Pick<
    ReturnType<typeof createTextElements>,
    'textLinkCharacterIndex' | 'primaryClickBoundary'
  >
  cssPseudoState: Pick<ReturnType<typeof createCssPseudoState>, 'syncPseudoState'>
  inputElements: Pick<
    ReturnType<typeof createInputElements>,
    | 'textNodesByView'
    | 'notifySearchTextChange'
    | 'syncTextViewPlaceholder'
    | 'fitTextView'
    | 'dispatchTextEvent'
  >
}

export function createActions(deps: Dependencies) {
  const actionHandlers = new Map<number, (() => void) | null>()

  const actionIdsByView = new WeakMap<object, number>()

  const panHandlersByView = new WeakMap<object, ((event: PanEvent) => void) | null>()

  let nextActionId = 1

  function invokeAction(actionId: number | undefined) {
    const action = actionId === undefined ? undefined : actionHandlers.get(actionId)
    if (action) {
      action()
    }
  }

  class ButtonActionTarget extends NSObject {
    static ObjCProtocols = [NSTextViewDelegate, NSTextFieldDelegate]

    static ObjCExposedMethods = {
      // NativeScript's NAPI ClassBuilder uses these keys verbatim as selectors.
      // The prototype may use its supported JS spelling; metadata needs colons.
      'buttonPressed:': { params: [NSButton], returns: interop.types.void },
      'viewPressed:': { params: [NSObject], returns: interop.types.void },
      'linkPressed:': { params: [NSObject], returns: interop.types.void },
      'viewPanned:': { params: [NSPanGestureRecognizer], returns: interop.types.void },
      'controlChanged:': { params: [NSObject], returns: interop.types.void },
      'controlTextDidChange:': { params: [NSNotification], returns: interop.types.void },
      'textFieldSubmitted:': { params: [NSObject], returns: interop.types.void },
      'textDidChange:': { params: [NSNotification], returns: interop.types.void },
      'controlTextDidBeginEditing:': { params: [NSNotification], returns: interop.types.void },
      'controlTextDidEndEditing:': { params: [NSNotification], returns: interop.types.void },
      'textDidBeginEditing:': { params: [NSNotification], returns: interop.types.void },
      'textDidEndEditing:': { params: [NSNotification], returns: interop.types.void },
    }

    static {
      registerGestureClass(this)
    }

    buttonPressed(sender: NSButton) {
      invokeAction(sender.tag)
    }

    ['viewPressed:'](sender: NSClickGestureRecognizer) {
      invokeAction(actionIdsByView.get(sender.view))
    }

    ['linkPressed:'](sender: NSClickGestureRecognizer) {
      this.linkPressed(sender)
    }

    // Per-run link activation for folded text: the click's character index
    // selects one entry in the label's textLinks table. Anything outside every
    // run — including plain text between links — is a no-op.
    linkPressed(sender: NSClickGestureRecognizer) {
      const view = sender.view
      const node = view ? deps.registry.cssNodesByView.get(view) : undefined
      const links = node?.textLinks
      if (
        !node ||
        node.type !== 'label' ||
        !links?.length ||
        node.props.disabled === true ||
        node.props.isEnabled === false ||
        node.props.enabled === false ||
        !node.container.root
      ) {
        return
      }

      const index = deps.textElements.textLinkCharacterIndex(view as unknown as NSTextField, {
        x: Number(sender.locationInView(view)?.x ?? NaN),
        y: Number(sender.locationInView(view)?.y ?? NaN),
      })
      const link =
        index == null
          ? undefined
          : links.find((entry) => index >= entry.location && index < entry.location + entry.length)

      if (!link) {
        return
      }

      try {
        node.container.root.eventScope('discrete', link.handler)
      } catch (error) {
        console.error('[macos-event] link handler failed', error)
      }
    }

    controlChanged(sender: NSControl) {
      invokeAction(sender.tag ?? actionIdsByView.get(sender))
      // Toggle state lives on the control itself — resync :checked/:normal.
      const node = deps.registry.cssNodesByView.get(sender)
      if (node) {
        deps.cssPseudoState.syncPseudoState(node)
      }
    }

    // NSControlTextEditingDelegate: fires on every edit while a single-line
    // field is being edited — the per-edit source for onTextChange.
    controlTextDidChange(notification: NSNotification) {
      if (isWritingTextValue(notification.object)) {
        return
      }
      notifyTextValueCommit(notification.object)
      const node = deps.inputElements.textNodesByView.get(notification.object)
      if (node?.type === 'searchbar') {
        deps.inputElements.notifySearchTextChange(node)
      } else {
        invokeAction(node?.actionId ?? actionIdsByView.get(notification.object))
      }
    }

    // Single-line fields keep target/action for submission (Return). The
    // change handler lives on controlTextDidChange, so the action never
    // masquerades as a value-change event.
    textFieldSubmitted(sender: NSObject) {
      const field = sender as any
      const editor = typeof field.currentEditor === 'function' ? field.currentEditor() : null
      const marked = editor?.hasMarkedText
      if (typeof marked === 'function' ? marked.call(editor) : marked) {
        return
      }
      notifyTextValueCommit(sender)
      deps.inputElements.textNodesByView.get(sender)?.submitHandler?.()
    }

    ['viewPanned:'](sender: NSPanGestureRecognizer) {
      this.viewPanned(sender)
    }

    viewPanned(sender: NSPanGestureRecognizer) {
      const handler = panHandlersByView.get(sender.view)
      if (!handler) {
        return
      }

      const translation = sender.translationInView(sender.view)
      const velocity = sender.velocityInView(sender.view)
      const location = sender.locationInView(sender.view)
      const bounds = sender.view.bounds
      const flipped = sender.view.flipped

      const signY = flipped ? 1 : -1
      const nativeState = Number(sender.state)
      const state = nativeState === 1 ? 1 : nativeState === 2 ? 2 : nativeState === 3 ? 3 : 0
      try {
        handler({
          x: Number(location.x) - Number(bounds.origin.x),
          y: flipped
            ? Number(location.y) - Number(bounds.origin.y)
            : Number(bounds.origin.y) + Number(bounds.size.height) - Number(location.y),
          deltaX: Number(translation.x ?? 0),
          deltaY: Number(translation.y ?? 0) * signY,
          velocityX: Number(velocity.x ?? 0),
          velocityY: Number(velocity.y ?? 0) * signY,
          state,
          view: sender.view,
        })
      } catch (error) {
        console.error('[macos-event] pan handler failed', error)
      }
    }

    textDidChange(notification: NSNotification) {
      if (isWritingTextValue(notification.object) || isNormalizingTextLimit(notification.object)) {
        return
      }
      notifyTextValueCommit(notification.object)
      const node = deps.inputElements.textNodesByView.get(notification.object)
      if (node) {
        enforceTextLimit(notification.object as NSTextView, node.props?.maxLength)
      }
      deps.inputElements.syncTextViewPlaceholder(node)
      deps.inputElements.fitTextView(node)
      if (reportTextLimitChange(notification.object as NSTextView)) {
        invokeAction(actionIdsByView.get(notification.object))
      }
    }
    controlTextDidBeginEditing(notification: NSNotification) {
      deps.inputElements.dispatchTextEvent(
        deps.inputElements.textNodesByView.get(notification.object),
        'onFocus',
      )
    }

    controlTextDidEndEditing(notification: NSNotification) {
      notifyTextValueCommit(notification.object)
      deps.inputElements.dispatchTextEvent(
        deps.inputElements.textNodesByView.get(notification.object),
        'onBlur',
      )
    }

    textDidBeginEditing(notification: NSNotification) {
      this.controlTextDidBeginEditing(notification)
    }

    textDidEndEditing(notification: NSNotification) {
      this.controlTextDidEndEditing(notification)
    }

    // NSSearchField's search action also fires for its cancel button. Consume
    // Return in the field-editor delegate so clearing cannot emit submit.
    controlTextViewDoCommandBySelector(control: NSControl, _editor: NSTextView, selector: string) {
      const node = deps.inputElements.textNodesByView.get(control)
      if (node?.type !== 'searchbar' || String(selector) !== 'insertNewline:') {
        return false
      }

      const marked = (_editor as any)?.hasMarkedText
      if (typeof marked === 'function' ? marked.call(_editor) : marked) {
        return false
      }
      node.submitHandler?.()
      return true
    }

    textViewShouldChangeTextInRangeReplacementString(
      view: NSTextView,
      range: { location: number; length: number },
      replacement: string | null,
    ) {
      if (replacement !== null) {
        recordTextLimitEdit(view, range)
      }
      return true
    }

    textViewDoCommandBySelector(view: NSTextView, selector: string) {
      const node = deps.inputElements.textNodesByView.get(view)
      if (
        String(selector) !== 'insertNewline:' ||
        !node ||
        !['done', 'send'].includes(node.props.returnKeyType) ||
        node.props.editable === false ||
        node.props.isEnabled === false
      ) {
        return false
      }

      // Leave marked-text confirmation to AppKit's input context.
      const marked = (view as any).hasMarkedText
      if (typeof marked === 'function' ? marked.call(view) : marked) {
        return false
      }

      deps.inputElements.dispatchTextEvent(node, 'onSubmit')
      return true
    }
  }

  const buttonActionTarget = ButtonActionTarget.new()

  function setAction(node: ElementNode, value: any) {
    const active = typeof value === 'function'
    if (node.actionId === undefined) {
      if (!active) {
        return
      }

      node.actionId = nextActionId++
      actionIdsByView.set(node.view!, node.actionId)
      actionHandlers.set(node.actionId, null)
    }
    if (active && !node.clickGestureRecognizer) {
      node.clickGestureRecognizer = configureGesture(
        NSClickGestureRecognizer.alloc().initWithTargetAction(buttonActionTarget, 'viewPressed:'),
        (event) =>
          shouldReceivePrimaryClick(node.view, event, deps.textElements.primaryClickBoundary(node)),
      )

      node.view!.addGestureRecognizer(node.clickGestureRecognizer)
    }
    if (node.clickGestureRecognizer) {
      node.clickGestureRecognizer.enabled = active && !node.props.disabled
    }

    actionHandlers.set(
      node.actionId,
      typeof value === 'function'
        ? () => {
            try {
              if (!node.props.disabled) {
                node.container.root!.eventScope('discrete', value)
              }
            } catch (error) {
              console.error('[macos-event] press handler failed', error)
            }
          }
        : null,
    )
  }

  function setPanAction(node: ElementNode, _value: any) {
    const enabled =
      !node.props.disabled &&
      (typeof node.props.onPan === 'function' || typeof node.props.onSwipe === 'function')

    if (enabled && !node.panGestureRecognizer) {
      node.panGestureRecognizer = configureGesture(
        NSPanGestureRecognizer.alloc().initWithTargetAction(buttonActionTarget, 'viewPanned:'),
      )

      node.view!.addGestureRecognizer(node.panGestureRecognizer)
    }

    if (node.panGestureRecognizer) {
      node.panGestureRecognizer.enabled = enabled
    }

    panHandlersByView.set(
      node.view!,
      enabled
        ? (event: PanEvent) => {
            if (node.props.disabled) {
              return
            }

            try {
              node.container.root!.eventScope('discrete', () => {
                node.props.onPan?.(event)
                const direction = swipeDirection(event)
                if (direction !== null && !node.props.disabled) {
                  node.props.onSwipe?.({ direction })
                }
              })
            } catch (error) {
              console.error('[macos-event] pan/swipe handler failed', error)
            }
          }
        : null,
    )
  }

  function setControlAction(node: ElementNode, value: any, readValue: () => any) {
    if (node.actionId === undefined) {
      return
    }

    actionHandlers.set(
      node.actionId,
      typeof value === 'function'
        ? () => {
            try {
              node.container.root!.eventScope('discrete', () => value(readValue()))
            } catch (error) {
              console.error('[macos-event] control handler failed', error)
            }
          }
        : null,
    )
  }

  /** Return-key submission for single-line fields, invoked by the field's
   *  target/action — kept distinct from per-edit `onTextChange`. */
  function setTextSubmitAction(node: ElementNode, value: any) {
    node.submitHandler =
      typeof value === 'function'
        ? () => {
            try {
              node.container.root!.eventScope('discrete', value)
            } catch (error) {
              console.error('[macos-event] text submit handler failed', error)
            }
          }
        : null
  }
  return {
    actionHandlers,
    actionIdsByView,
    panHandlersByView,
    get nextActionId() {
      return nextActionId
    },
    set nextActionId(value: typeof nextActionId) {
      nextActionId = value
    },
    invokeAction,
    buttonActionTarget,
    setAction,
    setPanAction,
    setControlAction,
    setTextSubmitAction,
  }
}
