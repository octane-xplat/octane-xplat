---
hype: 70
---

### Register system-wide hotkeys on desktop

New `@octane-xplat/global-shortcuts` package registers OS-level keyboard shortcuts that fire while your app is unfocused or backgrounded — the missing piece for quick-entry windows and push-to-talk actions. It complements `@octane-xplat/shortcuts`, which only handles keys inside a focused app.

```ts
const shortcuts = createGlobalShortcuts()
const result = await shortcuts.register({
  id: 'quick-entry',
  accelerator: 'Mod+Shift+Space',
  onPress: () => showQuickEntry(),
})
if (!result.ok) console.warn(result.error.message)
```

Registrations use a shared accelerator grammar (`Ctrl+Alt+KeyK` physical codes, `Mod` resolves per platform), report conflicts, reservations, and denials as structured errors, and clean up on unregister, dispose, and app exit. macOS uses Carbon event hotkeys, Windows uses `RegisterHotKey` on a package-owned thread, and Linux uses the XDG GlobalShortcuts portal where the desktop supports it. Web, iOS, and Android report explicit unsupported results.

See [Global shortcuts](https://octane-xplat.goddardai.org/package-global-shortcuts).
