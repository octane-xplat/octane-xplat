// Web click-to-pick: the panel toggles Pick, the user clicks an element, and
// the mounted style site(s) on the nearest tagged ancestor are reported to the
// server. Bamboo sites tag via `tw_<hash>` marker classes (registered by
// __twCss); inline sites tag via the `--tw-site` custom property set by the
// tagged useTweakStyles hook.
import { client } from './client'

// marker class → style-site id, for bamboo sites (dev.web.ts registers).
export const markerSiteIds = new Map<string, string>()
// inline --tw-site value → style-site id (dev.web.ts registers).
export const inlineSiteIds = new Map<string, string>()

const OVERLAY_ID = 'octane-tweaks-pick-overlay'
let active = false
let overlay: HTMLElement | null = null
let hoveredIds: string[] = []
let prevCursor = ''

function ensureOverlay(): HTMLElement {
  if (!overlay) {
    overlay = document.createElement('div')
    overlay.id = OVERLAY_ID
    overlay.style.cssText =
      'position:fixed;pointer-events:none;z-index:2147483647;' +
      'outline:2px solid #4477ff;outline-offset:1px;display:none;'

    document.documentElement.appendChild(overlay)
  }

  return overlay
}

function siteIdsOn(el: Element): string[] {
  const ids: string[] = []

  for (const cls of el.classList) {
    const id = markerSiteIds.get(cls)

    if (id && !ids.includes(id)) {
      ids.push(id)
    }
  }

  const tag = (el as HTMLElement).style?.getPropertyValue('--tw-site')

  if (tag) {
    const id = inlineSiteIds.get(tag)

    if (id && !ids.includes(id)) {
      ids.push(id)
    }
  }

  return ids
}

function hitTest(target: EventTarget | null): { el: Element | null; ids: string[] } {
  let el = target instanceof Element ? target : null

  while (el) {
    const ids = siteIdsOn(el)

    if (ids.length) {
      return { el, ids }
    }

    el = el.parentElement
  }

  return { el: null, ids: [] }
}

function outline(el: Element | null) {
  const o = ensureOverlay()

  if (!el) {
    o.style.display = 'none'
    return
  }

  const r = el.getBoundingClientRect()

  o.style.display = 'block'
  o.style.left = `${r.left}px`
  o.style.top = `${r.top}px`
  o.style.width = `${r.width}px`
  o.style.height = `${r.height}px`
}

function onMove(event: PointerEvent) {
  const hit = hitTest(event.target)

  hoveredIds = hit.ids
  outline(hit.el)
}

function onDown(event: PointerEvent) {
  event.preventDefault()
  event.stopPropagation()
}

function onClick(event: MouseEvent) {
  event.preventDefault()
  event.stopPropagation()
  if (hoveredIds.length) {
    client.sendPicked(hoveredIds)
    teardown()
  }
  // An empty hit keeps picking: only Escape cancels.
}

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    client.sendPicked([])
    teardown()
  }
}

function activate() {
  if (active) {
    return
  }

  active = true
  prevCursor = document.documentElement.style.cursor
  document.documentElement.style.cursor = 'crosshair'
  window.addEventListener('pointermove', onMove, true)
  window.addEventListener('pointerdown', onDown, true)
  window.addEventListener('click', onClick, true)
  window.addEventListener('keydown', onKey, true)
}

function teardown() {
  if (!active) {
    return
  }

  active = false
  window.removeEventListener('pointermove', onMove, true)
  window.removeEventListener('pointerdown', onDown, true)
  window.removeEventListener('click', onClick, true)
  window.removeEventListener('keydown', onKey, true)
  document.documentElement.style.cursor = prevCursor
  overlay?.remove()
  overlay = null
  hoveredIds = []
}

client.onPick((on) => (on ? activate() : teardown()))
