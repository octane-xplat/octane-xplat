import { View } from '@nativescript/core'
import { normalizeInlineStyle } from '@octane-xplat/css-engine'
import type {
  NativeScriptHostBoundary,
  NativeScriptTextNode,
} from '@octane-xplat/nativescript-octane'
import {
  NSButton,
  NSControl,
  NSScrollView,
  NSTextField,
  NSTextView,
} from '@octane-xplat/platform/macos'
import { resolveFont } from './fonts'
import {
  composeAttributedText,
  validateTextStyle,
  type FormattedTextNode,
  type TextLinkRun,
} from './formatted-text'
import { syncHeadingAccessibility } from './heading-accessibility'
import { nativeColor } from './native-colors'
import {
  releaseNativeScriptTextLinks,
  syncNativeScriptTextLinks,
} from './nativescript-text-links.macos'

const textHosts = new Set(['label', 'button', 'textfield', 'textview', 'searchbar'])
const active = new WeakSet<View>()

function validateChild(parent: string | undefined, child: string) {
  if (parent === 'formattedstring' && child !== 'span') {
    throw new Error('AppKit <formattedstring> accepts only span children')
  }
  if (parent === 'span' && child !== 'span' && child !== '#text') {
    throw new Error('AppKit <span> accepts only span or text children')
  }
  if (child === 'formattedstring' && !textHosts.has(parent ?? '')) {
    throw new Error('AppKit <formattedstring> requires a text-bearing parent')
  }
  if (parent === 'searchbar' && child !== 'formattedstring') {
    throw new Error('AppKit <searchbar> cannot contain children other than formattedstring')
  }
  if (
    child === 'span' &&
    parent !== 'span' &&
    parent !== 'formattedstring' &&
    !textHosts.has(parent ?? '')
  ) {
    throw new Error('AppKit <span> requires a text-bearing parent')
  }
}

function runProps(props: Readonly<Record<string, unknown>>) {
  return { ...props, style: normalizeInlineStyle(props.style) }
}

function validateProps(type: string, props: Readonly<Record<string, unknown>>) {
  if (type === 'span' || type === 'formattedstring') {
    validateTextStyle(runProps(props), nativeColor)
  }
}

function formattedRun(node: NativeScriptTextNode): FormattedTextNode {
  const props = runProps(node.props)
  const source = node.view
  const eventName = source?.hasListeners('linkTap') ? 'linkTap' : 'tap'
  if (node.type === 'span' && source?.hasListeners(eventName)) {
    Object.assign(props, {
      onLinkTap() {
        source.notify({ eventName, object: source })
      },
    })
  }
  return {
    type: node.type,
    text: node.text,
    props,
    children: node.children.map(formattedRun),
  }
}

function plainText(node: NativeScriptTextNode) {
  const children = node.children.filter((child) => child.type === '#text')
  return children.length
    ? children.map((child) => child.text).join('')
    : String(node.props.text ?? '')
}

function sync(node: NativeScriptTextNode): boolean {
  if (!textHosts.has(node.type) || !(node.view instanceof View)) {
    return false
  }
  const native = node.view.nativeViewProtected
  const control = native instanceof NSScrollView ? native.documentView : native
  if (!(control instanceof NSControl || control instanceof NSTextView)) {
    return false
  }

  const rich = node.children.some(
    (child) => child.type === 'span' || child.type === 'formattedstring',
  )
  const links: TextLinkRun[] = []
  if (rich) {
    const attributed = composeAttributedText(
      node.children.map(formattedRun),
      control,
      node.props,
      resolveFont,
      nativeColor,
      {
        fontFamily: node.view.style.fontFamily,
        fontSize: control.font?.pointSize ?? (node.type === 'label' ? 16 : 14),
        fontWeight: node.view.style.fontWeight,
        color:
          control instanceof NSTextField || control instanceof NSTextView
            ? control.textColor
            : undefined,
        letterSpacing: node.view.style.letterSpacing,
        lineHeight: node.view.style.lineHeight,
      },
      links,
    )
    if (control instanceof NSButton) {
      control.attributedTitle = attributed
    } else if (control instanceof NSTextView) {
      control.textStorage.setAttributedString(attributed)
    } else {
      control.attributedStringValue = attributed
    }
    active.add(node.view)
  } else if (active.delete(node.view)) {
    const text = plainText(node)
    if (control instanceof NSButton) {
      control.title = text
    } else if (control instanceof NSTextView) {
      control.string = text
    } else {
      control.stringValue = text
    }
  } else {
    return false
  }

  if (node.type === 'label' && control instanceof NSTextField) {
    syncHeadingAccessibility(control, node.props)
    syncNativeScriptTextLinks(node.view, control, links)
  }
  control.invalidateIntrinsicContentSize()
  node.view.requestLayout()
  return true
}

export const appKitFormattedText: NonNullable<NativeScriptHostBoundary['formattedText']> = {
  validateChild,
  validateProps,
  sync,
  release(view) {
    if (view instanceof View) {
      active.delete(view)
      releaseNativeScriptTextLinks(view)
    }
  },
}
