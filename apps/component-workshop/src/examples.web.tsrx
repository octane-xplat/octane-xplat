/** @jsxImportSource @octane-xplat/jsx/dom */
import * as UI from '@octane-xplat/ui'
import { createPaneRouterHost, RouterProvider, RouterPane } from '@octane-xplat/ui/routing'
import { createRouter, defineRoute, defineRoutes } from '@octane-xplat/ui/routing/core'
import { useEffect, useState } from 'octane'
import { ChatComposerTokenElement } from '@octane-xplat/ui/chat'
import { MarkdownScreen, MarkdownPluginNodeRenderer, parseMdDoc } from '@octane-xplat/ui/markdown'

export function FocusScopeExample() {
  return (
    <UI.FocusScope>
      <UI.Button label="Focus the first button" />
      <UI.Button label="Then the second" />
    </UI.FocusScope>
  )
}

export function AccordionExample() {
  return (
    <UI.Accordion
      items={[
        {
          key: 'first',
          header: 'What is Workshop?',
          content: <UI.Text>An isolated component preview.</UI.Text>,
        },
      ]}
    />
  )
}

export function SizeProviderExample() {
  return (
    <UI.SizeProvider value="lg">
      <UI.Button label="Large inherited size" />
    </UI.SizeProvider>
  )
}

export function FieldGroupExample() {
  return (
    <UI.FieldGroup label="Contact">
      <UI.TextInput label="Name" />
      <UI.TextInput label="Email" />
    </UI.FieldGroup>
  )
}

export function GridListExample() {
  return (
    <UI.GridList
      items={[
        { id: 'a', label: 'Apricot' },
        { id: 'b', label: 'Blueberry' },
      ]}
      renderItem={(item) => <UI.Text>{item.label}</UI.Text>}
      selectionMode="single"
      columns={2}
    />
  )
}

export function PinInputExample() {
  const [value, setValue] = useState('')
  return <UI.PinInput value={value} onValueChange={setValue} length={4} />
}

export function InputRatingExample() {
  return <UI.InputRating defaultValue={3} accessibilityLabel="Rate this example" />
}

export function NavigationMenuExample() {
  return <UI.NavigationMenu items={[{ key: 'home', label: 'Workshop', href: '?view=gallery' }]} />
}

export function TimelineExample() {
  return (
    <UI.Timeline
      items={[
        { key: 'one', title: 'Created', description: 'Your example is ready.' },
        { key: 'two', title: 'Reviewed', description: 'Ready to share.' },
      ]}
    />
  )
}

export function AlertExample() {
  return (
    <UI.Alert tone="success" title="Saved">
      Your changes are ready.
    </UI.Alert>
  )
}

export function ChipExample() {
  const [selected, setSelected] = useState(false)
  return (
    <UI.Chip selected={selected} onSelect={() => setSelected(!selected)}>
      Select this topic
    </UI.Chip>
  )
}

export function ProgressGroupExample() {
  return (
    <UI.ProgressGroup
      items={[
        { key: 'build', label: 'Build', value: 80 },
        { key: 'upload', label: 'Upload', value: 35 },
      ]}
    />
  )
}

export function NavLinkExample() {
  const [pane] = useState(() => {
    const host = createPaneRouterHost()
    const navigation = createRouter({
      catalog: defineRoutes([
        defineRoute({ path: '/example' }).screen(() => <UI.Text>Example destination</UI.Text>),
      ]),
      host: host.host,
    })

    host.attach(navigation)
    return { host, navigation }
  })

  useEffect(() => () => pane.navigation.dispose(), [pane])
  return (
    <RouterProvider router={pane.navigation}>
      <RouterPane host={pane.host} router={pane.navigation}>
        <UI.NavLink router={pane.navigation} to="/example">
          Open a local route
        </UI.NavLink>
      </RouterPane>
    </RouterProvider>
  )
}

export function VirtualListExample() {
  return (
    <UI.VirtualList
      items={Array.from({ length: 100 }, (_, id) => ({ id: String(id) }))}
      renderItem={(item) => <UI.Text>Item {item.id}</UI.Text>}
    />
  )
}

export function WebViewExample() {
  return (
    <UI.WebView html="<!doctype html><html lang='en'><body><h2>Embedded document</h2><p>A local, network-free example.</p></body></html>" />
  )
}

export function LayerProviderExample() {
  return (
    <UI.LayerProvider>
      <UI.Button label="Layer provider owns this preview" />
    </UI.LayerProvider>
  )
}

export function ToastViewportExample() {
  return (
    <UI.LayerProvider>
      <UI.ToastViewport>
        <UI.Toast body="A notification in its viewport" />
      </UI.ToastViewport>
    </UI.LayerProvider>
  )
}

export function TabsExample() {
  return (
    <UI.Tabs
      tabs={[
        { key: 'one', title: 'Overview', render: () => <UI.Text>Overview content</UI.Text> },
        { key: 'two', title: 'Details', render: () => <UI.Text>Details content</UI.Text> },
      ]}
    />
  )
}

export function KeyboardAvoidingExample() {
  return (
    <UI.KeyboardAvoiding>
      <UI.TextInput label="Message" />
      <UI.Text>Keyboard adjustment applies on mobile; the browser keeps a column wrapper.</UI.Text>
    </UI.KeyboardAvoiding>
  )
}

export function MeterExample() {
  return <UI.Meter value={65} accessibilityLabel="Storage used" />
}

export function ColorAreaExample() {
  return (
    <UI.ColorArea defaultValue="#2563eb" accessibilityLabel="Color saturation and brightness" />
  )
}

export function ColorSliderExample() {
  return <UI.ColorSlider channel="hue" defaultValue="#2563eb" accessibilityLabel="Hue" />
}

export function ColorSwatchExample() {
  return <UI.ColorSwatch color="#2563eb" accessibilityLabel="Blue" />
}

export function ColorFieldExample() {
  return <UI.ColorField defaultValue="#2563eb" label="Color" />
}

export function ColorPickerExample() {
  return <UI.ColorPicker defaultValue="#2563eb" accessibilityLabel="Choose a color" />
}

export function IconRegistryProviderExample() {
  const [registry] = useState(() => {
    const registry = UI.createIconRegistry()
    registry.registerIcon('example', { svg: 'M4 12l5 5L20 6' })
    return registry
  })

  return (
    <UI.IconRegistryProvider value={registry}>
      <UI.Icon name="example" accessibilityLabel="Check" />
    </UI.IconRegistryProvider>
  )
}

export function CheckboxIndicatorExample() {
  return <UI.CheckboxIndicator state="checked" />
}

export function CheckIndicatorExample() {
  return <UI.CheckIndicator state="checked" />
}

export function RadioIndicatorExample() {
  return <UI.RadioIndicator state="checked" />
}

export function MenuPartsExample() {
  const [checked, setChecked] = useState(false)
  const [value, setValue] = useState('small')
  return (
    <UI.DropdownMenu label="Open example menu">
      <UI.DropdownMenuSection label="Actions">
        <UI.DropdownMenuLink href="?view=gallery" label="Gallery" />
        <UI.DropdownMenuSeparator />
        <UI.DropdownMenuCheckboxItem
          value={checked}
          onValueChange={setChecked}
          label="Show details"
        />
        <UI.DropdownMenuRadioGroup label="Size" value={value} onValueChange={setValue}>
          <UI.DropdownMenuRadioItem value="small" label="Small" />
          <UI.DropdownMenuRadioItem value="large" label="Large" />
        </UI.DropdownMenuRadioGroup>
      </UI.DropdownMenuSection>
    </UI.DropdownMenu>
  )
}

const { config } = UI.createPowerSearchConfig([
  { key: 'name', type: 'string', label: 'Name' },
] as const)

export function PowerSearchTokenExample() {
  return (
    <UI.PowerSearchToken
      config={config}
      field={config.fields[0]}
      operator={config.fields[0].operators[0]}
      filter={{ field: 'name', operator: 'contains', value: { type: 'string', value: 'Ada' } }}
      maxLength={40}
    />
  )
}

export function PowerSearchFilterEditorExample() {
  const [saved, setSaved] = useState('')
  return (
    <>
      <UI.PowerSearchFilterEditor
        config={config}
        filter={{ field: 'name' }}
        mode="create"
        onSave={() => setSaved('Filter saved')}
        onCancel={() => setSaved('Cancelled')}
      />
      <UI.Text>{saved}</UI.Text>
    </>
  )
}

export function ChatComposerTokenElementExample() {
  return <ChatComposerTokenElement token={{ value: 'ada', label: 'Ada' }} />
}

export function MarkdownScreenExample() {
  return <MarkdownScreen data={parseMdDoc('# Workshop\n\nA local Markdown document.')} />
}

export function MarkdownPluginNodeRendererExample() {
  return (
    <MarkdownPluginNodeRenderer
      plugins={[]}
      node={{
        type: 'extension',
        plugin: 'example',
        name: 'example',
        data: null,
        display: 'block',
        source: 'Unknown extensions retain readable text.',
      }}
    />
  )
}

export function RouteOutletExample() {
  const [pane] = useState(() => {
    const host = createPaneRouterHost()
    const navigation = createRouter({
      catalog: defineRoutes([
        defineRoute({ path: '/example' }).screen(() => <UI.RouteOutlet stack="details" />),
        defineRoute({ path: '/details' }).screen(() => (
          <UI.Text>Content inside the nested route outlet</UI.Text>
        )),
      ]),
      stacks: ['details'],
      host: host.host,
    })

    host.attach(navigation)
    return { host, navigation }
  })

  useEffect(() => {
    void pane.navigation
      .push({ to: '/example' })
      .then(() => pane.navigation.forStack('details').push({ to: '/details' }))

    return () => pane.navigation.dispose()
  }, [pane])

  return (
    <RouterProvider router={pane.navigation}>
      <RouterPane host={pane.host} router={pane.navigation} />
    </RouterProvider>
  )
}

export function TablePartsExample() {
  return (
    <UI.Table>
      <UI.TableHeader>
        <UI.TableRow>
          <UI.TableHeaderCell>Fruit</UI.TableHeaderCell>
          <UI.TableHeaderCell>Count</UI.TableHeaderCell>
        </UI.TableRow>
      </UI.TableHeader>
      <UI.TableBody>
        <UI.TableRow>
          <UI.TableCell>Apricot</UI.TableCell>
          <UI.TableCell>5</UI.TableCell>
        </UI.TableRow>
      </UI.TableBody>
      <UI.TableFooter>
        <UI.TableRow>
          <UI.TableCell>Total</UI.TableCell>
          <UI.TableCell>5</UI.TableCell>
        </UI.TableRow>
      </UI.TableFooter>
    </UI.Table>
  )
}
