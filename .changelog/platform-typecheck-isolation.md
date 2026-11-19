### Check platform code in separate TypeScript programs

`xplat typecheck` now checks web, iOS, Android, macOS, Windows, and native Linux GTK in separate programs to catch code that relies on another platform’s APIs. A `native` manifest entry expands into separate iOS and Android checks.

**Breaking change**

If your manifest checks web and native, move browser libraries into the web environment.

```json
{
  "environments": {
    "web": {
      "files": ["src/index.web.ts"],
      "compilerOptions": { "lib": ["ESNext", "DOM", "DOM.Iterable"] }
    },
    "native": { "files": ["src/index.ts"] }
  }
}
```

Move any old `linux` manifest entry into `gtk` and replace its solution reference with `gtk.json`. The GTK check uses native GJS declarations.

```json
{
  "environments": {
    "gtk": { "files": ["src/index.gtk.ts"] }
  }
}
```

Run `bun run typecheck` after installation to generate the configurations your editor references. Shared files use one project context in the editor. The CLI checks every declared environment.

[TypeScript and editor setup](https://octane-xplat.goddardai.org/module-resolution#typescript)
