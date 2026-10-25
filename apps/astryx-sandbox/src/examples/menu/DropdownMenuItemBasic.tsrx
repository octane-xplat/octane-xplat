// Port of upstream DropdownMenuItem/DropdownMenuItemBasic.tsx (Astryx 0.6.4, MIT).
import { DropdownMenu, DropdownMenuItem } from '@octane-xplat/ui'

export function DropdownMenuItemBasic() @{
	return (
		<DropdownMenu trigger="Actions" triggerClassName="vx-button vx-button--secondary vx-button--size-md">
			<DropdownMenuItem label="Edit" description="Modify this item" onSelect={() => {}} />
			<DropdownMenuItem label="Duplicate" description="Create a copy" onSelect={() => {}} />
			<DropdownMenuItem label="Delete" description="This action cannot be undone" onSelect={() => {}} />
		</DropdownMenu>
	)
}
