# NativeScript Linux runtime evaluation

Read this note when evaluating whether to replace GJS with `@nativescript/linux` for the GTK target. The shipping GTK package and CLI still use GJS; the private [evaluation harness](../../../tools/linux-runtime-eval/README.md) does not change that path.

## Qualification boundary

Passing the bounded screen or a few renderer fixtures does not qualify the full GTK suite or an official app runtime. Before switching the target, require evidence for the real UI breadth, GObject teardown, and a distributable runtime built for every supported architecture. Keep the GJS control on the same host so failures already present in GTK are not attributed to the projection.

The paired evaluation now covers 35 input-driven renderer fixtures and two accessibility metadata fixtures on x86_64 GTK 4.14.5. The full run found NativeScript runtime and behavior gaps beyond the GJS baseline; use experiment `4578f05a-1cce-4f17-89c2-92073561c3e9` and its report artifact for the current matrix. The accessibility fixtures verify GTK labels, names, states, and properties; they do not exercise an AT-SPI client or screen reader. GJS passes the WebView fixture, while NativeScript's exported GI metadata lacks WebKitGTK 6.0. Visual parity and Wayland remain unqualified.

## Upstream object lifetimes

The projection targets the NativeScript object model introduced by [upstream PR #25](https://github.com/triniwiz/linux-runtime/pull/25), where JS wrappers own GObject references. [PR #32](https://github.com/triniwiz/linux-runtime/pull/32), merged at `57408ba`, fixed self-capturing signal handlers so they can be collected with their owning object, matching GJS. Cross-object closure captures can still retain objects in both runtimes. Keep leak evidence scoped to the objects the probe creates; it is not a process-wide memory proof.

The three unexplained widgets in the original slice were retained by the probe's final loop-local root handle. Clearing that local handle made the same x86_64 run finalize 132 of 132 widgets. Treat that as a corrected probe measurement, not an upstream runtime change.

## Runtime packaging

The runtime needs a pinned source revision, locked Rust dependencies, fixed compiler and system inputs, architecture-specific executable and GTK metadata, verified hashes, license material, and a shipped app launcher. Upstream's release producer is a starting point, but its container tags and Rust `stable` channel move; pin those inputs before calling a build reproducible. Track the packaged app path separately from the renderer package's Mason shared libraries.

Do not promote the manually staged evaluation binary to a shipped artifact. The current CLI creates a GJS launcher in `packages/cli/src/linux/package.ts`; changing that behavior requires a package and app lifecycle that carries the NativeScript runtime and metadata. Keep the existing GTK workflow in place until all three qualification gates have evidence.
