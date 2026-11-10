/** @jsxImportSource @octane-xplat/jsx/dom */
import { createPortal as createDOMPortal } from 'octane'
import { InteractionPortalBoundary } from '../../gestures/context.tsrx'

export function createPortal(children: unknown, target: unknown) {
  if (!isPortalTarget(target)) {
    throw new Error('A portal requires an element or document fragment target')
  }

  return createDOMPortal(
    <InteractionPortalBoundary target={target}>{children}</InteractionPortalBoundary>,
    target,
  )
}

function isPortalTarget(value: unknown): value is Element | DocumentFragment {
  return (
    value !== null &&
    typeof value === 'object' &&
    'nodeType' in value &&
    (value.nodeType === 1 || value.nodeType === 11) &&
    'insertBefore' in value &&
    typeof value.insertBefore === 'function'
  )
}

export type PortalValue = ReturnType<typeof createPortal>
