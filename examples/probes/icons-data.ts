import type { IconifyJSON } from '@octane-xplat/icons'

// Small app-owned sets keep this diagnostic independent of any set dependency/license.
export const iconFixture: IconifyJSON = {
	prefix: 'probe-icons',
	width: 32,
	height: 16,
	icons: {
		wide: { body: '<path fill="currentColor" d="M0 0h32v16H0z"/>' },
		gradient: {
			body: '<defs><linearGradient id="paint"><stop stop-color="red"/><stop offset="1" stop-color="blue"/></linearGradient></defs><path fill="url(#paint)" d="M0 0h32v16H0z"/>',
		},
	},
	aliases: { turned: { parent: 'wide', rotate: 1 } },
}

export const otherIconFixture: IconifyJSON = {
	prefix: 'probe-other',
	width: 24,
	height: 24,
	icons: { dot: { body: '<circle cx="12" cy="12" r="10" fill="#ff0000"/>' } },
}
