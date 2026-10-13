import { defineWorkshopConfig } from '@octane-xplat/workshop'

export default defineWorkshopConfig({
	stories: {
		include: [
		'src/**/*.stories.{ts,tsx,tsrx}',
		'src/**/*.stories.{web,mobile,ios,android,macos,windows,linux}.{ts,tsx,tsrx}',
	],
	},
})
