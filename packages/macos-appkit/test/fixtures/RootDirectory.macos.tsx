/** @jsxImportSource @octane-xplat/jsx */
import type { UniversalRenderable } from 'octane/universal/native'
import {
  createPortal,
  defineUniversalComponent,
  universalPlan,
  universalValue,
} from 'octane/universal/native'

export function DirectoryLabel({ id = 'directory-overlay' }: { id?: string }) {
  return <label id={id} text="Inherited" />
}

export default function DirectoryRoots({ target }: { target: any }) {
  return (
    <masonview style={{ display: 'flex', flexDirection: 'column' }}>
      <label id="directory-main" text="Main" />
      <tabview id="directory-tab" style={{ width: 180, height: 70 }}>
        <tabviewitem title="Tab">
          <label id="directory-tab-label" text="Tab" />
        </tabviewitem>
      </tabview>
      <RetainedTab />
      <listview
        id="directory-list"
        items={['Row']}
        itemTemplate="<Label text='{{ $value }}'/>"
        style={{ width: 180, height: 50 }}
      />
      {createPortal(
        // JSX's public host value is opaque; the compiler lowers this descriptor.
        (<DirectoryLabel id="directory-portal" />) as UniversalRenderable,
        target,
      )}
    </masonview>
  )
}

// Use the driver's raw ABI deliberately: JSX tab children are source-owned
// portals, so they cannot qualify this separate retained-root path.
const tabPlan = universalPlan('macos', {
  kind: 'host',
  type: 'tabview',
  props: { id: 'directory-tab-root', style: { width: 180, height: 70 } },
  children: [
    {
      kind: 'host',
      type: 'tabviewitem',
      props: {
        title: 'Retained',
        __tabContent: universalValue(
          universalPlan('macos', {
            kind: 'host',
            type: 'label',
            props: { id: 'directory-tab-root-label', text: 'Retained' },
          }),
        ),
      },
    },
  ],
})
const RetainedTab = defineUniversalComponent('macos', () => universalValue(tabPlan))
