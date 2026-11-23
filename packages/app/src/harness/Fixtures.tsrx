/** @jsxImportSource @octane-xplat/jsx */
import { useEffect, useRef, useState } from 'octane'
import { BottomSheet, Button, HStack, Table, Text, TextInput, Switch, View } from '@octane-xplat/ui'

import { useStore } from '@octane-xplat/ui/data'
import { NavigationFixture } from './NavigationFixture.tsrx'
import { RENDER } from '@octane-xplat/demos'
import type { CaseSpec, MountedFixture } from './types'
import { acquireFixtureResource, fixtureResources } from './resources'

function CounterFixture() @{
  const [count, setCount] = useState(0)

  <View className="hc-column">
    <Text id="hf-count">{'Count: ' + count}</Text>
    <Text id="hf-double">{'Double: ' + count * 2}</Text>
    <Button id="hf-increment" label="Increment" onPress={() => setCount((n) => n + 1)} />
  </View>
}

function DraftRow(props: { id: string; name: string }) @{
  const [draft, setDraft] = useState(props.name + ' original')

  <TextInput
    id={'hf-row-' + props.id}
    label={props.name + ' draft'}
    value={draft}
    onChange={setDraft}
  />
}

function KeyedFixture() @{
  const [reverse, setReverse] = useState(false)
  const people = reverse
    ? [
        { id: 'noor', name: 'Noor' },
        { id: 'ada', name: 'Ada' },
      ]
    : [
        { id: 'ada', name: 'Ada' },
        { id: 'noor', name: 'Noor' },
      ]

  <View className="hc-column">
    <Button id="hf-reverse" label="Reverse rows" onPress={() => setReverse((v) => !v)} />
    <Text id="hf-order">{people.map((p) => p.id).join(',')}</Text>
    @for (const person of people; key person.id) {
      <DraftRow id={person.id} name={person.name} />
    }
  </View>
}

function OwnedChild() @{
  useEffect(() => acquireFixtureResource(), [])

  <Text id="hf-owned-child">One owned subscription</Text>
}

function LifecycleFixture() @{
  const [show, setShow] = useState(false)
  const resources = useStore(fixtureResources)

  <View className="hc-column">
    <Button
      id="hf-toggle-child"
      label={show ? 'Unmount child' : 'Mount child'}
      onPress={() => setShow((v) => !v)}
    />
    <Text id="hf-resources">{'Resources: ' + resources}</Text>
    @if (show) {
      <OwnedChild />
    }
  </View>
}

function VisibilityFixture() @{
  const [hide, setHide] = useState(false)
  const [activated, setActivated] = useState(false)

  <View id="hf-visibility" className="hc-column">
    <Button
      id="hf-hide"
      label={hide ? 'Restore visibility' : 'Hide and collapse'}
      onPress={() => setHide((v) => !v)}
    />
    <Text
      id="hf-hidden"
      style={{ visibility: hide ? 'hidden' : 'visible' }}
      className="hc-visibility-block"
    >
      Hidden retains space
    </Text>
    <Text
      id="hf-collapsed"
      className={['hc-visibility-block', hide ? 'hc-visibility-collapsed' : '']}
    >
      Collapsed removes space
    </Text>
    <Button id="hf-tail-action" label="Trailing action" onPress={() => setActivated(true)} />
    <Text id="hf-tail-status">{activated ? 'Tail activated' : 'Tail idle'}</Text>
  </View>
}

function TableFixture() @{
  <View className="hc-table-scroll">
    <Table
      id="hf-table"
      idKey="id"
      data={[
        { id: 'one', name: 'A long first work item', status: 'In progress' },
        { id: 'two', name: 'A second item', status: 'Done' },
      ]}
      columns={[
        { key: 'name', header: 'Work item' },
        { key: 'status', header: 'Status', width: { type: 'pixel', value: 160 } },
      ]}
    />
  </View>
}

function ControlsFixture() @{
  const [checked, setChecked] = useState(false)
  const [draft, setDraft] = useState('')

  <View className="hc-column">
    <Switch id="hf-switch" label="Enabled switch" value={checked} onChange={setChecked} />
    <Text id="hf-switch-state">{checked ? 'Switch: on' : 'Switch: off'}</Text>
    <Switch id="hf-disabled-switch" label="Disabled switch" value={false} isDisabled />
    <TextInput id="hf-input" label="Controlled draft" value={draft} onChange={setDraft} />
    <Text id="hf-echo">{'Draft: ' + (draft || 'empty')}</Text>
    <Button id="hf-reset-input" label="Reset draft" onPress={() => setDraft('')} />
  </View>
}

function AsyncFixture() @{
  const [requests, setRequests] = useState(0)
  const [response, setResponse] = useState('empty')
  const [retired, setRetired] = useState(0)
  const sequence = useRef(0)
  const pending = useRef(new Map<number, () => void>())
  const alive = useRef(true)

  useEffect(
    () => () => {
      alive.current = false
      sequence.current++
      pending.current.clear()
    },
    [],
  )

  const start = () => {
    const id = ++sequence.current

    setRequests(id)
    // Controlled completions establish ordering without network or timer assumptions.
    void new Promise<void>((resolve) => pending.current.set(id, resolve)).then(() => {
      if (!alive.current) {
        return
      }

      if (id === sequence.current) {
        setResponse('request ' + id)
      } else {
        setRetired((n) => n + 1)
      }
    })
  }

  const resolve = (id: number) => {
    pending.current.get(id)?.()
    pending.current.delete(id)
  }

  <View className="hc-column">
    <Text>{'Requests started: ' + requests}</Text>
    <HStack className="hc-actions">
      <Button id="hf-request" label="Start request" onPress={start} />
      <Button
        id="hf-resolve-new"
        label="Resolve latest request"
        onPress={() => resolve(sequence.current)}
      />
      <Button id="hf-resolve-old" label="Resolve first request" onPress={() => resolve(1)} />
    </HStack>
    <Text id="hf-response">{'Response: ' + response}</Text>
    <Text id="hf-retired">{'Retired completions: ' + retired}</Text>
  </View>
}

function OverlayFixture() @{
  const [open, setOpen] = useState(false)
  const [activated, setActivated] = useState(false)

  <View className="hc-column">
    <Button id="hf-open-sheet" label="Open owned sheet" onPress={() => setOpen(true)} />
    <Button id="hf-after-sheet" label="Underlying action" onPress={() => setActivated(true)} />
    <Text id="hf-after-sheet-status">
      {activated ? 'Underlying action delivered' : 'Underlying action idle'}
    </Text>
    <BottomSheet isOpen={open} onOpenChange={setOpen} label="Harness sheet">
      <View className="hc-column hc-sheet">
        <Text id="hf-sheet-content">Owned sheet content</Text>
        <Button id="hf-close-sheet" label="Close owned sheet" onPress={() => setOpen(false)} />
      </View>
    </BottomSheet>
  </View>
}

export function FixtureContent(props: { spec: CaseSpec }) @{
  const spec = props.spec

  @switch (spec.fixture) {
    @case 'counter': {
      <CounterFixture />
    }
    @case 'keys': {
      <KeyedFixture />
    }
    @case 'lifecycle': {
      <LifecycleFixture />
    }
    @case 'visibility': {
      <VisibilityFixture />
    }
    @case 'table': {
      <TableFixture />
    }
    @case 'controls': {
      <ControlsFixture />
    }
    @case 'async': {
      <AsyncFixture />
    }
    @case 'navigation': {
      <NavigationFixture />
    }
    @case 'overlay': {
      <OverlayFixture />
    }
    @case 'demo': {
      const render = spec.demo ? RENDER[spec.demo] : undefined

      @if (render) {
        <View className="hc-retained-fixture">{render()}</View>
      }
    }
  }
}

export function FixtureStage(props: { mounted: MountedFixture; spec: CaseSpec }) @{
  <View id="hf-fixture" className="hc-fixture hc-column">
    <Text id="hf-generation" className="hc-meta">
      {'Fixture generation: ' + props.mounted.generation}
    </Text>
    <FixtureContent spec={props.spec} />
  </View>
}
