/** @jsxImportSource @octane-xplat/jsx/dom */
import type { WebDocumentProps } from '@octane-xplat/web-host/server'

// 1. Place rendered content, document head, and browser scripts in the HTML shell.
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
