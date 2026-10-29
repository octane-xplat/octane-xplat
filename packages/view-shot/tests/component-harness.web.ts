import { createRoot, flushSync } from 'octane'
import { ViewShot, captureRef, releaseCapture } from '../src/index'
import type { ViewShotProps, ViewShotRef } from '../src/index'
import { trace } from './component-backend'
const host = document.getElementById('root')!
const root = createRoot(host)
const ref: { current: ViewShotRef | null } = { current: null }
const render = (props: ViewShotProps) =>
	flushSync(() => root.render(ViewShot, { ref, children: 'Trip card', id: 'card', ...props }))
export const fixture = { root, ref, trace, captureRef, releaseCapture, render, host }
render({})
