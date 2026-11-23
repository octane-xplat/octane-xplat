/** @jsxImportSource @octane-xplat/jsx/dom */
import { App } from '@octane-xplat/devtools/panel'
import { useMemo, useState } from 'octane'
import plugins from 'virtual:octane-devtools-panels'
import { createPreviewHub, previewRecord, type Scenario } from './hub.ts'
import './preview.css'

const scenarios: Record<Scenario, string> = {
  live: 'Connected',
  empty: 'Connected without targets',
  connecting: 'Connecting',
  closed: 'Disconnected',
}

export function Preview() @{
  const [scenario, setScenario] = useState<Scenario>('live')
  const [hub, setHub] = useState(createPreviewHub)
  const [failActions, setFailActions] = useState(false)
  const socket = useMemo(() => hub.socketFor(scenario), [hub, scenario])

  const reset = () => {
    setHub(createPreviewHub())
    setScenario('live')
    setFailActions(false)
  }

  <div className="dt-shell">
    <header className="dt-header preview-controls">
      <label className="preview-control">
        Simulated connection
        <select
          className="dt-select"
          value={scenario}
          onChange={(event) => {
            const value = event.currentTarget.value

            if (
              value === 'live' ||
              value === 'empty' ||
              value === 'connecting' ||
              value === 'closed'
            ) {
              setScenario(value)
            }
          }}
        >
          @for (const [value, label] of Object.entries(scenarios); key value) {
            <option {value}>{label}</option>
          }
        </select>
      </label>
      <label className="preview-control">
        <input
          type="checkbox"
          checked={failActions}
          onChange={(event) => {
            const checked = event.currentTarget.checked

            hub.setActionFailure(checked)
            setFailActions(checked)
          }}
        />
        Fail actions
      </label>
      <button className="dt-refresh" type="button" onClick={reset}>
        Reset scenario
      </button>
    </header>
    <main className="preview-panel">
      <App record={previewRecord} {socket} {plugins} />
    </main>
  </div>
}
