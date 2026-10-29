# Linux GTK npm release readiness

The package joins automated lockstep publication as an **experimental** renderer.
Its initial manifest version matches the current lockstep; release CI selects and
aligns the actual release version. Do not manually publish the real package.
The production [feasibility gate](../../design/linux-gtk-feasibility-review.md)
remains **fail**. This work does not waive or satisfy its independent-review,
latency, lifecycle, failure, or inventory criteria.

## Package and consumer contract

- The on-demand `typegen` task also emits dist, so dependent app builds and
  fresh workspace installs prepare runtime exports before resolving them.
- Public entries resolve to `dist/*.js` with declarations, including compatibility
  subpaths. GI declarations ship with the curated public declaration entries.
- Runtime peer: Octane `>=0.14.0 <1`, the current tested universal-runtime line.
  The earlier `>=0.6.3` floor was not qualified for this renderer.
- MIT LICENSE already exists. The tarball includes native C/header/build sources,
  without a prebuilt engine, `.so`, or `.typelib` and without install scripts.
- The default npm route is Gtk.Box emulation. Full Mason needs a separate pinned
  engine checkout and host build; see the package README. Native artifacts remain
  architecture-specific and separately unqualified.
- Workshop's optional renderer peer starts at the lockstep release. Its packed
  Linux consumer installs the renderer, CSS engine and JSX facade from tarballs
  and builds through the published CLI preset. Doctor resolves installed exports;
  it has no private-package gate. CLI resolution already uses the app's package
  graph and needs no path adaptation for `dist/`.
- No GTK renderer is added to every new app. Compatibility generation includes
  its name so doctor and upgrade recognize the newly publishable package.

## Accessibility mechanism and evidence

GJS exposes `gtk_accessible_update_property_value` as `update_property`, taking
parallel property/value arrays; JavaScript strings marshal to string GValues.
The previous scalar varargs invocation was incorrect. Buttons need their
mnemonic `LABELLED_BY` relation reset for an explicit LABEL to take precedence.
After removing the explicit label GTK names the button from its child content.
See [GTK's binding documentation](https://docs.gtk.org/gtk4/method.Accessible.update_property_value.html).

The widget-name mirror remains for workshop automation: testID, automationText,
and id take priority, followed by accessibilityLabel. It is separate from the
AT-visible name. The independent Python AT-SPI regression asserts initial,
updated and removed labels on real renderer widgets; GTK property readback is
additional evidence, not a replacement for AT-SPI.

## Qualification boundary

The Andromeda VM is Ubuntu 24.04 x86_64, GJS 1.80.2, GTK 4.14.5, with Xvfb/X11.
A direct GTK binding probe independently exposed `Save draft` and then
`Save final` through AT-SPI. The maintained renderer test independently passed initial, updated and
removed names through AT-SPI. The final fixture also checks teardown diagnostics. This is one distribution/version combination, not a
qualified minimum-version matrix. No screenshots or visual analysis were used.

Still unproven: Wayland; real desktop pointer/keyboard and hit-testing for this
release; IME/caret interruption; screen-reader navigation, speech and workshop
announcements; mixed scales; complete shared UI; native Mason build/relocation;
and every missing production feasibility criterion. Previous Debian arm64
programmatic checks retain their original evidence boundary. Merely running on
x86_64 does not qualify its layout, input, timing or lifetime distributions.

Run the opt-in runtime test only with an owned Linux VM reservation. Build the
bundles through Turbo on the build host, then run the runtime fixtures in the
Linux guest (an X display and session bus are required):

```sh
XPLAT_GTK_KEEP_A11Y=1 pnpm exec turbo run test:a11y --filter=@octane-xplat/linux-gtk
# In Linux, from the repository root, after building those bundles:
dbus-run-session -- xvfb-run -a gjs -m packages/linux-gtk-renderer/test/fixtures/dist-a11y/app.js
GTK_A11Y=atspi dbus-run-session -- xvfb-run -a python3 \
  packages/linux-gtk-renderer/test/atspi-check.py \
  packages/linux-gtk-renderer/test/fixtures/dist-atspi/app.js
```

The AT-SPI client needs Python GI and the Atspi 2.0 typelib. On Andromeda the
missing typelib was downloaded and extracted under ignored `research/`, without
installing packages system-wide. Preserve the existing VM; it was already
running and is not owned by this task.

## One-time credentialed steps — user only

Use an npm CLI with the [documented trust command](https://docs.npmjs.com/cli/v11/commands/npm-trust/).
Complete these before merging publication enablement: the release preflight
requires an existing npm package and trusted publisher. Use an account allowed
to publish under `@octane-xplat`. These steps were completed on 2026-10-29:
`@octane-xplat/linux-gtk@0.0.1` is published under the `bootstrap` tag and the
`release.yml` trusted publisher is bound with publish and stage-publish
permission.

1. In a terminal authenticated to npm, create a temporary stub. It intentionally
   exports no API. Note: npm still assigns `latest` to the first published
   version even with `--tag bootstrap`; the tag is only an additional marker.

   ```sh
   GTK_STUB_DIR=$(mktemp -d)
   cat > "$GTK_STUB_DIR/package.json" <<'JSON'
   {
     "name": "@octane-xplat/linux-gtk",
     "version": "0.0.1",
     "description": "Reserved for the experimental Octane Xplat GTK renderer; no supported API",
     "license": "MIT",
     "repository": {
       "type": "git",
       "url": "https://github.com/octane-xplat/octane-xplat",
       "directory": "packages/linux-gtk-renderer"
     },
     "files": ["README.md"]
   }
   JSON
   printf '%s\n' '# Reserved package' 'This bootstrap stub has no supported API. Wait for an automated Xplat release.' > "$GTK_STUB_DIR/README.md"
   npm publish "$GTK_STUB_DIR" --access public --tag bootstrap
   ```

2. Bind the existing release workflow with direct publishing permission:

   ```sh
   npm trust github @octane-xplat/linux-gtk --file release.yml \
     --repository octane-xplat/octane-xplat \
     --allow-publish --allow-stage-publish
   npm trust list @octane-xplat/linux-gtk
   ```

3. Confirm the listing names `octane-xplat/octane-xplat`, `release.yml` and the
   permissions above. Then merge through the normal reviewed PR workflow.
   Automated release CI must pass its unchanged track-specific gates and
   trusted-publisher preflight before it publishes. Do not hand-publish real
   versions or assume the stub makes the renderer available to apps.

## Verification and workflow coverage

Built from `origin/main` at `779d1047213df8664ffa42e527304c68ade6da62` in
Andromeda's isolated `linux-gtk-release` worktree. Repository changes, builds
and consumer checks stayed there.

| Check | Actual result and boundary |
| --- | --- |
| GTK unit suite | 23 pass, 2 runtime skips on macOS; build and pure mapping evidence |
| Workshop unit suite | 96 pass; host/unit evidence |
| Dependent typechecks | 51 Turbo tasks passed across the touched packages and their dependents; source/type evidence |
| Workshop packed Linux consumer | Passed from tarballs: doctor, dist resolution, CLI/Vite compilation of a GTK component using the packed UI Text leaf, declarations and GTK story discovery; no GJS window or OS input |
| Package archive | Contains dist JavaScript/declarations, MIT LICENSE, README and native C/header/build script; no authored runtime .ts, native binary or typelib |
| Compatibility, patches, recipes, changelog, changed-source lint | Passed; lint reports zero warnings/errors |
| Ubuntu x86_64 renderer smoke | Real GTK LABEL state and widget-name precedence/removal match the maintained assertions |
| Independent AT-SPI client | Initial `Save draft` / `Build status: passing`; updated `Save final` / `Build status: passing`; removed `Changed` / `Still OK` |

Vite printed its existing `inlineDynamicImports` deprecation warning. Runtime
names and programmatic updates do not establish OS input, visual parity, speech
or the production gate. The initial probe omitted renderer-node destruction and
logged a GJS GC callback warning; the maintained fixture now explicitly destroys
its nodes before the window and checks for critical teardown diagnostics. That
cleanup-adjusted fixture builds successfully, but its final Linux execution was
not run: the broker timed out after 600 seconds waiting for another task to
release `linux:andromeda-octane-linux`. The earlier renderer run established
the accessible-name results above; it did not establish clean teardown.

Affected recipes: `linux-gtk-package` (installation and artifact choice under
AC1, existing archive workflow under AC2, qualification boundary under AC3) and
`component-workshop` AC1 (installing the optional renderer and checking doctor).
Setup and limits are documented; actual app-archive execution and workshop
keyboard/screen-reader journeys were not run here. Existing broader workshop
AC6 gaps remain open. The full stable CI/native qualification remains required.

Silo feedback observation `425bf46b-b82b-4611-878e-3d15729306e5` preserves the
original accessible-name mismatch. Linux recipe assessments cannot be inserted
in the current `recipe_audit` schema: its target constraint permits only web,
ios, android and macos. Their coverage/verification assessment above remains
unrecorded in that table; no foreign target row or schema weakening was used.
