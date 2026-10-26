// Port of upstream IconButton/IconButtonLoadingToggle.tsx (Astryx 0.6.4, MIT).
import { useState } from 'octane'
import { HStack, Icon, IconButton } from '@octane-xplat/ui'

export function IconButtonLoadingToggle() @{
	const [loadingId, setLoadingId] = useState<string | null>(null)
	const handle = (id: string) => { setLoadingId(id); setTimeout(() => setLoadingId(null), 1500) }
	<HStack gap={2}>
		<IconButton label="Copy" icon={<Icon name="xplat-copy" color="inherit" />} variant="primary" isLoading={loadingId === 'copy'} clickAction={() => handle('copy')} />
		<IconButton label="Search" icon={<Icon name="xplat-search" color="inherit" />} isLoading={loadingId === 'search'} clickAction={() => handle('search')} />
		<IconButton label="Close" icon={<Icon name="xplat-close" color="inherit" />} variant="ghost" isLoading={loadingId === 'close'} clickAction={() => handle('close')} />
	</HStack>
}
