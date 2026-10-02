/** @jsxImportSource @octane-xplat/macos-renderer */
import { useMemo, useState } from 'octane';
import type { CodeBlockProps } from './props';
import { cx } from './cx';
import { Icon } from './Icon.macos.tsrx';
import { Pressable } from './Pressable.macos.tsrx';
import { getColorScheme } from './colorScheme.macos';
import { mutedColor, textColor } from './scheme-colors';
import { useCodeCopy, useTokenLines } from './codeblock-shared.tsrx';
import { syntaxColor } from './code-tokenizer';

/** CodeBlock — macOS leaf. The AppKit host's label doesn't compose
 *  FormattedString spans, so per-token coloring renders as a single-color
 *  mono line unless the token map supplies a concrete override (documented
 *  coverage gap: fine-grained syntax colors are web/mobile only). */
export function CodeBlock(props: CodeBlockProps) @{
	const scheme = getColorScheme();
	const language = props.language ?? 'plaintext';
	const hasLanguageLabel = props.hasLanguageLabel ?? true;
	const hasLineNumbers = props.hasLineNumbers ?? false;
	const hasCopyButton = props.hasCopyButton ?? true;
	const isCollapsible = props.isCollapsible ?? false;
	const collapsibleThreshold = props.collapsibleThreshold ?? 10;
	const size = props.size ?? 'md';
	const container = props.container ?? 'card';
	const fontSize = size === 'sm' ? 12 : 13;

	const lines = useMemo(() => props.code.split('\n'), [props.code]);
	useTokenLines(props.code, language, props.tokenizer);
	const { copy, copied } = useCodeCopy(props.code, props.onCopy);
	const highlighted = useMemo(() => new Set(props.highlightLines ?? []), [props.highlightLines]);

	const canCollapse = isCollapsible && lines.length > collapsibleThreshold;
	const [isExpanded, setIsExpanded] = useState(false);
	const collapsed = canCollapse && !isExpanded;

	const hasHeader = props.title != null || hasLanguageLabel || hasCopyButton || canCollapse;

	const body = (
		<stacklayout
			className="vx-codeblock-body"
			style={{ paddingTop: 8, paddingBottom: 8, paddingLeft: 12, paddingRight: 12 }}
		>
			{lines.map((line, i) => {
				const lineNo = i + 1;
				const isHl = highlighted.has(lineNo);
				return (
					<flexboxlayout
						key={lineNo}
						flexDirection="row"
						style={isHl ? { backgroundColor: scheme === 'dark' ? '#2e2e2e' : '#f0f0f0' } : undefined}
					>
						{hasLineNumbers ? (
							<label
								text={String(lineNo)}
								whiteSpace="nowrap"
								style={{
									fontFamily: 'ui-monospace',
									fontSize,
									color: mutedColor(scheme),
									width: 32,
									textAlign: 'right',
									paddingRight: 8,
								}}
							/>
						) : null}
						<label
							text={line === '' ? ' ' : line}
							whiteSpace={props.isWrapped ? 'normal' : 'nowrap'}
							style={{ fontFamily: 'ui-monospace', fontSize, color: textColor(scheme) }}
						/>
					</flexboxlayout>
				);
			})}
		</stacklayout>
	);

	<flexboxlayout
		id={props.id}
		className={cx('vx-codeblock', `vx-codeblock--${container}`, props.className)}
		style={{ flexDirection: 'column', ...props.style }}
		flexDirection="column"
	>
		{hasHeader ? (
			<flexboxlayout
				flexDirection="row"
				justifyContent="space-between"
				alignItems="center"
				style={{ paddingTop: 6, paddingBottom: 6, paddingLeft: 12, paddingRight: 12 }}
			>
				<flexboxlayout flexDirection="row" alignItems="center" style={{ gap: 8 }}>
					{props.title != null ? (
						<label whiteSpace="nowrap" style={{ fontSize, fontWeight: 600, color: textColor(scheme) }}>
							{props.title}
						</label>
					) : null}
					{hasLanguageLabel ? (
						<label whiteSpace="nowrap" style={{ fontSize: fontSize - 1, color: mutedColor(scheme) }}>
							{language}
						</label>
					) : null}
				</flexboxlayout>
				<flexboxlayout flexDirection="row" alignItems="center" style={{ gap: 4 }}>
					{hasCopyButton ? (
						<Pressable
							accessibilityRole="button"
							accessibilityLabel={copied ? 'Copied' : 'Copy code'}
							onPress={copy}
							style={{ padding: 4 }}
						>
							<Icon name={copied ? 'xplat-check' : 'xplat-copy'} size={14} />
						</Pressable>
					) : null}
					{canCollapse ? (
						<Pressable
							accessibilityRole="button"
							accessibilityLabel={isExpanded ? 'Collapse code' : 'Expand code'}
							onPress={() => setIsExpanded((v) => !v)}
							style={{ padding: 4 }}
						>
							<Icon name={isExpanded ? 'xplat-chevron-up' : 'xplat-chevron-down'} size={14} />
						</Pressable>
					) : null}
				</flexboxlayout>
			</flexboxlayout>
		) : null}
		{collapsed ? null : props.maxHeight != null ? (
			<scrollview height={props.maxHeight as any}>{body}</scrollview>
		) : (
			body
		)}
	</flexboxlayout>
}
