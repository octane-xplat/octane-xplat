/** @jsxImportSource @octane-xplat/jsx */
import type { RegisteredRouteContracts, AppRouteStacks, RouteTransitionName } from '../../props'
import type { NavigationItemImplementation } from '../navigation/nav-link'
import { useNavigationItem } from '../navigation/use-navigation-item.shared.tsrx'
import { mergeStyle } from '../../internal/layout/style-merge'
import { useContext, useEffect, useMemo, useRef, useState } from 'octane'
import type { TabListProps, TabProps, TabMenuProps } from '../../props'
import { useSize } from '../layout/size-context'
import { cx } from '@octane-xplat/lib'
import {
  applyEscapeProps,
  nativeAccessibilityRole,
  nativeAccessibilityState,
} from '../overlays/escape-props'

import { Icon } from '../media/Icon.tsrx'
import { Text } from '../content/Text.tsrx'
import { Popover } from '../overlays/Popover.tsrx'
import { Pressable } from '../actions/Pressable.tsrx'
import { followHref } from '../navigation/nav-href'
import { TabListContext, TabListProvider } from '../navigation/nav-contexts'
import { layoutChildProps } from '../layout/layout-child'

export { TabListContext }
export { useTabListContext } from '../navigation/nav-contexts'

import { SIZE_HEIGHT, navIcon } from './tab-menu.tsrx'

export { TabMenu } from './tab-menu.tsrx'

/** TabList — tab strip providing TabListContext to Tab/TabMenu children.
 *  Native leaf: a horizontal flexbox row; `overflow` `auto`/`scroll` wraps it
 *  in a horizontal scroller and the selected tab is scrolled into view. The
 *  WAI-ARIA tablist pattern carries `tab` semantics to each stop; there's no
 *  composite-widget arrow model on pointer platforms. `role="tablist"`
 *  switches item semantics; the strip itself doesn't gain native grouping. */
export function TabList(props: TabListProps): unknown @{
  const size = useSize(props.size, 'md')
  const overflow = props.overflow ?? 'auto'
  const layout = props.layout ?? 'hug'
  const hasScroll = overflow !== 'visible' && layout !== 'fill'
  const scroller = useRef<any>(null)
  const tabViews = useRef(new Map<string, any>())
  const views = tabViews.current

  const ctx = useMemo(
    () => ({
      value: props.value,
      onChange: props.onChange,
      size,
      layout,
      pattern: props.role === 'tablist' ? ('tabs' as const) : ('nav' as const),
      // Internal: Tabs/Tab register their views so the list can scroll the
      // selected stop into view. Not part of the public context type.
      _tabViews: views,
    }),
    [props.value, props.onChange, size, layout, props.role],
  )

  // Keep the selected tab visible when the value or the scroller changes.
  useEffect(() => {
    const sv = scroller.current
    const view = views.get(props.value)

    if (!sv || !view) {
      return
    }

    const vp = sv.getActualSize?.().width ?? 0
    const offset = sv.scrollLeft ?? 0
    const start = view.originX ?? 0
    const end = start + (view.getMeasuredWidth?.() ?? 0)

    if (start < offset) {
      sv.scrollTo?.({ left: start, behavior: 'smooth' })
    } else if (vp > 0 && end > offset + vp) {
      sv.scrollTo?.({ left: end - vp, behavior: 'smooth' })
    }
  }, [props.value])

  const row = (
    <masonview
      className={cx('vx-tabstrip', props.isFullBleed && 'vx-tabstrip--bleed')}
      style={mergeStyle({ alignItems: 'flex-end' }, { display: 'flex' })}
    >
      {props.children}
    </masonview>
  )

  const cls = cx(
    'vx-tablist',
    'vx-tablist--' + size,
    layout === 'fill' && 'vx-tablist--fill',
    props.hasDivider && 'vx-tablist--divided',
    props.isFullBleed && 'vx-tablist--bleed',
    props.className,
  )

  <TabListProvider value={ctx}>
    <masonview
      id={props.id}
      ref={(v: any) => applyEscapeProps(v, props)}
      className={cls}
      {...layoutChildProps(props, mergeStyle({ display: 'flex' }, props.style))}
    >
      @if (hasScroll) {
        <scrollview
          orientation="horizontal"
          ref={(v: any) => {
            scroller.current = v
          }}
          className="vx-tabstrip-scroll"
          scrollBarIndicatorVisible={false}
        >
          {row}
        </scrollview>
      } @else {
        <>{row}</>
      }
    </masonview>
  </TabListProvider>
}

/** Tab — a single stop in a TabList. Native leaf renders a Pressable;
 *  `href` activates through the deep-link/route table (`followHref`) in
 *  addition to reporting selection. */
export function Tab<
  Contracts = RegisteredRouteContracts,
  Stacks extends string = keyof AppRouteStacks & string,
  Transitions extends string = RouteTransitionName,
>(props: TabProps<Contracts, Stacks, Transitions>): any

export function Tab(props: NavigationItemImplementation<TabProps>) @{
  const ctx = useContext(TabListContext)

  if (ctx == null) {
    throw new Error('Tab must be used within a TabList.')
  }

  const isTabs = ctx.pattern === 'tabs'

  if (isTabs && props.to !== undefined) {
    throw new TypeError(
      'Typed route destinations belong in the navigation TabList pattern, not role="tablist"',
    )
  }

  const link = useNavigationItem({ ...props, href: isTabs ? undefined : props.href })
  const isSelected = props.to !== undefined ? link.selected : ctx.value === props.value
  const isDisabled = link.disabled
  const displayIcon = isSelected && props.selectedIcon != null ? props.selectedIcon : props.icon
  const showLabel = !props.isLabelHidden && props.label !== ''

  const select = () => {
    if (link.activateNative(isTabs ? undefined : followHref)) {
      ctx.onChange(props.value)
    }
  }

  <Pressable
    id={props.id}
    ref={(v: any) => {
      applyEscapeProps(v, props)
      if (v) {
        ctx?._tabViews?.set(props.value, v)
      } else {
        ctx?._tabViews?.delete(props.value)
      }
    }}
    className={cx(
      'vx-tab',
      isSelected && 'vx-tab--selected',
      ctx.layout === 'fill' && 'vx-tab--fill',
      props.className,
    )}
    style={mergeStyle({ height: SIZE_HEIGHT[ctx.size] }, props.style)}
    disabled={isDisabled}
    accessibilityRole={
      isDisabled ? 'none' : ctx.pattern === 'tabs' ? 'tab' : link.href != null ? 'link' : 'button'
    }
    accessibilityLabel={props.isLabelHidden ? props.label : undefined}
    accessibilityState={{ disabled: isDisabled, selected: isSelected }}
    onPress={select}
  >
    <masonview
      className="vx-tab-content"
      style={mergeStyle(
        { flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' },
        { display: 'flex' },
      )}
    >
      <masonview
        style={mergeStyle(
          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
          { display: 'flex' },
        )}
      >
        {displayIcon != null
          ? navIcon(displayIcon, ctx.size === 'lg' ? 18 : ctx.size === 'sm' ? 14 : 16)
          : null}
        {showLabel ? <Text className="vx-tab-label">{props.label}</Text> : null}
        {props.endContent != null ? props.endContent : null}
      </masonview>
      <masonview
        className={cx('vx-tab-indicator', isSelected && 'vx-tab-indicator--on')}
        style={{ display: 'flex' }}
      />
    </masonview>
  </Pressable>
}
