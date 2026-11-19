import { expect, it, vi } from 'vitest'
import { createDesktopShell } from '../../src/shell/service'

it('hands a web link to the launcher and preserves its query', async () => {
  const launch = vi.fn(async () => true)
  const shell = createDesktopShell({ getLauncher: () => launch })
  await expect(shell.openExternal('https://example.org/search?q=a%20b')).resolves.toBeUndefined()
  expect(launch).toHaveBeenCalledWith('https://example.org/search?q=a%20b')
})

it('rejects non-web links and a declined launch', async () => {
  const launch = vi.fn(() => false)
  const shell = createDesktopShell({ getLauncher: () => launch })
  for (const url of ['file:///tmp/file', 'custom:open', '/help', 'https:///example.org']) {
    await expect(shell.openExternal(url)).rejects.toThrow(TypeError)
  }
  expect(launch).not.toHaveBeenCalled()
  await expect(shell.openExternal('https://example.org')).rejects.toThrow('could not open')
})

it('passes an absolute file path to the host and rejects a relative path', async () => {
  const reveal = vi.fn(async () => true)
  const shell = createDesktopShell({ getRevealer: () => reveal })
  expect(shell.canShowItemInFolder).toBe(true)
  await expect(shell.showItemInFolder('report.pdf')).rejects.toThrow(TypeError)
  await expect(shell.showItemInFolder('/tmp/April report.pdf')).resolves.toBeUndefined()
  expect(reveal).toHaveBeenCalledExactlyOnceWith('/tmp/April report.pdf')
})

it('reports Trash failures and gives callers a separate capability check', async () => {
  const trash = vi.fn(async () => false)
  const shell = createDesktopShell({ getTrasher: () => trash })
  expect(shell.canTrashItem).toBe(true)
  await expect(shell.trashItem('report.pdf')).rejects.toThrow(TypeError)
  expect(trash).not.toHaveBeenCalled()
  await expect(shell.trashItem('/tmp/report.pdf')).rejects.toThrow('could not move')
  await expect(createDesktopShell({}).trashItem('/tmp/report.pdf')).rejects.toMatchObject({
    name: 'UnavailabilityError',
  })
})
