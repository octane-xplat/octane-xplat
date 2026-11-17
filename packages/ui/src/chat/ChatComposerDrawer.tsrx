/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../internal/layout/style-merge'
import { useState } from 'octane'
import type { ChatComposerDrawerProps } from '../props'
import { Badge } from '../components/feedback/Badge.tsrx'
import { nativeAccessibilityRole, nativeAccessibilityState } from '../internal/accessibility/native-accessibility'

/** Collapsible drawer panel for a chat composer — attachments, context
 *  chips, previews. With `count`, a toggle row renders the collapsed
 *  summary (badge + label); without it the drawer is always expanded.
 *  The collapse is instant on native (the grid-row crossfade is a DOM
 *  behavior). */
export function ChatComposerDrawer(props: ChatComposerDrawerProps): unknown @{
  const isControlled = props.isCollapsed !== undefined
  const [internalCollapsed, setInternalCollapsed] = useState(props.defaultIsCollapsed ?? false)
  const isCollapsed = isControlled ? props.isCollapsed : internalCollapsed
  const canCollapse = props.count != null
  const label = props.label ?? 'Items'

  const toggle = () => {
    const next = !isCollapsed

    if (!isControlled) {
      setInternalCollapsed(next)
    }

    props.onCollapsedChange?.(next)
  }

  <masonview
    id={props.id}
    className={['vx-chatdrawer', isCollapsed && 'vx-chatdrawer--collapsed', props.className]}
    style={mergeStyle({ display: 'flex' }, props.style)}
  >
    @if (canCollapse) {
      <masonview
        className="vx-chatdrawer-toggle"
        accessibilityRole={nativeAccessibilityRole('button')}
        accessibilityLabel={isCollapsed ? `Expand ${label}` : `Collapse ${label}`}
        accessibilityState={nativeAccessibilityState({ expanded: !isCollapsed })}
        onTap={toggle}
        style={mergeStyle(
          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
          { display: 'flex' },
        )}
      >
        {isCollapsed ? (
          <masonview
            className="vx-chatdrawer-summary"
            style={mergeStyle(
              { flexDirection: 'row', alignItems: 'center' },
              { display: 'flex' },
            )}
          >
            {props.collapsedSummary === undefined ? (
              <>
                <Badge className="vx-chatdrawer-badge">
                  <label text={`${props.count}`} />
                </Badge>
                <label className="vx-chatdrawer-label" text={label} />
              </>
            ) : (
              props.collapsedSummary
            )}
          </masonview>
        ) : (
          <masonview className="vx-chatdrawer-handle" style={{ display: 'flex' }} />
        )}
      </masonview>
    }
    @if (!(canCollapse && isCollapsed)) {
      <masonview
        className="vx-chatdrawer-inner"
        style={mergeStyle({ flexDirection: 'row', flexWrap: 'wrap' }, { display: 'flex' })}
      >
        {props.children}
      </masonview>
    }
  </masonview>
}
