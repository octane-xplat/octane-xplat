// Port of upstream Popover/PopoverFilterPanel.tsx (Astryx 0.6.4, MIT).
import { useRef, useState } from 'octane'
import { Button, CheckboxInput, Divider, Heading, HStack, Popover, VStack } from '@octane-xplat/ui'

export function PopoverFilterPanel() @{
	const anchor = useRef(null)
	const [isOpen, setIsOpen] = useState(false)
	const [filters, setFilters] = useState({ active: true, archived: false, drafts: true, shared: false })
	const toggle = (key: keyof typeof filters) => setFilters((f) => ({ ...f, [key]: !f[key] }))
	return (
		<>
			<Button ref={anchor} label="Filter" clickAction={() => setIsOpen(true)} />
			<Popover anchor={anchor} open={isOpen} onDismiss={() => setIsOpen(false)} placement="bottom" style={{ width: 240 }}>
				<VStack gap={3} style={{ padding: 'var(--spacing-4)' }}>
					<Heading level={4}>Filter by status</Heading>
					<Divider />
					<CheckboxInput label="Active" value={filters.active} onChange={() => toggle('active')} />
					<CheckboxInput label="Archived" value={filters.archived} onChange={() => toggle('archived')} />
					<CheckboxInput label="Drafts" value={filters.drafts} onChange={() => toggle('drafts')} />
					<CheckboxInput label="Shared with me" value={filters.shared} onChange={() => toggle('shared')} />
					<Divider />
					<HStack gap={2} justify="end">
						<Button label="Apply" variant="primary" clickAction={() => setIsOpen(false)} />
						<Button label="Reset" variant="ghost" clickAction={() => setFilters({ active: true, archived: false, drafts: true, shared: false })} />
					</HStack>
				</VStack>
			</Popover>
		</>
	)
}
