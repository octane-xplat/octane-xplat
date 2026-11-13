# Octane Xplat

> Build apps for the web, iOS, and Android from ==one project==.

Build a packing checklist, a reading app, or a workspace with several screens.
Keep the shared screens and logic in ==one TypeScript codebase==, then adapt
the parts that need a platform's own controls. iOS and Android use native
views through NativeScript. macOS, Windows, and Linux hosts are experimental.

Octane Xplat gives you the pieces to build an app: screens, buttons, text
fields, navigation, and access to device features such as the camera. You can
share most of your code between a browser and a phone, and customize parts
for each when you need to.

```tsx
import { View, Text, Pressable } from '@octane-xplat/ui'

export function Example() {
  return (
    <View>
      <Text>Packing list</Text>
      <Pressable onPress={() => console.log('Add item')}>
        <Text>Add item</Text>
      </Pressable>
    </View>
  )
}
```

You can write the code yourself, work with a coding agent, or mix the two.
If you're new to programming, start with a small app you can open in your
browser. You don't need to know React or set up a phone simulator to take
that first step.

Start with the browser app below. Make one change, try it, and then bring
that working screen to a phone. If you use a coding agent, the setup prompt
on this page gives it the same guides and conventions.

## Start here

1. ==[Create your first app](start/toolchain.md#create-and-run)==. Set up the tools,
   create a project, and open the starter in your browser.
2. [Try your first change](start/toolchain.md#build-and-check-your-first-flow).
   Turn the starter into a packing checklist: add an item, mark it packed,
   and remove it. The guide includes a prompt for your coding agent and
   actions you can try to check the result.

Still deciding whether Xplat fits your idea? Read [what you can build](start/spec.md).
The starter includes web, iOS, and Android. Desktop support is experimental
and needs additional setup. Xplat is at version `0.x`, so names and options
can change between releases.

## Add your next feature

Pick a guide when you need it. You don't need to read them all before you start.

| I want to…                                      | Read this                                              |
| ----------------------------------------------- | ------------------------------------------------------ |
| Put text, buttons, and lists on a screen        | [Building screens](app/primitives.md)                  |
| Share a component between apps | [Publish a component library](app/component-libraries.md) |
| Install build plugins separately from the CLI | [Project build plugins](packages/package-build.md) |
| Understand the owned NativeScript renderer | [NativeScript renderer](packages/package-nativescript-octane.md) |
| Configure the native compiler and hot updates | [NativeScript Octane build integration](packages/package-vite-octane.md) |
| Save settings and packing records | [Local storage](app/local-storage.md) |
| Change colors, spacing, and fonts               | [Styling screens](app/styling.md)                      |
| Make a screen work with assistive technology    | [Accessible screens](app/accessibility.md)             |
| Validate and save form values | [Forms with validation](packages/package-form.md) |
| Let someone type into a form                    | [Enter and submit text](app/text-entry.md)             |
| Add scoped keyboard commands | [Keyboard shortcuts](app/keyboard-shortcuts.md); [API reference](app/keyboard-shortcuts-api.md) |
| Fire a command while the app is unfocused | [Global shortcuts](packages/package-global-shortcuts.md) |
| Migrate changed UI value and unit props         | [UI API migrations](app/ui-api-migrations.md)          |
| Move between screens                            | [Moving between screens](app/navigation.md)            |
| Run a deferrable refresh                        | [Background work](platform/background-work.md)       |
| Sell and restore a phone purchase               | [In-app purchases](platform/in-app-purchases.md)      |
| Sign in and restore an account                 | [Authentication](app/authentication.md)               |
| Show screen loading and failures | [Readiness](app/readiness.md) |
| Load information from a server                  | [Fetching data](app/data.md)                           |
| Save a setting, attach a photo, or share a link | [Using device features](platform/platform-services.md) |
| Hash or encrypt app data | [Crypto](packages/package-crypto.md) |
| Print a document or export a PDF | [Print and PDF files](packages/package-print.md) |
| Collect a payment | [Stripe checkout](packages/package-stripe.md) |
| Browse photos and manage albums | [Device media library](packages/package-media-library.md) |
| Resize or export a cropped photo | [Transform images](packages/package-image-manipulator.md) |
| Build and distribute a phone release            | [Release a phone app](start/native-release.md)        |
| Update an installed phone app between releases  | [Phone app updates](app/updates.md)                    |
| Compare native build inputs before an update | [Native fingerprints](packages/package-fingerprint.md) |
| Keep the phone launch screen until startup is ready | [Launch-screen control](packages/package-splash-screen.md) |
| Ask for tracking authorization | [Tracking authorization](packages/package-tracking-transparency.md) |
| Capture a card as an image | [View capture](packages/package-view-shot.md) |
| Observe or choose the phone interface orientation | [Screen orientation](packages/package-screen-orientation.md) |

For more pieces to use on your screens, browse the [component index](app/components.md).
When a feature is ready to try, use [Checking an Xplat app](testing/testing.md) and
check [known limits](testing/known-limits.md) for the platforms you plan to release for.
To let a connected agent run named setup actions in a dev build (test logins,
fixture data, performance scenarios), see
[Declare development actions](testing/development-actions.md).

[Develop a component in the workshop](testing/component-workshop.md) to edit
props and reset fixtures in a separate development preview.

[Diagnose production errors](testing/production-errors.md) for release identity,
source maps and separate native crash checks.

[Read development diagnostics](testing/diagnostics.md), including output captured
before an agent connects and retained after a development process exits.

If a native screen stutters or eats memory while scrolling images, see
[Debug native image performance](testing/image-performance.md).

## When you're ready to go further

To try your app on a phone, follow [iOS and Android setup](start/toolchain.md#run-on-ios-and-android).
For ready-to-read HTML on the Web, see [server rendering](platform/web-rendering.md).
For desktop apps, start with [platform support and limits](start/spec.md#choose-your-targets).

If you want to understand how screens and device features connect, read
[How an app fits together](start/architecture.md). For extra instructions and
reference material to give your coding agent, see
[Agent context and versions](start/toolchain.md#agent-context-and-versions).

For a deeper look at the runtime beneath the phone targets, read
[NativeScript and React Native at the engine level](blog/nativescript-react-native-engines.md).

If you're extending or debugging the framework itself, open the
[design notes](../.agents/design/README.md). They collect decisions, proposals,
and design research; you can leave that detail until you need it. Framework
implementation notes are indexed in [`.agents/docs/`](../.agents/docs/README.md).

[Try a small demo](demos/browser-demos.md): reach a goal or pack a day-trip checklist in your browser.
