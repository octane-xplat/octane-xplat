# Octane Xplat

> Build apps for the web, iOS, and Android from ==one project==.

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

## Start here

1. ==[Create your first app](toolchain.md#create-and-run)==. Set up the tools,
   create a project, and open the starter in your browser.
2. [Try your first change](toolchain.md#build-and-check-your-first-flow).
   Turn the starter into a packing checklist: add an item, mark it packed,
   and remove it. The guide includes a prompt for your coding agent and
   actions you can try to check the result.

Still deciding whether Xplat fits your idea? Read [what you can build](spec.md).
The starter includes web, iOS, and Android. Desktop support is experimental
and needs additional setup. Xplat is at version `0.x`, so names and options
can change between releases.

## Add your next feature

Pick a guide when you need it. You don't need to read them all before you start.

| I want to…                                      | Read this                                     |
| ----------------------------------------------- | --------------------------------------------- |
| Put text, buttons, and lists on a screen        | [Building screens](primitives.md)             |
| Change colors, spacing, and fonts               | [Styling screens](styling.md)                 |
| Let someone type into a form                    | [Enter and submit text](text-entry.md)        |
| Move between screens                            | [Moving between screens](navigation.md)       |
| Load information from a server                  | [Fetching data](data.md)                      |
| Save a setting, attach a photo, or share a link | [Using device features](platform-services.md) |

For more pieces to use on your screens, browse the [component index](components.md).
When a feature is ready to try, use [Checking an Xplat app](testing.md) and
check [known limits](known-limits.md) for the platforms you plan to release for.

## When you're ready to go further

To try your app on a phone, follow [iOS and Android setup](toolchain.md#run-on-ios-and-android).
For desktop apps, start with [platform support and limits](spec.md#choose-your-targets).

If you want to understand how screens and device features connect, read
[How an app fits together](architecture.md). For extra instructions and
reference material to give your coding agent, see
[Agent context and versions](toolchain.md#agent-context-and-versions).

If you're extending or debugging the framework itself, start with
[framework status](status.md) and [architecture notes](architecture-notes.md).
These include work in progress and past experiments; you can leave them
until you need that detail.
