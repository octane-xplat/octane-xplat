// Port of upstream CommandPalette/CommandPaletteAsyncSearch.tsx (Astryx 0.6.4, MIT).
// Upstream isOpen/isInline → open (the public palette renders inline when
// open); input slot → placeholder. Async searchSource contract preserved.
import { useMemo } from 'octane'
import { CommandPalette } from '@octane-xplat/ui'

const allFiles = [
	{ id: 'readme', label: 'README.md' },
	{ id: 'package', label: 'package.json' },
	{ id: 'tsconfig', label: 'tsconfig.json' },
	{ id: 'index', label: 'src/index.ts' },
	{ id: 'app', label: 'src/App.tsx' },
]

export function CommandPaletteAsyncSearch() @{
	const source = useMemo(
		() => ({
			async search(query: string) {
				await new Promise((r) => setTimeout(r, 400))
				return allFiles.filter((f) => f.label.toLowerCase().includes(query.toLowerCase()))
			},
			bootstrap() {
				return []
			},
		}),
		[],
	)

	<CommandPalette
		open
		onOpenChange={() => {}}
		searchSource={source}
		placeholder="Search files..."
		emptyBootstrapText="Type a filename to search"
		emptySearchText="No files found"
	/>
}
