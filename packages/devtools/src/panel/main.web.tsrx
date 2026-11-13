/** @jsxImportSource @octane-xplat/jsx/dom */
// Web entry for the devtools panel — a thin picker over the shared App: fetch
// /devtools/servers from the hosting dev server, keep the selected record,
// and let App own the connection. Served under /devtools/app/ by `xplat dev`.
import { createRoot, useEffect, useState } from 'octane'
import { App } from './App.tsrx'
import type { ListedDevtoolsServer } from '../record.ts'

async function fetchServers(): Promise<ListedDevtoolsServer[]> {
  try {
    const body = (await (await fetch('/devtools/servers')).json()) as {
      servers?: ListedDevtoolsServer[]
    }

    return Array.isArray(body.servers) ? body.servers : []
  } catch {
    return []
  }
}

function Picker() {
  const [servers, setServers] = useState<ListedDevtoolsServer[]>([])
  const [record, setRecord] = useState<ListedDevtoolsServer | null>(null)

  const refresh = async () => {
    const next = await fetchServers()

    setServers(next)
    setRecord((current) => {
      if (current && next.some((server) => server.key === current.key)) {
        return current
      }

      return next[0] ?? null
    })
  }

  useEffect(() => {
    void refresh()
  }, [])

  return (
    <div className="dt-shell">
      <header className="dt-header">
        <span className="dt-brand">devtools</span>
        <select
          className="dt-select"
          aria-label="Dev server"
          value={record?.key ?? ''}
          onChange={(event) => {
            const key = (event.target as HTMLSelectElement).value

            setRecord(servers.find((server) => server.key === key) ?? null)
          }}
        >
          {servers.length ? (
            servers.map((server) => (
              <option key={server.key} value={server.key}>
                {server.appRoot}
              </option>
            ))
          ) : (
            <option value="">No xplat dev servers found</option>
          )}
        </select>
        <button
          className="dt-refresh"
          title="Rescan dev server records"
          onClick={() => void refresh()}
        >
          Refresh
        </button>
      </header>
      {record ? (
        <App key={record.key} record={record} />
      ) : (
        <div className="dt-empty">Pick a dev server above to connect.</div>
      )}
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<Picker />)
