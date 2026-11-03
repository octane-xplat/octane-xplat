/** @jsxImportSource @octane-xplat/jsx/dom */
import { Citation } from '../components/content/Citation.tsrx'
import { useLinkComponent } from '../components/navigation/use-link-component.web.tsrx'
import type { NavigationActivationEvent } from '../props'
import type { JSX } from 'octane/jsx-runtime'

/**
 * Inline Markdown leaves — web DOM semantics matching the 0.7.4 reference:
 * real `<strong>`/`<em>`/`<del>`/`<br>`/`<a>`/`<img>` elements inside text,
 * a `role="paragraph"` div for paragraphs, and the provider link component
 * for internal destinations.
 */

export function MdStrong(props: { children?: unknown }): JSX.Element @{
  return <strong style={{ fontWeight: 600 }}>{props.children}</strong>
}

export function MdEmphasis(props: { children?: unknown }): JSX.Element @{
  return <em>{props.children}</em>
}

export function MdDelete(props: { children?: unknown }): JSX.Element @{
  return <del style={{ color: 'var(--color-text-secondary)' }}>{props.children}</del>
}

/** Leaf run — a plain `<span>` in text; `onLinkTap` maps to click for the
 *  shared leaf signature (link/citation runs own their own handlers). */
export function MdTextRun(props: {
  text: string
  style?: Record<string, unknown>
  onLinkTap?: () => void
}): JSX.Element @{
  return (
    <span
      style={props.style as any}
      {...(props.onLinkTap ? { onClick: () => props.onLinkTap!() } : {})}
    >
      {props.text}
    </span>
  )
}

/** Inline code — a real `<code>` element in text, matching the reference. */
export function MdCodeRun(props: { style?: unknown; children?: unknown }): JSX.Element @{
  return <code style={props.style as any}>{props.children}</code>
}

export function MdBreak(): JSX.Element @{
  return <br />
}

/** Link — external `http(s)` gets `target=_blank rel="noopener noreferrer"`
 *  on a plain anchor; internal hrefs resolve through `useLinkComponent`.
 *  `onLinkClick` returning `false` cancels default navigation. */
export function MdLinkRun(props: {
  href: string
  onLinkClick?: (href: string, event: NavigationActivationEvent) => void | false
  children?: unknown
}): JSX.Element @{
  const href = props.href
  const external = href.startsWith('https://') || href.startsWith('http://')
  const LinkComponent = useLinkComponent()
  const handleClick = props.onLinkClick
    ? (e: any) => {
        let prevented = false
        const event: NavigationActivationEvent = {
          get defaultPrevented() {
            return prevented
          },
          preventDefault() {
            prevented = true
          },
          button: e.button,
          metaKey: e.metaKey,
          ctrlKey: e.ctrlKey,
          shiftKey: e.shiftKey,
          altKey: e.altKey,
        }

        const result = props.onLinkClick?.(href, event)
        if (result === false || prevented) {
          e.preventDefault()
        }
      }
    : undefined

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        style={{ color: 'var(--color-text-accent)', textDecoration: 'underline' }}
      >
        {props.children}
      </a>
    )
  }

  const Tag = LinkComponent as any
  return (
    <Tag
      href={href}
      onClick={handleClick}
      style={{ color: 'var(--color-text-accent)', textDecoration: 'underline' }}
    >
      {props.children}
    </Tag>
  )
}

/** Inline image — a real `<img>` inside text on web. */
export function MdInlineImage(props: { src: string; alt: string }): JSX.Element @{
  return (
    <img
      src={props.src}
      alt={props.alt}
      style={{ maxWidth: '100%', borderRadius: 'var(--radius-element, 4px)' }}
    />
  )
}

/** Citation — the shared chip component renders inside text on web. */
export function MdCitation(props: {
  source: { title?: string; url?: string }
  number: number
  variant: 'label' | 'number'
}): JSX.Element @{
  return <Citation source={props.source} number={props.number} variant={props.variant} />
}

/** Paragraph — `<div role="paragraph">` like the reference (inline content
 *  can carry block-level nodes, so `<p>` composition is avoided). */
export function MdParagraph(props: { style?: unknown; children?: unknown }): JSX.Element @{
  return (
    <div role="paragraph" style={props.style as never}>
      {props.children}
    </div>
  )
}

/** `display="inline"` root — an inline span inheriting ambient typography. */
export function MdInlineRoot(props: { children?: unknown }): JSX.Element @{
  return (
    <span
      style={{
        display: 'inline',
        width: 'auto',
        maxWidth: 'none',
        fontFamily: 'inherit',
        color: 'inherit',
        lineHeight: 'inherit',
        fontSize: 'inherit',
      }}
    >
      {props.children}
    </span>
  )
}

/** Newly arrived streaming run — the stylesheet animates `vx-md-fade`
 *  (`--duration-medium`, `--ease-standard`, collapsed under reduced motion),
 *  the reference's reveal. `runColor` is a native-only input. */
export function MdFadeRun(props: {
  runColor?: string
  children?: unknown
}): JSX.Element @{
  return <span className="vx-md-fade">{props.children}</span>
}
