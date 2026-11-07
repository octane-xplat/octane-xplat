import { galleryEntries, type GalleryEntry } from '../gallery'
import type { GalleryGroup } from '../contract'
import type { WorkshopBootOptions } from './entry.web'

interface Card {
  entry: GalleryEntry
  section: HTMLElement
  stage: HTMLElement
  status: HTMLElement
  anchor: HTMLAnchorElement
  frame?: HTMLIFrameElement
  token?: string
  state: 'idle' | 'queued' | 'loading' | 'ready' | 'error' | 'disposing'
  near: boolean
  touched: number
  timer?: ReturnType<typeof setTimeout>
  release?: () => void
}

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (text) {
    node.textContent = text
  }
  return node
}

function setPhase(card: Card, phase: Card['state']): void {
  card.state = phase
  card.section.dataset.phase = phase
}

/** Mount a metadata-only index; story code executes only inside activated frames. */
export function startGallery(options: WorkshopBootOptions): () => void {
  const host = document.getElementById('workshop-root') ?? document.body
  document.documentElement.classList.add('xw-gallery-page')
  const container = element('main')
  container.className = 'xw-gallery'
  const heading = element('h1', 'Component workshop')
  const intro = element('p', 'A library of cross-platform components, ready to explore.')
  const nav = element('a', 'Open story inspector')
  nav.href = '?view=story'
  const search = element('input')
  search.type = 'search'
  search.placeholder = 'Find a component'
  search.setAttribute('aria-label', 'Find a component')
  const count = element('p')
  count.setAttribute('role', 'status')
  const index = element('nav')
  index.setAttribute('aria-label', 'Component index')
  const masthead = element('header')
  masthead.className = 'xw-gallery-masthead'
  const mastheadInner = element('div')
  mastheadInner.className = 'xw-gallery-shell xw-gallery-heading'
  const introduction = element('div')
  intro.className = 'xw-gallery-intro'
  nav.className = 'xw-gallery-inspector'
  introduction.append(heading, intro)
  mastheadInner.append(introduction, nav)
  masthead.append(mastheadInner)

  const toolbar = element('div')
  toolbar.className = 'xw-gallery-toolbar'
  const toolbarInner = element('div')
  toolbarInner.className = 'xw-gallery-shell xw-gallery-tools'
  const searchLabel = element('label')
  searchLabel.className = 'xw-gallery-search'
  searchLabel.append(search)
  search.placeholder = 'Find a component…'
  count.className = 'xw-gallery-count'
  toolbarInner.append(searchLabel, count)
  toolbar.append(toolbarInner)

  const body = element('div')
  body.className = 'xw-gallery-shell xw-gallery-content'
  const contents = element('details')
  contents.className = 'xw-gallery-index'
  contents.append(element('summary', 'Component index'), index)
  const note = element('p', 'Previews load as you scroll. Distant previews may reset.')
  note.className = 'xw-gallery-note'
  const list = element('div')
  list.className = 'xw-gallery-list'
  const empty = element('div')
  empty.className = 'xw-gallery-empty'
  const emptyHeading = element('h2', 'No components found')
  const emptyHint = element('p', 'Try another component name or package.')
  empty.append(emptyHeading, emptyHint)
  const clear = element('button', 'Clear search')
  clear.type = 'button'
  clear.onclick = () => {
    search.value = ''
    filter()
    search.focus()
  }
  empty.append(clear)
  empty.hidden = true
  list.append(empty)
  const tabs = element('div')
  tabs.className = 'xw-gallery-tabs'
  tabs.setAttribute('role', 'tablist')
  tabs.setAttribute('aria-label', 'Component categories')
  const tabButtons = new Map<GalleryGroup, HTMLButtonElement>()
  list.id = 'xw-gallery-panel'
  let activeGroup: GalleryGroup =
    new URLSearchParams(location.search).get('group') === 'primitives' ? 'primitives' : 'components'
  for (const group of ['components', 'primitives'] as const) {
    const tab = element('button', group === 'components' ? 'Components' : 'Primitives')
    tab.type = 'button'
    tab.id = `xw-gallery-tab-${group}`
    tab.setAttribute('role', 'tab')
    tab.setAttribute('aria-controls', list.id)
    tab.onclick = () => selectGroup(group, true)
    tab.onkeydown = (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        return
      }
      event.preventDefault()
      const next =
        event.key === 'Home'
          ? 'components'
          : event.key === 'End'
            ? 'primitives'
            : activeGroup === 'components'
              ? 'primitives'
              : 'components'
      selectGroup(next, true)
      tabButtons.get(next)?.focus()
    }

    tabButtons.set(group, tab)
    tabs.append(tab)
  }
  const browse = element('div')
  browse.className = 'xw-gallery-browse'
  browse.append(contents, note)
  body.append(tabs, browse, list)
  container.append(masthead, toolbar, body)
  const cards: Card[] = []
  let disposed = false
  let clock = 0
  let observer: IntersectionObserver | undefined
  const focused = (card: Card) => document.activeElement === card.frame
  const active = () => cards.filter((card) => card.frame)

  const retire = (card: Card, reload = false) => {
    if (!card.frame || card.state === 'disposing') {
      return
    }
    setPhase(card, 'disposing')
    clearTimeout(card.timer)
    card.frame.contentWindow?.postMessage(
      { workshop: 1, type: 'dispose', token: card.token },
      location.origin,
    )
    card.release = () => {
      clearTimeout(card.timer)
      card.frame?.remove()
      card.frame = undefined
      card.release = undefined
      setPhase(card, 'idle')
      card.status.textContent = 'Preview released. Load again to reset.'
      if (reload) {
        queue(card)
      }
      pump()
    }
    card.timer = setTimeout(() => {
      // Do not silently resume after unacknowledged teardown.
      card.frame?.remove()
      card.frame = undefined
      card.release = undefined
      setPhase(card, 'error')
      card.status.textContent = 'Preview cleanup did not finish. Retry creates a fresh preview.'
      pump()
    }, 3000)
  }

  const activate = (card: Card) => {
    if (disposed || card.frame || !card.entry.selected) {
      return
    }
    setPhase(card, 'loading')
    card.touched = ++clock
    card.token = crypto.randomUUID()
    const frame = element('iframe')
    frame.title = `${card.entry.title} — ${card.entry.selected.title}`
    const url = new URL(location.href)
    url.hash = ''
    url.search = new URLSearchParams({
      view: 'frame',
      story: card.entry.selected.id,
      token: card.token,
    }).toString()
    frame.src = url.href
    frame.style.height = `${card.entry.height}px`
    card.frame = frame
    card.stage.append(frame)
    card.status.textContent = 'Loading preview…'
    card.timer = setTimeout(() => {
      setPhase(card, 'error')
      card.status.textContent = 'Preview timed out. Retry or open the story to inspect it.'
      pump()
    }, 20000)
  }

  function pump() {
    if (disposed) {
      return
    }
    const queued = cards
      .filter((card) => card.state === 'queued' && !card.section.hidden)
      .sort(
        (a, b) =>
          Math.abs(a.section.getBoundingClientRect().top) -
          Math.abs(b.section.getBoundingClientRect().top),
      )
    for (const card of queued) {
      if (cards.filter((item) => item.state === 'loading').length >= 2) {
        break
      }

      if (active().length >= 8) {
        const victim = active()
          .filter((item) => !item.near && !focused(item) && item.state !== 'disposing')
          .sort((a, b) => a.touched - b.touched)[0]

        if (victim) {
          retire(victim)
        } else {
          card.status.textContent =
            'Active previews are in use. Leave a preview or use Load preview.'
        }

        break
      }

      activate(card)
    }
  }

  const queue = (card: Card) => {
    if (
      !card.entry.selected ||
      card.frame ||
      card.state === 'error' ||
      card.state === 'disposing'
    ) {
      return
    }
    setPhase(card, 'queued')
    pump()
  }

  let entries: GalleryEntry[] = []
  try {
    if (!options.diagnostics?.length) {
      entries = galleryEntries(options.catalog)
    }
  } catch (error) {
    const diagnostic = element(
      'p',
      error instanceof Error ? error.message : 'Invalid gallery metadata',
    )

    diagnostic.setAttribute('role', 'alert')
    container.prepend(diagnostic)
  }
  for (const entry of entries) {
    const section = element('section')
    section.id = `component=${encodeURIComponent(entry.componentId)}`
    section.className = 'xw-gallery-card'
    section.dataset.phase = 'idle'
    section.dataset.group = entry.group
    const title = element('h2', entry.title)
    title.title = entry.componentId
    const targets = [...new Set(entry.variants.flatMap((variant) => variant.targets))]
    const support = element('p', 'Targets: ' + targets.join(' · '))

    support.className = 'xw-gallery-targets'
    support.hidden = targets.length === 1 && targets[0] === 'web'
    const stage = element('div')
    stage.className = 'xw-gallery-stage'
    stage.style.minHeight = `${entry.height}px`
    const status = element(
      'p',
      entry.selected
        ? 'Preview loads when nearby.'
        : entry.variants
            .map((v) => v.reason)
            .filter(Boolean)
            .join('; ') || 'Platform-only example',
    )

    status.setAttribute('role', 'status')
    status.className = 'xw-gallery-status'
    const anchor = element('a', entry.title)
    anchor.href = `#${section.id}`
    const card: Card = {
      entry,
      section,
      stage,
      status,
      anchor,
      near: false,
      state: 'idle',
      touched: 0,
    }

    const load = element('button', 'Load / Retry preview')
    load.className = 'xw-gallery-reload'
    load.type = 'button'
    load.disabled = !entry.selected
    load.onclick = () => {
      if (card.frame) {
        retire(card, true)
      } else {
        setPhase(card, 'idle')
        queue(card)
      }
    }

    const reset = element('button', 'Reset')
    reset.type = 'button'
    reset.disabled = !entry.selected
    reset.onclick = () =>
      card.frame?.contentWindow?.postMessage(
        { workshop: 1, type: 'reset', token: card.token },
        location.origin,
      )

    const cardHeader = element('header')
    cardHeader.className = 'xw-gallery-card-head'
    const label = element('div')
    label.append(title)
    cardHeader.append(label, support)
    const footer = element('footer')
    footer.className = 'xw-gallery-card-foot'
    const actions = element('div')
    actions.className = 'xw-gallery-actions'
    actions.append(load, reset)
    const variants = element('div')
    variants.className = 'xw-gallery-variants'
    variants.setAttribute('role', 'group')
    variants.setAttribute('aria-label', `${entry.title} stories`)
    footer.append(status, variants, actions)
    section.append(cardHeader, stage, footer)
    for (const variant of entry.variants) {
      const link = element(
        'a',
        entry.variants.length === 1
          ? 'View story'
          : variant.title.split('/').at(-1)?.trim() || variant.title,
      )

      link.setAttribute('aria-label', `Open ${variant.title} story`)
      link.title = variant.title
      link.href = `?view=story&story=${encodeURIComponent(variant.id)}`
      variants.append(link)
    }

    index.append(anchor)
    list.append(section)
    cards.push(card)
  }
  if (options.diagnostics?.length) {
    container.prepend(element('p', options.diagnostics.map((d) => d.message).join('\n')))
  }
  const hasPrimitives = entries.some((entry) => entry.group === 'primitives')
  tabs.hidden = !hasPrimitives
  if (hasPrimitives) {
    list.setAttribute('role', 'tabpanel')
  } else {
    activeGroup = 'components'
  }
  host.replaceChildren(container)
  function selectGroup(group: GalleryGroup, clearAnchor = false): void {
    activeGroup = group
    const url = new URL(location.href)
    if (group === 'primitives') {
      url.searchParams.set('group', group)
    } else {
      url.searchParams.delete('group')
    }
    if (clearAnchor) {
      url.hash = ''
    }
    history.replaceState(history.state, '', url)
    filter()
  }
  const filter = () => {
    const query = search.value.trim().toLowerCase()
    for (const card of cards) {
      card.section.hidden =
        card.entry.group !== activeGroup ||
        !`${card.entry.componentId} ${card.entry.title} ${card.entry.variants.map((v) => v.title).join(' ')}`
          .toLowerCase()
          .includes(query)

      card.anchor.hidden = card.section.hidden
      if (card.section.hidden) {
        if (!focused(card)) {
          retire(card)
        }

        if (card.state === 'queued') {
          setPhase(card, 'idle')
        }
      }
    }
    const visible = cards.filter((card) => !card.section.hidden).length
    const total = cards.filter((card) => card.entry.group === activeGroup).length
    count.textContent = `${visible}${query ? ` of ${total}` : ''} ${activeGroup === 'primitives' ? 'primitive' : 'component'}${(query ? total : visible) === 1 ? '' : 's'}`
    for (const [group, tab] of tabButtons) {
      tab.setAttribute('aria-selected', String(group === activeGroup))
      tab.tabIndex = group === activeGroup ? 0 : -1
    }
    if (hasPrimitives) {
      list.setAttribute('aria-labelledby', `xw-gallery-tab-${activeGroup}`)
    }
    emptyHeading.textContent =
      activeGroup === 'primitives' ? 'No primitives found' : 'No components found'
    emptyHint.textContent = hasPrimitives
      ? 'Try another name or switch tabs.'
      : 'Try another component name or package.'
    empty.hidden = visible > 0
    pump()
  }
  search.oninput = filter
  filter()
  if (typeof IntersectionObserver !== 'undefined') {
    observer = new IntersectionObserver(
      (entries) => {
        for (const item of entries) {
          const card = cards.find((c) => c.stage === item.target)
          if (!card) {
            continue
          }

          card.near = item.isIntersecting
          if (card.near && !card.section.hidden) {
            card.touched = ++clock
            queue(card)
          } else if (card.state === 'queued') {
            setPhase(card, 'idle')
          }
        }
        pump()
      },
      { rootMargin: '400px' },
    )

    for (const card of cards) {
      observer.observe(card.stage)
    }
  }
  const jump = () => {
    const card = cards.find((item) => `#${item.section.id}` === location.hash)
    if (card) {
      search.value = ''
      selectGroup(card.entry.group)
      queue(card)
      card.section.scrollIntoView()
    }
  }
  const message = (event: MessageEvent) => {
    if (event.origin !== location.origin || !event.data || event.data.workshop !== 1) {
      return
    }
    const card = cards.find(
      (item) => item.frame?.contentWindow === event.source && item.token === event.data.token,
    )
    if (!card) {
      return
    }
    if (event.data.type === 'disposed') {
      card.release?.()
      return
    }
    if (card.state === 'disposing') {
      return
    }
    if (event.data.type === 'ready' || event.data.type === 'error') {
      clearTimeout(card.timer)
      setPhase(card, event.data.type === 'ready' ? 'ready' : 'error')
      card.status.textContent =
        card.state === 'ready' ? 'Ready' : 'Preview failed. Retry or open the story.'

      pump()
    }
    if (event.data.type === 'height' && Number.isFinite(event.data.height) && card.frame) {
      card.frame.style.height = `${Math.max(120, Math.min(720, event.data.height))}px`
    }
  }
  window.addEventListener('message', message)
  window.addEventListener('hashchange', jump)
  const blur = () => setTimeout(pump, 0)
  window.addEventListener('focus', blur)
  jump()
  const dispose = () => {
    disposed = true
    document.documentElement.classList.remove('xw-gallery-page')
    observer?.disconnect()
    window.removeEventListener('message', message)
    window.removeEventListener('hashchange', jump)
    window.removeEventListener('focus', blur)
    window.removeEventListener('pagehide', dispose)
    for (const card of cards) {
      clearTimeout(card.timer)
      card.frame?.contentWindow?.postMessage(
        { workshop: 1, type: 'dispose', token: card.token },
        location.origin,
      )

      card.frame?.remove()
    }
  }
  options.hot?.on?.('vite:afterUpdate', () => location.reload())
  window.addEventListener('pagehide', dispose)
  return dispose
}
