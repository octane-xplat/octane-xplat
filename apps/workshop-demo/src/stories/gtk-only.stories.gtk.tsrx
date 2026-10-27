/** @jsxImportSource @octane-xplat/jsx */
import { defineStory } from '@octane-xplat/workshop'

// A platform leaf — must never enter a web or NativeScript bundle.
function GtkLeaf() {
	return <label text="GTK leaf mounted" accessibilityLabel="GTK leaf" />
}

export const GtkOnly = defineStory({
	id: 'platform/linux-gtk',
	title: 'Platform / Linux GTK',
	targets: ['linux'],
	component: GtkLeaf,
	args: {},
})
