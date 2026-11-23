import type {
  PanelEntry,
  PanelStyleEntry,
  PanelToServer,
  ServerToPanel,
  StyleValue,
} from '@octane-xplat/tweaks/protocol'

const file = 'src/Catalog.tsrx'

export type TweaksFixture = {
  receive(message: PanelToServer): ServerToPanel[]
}

export function createTweaksFixture(root: string): TweaksFixture {
  const entry: PanelEntry = {
    id: `${file}#Catalog/Page size`,
    file,
    name: 'Page size',
    group: 'Catalog',
    input: { type: 'number', min: 4, max: 32, step: 4 },
    value: 12,
    runtimeValue: 16,
    override: 16,
    dirty: true,
    writable: true,
    mountedBy: ['web'],
  }

  const style: PanelStyleEntry = {
    id: `${file}#card`,
    file,
    kind: 'inline',
    line: 24,
    label: 'Catalog card',
    properties: [{ path: ['padding'], value: 12, editable: true }],
    draft: { set: { padding: 16 }, delete: [] },
    dirty: true,
    writable: true,
    mountedBy: ['web'],
    preview: 'live',
  }

  function revertTweak() {
    entry.override = null
    entry.runtimeValue = entry.value ?? 12
    entry.dirty = false
  }

  function revertStyle() {
    style.draft = { set: {}, delete: [] }
    style.dirty = false
  }

  function updateStyle(path: string[], value: StyleValue | undefined) {
    const key = path.join('.')
    const saved = style.properties.find((property) => property.path.join('.') === key)

    delete style.draft.set[key]
    style.draft.delete = style.draft.delete.filter((deleted) => deleted !== key)
    if (value === undefined && saved) {
      style.draft.delete.push(key)
    } else if (value !== undefined && value !== saved?.value) {
      style.draft.set[key] = value
    }

    style.dirty = Object.keys(style.draft.set).length > 0 || style.draft.delete.length > 0
  }

  function state(): ServerToPanel {
    return {
      type: 'state',
      server: { name: 'DevTools Preview', root },
      clients: [{ clientId: 'web', label: 'Demo storefront' }],
      entries: [entry],
      styles: [style],
      unmountedDirty: [],
      picking: false,
    }
  }

  return {
    receive(message: PanelToServer): ServerToPanel[] {
      switch (message.type) {
        case 'set':
          if (message.id === entry.id) {
            entry.runtimeValue = message.value
            entry.dirty = message.value !== entry.value
            entry.override = entry.dirty ? message.value : null
          }

          break
        case 'styleSet':
        case 'styleDelete':
          if (message.id === style.id) {
            updateStyle(message.path, message.type === 'styleSet' ? message.value : undefined)
          }

          break
        case 'revert':
          if (message.scope !== 'styles' && (!message.ids || message.ids.includes(entry.id))) {
            revertTweak()
          }

          if (message.scope !== 'tweaks' && (!message.ids || message.ids.includes(style.id))) {
            revertStyle()
          }

          break
        case 'save': {
          const saved = new Set<string>()

          if (message.scope !== 'styles' && entry.dirty) {
            entry.value = entry.runtimeValue
            revertTweak()
            saved.add(entry.file)
          }

          if (message.scope !== 'tweaks' && style.dirty) {
            const properties = new Map(
              style.properties.map((property) => [property.path.join('.'), property]),
            )

            for (const key of style.draft.delete) {
              properties.delete(key)
            }

            for (const [key, value] of Object.entries(style.draft.set)) {
              properties.set(key, { path: key.split('.'), editable: true, value })
            }

            style.properties = [...properties.values()]
            revertStyle()
            saved.add(style.file)
          }

          return [
            { type: 'saveResult', scope: message.scope, ok: true, saved: [...saved], errors: [] },
            state(),
          ]
        }
        case 'pick':
          return [
            { type: 'picked', clientId: 'web', ids: message.active ? [style.id] : [] },
            state(),
          ]
      }

      return [state()]
    },
  }
}
