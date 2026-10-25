// Port of upstream DropdownMenuItem/DropdownMenuItemShowcase.tsx (Astryx 0.6.4, MIT).
import { DropdownMenu, DropdownMenuItem } from '@octane-xplat/ui'

export function DropdownMenuItemShowcase() @{
	return (
		<DropdownMenu trigger="Actions" triggerClassName="vx-button vx-button--secondary vx-button--size-md">
			<DropdownMenuItem icon="sandbox-pencil-square" label="Edit" description="Modify this item" onSelect={() => {}} />
			<DropdownMenuItem icon="sandbox-document-duplicate" label="Duplicate" description="Create a copy" onSelect={() => {}} />
			<DropdownMenuItem icon="sandbox-share" label="Share" onSelect={() => {}} />
			<DropdownMenuItem icon="sandbox-trash" label="Delete" description="This action cannot be undone" variant="destructive" onSelect={() => {}} />
		</DropdownMenu>
	)
}
