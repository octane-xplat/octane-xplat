import type { ElementAdapter } from './element-adapter'
import type { ElementNode } from './model'
import type { TextElements } from './text-elements'
import type { InputElements } from './input-elements'
import type { Actions } from './actions'
import { FailureCollector } from './failures.ts'
import { nativeColor } from './native-colors'
import { validateHtmlProps } from './html-text'
import { validateTextStyle } from './formatted-text'
import { resolveFont as fontForFamilyStyle } from './fonts'
import { NSTextField, NSTextView, NSView } from '@octane-xplat/platform/macos'

export interface TextAdapterDependencies {
  textElements: Pick<
    TextElements,
    | 'makeLabel'
    | 'applyBuiltinLabelProp'
    | 'applyBuiltinHtmlViewProp'
    | 'syncText'
    | 'syncLabelOverflow'
    | 'syncHtmlView'
    | 'disposeTextLinks'
    | 'disposeBuiltinFormattedText'
  >
  inputElements: Pick<
    InputElements,
    | 'makeTextField'
    | 'makeSearchBar'
    | 'textNodesByView'
    | 'initializeTextViewport'
    | 'applyBuiltinTextInputProp'
    | 'applyBuiltinSearchBarProp'
    | 'syncSecureTextField'
    | 'setTextFieldPlaceholder'
    | 'syncSearchBar'
    | 'fitTextView'
    | 'disposeBuiltinTextViewLayout'
    | 'disposeBuiltinTextInput'
  >
  actions: Pick<Actions, 'acquireAction' | 'buttonActionTarget' | 'disposeActions'>
}

export type TextAdapters = Readonly<Record<string, ElementAdapter>>

export function createTextAdapters(deps: TextAdapterDependencies): TextAdapters {
  function inheritFont(node: ElementNode) {
    const control = node.view as NSTextField | NSTextView
    if (control.font) {
      control.font = fontForFamilyStyle(control.font.pointSize, 400, node.container.fontFamily)
    }
  }
  function createInput(node: ElementNode) {
    deps.actions.acquireAction(node, node.view!)
    if (node.type === 'textview') {
      ;(node.view as NSTextView).delegate = deps.actions.buttonActionTarget
    } else {
      const field = node.view as NSTextField
      field.delegate = deps.actions.buttonActionTarget
      field.target = deps.actions.buttonActionTarget
      // The search delegate owns submission; ordinary fields use Return.
      // @ts-ignore Native action clearing accepts null; generated declarations do not.
      if (node.type === 'searchbar') {
        // @ts-ignore Native action clearing accepts null; generated declarations do not.
        field.action = null
      } else {
        field.action = 'textFieldSubmitted:'
      }
    }
    inheritFont(node)
  }
  function disposeInput(node: ElementNode) {
    const failures = new FailureCollector()
    failures.run('text links', () => deps.textElements.disposeTextLinks(node))
    failures.run('input actions', () => deps.actions.disposeActions(node))
    failures.run('input state', () => deps.inputElements.disposeBuiltinTextInput(node))
    failures.throwIfFailed()
  }
  function syncFormatted(node: ElementNode) {
    if (node.children?.some((child) => child.type === 'formattedstring' || child.type === 'span')) {
      deps.textElements.syncText(node)
    }
  }
  const logical: ElementAdapter = {
    publicInstance: 'node',
    styleValidation: 'none',
    container: false,
    hasView: false,
    create() {},
    validate(props) {
      validateTextStyle(props, nativeColor)
    },
    afterProps(node) {
      deps.textElements.syncText(node.parent)
    },
    prepareDispose: deps.textElements.disposeBuiltinFormattedText,
  }
  return {
    label: {
      styleValidation: 'text',
      container: false,
      hasView: true,
      validate(props, previous) {
        const merged = { ...previous, ...props }
        if (merged.whiteSpace != null && !['normal', 'nowrap'].includes(merged.whiteSpace)) {
          throw new Error('[macos-host] label whiteSpace supports only normal and nowrap')
        }
        if (merged.textOverflow != null && !['clip', 'ellipsis'].includes(merged.textOverflow)) {
          throw new Error('[macos-host] label textOverflow supports only clip and ellipsis')
        }
        if (
          merged.maxLines != null &&
          (!Number.isInteger(merged.maxLines) || merged.maxLines < 0)
        ) {
          throw new Error('[macos-host] label maxLines must be a non-negative integer')
        }
        if (props.fontSize !== undefined && !Number.isFinite(Number(props.fontSize))) {
          throw new Error('[macos-host] label fontSize must be a finite number')
        }
      },
      create(node) {
        node.view = deps.textElements.makeLabel()
        inheritFont(node)
      },
      applyProp(node, name, value) {
        deps.textElements.applyBuiltinLabelProp(node, name, value)
        return true
      },
      afterProps(node) {
        deps.textElements.syncLabelOverflow(node)
        deps.textElements.syncText(node)
      },
      dispose: deps.textElements.disposeTextLinks,
    },
    htmlview: {
      styleValidation: 'text',
      container: false,
      hasView: true,
      validate(props) {
        validateHtmlProps(props)
      },
      create(node) {
        node.view = deps.textElements.makeLabel()
        // @ts-ignore Native selectable is writable; generated declarations mark it readonly.
        node.view.selectable = true
        inheritFont(node)
      },
      applyProp(node, name, value) {
        deps.textElements.applyBuiltinHtmlViewProp(node, name, value)
        return true
      },
      afterProps(node) {
        deps.textElements.syncHtmlView(node)
        syncFormatted(node)
      },
      dispose: deps.textElements.disposeTextLinks,
    },
    textfield: {
      styleValidation: 'text',
      container: false,
      hasView: true,
      validate(props, previous) {
        if (
          props.placeholderTextColor != null &&
          String(props.placeholder ?? previous?.placeholder ?? '') !== ''
        ) {
          nativeColor(props.placeholderTextColor)
        }
      },
      create(node, props) {
        // Native field declarations have a broader bridge shape than NSView.
        node.view = deps.inputElements.makeTextField(props) as unknown as NSView
        createInput(node)
        deps.inputElements.textNodesByView.set(node.view, node)
      },
      applyProp(node, name, value) {
        deps.inputElements.applyBuiltinTextInputProp(node, name, value)
        return true
      },
      afterProps(node) {
        deps.inputElements.syncSecureTextField(node)
        node.view!.enabled = node.props.isEnabled !== false && node.props.enabled !== false
        node.view!.editable = node.view!.enabled && node.props.editable !== false
        deps.inputElements.setTextFieldPlaceholder(
          node.view as NSTextField,
          node.props,
          node.stylePlaceholderColor,
        )
        syncFormatted(node)
      },
      dispose: disposeInput,
    },
    textview: {
      styleValidation: 'text',
      container: false,
      hasView: true,
      create(node, props) {
        node.view = deps.inputElements.makeTextField(props, true) as unknown as NSView
        createInput(node)
        deps.inputElements.initializeTextViewport(node, props)
      },
      applyProp(node, name, value) {
        deps.inputElements.applyBuiltinTextInputProp(node, name, value)
        return true
      },
      afterProps(node) {
        node.view!.editable = node.props.isEnabled !== false && node.props.editable !== false
        deps.inputElements.fitTextView(node)
        syncFormatted(node)
      },
      retire: deps.inputElements.disposeBuiltinTextViewLayout,
      dispose: disposeInput,
    },
    searchbar: {
      styleValidation: 'text',
      container: false,
      hasView: true,
      create(node) {
        node.view = deps.inputElements.makeSearchBar()
        createInput(node)
        deps.inputElements.textNodesByView.set(node.view, node)
      },
      applyProp(node, name, value) {
        deps.inputElements.applyBuiltinSearchBarProp(node, name, value)
        return true
      },
      afterProps(node, patch) {
        deps.inputElements.syncSearchBar(node, patch)
        syncFormatted(node)
      },
      dispose: disposeInput,
    },
    '#text': {
      styleValidation: 'none',
      container: false,
      hasView: false,
      create() {},
      afterProps(node, patch) {
        if ('value' in patch) {
          node.text = String(patch.value ?? '')
        }
        deps.textElements.syncText(node.parent)
      },
    },
    span: logical,
    formattedstring: logical,
  }
}
