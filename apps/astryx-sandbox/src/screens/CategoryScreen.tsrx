// Port of upstream (sandbox)/[category]/CategoryContent.tsx — searchable
// page grid for one category.

import { useState } from 'octane'
import { Heading, Text, SearchInput, VStack, View } from '@octane-xplat/ui'
import { categories } from '../data/sandboxPages'
import { PageLayout } from '../shell/PageLayout'
import { ProjectCard } from '../shell/ProjectCard'
import { SandboxShell } from '../shell/SandboxShell'
import { NotFoundScreen } from './NotFoundScreen'

export function CategoryScreen(props: { slug: string }) @{
	const category = categories.find((c) => c.slug === props.slug)
	const [search, setSearch] = useState('')

	if (!category) {
		return <NotFoundScreen title="Not Found" message={`Category "${props.slug}" doesn't exist.`} />
	}

	const q = search.trim().toLowerCase()
	const filtered = !q
		? category.pages
		: category.pages.filter(
				(p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
			)

	return (
		<SandboxShell>
			<PageLayout title={category.label}>
				<VStack gap={6}>
					<SearchInput
						label="Search"
						isLabelHidden
						placeholder="Search..."
						value={search}
						onChange={setSearch}
						size="lg"
					/>
					{filtered.length === 0 ? (
						<View className="sb-empty">
							<Text className="sb-type-supporting sb-color-secondary">No results found.</Text>
						</View>
					) : (
						<View className="sb-card-grid">
							{filtered.map((page) => (
								<ProjectCard key={page.href} page={page} />
							))}
						</View>
					)}
				</VStack>
			</PageLayout>
		</SandboxShell>
	)
}
