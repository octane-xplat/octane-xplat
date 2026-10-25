// Port of upstream (sandbox)/page.tsx — searchable, category-filtered home
// catalog. Layout parts are composed via PageLayout; the responsive grid is
// the CSS equivalent of Grid columns={{minWidth: 320}}.

import { useState } from 'octane'
import { Heading, Text, SearchInput, Divider, VStack, View } from '@octane-xplat/ui'
import { categories } from '../data/sandboxPages'
import { PageLayout } from '../shell/PageLayout'
import { ProjectCard } from '../shell/ProjectCard'
import { SandboxShell } from '../shell/SandboxShell'

const homeCategories = categories.filter((category) => category.slug !== 'templates')
const allPages = homeCategories.flatMap((c) => c.pages.map((p) => ({ ...p, category: c.label })))

export function HomeScreen() @{
	const [search, setSearch] = useState('')

	let filtered = allPages
	if (search.trim()) {
		const q = search.toLowerCase()
		filtered = filtered.filter(
			(p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
		)
	}

	const grouped = homeCategories
		.map((c) => ({ category: c.label, pages: filtered.filter((p) => p.category === c.label) }))
		.filter((s) => s.pages.length > 0)

	return (
		<SandboxShell>
			<PageLayout title="Astryx Sandbox">
				<VStack gap={6}>
					<VStack gap={4}>
						<SearchInput
							label="Search"
							isLabelHidden
							placeholder="Search..."
							value={search}
							onChange={setSearch}
							size="lg"
						/>
						{/* ToggleButtonGroup category filter is deferred — the group
						    blanks the screen at render time; recorded in docs/coverage.md. */}
					</VStack>

					{filtered.length === 0 ? (
						<View className="sb-empty">
							<Text className="sb-type-supporting sb-color-secondary">No results found.</Text>
						</View>
					) : (
						<VStack gap={6}>
							{grouped.map((section) => (
								<VStack gap={6} key={section.category}>
									<Divider />
									<Heading level={2}>{section.category}</Heading>
									<View className="sb-card-grid">
										{section.pages.map((page) => (
											<ProjectCard key={page.href} page={page} />
										))}
									</View>
								</VStack>
							))}
						</VStack>
					)}
				</VStack>
			</PageLayout>
		</SandboxShell>
	)
}
