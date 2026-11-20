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
      maximize() {},
      unmaximize() {},
      isMaximized: () => false,
      isFocused: () => false,
      observe() {
        return () => {}
      },
    },
  )
  return { parent: binding.windows.open(), ownerOf: binding.getWindowOwner, nativeOwner }
}

it('uses the supplied window owner and returns real selections', async () => {
  const { parent, ownerOf, nativeOwner } = fixture()
  const open = vi.fn(async () => ['/tmp/one.txt', '/tmp/two.md'])
  const dialog = createDesktopDialog({ supported: () => true, ownerOf, open, save: async () => null })

  await expect(dialog.showOpenDialog(parent, {
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Documents', extensions: ['TXT', 'md', 'txt'] }],
  })).resolves.toEqual({ canceled: false, filePaths: ['/tmp/one.txt', '/tmp/two.md'] })
  expect(open).toHaveBeenCalledWith(nativeOwner, { extensions: ['txt', 'md'], multiple: true }, expect.any(Function))
})

it('rejects hidden and foreign owners, and releases an owner after a backend failure', async () => {
  const { parent, ownerOf } = fixture()
  const open = vi.fn().mockRejectedValueOnce(new Error('Host failure')).mockResolvedValueOnce(null)
  const dialog = createDesktopDialog({ supported: () => true, ownerOf, open, save: async () => null })

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
    save: async () => null,
    open: (_owner, _options, onOwnerClose) =>
      new Promise((resolve) => {
        onOwnerClose(() => {
          dismiss()
          resolve(null)
        })
      }),
  })

  const pending = dialog.showOpenDialog(parent)
  await expect(dialog.showSaveDialog(parent)).rejects.toThrow('already has a dialog open')
  parent.destroy()

  await expect(pending).resolves.toEqual({ canceled: true, filePaths: [] })
  expect(dismiss).toHaveBeenCalledOnce()
})

it('returns a save path, rejects a path as suggestedName, and treats cancellation separately', async () => {
  const { parent, ownerOf, nativeOwner } = fixture()
  const save = vi.fn()
    .mockResolvedValueOnce('/tmp/notes.txt')
    .mockResolvedValueOnce(null)
    .mockResolvedValueOnce('')
  const dialog = createDesktopDialog({ supported: () => true, ownerOf, open: async () => null, save })

  await expect(dialog.showSaveDialog(parent, { suggestedName: '/tmp/notes.txt' })).rejects.toThrow('must be a filename')
  expect(save).not.toHaveBeenCalled()

  await expect(dialog.showSaveDialog(parent, {
    suggestedName: 'notes.txt',
    filters: [{ name: 'Text', extensions: ['TXT'] }],
  })).resolves.toEqual({ canceled: false, filePath: '/tmp/notes.txt' })
  expect(save).toHaveBeenCalledWith(nativeOwner, { suggestedName: 'notes.txt', extensions: ['txt'] }, expect.any(Function))
  await expect(dialog.showSaveDialog(parent)).resolves.toEqual({ canceled: true, filePath: undefined })
  await expect(dialog.showSaveDialog(parent)).rejects.toThrow('did not return a local file path')
})

it('keeps dialog responses in caller order and maps owner closure to cancelId', async () => {
  const { parent, ownerOf } = fixture()
  const show = createDesktopDialog({
    supported: () => true,
    ownerOf,
    open: async () => null,
    save: async () => null,
    messageBox: (_owner, options, onOwnerClose) =>
      options.message === 'Close?' ? new Promise((resolve) => onOwnerClose(() => resolve(null))) : Promise.resolve(1),
  })
  const options = { message: 'Discard?', buttons: ['Keep Editing', 'Discard'], cancelId: 0 }
  await expect(show.showMessageBox(parent, { ...options, defaultId: 2 })).rejects.toThrow(RangeError)
  await expect(show.showMessageBox(parent, options)).resolves.toEqual({ response: 1 })

  const pending = show.showMessageBox(parent, { ...options, message: 'Close?' })
  await expect(show.showOpenDialog(parent)).rejects.toThrow('already has a dialog open')
  parent.destroy()
  await expect(pending).resolves.toEqual({ response: 0 })
})
