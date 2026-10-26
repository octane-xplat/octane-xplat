// Port of upstream (sandbox)/page.tsx — searchable, category-filtered home
// catalog. Layout parts are composed via PageLayout; the responsive grid is
// the CSS equivalent of Grid columns={{minWidth: 320}}.

import { useState } from 'octane'
import { Heading, Text, TextInput, ToggleButton, ToggleButtonGroup, Divider, VStack, View, Icon } from '@octane-xplat/ui'
import { categories } from '../data/sandboxPages'
import { PageLayout } from '../shell/PageLayout'
import { ProjectCard } from '../shell/ProjectCard'
import { SandboxShell } from '../shell/SandboxShell'

const homeCategories = categories.filter((category) => category.slug !== 'templates')
const CATEGORY_FILTERS = ['All', ...homeCategories.map((c) => c.label)]
const allPages = homeCategories.flatMap((c) => c.pages.map((p) => ({ ...p, category: c.label })))

export function HomeScreen() @{
	const [activeTab, setActiveTab] = useState('All')
	const [search, setSearch] = useState('')

	let filtered = activeTab === 'All' ? allPages : allPages.filter((p) => p.category === activeTab)
	if (search.trim()) {
		const q = search.toLowerCase()
		filtered = filtered.filter(
			(p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
		)
	}

	// Category-filtered views show one ungrouped grid; "All" keeps the
	// per-category sections, each led by a divider (upstream ordering).
	const grouped = activeTab === 'All'
		? homeCategories
			.map((c) => ({ category: c.label, pages: filtered.filter((p) => p.category === c.label) }))
			.filter((s) => s.pages.length > 0)
		: null

	return (
		<SandboxShell>
			<PageLayout title="Astryx Sandbox">
				<VStack gap={6}>
					<VStack gap={4}>
						<TextInput
							label="Search"
							isLabelHidden
							placeholder="Search..."
							value={search}
							onChange={setSearch}
							startIcon={<Icon name="sandbox-search" size={16} />}
							size="lg"
						/>
						<ToggleButtonGroup
							label="Filter by category"
							value={activeTab}
							onChange={(v) => setActiveTab(v ?? 'All')}
						>
							{CATEGORY_FILTERS.map((cat) => (
								<ToggleButton key={cat} label={cat} value={cat} size="lg" />
							))}
						</ToggleButtonGroup>
					</VStack>

					{filtered.length === 0 ? (
						<View className="sb-empty">
							<Text className="sb-type-supporting sb-color-secondary">No results found.</Text>
						</View>
					) : grouped != null ? (
						<VStack gap={6}>
							{grouped.flatMap((section) => [
								<Divider key={`d-${section.category}`} />,
								<VStack gap={6} key={section.category}>
									<Heading level={2}>{section.category}</Heading>
									<View className="sb-card-grid">
										{section.pages.map((page) => (
											<ProjectCard key={page.href} page={page} />
										))}
									</View>
								</VStack>,
							])}
						</VStack>
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
