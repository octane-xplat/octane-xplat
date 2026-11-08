// @ts-nocheck — path derivation extracted unchanged from the TypeScript reference.
import { sep } from 'node:path'
import {
  normalizeRouteSegment as normSegment,
  routeParamName as segmentParam,
} from '@octane-xplat/lib/route-pattern'

export interface RoutePath {
  name: string
  segments: string[]
  params: string[]
  presentation?: 'modal' | 'push'
  transition?: 'fade'
}

export const EXT = /\.(tsrx|tsx|ts|mts|cts|js|mjs|cjs|jsx)$/
export const SUFFIX = /\.(web|mobile|ios|android|macos|windows|linux)$/
export const PRESENT = /\+(modal|fade|push)$/

export function routeFor(rel: string, extRe: RegExp = EXT): RoutePath | null {
  rel = rel.split(sep).join('/').replace(extRe, '')

  const parts = rel.split('/')
  let base = parts[parts.length - 1]
  const sm = SUFFIX.exec(base)

  if (sm) {
    base = base.slice(0, base.length - sm[0].length)
  }

  const pm = PRESENT.exec(base)
  const presentation = pm ? (pm[1] === 'fade' ? 'push' : pm[1]) : undefined
  const transition = pm?.[1] === 'fade' ? 'fade' : undefined

  if (pm) {
    base = base.slice(0, base.length - pm[0].length)
  }

  if (base === '_layout') {
    return null
  }

  const segs = parts.slice(0, -1).concat(base)

  if (segs[segs.length - 1] === 'index') {
    segs.pop()
  }

  const segments = segs.map(normSegment)

  return {
    name: segments.join('/') || 'index',
    segments,
    params: segments.flatMap((s) => segmentParam(s) ?? []),
    presentation,
    transition,
  }
}
