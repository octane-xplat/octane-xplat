# Octane Xplat

> Build apps for the web, iOS, and Android from ==one project==.

With Octane Xplat you build the app once and ship it everywhere: ==one
TypeScript codebase== becomes apps for web, iOS, and Android — the same
product behavior on each, with OS-native controls where a platform calls for
them. NativeScript drives real platform widgets on iOS and Android — no
webview. macOS, Windows, and Linux hosts are experimental.

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

What you get is an incredibly efficient way to build for all of your users, no
matter where they are. You get elite performance thanks to native rendering,
and the ability to add the platform-specific details that matter (e.g. Liquid
Glass). It's what we've been dreaming of for a long time and we've finally
cracked the code thanks to AI, Octane.js, and NativeScript.

==Save tokens/usage.== Write once. Deploy everywhere. Be part of the future and
help contribute on Github.

Grab the agent prompt and send it to your coding agent to easily get started.

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
| Change colors, spacing, and fonts               | [Styling screens](app/styling.md)                      |
| Let someone type into a form                    | [Enter and submit text](app/text-entry.md)             |
| Move between screens                            | [Moving between screens](app/navigation.md)            |
| Load information from a server                  | [Fetching data](app/data.md)                           |
| Save a setting, attach a photo, or share a link | [Using device features](platform/platform-services.md) |

For more pieces to use on your screens, browse the [component index](app/components.md).
When a feature is ready to try, use [Checking an Xplat app](verify/testing.md) and
check [known limits](verify/known-limits.md) for the platforms you plan to release for.
If a native screen stutters or eats memory while scrolling images, see
[Debug native image performance](verify/image-performance.md).

## When you're ready to go further

To try your app on a phone, follow [iOS and Android setup](start/toolchain.md#run-on-ios-and-android).
For desktop apps, start with [platform support and limits](start/spec.md#choose-your-targets).

If you want to understand how screens and device features connect, read
[How an app fits together](start/architecture.md). For extra instructions and
reference material to give your coding agent, see
[Agent context and versions](start/toolchain.md#agent-context-and-versions).

If you're extending or debugging the framework itself, open the
[design notes](notes/README.md). They collect decisions, implementation records,
and past experiments; you can leave that detail until you need it.
