# Documentation recipes

Recipes specify what documentation must enable an app developer to accomplish.
They are internal task specifications, not tutorials or a public feature list.
The collection defines the required coverage floor, including workflows whose
documentation is still missing. It grows as the framework evolves.

## Find or add a recipe

Start from the developer's outcome and search the recipe titles and related API
names. Add a recipe when a supported workflow coordinates APIs, files,
configuration, platform differences, or lifecycle states that a signature alone
cannot explain. Extend an existing recipe when the outcome stays the same.
Pure refactors ordinarily need no recipe change.

Workflows:

- [Access and compose component refs](component-refs.md)

- [Probe one platform case](probe-platform-case.md)

- [Animate shared components](component-motion.md)
- [Animate a view through a ref](imperative-animation.md)
- [Settle a dragged value with a spring](gesture-motion.md)
- [Fetch remote data in a screen](fetch-remote-data.md)
- [Add advanced haptics](advanced-haptics.md)
- [Add UI sound effects](ui-sounds.md)
- [Add long-form audio playback](audio-playback.md)

- [Select an image crop inline](inline-image-crop.md)
- [Pick and capture images](pick-and-capture-images.md)
- [Build a chat conversation](chat-conversation.md)
- [Show a live camera preview](camera-preview.md)
- [Use platform-specific implementations from shared code](platform-leaves.md)
- [Open a screen from an incoming link](incoming-links.md)
- [Sign in with a passkey or hosted auth ceremony](passkey-sign-in.md)
- [Sign in with Apple or Google provider SDKs](provider-sign-in.md)
- [Send a local notification](local-notifications.md)
- [Receive push notifications](push-notifications.md)
- [Register routes from runtime data](programmatic-routes.md)
- [Bake route data into the bundle](baked-routes.md)
- [Build a responsive navigation shell](navigation-shell.md)
- [Build a responsive resizable workspace](resizable-workspace.md)
- [Ship video playback on web and native](video-playback.md)
- [Play a Lottie animation on web and native](lottie-animation.md)
- [Render a long vertical collection](virtual-list.md)
- [Manage an interactive data grid](interactive-data-grid.md)
- [Build a settings list with reusable rows](settings-list.md)
- [Render a bounded content list](content-list.md)
- [Compose a shared screen layout](shared-layout.md)
- [Enter and submit text reliably](text-entry.md)
- [Search and enter selected values](search-and-token-entry.md)
- [Build a structured search field](power-search.md)
- [Compose action controls and interactive cards](interactive-actions.md)
- [Size a WebView to its document](webview-content-sizing.md)
- [Package an experimental AppKit app](macos-appkit-package.md)
- [Package a Linux WebKitGTK app](linux-package.md)
- [Run a macOS app in the system WKWebView](macos-webview-package.md)
- [Announce a status without moving focus](accessibility-announcements.md)
- [Share text and URLs from an app](share-content.md)
- [Ship native code in a macOS leaf](macos-native-code.md)
- [Add a platform-native single-selection picker](native-picker.md)
- [Publish a typed component library](typed-component-library.md)
- [Display formatted content and status](display-content.md)
- [Add portable date and file inputs](date-picker.md)
- [Add a platform-native context menu to an octane subtree](context-menu.md)
- [Grow a multiline input](textarea-growth.md)
- [Edit a PIN without shifting cells](pin-entry.md)
- [Own shared temporary surfaces](shared-overlays.md)
- [Present an octane subtree in a platform-native bottom sheet](sheet.md)
- [Persist structured data in a local database](local-database.md)
- [Localize an app with Lingui](localization.md)
- [Use Bamboo CSS utilities across web and native](bamboo-css.md)
- [Ship a custom font across web and native](custom-fonts.md)
- [Add rich text editing](rich-text-editing.md)
- [Render SVG images on AppKit](appkit-svg-images.md)
- [Render bundled icons across web, mobile, and AppKit](bundled-icons.md)
- [Reorder and move draggable items](drag-and-drop.md)

## Authoring contract

Use one Markdown file per outcome, with these fields and sections:

- `ID: kebab-case-name` — stable across title and filename changes.
- `Targets: web, ios, android, macos, linux` — only the applicable targets.
- `Related APIs: ...` — literal public symbols, packages, or configuration names
  to make discovery possible from a code change.
- `## Starting point` — reader knowledge, app setup, and the scope boundary.
- `## Requirements` — what the reader must be able to accomplish.
- `## Acceptance criteria` — bullet lines starting `- AC1:`, `- AC2:`, etc.;
  observable outcomes, including relevant failure and lifecycle behavior.
- `## Documentation` — one bullet per criterion, starting with its same ID,
  linking to guide sections or maintained examples. When no reference exists,
  use `- AC1: Gap: ...` and record the finding in Silo.

Keep criterion IDs stable; do not renumber survivors or reuse retired IDs for
new meanings. State any narrower target scope in the criterion itself. Write criteria around outcomes, not a prescribed implementation.
A linked section is a candidate source of coverage, not proof of completeness.
Do not copy implementation instructions into recipes or duplicate platform
limits: link to the guide and to `docs/known-limits.md` where relevant.
Keep guide examples tiny; use maintained starter/demo files for larger examples.

## Maintain alongside framework changes

Before changing public behavior, setup, or a supported workflow, inspect affected
recipes. Update expectations, docs, and examples in the same change. Bug fixes
revisit the affected criteria; deprecations revise the supported workflow.
Do not weaken criteria just to conceal a bug or missing documentation. An
intentional contract change must explain the changed expectation in the review.

Read the linked instructions as someone starting from the stated prerequisites.
Coverage is complete only if that reader can meet every criterion without
consulting framework source or relying on maintainer knowledge. Covering every
API name is insufficient. Seed new recipes from actual developer workflows,
including undocumented ones, rather than just the existing page inventory.

Run `pnpm check:recipes` (also part of `pnpm lint`). It checks structure, IDs,
criterion mappings, and local links/Markdown heading anchors. Regression tests run with `node --test scripts/check-recipes.test.mjs`.
It does not judge prose completeness, execute examples, or require access to Silo.

At handoff, identify affected recipes, doc changes, checks, and remaining gaps.
If no recipe is affected, briefly say why. Explicit gaps allow incremental work;
they never count as complete coverage.

## Audit state in Silo

Run `silo context`, then inspect `silo table show recipe_audit` before writing.
The existing `docs_audit` table remains the page-level audit; `recipe_audit`
records one criterion assessment per recipe, target, and reviewed revision.
Requirements live only in these Git files. Audit rows carry:

- `recipe_id`, `criterion_id`, and `target` (`web`, `ios`, `android`, or
  `macos`).
- `reviewed_commit` and `recipe_blob` — the exact code/docs revision and recipe
  Git blob assessed; obtain them with `git rev-parse HEAD` and
  `git rev-parse HEAD:recipes/<file>.md` after committing.
- `coverage`: `complete`, `partial`, or `missing`.
- `verification`: `not-run`, `typechecked`, or `runtime-tested`.
- `evidence` and `gap` — concise references/results and what remains; no copied
  requirements. A complete assessment has an empty gap.

Documentation review and execution are independent: a runtime demo can pass
while instructions remain incomplete. Mark verification only for checks that
exercise that criterion on that target. A docs build is not runtime evidence.
New commits or changed recipe blobs require reassessment of affected criteria;
old rows remain historical evidence, not a current green status. Insert a new
assessment for a new revision; use Silo's optimistic revision when correcting
an existing row. Never claim a roll-up is complete with missing applicable target rows.
The Silo `recipe_audit.target` constraint accepts `web`, `ios`, `android`, and
`macos`. The `platform-leaves` recipe already includes Linux; its Linux assessment
remains unrecordable in the current table. Extend it before inserting rows for a new target, preserving existing
assessments during the schema migration. If Silo is unavailable, report the
unrecorded findings at handoff and leave the audit pending rather than
claiming completion.
