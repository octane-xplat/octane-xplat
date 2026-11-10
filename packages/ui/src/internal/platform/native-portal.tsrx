/** @jsxImportSource @octane-xplat/jsx */
import {
  createPortal as createUniversalPortal,
  type UniversalRenderable,
  type UniversalPortalValue,
} from 'octane/universal/native'

import { InteractionPortalBoundary } from '../../gestures/context.tsrx'

export function createPortal(children: unknown, target: unknown): UniversalPortalValue {
  if (!target || typeof target !== 'object') {
    throw new Error('A portal requires a mounted host target')
  }

  const content = <InteractionPortalBoundary target={target}>{children}</InteractionPortalBoundary>

  return createUniversalPortal(content as unknown as UniversalRenderable, target)
}

export type PortalValue = UniversalPortalValue
