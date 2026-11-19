import { expect, it, vi } from 'vitest'
import { createDesktopDialog } from '../../src/dialog/service.js'
import { createDesktopWindowService } from '../../src/window/service.js'

function fixture() {
  const nativeOwner = {}
  let visible = true
  let closed = false
  let finish!: () => void
  const didClose = new Promise<void>((resolve) => { finish = resolve })
  const binding = createDesktopWindowService(
    () => () => ({
      window: nativeOwner,
      get isClosed() { return closed },
      closed: didClose,
      onCloseRequested: null,
      close() {
        closed = true
        finish()
      },
      setTitle() {},
    }),
    {
      requestClose() {},
      present() { visible = true },
      hide() { visible = false },
      isVisible: () => visible,
      minimize() {},
      restore() {},
    },
  )
  return { parent: binding.windows.open(), ownerOf: binding.getWindowOwner, nativeOwner }
}

it('uses the supplied window owner and returns real selections', async () => {
  const { parent, ownerOf, nativeOwner } = fixture()
  const open = vi.fn(async () => ['/tmp/one.txt', '/tmp/two.md'])
  const dialog = createDesktopDialog({ supported: () => true, ownerOf, open })

  await expect(dialog.showOpenDialog(parent, {
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Documents', extensions: ['TXT', 'md', 'txt'] }],
  })).resolves.toEqual({ canceled: false, filePaths: ['/tmp/one.txt', '/tmp/two.md'] })
  expect(open).toHaveBeenCalledWith(nativeOwner, { extensions: ['txt', 'md'], multiple: true }, expect.any(Function))
})

it('rejects hidden and foreign owners, and releases an owner after a backend failure', async () => {
  const { parent, ownerOf } = fixture()
  const open = vi.fn().mockRejectedValueOnce(new Error('Host failure')).mockResolvedValueOnce(null)
  const dialog = createDesktopDialog({ supported: () => true, ownerOf, open })

  parent.hide()
  await expect(dialog.showOpenDialog(parent)).rejects.toThrow('live, shown DesktopWindow')
  await expect(dialog.showOpenDialog(fixture().parent)).rejects.toThrow('live, shown DesktopWindow')
  expect(open).not.toHaveBeenCalled()

  parent.show()
  await expect(dialog.showOpenDialog(parent)).rejects.toThrow('Host failure')
  await expect(dialog.showOpenDialog(parent)).resolves.toEqual({ canceled: true, filePaths: [] })
})

it('rejects a second picker for the same owner and dismisses the first when its owner closes', async () => {
  const { parent, ownerOf } = fixture()
  const dismiss = vi.fn()
  const dialog = createDesktopDialog({
    supported: () => true,
    ownerOf,
    open: (_owner, _options, onOwnerClose) =>
      new Promise((resolve) => {
        onOwnerClose(() => {
          dismiss()
          resolve(null)
        })
      }),
  })

  const pending = dialog.showOpenDialog(parent)
  await expect(dialog.showOpenDialog(parent)).rejects.toThrow('already has a file dialog open')
  parent.destroy()

  await expect(pending).resolves.toEqual({ canceled: true, filePaths: [] })
  expect(dismiss).toHaveBeenCalledOnce()
})
