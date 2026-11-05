---
hype: 30
---

### Stop `Unknown at rule: @platform` warnings in minified web builds

Web production builds using `xplatCss` and `xplatBamboo` logged
`[lightningcss minify] Unknown at rule: @platform` for every platform
condition in the generated sheet. The warnings were cosmetic — the emitted CSS
was already correct — but they buried real diagnostics. Deferred sheets now
carry platform conditions through minification as `@layer` wrappers, decoded
after Bamboo's stylesheet validation, so both esbuild and Lightning CSS minify
warning-free.

See [platform styling](https://octane-xplat.goddardai.org/app/styling#style-one-platform).
