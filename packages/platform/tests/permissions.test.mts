import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript-classic'

const root = new URL('../src/', import.meta.url)
const packagesSrc = new URL('../../', import.meta.url)

const compiled = ts.transpile(await readFile(new URL('permissions.ts', root), 'utf8'), {
  module: ts.ModuleKind.CommonJS,
  target: ts.ScriptTarget.ES2022,
})

function load() {
  const context = vm.createContext({})
  const exports = {}

  vm.runInContext(`(function(exports, require) {${compiled}\n})`, context)(exports, () => ({}))
  return { api: exports.permissions, context }
}

test('absent owner reports unsupported without throwing', async () => {
  const { api } = load()
  // UNSUPPORTED is built inside the vm realm — compare fields, not prototype.
  const get = await api.getPermissions('camera')
  const request = await api.requestPermissions('notifications')

  for (const response of [get, request]) {
    assert.equal(response.status, 'unsupported')
    assert.equal(response.granted, false)
    assert.equal(response.canAskAgain, false)
  }
})

test('object owner dispatches getPermissions and requestPermissions', async () => {
  const { api, context } = load()
  const calls = []

  context.__xplatPermissionOwners = {
    contacts: {
      getPermissions: async () => {
        calls.push('get')
        return { status: 'undetermined', granted: false, canAskAgain: true }
      },
      requestPermissions: async () => {
        calls.push('request')
        return { status: 'granted', granted: true, canAskAgain: true }
      },
    },
  }

  assert.deepEqual(await api.getPermissions('contacts'), {
    status: 'undetermined',
    granted: false,
    canAskAgain: true,
  })

  assert.deepEqual(await api.requestPermissions('contacts'), {
    status: 'granted',
    granted: true,
    canAskAgain: true,
  })

  assert.deepEqual(calls, ['get', 'request'])
})

test('a bare function owner does not satisfy the contract', async () => {
  const { api, context } = load()

  context.__xplatPermissionOwners = { contacts: async () => 'granted' }

  // The throw originates in the vm realm — match by name, not instanceof.
  assert.throws(() => api.getPermissions('contacts'), { name: 'TypeError' })
  assert.throws(() => api.requestPermissions('contacts'), { name: 'TypeError' })
})

// Registry contract: every leaf registration must be the
// {getPermissions, requestPermissions} owner object. A bare function was
// registered by several leaves for a while and threw TypeError at dispatch.
test('every permissionOwners registration is an owner object', async () => {
  const sources = []
  const entries = await readdir(packagesSrc, { withFileTypes: true })

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === 'platform') {
      continue
    }

    const src = new URL(`./${entry.name}/src/`, packagesSrc)
    let files

    try {
      files = await readdir(src)
    } catch {
      continue
    }

    for (const file of files) {
      if (/\.(ts|tsx|tsrx)$/.test(file) && !/\.(test|spec)\./.test(file)) {
        const text = await readFile(new URL(`./${file}`, src), 'utf8')

        if (text.includes('permissionOwners')) {
          sources.push([`${entry.name}/src/${file}`, text])
        }
      }
    }
  }

  const registrations = []
  const re = /permissionOwners(?:\.[A-Za-z]+|\['[^\]]+'\])\s*=\s*/g

  for (const [name, text] of sources) {
    for (const match of text.matchAll(re)) {
      const rest = text.slice(match.index + match[0].length)

      // Owner objects open with a brace; anything else fails the contract.
      assert.equal(rest[0], '{', `${name}: registration at offset ${match.index} is not an object`)

      let depth = 0
      let end = 0

      for (let i = 0; i < rest.length; i++) {
        if (rest[i] === '{') {
          depth += 1
        } else if (rest[i] === '}') {
          depth -= 1

          if (depth === 0) {
            end = i
            break
          }
        }
      }

      const block = rest.slice(0, end)

      assert.ok(block.includes('getPermissions'), `${name}: owner object lacks getPermissions`)
      assert.ok(
        block.includes('requestPermissions'),
        `${name}: owner object lacks requestPermissions`,
      )

      registrations.push(`${name}#${match[0].trim()}`)
    }
  }

  // Guard against the scan silently matching nothing.
  assert.ok(registrations.length > 10, 'expected >10 owner registrations across leaf sources')
})

// 'camera' is the one kind two leaves register: media owns it canonically
// and barcode-scanner claims it only so scanning works with media absent.
// barcode-scanner must use ??= — an unconditional assignment would make the
// dispatcher's answer depend on module evaluation order.
test('barcode-scanner registers camera only as a fallback owner', async () => {
  const src = new URL('./barcode-scanner/src/', packagesSrc)
  const files = (await readdir(src)).filter(
    (f) => f.startsWith('barcode-scanner.') && !/\.(test|spec)\./.test(f),
  )

  let registrations = 0

  for (const file of files) {
    const text = await readFile(new URL(`./${file}`, src), 'utf8')

    for (const match of text.matchAll(/permissionOwners\.camera\s*(\?\?=|=)\s*/g)) {
      assert.equal(
        match[1],
        '??=',
        `barcode-scanner/src/${file}: 'camera' must register with ??= so media wins when installed`,
      )

      registrations += 1
    }
  }

  assert.ok(registrations > 0, 'expected at least one camera registration in barcode-scanner')
})
