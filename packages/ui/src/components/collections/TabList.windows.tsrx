/** @jsxImportSource @octane-xplat/jsx */
import { useContext, useMemo } from 'octane'
import type {
  AppRouteStacks,
  RegisteredRouteContracts,
  RouteTransitionName,
  TabListProps,
  TabProps,
} from '../../props'

import type { NavigationItemImplementation } from '../navigation/nav-link'
import { useNavigationItem } from '../navigation/use-navigation-item.shared.tsrx'
import { useSize } from '../layout/size-context'
import { mergeStyle } from '../../internal/layout/style-merge'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from '../overlays/escape-props'
import { Icon } from '../media/Icon.tsrx'
import { Text } from '../content/Text.tsrx'
import { TabListContext, TabListProvider } from '../navigation/nav-contexts'
import { TabList as NavigationTabList, Tab as NavigationTab } from './TabList.tsrx'
import './tab-control.windows'

export { TabListContext }
export { TabMenu } from './TabList.tsrx'
export { useTabListContext } from '../navigation/nav-contexts'

const SIZE_HEIGHT = { sm: 28, md: 32, lg: 36 }

// The public overload keeps route inference; forwarding here already has the
// same erased implementation input as the shared Tab body.
const NavigationTabImplementation = NavigationTab as (
  props: NavigationItemImplementation<TabProps>,
) => any

/** Windows panel tabs use stock WinUI selection peers. Navigation tabs retain
 * the shared route/link behavior. Both keep the framework's header drawing. */
export function TabList(props: TabListProps): unknown @{
  const size = useSize(props.size, 'md')
  const layout = props.layout ?? 'hug'
  const ctx = useMemo(
    () => ({
      value: props.value,
      onChange: props.onChange,
      size,
      layout,
      pattern: 'tabs' as const,
    }),
    [props.value, props.onChange, size, layout],
  )

  @if (props.role !== 'tablist') {
    <NavigationTabList {...props} />
  } @else {
    <TabListProvider value={ctx}>
      <masonview
        id={props.id}
        ref={(view: any) => applyEscapeProps(view, props)}
        className={cx(
          'vx-tablist',
          'vx-tablist--' + size,
          layout === 'fill' && 'vx-tablist--fill',
          props.hasDivider && 'vx-tablist--divided',
          props.isFullBleed && 'vx-tablist--bleed',
          props.className,
        )}
        style={mergeStyle({ display: 'flex' }, props.style)}
      >
        <xplatwindowstabstrip
          settings={{ value: props.value, layout, label: props.id }}
          style={{ width: '100%', height: SIZE_HEIGHT[size], flexGrow: 1 }}
        >
          {props.children}
        </xplatwindowstabstrip>
      </masonview>
    </TabListProvider>
  }
}

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
  const selected = ctx.value === props.value
  const icon = selected && props.selectedIcon != null ? props.selectedIcon : props.icon
  const request = () => {
    if (link.activateNative()) {
      ctx.onChange(props.value)
    }
  }

  @if (!isTabs) {
    <NavigationTabImplementation {...props} />
  } @else {
    <xplatwindowstabheader
      id={props.id}
      settings={{ value: props.value, label: props.label, disabled: link.disabled, request }}
      ref={(view: any) => applyEscapeProps(view, props)}
    >
      <masonview
        className={cx(
          'vx-pressable',
          'vx-tab',
          selected && 'vx-tab--selected',
          ctx.layout === 'fill' && 'vx-tab--fill',
          props.className,
        )}
        isEnabled={!link.disabled}
        style={mergeStyle({ display: 'flex', height: SIZE_HEIGHT[ctx.size] }, props.style)}
      >
        <masonview
          className="vx-tab-content"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
        >
          <masonview
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {typeof icon === 'string' ? (
              <Icon name={icon} size={ctx.size === 'lg' ? 18 : ctx.size === 'sm' ? 14 : 16} />
            ) : (
              icon
            )}
            {!props.isLabelHidden && props.label !== '' ? (
              <Text className="vx-tab-label">{props.label}</Text>
            ) : null}
            {props.endContent}
          </masonview>
          <masonview
            className={cx('vx-tab-indicator', selected && 'vx-tab-indicator--on')}
            style={{ display: 'flex' }}
          />
        </masonview>
      </masonview>
    </xplatwindowstabheader>
  }
}
