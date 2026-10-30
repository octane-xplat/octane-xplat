# @octane-xplat/ui

Build shared screens with text, buttons, fields, lists, and layouts. The
same components serve web, iOS, and Android; desktop hosts are experimental
and have [specific support limits](https://octane-xplat.goddardai.org/spec#choose-your-targets).
Xplat is in alpha, so APIs can change between releases.

For a new project, use the [first-app guide](https://octane-xplat.goddardai.org/toolchain#create-and-run).
It configures the renderer, compiler, and styles. Installing this package alone
does not configure an existing app.

## Add a small screen

In an already configured Xplat app, install the UI package and its Octane peer:

```sh
bun add @octane-xplat/ui octane
```

Keep the required structural stylesheet in your app entry. The starter already
imports it; the second import adds the optional default appearance:

```ts
import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
```

Put this component in a `.tsx` or `.tsrx` screen and render it from your app.
`useState` remembers the count; pressing the button changes the text:

```tsx
import { useState } from 'octane'
import { Pressable, Text, VStack } from '@octane-xplat/ui'

export function PackingCount() {
	const [count, setCount] = useState(0)
	return (
		<VStack>
			<Text>{count} items packed</Text>
			<Pressable onPress={() => setCount(count + 1)}>
				<Text>Pack an item</Text>
			</Pressable>
		</VStack>
	)
}
```

Press **Pack an item** twice: the label should read **2 items packed**.
Reloading resets it to zero. To keep data between sessions, follow
[device storage](https://octane-xplat.goddardai.org/platform-services).

## Build the next part

| Task                                      | Guide                                                                  |
| ----------------------------------------- | ---------------------------------------------------------------------- |
| Arrange text, buttons, and lists          | [Building screens](https://octane-xplat.goddardai.org/primitives)      |
| Find a component                          | [Component index](https://octane-xplat.goddardai.org/components)       |
| Change colors, spacing, and fonts         | [Styling screens](https://octane-xplat.goddardai.org/styling)          |
| Connect screens with typed routes         | [Move between screens](https://octane-xplat.goddardai.org/navigation)  |
| Show bounded records and configure table text | [Tables](https://octane-xplat.goddardai.org/tables) |
| Load and share server data                | [Fetching data](https://octane-xplat.goddardai.org/data)               |
| Choose a platform-specific implementation | [Platform files](https://octane-xplat.goddardai.org/module-resolution) |

Use `className` for static styles and `style` for values calculated while the
app runs. Keep browser APIs out of shared screens. Native targets need their
platform toolchain; [phone setup](https://octane-xplat.goddardai.org/toolchain#run-on-ios-and-android)
walks through it after the browser app works.

Check [known limits](https://octane-xplat.goddardai.org/known-limits) for each
feature and target you plan to ship. For agents,
[llms.txt](https://octane-xplat.goddardai.org/llms.txt) indexes the same guides.
