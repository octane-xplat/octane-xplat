import type { ActionStore, ActionRegistration } from './action-store'
import { FailureCollector } from './failures'
import type { Registry } from './registry'
import type { TextElements } from './text-elements'
import type { CssPseudoState } from './css-pseudo-state'
import type { InputElements } from './input-elements'
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

import type { NSControl, NSGestureRecognizer } from '@octane-xplat/platform/macos'
import { configureGesture, swipeDirection, registerGestureClass } from './gestures'
import { isWritingTextValue, notifyTextValueCommit } from './text-value.ts'
import {
  enforceTextLimit,
  isNormalizingTextLimit,
  recordTextLimitEdit,
  reportTextLimitChange,
} from './text-limit.ts'

import { shouldReceivePrimaryClick } from './primary-click'

interface Dependencies {
  store: ActionStore
  registry: Pick<Registry, 'cssNodesByView'>
  textElements: Pick<TextElements, 'textLinkCharacterIndex' | 'primaryClickBoundary'>
  cssPseudoState: Pick<CssPseudoState, 'syncPseudoState'>
  inputElements: Pick<
    InputElements,
    | 'textNodesByView'
    | 'notifySearchTextChange'
    | 'syncTextViewPlaceholder'
    | 'fitTextView'
    | 'dispatchTextEvent'
  >
  /** Re-push a view's AX properties after a handler lands — element-ness
   *  depends on hasHandler. Optional for test fixtures. */
  syncViewAccessibility?: (view: object) => void
}

export type Actions = ReturnType<typeof createActions>

export function createActions(deps: Dependencies) {
  const nodeActions = new WeakMap<
    ElementNode,
    { action: ActionRegistration; view: object | null }
  >()

  const clickRecognizersByView = new WeakMap<object, NSGestureRecognizer>()
  const panRecognizersByView = new WeakMap<object, NSGestureRecognizer>()
  const panHandlersByView = new WeakMap<object, ((event: PanEvent) => void) | undefined>()
  const panViewsByNode = new WeakMap<
    ElementNode,
    { view: object; handler: ((event: PanEvent) => void) | undefined }
  >()

  const { allocate, dispatch: invokeAction, idForView, hasHandler } = deps.store

  function adoptAction(
    node: ElementNode,
    action: ActionRegistration,
    view: object | null = node.view,
  ) {
    nodeActions.get(node)?.action.release()
    nodeActions.set(node, { action, view })
    node.actionId = action.id
    if (view) {
      deps.syncViewAccessibility?.(view)
    }

    return action.id
  }

  function acquireAction(node: ElementNode, view: object) {
    return adoptAction(node, allocate(view), view)
  }

  function canDispatch(node: ElementNode) {
    if (
      node.lifecycle === 'disposing' ||
      node.lifecycle === 'disposed' ||
      !node.container.root ||
      node.props.disabled === true ||
      node.props.isEnabled === false ||
      node.props.enabled === false ||
      node.props.accessibilityState?.disabled ||
      node.props.accessibilityState?.readonly
    ) {
      return false
    }

    const view = node.view
    const enabled = view?.isEnabled
    const nativeEnabled =
      typeof enabled === 'function' ? enabled.call(view) : (enabled ?? view?.enabled)

    return nativeEnabled !== false && nativeEnabled !== 0
  }

  function setNodeHandler(node: ElementNode, handler: (() => void) | undefined) {
    const view = node.view

    nodeActions.get(node)?.action.setHandler(
      handler
        ? (source) => {
            if (node.view === view && canDispatch(node)) {
              if (view && deps.store.deliverActivation(view, source)) {
                return
              }

              handler()
            }
          }
        : undefined,
    )

    if (view) {
      deps.syncViewAccessibility?.(view)
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
      if (clickRecognizersByView.get(sender.view) !== sender) {
        return
      }

      invokeAction(idForView(sender.view), 'pointer')
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
        node.view !== view ||
        node.linkClickRecognizer !== sender ||
        node.lifecycle === 'disposing' ||
        node.lifecycle === 'disposed' ||
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
      invokeAction(sender.tag ?? idForView(sender))

      // Toggle state lives on the control itself — resync :checked/:normal.
      const node = deps.registry.cssNodesByView.get(sender)

      if (node && node.lifecycle !== 'disposing' && node.lifecycle !== 'disposed') {
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

      if (node?.lifecycle === 'disposing' || node?.lifecycle === 'disposed') {
        return
      }

      if (node?.type === 'searchbar') {
        deps.inputElements.notifySearchTextChange(node)
      } else {
        invokeAction(node?.actionId ?? idForView(notification.object))
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
      if (panRecognizersByView.get(sender.view) !== sender) {
        return
      }

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

      if (node?.lifecycle === 'disposing' || node?.lifecycle === 'disposed') {
        return
      }

      if (node) {
        enforceTextLimit(notification.object as NSTextView, node.props?.maxLength)
      }

      deps.inputElements.syncTextViewPlaceholder(node)
      deps.inputElements.fitTextView(node)
      if (reportTextLimitChange(notification.object as NSTextView)) {
        invokeAction(idForView(notification.object))
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

      if (node?.lifecycle === 'disposing' || node?.lifecycle === 'disposed') {
        return false
      }

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

      if (node?.lifecycle === 'disposing' || node?.lifecycle === 'disposed') {
        return false
      }

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
    const prior = nodeActions.get(node)

    if (prior && prior.view !== node.view) {
      releaseNodeAction(node)
    }

    if (!nodeActions.has(node)) {
      if (!active || !node.view) {
        return
      }

      acquireAction(node, node.view)
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
      clickRecognizersByView.set(node.view!, node.clickGestureRecognizer)
    }

    setNodeHandler(
      node,
      typeof value === 'function'
        ? () => {
            if (node.lifecycle === 'disposing' || node.lifecycle === 'disposed') {
              return
            }

            try {
              if (!node.props.disabled) {
                node.container.root!.eventScope('discrete', value)
              }
            } catch (error) {
              console.error('[macos-event] press handler failed', error)
            }
          }
        : undefined,
    )
  }

  function setPanAction(node: ElementNode, _value: any) {
    const prior = panViewsByNode.get(node)

    if (prior && prior.view !== node.view) {
      releasePanAction(node)
    }

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
      panRecognizersByView.set(node.view!, node.panGestureRecognizer)
    }

    const view = node.view!
    const previous = panViewsByNode.get(node)

    if (previous && panHandlersByView.get(previous.view) === previous.handler) {
      panHandlersByView.delete(previous.view)
    }

    const handler = enabled
      ? (event: PanEvent) => {
          if (node.view !== view || panHandlersByView.get(view) !== handler || !canDispatch(node)) {
            return
          }

          try {
            node.container.root!.eventScope('discrete', () => {
              node.props.onPan?.(event)

              const direction = swipeDirection(event)

              if (
                direction !== null &&
                canDispatch(node) &&
                panHandlersByView.get(view) === handler
              ) {
                node.props.onSwipe?.({ direction })
              }
            })
          } catch (error) {
            console.error('[macos-event] pan/swipe handler failed', error)
          }
        }
      : undefined

    panViewsByNode.set(node, { view, handler })
    panHandlersByView.set(view, handler)
  }

  function setControlAction(node: ElementNode, value: any, readValue: () => any) {
    if (!nodeActions.has(node)) {
      return
    }

    setNodeHandler(
      node,
      typeof value === 'function'
        ? () => {
            if (!canDispatch(node) || node.props.editable === false) {
              return
            }

            try {
              node.container.root!.eventScope('discrete', () => value(readValue()))
            } catch (error) {
              console.error('[macos-event] control handler failed', error)
            }
          }
        : undefined,
    )
  }

  /** Return-key submission for single-line fields, invoked by the field's
   *  target/action — kept distinct from per-edit `onTextChange`. */
  function setTextSubmitAction(node: ElementNode, value: any) {
    const handler =
      typeof value === 'function'
        ? () => {
            if (
              node.submitHandler !== handler ||
              !canDispatch(node) ||
              node.props.editable === false
            ) {
              return
            }

            try {
              node.container.root!.eventScope('discrete', value)
            } catch (error) {
              console.error('[macos-event] text submit handler failed', error)
            }
          }
        : null

    node.submitHandler = handler
  }

  function dispatchPan(view: object, event: PanEvent): boolean {
    const handler = panHandlersByView.get(view)

    if (!handler) {
      return false
    }

    handler(event)
    return true
  }

  function releaseNodeAction(node: ElementNode) {
    const owned = nodeActions.get(node)

    nodeActions.delete(node)
    owned?.action.release()

    const recognizer = node.clickGestureRecognizer

    node.clickGestureRecognizer = undefined
    if (owned?.view && clickRecognizersByView.get(owned.view) === recognizer) {
      clickRecognizersByView.delete(owned.view)
    }

    const failures = new FailureCollector()

    if (recognizer) {
      failures.run('click disable', () => {
        recognizer.enabled = false
      })

      failures.run('click detach', () => {
        const view = owned?.view ?? node.view

        if (
          view &&
          'removeGestureRecognizer' in view &&
          typeof view.removeGestureRecognizer === 'function'
        ) {
          view.removeGestureRecognizer(recognizer)
        }
      })
    }

    failures.throwIfFailed()
  }

  function releasePanAction(node: ElementNode) {
    const pan = panViewsByNode.get(node)

    panViewsByNode.delete(node)
    if (pan && panHandlersByView.get(pan.view) === pan.handler) {
      panHandlersByView.delete(pan.view)
    }

    const recognizer = node.panGestureRecognizer

    node.panGestureRecognizer = undefined
    if (pan && panRecognizersByView.get(pan.view) === recognizer) {
      panRecognizersByView.delete(pan.view)
    }

    const failures = new FailureCollector()

    if (recognizer) {
      failures.run('pan disable', () => {
        recognizer.enabled = false
      })

      failures.run('pan detach', () => {
        const view = pan?.view ?? node.view

        if (
          view &&
          'removeGestureRecognizer' in view &&
          typeof view.removeGestureRecognizer === 'function'
        ) {
          view.removeGestureRecognizer(recognizer)
        }
      })
    }

    failures.throwIfFailed()
  }

  function disposeActions(node: ElementNode) {
    node.submitHandler = null

    const failures = new FailureCollector()

    failures.run('click action', () => releaseNodeAction(node))
    failures.run('pan action', () => releasePanAction(node))
    failures.throwIfFailed()
  }

  return {
    allocate,
    invokeAction,
    idForView,
    hasHandler,
    acquireAction,
    adoptAction,
    setNodeHandler,
    dispatchPan,
    disposeActions,
    buttonActionTarget,
    setAction,
    setPanAction,
    setControlAction,
    setTextSubmitAction,
  }
}
