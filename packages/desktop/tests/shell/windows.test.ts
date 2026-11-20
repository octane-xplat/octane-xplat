import { afterEach, expect, it, vi } from 'vitest'
import { shell } from '../../src/shell/index.windows.js'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

it('polls the managed recycle operation and waits for proof of recycling', async () => {
  vi.useFakeTimers()
  const responses = ['pending', 'recycled', 'failed']
  const invoke = vi.fn((_assembly, _type, method: string) => {
    if (method === 'IsSupported') return 'yes'
    if (method === 'Start') return 'request'
    return responses.shift()
  })
  vi.stubGlobal('NSWinRT', { dotnet: { invoke } })

  const filename = 'C:\\Users\\Test\\résumé notes.txt'
  expect(shell.canTrashItem).toBe(true)
  const pending = shell.trashItem(filename)
  await vi.advanceTimersByTimeAsync(100)
  await expect(pending).resolves.toBeUndefined()
  expect(invoke).toHaveBeenCalledWith('', 'OctaneXplat.Desktop.DesktopTrash', 'Start', [filename])
  expect(invoke).toHaveBeenCalledWith('', 'OctaneXplat.Desktop.DesktopTrash', 'Poll', ['request'])
  await expect(shell.trashItem(filename)).rejects.toThrow('could not move')
})

it('reports that Trash is unavailable with an older Windows bridge', async () => {
  vi.stubGlobal('NSWinRT', { dotnet: { invoke: () => { throw new Error('Missing managed method') } } })

  expect(shell.canTrashItem).toBe(false)
  await expect(shell.trashItem('C:\\example.txt')).rejects.toMatchObject({ feature: 'shell.trashItem' })
})
