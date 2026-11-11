import type {
  AppToServer,
  PanelEntry,
  PanelToServer,
  ServerToApp,
  ServerToPanel,
  PanelStyleEntry,
  ServerToAppStyles,
  StyleDraft,
  StyleEntry,
  StyleValue,
  TweakEntry,
  UnmountedDirtyEntry,
  TweakValue,
} from '../protocol.ts'

// The transport port this server rides. Structurally the backend half of
// @octane-xplat/devtools/backend's DevBackend<In, Out> — declared here rather
// than type-imported so the unit tests can drive it with a plain fake.
export interface TweaksPort {
  // `data` is the inbound union on both directions — DevBackend types its
  // In parameter once for app+panel frames; handlers narrow by `from`.
  subscribe(
    listener: (
      message:
        | { from: 'app'; session: string; data: AppToServer | PanelToServer }
        | { from: 'panel'; panel: string; data: AppToServer | PanelToServer },
    ) => void,
  ): () => void
  onSessions(
    listener: (
      sessions: readonly {
        sessionId: string
        platform: string
        state: string
        channels: { id: string; version: number }[]
      }[],
    ) => void,
  ): () => void
  sendToApp(session: string | '*', data: ServerToApp): boolean
  sendToPanels(data: ServerToPanel, panel?: string): boolean
  onError?(listener: (error: { code: string }) => void): () => void
  close(): void
}

export interface SaveReport {
  ok: boolean
  saved: string[]
  errors: { id?: string; file: string; message: string }[]
}

export interface SavePreviewReport {
  files: { file: string; diff: string }[]
  truncated: boolean
  errors: { id?: string; file: string; message: string }[]
}

export interface ServerDeps {
  root: string
  name: string
  getEntry(id: string): TweakEntry | undefined
  getStyleEntry(id: string): StyleEntry | undefined
  compileStyle?(id: string, draft: StyleDraft): Promise<{ className: string; css: string } | null>
  save(): Promise<SaveReport>
  savePreview?(): Promise<SavePreviewReport>
  log(message: string): void
}

/**
 * Protocol hub riding a devtools `tweaks` backend channel (protocol v5). Owns
 * the mounted bookkeeping, the override map, and panel fan-out; source
 * writeback is delegated to deps.save(). Hub session ids are clientIds and a
 * session's platform is its label.
 */
export class TweaksServer {
  private picking = false
  // sessionId → platform label, for sessions that declared the tweaks channel.
  private sessions = new Map<string, string>()
  private mountedBy = new Map<string, Set<string>>()
  private runtimeValues = new Map<string, TweakValue>()
  /** The override map broadcast to apps; absence of an id means "no override". */
  readonly overrides = new Map<string, TweakValue>()
  /** Style drafts per site id; an empty draft means "reverted". */
  readonly styleDrafts = new Map<string, StyleDraft>()
  private stylePreviewFailed = new Set<string>()
  private styleCompiled = new Map<string, { className: string; css: string }>()
  private styleCompiledSig = new Map<string, string>()
  private saving = false
  private deps: ServerDeps
  private port: TweaksPort

  constructor(deps: ServerDeps, port: TweaksPort) {
    this.deps = deps
    this.port = port
    port.subscribe((message) => {
      if (message.from === 'app') {
        this.onAppMessage(message.session, message.data as AppToServer)
      } else {
        void this.onPanelMessage(message.panel, message.data as PanelToServer)
      }
    })

    port.onSessions((sessions) => this.onSessions(sessions))
    port.onError?.((error) => {
      // Hub frames are capped at 256 KiB — surface an oversize state/values
      // drop instead of silently losing it.
      if (error.code === 'oversize') {
        this.deps.log('[tweaks] hub dropped an oversize frame')
      }
    })
  }

  private onSessions(
    snapshots: readonly {
      sessionId: string
      platform: string
      state: string
      channels: { id: string; version: number }[]
    }[],
  ) {
    const live = new Map<string, string>()

    for (const s of snapshots) {
      if (s.state === 'disconnected') {
        continue
      }

      if (!s.channels.some((c) => c.id === 'tweaks')) {
        continue
      }

      live.set(s.sessionId, s.platform)
    }

    // Newly-seen tweaks sessions get what the old socket's on-connect sent.
    for (const [sessionId] of live) {
      if (this.sessions.has(sessionId)) {
        continue
      }

      void this.buildStyleValues().then((styles) => {
        this.sendToApp(sessionId, {
          type: 'values',
          values: Object.fromEntries(this.overrides),
          styles,
        })

        if (this.picking) {
          this.sendToApp(sessionId, { type: 'pick', active: true })
        }
      })
    }

    // A session that vanished, went disconnected, or stopped declaring the
    // channel drops its mounts — what a socket close did.
    let changed = false

    for (const sessionId of this.sessions.keys()) {
      if (live.has(sessionId)) {
        continue
      }

      for (const [id, clients] of this.mountedBy) {
        if (clients.delete(sessionId) && !clients.size) {
          this.mountedBy.delete(id)
          changed = true
        } else if (clients.size) {
          changed = true
        }
      }
    }

    const sessionsChanged =
      this.sessions.size !== live.size || [...live.keys()].some((id) => !this.sessions.has(id))

    this.sessions = live
    if (changed || sessionsChanged) {
      this.broadcastState()
    }
  }

  private onAppMessage(sessionId: string, message: AppToServer) {
    if (message.type === 'mount') {
      for (const { id, value } of message.mounts) {
        let clients = this.mountedBy.get(id)

        if (!clients) {
          this.mountedBy.set(id, (clients = new Set()))
        }

        clients.add(sessionId)
        if (!this.runtimeValues.has(id)) {
          this.runtimeValues.set(id, value)
        }
      }

      this.broadcastState()
    } else if (message.type === 'unmount') {
      for (const id of message.ids) {
        const clients = this.mountedBy.get(id)

        if (clients?.delete(sessionId) && !clients.size) {
          this.mountedBy.delete(id)
        }
      }

      this.broadcastState()
    } else if (message.type === 'picked') {
      // Only honored while picking; ids filtered to mounted style sites.
      if (!this.picking) {
        return
      }

      this.picking = false
      this.broadcastPick(false)

      const mountedStyles = new Set(
        [...this.mountedBy.keys()].filter((id) => this.deps.getStyleEntry?.(id)),
      )

      const ids = message.ids.filter((id) => mountedStyles.has(id))

      this.port.sendToPanels({ type: 'picked', clientId: sessionId, ids })
      this.broadcastState()
    }
  }

  private sendToApp(sessionId: string, message: ServerToApp) {
    try {
      this.port.sendToApp(sessionId, message)
    } catch {
      // ignore dead sessions
    }
  }

  private broadcastPick(active: boolean) {
    this.sendToApp('*', { type: 'pick', active })
  }

  private async onPanelMessage(panel: string, message: PanelToServer) {
    if (message.type === 'hello') {
      this.sendToPanel(this.stateMessage(), panel)
      return
    }

    if (message.type === 'pick') {
      this.picking = !!message.active
      this.broadcastPick(this.picking)
      // The backend cannot see panel disconnects — the panel sends
      // pick:false on unmount instead.
      this.broadcastState()
      return
    }

    if (message.type === 'set') {
      const entry = this.deps.getEntry(message.id)

      if (!entry || !this.validValue(entry, message.value)) {
        this.deps.log(`[tweaks] ignoring invalid set for ${message.id}`)
        return
      }

      this.overrides.set(message.id, message.value)
      void this.asyncBroadcastValues()
      this.broadcastState()
    } else if (message.type === 'styleSet') {
      const entry = this.deps.getStyleEntry(message.id)
      const valid =
        entry &&
        entry.writable &&
        Array.isArray(message.path) &&
        message.path.length > 0 &&
        message.path.every((p) => typeof p === 'string' && p.length > 0) &&
        (typeof message.value === 'string' || typeof message.value === 'number') &&
        (entry.kind !== 'inline' || message.path.length === 1) &&
        // An added property can't target a path under a read-only/dynamic one.
        !entry.properties.some(
          (p) =>
            !p.editable &&
            p.path.length < message.path.length &&
            message.path.slice(0, p.path.length).join('.') === p.path.join('.'),
        )

      if (!valid) {
        this.deps.log(`[tweaks] ignoring invalid styleSet for ${message.id}`)
        return
      }

      const draft = this.styleDrafts.get(message.id) ?? { set: {}, delete: [] }

      draft.set[message.path.join('.')] = message.value
      // Setting a deleted property is also the panel's Restore operation.
      draft.delete = draft.delete.filter((key) => key !== message.path.join('.'))
      this.styleDrafts.set(message.id, draft)
      await this.refreshStyleCompiles()
      void this.asyncBroadcastValues()
      this.broadcastState()
    } else if (message.type === 'styleDelete') {
      const entry = this.deps.getStyleEntry(message.id)
      const key = message.path?.join('.')
      const existing = entry?.properties.find((p) => p.path.join('.') === key)
      const draft = this.styleDrafts.get(message.id)
      const valid =
        entry &&
        entry.writable &&
        Array.isArray(message.path) &&
        message.path.length > 0 &&
        message.path.every((p) => typeof p === 'string' && p.length > 0) &&
        (entry.kind !== 'inline' || message.path.length === 1) &&
        (existing?.editable || (draft && key! in draft.set))

      if (!valid) {
        this.deps.log(`[tweaks] ignoring invalid styleDelete for ${message.id}`)
        return
      }

      const d = draft ?? { set: {}, delete: [] }

      delete d.set[key!]
      // Deleting a source property removes it even after an edit. A draft
      // addition has no source row to delete: dropping its set is enough.
      if (existing?.editable && !d.delete.includes(key!)) {
        d.delete.push(key!)
      }

      this.styleDrafts.set(message.id, d)
      await this.refreshStyleCompiles()
      void this.asyncBroadcastValues()
      this.broadcastState()
    } else if (message.type === 'revert') {
      // Omitted ids = all dirty overrides, mounted or not — matching Save's scope.
      const dirtyStyle = [...this.styleDrafts.keys()].filter((id) => this.isStyleDirty(id))
      const ids =
        message.ids ??
        [...this.overrides.keys()].filter((id) => this.isDirty(id)).concat(dirtyStyle)

      for (const id of ids) {
        if (this.styleDrafts.has(id)) {
          this.styleDrafts.delete(id)
          continue
        }

        const entry = this.deps.getEntry(id)

        // Deliberately set the override to the source literal rather than
        // deleting it: after a Save with HMR suppressed, the running module
        // still holds the old literal — deleting would snap back to stale code.
        if (entry && entry.value !== null) {
          this.overrides.set(id, entry.value)
        } else {
          this.overrides.delete(id)
        }
      }

      void this.asyncBroadcastValues()
      this.broadcastState()
    } else if (message.type === 'savePreview') {
      if (!this.deps.savePreview) {
        return
      }

      if (this.saving) {
        this.sendToPanel(
          {
            type: 'savePreview',
            files: [],
            truncated: false,
            errors: [{ file: '', message: 'busy: a save is already in progress' }],
          },
          panel,
        )

        return
      }

      const report = await this.deps.savePreview()

      this.sendToPanel({ type: 'savePreview', ...report }, panel)
    } else if (message.type === 'save') {
      if (this.saving) {
        this.sendToPanel(
          {
            type: 'saveResult',
            ok: false,
            saved: [],
            errors: [{ file: '', message: 'busy: a save is already in progress' }],
          },
          panel,
        )

        return
      }

      this.saving = true
      try {
        const report = await this.deps.save()

        this.sendToPanel({ type: 'saveResult', ...report }, panel)
        this.broadcastState()
      } finally {
        this.saving = false
      }
    }
  }

  private isDirty(id: string): boolean {
    const entry = this.deps.getEntry(id)
    const override = this.overrides.get(id)

    return override !== undefined && override !== (entry?.value ?? null)
  }

  private isStyleDirty(id: string): boolean {
    const d = this.styleDrafts.get(id)

    if (!d) {
      return false
    }

    // Dirty = draft differs from the source properties. After save the
    // refreshed manifest's literals equal the draft, so this goes false
    // while the draft (and its live preview) is kept.
    const source = new Map(
      (this.deps.getStyleEntry(id)?.properties ?? []).map((p) => [p.path.join('.'), p.value]),
    )

    for (const [k, v] of Object.entries(d.set)) {
      if (!source.has(k) || source.get(k) !== v) {
        return true
      }
    }

    for (const k of d.delete) {
      if (source.has(k)) {
        return true
      }
    }

    return false
  }

  private validValue(entry: TweakEntry, value: TweakValue): boolean {
    switch (entry.input.type) {
      case 'number':
        return typeof value === 'number' && Number.isFinite(value)
      case 'boolean':
        return typeof value === 'boolean'
      case 'string':
        return typeof value === 'string'
      case 'color':
        return (
          typeof value === 'string' && /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)
        )
      case 'select':
        return (
          (typeof value === 'string' || typeof value === 'number') &&
          (entry.input.options as readonly (string | number)[]).includes(value)
        )
    }
  }

  private stateMessage(): ServerToPanel {
    const entries: PanelEntry[] = []

    for (const [id, clients] of this.mountedBy) {
      if (!clients.size) {
        continue
      }

      // Style sites mount through the same table but render under styles.
      if (this.deps.getStyleEntry?.(id)) {
        continue
      }

      const entry = this.deps.getEntry(id)
      const override = this.overrides.get(id) ?? null
      const base: TweakEntry = entry ??
        // Mounted but not in the manifest (e.g. transformed before this
        // server saw the file): synthesize a read-only row from the id.
        {
          id,
          file: id.split('#')[0],
          name: id.split('#')[1] ?? id,
          group: null,
          input: { type: 'string' },
          value: null,
          writable: false,
          reason: 'entry not in manifest',
        }

      entries.push({
        ...base,
        runtimeValue: this.runtimeValues.get(id) ?? (base.value as TweakValue) ?? '',
        override,
        dirty: override !== null && override !== base.value,
        mountedBy: [...clients],
      })
    }

    const styles: PanelStyleEntry[] = []

    for (const id of [...this.mountedBy.keys()]) {
      const entry = this.deps.getStyleEntry(id)

      if (!entry) {
        continue
      }

      const draft = this.styleDrafts.get(id) ?? { set: {}, delete: [] }

      styles.push({
        ...entry,
        draft,
        dirty: this.isStyleDirty(id),
        mountedBy: [...(this.mountedBy.get(id) ?? [])],
        preview:
          entry.kind === 'bamboo' && this.stylePreviewFailed.has(id) ? 'unavailable' : 'live',
      })
    }

    const unmountedDirty: UnmountedDirtyEntry[] = []

    for (const id of [...this.styleDrafts.keys()]) {
      if (this.mountedBy.get(id)?.size) {
        continue
      }

      if (!this.isStyleDirty(id)) {
        continue
      }

      const entry = this.deps.getStyleEntry(id)

      if (!entry) {
        continue
      }

      unmountedDirty.push({
        id,
        kind: 'style',
        file: entry.file,
        name: entry.label,
        group: null,
        override: JSON.stringify(this.styleDrafts.get(id)),
        value: null,
      })
    }

    for (const [id, override] of this.overrides) {
      if (this.mountedBy.get(id)?.size) {
        continue
      }

      if (!this.isDirty(id)) {
        continue
      }

      const entry = this.deps.getEntry(id)

      unmountedDirty.push({
        id,
        kind: 'tweak',
        file: entry?.file ?? id.split('#')[0],
        name: entry?.name ?? id.split('#')[1] ?? id,
        group: entry?.group ?? null,
        override,
        value: entry?.value ?? null,
      })
    }

    return {
      type: 'state',
      server: { name: this.deps.name, root: this.deps.root },
      clients: [...this.sessions].map(([clientId, label]) => ({ clientId, label })),
      entries,
      unmountedDirty,
      styles,
      picking: this.picking,
    }
  }

  private sendToPanel(message: ServerToPanel, panel?: string) {
    try {
      this.port.sendToPanels(message, panel)
    } catch {
      // ignore dead panels
    }
  }

  private async buildStyleValues(): Promise<ServerToAppStyles> {
    const styles: ServerToAppStyles = {}

    for (const [id, draft] of this.styleDrafts) {
      const entry = this.deps.getStyleEntry(id)

      if (entry?.kind === 'inline') {
        styles[id] = { kind: 'inline', set: draft.set, delete: draft.delete }
      } else if (entry?.kind === 'bamboo' && this.deps.compileStyle) {
        const compiled = this.styleCompiled.get(id)

        if (compiled && JSON.stringify(compiled) !== '__stale__') {
          styles[id] = { kind: 'bamboo', className: compiled.className, css: compiled.css }
        }
      }
    }

    return styles
  }

  // Compile dirty bamboo drafts before broadcasting so values carries
  // {className, css}; a failure marks the site's preview 'unavailable'.
  private async refreshStyleCompiles() {
    if (!this.deps.compileStyle) {
      return
    }

    for (const [id, draft] of this.styleDrafts) {
      const entry = this.deps.getStyleEntry(id)

      if (entry?.kind !== 'bamboo') {
        continue
      }

      const sig = JSON.stringify(draft)
      const cached = this.styleCompiledSig.get(id)

      if (cached === sig) {
        continue
      }

      const result = await this.deps.compileStyle(id, draft)

      if (result) {
        this.styleCompiled.set(id, result)
        this.styleCompiledSig.set(id, sig)
        this.stylePreviewFailed.delete(id)
      } else {
        this.stylePreviewFailed.add(id)
      }
    }
  }

  private asyncBroadcastValues() {
    void this.buildStyleValues().then((styles) => {
      this.sendToApp('*', {
        type: 'values',
        values: Object.fromEntries(this.overrides),
        styles,
      })
    })
  }

  private broadcastState() {
    this.sendToPanel(this.stateMessage())
  }

  close() {
    this.port.close()
  }
}
