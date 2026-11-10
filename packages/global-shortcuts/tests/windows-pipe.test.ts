import { afterEach, expect, it, vi } from 'vitest'
import { parseAccelerator } from '../src/accelerator'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

function installRuntime(pipeHandle: number | bigint, fileHandle: number | bigint = 0) {
  const started = vi.fn()
  const calls: string[] = []

  vi.stubGlobal(
    'Worker',
    class {
      constructor() {
        started()
        throw new Error('Worker source is unsupported in this fixture')
      }
    },
  )
  vi.stubGlobal('NSWinRT', {
    interop: { pointerFromBuffer: () => 1 },
    win32: {
      call: (_dll: string, name: string) => {
        calls.push(name)
        return name === 'CreateNamedPipeW'
          ? pipeHandle
          : name === 'CreateFileW'
            ? fileHandle
            : name === 'GetCurrentProcessId'
              ? 42
              : 0
      },
    },
  })

  return { started, calls }
}

async function bind() {
  const parsed = parseAccelerator('F13', { platform: 'windows' })

  if (!parsed.ok) {
    throw new Error(parsed.error.message)
  }

  const { backend } = await import('../src/backend.windows')
  return backend.bind(
    { key: 1, id: 'test', accelerator: parsed.accelerator, description: 'Test' },
    () => {},
  )
}

// Host doubles qualify failure handling, not Windows pipe or worker behavior.
it.each([0, -1, -1n, 0xffffffff, 0xffffffffn, 0xffffffffffffffffn])(
  'rejects failed pipe handle %s before starting a worker',
  async (handle) => {
    const { started } = installRuntime(handle)

    expect(await bind()).toMatchObject({ ok: false, error: { code: 'unavailable' } })
    expect(started).not.toHaveBeenCalled()
  },
)

it.each([-1, 0xffffffff, 0xffffffffffffffffn])(
  'rejects failed worker-file handle %s without writing to it',
  async (handle) => {
    const { started, calls } = installRuntime(42, handle)

    expect(await bind()).toMatchObject({ ok: false, error: { code: 'unavailable' } })
    expect(started).toHaveBeenCalledTimes(1)
    expect(calls).toContain('CreateFileW')
    expect(calls).not.toContain('WriteFile')
    expect(calls).not.toContain('CloseHandle')
  },
)
