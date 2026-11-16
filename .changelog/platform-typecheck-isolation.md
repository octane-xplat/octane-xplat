### Check platform code in separate TypeScript programs

`xplat typecheck` now checks web, iOS, Android, macOS, Windows, Linux WebKit, and native GTK in separate programs so browser and phone SDK declarations cannot hide mistakes in another platform. A `native` manifest entry expands into separate iOS and Android checks. Existing SDK imports and runtime APIs stay the same. Linux WebKit keeps browser declarations; native GTK uses its existing GJS declarations without browser globals.

**Breaking change:** Move browser libraries out of shared compiler options when a manifest also checks native platforms:

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

New starters declare the editor compiler directly and include solution references for TypeScript project discovery. Run `bun run typecheck` after installation to prepare the referenced configurations. Shared editor files still use one default project context; the CLI checks all declared environments. Follow the [TypeScript and editor setup](https://octane-xplat.goddardai.org/platform/module-resolution#typescript).
