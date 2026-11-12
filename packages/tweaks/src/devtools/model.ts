// Panel-side tweaks model — the Tweaks devtools tab's brain. Same state,
// draft, save-preview and pick bookkeeping as the retired standalone desktop
// model, but transport is the devtools panel connection: sends go through
// `sendToBackend('tweaks', targetId, msg)` and receives are `from: 'backend'`
// channel frames for the selected target. There is no socket to manage — the
// App owns the hub connection; this model only tracks which `tweaks` backend
// target to talk to and re-sends `hello` whenever it (re)appears.
import type { ReadableStore } from '@octane-xplat/ui/data'
import type { BackendRef, DevtoolsConnection, SessionSnapshot } from '@octane-xplat/devtools/panel'
import type {
  EditorScope,
  PanelEntry,
  PanelStyleEntry,
  PanelToServer,
  ServerToPanel,
  StyleValue,
  TweakInput,
  TweakValue,
  UnmountedDirtyEntry,
} from '../protocol.ts'

export const HEX_COLOR_RE = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i

const CHANNEL = 'tweaks'

/** The slice of the devtools connection the model needs — the full
 *  DevtoolsConnection satisfies it; tests fake only this surface. */
export type TweaksPanelPort = Pick<
  DevtoolsConnection,
  | 'state'
  | 'sessions'
  | 'backends'
  | 'sendToBackend'
  | 'subscribe'
  | 'onSessions'
  | 'onBackends'
  | 'onState'
>

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected'

export interface SavePreview {
  files: { file: string; diff: string }[]
  truncated: boolean
  errors: { id?: string; file: string; message: string }[]
}

export interface PanelSnapshot {
  status: ConnectionStatus
  targetId: string | null
  backends: readonly BackendRef[]
  clients: { clientId: string; label: string }[]
  entries: PanelEntry[]
  styles: PanelStyleEntry[]
  unmountedDirty: UnmountedDirtyEntry[]
  saving: boolean
  saveResult: {
    ok: boolean
    saved: string[]
    errors: { id?: string; file: string; message: string }[]
  } | null
  preview: SavePreview | null
  previewing: boolean
  // Drafts changed on the server after the preview was computed — Confirm is
  // disabled until a fresh preview is requested.
  previewStale: boolean
  serverName: string | null
  serverRoot: string | null
  picking: boolean
}

// Pure panel model: target selection, the latest backend `state` message,
// input→send validation, save-result tracking. No UI, no host APIs —
// unit-testable under plain node.
export class TweaksPanelModel {
  // Bumped on every notify so Octane components can useStore(model.tick$).
  private tick = 0
  readonly tick$: ReadableStore<number> = {
    getSnapshot: () => this.tick,
    subscribe: (listener) => this.subscribe(listener),
  }

  private listeners = new Set<() => void>()
  private readonly conn: TweaksPanelPort
  private readonly unsubs: (() => void)[] = []
  private connState: 'connecting' | 'live' | 'closed'

  targetId: string | null = null
  backends: readonly BackendRef[] = []
  sessions: readonly SessionSnapshot[] = []
  // The selected backend is currently listed — hello was sent for this
  // appearance, so a state reply is in flight or received.
  private backendSeen = false
  private gotState = false

  clients: PanelSnapshot['clients'] = []
  entries: PanelEntry[] = []
  styles: PanelStyleEntry[] = []
  unmountedDirty: UnmountedDirtyEntry[] = []
  picking = false
  // ids from the last picked message; null = no filter ([] cancel keeps null).
  pickFilter: string[] | null = null
  saving = false
  saveResult: PanelSnapshot['saveResult'] = null
  preview: SavePreview | null = null
  previewing = false
  previewStale = false
  private previewFingerprint = ''
  serverName: string | null = null
  serverRoot: string | null = null

  readonly scope: EditorScope

  constructor(conn: TweaksPanelPort, scope: EditorScope = 'tweaks') {
    this.scope = scope
    this.conn = conn
    this.connState = conn.state
    this.sessions = conn.sessions()
  }

  // Called from a mount effect — subscriptions are host-side work, so the
  // constructor stays render-safe like the devtools PanelModel's.
  start() {
    if (this.unsubs.length) {
      return
    }

    const conn = this.conn

    this.unsubs.push(
      conn.subscribe((message) => {
        if (
          message.channel === CHANNEL &&
          message.from === 'backend' &&
          message.targetId === this.targetId
        ) {
          this.onMessage(message.data)
        }
      }),
      conn.onBackends((backends) => this.syncBackends(backends)),
      conn.onSessions((sessions) => {
        this.sessions = sessions
        this.notify()
      }),
      conn.onState((state) => {
        this.connState = state
        if (state === 'live') {
          // `ready` seeds backends()/sessions() without firing onBackends/
          // onSessions — re-read so a panel mounted during 'connecting'
          // still sees the snapshot.
          this.sessions = this.conn.sessions()
          this.syncBackends(this.conn.backends())
          if (this.targetId && this.backendSeen) {
            this.hello()
          }
        }

        if (state === 'closed') {
          this.failSave()
        }

        this.notify()
      }),
    )

    this.syncBackends(conn.backends())
  }

  get status(): ConnectionStatus {
    if (!this.targetId) {
      return 'idle'
    }

    if (this.connState !== 'live' || !this.backendSeen) {
      return 'disconnected'
    }

    return this.gotState ? 'connected' : 'connecting'
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify() {
    this.tick += 1
    for (const listener of this.listeners) {
      listener()
    }
  }

  snapshot(): PanelSnapshot {
    return {
      status: this.status,
      targetId: this.targetId,
      backends: this.backends,
      clients: this.clients,
      entries: this.entries,
      styles: this.styles,
      unmountedDirty: this.unmountedDirty,
      saving: this.saving,
      picking: this.picking,
      saveResult: this.saveResult,
      preview: this.preview,
      previewing: this.previewing,
      previewStale: this.previewStale,
      serverName: this.serverName,
      serverRoot: this.serverRoot,
    }
  }

  // Panel unmount: the backend cannot observe panel disconnects, so an
  // in-progress pick must be cancelled from here.
  dispose() {
    if (this.picking) {
      this.send({ type: 'pick', active: false })
    }

    for (const unsub of this.unsubs) {
      unsub()
    }

    this.unsubs.length = 0
  }

  // Target selection — clears per-target state, then opens with hello when
  // the backend is listed and the connection is live.
  select(targetId: string) {
    this.targetId = targetId
    this.gotState = false
    this.clients = []
    this.entries = []
    this.styles = []
    this.unmountedDirty = []
    this.pickFilter = null
    this.picking = false
    this.saving = false
    this.saveResult = null
    this.preview = null
    this.previewing = false
    this.previewStale = false
    this.serverName = null
    this.serverRoot = null
    this.backendSeen = this.backends.some((b) => b.targetId === targetId)
    if (this.backendSeen) {
      this.hello()
    }

    this.notify()
  }

  // Backend-list driven policy: keep the selected target while it is listed
  // (reappearing after a dev restart re-sends hello); auto-select only when
  // nothing is chosen and exactly one tweaks backend exists.
  syncBackends(all: readonly BackendRef[]) {
    const tweaks = all.filter((b) => b.channel === CHANNEL)

    this.backends = tweaks

    if (this.targetId) {
      const present = tweaks.some((b) => b.targetId === this.targetId)

      if (present && !this.backendSeen) {
        this.backendSeen = true
        this.hello()
      } else if (!present && this.backendSeen) {
        this.backendSeen = false
        this.failSave()
      }
    } else if (tweaks.length === 1) {
      this.select(tweaks[0].targetId)
      return // select already notified
    }

    this.notify()
  }

  // Selector label: the target id plus the platform of a session on that
  // target when one is known.
  targetLabel(ref: BackendRef): string {
    const session = this.sessions.find((s) => s.targetId === ref.targetId)

    return session ? `${ref.targetId} — ${session.platform}` : ref.targetId
  }

  private hello() {
    if (this.targetId && this.connState === 'live') {
      this.send({ type: 'hello' })
    }
  }

  // A save in flight when its backend went away — the write may or may not
  // have landed, so release the busy flag with a check-source error rather
  // than claiming success.
  private failSave() {
    if (this.saving) {
      this.saving = false
      this.saveResult = {
        ok: false,
        saved: [],
        errors: [
          { file: '', message: 'Connection lost while saving. Check source before retrying.' },
        ],
      }
    }
  }

  private onMessage(data: unknown) {
    if (typeof data !== 'object' || data === null) {
      return
    }

    // The single documented boundary assertion: hub channel payloads are
    // already JSON; field validation happens on the narrowed type union.
    const message = data as ServerToPanel

    if (message.type === 'picked' && this.scope === 'styles') {
      this.pickFilter = message.ids.length ? message.ids : null
      this.notify()
      return
    }

    if (message.type === 'state') {
      this.gotState = true
      this.serverName = message.server.name
      this.serverRoot = message.server.root
      this.clients = message.clients
      this.entries = this.scope === 'tweaks' ? message.entries : []
      this.styles = this.scope === 'styles' ? (message.styles ?? []) : []
      this.unmountedDirty = (message.unmountedDirty ?? []).filter((entry) =>
        this.scope === 'styles' ? entry.kind === 'style' : entry.kind === 'tweak',
      )

      this.picking = this.scope === 'styles' && (message.picking ?? false)
      // Prune filter ids whose site is no longer mounted.
      if (this.pickFilter) {
        const mounted = new Set(this.styles.map((s) => s.id))

        this.pickFilter = this.pickFilter.filter((id) => mounted.has(id))
        if (!this.pickFilter.length) {
          this.pickFilter = null
        }
      }

      if (this.preview && this.dirtyFingerprint() !== this.previewFingerprint) {
        this.previewStale = true
      }

      this.notify()
    } else if (message.type === 'saveResult' && message.scope === this.scope && this.saving) {
      this.saving = false
      this.saveResult = { ok: message.ok, saved: message.saved, errors: message.errors }
      this.notify()
    } else if (message.type === 'savePreview' && message.scope === this.scope && this.previewing) {
      this.previewing = false
      // A late response racing a Confirm must not reopen the view.
      if (this.saving) {
        this.notify()
        return
      }

      this.preview = {
        files: message.files ?? [],
        truncated: message.truncated ?? false,
        errors: message.errors ?? [],
      }

      this.previewStale = this.dirtyFingerprint() !== this.previewFingerprint
      this.notify()
    }
  }

  private send(message: PanelToServer) {
    if (this.targetId) {
      this.conn.sendToBackend(CHANNEL, this.targetId, message)
    }
  }

  // True when `value` is a legal payload for the entry's input type.
  validValue(entry: PanelEntry, value: TweakValue): boolean {
    return validateForInput(entry.input, value)
  }

  set(id: string, value: TweakValue): boolean {
    const entry = this.entries.find((e) => e.id === id)

    if (!entry || !this.validValue(entry, value)) {
      return false
    }

    this.saveResult = null
    this.send({ type: 'set', id, value })
    return true
  }

  revert(id: string) {
    this.saveResult = null
    this.send({ type: 'revert', scope: this.scope, ids: [id] })
  }

  revertAll() {
    this.saveResult = null
    this.send({ type: 'revert', scope: this.scope })
  }

  save() {
    if (this.saving || this.dirtyCount() === 0) {
      return
    }

    this.saving = true
    this.saveResult = null
    this.send({ type: 'save', scope: this.scope })
    this.notify()
  }

  // Optional protocol capability; the editor uses direct save().
  requestPreview() {
    if (this.previewing || this.saving || this.dirtyCount() === 0) {
      return
    }

    this.previewing = true
    this.previewStale = false
    this.previewFingerprint = this.dirtyFingerprint()
    this.send({ type: 'savePreview', scope: this.scope })
    this.notify()
  }

  cancelPreview() {
    this.preview = null
    this.previewStale = false
    this.notify()
  }

  // Confirm the previewed plan: run the existing save. Refuses a stale
  // preview — drafts changed since it was computed.
  confirmSave() {
    if (!this.preview || this.previewStale || this.saving) {
      return
    }

    this.preview = null
    this.save()
  }

  // What the preview was computed against: every override/draft the panel
  // knows about. Compared on later state messages to flag a stale preview.
  private dirtyFingerprint(): string {
    return JSON.stringify({
      overrides: this.entries.map((e) => [e.id, e.override]),
      styles: this.styles.map((s) => [s.id, s.draft]),
      unmounted: this.unmountedDirty.map((u) => [u.id, u.override]),
    })
  }

  pick(active: boolean) {
    this.send({ type: 'pick', active })
  }

  clearPickFilter() {
    this.pickFilter = null
    this.notify()
  }

  dirtyCount(): number {
    return (
      this.entries.filter((e) => e.dirty).length +
      this.styles.filter((e) => e.dirty).length +
      this.unmountedDirty.length
    )
  }

  // ---- Style sites ---------------------------------------------------------

  // The value a property row shows: draft override, else the source literal.
  stylePropValue(site: PanelStyleEntry, path: string[]): StyleValue | null {
    const key = path.join('.')

    if (key in site.draft.set) {
      return site.draft.set[key]
    }

    return site.properties.find((p) => p.path.join('.') === key)?.value ?? null
  }

  // Draft-deleted paths (for the struck "deleted" display).
  stylePropDeleted(site: PanelStyleEntry, path: string[]): boolean {
    return site.draft.delete.includes(path.join('.'))
  }

  // Draft-added paths not present in the source properties.
  styleAddedPaths(site: PanelStyleEntry): string[] {
    const have = new Set(site.properties.map((p) => p.path.join('.')))

    return Object.keys(site.draft.set).filter((k) => !have.has(k))
  }

  styleSet(id: string, path: string[], text: string): boolean {
    const site = this.styles.find((e) => e.id === id)

    if (!site || !site.writable || !path.length || path.some((p) => !p)) {
      return false
    }

    this.saveResult = null

    const original = site.properties.find((p) => p.path.join('.') === path.join('.'))
    // Numbers stay numbers when the source was numeric and the text parses.
    const parsed = Number(text)
    const value: StyleValue =
      typeof original?.value === 'number' && Number.isFinite(parsed) ? parsed : text

    this.send({ type: 'styleSet', id, path, value })
    return true
  }

  styleDelete(id: string, path: string[]) {
    this.saveResult = null
    this.send({ type: 'styleDelete', id, path })
  }

  // Restore changed/deleted literals; restoring a new property removes it.
  styleRestore(id: string, path: string[]) {
    const site = this.styles.find((e) => e.id === id)
    const original = site?.properties.find((p) => p.path.join('.') === path.join('.'))

    if (original?.value != null) {
      this.saveResult = null
      this.send({ type: 'styleSet', id, path, value: original.value })
    } else if (!original && site && path.join('.') in site.draft.set) {
      this.styleDelete(id, path)
    }
  }

  // Add-property name validation: non-empty segments; inline sites are flat.
  styleAddNameValid(site: PanelStyleEntry, name: string): boolean {
    if (!name.trim()) {
      return false
    }

    const segs = name.split('.')

    if (segs.some((p) => !p.trim())) {
      return false
    }

    if (site.kind === 'inline' && segs.length !== 1) {
      return false
    }

    return true
  }

  styleAdd(site: PanelStyleEntry, name: string, text: string) {
    if (!this.styleAddNameValid(site, name)) {
      return false
    }

    return this.styleSet(site.id, name.trim().split('.'), text)
  }

  // Style sites grouped by file for the Styles section; a pick filter
  // narrows the list to the picked ids (in picked order).
  groupedStyles(): { file: string; sites: PanelStyleEntry[] }[] {
    const order = this.pickFilter ? new Map(this.pickFilter.map((id, i) => [id, i])) : null
    const styles = order
      ? order.size
        ? [...this.styles]
            .filter((s) => order.has(s.id))
            .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
        : []
      : this.styles

    const groups = new Map<string, PanelStyleEntry[]>()

    for (const site of styles) {
      let list = groups.get(site.file)

      if (!list) {
        groups.set(site.file, (list = []))
      }

      list.push(site)
    }

    return [...groups].map(([file, sites]) => ({ file, sites }))
  }

  // Grouped + ordered for display: group name first, then entry name.
  groupedEntries(): { group: string; entries: PanelEntry[] }[] {
    const groups = new Map<string, PanelEntry[]>()
    const sorted = [...this.entries].sort((a, b) => {
      const ga = a.group ?? ''
      const gb = b.group ?? ''

      return ga === gb ? a.name.localeCompare(b.name) : ga.localeCompare(gb)
    })

    for (const entry of sorted) {
      const key = entry.group ?? 'General'
      let list = groups.get(key)

      if (!list) {
        groups.set(key, (list = []))
      }

      list.push(entry)
    }

    return [...groups].map(([group, entries]) => ({ group, entries }))
  }
}

export function validateForInput(input: TweakInput, value: TweakValue): boolean {
  switch (input.type) {
    case 'number':
      return typeof value === 'number' && Number.isFinite(value)
    case 'boolean':
      return typeof value === 'boolean'
    case 'string':
      return typeof value === 'string'
    case 'color':
      return typeof value === 'string' && HEX_COLOR_RE.test(value)
    case 'select':
      return (
        (typeof value === 'string' || typeof value === 'number') && input.options.includes(value)
      )
  }
}

// The value a control displays: live override, then the source literal, then
// the last runtime value.
export function displayValue(entry: PanelEntry): TweakValue {
  return entry.override ?? entry.value ?? entry.runtimeValue
}
