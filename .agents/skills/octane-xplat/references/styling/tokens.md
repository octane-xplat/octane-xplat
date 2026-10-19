# Define and override tokens

Import the structural stylesheet once in the app entry. Add optional chrome
before app CSS so authored overrides follow it. Tokens and normalization rules
are maintained in these shipped files, not in a copied inventory here.

```ts
import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import './app.css'
```

Define app-owned tokens in app CSS. Keep a default value and a matching dark
value; apply the theme class to each independent native host as described in
[theme across hosts](root-boundaries.md).

```css
:root {
	--trip-surface: #fff;
}
.dark,
.ns-dark {
	--trip-surface: #111827;
}
.trip-panel {
	background-color: var(--trip-surface);
}
```

For framework token changes, edit the existing shared theme definitions and
consuming utilities rather than an app harness override. Check the affected
renderer: browser CSS support does not prove native token/property support.
Read the [styling guide](../../../../../docs/app/styling.md) for the supported
pipeline and [CSS notes](../../../../docs/notes/css-support-notes.md) for
property investigations.
