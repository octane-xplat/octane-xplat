// Web leaf: inline preview via useTweakStyles (shared impl) plus __twCss for
// bamboo css() sites. __twCss appends a marker class; a MutationObserver tracks
// marked elements as mounted sites and applies override {className, css}.
import { createUseTweakStyles } from './useTweakStyles'
import { markerSiteIds, inlineSiteIds } from './pick.web'
import { client } from './client'

const MARKER_PREFIX = 'tw_'
const sites = new Map<string, { id: string; classes: string[] }>()
const seen = new Map<string, number>() // marker -> element count
// Override tokens each element currently carries, so revert/updates can strip
// exactly what we added and no more.
const applied = new WeakMap<Element, Set<string>>()
let observer: MutationObserver | null = null

function hash(id: string): string {
  let h = 0x811c9dc5

  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }

  return (h >>> 0).toString(16).padStart(8, '0')
}

function markerFor(id: string): string {
  return `${MARKER_PREFIX}${hash(id)}`
}

function siteForMarker(marker: string) {
  for (const s of sites.values()) {
    if (markerFor(s.id) === marker) {
      return s
    }
  }

  return null
}

function sitesOn(el: Element) {
  const tokens = el.className.split(/\s+/).filter(Boolean)

  return [...sites.values()].filter((s) => tokens.includes(markerFor(s.id)))
}

function scan() {
  const now = new Map<string, number>()

  for (const el of document.querySelectorAll(`[class*="${MARKER_PREFIX}"]`)) {
    for (const cls of el.className.split(/\s+/)) {
      if (cls.startsWith(MARKER_PREFIX)) {
        now.set(cls, (now.get(cls) ?? 0) + 1)
      }
    }
  }

  for (const marker of now.keys()) {
    const site = siteForMarker(marker)

    if (site && !seen.has(marker)) {
      client.mountStyle(site.id)
    }
  }

  for (const marker of seen.keys()) {
    if (!now.has(marker)) {
      const site = siteForMarker(marker)

      if (site) {
        client.unmountStyle(site.id)
      }
    }
  }

  seen.clear()
  for (const [m, n] of now) {
    seen.set(m, n)
  }
}

function previewTag(): HTMLStyleElement {
  let el = document.getElementById('octane-tweaks-preview') as HTMLStyleElement | null

  if (!el) {
    el = document.createElement('style')
    el.id = 'octane-tweaks-preview'
    document.head.appendChild(el)
  }

  return el
}

// Guard against our own mutations re-triggering the observer forever.
let applying = false

function applyOverrides() {
  if (applying) {
    return
  }

  applying = true
  try {
    const css = new Map<string, string>()

    for (const el of document.querySelectorAll(`[class*="${MARKER_PREFIX}"]`)) {
      const tokens = el.className.split(/\s+/).filter(Boolean)
      const before = applied.get(el) ?? new Set<string>()
      // Original classes contributed by ANY tw site on this element are kept
      // even when another site's original set overlaps them.
      const originals = new Set<string>()

      for (const s of sitesOn(el)) {
        for (const c of s.classes) {
          originals.add(c)
        }
      }

      const strip = new Set([...before].filter((c) => !originals.has(c)))
      const next = new Set(tokens.filter((c) => !strip.has(c)))

      for (const s of sitesOn(el)) {
        const raw = client.getStyleRaw(s.id)

        if (raw && raw.kind === 'bamboo') {
          // Remove this site's originals, except classes another tw site
          // on the same element contributes.
          for (const c of s.classes) {
            if (!othersOn(el, s.id).some((o) => o.classes.includes(c))) {
              next.delete(c)
            }
          }

          for (const c of raw.className.split(/\s+/).filter(Boolean)) {
            next.add(c)
          }

          css.set(s.id, raw.css)
        }
      }

      const text = [...next].join(' ')

      if (el.className !== text) {
        el.className = text
      }

      // Record what is now on the element beyond tw-site originals.
      applied.set(
        el,
        new Set([...next].filter((c) => !originals.has(c) && !c.startsWith(MARKER_PREFIX))),
      )
    }

    const tag = previewTag()
    const text = [...css.values()].join('\n')

    if (tag.textContent !== text) {
      tag.textContent = text
    }
  } finally {
    applying = false
  }
}

function othersOn(el: Element, id: string) {
  return sitesOn(el).filter((s) => s.id !== id)
}

function ensureObserver() {
  if (observer || typeof document === 'undefined') {
    return
  }

  observer = new MutationObserver(() => {
    if (applying) {
      return
    }

    scan()
    applyOverrides()
  })

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class'],
  })

  scan()
  applyOverrides()
  client.onStyles(() => applyOverrides())
}

export function __twCss(id: string, className: string): string {
  sites.set(id, { id, classes: className.split(/\s+/).filter(Boolean) })
  markerSiteIds.set(markerFor(id), id)
  ensureObserver()
  // Mounting is the observer's job once the marker lands on an element.
  scan()
  return `${className} ${markerFor(id)}`
}

// Inline style sites tag via the --tw-site custom property; the marker
// function's hash gives a stable opaque value the pick hit-test maps back.
export const useTweakStyles = createUseTweakStyles((id, style) => {
  inlineSiteIds.set(markerFor(id), id)
  return { ...style, '--tw-site': markerFor(id) }
})
