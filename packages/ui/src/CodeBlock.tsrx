/** @jsxImportSource @nativescript-community/octane */
import { useMemo, useState } from 'octane';
import type { CodeBlockProps } from './props';
import { cx } from './cx';
import { applyEscapeProps } from './escape-props';
import { Icon } from './Icon';
import { Pressable } from './Pressable';
import { useColorScheme } from './theme/colorScheme';
import { mutedColor } from './scheme-colors';
import { nativeColor } from './native-color';
import { syntaxColor } from './code-tokenizer';
import { useCodeCopy, useTokenLines } from './codeblock-shared.tsrx';

/** Native token color — FormattedString spans take concrete colors, so the
 *  active scheme + per-block `syntaxTheme` resolve to hex strings here. */
function tokenColor(
	type: string,
	scheme: 'light' | 'dark',
	theme?: CodeBlockProps['syntaxTheme'],
) {
	const color = syntaxColor(type, scheme, theme)
	return color == null ? undefined : nativeColor(color)
}

/** One code line as a native label with a FormattedString of colored spans. */
function NativeCodeLine(props: {
	line: string
	tokens?: readonly { type: string; start: number; end: number }[]
	scheme: 'light' | 'dark'
	theme?: CodeBlockProps['syntaxTheme']
	fontSize: number
	wrap: boolean
}) @{
	const tokens = props.tokens ?? [];
	const spans: any[] = [];
	if (tokens.length === 0) {
		spans.push(<span text={props.line === '' ? ' ' : props.line} />);
	} else {
		let cursor = 0;
		for (const token of tokens) {
			if (token.start > cursor) {
				spans.push(<span text={props.line.slice(cursor, token.start)} />);
			}

			spans.push(
				<span
					style={{ color: tokenColor(token.type, props.scheme, props.theme) }}
					text={props.line.slice(token.start, token.end)}
				/>,
			);

			cursor = token.end;
		}

		if (cursor < props.line.length) {
			spans.push(<span text={props.line.slice(cursor)} />);
		}
	}

	<label
		className="vx-codeblock-line-text"
		whiteSpace={props.wrap ? 'normal' : 'nowrap'}
		style={{ fontFamily: 'monospace', fontSize: props.fontSize }}
	>
		<formattedstring>{spans}</formattedstring>
	</label>
}

/** CodeBlock — native leaf. Syntax highlighting always takes the span path
 *  (the CSS Custom Highlight API is DOM-only); `width: 'fit-content'` is
 *  inert (GridLayout can't measure max-content for a scrolling code block,
 *  so the block fills its parent width). `maxHeight` wraps the body in a
 *  vertical ScrollView; unwrapped long lines clip rather than scroll
 *  horizontally (documented limitation — NS ScrollView is single-axis). */
export function CodeBlock(props: CodeBlockProps) @{
	const scheme = useColorScheme();
	const language = props.language ?? 'plaintext';
	const hasLanguageLabel = props.hasLanguageLabel ?? true;
	const hasLineNumbers = props.hasLineNumbers ?? false;
	const hasCopyButton = props.hasCopyButton ?? true;
	const isWrapped = props.isWrapped ?? false;
	const isCollapsible = props.isCollapsible ?? false;
	const collapsibleThreshold = props.collapsibleThreshold ?? 10;
	const size = props.size ?? 'md';
	const container = props.container ?? 'card';
	const fontSize = size === 'sm' ? 12 : 13;

	const lines = useMemo(() => props.code.split('\n'), [props.code]);
	const tokenLines = useTokenLines(props.code, language, props.tokenizer);
	const { copy, copied } = useCodeCopy(props.code, props.onCopy);
	const highlighted = useMemo(() => new Set(props.highlightLines ?? []), [props.highlightLines]);

	const canCollapse = isCollapsible && lines.length > collapsibleThreshold;
	const [isExpanded, setIsExpanded] = useState(false);
	const collapsed = canCollapse && !isExpanded;

	const hasHeader = props.title != null || hasLanguageLabel || hasCopyButton || canCollapse;

	const body = (
		<stacklayout className="vx-codeblock-body" style={{ paddingTop: 8, paddingBottom: 8, paddingLeft: 12, paddingRight: 12 }}>
			{lines.map((line, i) => {
				const lineNo = i + 1;
				const isHl = highlighted.has(lineNo);
				return (
					<flexboxlayout
						key={lineNo}
						flexDirection="row"
						className={cx('vx-codeblock-line', isHl && 'vx-codeblock-line--highlighted')}
					style={isHl ? { backgroundColor: nativeColor(scheme === 'dark' ? '#2e2e2e' : '#f0f0f0') } : undefined}
					>
						{hasLineNumbers ? (
							<label
								className="vx-codeblock-gutter"
								text={String(lineNo)}
								whiteSpace="nowrap"
					textAlignment="right"
					style={{ fontFamily: 'monospace', fontSize, color: nativeColor(mutedColor(scheme)), width: 32, paddingRight: 8 }}
							/>
						) : null}
						<NativeCodeLine
							line={line}
							tokens={tokenLines[i]}
							scheme={scheme}
							theme={props.syntaxTheme}
							fontSize={fontSize}
							wrap={isWrapped}
						/>
					</flexboxlayout>
				);
			})}
		</stacklayout>
	);

	<flexboxlayout
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		className={cx(
			'vx-codeblock',
			`vx-codeblock--${container}`,
			`vx-codeblock--${size}`,
			collapsed && 'vx-codeblock--collapsed',
			props.className,
		)}
		style={{ flexDirection: 'column', ...props.style }}
		flexDirection="column"
	>
		{hasHeader ? (
			<flexboxlayout
				className="vx-codeblock-header"
				flexDirection="row"
				justifyContent="space-between"
				alignItems="center"
				style={{ paddingTop: 6, paddingBottom: 6, paddingLeft: 12, paddingRight: 12 }}
			>
				<flexboxlayout flexDirection="row" alignItems="center" style={{ gap: 8 }}>
					{props.title != null ? (
						<label
							className="vx-codeblock-title"
							whiteSpace="nowrap"
							style={{ fontSize, fontWeight: 600 }}
						>
							{props.title}
						</label>
					) : null}
					{hasLanguageLabel ? (
						<label
							className="vx-codeblock-lang"
							whiteSpace="nowrap"
								style={{ fontSize: fontSize - 1, color: nativeColor(mutedColor(scheme)) }}
						>
							{language}
						</label>
					) : null}
				</flexboxlayout>
				<flexboxlayout flexDirection="row" alignItems="center" style={{ gap: 4 }}>
					{hasCopyButton ? (
						<Pressable
							className="vx-codeblock-copy"
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
							className="vx-codeblock-collapse"
							accessibilityRole="button"
							accessibilityLabel={isExpanded ? 'Collapse code' : 'Expand code'}
							accessibilityState={{ checked: isExpanded }}
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
