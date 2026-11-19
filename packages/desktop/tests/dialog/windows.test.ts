import { afterEach, expect, it, vi } from 'vitest'
import type { DesktopWindow } from '../../src/window/types.js'

const { ownerOf } = vi.hoisted(() => ({ ownerOf: vi.fn() }))
vi.mock('../../src/window/index.windows.js', () => ({ getWindowOwner: ownerOf }))

import { dialog } from '../../src/dialog/index.windows.js'

afterEach(() => vi.unstubAllGlobals())

const options = {
  message: 'Discard changes?',
  buttons: ['Keep Editing', 'Discard'],
  cancelId: 0,
}

it('checks the managed task-dialog capability independently of file pickers', async () => {
  const invoke = vi.fn((_assembly, _type, method: string) => {
    if (method === 'IsSupported') return 'yes'
    throw new Error('Missing managed method')
  })
  vi.stubGlobal('NSWinRT', { dotnet: { invoke } })

  expect(dialog.supported).toBe(true)
  expect(dialog.supportsMessageBox).toBe(false)
  await expect(dialog.showMessageBox({} as DesktopWindow, options)).rejects.toMatchObject({
    feature: 'dialog.showMessageBox',
  })
})

it('passes button order and the owner to Windows and maps native cancellation', async () => {
  const on = vi.fn()
  const off = vi.fn()
  const parent = { isVisible: () => true, isClosed: false, on, off } as DesktopWindow
  ownerOf.mockReturnValue({ id: '42' })
  const invoke = vi.fn((_assembly, _type, method: string) => {
    if (method === 'IsMessageBoxSupported') return 'yes'
    if (method === 'StartMessageBox') return 'started'
    if (method === 'Poll') return 'null'
    throw new Error('Unexpected managed method')
  })
  vi.stubGlobal('NSWinRT', { dotnet: { invoke } })

  await expect(dialog.showMessageBox(parent, { ...options, defaultId: 1 })).resolves.toEqual({ response: 0 })
  expect(invoke).toHaveBeenCalledWith('', expect.any(String), 'StartMessageBox', [
    '42', 'Discard changes?', '', '["Keep Editing","Discard"]', '1',
  ])
  expect(off).toHaveBeenCalledWith('closed', on.mock.calls[0][1])
})
