/** @jsxImportSource octane */
import type { WebDocumentProps } from '@octane-xplat/web-host/server'

export function Document(props: WebDocumentProps) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				{props.head}
			</head>
			<body>
				<header>My store</header>
				{props.children}
				{props.scripts}
			</body>
		</html>
	)
}
