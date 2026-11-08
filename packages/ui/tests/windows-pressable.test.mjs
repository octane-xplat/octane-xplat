import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, test } from 'node:test'
import { pathToFileURL } from 'node:url'
import ts from 'typescript-classic'

const require = createRequire(import.meta.url)
const runtimeUrl = pathToFileURL(require.resolve('octane/universal/native')).href
const { compile } = await import(pathToFileURL(require.resolve('octane/compiler')))
const { createObjectContainer, createObjectDriver, createUniversalRoot } = await import(runtimeUrl)
const directory = mkdtempSync(join(tmpdir(), 'xplat-windows-pressable-'))

after(() => rmSync(directory, { recursive: true, force: true }))

function moduleFile(name, code) {
  const path = join(directory, name + '.mjs')

  writeFileSync(path, code)
  return pathToFileURL(path).href
}

function compiled(name, source, imports = {}, template = true) {
  let code = template
    ? compile(source, name + '.tsrx', {
        renderer: {
          id: 'nativescript',
          module: runtimeUrl,
          target: 'universal',
          server: 'unsupported',
          text: 'host',
        },
      }).code
    : source

  code = code.replace(/from\s*(['"])([^'"]+)\1/g, (match, quote, specifier) => {
    const target = specifier === 'octane' ? runtimeUrl : imports[specifier]

    return target ? 'from ' + JSON.stringify(target) : match
  })

  return moduleFile(
    name,
    ts.transpileModule(code, {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    }).outputText,
  )
}

const refs = compiled(
  'refs',
  readFileSync(new URL('../src/internal/accessibility/ref-list.ts', import.meta.url), 'utf8'),
  {},
  false,
)

const support = moduleFile(
  'support',
  `
import {Children} from ${JSON.stringify(runtimeUrl)};
export const cx=(...values)=>values.flat(Infinity).filter(Boolean).join(' ');
export const mergeStyle=(base,style)=>({...base,...style});
export const styleRecord=style=>style??{};
export {refList} from ${JSON.stringify(refs)};
export const applyEscapeProps=()=>{};
export const nativeAccessibilityRole=value=>value;
export const nativeAccessibilityState=value=>value?.disabled?'disabled':undefined;
export const useMeasure=()=>({ref:()=>{},bounds:{width:120,height:32}});
export const usePan=value=>value;
export const usePinch=value=>value;
export const layoutChildProps=(props,style)=>({style});
export const useLinkComponent=value=>value??'a';
export const Utils={openUrl:()=>true};
export const toChildArray=Children.toArray;
export const mapChildren=Children.map;
export const followed=[];
export const followHref=href=>followed.push(href);
`,
)

const read = (name) => readFileSync(new URL('../src/components/' + name, import.meta.url), 'utf8')
const pressable = compiled(
  'pressable',
  read('actions/Pressable.windows.tsrx').replace(/^import ['"].*['"]\s*;?$/gm, ''),
  {
    '../../internal/layout/style-merge': support,
    '../../internal/accessibility/ref-list': support,
    '@octane-xplat/lib': support,
    '../overlays/escape-props': support,
    '../layout/layout-child': support,
    '../layout/useMeasure.tsrx': support,
    '../layout/pan.tsrx': support,
    '../layout/pinch.tsrx': support,
  },
)

const slot = compiled('text-slot', read('forms/text-slot.tsrx'), {
  '../../internal/rendering/child-array': support,
})

const badge = compiled('badge', read('feedback/Badge.windows.tsrx'), {
  '@octane-xplat/lib': support,
  '../overlays/escape-props': support,
  '../forms/text-slot.tsrx': slot,
})

const { Badge } = await import(badge)

const card = compiled('card', read('actions/Card.windows.tsrx'), {
  '../../internal/layout/style-merge': support,
  '@octane-xplat/lib': support,
  '../overlays/escape-props': support,
  '../forms/text-slot.tsrx': slot,
})

const safeUrl = compiled(
  'safe-url',
  readFileSync(new URL('../src/routing/safe-url.ts', import.meta.url), 'utf8'),
  {},
  false,
)

const clickableCard = compiled('clickable-card', read('actions/ClickableCard.windows.tsrx'), {
  '../../internal/layout/style-merge': support,
  '@octane-xplat/lib': support,
  '@nativescript/core': support,
  '../../routing/safe-url': safeUrl,
  './Pressable.tsrx': pressable,
  '../forms/text-slot.tsrx': slot,
})

const { Card } = await import(card)
const { ClickableCard } = await import(clickableCard)

const link = compiled('link', read('navigation/Link.windows.tsrx'), {
  '../../internal/layout/style-merge': support,
  '@nativescript/core': support,
  '../actions/Pressable.tsrx': pressable,
  '../forms/text-slot.tsrx': slot,
  './use-link-component.tsrx': support,
})

const { Pressable } = await import(pressable)
const { Link } = await import(link)
const icon = compiled(
  'banner-icon',
  'export function Icon(props) @{ <label className={props.className} text={props.name} /> }',
)

const collapsibleContext = compiled(
  'collapsible-context',
  read('collections/collapsible-context.ts'),
  {},
  false,
)

const collapsible = compiled('collapsible', read('collections/Collapsible.tsrx'), {
  '../../internal/layout/style-merge': support,
  '@octane-xplat/lib': support,
  '../overlays/escape-props': support,
  '../actions/Pressable.tsrx': pressable,
  './collapsible-context': collapsibleContext,
})

const banner = compiled(
  'banner',
  read('feedback/Banner.windows.tsrx').replace(/^import ['"].*['"]\s*;?$/gm, ''),
  {
    '../../internal/layout/style-merge': support,
    '@octane-xplat/lib': support,
    '../overlays/escape-props': support,
    '../actions/Pressable.tsrx': pressable,
    '../media/Icon.tsrx': icon,
    '../forms/text-slot.tsrx': slot,
    '../collections/Collapsible.tsrx': collapsible,
  },
)

const { Banner } = await import(banner)

const listContext = compiled('list-context', read('collections/list-context.ts'), {}, false)
const list = compiled(
  'list',
  read('collections/List.windows.tsrx').replace(/^import ['"].*['"]\s*;?$/gm, ''),
  {
    '../../internal/layout/style-merge': support,
    '../../internal/accessibility/ref-list': support,
    '@octane-xplat/lib': support,
    '../overlays/escape-props': support,
    '../../internal/rendering/child-array': support,
    './list-context': listContext,
  },
)

const listItem = compiled('list-item', read('collections/ListItem.windows.tsrx'), {
  '../../internal/layout/style-merge': support,
  '../../internal/accessibility/ref-list': support,
  '@octane-xplat/lib': support,
  '../overlays/escape-props': support,
  '../actions/Pressable.tsrx': pressable,
  '../forms/text-slot.tsrx': slot,
  './list-context': listContext,
  '../navigation/nav-href': support,
})

const { ListItem } = await import(listItem)
const listRowWithContext = compiled(
  'list-row-with-context',
  `import {ListItem} from ${JSON.stringify(listItem)};
import {List} from ${JSON.stringify(list)};
export function ListRowWithContext(props) @{
  <List density={props.density??'compact'}>
    <ListItem {...props} />
  </List>
}`,
)

const { ListRowWithContext } = await import(listRowWithContext)

const tableSlots = compiled(
  'table-slot',
  readFileSync(new URL('../src/table/table-slot.tsrx', import.meta.url), 'utf8'),
)

const tableSortable = compiled(
  'table-sortable',
  readFileSync(new URL('../src/table/use-table-sortable.windows.tsrx', import.meta.url), 'utf8'),
  {
    '../components/actions/Pressable.tsrx': pressable,
    '../components/forms/text-slot.tsrx': slot,
    '../components/media/Icon.tsrx': icon,
    './table-slot.tsrx': tableSlots,
  },
)

const sortableHeader = compiled(
  'sortable-header-fixture',
  `import {useTableSortable} from ${JSON.stringify(tableSortable)};
import {TableSlot} from ${JSON.stringify(tableSlots)};
export function SortableHeader(props) @{
  const plugin = useTableSortable(props.config)
  const cell = plugin.transformHeaderCell({htmlProps:{},classes:[],content:props.content},props.column)
  <TableSlot value={cell.content} />
}`,
)

const { SortableHeader } = await import(sortableHeader)

const sizeContext = compiled('size-context', read('layout/size-context.ts'), {}, false)
const navContexts = compiled(
  'nav-contexts',
  read('navigation/nav-contexts.ts'),
  {
    '../layout/size-context': sizeContext,
  },
  false,
)

const navSupport = moduleFile(
  'tab-navigation-support',
  `
import {createContext} from ${JSON.stringify(runtimeUrl)};
export const RouterScopeContext=createContext(null);
export const requireRouterRenderScope=()=>{throw new Error('Unexpected router destination')};
export const navLinkDestination=()=>{throw new Error('Unexpected router destination')};
export const navLinkIsActive=()=>false;
export const navLinkActivation=()=>({defaultPrevented:false,preventDefault(){this.defaultPrevented=true}});
`,
)

const navigationItem = compiled(
  'tab-navigation-item',
  read('navigation/use-navigation-item.shared.tsrx'),
  {
    '../../routing/router-hook-context': navSupport,
    '../../routing/router-render-scope': navSupport,
    './nav-link': navSupport,
  },
)

const tabText = compiled(
  'tab-text',
  'export function Text(props) @{ <label text={props.children} /> }',
)

const tabPopover = moduleFile(
  'tab-popover',
  `export {Collapsible as Popover} from ${JSON.stringify(collapsible)};`,
)

const tabs = compiled('tab-list', read('collections/TabList.tsrx'), {
  '../../internal/layout/style-merge': support,
  '@octane-xplat/lib': support,
  '../overlays/escape-props': support,
  '../layout/size-context': sizeContext,
  '../navigation/nav-contexts': navContexts,
  '../navigation/use-navigation-item.shared.tsrx': navigationItem,
  '../navigation/nav-href': support,
  '../media/Icon.tsrx': icon,
  '../content/Text.tsrx': tabText,
  '../overlays/Popover.tsrx': tabPopover,
  '../actions/Pressable.tsrx': pressable,
})

const tabFixture = compiled(
  'tab-list-fixture',
  `
import {Tab,TabList} from ${JSON.stringify(tabs)};
export function TabFixture(props) @{
  <TabList role="tablist" layout="fill" value={props.value} onChange={props.onChange}>
    <Tab value="first" label={props.label} />
    <Tab value="disabled" label="Unavailable" isDisabled />
    <Tab value="third" label="Third" />
  </TabList>
}`,
)

const { TabFixture } = await import(tabFixture)

const windowsTabs = compiled(
  'windows-tab-list',
  read('collections/TabList.windows.tsrx').replace(/^import ['"].*['"]\s*;?$/gm, ''),
  {
    '../../internal/layout/style-merge': support,
    '@octane-xplat/lib': support,
    '../overlays/escape-props': support,
    '../layout/size-context': sizeContext,
    '../navigation/nav-contexts': navContexts,
    '../navigation/use-navigation-item.shared.tsrx': navigationItem,
    '../media/Icon.tsrx': icon,
    '../content/Text.tsrx': tabText,
    './TabList.tsrx': tabs,
  },
)

const windowsTabFixture = compiled(
  'windows-tab-list-fixture',
  `import {Tab,TabList} from ${JSON.stringify(windowsTabs)};
export function WindowsTabFixture(props) @{
 <TabList role={props.role} value={props.value} onChange={props.onChange}>
  <Tab value="first" label={props.label} icon="regular" selectedIcon="selected" endContent={<label text="Trailing slot" />} />
  <Tab value="disabled" label="Unavailable" isDisabled />
  <Tab value="third" label="Third" isLabelHidden icon="third-icon" />
 </TabList>
}`,
)

const { WindowsTabFixture } = await import(windowsTabFixture)

const selectSupport = moduleFile(
  'select-support',
  `
export const useTranslator=()=>value=>value;
export const useIndicator=()=>undefined;
export const useFieldControlProps=props=>props;
`,
)

const selectFallback = compiled(
  'select-fallback',
  'export function SelectView() @{ <label text="shared-fallback" /> }',
)

const selectOptions = compiled('select-options', read('forms/select-options.ts'), {}, false)
const selectState = compiled(
  'select-state',
  read('forms/useSelect.tsx'),
  {
    '../../internal/platform/internationalization': selectSupport,
    './select-options': selectOptions,
  },
  false,
)

const selectIndicators = compiled(
  'select-indicators',
  'export function CheckIndicator(props) @{ <label text={props.state} /> }',
)

const selectView = compiled(
  'select-view',
  read('forms/SelectView.windows.tsrx').replace(/^import ['"].*['"]\s*;?$/gm, ''),
  {
    '@octane-xplat/lib': support,
    '../../internal/layout/style-merge': support,
    '../layout/useMeasure.tsrx': support,
    '../media/Icon.tsrx': icon,
    '../feedback/indicators': selectIndicators,
    '../feedback/use-indicator.tsrx': selectSupport,
    './SelectView.tsrx': selectFallback,
  },
)

const selectContainer = compiled('select-container', read('forms/Select.windows.tsrx'), {
  './field-context': selectSupport,
  './useSelect': selectState,
  './SelectView.windows.tsrx': selectView,
})

const { Select: WindowsSelect } = await import(selectContainer)

const menuSupport = moduleFile(
  'menu-support',
  `
export const useButtonGroup=()=>undefined;
export const useSize=(size)=>size??'md';
export const reportActionError=error=>{throw error};
`,
)

const menuSpinner = compiled(
  'menu-spinner',
  'export function ActivityIndicator() @{ <label text="Loading" /> }',
)

const menuButton = compiled('menu-button', read('actions/Button.tsrx'), {
  '@nativescript/core': support,
  '@octane-xplat/lib': support,
  '../forms/text-slot.tsrx': slot,
  './Pressable.tsrx': pressable,
  '../feedback/ActivityIndicator.tsrx': menuSpinner,
  '../media/Icon.tsrx': icon,
  './button-group-context': menuSupport,
  '../layout/size-context': menuSupport,
  '../../routing/safe-url': safeUrl,
  '../../internal/layout/style-merge': support,
  '../../internal/rendering/action-error': menuSupport,
})

const menuView = compiled(
  'menu-view',
  'export function View(props) @{ <masonview ref={props.ref}>{props.children}</masonview> }',
)

const menuFallback = compiled(
  'menu-fallback',
  `export function DropdownMenu(props) @{
 <masonview id="shared-menu-fallback" accessibilityValue={props.isOpen?'open':'closed'} settings={{toggle:()=>props.onOpenChange(!props.isOpen)}} />
}`,
)

const windowsMenu = compiled(
  'windows-menu',
  read('overlays/DropdownMenu.windows.tsrx').replace(/^import ['"].*['"]\s*;?$/gm, ''),
  {
    '@octane-xplat/lib': support,
    '../actions/Button.tsrx': menuButton,
    '../actions/button-group-context': menuSupport,
    '../content/Text.tsrx': tabText,
    '../layout/View.tsrx': menuView,
    '../layout/useMeasure.tsrx': support,
    '../media/Icon.tsrx': icon,
    './DropdownMenu.tsrx': menuFallback,
  },
)

const { DropdownMenu: WindowsDropdownMenu } = await import(windowsMenu)

function mount(component, props) {
  const container = createObjectContainer('nativescript')
  const root = createUniversalRoot(container, createObjectDriver('nativescript'))
  const nodes = () => {
    const visit = (children) => children.flatMap((node) => [node, ...visit(node.children ?? [])])

    return visit(container.children)
  }

  root.render(component, props)
  return { root, nodes, render: (props) => root.render(component, props) }
}

// This exercises actual compiled TabList/Tab/provider/navigation code. The
// object driver and fixed measurement cannot establish WinUI layout or UIA.
test('Windows TabList mounts and refreshes controlled tabs without adding peers', () => {
  const first = []
  const current = []
  const f = mount(TabFixture, { value: 'first', label: 'First', onChange: (v) => first.push(v) })

  try {
    const peers = () => f.nodes().filter((n) => n.type === 'xplatwindowsbutton')

    assert.equal(peers().length, 3)
    assert.equal(peers()[1].props.isEnabled, false)
    peers()[2].props.settings.onPress()
    assert.deepEqual(first, ['third'])
    f.render({ value: 'third', label: 'Updated first', onChange: (v) => current.push(v) })
    assert.equal(peers().length, 3)
    assert.ok(f.nodes().some((n) => n.props.text === 'Updated first'))
    peers()[0].props.settings.onPress()
    assert.deepEqual(first, ['third'])
    assert.deepEqual(current, ['first'])
    assert.ok(f.nodes().some((n) => n.props.className?.includes('vx-tab--selected')))
  } finally {
    f.root.unmount()
  }

  assert.equal(f.nodes().length, 0)
})

test('Windows panel tabs keep header slots and current callbacks without button peers', () => {
  const old = []
  const current = []
  const f = mount(WindowsTabFixture, {
    role: 'tablist',
    value: 'first',
    label: 'First',
    onChange: (value) => old.push(value),
  })

  try {
    const headers = () => f.nodes().filter((node) => node.type === 'xplatwindowstabheader')

    assert.equal(headers().length, 3)
    assert.equal(f.nodes().filter((node) => node.type === 'xplatwindowstabstrip').length, 1)
    assert.equal(f.nodes().filter((node) => node.type === 'xplatwindowsbutton').length, 0)
    assert.equal(headers()[1].props.settings.disabled, true)
    assert.equal(headers()[2].props.settings.label, 'Third')
    assert.ok(f.nodes().some((node) => node.props.text === 'Trailing slot'))
    assert.ok(f.nodes().some((node) => node.props.text === 'selected'))
    headers()[2].props.settings.request()
    assert.deepEqual(old, ['third'])
    f.render({
      role: 'tablist',
      value: 'third',
      label: 'Updated first',
      onChange: (value) => current.push(value),
    })

    assert.equal(headers().length, 3)
    assert.equal(headers()[0].props.settings.label, 'Updated first')
    headers()[0].props.settings.request()
    assert.deepEqual(old, ['third'])
    assert.deepEqual(current, ['first'])
  } finally {
    f.root.unmount()
  }

  assert.equal(f.nodes().length, 0)
})

test('Windows navigation tabs retain the shared button and href path', () => {
  const f = mount(WindowsTabFixture, { value: 'first', label: 'First', onChange: () => {} })

  try {
    assert.equal(f.nodes().filter((node) => node.type === 'xplatwindowsbutton').length, 3)
    assert.equal(f.nodes().filter((node) => node.type === 'xplatwindowstabstrip').length, 0)
  } finally {
    f.root.unmount()
  }
})

test('Windows Pressable mounts a native host and updates its peer kind and callback', () => {
  const first = () => {}
  const next = () => {}
  const f = mount(Pressable, { accessibilityLabel: 'First', onPress: first })

  try {
    const inputs = () =>
      f.nodes().filter((n) => n.type === 'xplatwindowsbutton' || n.type === 'xplatwindowslink')

    assert.equal(inputs().length, 1)
    assert.equal(inputs()[0].type, 'xplatwindowsbutton')
    assert.equal(inputs()[0].props.settings.onPress, first)
    assert.equal(inputs()[0].props.settings.label, 'First')
    assert.equal(inputs()[0].props.style.width, 120)
    assert.equal(inputs()[0].props.style.height, 32)
    assert.equal(inputs()[0].props.onTap, undefined)
    f.render({
      accessibilityLabel: 'Next',
      accessibilityRole: 'link',
      onPress: next,
      disabled: true,
    })

    assert.equal(inputs().length, 1)
    assert.equal(inputs()[0].type, 'xplatwindowslink')
    assert.equal(inputs()[0].props.settings.onPress, next)
    assert.equal(inputs()[0].props.isEnabled, false)
    assert.equal(inputs()[0].props.settings.label, 'Next')
  } finally {
    f.root.unmount()
  }
})

test('Windows Link gives primitive children a text host inside its hyperlink peer', () => {
  const f = mount(Link, { href: 'https://example.com', children: 'Details' })

  try {
    assert.equal(f.nodes().filter((n) => n.type === 'xplatwindowslink').length, 1)
    assert.equal(f.nodes().filter((n) => n.type === 'label').length, 1)
    assert.ok(
      f.nodes().some((n) => n.type === '#text' && n.props.value === 'Details'),
      JSON.stringify(f.nodes()),
    )
  } finally {
    f.root.unmount()
  }
})

const text = (fixture) =>
  fixture
    .nodes()
    .flatMap((node) =>
      node.type === '#text' ? [node.props.value] : node.props.text != null ? [node.props.text] : [],
    )

const buttons = (fixture) => fixture.nodes().filter((node) => node.type === 'xplatwindowsbutton')
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

test('Windows Banner renders and updates its public header, body and presentation props', () => {
  const f = mount(Banner, {
    id: 'notice',
    title: 'Saved',
    description: 'Your changes are ready',
    endContent: 0,
    children: 'More information',
    collapsible: false,
    status: 'success',
    container: 'section',
    elevation: 'low',
    style: { width: 240 },
  })

  try {
    assert.ok(text(f).includes('Saved'))
    assert.ok(text(f).includes('Your changes are ready'))
    assert.ok(text(f).includes('More information'))
    assert.ok(text(f).includes('0'))

    const host = () => f.nodes().find((node) => node.props.id === 'notice')

    assert.equal(host().props.accessibilityLabel, 'Saved')
    assert.equal(host().props.accessibilityLiveRegion, 'polite')
    assert.equal(host().props.style.width, 240)
    assert.match(host().props.className, /vx-banner--success/)
    assert.match(host().props.className, /vx-banner--section/)
    assert.match(host().props.className, /vx-banner--elev-low/)
    assert.equal(buttons(f).length, 0)
    f.render({
      id: 'notice',
      title: 'Failed',
      description: 'Try again',
      status: 'error',
      variant: 'floating',
    })

    assert.ok(text(f).includes('Failed'))
    assert.ok(text(f).includes('Try again'))
    assert.ok(!text(f).includes('Saved'))
    assert.ok(!text(f).includes('More information'))
    assert.equal(host().props.accessibilityLabel, 'Failed')
    assert.equal(host().props.accessibilityLiveRegion, 'assertive')
    assert.match(host().props.className, /vx-banner--floating/)
    assert.doesNotMatch(
      host().props.className,
      /vx-banner--success|vx-banner--section|vx-banner--elev-low/,
    )
  } finally {
    f.root.unmount()
  }
})

test('Windows Banner dismisses once through its current native action and resets on remount', async () => {
  let first = 0
  let latest = 0
  const f = mount(Banner, { title: 'Saved', onDismiss: () => first++ })

  try {
    assert.equal(buttons(f).length, 1)
    assert.equal(buttons(f)[0].props.settings.label, 'Dismiss Saved')
    assert.equal(buttons(f)[0].props.onTap, undefined)
    f.render({ title: 'Updated', onDismiss: () => latest++ })
    assert.equal(buttons(f).length, 1)
    assert.equal(buttons(f)[0].props.settings.label, 'Dismiss Updated')

    const activate = buttons(f)[0].props.settings.onPress

    activate()
    activate()
    await settle()
    assert.equal(first, 0)
    assert.equal(latest, 1)
    assert.equal(f.nodes().length, 0)
  } finally {
    f.root.unmount()
  }

  const remounted = mount(Banner, { title: 'Saved', isDismissable: true })

  try {
    assert.ok(text(remounted).includes('Saved'))
    assert.equal(buttons(remounted).length, 1)
    buttons(remounted)[0].props.settings.onPress()
    await settle()
    assert.equal(remounted.nodes().length, 0)
  } finally {
    remounted.root.unmount()
  }
})

test('Windows Banner details use the real Collapsible and Windows action leaf', async () => {
  const f = mount(Banner, { title: 'Saved', children: 'Details body' })

  try {
    assert.ok(!text(f).includes('Details body'))
    assert.ok(text(f).includes('Details'))
    assert.equal(buttons(f).length, 1)
    assert.equal(buttons(f)[0].props.settings.label, 'Details')
    buttons(f)[0].props.settings.onPress()
    await settle()
    assert.ok(text(f).includes('Details body'))
    buttons(f)[0].props.settings.onPress()
    await settle()
    assert.ok(!text(f).includes('Details body'))
  } finally {
    f.root.unmount()
  }

  const open = mount(Banner, { title: 'Saved', children: 42, collapsible: { defaultIsOpen: true } })

  try {
    assert.ok(text(open).includes('42'))
  } finally {
    open.root.unmount()
  }
})

test('Windows Banner preserves component-valued icon, title, description and action slots', async () => {
  const fixture = compiled(
    'banner-slots',
    `import {Banner} from ${JSON.stringify(banner)};
export function WithSlots(props) @{
  <Banner title={<label text={props.title} />} description={<label text="Composed description" />}
    icon={<label text="Composed icon" />} endContent={<label text="Composed action" />} collapsible={false}>
    {props.children}
  </Banner>
}`,
  )

  const { WithSlots } = await import(fixture)
  const f = mount(WithSlots, { title: 'Composed title', children: 'Composed body' })

  try {
    for (const value of [
      'Composed icon',
      'Composed title',
      'Composed description',
      'Composed action',
      'Composed body',
    ]) {
      assert.ok(text(f).includes(value), value)
    }

    f.render({ title: 'Changed title', children: 'Changed body' })
    assert.ok(text(f).includes('Changed title'))
    assert.ok(text(f).includes('Changed body'))
    assert.ok(!text(f).includes('Composed title'))
  } finally {
    f.root.unmount()
  }
})

test('Windows Badge preserves zero, primitive runs and children precedence through updates', () => {
  const f = mount(Badge, { id: 'badge', children: 'Ready', label: 'Ignored' })

  try {
    assert.deepEqual(text(f), ['Ready'])
    f.render({ id: 'badge', children: 0, label: 'Ignored' })
    assert.deepEqual(text(f), ['0'])
    assert.equal(f.nodes().filter((node) => node.type === 'label').length, 1)
    f.render({ id: 'badge', children: ['Count ', 0, 12n], label: 'Ignored' })
    assert.deepEqual(text(f), ['Count 012'])
    f.render({ id: 'badge', label: 0 })
    assert.deepEqual(text(f), ['0'])
    f.render({ id: 'badge', children: '', label: 'Ignored' })
    assert.ok(!text(f).includes('Ignored'))
  } finally {
    f.root.unmount()
  }
})

test('Windows Badge preserves component children between primitive runs', async () => {
  const fixture = compiled(
    'badge-slots',
    `import {Badge} from ${JSON.stringify(badge)};
export function BadgeWithSlots(props) @{
  <Badge>{'Count '}{props.count}<label text="Composed" />{props.suffix}</Badge>
}`,
  )

  const { BadgeWithSlots } = await import(fixture)
  const f = mount(BadgeWithSlots, { count: 0, suffix: ' total' })

  try {
    assert.deepEqual(text(f), ['Count 0', 'Composed', ' total'])
    f.render({ count: 2, suffix: ' ready' })
    assert.deepEqual(text(f), ['Count 2', 'Composed', ' ready'])
  } finally {
    f.root.unmount()
  }
})

test('Windows Card gives primitive slots text hosts and updates explicit padding without losing theme defaults', () => {
  const f = mount(Card, { id: 'card', header: 'Header', children: 0, footer: 'Footer', padding: 2 })

  try {
    const host = () => f.nodes().find((node) => node.props.id === 'card')
    const edges = () =>
      ['Top', 'Right', 'Bottom', 'Left'].map((edge) => host().props.style['padding' + edge])

    assert.deepEqual(text(f), ['Header', '0', 'Footer'])
    assert.equal(f.nodes().filter((node) => node.type === 'label').length, 3)
    assert.deepEqual(edges(), [8, 8, 8, 8])
    f.render({ id: 'card', children: 'Updated', padding: 0 })
    assert.deepEqual(edges(), [0, 0, 0, 0])
    assert.deepEqual(text(f), ['Updated'])
    f.render({ id: 'card', children: 'Themed', width: 200 })
    assert.deepEqual(edges(), [undefined, undefined, undefined, undefined])
    assert.equal(host().props.style.width, 200)
    assert.equal(host().props.style.padding, undefined)
  } finally {
    f.root.unmount()
  }
})

test('Windows ClickableCard preserves text, current callbacks and disabled semantics across button/link updates', () => {
  let first = 0
  let current = 0
  const f = mount(ClickableCard, {
    id: 'clickable',
    label: 'Open',
    children: 0,
    padding: 2,
    onPress: () => first++,
  })

  try {
    assert.deepEqual(text(f), ['0'])

    const host = () => f.nodes().find((node) => node.props.id === 'clickable')

    assert.equal(host().props.style.paddingLeft, 8)
    assert.equal(buttons(f).length, 1)
    buttons(f)[0].props.settings.onPress()
    assert.equal(first, 1)
    f.render({ id: 'clickable', label: 'Next', children: 'Next', onPress: () => current++ })
    assert.equal(host().props.style.paddingLeft, 16)
    buttons(f)[0].props.settings.onPress()
    assert.equal(current, 1)
    f.render({
      id: 'clickable',
      label: 'Disabled',
      href: '/details',
      isDisabled: true,
      onPress: () => current++,
    })

    assert.equal(buttons(f).length, 1)
    assert.equal(buttons(f)[0].props.isEnabled, false)
    buttons(f)[0].props.settings.onPress()
    assert.equal(current, 1)
    f.render({ id: 'clickable', label: 'Details', href: '/details', children: 'Details' })
    assert.equal(f.nodes().filter((node) => node.type === 'xplatwindowslink').length, 1)
  } finally {
    f.root.unmount()
  }
})

test('Windows ListItem renders primitive slots without creating an action peer', () => {
  const props = {
    id: 'row',
    label: 0,
    description: 'Details',
    startContent: 'Leading',
    children: 'Body',
    endContent: 0,
  }

  const f = mount(ListRowWithContext, props)

  try {
    assert.deepEqual(text(f), ['Leading', '0', 'Details', 'Body', '0'])
    assert.equal(buttons(f).length, 0)
    assert.equal(f.nodes().filter((node) => node.type === 'xplatwindowslink').length, 0)

    const host = f.nodes().find((node) => node.props.id === 'row')

    assert.ok(host.props.className.includes('vx-listitem--density-compact'))
    assert.equal(host.props.onTap, undefined)
    f.render({ ...props, density: 'balanced' })
    assert.ok(
      f
        .nodes()
        .find((node) => node.props.id === 'row')
        .props.className.includes('vx-listitem--density-balanced'),
    )
  } finally {
    f.root.unmount()
  }
})

test('Windows ListItem uses one native action with current names, callbacks and disabled guards', () => {
  let first = 0
  let current = 0
  const f = mount(ListItem, { id: 'row', label: 'Open', onPress: () => first++ })

  try {
    assert.equal(buttons(f).length, 1)
    assert.equal(buttons(f)[0].props.settings.label, 'Open')
    assert.equal(f.nodes().find((node) => node.props.id === 'row').props.onTap, undefined)
    assert.equal(buttons(f)[0].props.onTap, undefined)
    buttons(f)[0].props.settings.onPress()
    assert.equal(first, 1)
    f.render({ id: 'row', label: 0, isDisabled: true, onPress: () => current++ })
    assert.equal(buttons(f).length, 1)
    assert.equal(buttons(f)[0].props.settings.label, '0')
    assert.equal(buttons(f)[0].props.isEnabled, false)
    buttons(f)[0].props.settings.onPress()
    assert.equal(current, 0)
    f.render({ id: 'row', label: 'Next', isSelected: true, onPress: () => current++ })
    assert.equal(buttons(f)[0].props.settings.label, 'Next')
    assert.equal(buttons(f)[0].props.isEnabled, true)
    buttons(f)[0].props.settings.onPress()
    assert.equal(current, 1)
    assert.equal(first, 1)
    assert.ok(
      f
        .nodes()
        .find((node) => node.props.id === 'row')
        .props.className.includes('vx-listitem--selected'),
    )

    f.render({ id: 'row', label: 'Static' })
    assert.equal(buttons(f).length, 0)
    assert.deepEqual(text(f), ['Static'])
  } finally {
    f.root.unmount()
  }
})

test('Windows ListItem routes a hyperlink peer through its current href and rejects disabled navigation', async () => {
  const { followed } = await import(support)

  followed.length = 0

  const f = mount(ListItem, { label: 'Details', accessibilityLabel: 'Destination', href: '/first' })
  const links = () => f.nodes().filter((node) => node.type === 'xplatwindowslink')

  try {
    assert.equal(links().length, 1)
    assert.equal(links()[0].props.settings.label, 'Destination')
    links()[0].props.settings.onPress()
    assert.deepEqual(followed, ['/first'])
    f.render({ label: 'Updated', href: '/next' })
    links()[0].props.settings.onPress()
    assert.deepEqual(followed, ['/first', '/next'])
    f.render({ label: 'Disabled', href: '/blocked', isDisabled: true })
    assert.equal(links()[0].props.isEnabled, false)
    links()[0].props.settings.onPress()
    assert.deepEqual(followed, ['/first', '/next'])
  } finally {
    f.root.unmount()
  }
})

test('Windows sortable header uses one native peer and retains controlled sort cycles', () => {
  const requests = []
  const onSortChange = (next) => requests.push(next)
  const column = { key: 'name', header: 'Name', sortable: true }
  const f = mount(SortableHeader, { column, content: 'Name', config: { sort: [], onSortChange } })

  try {
    assert.equal(buttons(f).length, 1)
    assert.equal(buttons(f)[0].props.settings.label, 'Sort by Name')
    assert.ok(text(f).includes('xplat-arrows-up-down'))
    assert.ok(f.nodes().every((node) => node.props.onTap === undefined))
    buttons(f)[0].props.settings.onPress()
    assert.deepEqual(requests, [[{ sortKey: 'name', direction: 'ascending' }]])
    assert.equal(buttons(f)[0].props.settings.label, 'Sort by Name')
    for (const [direction, expected, marker] of [
      ['ascending', [{ sortKey: 'name', direction: 'descending' }], 'xplat-arrow-up'],
      ['descending', [], 'xplat-arrow-down'],
    ]) {
      f.render({
        column,
        content: 'Name',
        config: { sort: [{ sortKey: 'name', direction }], onSortChange },
      })

      assert.equal(buttons(f).length, 1)
      assert.equal(buttons(f)[0].props.settings.label, `Sorted by Name ${direction}`)
      assert.ok(text(f).includes(marker))
      buttons(f)[0].props.settings.onPress()
      assert.deepEqual(requests.at(-1), expected)
    }

    assert.equal(requests.length, 3)
  } finally {
    f.root.unmount()
  }
})

test('Windows sortable header reads current config and preserves zero and component slots', async () => {
  const { tableSlot } = await import(tableSlots)
  const { Icon } = await import(icon)
  let stale = 0
  const requests = []
  const column = { key: 'name', header: 'Name', sortable: { sortKey: 'title' } }
  const f = mount(SortableHeader, {
    column,
    content: 'Name',
    config: { sort: [], onSortChange: () => stale++ },
  })

  try {
    const oldHandler = buttons(f)[0].props.settings.onPress
    const config = {
      sort: [{ sortKey: 'title', direction: 'descending' }],
      allowUnsortedState: false,
      onSortChange: (next) => requests.push(next),
    }

    f.render({ column: { ...column, header: 'Title' }, content: 0, config })
    assert.equal(buttons(f)[0].props.settings.label, 'Sorted by Title descending')
    assert.ok(text(f).includes('0'))
    oldHandler()
    assert.equal(stale, 0)
    assert.deepEqual(requests, [[{ sortKey: 'title', direction: 'ascending' }]])
    f.render({ column, content: tableSlot(Icon, { name: 'Custom header' }), config })
    assert.ok(text(f).includes('Custom header'))
    f.render({
      column: { key: 'name', sortable: false },
      content: tableSlot(Icon, { name: 'Plain' }),
      config,
    })

    assert.equal(buttons(f).length, 0)
    assert.deepEqual(text(f), ['Plain'])
  } finally {
    f.root.unmount()
  }
})

test('Windows Selector compiled container keeps finite state ownership and current controlled callbacks', async () => {
  const calls = []
  const options = [
    { value: 'first', label: 'First' },
    { value: 'disabled', label: 'Unavailable', isDisabled: true },
    { value: 'third', label: 'Third' },
  ]

  const f = mount(WindowsSelect, {
    id: 'choice',
    options,
    value: 'first',
    open: false,
    accessibilityLabel: 'Pick',
    onValueChange: (value) => calls.push(value),
  })

  const peer = () => f.nodes().find((n) => n.type === 'xplatwindowsselect')

  try {
    assert.equal(peer().props.settings.value, 'first')
    assert.equal(peer().props.settings.label, 'Pick')
    assert.deepEqual(peer().props.style, {
      position: 'absolute',
      left: 0,
      top: 0,
      width: 120,
      height: 32,
    })

    assert.equal(f.nodes().filter((n) => n.type === 'xplatwindowsselectoption').length, 3)
    peer().props.settings.onPick('disabled')
    assert.deepEqual(calls, [])
    peer().props.settings.onPick('third')
    assert.deepEqual(calls, ['third'])
    assert.equal(peer().props.settings.value, 'first')
    f.render({
      options,
      value: 'third',
      open: true,
      accessibilityLabel: 'Revised',
      onValueChange: (value) => calls.push('current:' + value),
    })

    assert.equal(peer().props.settings.value, 'third')
    assert.equal(peer().props.settings.open, true)
    assert.equal(peer().props.settings.label, 'Revised')
    peer().props.settings.onPick('first')
    assert.deepEqual(calls, ['third', 'current:first'])
    f.render({ options, value: 'first', isDisabled: true })
    assert.equal(peer().props.settings.blocked, true)
    peer().props.settings.onPick('third')
    assert.deepEqual(calls, ['third', 'current:first'])
  } finally {
    f.root.unmount()
  }

  assert.equal(f.nodes().length, 0)
})

test('Windows Selector compiled uncontrolled choice closes once and async failure restores its previous value', async () => {
  const calls = [],
    opens = []

  let reject
  const options = [
    { value: 'a', label: 'A' },
    { value: 'b', label: 'B' },
  ]

  const props = {
    options,
    defaultValue: 'a',
    defaultOpen: true,
    onOpenChange: (open) => opens.push(open),
    onValueChange: (value) => calls.push(value),
    changeAction: () =>
      new Promise((_resolve, fail) => {
        reject = fail
      }),
  }

  const f = mount(WindowsSelect, props),
    peer = () => f.nodes().find((n) => n.type === 'xplatwindowsselect')

  try {
    peer().props.settings.onPick('b')
    await new Promise((resolve) => setTimeout(resolve, 0))
    assert.equal(peer().props.settings.value, 'b')
    assert.equal(peer().props.settings.blocked, true)
    assert.deepEqual(calls, ['b'])
    assert.deepEqual(opens, [false])
    peer().props.settings.onPick('b')
    assert.deepEqual(calls, ['b'])
    reject(new Error('save rejected'))
    await new Promise((resolve) => setTimeout(resolve, 0))
    assert.equal(peer().props.settings.value, 'a')
    assert.equal(peer().props.settings.blocked, false)
    assert.deepEqual(calls, ['b', 'a'])
    f.render({ ...props, multiple: undefined, selectionMode: 'multiple' })
    assert.equal(peer(), undefined)
    assert.ok(f.nodes().some((n) => n.props.text === 'shared-fallback'))
  } finally {
    f.root.unmount()
  }
})

test('Windows DropdownMenu compiled leaf keeps controlled ownership and current row callbacks', async () => {
  const calls = []
  const props = {
    id: 'actions',
    isOpen: false,
    label: 'Actions',
    button: { label: 'Open menu' },
    items: [{ type: 'action', key: 'first', label: 'First', onSelect: () => calls.push('old') }],
    onOpenChange: (open) => calls.push(open),
  }

  const f = mount(WindowsDropdownMenu, props)
  const peer = () => f.nodes().find((n) => n.type === 'xplatwindowsmenu')

  try {
    buttons(f)[0].props.settings.onPress()
    assert.deepEqual(calls, [true])
    assert.equal(peer().props.settings.open, false)
    assert.equal(buttons(f).length, 1)
    f.render({
      ...props,
      isOpen: true,
      label: 'Current menu',
      items: [{ ...props.items[0], onSelect: () => calls.push('current') }],
      onOpenChange: (open) => calls.push('current:' + open),
    })

    assert.equal(peer().props.settings.open, true)
    assert.equal(peer().props.settings.label, 'Current menu')
    assert.deepEqual(peer().props.style, {
      position: 'absolute',
      left: 0,
      top: 0,
      width: 120,
      height: 32,
    })

    f.nodes()
      .find((n) => n.type === 'xplatwindowsmenuitem')
      .props.settings.onSelect()

    peer().props.settings.onOpenChange(false)
    assert.deepEqual(calls, [true, 'current', 'current:false'])
    assert.equal(peer().props.settings.open, true)
    f.render({ ...props, isDisabled: true })
    assert.equal(peer().props.settings.blocked, true)

    const count = calls.length

    buttons(f)[0].props.settings.onPress()
    assert.equal(calls.length, count)
  } finally {
    f.root.unmount()
  }
})

test('Windows DropdownMenu compiled leaf shares uncontrolled state across supported/fallback presentations', async () => {
  const opens = []
  const props = {
    defaultOpen: true,
    button: { label: 'Menu' },
    items: [{ type: 'action', key: 'first', label: 'First' }],
    onOpenChange: (open) => opens.push(open),
  }

  const f = mount(WindowsDropdownMenu, props)
  const peer = () => f.nodes().find((n) => n.type === 'xplatwindowsmenu')
  const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

  try {
    assert.equal(peer().props.settings.open, true)
    peer().props.settings.onOpenChange(false)
    await tick()
    assert.equal(peer().props.settings.open, false)
    peer().props.settings.onOpenChange(false)
    assert.deepEqual(opens, [false])
    buttons(f)[0].props.settings.onPress()
    await tick()
    assert.equal(peer().props.settings.open, true)
    f.render({ ...props, menuWidth: 200 })
    assert.equal(peer(), undefined)

    let fallback = f.nodes().find((n) => n.props.id === 'shared-menu-fallback')

    assert.equal(fallback.props.accessibilityValue, 'open')
    fallback.props.settings.toggle()
    await tick()
    fallback = f.nodes().find((n) => n.props.id === 'shared-menu-fallback')
    assert.equal(fallback.props.accessibilityValue, 'closed')
    f.render(props)
    assert.equal(peer().props.settings.open, false)
    assert.deepEqual(opens, [false, true, false])
    f.render({
      ...props,
      items: [{ type: 'action', key: 'keep', label: 'Keep open', hasCloseOnSelect: false }],
    })

    assert.equal(peer(), undefined)
  } finally {
    f.root.unmount()
  }
})
