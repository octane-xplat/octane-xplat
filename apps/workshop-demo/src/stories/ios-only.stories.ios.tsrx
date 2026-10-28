/** @jsxImportSource @octane-xplat/jsx */
import { defineStory } from '@octane-xplat/workshop'

// A platform leaf — must never enter a web bundle.
// eslint-style: native vocabulary would live here in a real story.
export const IosOnly = defineStory({
	id: 'platform/ios-only',
	title: 'Platform / iOS only',
	targets: ['ios'],
	component: () => null,
	args: {},
})
