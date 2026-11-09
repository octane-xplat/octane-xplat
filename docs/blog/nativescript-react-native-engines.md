# NativeScript and React Native at the engine level

> How JavaScript reaches native APIs, how native views reach the screen, and why those two paths differ between NativeScript and modern React Native.

November 8, 2026

NativeScript and React Native can both put real native views on an iPhone or
Android screen. The useful question is what happens between your JavaScript
and those views.

NativeScript makes native platform objects available to JavaScript through
runtime bindings. React Native combines explicitly exposed native APIs with
a React renderer that manages a native view hierarchy. That difference shapes
how you add platform features, update screens, calculate layout, and schedule
work.

This comparison covers the standard iOS and Android architectures. For React
Native, that means JSI, TurboModules, and Fabric. React Native 0.82 made the
New Architecture the only option, so an explanation built around its old
asynchronous bridge describes an earlier generation.
[React Native's architecture transition](https://reactnative.dev/blog/2026/02/11/react-native-0.84)

## Native API access starts at a different boundary

NativeScript generates **metadata** at build time by inspecting the platform
SDKs and native libraries included in an app. Metadata describes supported
classes, methods, functions, and types. The runtime uses that information to
make native APIs available to JavaScript. Android metadata includes JNI
signatures, which identify calls into the Java runtime; iOS metadata describes
supported Objective-C and C APIs.
[NativeScript metadata](https://docs.nativescript.org/guide/metadata)

React Native normally starts with a narrower, developer-defined contract.
A **TurboModule** exposes native functionality to JavaScript. A **Fabric
component** integrates a native view with React's renderer. Codegen reads
TypeScript or Flow specifications and generates C++ and platform-specific
glue. A library or app still supplies the native implementation. React Native
does not automatically turn the platform SDK into JavaScript objects.
[React Native Codegen](https://reactnative.dev/docs/the-new-architecture/what-is-codegen)

The build-time inputs explain much of the difference:

| | NativeScript | React Native |
| --- | --- | --- |
| Input to binding generation | Supported APIs in SDKs and linked native libraries | Specifications for selected modules and components |
| What JavaScript receives | Wrappers for exposed native classes and objects | Defined module APIs and renderer components |
| Adding access to another native API | Often call an existing runtime binding from JS/TS | Use an existing library or implement an additional native integration |

For example, adding a device-information feature may require only JavaScript
in NativeScript when the needed platform APIs are already bound. In React
Native, an existing library may already expose that feature; otherwise, someone
needs to implement the native integration. That is a difference in where the
integration work happens, rather than a difference in whether the feature is
possible.

NativeScript's broad access still has boundaries. An API must be supported by
its metadata and runtime, included in the build, and available on the device.
Swift APIs commonly need Objective-C exposure before NativeScript can call
them. Adding a new native library or changing native source still requires a
native rebuild.
[Metadata limits](https://docs.nativescript.org/guide/metadata),
[Swift integration](https://docs.nativescript.org/guide/native-code/ios)

## Both can cross into native code without the old bridge

NativeScript represents native objects through JavaScript wrappers. Runtime
bindings dispatch calls into the platform and convert values where needed.
On Android, that includes crossing JNI, the Java Native Interface. On iOS,
the bindings connect JavaScript to supported Objective-C and C APIs.
[NativeScript binding internals](https://github.com/NativeScript/NativeScript/wiki/Deep-dive%3A-How-NativeScript%27s-JS--native-bindings-work)

Modern React Native uses **JSI**, the JavaScript Interface: a C++ interface
between a JavaScript engine and native code. It supports direct function calls
and references to native-backed objects without the old bridge's serialized
messages. TurboModules use this infrastructure, and libraries can also build
custom JSI bindings for resources such as images or databases.
[React Native's JavaScript/native interface](https://reactnative.dev/architecture/landing-page#fast-javascriptnative-interfacing)

The distinction is therefore **general platform bindings versus explicitly
exposed integrations**. Calling one framework "direct" and the other
"bridged" hides what current React Native can do.

Neither approach makes native calls free. Type conversion, allocation, object
lifetimes, and thread coordination still matter. Removing serialized bridge
messages removes one source of overhead; it does not prove that every buffer
or object crosses without a copy. React Native's own architecture guide also
cautions that removing bridge overhead does not automatically improve every
app's performance.
[React Native performance expectations](https://reactnative.dev/architecture/landing-page#what-can-i-expect-from-enabling-the-new-architecture)

## Native views are shared ground; renderer ownership differs

NativeScript Core supplies view objects that wrap platform widgets. React
Native supplies host components managed by Fabric, its native renderer.
A **host component** is a component that the renderer implements using the
platform's UI facilities, rather than another application component.
[NativeScript view model](https://docs.nativescript.org/api/classes/ViewBase),
[Fabric](https://reactnative.dev/architecture/fabric-renderer)

For a concrete example of NativeScript's mapping, its button is backed by
`UIButton` on iOS and `android.widget.Button` on Android. React Native also
uses native views and platform drawing facilities, but a React component is
not necessarily a one-to-one wrapper around a stock widget. Its text rendering,
for example, includes platform text layout.
[NativeScript's native button](https://docs.nativescript.org/ui/button),
[React Native host-view mounting](https://reactnative.dev/architecture/render-pipeline)

Both normally use the platform view hierarchy. Neither standard architecture
requires drawing the entire interface into a single canvas, and neither
automatically means using SwiftUI or Jetpack Compose. Custom graphics libraries
and embedded platform frameworks are separate integration choices.

## A screen update takes a different route

Consider changing a button's caption from "Save" to "Saved". In NativeScript
Core, a property change can flow through its property system to a setter on
the native view. A frontend framework may perform its own work before that
change reaches Core. NativeScript supports several frontends; React
reconciliation is not a requirement of the native runtime.
[NativeScript properties](https://docs.nativescript.org/guide/property-system),
[NativeScript frontend options](https://docs.nativescript.org/)

React Native's normal declarative update goes through React reconciliation
and Fabric. Fabric maintains a C++ **shadow tree**, a representation of the
intended native UI. It calculates layout, commits a new tree, compares it with
the mounted tree, and applies native-view mutations. React can also compose
multiple components without each one requiring its own native view.
[React Native's render pipeline](https://reactnative.dev/architecture/render-pipeline),
[View flattening](https://reactnative.dev/architecture/view-flattening)

These are simplified update paths, not executable code:

```text
NativeScript Core:
View property change → native setter → platform view

React Native:
React update → Fabric shadow tree → layout and commit → native-view mutations
```

The important distinction is who owns the update model. NativeScript provides
native bindings and a view layer that different frontends can drive. React
Native provides a renderer designed around React's rendering and scheduling
model. A direct property change still does not mean the operating system
paints a new frame immediately.

## Layout and threading change the performance tradeoffs

NativeScript Core uses a recursive **measure → layout** process: views first
determine their desired sizes, then receive positions within their parents.
Its layout containers provide different arrangement rules. React Native uses
**Yoga**, a C++ layout engine, to calculate shadow-node positions and sizes;
text and some other components still need platform measurement.
[NativeScript layout](https://docs.nativescript.org/guide/advanced/the-layout-process),
[React Native layout calculation](https://reactnative.dev/architecture/render-pipeline)

Threading adds another substantial difference:

| | NativeScript | React Native |
| --- | --- | --- |
| Normal application JS execution | Main/UI thread | Separate JavaScript thread |
| Native view mutations | UI thread | UI thread |
| Scheduling options | Workers provide isolated background JS contexts | Fabric supports work across threads and synchronous, high-priority rendering paths |
| Consequence of heavy application JS | Can directly delay the UI thread | Can delay React updates even while the native UI thread continues working |

NativeScript's default puts JavaScript close to synchronous native UI access,
but long-running JavaScript competes with UI work. Workers can move suitable
tasks away from the main thread. React Native normally separates application
JavaScript from the UI thread, while Fabric can execute synchronous rendering
paths when needed. A synchronous JSI call does not, by itself, move execution
onto the UI thread.
[NativeScript workers and threading](https://docs.nativescript.org/guide/multithreading),
[React Native threading](https://reactnative.dev/architecture/threading-model)

These architectures create different costs; they do not establish a universal
performance winner. A useful comparison measures the actual workload: layout
complexity, native call frequency, data conversion, and work competing for
each thread.

## The JavaScript engine is a separate choice

The JavaScript engine executes the application language. The native bindings
connect it to platform code. The renderer manages what appears on screen.
Those are distinct jobs.

As of the releases referenced here, NativeScript 9.1's standard iOS and Android
runtimes use V8, while React Native defaults to Hermes V1 beginning with 0.84.
These defaults do not define the entire integration architecture. JSI is an
engine interface, and NativeScript also has work on engine-independent
bindings through Node-API.
[NativeScript 9.1](https://blog.nativescript.org/nativescript-9-1-announcement/),
[React Native's Hermes default](https://reactnative.dev/blog/2026/02/11/react-native-0.84),
[NativeScript's Node-API runtime work](https://github.com/NativeScript/runtimes)

For Octane Xplat readers, this comparison explains the NativeScript runtime
beneath the phone targets. It does not describe every choice made by Xplat's
own UI and layout layers. See [how an Xplat app fits together](../start/architecture.md)
for that next layer.

Put simply: NativeScript gives JavaScript broad access to native objects.
React Native gives React a native rendering system and defined routes into
native code. Both support direct native calls today. The useful differences
are how APIs are exposed, who manages UI updates, and where layout and
application work run.
