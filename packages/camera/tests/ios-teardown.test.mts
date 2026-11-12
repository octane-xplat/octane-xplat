import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript-classic'

const source = await readFile(new URL('../src/session-backend.ios.ts', import.meta.url), 'utf8')
const sourceFile = ts.createSourceFile(
  'session-backend.ios.ts',
  source,
  ts.ScriptTarget.Latest,
  true,
)

let stopStatement
const findStopStatement = (node) => {
  if (
    !stopStatement &&
    ts.isVariableStatement(node) &&
    node.declarationList.declarations.some(
      (decl) => ts.isIdentifier(decl.name) && decl.name.text === 'stopSessionIfIdle',
    )
  ) {
    stopStatement = node
    return
  }

  ts.forEachChild(node, findStopStatement)
}

ts.forEachChild(sourceFile, findStopStatement)
assert.ok(stopStatement, 'stopSessionIfIdle declaration not found in session-backend.ios.ts')

const compiled = ts.transpile(
  source.slice(stopStatement.getStart(sourceFile), stopStatement.getEnd()) +
    '\nglobalThis.stop = stopSessionIfIdle',
  {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
)

const load = (overrides = {}) => {
  const events = []
  const context = vm.createContext({
    session: { stopRunning: () => events.push('stop') },
    captureSink: undefined,
    writerDriver: undefined,
    releaseRecordingHaptics: undefined,
    writerRelease: Promise.resolve(),
    nativeWriter: undefined,
    writerSourceReady: false,
    previewHost: undefined,
    interrupted: true,
    clearObservers: () => events.push('clear'),
    observer: { availability: (value) => events.push(['availability', value]) },
    ...overrides,
  })

  context.notify = (phase) => {
    context.interrupted = phase === 'began'
    events.push(['interruption', phase])
  }

  vm.runInContext(compiled, context)
  return { context, events }
}

test('idle teardown ends interruption and restores availability for the next session', () => {
  const { context, events } = load()

  context.stop()
  assert.equal(context.session, undefined)
  assert.equal(context.interrupted, false)
  assert.deepEqual(events, ['stop', 'clear', ['interruption', 'ended'], ['availability', true]])
  context.stop()
  assert.equal(events.length, 4)
})

test('active preview or capture keeps its session and interruption state', () => {
  for (const overrides of [{ previewHost: {} }, { captureSink: {} }]) {
    const { context, events } = load(overrides)

    context.stop()
    assert.ok(context.session)
    assert.equal(context.interrupted, true)
    assert.deepEqual(events, [])
  }
})

test('uninterrupted teardown restores availability without a spurious ended event', () => {
  const { context, events } = load({ interrupted: false })

  context.stop()
  assert.deepEqual(events, ['stop', 'clear', ['availability', true]])
})

test('idle teardown releases the candidate writer and retracts its readiness', () => {
  let releases = 0
  const { context } = load({
    writerDriver: {
      release: async () => {
        releases++
      },
    },
    nativeWriter: {},
    writerSourceReady: true,
  })

  context.stop()
  assert.equal(releases, 1)
  assert.equal(context.writerDriver, undefined)
  assert.equal(context.nativeWriter, undefined)
  assert.equal(context.writerSourceReady, false)
})
