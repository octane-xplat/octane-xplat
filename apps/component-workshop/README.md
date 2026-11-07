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
