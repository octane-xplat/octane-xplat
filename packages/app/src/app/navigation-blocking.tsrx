/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Button, Screen, Text, View } from '@octane-xplat/ui'
import type { Renderable } from '@octane-xplat/ui'
import { useNavigationBlocker, useRouter } from '@octane-xplat/ui/routing'

export const head = { title: 'Unsaved changes · Octane Xplat' }

/** A complete client-confirmation example; the application owns persistence. */
export function NavigationBlocking(): Renderable {
	const [dirty, setDirty] = useState(false)
	const navigation = useRouter()
	const blocker = useNavigationBlocker({ when: dirty })
	return (
		<Screen id="navigation-blocking" className="vx-app detail gap-3">
			<Text className="text-2xl font-semibold">Unsaved navigation</Text>
			<Text>Edit the draft, then try Back.</Text>
			<Text id="navigation-blocking-dirty">{dirty ? 'Unsaved draft' : 'Saved draft'}</Text>
			<Text id="navigation-blocking-status">{blocker.status}</Text>
			<Button id="navigation-blocking-edit" label="Edit draft" clickAction={() => setDirty(true)} />
			<Button
				id="navigation-blocking-back"
				label="Back"
				clickAction={() => {
					void navigation.back()
				}}
			/>
			{blocker.status === 'blocked' ? (
				<View className="sink-section">
					<Text>Leave without saving?</Text>
					<Button id="navigation-blocking-keep" label="Keep editing" clickAction={blocker.reset} />
					<Button
						id="navigation-blocking-leave"
						label="Leave screen"
						clickAction={blocker.proceed}
					/>
				</View>
			) : null}
		</Screen>
	)
}
