/** @jsxImportSource @octane-xplat/jsx/dom */
import './DocDiscoverPage.inline.css'
// Copyright (c) Meta Platforms, Inc. and affiliates.

import { useState } from 'octane'
import { VStack, HStack } from '@octane-xplat/ui'
import { Heading, Text } from '@octane-xplat/ui'
import { Badge } from '@octane-xplat/ui'
import { TextInput } from '@octane-xplat/ui'
import { Avatar } from '@octane-xplat/ui'
import { Card } from '@octane-xplat/ui'
import { SegmentedControl, SegmentedControlItem } from '@octane-xplat/ui'
import { Divider } from '@octane-xplat/ui'
import { EmptyState } from '@octane-xplat/ui'
import DocTopNav from './DocTopNav'

type Category = 'All' | 'Components' | 'Patterns' | 'Templates' | 'Tools'
const CATEGORIES: Category[] = ['All', 'Components', 'Patterns', 'Templates', 'Tools']

interface DiscoverItem {
	name: string
	description: string
	category: Category
	author: string
	downloads: string
	tags: string[]
}

const ITEMS: DiscoverItem[] = [
	{
		name: 'DataTable',
		description: 'Full-featured data table with sorting, filtering, pagination, and row selection.',
		category: 'Components',
		author: 'Astryx Core',
		downloads: '12.4k',
		tags: ['table', 'data', 'filtering'],
	},
	{
		name: 'FormBuilder',
		description: 'Declarative form composition with built-in validation and error handling.',
		category: 'Patterns',
		author: 'Astryx Core',
		downloads: '8.2k',
		tags: ['form', 'validation', 'input'],
	},
	{
		name: 'Dashboard',
		description: 'Pre-built dashboard template with sidebar nav, stats cards, and chart areas.',
		category: 'Templates',
		author: 'Astryx Team',
		downloads: '6.7k',
		tags: ['dashboard', 'layout', 'analytics'],
	},
	{
		name: 'Theme Editor',
		description: 'Visual editor for customizing and previewing Astryx design tokens in real-time.',
		category: 'Tools',
		author: 'Astryx Team',
		downloads: '3.1k',
		tags: ['theme', 'tokens', 'preview'],
	},
	{
		name: 'NavigationShell',
		description: 'App shell with sidebar, top nav, breadcrumbs, and responsive collapse.',
		category: 'Components',
		author: 'Astryx Core',
		downloads: '9.8k',
		tags: ['navigation', 'shell', 'layout'],
	},
	{
		name: 'CommandPalette',
		description: 'Keyboard-driven command palette for quick actions and search.',
		category: 'Components',
		author: 'Astryx Labs',
		downloads: '4.5k',
		tags: ['search', 'keyboard', 'shortcuts'],
	},
	{
		name: 'Auth Flow',
		description: 'Complete authentication flow with login, registration, and password reset pages.',
		category: 'Templates',
		author: 'Astryx Team',
		downloads: '5.3k',
		tags: ['auth', 'login', 'security'],
	},
	{
		name: 'CRUD Pattern',
		description: 'Create-Read-Update-Delete pattern with modals, toasts, and confirmation dialogs.',
		category: 'Patterns',
		author: 'Astryx Core',
		downloads: '7.1k',
		tags: ['crud', 'modal', 'data'],
	},
	{
		name: 'Vibe Tester',
		description:
			'AI-powered tool for testing component usage and validating design system adherence.',
		category: 'Tools',
		author: 'Astryx Labs',
		downloads: '2.8k',
		tags: ['ai', 'testing', 'quality'],
	},
	{
		name: 'MegaMenu',
		description: 'Full-width dropdown navigation menu with sections, icons, and featured content.',
		category: 'Components',
		author: 'Astryx Core',
		downloads: '5.9k',
		tags: ['navigation', 'menu', 'dropdown'],
	},
	{
		name: 'Settings Page',
		description: 'Settings template with tabbed sections, form fields, and save/cancel actions.',
		category: 'Templates',
		author: 'Astryx Team',
		downloads: '4.0k',
		tags: ['settings', 'form', 'tabs'],
	},
	{
		name: 'Empty States',
		description: 'Reusable empty state patterns with illustrations, CTAs, and guidance text.',
		category: 'Patterns',
		author: 'Astryx Core',
		downloads: '3.6k',
		tags: ['empty', 'placeholder', 'onboarding'],
	},
]

const CATEGORY_BADGE_VARIANT: Record<string, 'info' | 'success' | 'warning'> = {
	Components: 'info',
	Patterns: 'info',
	Templates: 'success',
	Tools: 'warning',
}

function ImagePlaceholder() {
	return (
		<svg
			width="40"
			height="40"
			viewBox="0 0 24 24"
			fill="none"
			stroke="#b0b0b0"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
			<circle cx="8.5" cy="8.5" r="1.5" />
			<polyline points="21 15 16 10 5 21" />
		</svg>
	)
}

export function DocDiscoverPage() {
	const [activeCategory, setActiveCategory] = useState<Category>('All')
	const [search, setSearch] = useState('')

	const filtered = ITEMS.filter((item) => {
		const matchesCategory = activeCategory === 'All' || item.category === activeCategory
		const matchesSearch =
			!search ||
			item.name.toLowerCase().includes(search.toLowerCase()) ||
			item.description.toLowerCase().includes(search.toLowerCase()) ||
			item.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))

		return matchesCategory && matchesSearch
	})

	return (
		<div className="DocDiscoverPage-static-1">
			<DocTopNav />
			<div className="DocDiscoverPage-static-2">
				{/* Compact header: text left, search right */}
				<div className="DocDiscoverPage-static-3">
					<VStack gap={1}>
						<Heading level={1}>Discover</Heading>
						<Text type="body" color="secondary">
							Find components, patterns, templates, and tools for your next project.
						</Text>
					</VStack>

					<div className="DocDiscoverPage-static-4">
						<TextInput
							label="Search"
							isLabelHidden
							placeholder="Search..."
							value={search}
							onChange={setSearch}
							hasClear
						/>
					</div>
				</div>

				{/* Category filter */}
				<div className="DocDiscoverPage-static-5">
					<SegmentedControl
						value={activeCategory}
						onValueChange={(v) => setActiveCategory(v as Category)}
						label="Filter by category"
					>
						{CATEGORIES.map((cat) => (
							<SegmentedControlItem key={cat} value={cat} label={cat} />
						))}
					</SegmentedControl>
				</div>

				{/* Results count */}
				<div className="DocDiscoverPage-static-6">
					<Text type="supporting" color="secondary">
						{filtered.length} result{filtered.length !== 1 ? 's' : ''}
					</Text>
				</div>

				{/* Cards grid or empty state */}
				{filtered.length === 0 ? (
					<div className="DocDiscoverPage-static-7">
						<EmptyState
							title="No results found"
							description="Try adjusting your search or filters."
						/>
					</div>
				) : (
					<div className="DocDiscoverPage-static-8">
						{filtered.map((item) => (
							<Card key={item.name} padding={0}>
								<VStack gap={0}>
									{/* Placeholder image area */}
									<div className="DocDiscoverPage-static-9">
										<ImagePlaceholder />
									</div>

									{/* Card body */}
									<div className="DocDiscoverPage-static-10">
										<VStack gap={3}>
											{/* Name + category badge */}
											<HStack gap={2} vAlign="center">
												<Text type="body" weight="bold">
													{item.name}
												</Text>
												<Badge>{item.category}</Badge>
											</HStack>

											{/* Description */}
											<Text type="supporting" color="secondary">
												{item.description}
											</Text>

											{/* Tags */}
											<div className="DocDiscoverPage-static-11">
												{item.tags.map((tag) => (
													<Badge key={tag}>{tag}</Badge>
												))}
											</div>

											{/* Divider */}
											<Divider />

											{/* Footer: author + installs */}
											<HStack gap={2} vAlign="center" hAlign="between">
												<HStack gap={2} vAlign="center">
													<Avatar fallback={item.author} size={24} />
													<Text type="supporting" color="secondary">
														{item.author}
													</Text>
												</HStack>
												<Text type="supporting" color="secondary">
													{item.downloads} installs
												</Text>
											</HStack>
										</VStack>
									</div>
								</VStack>
							</Card>
						))}
					</div>
				)}
			</div>
		</div>
	)
}
