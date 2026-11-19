import { expect, it, vi } from 'vitest'
import { createDesktopShell } from '../../src/shell/service'

it('hands a web link to the launcher and preserves its query', async () => {
  const launch = vi.fn(async () => true)
  const shell = createDesktopShell(() => launch)
  await expect(shell.openExternal('https://example.org/search?q=a%20b')).resolves.toBeUndefined()
  expect(launch).toHaveBeenCalledWith('https://example.org/search?q=a%20b')
})

it('rejects non-web links and a declined launch', async () => {
  const launch = vi.fn(() => false)
  const shell = createDesktopShell(() => launch)
  for (const url of ['file:///tmp/file', 'custom:open', '/help', 'https:///example.org']) {
    await expect(shell.openExternal(url)).rejects.toThrow(TypeError)
  }
  expect(launch).not.toHaveBeenCalled()
  await expect(shell.openExternal('https://example.org')).rejects.toThrow('could not open')
})
