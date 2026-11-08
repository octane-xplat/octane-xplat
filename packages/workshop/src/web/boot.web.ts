import { WorkshopSession } from '../session'
import { createWebStageHost } from './mount.web'
import { startWorkshop, type WorkshopBootOptions } from './entry.web'
import { startGallery } from './gallery.web'
import { resolveDefinition } from './entry.web'

/** Start the gallery, inspector, or isolated preview according to URL state. */
export function bootWorkshop(options: WorkshopBootOptions): void {
  // A cached document has already released its sessions on pagehide.
  // Start fresh when browser history restores that document.
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      location.reload()
    }
  })

  const params = new URLSearchParams(location.search)
  const view =
    params.get('view') ??
    (params.has('story') || location.hash.startsWith('#/story/')
      ? 'story'
      : (options.defaultView ?? 'story'))

  if (view === 'gallery') {
    startGallery(options)
    return
  }

  const story = params.get('story') ?? options.initialStoryId

  if (view !== 'frame') {
    const runtime = startWorkshop({ ...options, initialStoryId: story })

    window.addEventListener(
      'pagehide',
      () => {
        void runtime.session.dispose()
      },
      { once: true },
    )

    return
  }

  const token = params.get('token')
  const host = document.getElementById('workshop-root') ?? document.body

  host.replaceChildren()
  host.className = 'xw-frame-stage'
  host.style.cssText = 'padding:16px;box-sizing:border-box;min-height:120px'

  const session = new WorkshopSession({
    host: createWebStageHost(host),
    target: options.target,
    globalProviders: options.globalProviders ?? [],
  })

  let disposed = false
  const send = (type: string, extra: Record<string, unknown> = {}) =>
    parent.postMessage({ workshop: 1, type, token, ...extra }, location.origin)

  const unsubscribe = session.subscribe((state) => {
    if (state.failure) {
      send('error', { message: String(state.failure) })
    }
  })

  const resize =
    typeof ResizeObserver === 'undefined'
      ? undefined
      : new ResizeObserver(() => send('height', { height: host.scrollHeight }))

  resize?.observe(host)

  const dispose = async () => {
    if (disposed) {
      return
    }

    disposed = true
    resize?.disconnect()
    unsubscribe()
    window.removeEventListener('message', message)
    window.removeEventListener('pagehide', onHide)
    await session.dispose()
    if (session.state.failure) {
      send('error')
    } else {
      send('disposed')
    }
  }

  const message = (event: MessageEvent) => {
    if (
      event.source !== parent ||
      event.origin !== location.origin ||
      event.data?.workshop !== 1 ||
      event.data?.token !== token
    ) {
      return
    }

    if (event.data.type === 'dispose') {
      void dispose()
    }

    if (event.data.type === 'reset' && !disposed) {
      void session.reset().then(() =>
        send(session.state.failure ? 'error' : 'ready', {
          message: String(session.state.failure ?? ''),
        }),
      )
    }
  }

  const onHide = () => {
    void dispose()
  }

  window.addEventListener('message', message)
  window.addEventListener('pagehide', onHide)
  void (async () => {
    try {
      const entry = options.catalog.find((item) => item.id === story && item.load)

      if (!entry?.load) {
        throw new Error('Story is unavailable on this target')
      }

      const loaded = await entry.load()

      if (disposed) {
        return
      }

      await session.select(resolveDefinition(loaded, entry))
      send(session.state.failure ? 'error' : 'ready', {
        message: String(session.state.failure ?? ''),
      })

      send('height', { height: host.scrollHeight })
    } catch (error) {
      host.textContent = error instanceof Error ? error.message : 'Preview failed'
      send('error')
    }
  })()
}
