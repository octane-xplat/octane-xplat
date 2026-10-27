// Copyright (c) Meta Platforms, Inc. and affiliates. MIT. Astryx 0.6.4.
type EntryKind = 'folder' | 'typescript' | 'json' | 'yaml' | 'markdown' | 'text'

export interface RepoEntry extends Record<string, unknown> {
	/** Full path. Doubles as the ArrowLeft parent link and the row key. */
	id: string
	name: string
	kind: EntryKind
	/** Empty on folders — `withRollups` copies the newest commit beneath them. */
	commitMessage: string
	/** Epoch ms. Zero on folders — `withRollups` takes the newest descendant. */
	committedAt: number
	children?: RepoEntry[]
}

const NOW = Date.UTC(2026, 8, 9, 16, 0)

const minutesAgo = (count: number): number => NOW - count * 60_000
const hoursAgo = (count: number): number => NOW - count * 3_600_000
const daysAgo = (count: number): number => NOW - count * 86_400_000

function file(
	path: string,
	kind: EntryKind,
	commitMessage: string,
	committedAt: number,
): RepoEntry {
	return {
		id: path,
		name: path.slice(path.lastIndexOf('/') + 1),
		kind,
		commitMessage,
		committedAt,
	}
}

function folder(path: string, children: RepoEntry[]): RepoEntry {
	return {
		id: path,
		name: path.slice(path.lastIndexOf('/') + 1),
		kind: 'folder',
		commitMessage: '',
		committedAt: 0,
		children,
	}
}

const REPO_TREE: RepoEntry[] = [
	folder('.github', [
		folder('.github/workflows', [
			file(
				'.github/workflows/ci.yml',
				'yaml',
				'ci: cache the pnpm store between runs (#412)',
				hoursAgo(3),
			),
			file(
				'.github/workflows/release.yml',
				'yaml',
				'ci: publish npm provenance on tagged releases (#398)',
				daysAgo(12),
			),
		]),
		file(
			'.github/PULL_REQUEST_TEMPLATE.md',
			'markdown',
			'docs: ask for a repro link in bug reports (#377)',
			daysAgo(61),
		),
	]),
	folder('docs', [
		folder('docs/architecture', [
			file(
				'docs/architecture/rendering.md',
				'markdown',
				'docs: explain the dirty-rect redraw path (#405)',
				daysAgo(5),
			),
			file(
				'docs/architecture/state.md',
				'markdown',
				'docs: describe undo stack ownership (#390)',
				daysAgo(21),
			),
		]),
		// The one nested README. GitHub renders whichever README sits in the
		// folder you are looking at, so this folder gets a preview and the others
		// get none — which is the behaviour worth showing.
		file('docs/README.md', 'markdown', 'docs: add an index for the docs folder (#411)', daysAgo(3)),
		file(
			'docs/contributing.md',
			'markdown',
			'docs: document the release checklist (#402)',
			daysAgo(8),
		),
		file(
			'docs/getting-started.md',
			'markdown',
			'docs: add a first-plugin walkthrough (#369)',
			daysAgo(64),
		),
	]),
	folder('src', [
		folder('src/components', [
			// Three levels deep, so the header trail can outgrow the bar and the
			// collapse menu has something to collapse.
			folder('src/components/canvas', [
				file(
					'src/components/canvas/Canvas.tsx',
					'typescript',
					'fix: keep pointer capture through a drag (#417)',
					hoursAgo(2),
				),
				file(
					'src/components/canvas/layers.ts',
					'typescript',
					'feat: let a group be locked without hiding it (#413)',
					hoursAgo(9),
				),
				file(
					'src/components/canvas/pointer.ts',
					'typescript',
					'fix: release capture when the window blurs (#417)',
					hoursAgo(2),
				),
			]),
			file(
				'src/components/Inspector.tsx',
				'typescript',
				'feat: group the transform fields into one panel (#409)',
				daysAgo(4),
			),
			file(
				'src/components/Toolbar.tsx',
				'typescript',
				'refactor: derive tool state from the store (#396)',
				daysAgo(14),
			),
		]),
		folder('src/lib', [
			file(
				'src/lib/geometry.ts',
				'typescript',
				'perf: stop reallocating the bounds buffer (#414)',
				hoursAgo(20),
			),
			file(
				'src/lib/serialize.ts',
				'typescript',
				'fix: round-trip empty groups without loss (#401)',
				daysAgo(9),
			),
			file(
				'src/lib/shapes.ts',
				'typescript',
				'feat: add polygon and star primitives (#411)',
				daysAgo(3),
			),
		]),
		file(
			'src/main.ts',
			'typescript',
			'chore: move bootstrap behind a feature flag (#415)',
			daysAgo(1),
		),
		file(
			'src/ui.tsx',
			'typescript',
			'fix: restore focus after the modal closes (#407)',
			daysAgo(6),
		),
	]),
	folder('tests', [
		file(
			'tests/geometry.test.ts',
			'typescript',
			'test: cover degenerate bounding boxes (#414)',
			hoursAgo(20),
		),
		file(
			'tests/serialize.test.ts',
			'typescript',
			'test: add a fixture for nested groups (#401)',
			daysAgo(9),
		),
	]),
	file('.gitignore', 'text', 'chore: ignore local coverage output (#380)', daysAgo(49)),
	file('LICENSE', 'text', 'chore: bump the copyright year (#352)', daysAgo(243)),
	file('README.md', 'markdown', 'docs: rewrite the install section (#418)', minutesAgo(30)),
	file('package.json', 'json', 'chore: bump vite to 6.2 (#416)', hoursAgo(18)),
	file('tsconfig.json', 'json', 'build: turn on verbatimModuleSyntax (#393)', daysAgo(35)),
]

/**
 * Give every folder the newest commit beneath it — message and date together,
 * taken from the same child so the two columns never describe different
 * commits. Runs bottom-up, so a folder always agrees with what is inside it.
 */
function withRollups(nodes: RepoEntry[]): RepoEntry[] {
	return nodes.map((node) => {
		if (!node.children || node.children.length === 0) {
			return node
		}
		const children = withRollups(node.children)
		const newest = children.reduce((latest, child) =>
			child.committedAt > latest.committedAt ? child : latest,
		)
		return {
			...node,
			children,
			commitMessage: newest.commitMessage,
			committedAt: newest.committedAt,
		}
	})
}

export const ROLLED_UP = withRollups(REPO_TREE)

export const DEFAULT_EXPANDED = ['src']

const README = `## canvas-editor

A small, embeddable vector canvas. Draw shapes, group them, and serialise the
result to JSON that round-trips without loss.

### Install

\`\`\`bash
npm install canvas-editor
\`\`\`

### Usage

\`\`\`ts
const {Canvas} = await import('canvas-editor');

const canvas = new Canvas(document.querySelector('#root'));
canvas.add({kind: 'rect', x: 0, y: 0, width: 120, height: 80});
\`\`\`

### Status

| Area        | State    | Notes                                  |
| ----------- | -------- | -------------------------------------- |
| Rendering   | Stable   | Dirty-rect redraw, no full repaints    |
| Serialising | Stable   | Round-trips groups and nested shapes   |
| Plugins     | Beta     | API may change before 1.0              |

### Contributing

Read [the contributing guide](#) first. In short:

- One change per pull request, with a test that fails without it.
- Run \`npm test\` before pushing.
- Conventional commits — the changelog is generated from them.

> Issues tagged \`good first issue\` are a reasonable place to start.
`

const DOCS_README = `## Documentation

How the canvas is put together, and how to work on it.

### Start here

- **getting-started.md** — install the package and draw your first shape.
- **contributing.md** — branch naming, the release checklist, how to get review.

### Architecture

The \`architecture/\` folder covers the parts that are hard to infer from the
source: how the dirty-rect redraw path decides what to repaint, and who owns
the undo stack.
`

/*
 * Which folders have a README to show. Keyed by folder id, with the empty
 * string standing for the repo root.
 *
 * Whether a preview appears is decided by the tree, not by this map — a
 * folder shows one only if it actually contains a README file. This just
 * supplies the body for the folders that do, so the two cannot disagree
 * about which folders have one.
 */
const READMES: Record<string, string> = {
	'': README,
	docs: DOCS_README,
}

/**
 * The README to show for the folder currently selected, or `null` when that
 * folder has none — the file list stands on its own and the preview card is
 * dropped rather than left empty.
 *
 * Ids are paths, so the folder is reached by walking its segments.
 */
export function readmeFor(folderId: string | null): string | null {
	let entries = REPO_TREE

	if (folderId != null) {
		for (const segment of folderId.split('/')) {
			const next: RepoEntry | undefined = entries.find(
				(entry) => entry.name === segment && entry.kind === 'folder',
			)

			if (next?.children == null) {
				return null
			}

			entries = next.children
		}
	}

	const hasReadme = entries.some(
		(entry) => entry.kind !== 'folder' && /^readme\.md$/i.test(entry.name),
	)
	return hasReadme ? (READMES[folderId ?? ''] ?? null) : null
}

function isMatch(node: RepoEntry, needle: string): boolean {
	return (
		node.name.toLowerCase().includes(needle) || node.commitMessage.toLowerCase().includes(needle)
	)
}

/**
 * Counts only true matches. `pruneTree` also keeps ancestors, so the visible
 * row count runs ahead of the number of things actually found.
 */
export function countMatches(nodes: RepoEntry[], needle: string): number {
	return nodes.reduce(
		(total, node) =>
			total +
			(isMatch(node, needle) ? 1 : 0) +
			(node.children ? countMatches(node.children, needle) : 0),
		0,
	)
}

/** Keep any branch with a match at or beneath it; drop everything else. */
export function pruneTree(nodes: RepoEntry[], needle: string): RepoEntry[] {
	const kept: RepoEntry[] = []
	for (const node of nodes) {
		const isSelfMatch = isMatch(node, needle)
		const children = node.children ? pruneTree(node.children, needle) : []
		if (isSelfMatch || children.length > 0) {
			kept.push(
				node.children
					? {
							...node,
							children: isSelfMatch && children.length === 0 ? node.children : children,
						}
					: node,
			)
		}
	}
	return kept
}

export function collectIds(nodes: RepoEntry[], into: Set<string>): Set<string> {
	for (const node of nodes) {
		if (node.children && node.children.length > 0) {
			into.add(node.id)
			collectIds(node.children, into)
		}
	}
	return into
}
