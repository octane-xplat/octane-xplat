# @octane-xplat/workshop

Develop a component on its own page, edit explicit inputs and Reset to a fresh
example. Start with the browser; macOS AppKit and Linux GTK4 have real launch
paths with separate host qualification limits. iOS, Android and Windows remain
unqualified. Authoring contract version: **1**.

Follow [Develop a component in the workshop](https://octane-xplat.goddardai.org/component-workshop)
for the complete story, state, fixture/provider lifecycle, reload and production
exclusion workflow.

## Try it

Inside a configured Xplat app, keep its existing matching compiler/runtime:

```sh
pnpm add -D @octane-xplat/workshop @octane-xplat/cli @octanejs/vite-plugin vite
pnpm exec xplat workshop init
pnpm exec xplat workshop doctor
pnpm exec xplat workshop dev --target web
```

Open the printed URL and choose **Workshop / Counter**. Increment, edit step,
then Reset. Initialization preserves existing app entries; the workshop is a
separate development page. Keep stories out of the production import graph.

## Continue the workflow

- [Declare a typed story](https://octane-xplat.goddardai.org/component-workshop#declaring-stories), then compare control edits with Reset.
- [Own fixtures and providers](https://octane-xplat.goddardai.org/component-workshop#owned-fixture-resources) so switching and reload release resources.
- [Check host support and evidence](https://octane-xplat.goddardai.org/component-workshop#platform-support-and-evidence) before choosing another target.
- [Keep the production build separate](https://octane-xplat.goddardai.org/component-workshop#production-exclusion) and verify no story/fixture code ships.
