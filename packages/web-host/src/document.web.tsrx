/** @jsxImportSource octane */
import type { WebAssets, WebDocumentProps } from './props'
import { bootstrapId, rootId } from './transfer'

export function DefaultDocument(props: WebDocumentProps): any {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				{props.head}
			</head>
			<body>
				{props.children}
				{props.scripts}
			</body>
		</html>
	)
}

export function DocumentHead(props: {
	title?: string
	meta?: Record<string, string>
	styles: WebAssets['styles']
}): any {
	return (
		<>
			@if (props.title !== undefined) {
				<title>{props.title}</title>
			}
			@for (const [name, content] of Object.entries(props.meta ?? {}); key name) {
				<meta name={name} content={content} />
			}
			@for (const href of props.styles ?? []; key href) {
				<link rel="stylesheet" href={href} />
			}
		</>
	)
}

export function AppContainer(props: { html: string }): any {
	return <div id={rootId} dangerouslySetInnerHTML={{ __html: props.html }} />
}

export function DocumentScripts(props: { bootstrap: string; scripts: readonly string[] }): any {
	return (
		<>
			<script
				id={bootstrapId}
				type="application/json"
				dangerouslySetInnerHTML={{ __html: props.bootstrap }}
			/>
			@for (const src of props.scripts; key src) {
				<script type="module" src={src} />
			}
		</>
	)
}
