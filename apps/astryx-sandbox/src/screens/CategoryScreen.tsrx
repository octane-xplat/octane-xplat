// Port of upstream (sandbox)/[category]/CategoryContent.tsx — searchable
// page grid for one category.

import { useState } from 'octane'
import { Heading, Text, TextInput, VStack, View, Icon, Layout, LayoutHeader, LayoutContent } from '@octane-xplat/ui'
import { categories } from '../data/sandboxPages'
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
			<Layout
				header={
					<LayoutHeader hasDivider padding={6}>
						<Heading level={1}>{category.label}</Heading>
					</LayoutHeader>
				}
				content={
					<LayoutContent padding={6}>
						<VStack gap={6}>
							<TextInput
								label="Search"
								isLabelHidden
								placeholder="Search..."
								value={search}
								onChange={setSearch}
								startIcon={<Icon name="sandbox-search" size={16} />}
								size="lg"
							/>
							{filtered.length === 0 ? (
								<View className="sb-empty">
									<Text type="supporting" color="secondary">No results found.</Text>
								</View>
							) : (
								<View className="sb-card-grid">
									{filtered.map((page) => (
										<ProjectCard key={page.href} page={page} />
									))}
								</View>
							)}
						</VStack>
					</LayoutContent>
				}
			/>
		</SandboxShell>
	)
}
