# NativeScript Linux runtime evaluation

Read this note when migrating the GTK target from GJS to `@nativescript/linux`. NativeScript linux-runtime is the chosen direction; qualification failures identify work to resolve for the cutover. The shipping GTK package and CLI currently use GJS; the private [evaluation harness](../../../tools/linux-runtime-eval/README.md) develops and checks the replacement.

## Qualification boundary

Passing the bounded screen or a few renderer fixtures does not qualify the full GTK suite or an official app runtime. Before switching the target, require evidence for the real UI breadth, GObject teardown, and a distributable runtime built for every supported architecture. Keep the GJS control on the same host so failures already present in GTK are not attributed to the projection.

The paired evaluation now covers 35 real-window renderer fixtures and two accessibility metadata fixtures on x86_64 GTK 4.14.5. Fixtures that declare input send their configured pointer or keyboard actions; other renderer fixtures check properties and behavior without OS input. The full run found NativeScript runtime and behavior gaps beyond the GJS baseline; use experiment `4578f05a-1cce-4f17-89c2-92073561c3e9` and its report artifact for the current matrix. The accessibility fixtures verify GTK labels, names, states, and properties; they do not exercise an AT-SPI client or screen reader. With generated WebKitGTK 6.0 metadata, the WebView fixture passes under both runtimes. Visual parity and Wayland remain unqualified.

## Upstream object lifetimes

The projection targets the NativeScript object model introduced by [upstream PR #25](https://github.com/triniwiz/linux-runtime/pull/25), where JS wrappers own GObject references. [PR #32](https://github.com/triniwiz/linux-runtime/pull/32), merged at `57408ba`, fixed self-capturing signal handlers so they can be collected with their owning object, matching GJS. Cross-object closure captures can still retain objects in both runtimes. Keep leak evidence scoped to the objects the probe creates; it is not a process-wide memory proof.

The three unexplained widgets in the original slice were retained by the probe's final loop-local root handle. Clearing that local handle made the same x86_64 run finalize 132 of 132 widgets. Treat that as a corrected probe measurement, not an upstream runtime change.

## GTK value projection

GObject fundamental type macros are not all present in GI exports. The projection must expose `TYPE_DOUBLE` as well as integer, boolean, and string types; range controls initialize explicit double `GValue`s rather than relying on JavaScript number inference. A missing type constant becomes invalid type zero and can make input behavior appear broken when its numeric metadata was rejected.

GTK accessibility relations use boxed `GtkAccessibleList` values, not object-valued `GValue`s. Project `AccessibleList.new_from_list` by constructing a borrowed `GList` of targets and freeing the temporary container after the native call copies it. Store the result with its boxed GType and `g_value_set_boxed`; the temporary `GValue` owns a copy, and the returned wrapper releases its original boxed value on finalization. GTK copies the target list into the relation and holds weak target references. See [GTK 4.14's list implementation](https://github.com/GNOME/gtk/blob/4.14.5/gtk/gtkaccessible.c) and [reference-list collector](https://github.com/GNOME/gtk/blob/4.14.5/gtk/gtkaccessiblevalue.c). The current GList projection accepts borrowed projected-GObject lists only and throws for ownership-taking or other element types. Keep slider, tooltip, and accessibility fixture coverage when changing this conversion.

## Runtime packaging

The V8 runtime at `57408ba` initializes V8 without installing ICU common data. The exploratory x86_64 executable aborts on a standalone `Intl.DateTimeFormat` call when the dataset is absent; typeahead also hits SIGSEGV in V8's `JSSegments::Create`. Supplying the exact ICU 77 data through `ICU_DATA` lets the date fixtures pass and typeahead complete with the same assertion failures as GJS. The evaluation harness forwards `LINUX_RUNTIME_EVAL_ICU_DATA` to the remote native process. Its [Intl smoke](../../../tools/linux-runtime-eval/intl-smoke.mjs) checks multiple locales, a time-zone boundary, and word/grapheme segmentation. Package a dataset matching the pinned rusty_v8 version, retain its hash and license, and run the smoke before diagnosing UI date or segmentation failures. Do not mistake the fatal “out of memory” message for evidence that increasing the V8 heap is the fix.

The runtime needs a pinned source revision, locked Rust dependencies, fixed compiler and system inputs, architecture-specific executable and GTK metadata, verified hashes, license material, and a shipped app launcher. Upstream's release producer is a starting point, but its container tags and Rust `stable` channel move; pin those inputs before calling a build reproducible. Track the packaged app path separately from the renderer package's Mason shared libraries.

Do not promote the manually staged evaluation binary to a shipped artifact. The current CLI creates a GJS launcher in `packages/cli/src/linux/package.ts`; changing that behavior requires a package and app lifecycle that carries the NativeScript runtime and metadata. Keep the existing GTK workflow in place until all three qualification gates have evidence.
