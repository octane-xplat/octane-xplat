# NativeScript Linux runtime

Read this note when working on the NativeScript Linux runtime for GTK. The GTK CLI build uses the runtime bundled with the renderer package. The private [integration suite](../../../tools/linux-gtk-tests/README.md) compares NativeScript and GJS on the same GTK fixture sources.

## Qualification boundary

Passing the bounded screen or a few renderer fixtures does not qualify the full GTK suite or an official app runtime. Before switching the target, require evidence for the real UI breadth, GObject teardown, and a distributable runtime built for every supported architecture. Run the Linux tests in the existing `octane-linux` VM on `andromeda.local`, with both engines on the same host.

The integration suite inventories every top-level GTK renderer test file on x86_64 GTK 4.14.5. Fixtures that declare input must deliver the configured pointer or keyboard actions before the runner accepts their result. Use experiment `4578f05a-1cce-4f17-89c2-92073561c3e9` and its report artifacts for the current results. The accessibility fixtures check GTK labels, names, states, and properties. Independently qualify AT-SPI clients, screen readers, visual parity, and Wayland.

## Upstream object lifetimes

The projection targets the NativeScript object model introduced by [upstream PR #25](https://github.com/triniwiz/linux-runtime/pull/25), where JS wrappers own GObject references. [PR #32](https://github.com/triniwiz/linux-runtime/pull/32), merged at `57408ba`, fixed self-capturing signal handlers so they can be collected with their owning object, matching GJS. Cross-object closure captures can still retain objects in both runtimes. Keep leak evidence scoped to the objects the probe creates; it is not a process-wide memory proof.

The three unexplained widgets in the original slice were retained by the probe's final loop-local root handle. Clearing that local handle made the same x86_64 run finalize 132 of 132 widgets. Treat that as a corrected probe measurement, not an upstream runtime change.

## GTK value projection

GTK controllers receive pointer events through a base `Gdk.Event` signal argument. Project the concrete native event type so the gesture handler can read `Gdk.ButtonEvent.get_button()` and distinguish pointer clicks from virtual activation. Keep the shared gesture test on both runtimes when changing event projection.


GObject fundamental type macros are not all present in GI exports. The projection must expose `TYPE_DOUBLE` as well as integer, boolean, and string types; range controls initialize explicit double `GValue`s rather than relying on JavaScript number inference. A missing type constant becomes invalid type zero and can make input behavior appear broken when its numeric metadata was rejected.

GTK accessibility relations use boxed `GtkAccessibleList` values, not object-valued `GValue`s. Project `AccessibleList.new_from_list` by constructing a borrowed `GList` of targets and freeing the temporary container after the native call copies it. Store the result with its boxed GType and `g_value_set_boxed`; the temporary `GValue` owns a copy, and the returned wrapper releases its original boxed value on finalization. GTK copies the target list into the relation and holds weak target references. See [GTK 4.14's list implementation](https://github.com/GNOME/gtk/blob/4.14.5/gtk/gtkaccessible.c) and [reference-list collector](https://github.com/GNOME/gtk/blob/4.14.5/gtk/gtkaccessiblevalue.c). The current GList projection accepts borrowed projected-GObject lists only and throws for ownership-taking or other element types. Keep slider, tooltip, and accessibility fixture coverage when changing this conversion.

Mason clip paths use GTK widget-to-host matrices, their inverses, and snapshot transforms. The pinned SDK omits these matrix calls. The [supplemental declarations](../../../tools/linux-runtime-release/metadata/gtk-matrix/) give the metadata generator the five native pointer signatures used by clipping. Graphene supplies the aligned matrix allocation and the runtime releases it through `interop.adopt`. Run the Mason fixture for both runtimes when changing the metadata or projection.

## Runtime packaging

The V8 runtime at `57408ba` initializes V8 without installing ICU common data. The exploratory x86_64 executable aborts on a standalone `Intl.DateTimeFormat` call when the dataset is absent; typeahead also hits SIGSEGV in V8's `JSSegments::Create`. Supplying the exact ICU 77 data through `ICU_DATA` resolves those crashes. The integration suite forwards `LINUX_RUNTIME_EVAL_ICU_DATA` to the remote native process. The [packaged application test](../../../tools/linux-gtk-tests/test/packaged-app.runtime.mts) checks that the launcher supplies the ICU data for locale formatting. Package a dataset matching the pinned rusty_v8 version, retain its hash and license, and run the smoke before diagnosing UI date or segmentation failures. Do not mistake the fatal “out of memory” message for evidence that increasing the V8 heap is the fix.

The [executable producer](../../../tools/linux-runtime-release/README.md#build-the-pinned-executable) reproduces stripped binaries for x86_64 and aarch64 from frozen source, compiler, and target library inputs. Stable and nightly publication stages the [pinned architecture archives](../../../tools/linux-runtime-release/README.md#stage-the-runtime-pair-for-the-renderer-package) into the renderer tarball. Each payload carries the matching GTK SDK metadata and declarations, ICU, Mason, WebKitGTK and libsoup metadata, and licenses.

The CLI packages both payloads and the launcher selects one at runtime. The installed tarball built and launched a real GTK app on Andromeda x86_64 and with an ARM64 userspace under QEMU on the same VM. Use a native ARM64 host to qualify ARM-specific window, graphics, and input behavior.
