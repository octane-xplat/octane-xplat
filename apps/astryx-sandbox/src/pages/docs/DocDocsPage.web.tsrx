/** @jsxImportSource @octane-xplat/jsx/dom */
import './DocDocsPage.inline.css'
// Copyright (c) Meta Platforms, Inc. and affiliates.

import { useState } from 'octane'
import { Button } from '@octane-xplat/ui'
import { Heading, Text } from '@octane-xplat/ui'
import { Badge } from '@octane-xplat/ui'
import { DropdownMenu } from '@octane-xplat/ui'

// ---------------------------------------------------------------------------
// Inline SVG Icons
// ---------------------------------------------------------------------------

const HamburgerIcon = (props: Record<string, any>) => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
		<line x1="3" y1="6" x2="21" y2="6" />
		<line x1="3" y1="12" x2="21" y2="12" />
		<line x1="3" y1="18" x2="21" y2="18" />
	</svg>
)

const SidebarCollapseIcon = (props: Record<string, any>) => (
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth={2}
		strokeLinecap="round"
		strokeLinejoin="round"
		{...props}
	>
		<rect x="3" y="3" width="18" height="18" rx="2" />
		<line x1="9" y1="3" x2="9" y2="21" />
		<polyline points="14 9 11 12 14 15" />
	</svg>
)

const AaIcon = (props: Record<string, any>) => (
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth={1.8}
		strokeLinecap="round"
		strokeLinejoin="round"
		{...props}
	>
		<path d="M3 18L8 6h1l5 12" />
		<line x1="5" y1="14" x2="12" y2="14" />
		<path d="M15 18c0-2.5 1.5-4 3.5-4s3.5 1.5 3.5 4" />
		<line x1="22" y1="18" x2="22" y2="13" />
	</svg>
)

const ChevronDownIcon = (props: Record<string, any>) => (
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth={2}
		strokeLinecap="round"
		strokeLinejoin="round"
		{...props}
	>
		<polyline points="6 9 12 15 18 9" />
	</svg>
)

const _ChevronRightIcon = (props: Record<string, any>) => (
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth={2}
		strokeLinecap="round"
		strokeLinejoin="round"
		{...props}
	>
		<polyline points="9 6 15 12 9 18" />
	</svg>
)

const ExternalLinkIcon = (props: Record<string, any>) => (
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth={2}
		strokeLinecap="round"
		strokeLinejoin="round"
		{...props}
	>
		<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
		<polyline points="15 3 21 3 21 9" />
		<line x1="10" y1="14" x2="21" y2="3" />
	</svg>
)

const CodeIcon = (props: Record<string, any>) => (
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth={2}
		strokeLinecap="round"
		strokeLinejoin="round"
		{...props}
	>
		<polyline points="16 18 22 12 16 6" />
		<polyline points="8 6 2 12 8 18" />
	</svg>
)

const FullscreenIcon = (props: Record<string, any>) => (
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth={2}
		strokeLinecap="round"
		strokeLinejoin="round"
		{...props}
	>
		<path d="M8 3H5a2 2 0 0 0-2 2v3" />
		<path d="M21 8V5a2 2 0 0 0-2-2h-3" />
		<path d="M3 16v3a2 2 0 0 0 2 2h3" />
		<path d="M16 21h3a2 2 0 0 0 2-2v-3" />
	</svg>
)

const PlusIcon = (props: Record<string, any>) => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
		<line x1="12" y1="5" x2="12" y2="19" />
		<line x1="5" y1="12" x2="19" y2="12" />
	</svg>
)

// ---------------------------------------------------------------------------
// Nav Item Component
// ---------------------------------------------------------------------------

function NavItem({
	label,
	isActive,
	onClick,
	hasIcon = true,
	indent = 0,
	hasChevron = false,
	isExpanded = false,
	onToggle,
}: {
	label: string
	isActive?: boolean
	onClick?: () => void
	hasIcon?: boolean
	indent?: number
	hasChevron?: boolean
	isExpanded?: boolean
	onToggle?: () => void
}) {
	const [hovered, setHovered] = useState(false)

	return (
		<div
			onClick={hasChevron ? onToggle : onClick}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: 8,
				padding: '7px 12px',
				paddingLeft: 12 + indent * 16,
				cursor: 'pointer',
				borderRadius: 6,
				margin: '1px 8px',
				backgroundColor: isActive
					? 'rgba(0, 102, 255, 0.08)'
					: hovered
						? 'rgba(0, 0, 0, 0.04)'
						: 'transparent',
				color: isActive ? '#0066FF' : 'var(--color-text-primary, #1a1a1a)',
				fontSize: 14,
				fontWeight: isActive ? 600 : 400,
				transition: 'background-color 150ms ease',
				userSelect: 'none' as const,
			}}
		>
			{hasIcon && (
				<AaIcon
					width={16}
					height={16}
					style={{
						flexShrink: 0,
						opacity: isActive ? 1 : 0.55,
						color: isActive ? '#0066FF' : 'currentColor',
					}}
				/>
			)}
			<span className="DocDocsPage-static-1">{label}</span>
			{hasChevron && (
				<span
					style={{
						display: 'flex',
						transition: 'transform 200ms ease',
						transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
					}}
				>
					<ChevronDownIcon width={14} height={14} className="DocDocsPage-static-2" />
				</span>
			)}
		</div>
	)
}

function SectionLabel({ label, indent = 0 }: { label: string; indent?: number }) {
	return (
		<div
			style={{
				fontSize: 11,
				fontWeight: 600,
				color: 'var(--color-text-secondary, #6b7785)',
				textTransform: 'uppercase' as const,
				letterSpacing: '0.05em',
				padding: '12px 12px 4px',
				paddingLeft: 12 + indent * 16,
				margin: '0 8px',
			}}
		>
			{label}
		</div>
	)
}

// ---------------------------------------------------------------------------
// Code Preview with syntax highlighting
// ---------------------------------------------------------------------------

const BUTTON_CODE_LINES: Array<{ spans: Array<{ text: string; color: string }> }> = [
	{
		spans: [
			{ text: 'import ', color: '#c678dd' },
			{ text: '{', color: '#abb2bf' },
			{ text: 'Button', color: '#e5c07b' },
			{ text: '}', color: '#abb2bf' },
			{ text: ' from ', color: '#c678dd' },
			{ text: "'@astryxdesign/core/Button'", color: '#98c379' },
			{ text: ';', color: '#abb2bf' },
		],
	},
	{ spans: [{ text: '', color: '#abb2bf' }] },
	{
		spans: [
			{ text: 'export default ', color: '#c678dd' },
			{ text: 'function ', color: '#c678dd' },
			{ text: 'Example', color: '#61afef' },
			{ text: '() {', color: '#abb2bf' },
		],
	},
	{
		spans: [
			{ text: '  return ', color: '#c678dd' },
			{ text: '(', color: '#abb2bf' },
		],
	},
	{
		spans: [
			{ text: '    <', color: '#abb2bf' },
			{ text: 'Button', color: '#e5c07b' },
		],
	},
	{
		spans: [
			{ text: '      label', color: '#d19a66' },
			{ text: '=', color: '#abb2bf' },
			{ text: '"Button"', color: '#98c379' },
		],
	},
	{
		spans: [
			{ text: '      variant', color: '#d19a66' },
			{ text: '=', color: '#abb2bf' },
			{ text: '"primary"', color: '#98c379' },
		],
	},
	{
		spans: [
			{ text: '      icon', color: '#d19a66' },
			{ text: '={<', color: '#abb2bf' },
			{ text: 'PlusIcon', color: '#e5c07b' },
			{ text: ' />}', color: '#abb2bf' },
		],
	},
	{ spans: [{ text: '    />', color: '#abb2bf' }] },
	{ spans: [{ text: '  );', color: '#abb2bf' }] },
	{ spans: [{ text: '}', color: '#abb2bf' }] },
]

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function DocDocsPage() {
	const [activeNav, setActiveNav] = useState('button')
	const [inputsExpanded, setInputsExpanded] = useState(true)
	const [showCode, setShowCode] = useState(true)
	const [activeRightNav, setActiveRightNav] = useState('usage')

	return (
		<div className="DocDocsPage-static-3">
			{/* ================================================================= */}
			{/* LEFT SIDEBAR */}
			{/* ================================================================= */}
			<aside className="DocDocsPage-static-4">
				{/* Header */}
				<div className="DocDocsPage-static-5">
					<div className="DocDocsPage-static-6">
						<Button label="Menu" variant="ghost" size="sm" icon={<HamburgerIcon />} />
						<span className="DocDocsPage-static-7">Astryx</span>
						<span className="DocDocsPage-static-8" />
						<span className="DocDocsPage-static-9">Docs</span>
					</div>
					<Button
						label="Collapse sidebar"
						variant="ghost"
						size="sm"
						icon={<SidebarCollapseIcon />}
					/>
				</div>

				{/* Nav */}
				<nav className="DocDocsPage-static-10">
					<NavItem
						label="Getting started"
						isActive={activeNav === 'getting-started'}
						onClick={() => setActiveNav('getting-started')}
					/>
					<NavItem
						label="Quick start"
						isActive={activeNav === 'quick-start'}
						onClick={() => setActiveNav('quick-start')}
					/>

					<SectionLabel label="Components" />

					<NavItem
						label="Button"
						isActive={activeNav === 'button'}
						onClick={() => setActiveNav('button')}
					/>
					<NavItem
						label="Stepper"
						isActive={activeNav === 'stepper'}
						onClick={() => setActiveNav('stepper')}
					/>
					<NavItem
						label="Inputs"
						hasChevron
						isExpanded={inputsExpanded}
						onToggle={() => setInputsExpanded(!inputsExpanded)}
					/>

					{inputsExpanded && (
						<>
							<SectionLabel label="Text & Number" indent={1} />
							<NavItem
								label="Text input"
								indent={1}
								isActive={activeNav === 'text-input'}
								onClick={() => setActiveNav('text-input')}
							/>
							<NavItem
								label="Number input"
								indent={1}
								isActive={activeNav === 'number-input'}
								onClick={() => setActiveNav('number-input')}
							/>
							<NavItem
								label="Text area"
								indent={1}
								isActive={activeNav === 'text-area'}
								onClick={() => setActiveNav('text-area')}
							/>

							<SectionLabel label="Date" indent={1} />
							<NavItem
								label="Date picker"
								indent={1}
								isActive={activeNav === 'date-picker'}
								onClick={() => setActiveNav('date-picker')}
							/>
							<NavItem
								label="Date input"
								indent={1}
								isActive={activeNav === 'date-input'}
								onClick={() => setActiveNav('date-input')}
							/>
							<NavItem
								label="Time range picker"
								indent={1}
								isActive={activeNav === 'time-range-picker'}
								onClick={() => setActiveNav('time-range-picker')}
							/>
						</>
					)}
				</nav>
			</aside>
			{/* ================================================================= */}
			{/* MAIN CONTENT */}
			{/* ================================================================= */}
			<main className="DocDocsPage-static-11">
				<div className="DocDocsPage-static-12">
					{/* Title */}
					<h1 className="DocDocsPage-static-13">Button</h1>

					{/* Date line */}
					<p className="DocDocsPage-static-14">March 30, 2026 · Updated 5:40 p.m. PST</p>

					{/* ============================================================= */}
					{/* Live Preview Panel */}
					{/* ============================================================= */}
					<div className="DocDocsPage-static-15">
						{/* Preview Header Bar */}
						<div className="DocDocsPage-static-16">
							<span className="DocDocsPage-static-17">Live preview</span>
							<div className="DocDocsPage-static-18">
								<Button
									label="Open in Craft"
									variant="ghost"
									size="sm"
									icon={<ExternalLinkIcon />}
								/>
								<DropdownMenu
									button={{
										label: 'Variant',
										variant: 'ghost',
										size: 'sm',
									}}
									hasChevron
									items={[
										{ label: 'Primary', type: 'action', key: 'noop', onSelect: () => {} },
										{ label: 'Secondary', type: 'action', key: 'noop', onSelect: () => {} },
										{ label: 'Ghost', type: 'action', key: 'noop', onSelect: () => {} },
									]}
								/>
								<DropdownMenu
									button={{
										label: 'Light',
										variant: 'ghost',
										size: 'sm',
									}}
									hasChevron
									items={[
										{ label: 'Light', type: 'action', key: 'noop', onSelect: () => {} },
										{ label: 'Dark', type: 'action', key: 'noop', onSelect: () => {} },
									]}
								/>
								<Button
									label="Toggle code"
									variant={showCode ? 'secondary' : 'ghost'}
									size="sm"
									icon={<CodeIcon />}
									clickAction={() => setShowCode(!showCode)}
								/>
								<Button label="Fullscreen" variant="ghost" size="sm" icon={<FullscreenIcon />} />
							</div>
						</div>

						{/* Preview + Code Split */}
						<div className="DocDocsPage-static-19">
							{/* Preview Area */}
							<div className="DocDocsPage-static-20">
								<Button
									label="Button"
									variant="primary"
									icon={<PlusIcon />}
									endContent={<Badge>{'New'}</Badge>}
								/>
							</div>

							{/* Code Panel */}
							{showCode && (
								<div className="DocDocsPage-static-21">
									<pre className="DocDocsPage-static-22">
										{BUTTON_CODE_LINES.map((line, i) => (
											<div key={i} className="DocDocsPage-static-23">
												<span className="DocDocsPage-static-24">{i + 1}</span>
												<span>
													{line.spans.map((s, j) => (
														<span key={j} style={{ color: s.color }}>
															{s.text}
														</span>
													))}
												</span>
											</div>
										))}
									</pre>
								</div>
							)}
						</div>
					</div>

					{/* ============================================================= */}
					{/* Documentation Content */}
					{/* ============================================================= */}
					<div className="DocDocsPage-static-25">
						<Heading level={2}>A button initiates an instantaneous action.</Heading>
					</div>

					<div className="DocDocsPage-static-26">
						<Text type="body">
							Buttons are clickable elements used to trigger actions. They communicate calls to
							action to the user and allow users to interact with pages in a variety of ways. Button
							labels express what action will occur when the user interacts with it. Buttons can
							contain a combination of a clear label and an icon, while standalone icon buttons are
							reserved for recurring, universally understood actions.
						</Text>
					</div>

					<div className="DocDocsPage-static-27">
						<Heading level={3}>When to use</Heading>
					</div>

					<ul className="DocDocsPage-static-28">
						<li>Triggering form submissions or confirming a dialog</li>
						<li>Navigating to a new page or view within the application</li>
						<li>Starting a new process or workflow (e.g., &quot;Create new&quot;)</li>
						<li>Toggling a UI element or performing an inline action</li>
						<li>
							Performing destructive actions such as deleting items; use the danger variant for
							these
						</li>
					</ul>
				</div>
			</main>
			{/* ================================================================= */}
			{/* RIGHT SIDEBAR */}
			{/* ================================================================= */}
			<aside className="DocDocsPage-static-29">
				<div className="DocDocsPage-static-30">On this page</div>
				{[
					{ id: 'usage', label: 'Usage' },
					{ id: 'code', label: 'Code' },
					{ id: 'tokens', label: 'Tokens' },
					{ id: 'accessibility', label: 'Accessibility' },
				].map((item) => (
					<div
						key={item.id}
						onClick={() => setActiveRightNav(item.id)}
						style={{
							fontSize: 13,
							padding: '6px 0',
							cursor: 'pointer',
							color:
								activeRightNav === item.id ? '#0066FF' : 'var(--color-text-secondary, #6b7785)',
							fontWeight: activeRightNav === item.id ? 600 : 400,
							borderLeft:
								activeRightNav === item.id ? '2px solid #0066FF' : '2px solid transparent',
							paddingLeft: 12,
							transition: 'color 150ms ease',
						}}
					>
						{item.label}
					</div>
				))}
			</aside>
		</div>
	)
}
