import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { test } from 'node:test'

const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && context.parentURL) {
      const candidate = new URL(specifier + '.ts', context.parentURL)

      if (existsSync(candidate)) {
        return nextResolve(candidate.href, context)
      }
    }

    return nextResolve(specifier, context)
  },
})

const { createRoots } = await import('../src/roots.ts')
const { createRootDirectory } = await import('../src/root-directory.ts')
const { notifyLayoutCommit } = await import('../src/layout-observers.ts')

hooks.deregister()

function fixture() {
  const directory = createRootDirectory()
  const roots = createRoots({
    directory: directory.writer,
    driver: {
      macOSDriver: {
        id: 'test',
        capabilities: { text: 'host' },
        prepareBatch() {
          return { apply() {}, abort() {} }
        },
      },
    },
  })

  return { directory, roots, reader: directory.reader }
}

test('root directory hides mutation, snapshots membership and retires host/font identity', () => {
  const { roots, reader, directory } = fixture()

  assert.equal('register' in reader, false)
  assert.equal('rootForHost' in reader, false)

  const host = {},
    nestedHost = { superview: host }

  const older = roots.createMacOSRoot(host, { fontFamily: 'Older' })

  assert.throws(() => roots.createMacOSRoot(host), /already has a live root/)
  assert.equal(reader.fontFamilyForView(nestedHost), 'Older')

  const snapshot = reader.containers()

  snapshot.pop()
  assert.equal(reader.containers().length, 1)
  older.unmount()

  const newer = roots.createMacOSRoot(host, { fontFamily: 'Newer' })

  older.unmount()
  assert.equal(directory.writer.rootForHost(host), newer)

  const nested = roots.createMacOSRoot(nestedHost, {
    fontFamily: reader.fontFamilyForView(nestedHost),
  })

  newer.unmount()
  assert.equal(reader.fontFamilyForView(host), undefined)
  assert.equal(reader.fontFamilyForView(nestedHost), 'Newer')
  nested.unmount()
  assert.equal(reader.fontFamilyForView(nestedHost), undefined)
  assert.equal(reader.containers().length, 0)
})

test('layout observation visits already-live roots immediately and unsubscribes on failed visit', () => {
  const { roots, reader } = fixture()
  const host = {}
  const root = roots.createMacOSRoot(host)
  const seen = []
  const stop = reader.observeLayoutCommits((commit) => seen.push(commit.hostView))

  notifyLayoutCommit(host)
  stop()
  notifyLayoutCommit(host)
  assert.deepEqual(seen, [host, host])

  let visits = 0

  assert.throws(
    () =>
      reader.observeLayoutCommits(() => {
        visits++
        throw Error('visit')
      }),
    /visit/,
  )

  notifyLayoutCommit(host)
  assert.equal(visits, 1)
  root.unmount()
})

test('failed setup unwinds every acquired observation and preserves the original error', () => {
  const { roots, reader } = fixture()
  const host = {},
    failure = Error('setup')

  let releases = 0

  reader.observe(() => () => {
    releases++
  })

  const stop = reader.observe(() => {
    throw failure
  })

  assert.throws(
    () => roots.createMacOSRoot(host, { fontFamily: 'Gone' }),
    (error) => error === failure,
  )

  assert.equal(releases, 1)
  assert.equal(reader.containers().length, 0)
  assert.equal(reader.fontFamilyForView(host), undefined)
  stop()
  roots.createMacOSRoot(host).unmount()
})

test('retirement settles membership and independent observations after a cleanup failure', () => {
  const { roots, reader } = fixture()
  const host = {},
    failure = Error('release')

  let releases = 0

  reader.observe(() => () => {
    throw failure
  })

  reader.observe(() => () => {
    releases++
  })

  const root = roots.createMacOSRoot(host, { fontFamily: 'Gone' })

  assert.throws(root.unmount, (error) => error === failure)
  root.unmount()
  assert.equal(reader.hasHost(host), false)
  assert.equal(reader.fontFamilyForView(host), undefined)
  assert.equal(releases, 1)
})

test('membership callbacks can retire during setup without leaving a live root', () => {
  const { roots, reader } = fixture()
  let releases = 0

  reader.observe((container) => {
    container.root.unmount()
    return () => {
      releases++
    }
  })

  assert.throws(() => roots.createMacOSRoot({}), /retired during setup/)
  assert.equal(reader.containers().length, 0)
  assert.equal(releases, 1)
})

test('setup failure keeps primary and cleanup failures while releasing later observers', () => {
  const { roots, reader } = fixture()
  const setup = Error('setup'),
    cleanup = Error('cleanup')

  let releases = 0

  reader.observe(() => () => {
    throw cleanup
  })

  reader.observe(() => () => {
    releases++
  })

  reader.observe(() => {
    throw setup
  })

  assert.throws(
    () => roots.createMacOSRoot({}),
    (error) => {
      assert.deepEqual(error.errors, [setup, cleanup])
      return true
    },
  )

  assert.equal(releases, 1)
  assert.equal(reader.containers().length, 0)
})

test('reentrant retirement can acquire a replacement without an old lease deleting it', () => {
  const { roots, reader, directory } = fixture()
  const host = {}
  let replacement
  const stop = reader.observe(() => () => {
    stop()
    replacement = roots.createMacOSRoot(host, { fontFamily: 'Replacement' })
  })

  const older = roots.createMacOSRoot(host, { fontFamily: 'Older' })

  older.unmount()
  older.unmount()
  assert.equal(directory.writer.rootForHost(host), replacement)
  assert.equal(reader.fontFamilyForView(host), 'Replacement')
  replacement.unmount()
})
