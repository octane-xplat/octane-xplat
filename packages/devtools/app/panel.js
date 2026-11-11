// Devtools panel — server picker + sessions/actions/logs views driven by
// connectDevtools over the xplat dev hub. Actions go through the reserved
// xplat-actions app channel; logs come from the xplat-logs engine backend.

import { connectDevtools } from '../dist/client.js'

const state = {
  servers: [],
  record: null,
  conn: null,
  sessions: [],
  backends: [],
  tab: 'sessions',
  /** requestId -> actionId, so bare outcomes (no actionId field) map back. */
  requests: new Map(),
  /** actionId -> latest run {status, result?, error?} for display. */
  runs: new Map(),
  logs: [], // {level, line, at}
  logTarget: null,
}

const $ = (id) => document.getElementById(id)
const content = $('content')

function el(tag, cls, text) {
  const node = document.createElement(tag)
  if (cls) node.className = cls
  if (text !== undefined) node.textContent = text
  return node
}

// ---------- server picker ----------

async function refreshServers() {
  const select = $('server')

  try {
    const { servers } = await (await fetch('/devtools/servers')).json()
    state.servers = servers
  } catch {
    state.servers = []
  }

  select.replaceChildren()

  if (!state.servers.length) {
    select.append(el('option', '', 'No xplat dev servers found'))
    return
  }

  for (const server of state.servers) {
    const option = el('option', '', server.appRoot)
    option.value = server.key
    if (state.record?.key === server.key) option.selected = true
    select.append(option)
  }

  if (!state.record && state.servers.length) select.value = state.servers[0].key
}

function connectSelected() {
  const key = $('server').value
  const record = state.servers.find((server) => server.key === key)

  state.conn?.close()
  state.conn = null
  state.record = record ?? null
  state.sessions = []
  state.backends = []
  state.logs = []
  state.logTarget = null
  state.runs.clear()
  state.requests.clear()

  if (!record) return render()

  const conn = connectDevtools(record)
  state.conn = conn

  conn.onSessions((sessions) => {
    state.sessions = sessions
    render()
  })
  conn.onBackends((backends) => {
    state.backends = backends
    subscribeLogs()
    render()
  })
  conn.subscribe((message) => {
    if (message.channel === 'xplat-actions' && message.data?.type === 'outcome') {
      const outcome = message.data.outcome
      const actionId = state.requests.get(outcome.requestId)
      if (actionId) state.runs.set(actionId, outcome)
      render()
    }
    if (message.channel === 'xplat-logs' && message.data?.records) {
      state.logs.push(...message.data.records)
      if (state.logs.length > 500) state.logs.splice(0, state.logs.length - 500)
      render()
    }
  })

  render()
}

function subscribeLogs() {
  const backend = state.backends.find((ref) => ref.channel === 'xplat-logs')
  if (!backend || backend.targetId === state.logTarget || !state.conn) return

  state.logTarget = backend.targetId
  state.conn.sendToBackend('xplat-logs', backend.targetId, { type: 'subscribe' })
}

// ---------- invoke ----------

function invoke(session, actionId) {
  const requestId = crypto.randomUUID()

  state.requests.set(requestId, actionId)
  state.runs.set(actionId, { status: 'running' })
  state.conn?.sendToApp('xplat-actions', session.sessionId, {
    type: 'invoke',
    requestId,
    actionId,
    input: {},
  })
  render()
}

// ---------- render ----------

function render() {
  const badge = $('state')
  const connState = state.conn?.state ?? 'disconnected'
  badge.textContent = state.conn?.state === 'live' ? `live — ${state.conn.panel ?? ''}` : connState
  badge.className = `badge ${connState}`

  content.replaceChildren()

  if (!state.conn) {
    content.append(el('div', 'empty', 'Pick a dev server above to connect.'))
    return
  }

  if (state.tab === 'sessions') renderSessions()
  else if (state.tab === 'actions') renderActions()
  else renderLogs()
}

function renderSessions() {
  content.append(el('h2', '', `Sessions (${state.sessions.length})`))

  if (!state.sessions.length) {
    content.append(el('div', 'empty', 'No app sessions connected.'))
  }

  for (const session of state.sessions) {
    const row = el('div', 'row')
    row.append(el('span', 'name', session.sessionId.slice(0, 8)))
    row.append(el('span', 'meta', session.platform ?? ''))
    row.append(el('span', 'meta', session.state ?? ''))
    const chips = el('span', 'right')
    for (const channel of session.channels ?? []) {
      chips.append(el('span', 'chip', `${channel.id}@${channel.version}`))
    }
    row.append(chips)
    content.append(row)
  }

  content.append(el('h2', '', `Backends (${state.backends.length})`))

  if (!state.backends.length) {
    content.append(el('div', 'empty', 'No engine backends connected.'))
  }

  for (const backend of state.backends) {
    const row = el('div', 'row')
    row.append(el('span', 'name', backend.channel))
    row.append(el('span', 'meta', backend.targetId))
    content.append(row)
  }
}

function renderActions() {
  const withActions = state.sessions.filter((session) => session.actions?.length)

  if (!withActions.length) {
    content.append(el('div', 'empty', 'No session declares dev actions.'))
    return
  }

  for (const session of withActions) {
    content.append(el('h2', '', `${session.sessionId.slice(0, 8)} — ${session.platform ?? 'app'}`))

    for (const action of session.actions) {
      const row = el('div', 'row')
      row.append(el('span', 'name', action.id))
      if (action.title) row.append(el('span', 'meta', action.title))

      const right = el('span', 'right')
      const run = state.runs.get(action.id)

      if (action.availability?.ready === false) {
        right.append(el('span', 'meta', 'unavailable'))
      } else {
        const button = el('button', 'run', run?.status === 'running' ? '…' : 'Run')
        button.disabled = run?.status === 'running'
        button.onclick = () => invoke(session, action.id)
        right.append(button)
      }
      row.append(right)
      content.append(row)

      if (run && run.status !== 'running') {
        const outcome = el('div', `outcome ${run.status}`)
        outcome.style.paddingLeft = '14px'
        outcome.append(el('span', '', run.status))
        if (run.error) outcome.append(el('pre', '', JSON.stringify(run.error, null, 2)))
        if (run.result !== undefined) {
          outcome.append(el('pre', '', JSON.stringify(run.result, null, 2)))
        }
        content.append(outcome)
      }
    }
  }
}

function renderLogs() {
  const toolbar = el('div', 'toolbar')
  toolbar.append(
    el('span', 'meta', state.logTarget ? `target ${state.logTarget}` : 'no xplat-logs backend'),
  )
  const right = el('span', 'right')
  const clear = el('button', '', 'Clear')
  clear.onclick = () => {
    state.logs = []
    render()
  }
  right.append(clear)
  toolbar.append(right)
  content.append(toolbar)

  if (!state.logs.length) {
    content.append(el('div', 'empty', 'No log records yet.'))
    return
  }

  const list = el('div')
  for (const record of state.logs.slice(-300)) {
    const line = el('div', `log-line ${record.level}`)
    line.append(el('span', 'level', record.level))
    line.append(el('span', 'text', record.line))
    line.append(el('span', 'at', (record.at ?? '').slice(11, 19)))
    list.append(line)
  }
  content.append(list)
  list.lastElementChild?.scrollIntoView({ block: 'end' })
}

// ---------- wiring ----------

document.querySelectorAll('nav button').forEach((button) => {
  button.onclick = () => {
    state.tab = button.dataset.tab
    document
      .querySelectorAll('nav button')
      .forEach((other) => other.classList.toggle('active', other === button))
    render()
  }
})

$('server').onchange = connectSelected
$('refresh').onclick = refreshServers

refreshServers().then(connectSelected)
