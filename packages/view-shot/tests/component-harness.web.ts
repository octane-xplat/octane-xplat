import { createRoot, flushSync } from 'octane'
import { ViewShot, captureRef, releaseCapture } from '../src/index'
import type { ViewShotProps, ViewShotRef } from '../src/index'
import { trace } from './component-backend'
import { LayoutFixture, type LayoutMode } from './component-layout.web'

const host = document.getElementById('root')!
const root = createRoot(host)
const ref: { current: ViewShotRef | null } = { current: null }
const render = (props: ViewShotProps) =>
  flushSync(() => root.render(ViewShot, { ref, children: 'Trip card', id: 'card', ...props }))

const renderLayout = (mode: LayoutMode) => flushSync(() => root.render(LayoutFixture, { mode }))

export const fixture = { root, ref, trace, captureRef, releaseCapture, render, renderLayout, host }

render({})
