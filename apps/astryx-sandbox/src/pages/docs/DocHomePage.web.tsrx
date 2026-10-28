import './DocHomePage.inline.css'
// Copyright (c) Meta Platforms, Inc. and affiliates.

import { useState } from 'octane'
import { Heading, Text } from '@octane-xplat/ui'
import { Button } from '@octane-xplat/ui'
import { Card } from '@octane-xplat/ui'
import { TextArea } from '@octane-xplat/ui'
import { categories } from '../../data/sandboxPages'
import DocTopNav from './DocTopNav'

const allPages = categories.flatMap((cat) => cat.pages.map((p) => ({ ...p, category: cat.label })))

const GRID_AREAS = `"a a b b b" "c c c d d" "e f f g g" "h h i i i"`
const GRID_ROWS = '280px 320px 260px 300px'
const AREA_KEYS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']

export function DocHomePage() {
	const [search, setSearch] = useState('')

	const filtered = search
		? allPages.filter(
				(p) =>
					p.name.toLowerCase().includes(search.toLowerCase()) ||
					p.category.toLowerCase().includes(search.toLowerCase()),
			)
		: allPages

	const gridItems = filtered.slice(0, 8)

	return (
		<div className="DocHomePage-static-1">
			<DocTopNav />

			<div className="DocHomePage-static-2">
				{/* Left Hero */}
				<div className="DocHomePage-static-3">
					<div className="DocHomePage-static-4">
						<Heading level={1}>Endless templates for your ideas</Heading>
						<Text type="large" color="secondary">
							Explore production-ready templates, patterns, and components built with Astryx.
						</Text>
					</div>

					<div className="DocHomePage-static-5">
						<Button label="Get started" variant="secondary" size="lg" />
						<Button label="Browse all" variant="ghost" size="lg" />
					</div>

					{/* Search at bottom */}
					<div className="DocHomePage-static-6">
						<TextArea
							label="Search"
							isLabelHidden
							placeholder="See endless designs for..."
							value={search}
							onChange={setSearch}
							rows={2}
						/>
					</div>
				</div>

				{/* Right Masonry Grid */}
				<div className="DocHomePage-static-7">
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(5, 1fr)',
							gridTemplateAreas: GRID_AREAS,
							gridTemplateRows: GRID_ROWS,
							gap: 12,
							height: '100%',
						}}
					>
						{gridItems.map((page, i) => (
							<a
								key={page.href}
								href={page.href}
								style={{
									gridArea: AREA_KEYS[i % AREA_KEYS.length],
									textDecoration: 'none',
									display: 'flex',
								}}
							>
								<Card width="100%">
									<div className="DocHomePage-static-8">
										{/* Placeholder image area */}
										<div className="DocHomePage-static-9">
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
										</div>
										{/* Label */}
										<div className="DocHomePage-static-10">
											<Text type="supporting" color="secondary">
												{page.name}
											</Text>
										</div>
									</div>
								</Card>
							</a>
						))}
					</div>
				</div>
			</div>
		</div>
	)
}
