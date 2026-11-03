/** Shared Markdown scenario data and the 0.7.4 capability inventory —
 *  consumed by both renderers and the Node parity runner. No JSX.
 *
 *  Source of truth: facebook/astryx packages/core, release tag v0.7.4
 *  (commit 704757fd827c6fa00a71af80b06d5da99d155e45), verified identical
 *  to the published @astryxdesign/core@0.7.4 tarball src/ tree except for
 *  generated i18n locale files. */

export const ASTRYX_BASELINE = 'astryx-0.7.4'
export const ASTRYX_REVIEWED_COMMIT = '704757fd827c6fa00a71af80b06d5da99d155e45'

export type MarkdownCapabilityKind =
	| 'prop'
	| 'renderer'
	| 'grammar'
	| 'parser'
	| 'protocol'
	| 'helper'
	| 'streaming'
	| 'render'
	| 'integration'

/** Where the capability stands in the 0.7.4 release itself. */
export type MarkdownCapabilityStatus =
	/** Shipped public surface in the 0.7.4 artifact. */
	| 'shipped'
	/** Declared in the 0.7.4 spec but not shipped in the artifact. */
	| 'spec-only'
	/** Added upstream after 0.7.4 — tracked separately, not a parity target. */
	| 'post-0.7.4'

export type MarkdownCapabilityCoverage =
	| { readonly fixture: string }
	| { readonly question: string }

export type MarkdownCapability = {
	/** Stable id, e.g. 'prop:autolink'. Used in scenario tags and Silo keys. */
	readonly id: string
	readonly kind: MarkdownCapabilityKind
	readonly summary: string
	/** Upstream source path inside packages/core at ASTRYX_REVIEWED_COMMIT. */
	readonly sourceRef: string
	readonly status: MarkdownCapabilityStatus
	/** Owning plan milestone (1–7; 0 rows only track the inventory itself). */
	readonly milestone: number
	/** Fixture key that exercises the capability, or an explicit question. */
	readonly coverage: MarkdownCapabilityCoverage
	/** Milestone-0 read of the local candidate against the target. */
	readonly local: 'missing' | 'partial' | 'divergent' | 'present'
}

const MD = 'packages/core/src/Markdown'
const cap = (c: MarkdownCapability) => c

export const markdownCapabilities: MarkdownCapability[] = [
	// ------------------------------------------------------------------
	// Component props (MarkdownProps, src/Markdown/Markdown.tsx)
	// ------------------------------------------------------------------
	cap({
		id: 'prop:children-source',
		kind: 'prop',
		summary:
			"children: string is the sole document source. Octane's text/data split is a framework adaptation: text maps to children, data (baked MdDoc) is additive.",
		sourceRef: `${MD}/Markdown.tsx`,
		status: 'shipped',
		milestone: 3,
		coverage: { fixture: 'prose-basic' },
		local: 'divergent',
	}),
	cap({
		id: 'prop:display',
		kind: 'prop',
		summary:
			"display: 'block'|'inline'; inline renders a single markdown target with no block anatomy, for spans inside surrounding text.",
		sourceRef: `${MD}/Markdown.tsx`,
		status: 'shipped',
		milestone: 3,
		coverage: { fixture: 'inline-display' },
		local: 'missing',
	}),
	cap({
		id: 'prop:density',
		kind: 'prop',
		summary: "density: 'default'|'compact' scales per-block spacing (heading major/minor, paragraph, codeblock, blockquote, list, table, hr, image).",
		sourceRef: `${MD}/Markdown.tsx`,
		status: 'shipped',
		milestone: 3,
		coverage: { fixture: 'prose-basic' },
		local: 'present',
	}),
	cap({
		id: 'prop:headingLevelStart',
		kind: 'prop',
		summary: 'headingLevelStart 1..6 shifts rendered heading levels, clamping at h6. Default 1.',
		sourceRef: `${MD}/Markdown.tsx`,
		status: 'shipped',
		milestone: 3,
		coverage: { fixture: 'heading-shift' },
		local: 'present',
	}),
	cap({
		id: 'prop:isStreaming',
		kind: 'prop',
		summary:
			'isStreaming internally smooths bursty chunks via useStreamingText and animates new text through a boundary-ring fade.',
		sourceRef: `${MD}/Markdown.tsx`,
		status: 'shipped',
		milestone: 4,
		coverage: { fixture: 'stream-basic' },
		local: 'divergent',
	}),
	cap({
		id: 'prop:onLinkClick',
		kind: 'prop',
		summary:
			'onLinkClick(href, event) intercepts link activation on the default renderer; returning false cancels navigation.',
		sourceRef: `${MD}/Markdown.tsx`,
		status: 'shipped',
		milestone: 3,
		coverage: { fixture: 'link-intercept' },
		local: 'missing',
	}),
	cap({
		id: 'prop:sources',
		kind: 'prop',
		summary:
			'sources map turns [id] and 【id】 markers into citation chips; unknown ids fall back to {title: id}; no sources means literal text.',
		sourceRef: `${MD}/Markdown.tsx`,
		status: 'shipped',
		milestone: 3,
		coverage: { fixture: 'citation-label' },
		local: 'partial',
	}),
	cap({
		id: 'prop:citationStyle',
		kind: 'prop',
		summary: "citationStyle 'label'|'number' picks chip vs sequential-number badge. Default 'label'.",
		sourceRef: `${MD}/Markdown.tsx`,
		status: 'shipped',
		milestone: 3,
		coverage: { fixture: 'citation-number' },
		local: 'missing',
	}),
	cap({
		id: 'prop:contentWidth',
		kind: 'prop',
		summary: 'contentWidth number|string constrains prose blocks (default 680); tables and code blocks stay container-width.',
		sourceRef: `${MD}/Markdown.tsx`,
		status: 'shipped',
		milestone: 3,
		coverage: { fixture: 'content-width' },
		local: 'missing',
	}),
	cap({
		id: 'prop:contentAlign',
		kind: 'prop',
		summary: "contentAlign 'start'|'center' positions prose inside the container when narrower than contentWidth. Default 'start'.",
		sourceRef: `${MD}/Markdown.tsx`,
		status: 'shipped',
		milestone: 3,
		coverage: { fixture: 'content-width' },
		local: 'missing',
	}),
	cap({
		id: 'prop:components',
		kind: 'prop',
		summary: 'components replaces default renderers per node kind; replaced blocks lose their Markdown theme target.',
		sourceRef: `${MD}/Markdown.tsx`,
		status: 'shipped',
		milestone: 3,
		coverage: { fixture: 'custom-renderers' },
		local: 'missing',
	}),
	cap({
		id: 'prop:plugins',
		kind: 'prop',
		summary: 'plugins is one ordered list of opaque createMarkdownPlugin() entries driving syntax → transform → render.',
		sourceRef: `${MD}/Markdown.tsx`,
		status: 'shipped',
		milestone: 5,
		coverage: { fixture: 'plugin-frontmatter' },
		local: 'present',
	}),
	cap({
		id: 'prop:inlinePlugins',
		kind: 'prop',
		summary:
			'inlinePlugins (legacy) transform text-node patterns via pattern/getEndIndex/render; ordered first-match-wins, text nodes only.',
		sourceRef: `${MD}/Markdown.tsx`,
		status: 'shipped',
		milestone: 5,
		coverage: { fixture: 'inline-plugin' },
		local: 'present',
	}),
	cap({
		id: 'prop:autolink',
		kind: 'prop',
		summary: "autolink: 'gfm' opt-in turns bare URLs/www/angle forms/emails into links with GFM trailing-punctuation exclusions.",
		sourceRef: `${MD}/Markdown.tsx`,
		status: 'shipped',
		milestone: 3,
		coverage: { fixture: 'autolink-gfm' },
		local: 'missing',
	}),
	cap({
		id: 'prop:base',
		kind: 'prop',
		summary:
			'BaseProps carry xstyle, className, style, id, data-*, aria-*, role, tabIndex onto the Document root; ref targets div (block) or span (inline).',
		sourceRef: `${MD}/Markdown.tsx`,
		status: 'shipped',
		milestone: 3,
		coverage: { question: 'Which BaseProps surface (aria/data/id/style) maps to Octane root props vs web-only leaves?' },
		local: 'partial',
	}),

	// ------------------------------------------------------------------
	// Renderer slots (MarkdownComponents)
	// ------------------------------------------------------------------
	cap({
		id: 'renderer:code',
		kind: 'renderer',
		summary: 'code({code, language?, sourceLines?}) renders every fence no semantic-fence plugin claims, including claimed fences whose renderer declines/throws/suspends.',
		sourceRef: `${MD}/Markdown.tsx`,
		status: 'shipped',
		milestone: 3,
		coverage: { fixture: 'custom-renderers' },
		local: 'missing',
	}),
	cap({
		id: 'renderer:inlineCode',
		kind: 'renderer',
		summary: 'inlineCode({children: string}) replaces the inline-code span.',
		sourceRef: `${MD}/Markdown.tsx`,
		status: 'shipped',
		milestone: 3,
		coverage: { fixture: 'custom-renderers' },
		local: 'missing',
	}),
	cap({
		id: 'renderer:math',
		kind: 'renderer',
		summary: "math({value, display:'inline'|'block', sourceLines?}) both enables $…$/$$…$$ parsing and renders expressions as inert text.",
		sourceRef: `${MD}/Markdown.tsx`,
		status: 'shipped',
		milestone: 3,
		coverage: { fixture: 'math-opt-in' },
		local: 'missing',
	}),
	cap({
		id: 'renderer:citation',
		kind: 'renderer',
		summary: "citation({source, number, variant:'label'|'number'}) replaces the citation chip.",
		sourceRef: `${MD}/Markdown.tsx`,
		status: 'shipped',
		milestone: 3,
		coverage: { fixture: 'custom-renderers' },
		local: 'missing',
	}),
	cap({
		id: 'renderer:link',
		kind: 'renderer',
		summary: 'link({href, children}) receives the sanitized href; onLinkClick does not wrap custom links.',
		sourceRef: `${MD}/Markdown.tsx`,
		status: 'shipped',
		milestone: 3,
		coverage: { fixture: 'custom-renderers' },
		local: 'missing',
	}),
	cap({
		id: 'renderer:heading',
		kind: 'renderer',
		summary: 'heading({level, children, id?, sourceLines?}); callers own applying the shared allocated id.',
		sourceRef: `${MD}/Markdown.tsx`,
		status: 'shipped',
		milestone: 3,
		coverage: { fixture: 'custom-renderers' },
		local: 'missing',
	}),
	cap({
		id: 'renderer:paragraph',
		kind: 'renderer',
		summary: 'paragraph({children, sourceLines?}) replaces paragraph blocks.',
		sourceRef: `${MD}/Markdown.tsx`,
		status: 'shipped',
		milestone: 3,
		coverage: { fixture: 'custom-renderers' },
		local: 'missing',
	}),
	cap({
		id: 'renderer:image',
		kind: 'renderer',
		summary: 'image({src, alt, sourceLines?}) receives only safe URLs; unsafe URLs render the fallback part.',
		sourceRef: `${MD}/Markdown.tsx`,
		status: 'shipped',
		milestone: 3,
		coverage: { fixture: 'image-unsafe' },
		local: 'missing',
	}),
	cap({
		id: 'renderer:blockquote',
		kind: 'renderer',
		summary: 'blockquote({children, sourceLines?}) replaces quote chrome.',
		sourceRef: `${MD}/Markdown.tsx`,
		status: 'shipped',
		milestone: 3,
		coverage: { fixture: 'custom-renderers' },
		local: 'missing',
	}),
	cap({
		id: 'renderer:hr',
		kind: 'renderer',
		summary: 'hr({sourceLines?}) replaces the thematic break.',
		sourceRef: `${MD}/Markdown.tsx`,
		status: 'shipped',
		milestone: 3,
		coverage: { fixture: 'custom-renderers' },
		local: 'missing',
	}),

	// ------------------------------------------------------------------
	// Grammar / parser behavior
	// ------------------------------------------------------------------
	cap({
		id: 'grammar:headings',
		kind: 'grammar',
		summary: 'ATX headings (0-3 leading spaces, 1-6 #s, optional closing sequence) and Setext underlines.',
		sourceRef: `${MD}/parser.ts`,
		status: 'shipped',
		milestone: 2,
		coverage: { fixture: 'headings' },
		local: 'partial',
	}),
	cap({
		id: 'grammar:paragraphs',
		kind: 'grammar',
		summary: 'Paragraphs with lazy continuation inside quotes and list items; blank line or interrupting block closes.',
		sourceRef: `${MD}/parser.ts`,
		status: 'shipped',
		milestone: 2,
		coverage: { fixture: 'lazy-continuation' },
		local: 'missing',
	}),
	cap({
		id: 'grammar:fences',
		kind: 'grammar',
		summary: 'Fenced code (```/~~~), info string + meta, indented fences, unclosed fence runs to EOF, final-newline handling.',
		sourceRef: `${MD}/parser.ts`,
		status: 'shipped',
		milestone: 2,
		coverage: { fixture: 'fences' },
		local: 'partial',
	}),
	cap({
		id: 'grammar:lists',
		kind: 'grammar',
		summary:
			'Ordered/unordered lists incl. start values, bullets, nested items, continuation; mixed task+plain items keep individual checked state per level.',
		sourceRef: `${MD}/parser.ts`,
		status: 'shipped',
		milestone: 2,
		coverage: { fixture: 'lists' },
		local: 'partial',
	}),
	cap({
		id: 'grammar:task-lists',
		kind: 'grammar',
		summary: 'Task-list markers are per-item semantics inside ordinary lists, not a list kind.',
		sourceRef: `${MD}/parser.ts`,
		status: 'shipped',
		milestone: 2,
		coverage: { fixture: 'task-list' },
		local: 'partial',
	}),
	cap({
		id: 'grammar:blockquotes',
		kind: 'grammar',
		summary: 'Nested blockquotes with omitted repeated markers (lazy continuation) and inner block structure.',
		sourceRef: `${MD}/parser.ts`,
		status: 'shipped',
		milestone: 2,
		coverage: { fixture: 'blockquote-nested' },
		local: 'missing',
	}),
	cap({
		id: 'grammar:tables',
		kind: 'grammar',
		summary: 'GFM tables: alignment row, escaped \\| in cells and inside inline-code spans, indented tables.',
		sourceRef: `${MD}/parser.ts`,
		status: 'shipped',
		milestone: 2,
		coverage: { fixture: 'table-pipes' },
		local: 'partial',
	}),
	cap({
		id: 'grammar:links',
		kind: 'grammar',
		summary:
			'Inline links: angle/plain destinations, balanced parens (linear bound), bracket labels incl. nested code and long labels, titles.',
		sourceRef: `${MD}/parser.ts`,
		status: 'shipped',
		milestone: 2,
		coverage: { fixture: 'links' },
		local: 'partial',
	}),
	cap({
		id: 'grammar:reference-links',
		kind: 'grammar',
		summary: 'Reference-style links resolve against document-global definitions; late definitions invalidate incremental settled cache.',
		sourceRef: `${MD}/parser.ts`,
		status: 'shipped',
		milestone: 2,
		coverage: { fixture: 'reference-links' },
		local: 'missing',
	}),
	cap({
		id: 'grammar:images',
		kind: 'grammar',
		summary: 'Image syntax with alt text; unsafe destinations render the fallback Image part rather than the custom renderer.',
		sourceRef: `${MD}/parser.ts`,
		status: 'shipped',
		milestone: 2,
		coverage: { fixture: 'image-unsafe' },
		local: 'missing',
	}),
	cap({
		id: 'grammar:emphasis',
		kind: 'grammar',
		summary: 'strong/emphasis/delete delimiter rules incl. intraword cases, nesting, and delimiter-run edges.',
		sourceRef: `${MD}/parser.ts`,
		status: 'shipped',
		milestone: 2,
		coverage: { fixture: 'emphasis' },
		local: 'partial',
	}),
	cap({
		id: 'grammar:code-spans',
		kind: 'grammar',
		summary: 'Inline code spans: variable backtick runs, whitespace trim, unmatched backtick stays literal; opaque to other syntax.',
		sourceRef: `${MD}/parser.ts`,
		status: 'shipped',
		milestone: 2,
		coverage: { fixture: 'code-spans' },
		local: 'partial',
	}),
	cap({
		id: 'grammar:breaks',
		kind: 'grammar',
		summary: 'Hard breaks via trailing spaces (and soft line endings; softBreaks helper maps them to hard breaks when installed).',
		sourceRef: `${MD}/parser.ts`,
		status: 'shipped',
		milestone: 2,
		coverage: { fixture: 'hard-breaks' },
		local: 'partial',
	}),
	cap({
		id: 'grammar:thematic-break',
		kind: 'grammar',
		summary: '---/***/___ thematic breaks vs setext/list ambiguity resolution.',
		sourceRef: `${MD}/parser.ts`,
		status: 'shipped',
		milestone: 2,
		coverage: { fixture: 'thematic-break' },
		local: 'partial',
	}),
	cap({
		id: 'grammar:character-references',
		kind: 'grammar',
		summary: 'Named/numeric character references decode in prose; invalid/out-of-range become U+FFFD or stay literal.',
		sourceRef: `${MD}/characterReferences.ts`,
		status: 'shipped',
		milestone: 2,
		coverage: { fixture: 'entities' },
		local: 'missing',
	}),
	cap({
		id: 'grammar:escapes',
		kind: 'grammar',
		summary: 'Backslash escapes for ASCII punctuation; structural escapes like \\| inside table cells.',
		sourceRef: `${MD}/parser.ts`,
		status: 'shipped',
		milestone: 2,
		coverage: { fixture: 'escapes' },
		local: 'partial',
	}),
	cap({
		id: 'grammar:autolinks',
		kind: 'grammar',
		summary: "autolink 'gfm': bare https?/www/angle <scheme:>/<email>/bare user@host; trailing punctuation peeling; skipped in code/links/alt.",
		sourceRef: `${MD}/parser.ts`,
		status: 'shipped',
		milestone: 2,
		coverage: { fixture: 'autolink-gfm' },
		local: 'missing',
	}),
	cap({
		id: 'grammar:citations',
		kind: 'grammar',
		summary: '[id] and 【id】 markers become citation nodes only when the id is in sourceIds; otherwise plain text/links.',
		sourceRef: `${MD}/parser.ts`,
		status: 'shipped',
		milestone: 2,
		coverage: { fixture: 'citation-label' },
		local: 'partial',
	}),
	cap({
		id: 'grammar:math',
		kind: 'grammar',
		summary:
			'Opt-in $…$/$$…$$ with delimiter boundary rules (no whitespace touch, digit adjacency barred), escapes, opaque contexts.',
		sourceRef: `${MD}/parser.ts`,
		status: 'shipped',
		milestone: 2,
		coverage: { fixture: 'math-opt-in' },
		local: 'missing',
	}),
	cap({
		id: 'grammar:indentation',
		kind: 'grammar',
		summary: 'Indented constructs: indented code blocks, indented fences/tables, ATX indentation, incremental indentation parity.',
		sourceRef: `${MD}/parser.ts`,
		status: 'shipped',
		milestone: 2,
		coverage: { fixture: 'indentation' },
		local: 'missing',
	}),

	// ------------------------------------------------------------------
	// Parser public API
	// ------------------------------------------------------------------
	cap({
		id: 'parser:parseMarkdown',
		kind: 'parser',
		summary: 'parseMarkdown → legacy BlockNode[] projection; parseMarkdownAst → canonical MarkdownAstRoot; both accept options+plugins.',
		sourceRef: `${MD}/parser.ts`,
		status: 'shipped',
		milestone: 2,
		coverage: { fixture: 'prose-basic' },
		local: 'partial',
	}),
	cap({
		id: 'parser:parseInline',
		kind: 'parser',
		summary: 'parseInline/parseInlineAst return phrasing content for inline display and custom inline use.',
		sourceRef: `${MD}/parser.ts`,
		status: 'shipped',
		milestone: 2,
		coverage: { fixture: 'inline-display' },
		local: 'missing',
	}),
	cap({
		id: 'parser:incremental',
		kind: 'parser',
		summary:
			'parseMarkdownIncremental + createIncrementalState; cache invalidates on autolink/math/sourceRanges/sourceIds/plugin-syntax/linkDefs changes.',
		sourceRef: `${MD}/parser.ts`,
		status: 'shipped',
		milestone: 2,
		coverage: { fixture: 'stream-basic' },
		local: 'partial',
	}),
	cap({
		id: 'parser:options',
		kind: 'parser',
		summary: 'CommonParseOptions: sourceIds, plugins, autolink, sourceRanges, math, isFinal; legacy ReadonlySet<string> compat accepted.',
		sourceRef: `${MD}/parser.ts`,
		status: 'shipped',
		milestone: 2,
		coverage: { fixture: 'citation-label' },
		local: 'missing',
	}),
	cap({
		id: 'parser:ast',
		kind: 'parser',
		summary:
			'Canonical recursive MarkdownAst* tree (23 node kinds incl. extension), position/source provenance, MarkdownAstNodeMap + visitMarkdownNodes.',
		sourceRef: `${MD}/ast.ts`,
		status: 'shipped',
		milestone: 2,
		coverage: { fixture: 'prose-basic' },
		local: 'missing',
	}),
	cap({
		id: 'parser:trimStreamingArtifacts',
		kind: 'parser',
		summary: 'trimStreamingArtifacts strips trailing incomplete inline syntax (incl. open math) from the last line for streaming display.',
		sourceRef: `${MD}/parser.ts`,
		status: 'shipped',
		milestone: 4,
		coverage: { question: 'Does the Octane stream trim seam already cover every upstream case (math, multi-line constructs)?' },
		local: 'partial',
	}),
	cap({
		id: 'parser:decodeMarkdownCharacterReferences',
		kind: 'parser',
		summary: 'decodeMarkdownCharacterReferences(text) exposed as a server-safe utility matching render-time decoding.',
		sourceRef: `${MD}/characterReferences.ts`,
		status: 'shipped',
		milestone: 2,
		coverage: { fixture: 'entities' },
		local: 'missing',
	}),
	cap({
		id: 'parser:server-safe',
		kind: 'parser',
		summary:
			"Markdown/parser, /plugins, /utils, /remark subpaths carry no 'use client'; parsing+plugin construction run in server/RSC code.",
		sourceRef: `${MD}/index.ts`,
		status: 'shipped',
		milestone: 2,
		coverage: { question: 'Which Octane entrypoint equivalently isolates pure parsing from the component on native bundles?' },
		local: 'partial',
	}),

	// ------------------------------------------------------------------
	// Plugin protocol
	// ------------------------------------------------------------------
	cap({
		id: 'protocol:createMarkdownPlugin',
		kind: 'protocol',
		summary:
			"createMarkdownPlugin validates {name, apiVersion:1, syntax?|transform, renderers}, freezes/brands the entry; malformed definitions throw.",
		sourceRef: `${MD}/plugins/protocol.ts`,
		status: 'shipped',
		milestone: 5,
		coverage: { question: 'Which validation failures throw vs degrade when plugins are malformed?' },
		local: 'present',
	}),
	cap({
		id: 'protocol:syntax',
		kind: 'protocol',
		summary:
			"Ordered syntax contributions: startsWith prefixes, maxSpan bound, tokenize → 'no-match'|'defer'|'match'{end,node}; inline and block contexts.",
		sourceRef: `${MD}/plugins/protocol.ts`,
		status: 'shipped',
		milestone: 5,
		coverage: { question: 'Which bounded-progress and deferral semantics must Octane tokenizers honor?' },
		local: 'present',
	}),
	cap({
		id: 'protocol:transform',
		kind: 'protocol',
		summary:
			'Immutable document transforms run syntax→transform→render; deep-readonly input, validated+frozen replacement roots, idempotent reruns per stream update.',
		sourceRef: `${MD}/plugins/protocol.ts`,
		status: 'shipped',
		milestone: 5,
		coverage: { question: 'How does Octane enforce readonly/freeze without a structuredClone cost per transform?' },
		local: 'present',
	}),
	cap({
		id: 'protocol:renderers',
		kind: 'protocol',
		summary:
			'Typed per-node renderers {render,toText}; pure render callbacks, hooks only inside returned components; decline/throw/suspend fall back.',
		sourceRef: `${MD}/plugins/protocol.ts`,
		status: 'shipped',
		milestone: 5,
		coverage: { question: 'Which Octane boundary reproduces throw/pending/decline fallback on web and native?' },
		local: 'present',
	}),
	cap({
		id: 'protocol:extension-nodes',
		kind: 'protocol',
		summary:
			"Extension nodes {type:'extension', plugin, name, data, display, source?}; container content 'none'|'phrasing'|'flow'|{allow,min,max}; inner spans parse under the same grammar.",
		sourceRef: `${MD}/ast.ts`,
		status: 'shipped',
		milestone: 5,
		coverage: { question: 'How do extension containers map to Octane recursive rendering leaves?' },
		local: 'partial',
	}),
	cap({
		id: 'protocol:fallbacks',
		kind: 'protocol',
		summary:
			'Plugin failures keep the last valid document and readable authored source; semantic-fence claims fall back to components.code/default CodeBlock; a failed container renderer shows children.',
		sourceRef: `${MD}/plugins/protocol.ts`,
		status: 'shipped',
		milestone: 5,
		coverage: { question: 'Does the spec-unshipped onPluginDiagnostic change observable 0.7.4 fallback behavior?' },
		local: 'present',
	}),
	cap({
		id: 'protocol:capabilities-introspection',
		kind: 'protocol',
		summary: 'getMarkdownPluginCapabilities + isMarkdownExtensionNode let surfaces adopt plugins without reading definitions.',
		sourceRef: `${MD}/plugins/protocol.ts`,
		status: 'shipped',
		milestone: 5,
		coverage: { question: 'Do Octane rich-text surfaces need these guards for milestone-5 plugin adoption?' },
		local: 'present',
	}),
	cap({
		id: 'protocol:onPluginDiagnostic',
		kind: 'protocol',
		summary: 'onPluginDiagnostic diagnostic channel (plugin, phase, code, severity, rate-limited) — declared by the 0.7.4 spec, absent from the 0.7.4 artifact.',
		sourceRef: `${MD}/Markdown.spec.md`,
		status: 'spec-only',
		milestone: 5,
		coverage: { question: 'Confirm upstream shipped no diagnostic channel in 0.7.4; decide whether parity tracks spec or artifact.' },
		local: 'present',
	}),
	cap({
		id: 'protocol:plugin-renderer',
		kind: 'protocol',
		summary: 'MarkdownPluginNodeRenderer (client-only subpath) renders one extension node with Markdown-identical boundary/fallback.',
		sourceRef: `${MD}/plugin-renderer/MarkdownPluginNodeRenderer.tsx`,
		status: 'shipped',
		milestone: 5,
		coverage: { question: 'Is a single-node plugin renderer required for Octane surfaces (Chat/rich text)?' },
		local: 'present',
	}),

	// ------------------------------------------------------------------
	// Plugin helpers
	// ------------------------------------------------------------------
	cap({
		id: 'helper:textTransform',
		kind: 'helper',
		summary: 'createMarkdownTextTransform: global regex over eligible prose parents (heading/paragraph/strong/emphasis/delete/tableCell), requiredSubstrings fast path, getEndIndex refine, replace→phrasing content.',
		sourceRef: `${MD}/plugins/textTransform.ts`,
		status: 'shipped',
		milestone: 5,
		coverage: { question: 'Which upstream textTransform fixtures port to Octane helpers unchanged?' },
		local: 'present',
	}),
	cap({
		id: 'helper:semanticFence',
		kind: 'helper',
		summary: 'createMarkdownFenceTransform: claimed languages → typed block extension node; null/undefined return keeps CodeBlock rendering.',
		sourceRef: `${MD}/plugins/semanticFence.ts`,
		status: 'shipped',
		milestone: 5,
		coverage: { question: 'How do semantic-fence claims interact with baked-route precompiled docs?' },
		local: 'present',
	}),
	cap({
		id: 'helper:sourceDecoration',
		kind: 'helper',
		summary: 'createMarkdownSourceDecoration/getMarkdownSourceDecorations: UTF-16 ranges → named non-semantic decorations on overlapping authored nodes.',
		sourceRef: `${MD}/plugins/sourceDecoration.ts`,
		status: 'shipped',
		milestone: 5,
		coverage: { question: 'Where do decorations live on Octane nodes (data field vs external map)?' },
		local: 'present',
	}),
	cap({
		id: 'helper:frontmatter',
		kind: 'helper',
		summary: 'createMarkdownFrontmatter: leading --- block, unique key:value grammar, typed metadata, withheld while streaming, removed from render.',
		sourceRef: `${MD}/plugins/frontmatter.ts`,
		status: 'shipped',
		milestone: 5,
		coverage: { fixture: 'plugin-frontmatter' },
		local: 'present',
	}),
	cap({
		id: 'helper:softBreaks',
		kind: 'helper',
		summary: 'markdownSoftBreaksPlugin converts soft line endings in phrasing content to hard breaks.',
		sourceRef: `${MD}/plugins/softBreaks.ts`,
		status: 'shipped',
		milestone: 5,
		coverage: { fixture: 'soft-breaks' },
		local: 'present',
	}),
	cap({
		id: 'helper:sourceLines',
		kind: 'helper',
		summary: 'markdownSourceLinesPlugin stamps 1-based data-source-line(-end) on rendered blocks, sourceLines props on block renderers, position lines on canonical nodes.',
		sourceRef: `${MD}/plugins/sourceLines.ts`,
		status: 'shipped',
		milestone: 5,
		coverage: { fixture: 'source-lines' },
		local: 'present',
	}),
	cap({
		id: 'helper:headingLinks',
		kind: 'helper',
		summary: 'createMarkdownHeadingLinks: stable ids for every h1–h6 (incl. nested) + inline sibling permalink copy button; headingIdPrefix/permalinkBaseUrl options.',
		sourceRef: `${MD}/plugins/headingLinks.ts`,
		status: 'shipped',
		milestone: 5,
		coverage: { fixture: 'heading-links' },
		local: 'present',
	}),
	cap({
		id: 'helper:remark',
		kind: 'helper',
		summary: 'createMarkdownRemarkTransform adapts sync transform-only Remark plugins over the documented MDAST subset; unsupported behavior fails closed with a diagnostic.',
		sourceRef: `${MD}/remark.ts`,
		status: 'shipped',
		milestone: 5,
		coverage: { question: 'Does Octane need the remark adapter at all, or only native helpers?' },
		local: 'missing',
	}),

	// ------------------------------------------------------------------
	// Streaming
	// ------------------------------------------------------------------
	cap({
		id: 'stream:smoothing',
		kind: 'streaming',
		summary: 'Internal useStreamingText smoothing: natural 10ch/50ms, fast 4ch/8ms, instant; theme motion tokens override tick; grapheme-cluster snap.',
		sourceRef: 'packages/core/src/hooks/useStreamingText.ts',
		status: 'shipped',
		milestone: 4,
		coverage: { fixture: 'stream-basic' },
		local: 'divergent',
	}),
	cap({
		id: 'stream:fade',
		kind: 'streaming',
		summary: 'Boundary-ring fade-in spans (keyed settled-/fade- segments); reduced motion collapses the opacity transition to 0s.',
		sourceRef: `${MD}/Markdown.tsx`,
		status: 'shipped',
		milestone: 4,
		coverage: { fixture: 'stream-basic' },
		local: 'partial',
	}),
	cap({
		id: 'stream:settlement',
		kind: 'streaming',
		summary: 'Incremental settlement with settled prefix reuse; linkDef changes invalidate; open constructs withheld until closed; finish = full parse.',
		sourceRef: `${MD}/parser.ts`,
		status: 'shipped',
		milestone: 4,
		coverage: { fixture: 'stream-basic' },
		local: 'partial',
	}),
	cap({
		id: 'stream:withholding',
		kind: 'streaming',
		summary: 'Incomplete frontmatter and math withheld while streaming so raw syntax never flashes.',
		sourceRef: `${MD}/Markdown.spec.md`,
		status: 'shipped',
		milestone: 4,
		coverage: { fixture: 'stream-math' },
		local: 'missing',
	}),

	// ------------------------------------------------------------------
	// Rendered behavior & fallbacks
	// ------------------------------------------------------------------
	cap({
		id: 'render:link-policy',
		kind: 'render',
		summary: 'External http(s) links render <a target="_blank" rel="noopener noreferrer">; internal links route through the provider link component; unsafe hrefs render plain text.',
		sourceRef: `${MD}/Markdown.tsx`,
		status: 'shipped',
		milestone: 3,
		coverage: { fixture: 'link-policy' },
		local: 'missing',
	}),
	cap({
		id: 'render:citations',
		kind: 'render',
		summary: 'Citations number sequentially by first-cited order; unknown ids get {title:id}; no sources renders literal [id] text.',
		sourceRef: `${MD}/Markdown.tsx`,
		status: 'shipped',
		milestone: 3,
		coverage: { fixture: 'citation-label' },
		local: 'partial',
	}),
	cap({
		id: 'render:heading-ids',
		kind: 'render',
		summary: 'Top-level headings get slugify/uniqueSlug ids (section fallback for empty) shared with Markdown-derived Outline; headingLinks plugin widens to nested headings.',
		sourceRef: `${MD}/headingProjection.ts`,
		status: 'shipped',
		milestone: 3,
		coverage: { fixture: 'heading-ids' },
		local: 'partial',
	}),
	cap({
		id: 'render:table-floors',
		kind: 'render',
		summary: 'Content-derived column width floors (4–24ch, ~2-line target, header one-line cap 20ch), no header truncation, unbroken inline-code tokens, single nested scroll region.',
		sourceRef: `${MD}/Markdown.tsx`,
		status: 'shipped',
		milestone: 3,
		coverage: { fixture: 'table-layout' },
		local: 'missing',
	}),
	cap({
		id: 'render:code-diff-wrap',
		kind: 'render',
		summary: 'Default code path: long lines wrap (no sideways scroll), diff/diff-<lang> fences get the diff layer over plaintext/<lang>, isCollapsible.',
		sourceRef: `${MD}/Markdown.tsx`,
		status: 'shipped',
		milestone: 3,
		coverage: { fixture: 'code-diff' },
		local: 'missing',
	}),
	cap({
		id: 'render:prose-layout',
		kind: 'render',
		summary: 'contentWidth(680 default) constrains prose; tables/code unconstrained; contentAlign centers the prose column.',
		sourceRef: `${MD}/Markdown.tsx`,
		status: 'shipped',
		milestone: 3,
		coverage: { fixture: 'content-width' },
		local: 'missing',
	}),
	cap({
		id: 'render:list-markers',
		kind: 'render',
		summary: 'List marker style fixed per depth (AST-061 DEC-6); ordered markers and task checkboxes share one anatomy.',
		sourceRef: `${MD}/Markdown.tsx`,
		status: 'shipped',
		milestone: 3,
		coverage: { fixture: 'lists' },
		local: 'partial',
	}),
	cap({
		id: 'render:unsafe-url-fallback',
		kind: 'render',
		summary: 'javascript:/data:/vbscript: and control-char-normalized dangerous URLs never reach navigation or image renderers; text/fallback parts render instead.',
		sourceRef: `${MD}/url.ts`,
		status: 'shipped',
		milestone: 3,
		coverage: { fixture: 'link-unsafe' },
		local: 'partial',
	}),
	cap({
		id: 'render:inline-display',
		kind: 'render',
		summary: "display='inline' renders one markdown target and no block anatomy — text/links/code/citations/plugins/inline math only.",
		sourceRef: `${MD}/Markdown.tsx`,
		status: 'shipped',
		milestone: 3,
		coverage: { fixture: 'inline-display' },
		local: 'missing',
	}),
	cap({
		id: 'render:density-spacing',
		kind: 'render',
		summary: 'Per-block spacing scales under density=compact across all nine block kinds.',
		sourceRef: `${MD}/Markdown.tsx`,
		status: 'shipped',
		milestone: 3,
		coverage: { fixture: 'density-compact' },
		local: 'partial',
	}),
	cap({
		id: 'render:targets',
		kind: 'render',
		summary: 'Theme targets: markdown root + markdown-heading/-paragraph/-list/-codeblock/-blockquote/-table/-hr/-image (codeblock anomaly kept); optional extension target.',
		sourceRef: `${MD}/Markdown.tsx`,
		status: 'shipped',
		milestone: 3,
		coverage: { question: 'Do Octane theme targets exist for Markdown parts, and should parity adopt the names?' },
		local: 'missing',
	}),

	// ------------------------------------------------------------------
	// Accessibility & motion
	// ------------------------------------------------------------------
	cap({
		id: 'a11y:structure',
		kind: 'render',
		summary: 'Semantic h1–h6/p/blockquote/list/table structure; table exposes one named scroll region + conditional tab stop.',
		sourceRef: `${MD}/Markdown.tsx`,
		status: 'shipped',
		milestone: 6,
		coverage: { question: 'Which native a11y attributes carry heading/table semantics on each platform?' },
		local: 'missing',
	}),
	cap({
		id: 'motion:fade-reduced',
		kind: 'streaming',
		summary: 'Streaming fade and progressive reveal both respect prefers-reduced-motion.',
		sourceRef: `${MD}/Markdown.tsx`,
		status: 'shipped',
		milestone: 4,
		coverage: { fixture: 'stream-basic' },
		local: 'partial',
	}),

	// ------------------------------------------------------------------
	// Integration
	// ------------------------------------------------------------------
	cap({
		id: 'integration:outline',
		kind: 'integration',
		summary: 'parseOutlineFromMarkdown/useOutlineFromMarkdown share parser, transforms, extension text projection, and heading identity with the component ({plugins, isFinal} options).',
		sourceRef: 'packages/core/src/Outline/parseOutlineFromMarkdown.ts',
		status: 'shipped',
		milestone: 3,
		coverage: { fixture: 'outline-projection' },
		local: 'partial',
	}),
	cap({
		id: 'integration:link-provider',
		kind: 'integration',
		summary: 'Internal links render through the app-provided link component (useLinkComponent); absent provider falls back to <a>.',
		sourceRef: `${MD}/Markdown.tsx`,
		status: 'shipped',
		milestone: 3,
		coverage: { question: 'Which Octane provider supplies the internal-link component for Markdown?' },
		local: 'missing',
	}),
	cap({
		id: 'integration:i18n',
		kind: 'integration',
		summary: 'Component reads translator (useTranslator) for chrome strings; localizable strings exist inside rendered parts.',
		sourceRef: `${MD}/Markdown.tsx`,
		status: 'shipped',
		milestone: 3,
		coverage: { question: 'Which Markdown chrome strings require Octane i18n integration?' },
		local: 'missing',
	}),
	cap({
		id: 'integration:rsc-boundary',
		kind: 'integration',
		summary: 'Plugin entries containing functions are not serializable props — they cannot cross an RSC boundary into the client component.',
		sourceRef: `${MD}/Markdown.spec.md`,
		status: 'shipped',
		milestone: 7,
		coverage: { question: 'Does this constraint apply to Octane baked routes (no RSC), or does data-only baking sidestep it?' },
		local: 'missing',
	}),
	cap({
		id: 'integration:post-074-codeLanguages',
		kind: 'integration',
		summary: 'codeLanguages prop (lists CodeBlock language values) added upstream after 0.7.4 — separate inventory, not a parity target.',
		sourceRef: `${MD}/Markdown.tsx`,
		status: 'post-0.7.4',
		milestone: 7,
		coverage: { question: 'Track upstream codeLanguages only if the target version moves.' },
		local: 'missing',
	}),
]

// ------------------------------------------------------------------
// Document corpus
// ------------------------------------------------------------------

export type MarkdownScenario = {
	/** Fixture key used in artifacts, routes, and capability coverage refs. */
	readonly key: string
	/** Raw markdown source. */
	readonly source: string
	/** Capability ids this fixture exercises. */
	readonly capabilities: readonly string[]
	/** Reference-side parser/render options. */
	readonly options?: {
		readonly autolink?: 'gfm'
		readonly sourceIds?: readonly string[]
		readonly math?: boolean
		readonly sourceRanges?: boolean
		/** Named plugin profiles resolved to real `createMarkdownPlugin`
		 *  entries on each side (see markdownPlugins in the vite apps and the
		 *  parser runner). */
		readonly plugins?: readonly MarkdownPluginProfile[]
		/** Chunked scenarios only: install `plugins` starting at this chunk
		 *  index — exercises mid-stream configuration invalidation. */
		readonly pluginsAt?: number
		/** Exercise the legacy inlinePlugins prop with an @mention matcher. */
		readonly inlinePlugin?: boolean
	}
	/** Streaming: chunk boundaries (UTF-16 offsets) replayed incrementally. */
	readonly chunks?: readonly string[]
}

/** Named plugin profiles shared by the parser runner and both vite apps —
 *  each side maps a profile to its own first-party plugin entry. */
export type MarkdownPluginProfile = 'soft-breaks' | 'frontmatter' | 'source-lines' | 'heading-links'

/** Deterministic ~40 KB mixed-grammar document — modelled on the upstream
 *  parser.perf.test.ts `generateAIResponse` section cycle (same six-block
 *  rotation), scaled down for differential runs rather than timing. */
const longDocument = (() => {
	const sections: string[] = []
	for (let i = 0; i < 120; i++) {
		switch (i % 6) {
			case 0:
				sections.push(`## Section ${i + 1}\n\nParagraph ${i + 1} of the long document with context and analysis prose.`)
				break
			case 1:
				sections.push('```typescript\nfunction process(data: unknown[]) {\n  return data.filter(Boolean)\n}\n```')
				break
			case 2:
				sections.push(`- First point ${i}\n- Second **finding**\n- Third observation`)
				break
			case 3:
				sections.push(`| Metric | Value |\n| :--- | ---: |\n| Accuracy | ${90 + (i % 10)}% |`)
				break
			case 4:
				sections.push(`> Note ${i}: an observation.\n> Spanning two lines with *italic*.`)
				break
			default:
				sections.push(`1. Step one\n2. Step two with \`code\`\n3. [link](https://example.com/${i})`)
		}
	}
	return sections.join('\n\n') + '\n'
})()

/** Deterministic 8-column × 40-row table for cell-floor and overflow checks. */
const largeTable = (() => {
	const head = '| ' + Array.from({ length: 8 }, (_, i) => `col-${i}`).join(' | ') + ' |'
	const align = '| ' + Array.from({ length: 8 }, (_, i) => (i % 3 === 0 ? ':---' : i % 3 === 1 ? ':--:' : '---:')).join(' | ') + ' |'
	const rows = Array.from({ length: 40 }, (_, r) => '| ' + Array.from({ length: 8 }, (_, c) => `r${r}c${c}${c === 3 ? '-unbroken-longer-token' : ''}`).join(' | ') + ' |')
	return [head, align, ...rows].join('\n') + '\n'
})()

export const CITATION_SOURCES = {
	docs: { title: 'Octane docs', url: 'https://docs.example/octane' },
	api: { title: 'API reference', url: 'https://api.example/ref' },
} as const

/** Citation sources that navigate only within the page (hash urls), so
 *  activation probes can observe the click without leaving the route. */
export const CITATION_SOURCES_LOCAL = {
	docs: { title: 'Octane docs', url: '#cite-docs' },
	api: { title: 'API reference', url: '#cite-api' },
} as const

/** Stream pump fixture: cumulative chunk pieces replayed by the
 *  `/markdown/behavior` stream controls in both apps. */
export const STREAM_FIXTURE_CHUNKS = [
	'# Stream\n\nPara one with **bo',
	'ld** and `co',
	'de`.\n\n- a\n- b',
	'\n\n```ts\nx()\n```\n',
] as const
export const STREAM_FIXTURE_SOURCE = STREAM_FIXTURE_CHUNKS.join('')

/** Fence source claimed by the boundary fixture plugins — language `boom`
 *  resolves to an extension node whose renderer throws/declines/suspends. */
export const BOUNDARY_FIXTURE_SOURCE = '```boom\nsecret payload\n```\n'

export const markdownScenarios: MarkdownScenario[] = [
	{ key: 'empty', source: '', capabilities: ['grammar:paragraphs', 'parser:parseMarkdown'] },
	{
		key: 'prose-basic',
		source: '# Hello\n\nThis is **bold** and _italic_ text.\n\n- Item one\n- Item two\n',
		capabilities: ['grammar:headings', 'grammar:emphasis', 'grammar:lists', 'parser:parseMarkdown', 'prop:density'],
	},
	{
		key: 'headings',
		source: '# H1\n\n## H2\n\n### H3\n\n#### H4\n\n  ## Indented\n\nSetext one\n=========\n\nSetext two\n---------\n',
		capabilities: ['grammar:headings', 'grammar:indentation'],
	},
	{
		key: 'heading-shift',
		source: '# Top\n\n## Nested\n\n###### Deep\n',
		capabilities: ['prop:headingLevelStart', 'grammar:headings', 'render:heading-ids'],
	},
	{
		key: 'emphasis',
		source:
			'**bold** _em_ ~~strike~~\n\n**nested *em* strong**\n\nmid**word**strong\n\n**unclosed and *cross* delimiters**\n',
		capabilities: ['grammar:emphasis'],
	},
	{
		key: 'code-spans',
		source: 'Use `x = 1` inline.\n\n``code with `tick` inside``\n\n`unmatched\n',
		capabilities: ['grammar:code-spans'],
	},
	{
		key: 'fences',
		source:
			'```ts\nconst x: number = 1\n```\n\n~~~python meta\nprint(1)\n~~~\n\n```\nunclosed tail\n',
		capabilities: ['grammar:fences'],
	},
	{
		key: 'code-diff',
		source: '```diff\n- old\n+ new\n```\n\n```diff-ts\n- type A\n+ type B\n```\n',
		capabilities: ['grammar:fences', 'render:code-diff-wrap'],
	},
	{
		key: 'lists',
		source: '- a\n- b\n  - nested\n  - nested two\n- c\n\n1. one\n2. two\n   1. deep\n\n5) five\n6) six\n',
		capabilities: ['grammar:lists', 'render:list-markers'],
	},
	{
		key: 'task-list',
		source: '- [x] done\n- [ ] todo\n- plain item\n  - [x] nested done\n',
		capabilities: ['grammar:lists', 'grammar:task-lists'],
	},
	{
		key: 'blockquote-nested',
		source: '> outer\n>\n> > inner quote\n> back to outer\nlazy line\n\n> ## quoted heading\n> - quoted item\n',
		capabilities: ['grammar:blockquotes', 'grammar:paragraphs'],
	},
	{
		key: 'lazy-continuation',
		source: '> quote line\ncontinued without marker\n\n- item line\ncontinued without indent\n',
		capabilities: ['grammar:blockquotes', 'grammar:lists', 'grammar:paragraphs'],
	},
	{
		key: 'table-pipes',
		source: '| a | b |\n| :- | -: |\n| 1 | 2 |\n| \\|pipe | `x\\|y` |\n\nshort:\n\n| c |\n| - |\n| d |\n',
		capabilities: ['grammar:tables', 'grammar:code-spans', 'render:table-floors'],
	},
	{
		key: 'table-layout',
		source:
			'| Identifier | Description | Status |\n| :-- | :-- | --: |\n| very-long-unbroken-token-identifier | A readable description of the row | ok |\n| short | more | pending |\n',
		capabilities: ['grammar:tables', 'render:table-floors'],
	},
	{
		key: 'links',
		source:
			'[plain](https://example.com)\n\n[angle](<https://example.com/a b>)\n\n[parens](https://example.com/a(b)c)\n\n[titled](https://example.com "title")\n\n[label **bold**](https://example.com)\n\n[long label that wraps across the cell boundary](https://example.com/long)\n',
		capabilities: ['grammar:links', 'render:link-policy'],
	},
	{
		key: 'reference-links',
		source: 'See [the docs][docs] and [short].\n\n[docs]: https://example.com/docs\n[short]: /local\n',
		capabilities: ['grammar:reference-links', 'grammar:links'],
	},
	{
		key: 'link-unsafe',
		source: '[bad](javascript:alert(1))\n\n[bad2](data:text/html,x)\n\n![img](javascript:x)\n',
		capabilities: ['render:unsafe-url-fallback', 'grammar:links', 'grammar:images'],
	},
	{
		key: 'link-intercept',
		source: '[internal](/docs/page) and [external](https://example.com)\n',
		capabilities: ['prop:onLinkClick', 'render:link-policy'],
	},
	{
		key: 'image-unsafe',
		source: '![alt text](https://example.com/a.png)\n\n![unsafe](data:text/html,x)\n',
		capabilities: ['grammar:images', 'renderer:image', 'render:unsafe-url-fallback'],
	},
	{
		key: 'entities',
		source: '&copy; &#169; &#xA9; &unknown; &amp; &#0; \\&copy;\n',
		capabilities: ['grammar:character-references', 'grammar:escapes', 'parser:decodeMarkdownCharacterReferences'],
	},
	{
		key: 'escapes',
		source: '\\*not em\\* \\# not heading \\[not link\\](x) \\\\ backslash\n',
		capabilities: ['grammar:escapes'],
	},
	{
		key: 'hard-breaks',
		source: 'line one  \nline two\n\nthird\\\nfourth\n',
		capabilities: ['grammar:breaks'],
	},
	{
		key: 'thematic-break',
		source: 'above\n\n---\n\nbetween\n\n***\n\n___\n\nlist ambiguity:\n\n- - - \n',
		capabilities: ['grammar:thematic-break'],
	},
	{
		key: 'autolink-gfm',
		source:
			'Bare https://example.com/path?x=1. and www.example.com\n\nAngle <https://example.com/a> and mail <a@b.com>\n\nBare email user@host.com trailing).\n',
		options: { autolink: 'gfm' },
		capabilities: ['grammar:autolinks', 'prop:autolink'],
	},
	{
		key: 'autolink-off',
		source: 'Bare https://example.com stays text without the option.\n',
		capabilities: ['grammar:autolinks', 'prop:autolink'],
	},
	{
		key: 'citation-label',
		source: 'Claim [docs] and again [docs].\n\nUnknown [missing] and bracket 【api】.\n',
		options: { sourceIds: ['docs', 'api'] },
		capabilities: ['grammar:citations', 'prop:sources', 'render:citations'],
	},
	{
		key: 'citation-number',
		source: 'First [docs] then [api] then [docs] again.\n',
		options: { sourceIds: ['docs', 'api'] },
		capabilities: ['prop:citationStyle', 'render:citations'],
	},
	{
		key: 'math-opt-in',
		source: 'Inline $x^2+y$ and currency $5 and $6.\n\n$$E=mc^2$$\n\nEscaped \\$not math$ and open $never closed.\n',
		options: { math: true },
		capabilities: ['grammar:math', 'renderer:math'],
	},
	{
		key: 'indentation',
		source: '    indented code block\n    second line\n\n   ```js\n   fence under indent\n   ```\n\n   | a |\n   | - |\n   | b |\n',
		capabilities: ['grammar:indentation', 'grammar:fences', 'grammar:tables'],
	},
	{
		key: 'unicode-nesting',
		source: 'Emoji 🎉 and CJK  with ****.\n\n> - nested quote list\n>   - deep two\n>     - deep three\n',
		capabilities: ['grammar:blockquotes', 'grammar:lists'],
	},
	{
		key: 'inline-display',
		source: 'Some **inline** [markdown](/x) with `code` and [docs].\n',
		options: { sourceIds: ['docs'] },
		capabilities: ['prop:display', 'render:inline-display', 'parser:parseInline'],
	},
	{
		key: 'stream-basic',
		source: '# Title\n\nFirst paragraph with **bold**.\n\n- one\n- two\n',
		chunks: ['# Ti', 'tle\n\nFirst paragraph with **bo', 'ld**.\n\n- one\n- ', 'two\n'],
		capabilities: ['stream:smoothing', 'stream:settlement', 'stream:fade', 'parser:incremental', 'prop:isStreaming'],
	},
	{
		key: 'stream-math',
		source: 'Para.\n\n$$x=1$$\n\nAfter math.\n',
		chunks: ['Para.\n\n$$x', '=1$$\n\nAfter ma', 'th.\n'],
		options: { math: true },
		capabilities: ['stream:withholding', 'grammar:math'],
	},
	{
		key: 'plugin-frontmatter',
		source: '---\ntitle: Doc\ndate: 2026-01-01\n---\n\n# Body\n\nText.\n',
		options: { plugins: ['frontmatter'] },
		capabilities: ['helper:frontmatter', 'prop:plugins'],
	},
	{
		key: 'soft-breaks',
		source: 'line one\nline two\nline three\n',
		options: { plugins: ['soft-breaks'] },
		capabilities: ['helper:softBreaks'],
	},
	{
		key: 'source-lines',
		source: '# A\n\npara one\n\n- list\n',
		options: { plugins: ['source-lines'] },
		capabilities: ['helper:sourceLines'],
	},
	{
		key: 'heading-links',
		source: '# Alpha\n\n## Beta\n\n# Alpha\n\n> ## Quoted\n',
		options: { plugins: ['heading-links'] },
		capabilities: ['helper:headingLinks', 'render:heading-ids'],
	},
	{
		key: 'inline-plugin',
		source: 'Call @ivan or #urgent inside **styled** text.\n',
		options: { inlinePlugin: true },
		capabilities: ['prop:inlinePlugins'],
	},
	{
		key: 'custom-renderers',
		source: '## Head\n\nPara [l](/x).\n\n```js\nx=1\n```\n\n> quote\n\n---\n\n![i](https://a/b.png)\n',
		capabilities: ['prop:components', 'renderer:code', 'renderer:inlineCode', 'renderer:citation', 'renderer:link', 'renderer:heading', 'renderer:paragraph', 'renderer:image', 'renderer:blockquote', 'renderer:hr'],
	},
	{
		key: 'content-width',
		source: 'Paragraph of prose that should sit inside the prose column while the table below uses the full width.\n\n| a | b |\n| - | - |\n| 1 | 2 |\n',
		capabilities: ['prop:contentWidth', 'prop:contentAlign', 'render:prose-layout'],
	},
	{
		key: 'density-compact',
		source: '# H\n\npara\n\n- a\n\n> q\n\n```\nc\n```\n\n---\n',
		capabilities: ['prop:density', 'render:density-spacing'],
	},
	{
		key: 'outline-projection',
		source: '# One\n\n## Two\n\n# One\n\n> ### Quoted scope\n\n```\n# not a heading\n```\n',
		capabilities: ['integration:outline', 'render:heading-ids'],
	},
	{
		key: 'link-policy',
		source: '[external](https://example.com)\n\n[internal-relative](/docs)\n\n[anchor](#section)\n',
		capabilities: ['render:link-policy'],
	},

	// ------------------------------------------------------------------
	// Milestone-6 corpus: document-shape, presentation, and stream edges
	// ------------------------------------------------------------------
	{
		key: 'long-document',
		source: longDocument,
		capabilities: ['grammar:paragraphs', 'grammar:lists', 'grammar:tables', 'grammar:fences', 'parser:parseMarkdown'],
	},
	{
		// Malformed constructs must degrade identically — unclosed link/fence/
		// emphasis runs, a stray `]`, an empty marker, a `>` line end.
		key: 'malformed',
		source:
			'[unclosed link](https://example.com\n\n![unclosed image\n\n**unclosed bold\n\nstray ] bracket [ and |\n\n>\n\n- \n\n```ts\ndangling fence\n',
		capabilities: ['grammar:links', 'grammar:images', 'grammar:emphasis', 'grammar:fences', 'grammar:blockquotes', 'grammar:lists'],
	},
	{
		key: 'deep-nesting',
		source:
			'> l1\n> > l2\n> > > l3\n> > > > l4\n\n- a\n  - b\n    - c\n      - d\n        - e\n          - f\n\n> - q\n>   - q2\n>     > deep quote\n',
		capabilities: ['grammar:blockquotes', 'grammar:lists', 'grammar:paragraphs'],
	},
	{
		// Combining marks, RTL, ZWJ emoji, astral plane, fullwidth, zero-width.
		key: 'unicode-rich',
		source:
			'Café combining and éacute\n\nעברית و العربية مختلط RTL\n\nFamily: 👨‍👩‍👧 flag 🇺🇸\n\nＦｕｌｌｗｉｄｔｈ and a​zero​width\n\nSurrogate pair 😀 and math 𝒜\n',
		capabilities: ['grammar:paragraphs', 'grammar:escapes', 'parser:decodeMarkdownCharacterReferences'],
	},
	{
		// CRLF endings and trailing-space breaks — upstream parser.test.ts
		// 'hard breaks in CRLF documents' + 'streams to the same result when
		// chunks split the line ending'.
		key: 'crlf-doc',
		source: 'line one  \r\nline two\\\r\nline three\r\n\r\n- a\r\n- b\r\n',
		chunks: ['line one  \r', '\nline two\\\r\nline three', '\r\n\r\n- a\r\n- b\r\n'],
		capabilities: ['grammar:breaks', 'grammar:lists', 'stream:settlement'],
	},
	{
		key: 'bom-doc',
		source: '\uFEFF# After BOM\n\ntext\n',
		capabilities: ['grammar:headings', 'grammar:paragraphs'],
	},
	{
		// Large table — exercises alignment parsing and cell floors at scale.
		key: 'large-table',
		source: largeTable,
		capabilities: ['grammar:tables', 'render:table-floors'],
	},
	{
		// Unknown + missing languages and fence info strings — upstream
		// fenceInfo.test.tsx (info string + meta).
		key: 'unknown-language',
		source:
			'```klingon-lang extra=meta\ntlhIngan maH\n```\n\n```\nbare fence\n```\n\n```c++\nint x = 0;\n```\n',
		capabilities: ['grammar:fences', 'renderer:code'],
	},
	{
		// Unbreakable tokens in prose, code, and table cells.
		key: 'unbroken-tokens',
		source:
			'A verylongunbrokentokenthatcannotbewrappedatanypointhttps://example.com/also/quite/long/path?with=query&more=params and tail.\n\n```\nconst veryLongUnbrokenCodeTokenThatExceedsTheProseColumnWidthAndMustEitherWrapOrScrollDependingOnTheContract = true;\n```\n\n| cell |\n| --- |\n| anotherverylongunbrokentablecelltoken |\n',
		capabilities: ['grammar:paragraphs', 'grammar:fences', 'grammar:tables', 'render:code-diff-wrap', 'render:table-floors'],
	},
	{
		// Empty and repeated headings — slug/id allocation edges (upstream
		// headingProjection + Markdown.test heading-id cases).
		key: 'empty-repeated-headings',
		source: '# \n\n## Dup\n\n## Dup\n\n#\n\n### trailing ###\n',
		capabilities: ['grammar:headings', 'render:heading-ids'],
	},
	{
		// Reference-definition edges — upstream parser.test.ts link-
		// definition cases: case-insensitive match, duplicate defs (first
		// wins), collapsed and shortcut forms.
		key: 'reference-edge',
		source:
			'[full][Docs] and [collapsed][] and [shortcut].\n\n[docs]: https://example.com/one\n[DOCS]: https://example.com/two\n[collapsed]: /c\n[shortcut]: /s\n\n[later] resolves late.\n\n[later]: /late\n',
		capabilities: ['grammar:reference-links', 'grammar:links'],
	},
	{
		// Math inside formatting + currency pairs — upstream parser.test.ts
		// 'does not mistake paired currency amounts for inline math' and
		// 'math in link labels stays opaque to code/links'.
		key: 'math-mixed',
		source:
			'Cost is $5 and $6, not math.\n\n**bold $x+y$ inside** and [link $z$](/u)\n\n`code $not math$` tail $ok$\n',
		options: { math: true },
		capabilities: ['grammar:math', 'grammar:code-spans', 'grammar:links'],
	},
	{
		// HTML is not a grammar construct — both sides keep it literal text.
		key: 'html-literal',
		source: '<div class="x">not markup</div>\n\n<a href="https://x">tag</a> and <em>inline</em>\n',
		capabilities: ['grammar:paragraphs'],
	},
	{
		// Ordered-list delimiter change starts a new list — upstream
		// parser.test.ts 'starts a new list when the ordered delimiter
		// changes' + custom start cases.
		key: 'list-delimiter-change',
		source: '1. one\n2. two\n\n3) three\n4) four\n\n7. seven\n8. eight\n',
		capabilities: ['grammar:lists'],
	},
	{
		// Option coverage: sourceRanges positions on.
		key: 'source-ranges',
		source: '# T\n\npara **b**\n\n- l\n',
		options: { sourceRanges: true },
		capabilities: ['parser:options', 'parser:ast'],
	},
	{
		// Plugins only take effect partway through the stream — the settled
		// prefix must invalidate and both sides converge on the plugin view.
		key: 'plugin-midstream',
		source: 'plain one\nplain two\nplain three\n',
		chunks: ['plain one\n', 'plain two\n', 'plain three\n'],
		options: { plugins: ['soft-breaks'], pluginsAt: 2 },
		capabilities: ['helper:softBreaks', 'parser:incremental', 'stream:settlement'],
	},
	{
		// M5-flagged seam: claim-split transform accumulation under the
		// soft-breaks plugin vs one full parse.
		key: 'stream-softbreaks',
		source: 'alpha\nbeta\ngamma\ndelta\n',
		chunks: ['alpha\nb', 'eta\ngam', 'ma\ndelta\n'],
		options: { plugins: ['soft-breaks'] },
		capabilities: ['helper:softBreaks', 'stream:settlement', 'parser:incremental'],
	},
	{
		// Frontmatter withheld while incomplete, then released — streams
		// never flash raw --- syntax.
		key: 'stream-frontmatter',
		source: '---\ntitle: Doc\n---\n\n# Body\n\ntext\n',
		chunks: ['---\nt', 'itle: Doc\n', '---\n\n# Body\n\nt', 'ext\n'],
		options: { plugins: ['frontmatter'] },
		capabilities: ['helper:frontmatter', 'stream:withholding', 'parser:incremental'],
	},
	{
		key: 'stream-table',
		source: '| a | b |\n| - | - |\n| 1 | 2 |\n\nafter\n',
		chunks: ['| a |', ' b |\n| - ', '| - |\n| 1 | 2 |\n\naf', 'ter\n'],
		capabilities: ['grammar:tables', 'stream:settlement'],
	},
	{
		key: 'stream-citation',
		source: 'Claim [docs] mid sentence.\n\nMore [api].\n',
		chunks: ['Claim [do', 'cs] mid sent', 'ence.\n\nMore [ap', 'i].\n'],
		options: { sourceIds: ['docs', 'api'] },
		capabilities: ['grammar:citations', 'stream:settlement'],
	},
	{
		key: 'stream-nested',
		source: '> - q\n>   - q2\n\n1. a\n   1. b\n',
		chunks: ['> -', ' q\n>   -', ' q2\n\n1.', ' a\n   1. b\n'],
		capabilities: ['grammar:blockquotes', 'grammar:lists', 'stream:settlement'],
	},
]

/** Stream replay: every split position of `source` produces a two-chunk
 *  schedule; `streamSchedules` adds seeded random multi-chunk schedules. */
export function streamSchedules(source: string, seed = 7): string[][] {
	const schedules: string[][] = []
	for (let i = 1; i < source.length; i++) {
		schedules.push([source.slice(0, i), source.slice(i)])
	}
	// Seeded random chunks (LCG, deterministic).
	let s = seed >>> 0
	const rand = () => (s = (s * 1664525 + 1013904223) >>> 0) / 0xffffffff
	for (let k = 0; k < 8; k++) {
		const parts: string[] = []
		let pos = 0
		while (pos < source.length) {
			const n = 1 + Math.floor(rand() * Math.min(24, source.length - pos))
			parts.push(source.slice(pos, pos + n))
			pos += n
		}
		if (parts.length > 1) schedules.push(parts)
	}
	return schedules
}
