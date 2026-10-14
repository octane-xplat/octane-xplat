# Theme stylesheet entrypoints

**Fix: Make development and published stylesheet exports identical.**

Development exports a wildcard theme/* source path; publishConfig only exposes tokens.css and chrome.css. This lets an agent author a theme import that works locally but fails after packaging. Export those exact CSS entrypoints in both maps and state whether both are required or one includes the other.

Proposed shape (illustrative):

```ts
type ProposedThemeStylesheets =
	'@octane-xplat/ui/theme/tokens.css' | '@octane-xplat/ui/theme/chrome.css'
```

Evidence: [package.json:90](../../../packages/ui/package.json#L90).

[Audit index](../README.md)
