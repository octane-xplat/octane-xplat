// Port of upstream Center/CenterHorizontal.tsx (Astryx 0.6.4, MIT).
import { Card, Center, Icon, IconButton, Stack } from '@octane-xplat/ui'

export function CenterHorizontal() @{
	<Card width={520} padding={2}>
		<Center axis="horizontal" width="100%">
			<Stack direction="horizontal" gap={0} vAlign="center">
				<IconButton label="Bold" icon={<Icon name="sandbox-bold" />} variant="ghost" size="sm" />
				<IconButton
					label="Italic"
					icon={<Icon name="sandbox-italic" />}
					variant="ghost"
					size="sm"
				/>
				<IconButton
					label="Underline"
					icon={<Icon name="sandbox-underline" />}
					variant="ghost"
					size="sm"
				/>
				<IconButton
					label="List"
					icon={<Icon name="sandbox-list-bullet" />}
					variant="ghost"
					size="sm"
				/>
				<IconButton
					label="Link"
					icon={<Icon name="sandbox-external-link" />}
					variant="ghost"
					size="sm"
				/>
				<IconButton
					label="Image"
					icon={<Icon name="xplat-doc-image" />}
					variant="ghost"
					size="sm"
				/>
			</Stack>
		</Center>
	</Card>
}
