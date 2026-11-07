# Public component workshop

This private app owns the browser catalog published at `/workshop/` on the docs site.
It reuses maintained Astryx sandbox examples through explicit imports and adds
focused examples where a suitable one does not exist. The sandbox retains the
upstream attribution and example implementation; the workshop owns its story metadata.

```sh
bun run turbo run build --filter=@xplat/component-workshop
bun run turbo run test:browser --filter=@xplat/component-workshop
```

`catalog.json` maps public component identities to maintained examples. The
coverage check compares UI root, Chat, Markdown, and publishable visual leaf
exports with that mapping. Context objects, hooks, services, private packages,
and OS-authentic `ui/ios`/`ui/android` subpaths are outside this browser inventory.
The default **Components** tab leads with richer examples. Basic layout, type,
controls and supporting pieces use literal `gallery: { group: 'primitives' }`
metadata in their stories to appear in **Primitives**. Classification belongs to
the story, rather than a component-name heuristic in the shared gallery.

The browser provider imports UI `chrome.css` for component defaults. Frame and
inspector documents also load the sandbox's exported `styles.css` for body
fonts and `sb-*` example helpers; the gallery document keeps its own palette.
Keep those imports in the provider so static builds and development use the same
example styles. Import the sandbox stylesheet as CSS text (`?inline`) and
apply it inside preview documents: static Workshop HTML links every emitted CSS
asset, including styles from conditional imports.

Permission-, credential-, and ad-configuration-dependent entries remain visible
with prerequisite diagnostics and never activate from scrolling.

```sh
bun run turbo run test:coverage --filter=@xplat/component-workshop
```

The docs build depends on this app, then assembles its output after the docs and
demo builds. Referenced sandbox artwork is copied from its canonical public asset
folder; browser previews do not establish native runtime or OS-input qualification.

After publishing a preview, verify its source revision, asset routing and live
preview activation. Pass the deployed URL and its full source commit:

```sh
bun run turbo run verify:deployment --filter=@xplat/component-workshop -- https://PREVIEW.pages.dev/workshop/ FULL_GIT_REVISION
```
