/** @jsxImportSource @octane-xplat/jsx */
import 'octane/signals'
import { useEffect, useLinkedState, useRef, useState } from 'octane'
import { Button, HStack, SearchInput, Table, Text, TextInput, View } from '@octane-xplat/ui'

import { useQuery$, useStore } from '@octane-xplat/ui/data'
import { workspace, workspaceView, type WorkItem } from './workspace'

function WorkDetail(props: {
  item?: WorkItem
  busy: boolean
  message: string
  save(title: string, reject: boolean): Promise<void>
  close(): void
}) @{
  const item = props.item
  const [draft, setDraft] = useLinkedState(item?.id, () => item?.title ?? '')
  const [discard, setDiscard] = useLinkedState(item?.id, () => false)
  const dirty = item != null && draft !== item.title

  @if (item) {
    <View className="sc-column sc-detail">
      <Text className="sc-eyebrow">{item.id + ' / ' + item.project}</Text>
      <Text className="sc-heading">Edit the work, keep the context.</Text>
      <Text id="work-detail-status" className="sc-status" accessibilityLiveRegion="polite">
        {props.message}
      </Text>
      <TextInput
        label="Work item title"
        value={draft}
        onChange={setDraft}
        isDisabled={props.busy}
      />
      <Text className="sc-muted">
        Try rejecting a save. The list rolls back and this draft stays intact.
      </Text>
      <HStack className="sc-actions">
        <Button
          label="Save changes"
          isDisabled={!draft.trim() || !dirty || props.busy}
          pressAction={() => props.save(draft.trim(), false)}
        />
        <Button
          label="Reject this save"
          variant="secondary"
          isDisabled={!draft.trim() || !dirty || props.busy}
          pressAction={() => props.save(draft.trim(), true)}
        />
        <Button
          label="Back to work"
          variant="secondary"
          isDisabled={props.busy}
          onPress={() => (dirty ? setDiscard(true) : props.close())}
        />
      </HStack>
      @if (discard) {
        <View className="sc-callout sc-column">
          <Text>Discard this unsaved draft?</Text>
          <HStack className="sc-actions">
            <Button
              label="Keep editing"
              variant="secondary"
              onPress={() => setDiscard(false)}
            />
            <Button label="Discard draft" variant="secondary" onPress={props.close} />
          </HStack>
        </View>
      }
    </View>
  }
}

function WorkItems(props: {
  items: WorkItem[]
  refreshing: boolean
  refreshFailed: boolean
  refresh(fail: boolean): Promise<void>
}) @{
  const view = useStore(workspaceView)
  const [busy, setBusy] = useState(false)
  const owner = useRef(true)

  useEffect(() => {
    owner.current = true
    return () => {
      owner.current = false
    }
  }, [])

  const [message, setMessage] = useState(
    'Select a few items, then try an update that gets rejected.',
  )

  const filtered = props.items
    .filter(
      (item) =>
        (view.status === 'All' || item.status === view.status) &&
        `${item.id} ${item.title} ${item.project} ${item.owner}`
          .toLowerCase()
          .includes(view.search.toLowerCase()),
    )
    .sort((a, b) => (view.descending ? b.id.localeCompare(a.id) : a.id.localeCompare(b.id)))

  const pages = Math.max(1, Math.ceil(filtered.length / 12))
  const page = Math.min(view.page, pages - 1)
  const visible = filtered.slice(page * 12, (page + 1) * 12)
  const detail = props.items.find((item) => item.id === view.detail)
  const toggle = (id: string) =>
    workspaceView.update((state) => ({
      ...state,
      selected: state.selected.includes(id)
        ? state.selected.filter((key) => key !== id)
        : [...state.selected, id],
    }))

  const save = async (
    ids: string[],
    patch: Partial<Pick<WorkItem, 'title' | 'status'>>,
    reject: boolean,
  ) => {
    if (busy) {
      return
    }

    setBusy(true)
    setMessage('Updating immediately. Waiting for confirmation…')
    try {
      await workspace.update(ids, patch, reject)
      if (!owner.current) {
        return
      }

      setMessage(
        `${ids.length} ${ids.length === 1 ? 'item' : 'items'} confirmed. Every view has the same values.`,
      )
    } catch (error) {
      if (!owner.current) {
        return
      }

      setMessage(
        error instanceof Error ? error.message : 'Could not save. Your draft is still available.',
      )
    } finally {
      if (owner.current) {
        setBusy(false)
      }
    }
  }

  if (detail)
    return (
      <WorkDetail
        item={detail}
        busy={busy}
        message={message}
        save={async (title, reject) => {
          if (detail) {
            await save([detail.id], { title }, reject)
          }
        }}
        close={() => workspaceView.update((s) => ({ ...s, detail: null }))}
      />
    )

  <View className="sc-column">
    <View className="sc-scenario sc-column">
      <Text className="sc-scenario-title">Try breaking the happy path.</Text>
      <Text className="sc-muted">
        Select rows and reject a bulk update. Open an item, edit its title, then reject that save.
        Your selection, filters, and draft survive.
      </Text>
      <HStack className="sc-actions">
        <Button
          label={props.refreshing ? 'Refreshing…' : 'Refresh data'}
          variant="secondary"
          isDisabled={props.refreshing || busy}
          pressAction={() => props.refresh(false)}
        />
        <Button
          label="Fail next refresh"
          variant="secondary"
          isDisabled={props.refreshing || busy}
          pressAction={() => props.refresh(true)}
        />
        <Button
          label="Reset demo"
          variant="secondary"
          isDisabled={busy || props.refreshing}
          onPress={() => {
            workspace.reset()
            workspaceView.set({
              search: '',
              status: 'All',
              page: 0,
              descending: false,
              selected: [],
              detail: null,
            })

            setMessage('Demo reset. Start anywhere.')
          }}
        />
      </HStack>
    </View>
    <HStack className="sc-toolbar">
      <SearchInput
        label="Search work"
        value={view.search}
        onChange={(search) => workspaceView.update((s) => ({ ...s, search, page: 0 }))}
        onClear={() => workspaceView.update((s) => ({ ...s, search: '', page: 0 }))}
        placeholder="Search title, project, or owner"
      />
      <HStack className="sc-actions">
        @for (const status of ['All', 'In progress', 'In review', 'Done']; key status) {
          <Button
            label={status}
            variant={view.status === status ? 'primary' : 'secondary'}
            size="sm"
            onPress={() => workspaceView.update((s) => ({ ...s, status, page: 0 }))}
          />
        }
      </HStack>
    </HStack>
    <HStack className="sc-toolbar">
      <Text className="sc-muted">
        {filtered.length + ' of 240 items · ' + view.selected.length + ' selected'}
      </Text>
      <HStack className="sc-actions">
        <Button
          label="Select this page"
          variant="secondary"
          size="sm"
          onPress={() =>
            workspaceView.update((s) => ({
              ...s,
              selected: [...new Set([...s.selected, ...visible.map((item) => item.id)])],
            }))
          }
        />
        <Button
          label="Clear selection"
          variant="secondary"
          size="sm"
          isDisabled={!view.selected.length}
          onPress={() => workspaceView.update((s) => ({ ...s, selected: [] }))}
        />
        <Button
          label={view.descending ? 'Newest first ↓' : 'Oldest first ↑'}
          variant="secondary"
          size="sm"
          onPress={() => workspaceView.update((s) => ({ ...s, descending: !s.descending }))}
        />
      </HStack>
    </HStack>
    @if (props.refreshFailed) {
      <Text className="sc-error" accessibilityLiveRegion="polite">
        Refresh failed. Previous results are still available. Try Refresh data again.
      </Text>
    }
    <View className="sc-table-frame">
      <Table
        id="workspace-table"
        data={visible}
        idKey="id"
        hasHover
        density="spacious"
        columns={[
          {
            key: 'select',
            header: 'Select',
            width: { type: 'pixel', value: 76 },
            renderCell: (item) => (
              <Button
                label={view.selected.includes(item.id) ? '✓' : '+'}
                accessibilityLabel={'Select ' + item.id}
                variant="secondary"
                size="sm"
                onPress={() => toggle(item.id)}
              />
            ),
          },
          {
            key: 'title',
            header: 'Work item',
            renderCell: (item) => (
              <Button
                label={item.title}
                variant="secondary"
                size="sm"
                onPress={() => workspaceView.update((s) => ({ ...s, detail: item.id }))}
              />
            ),
          },
          { key: 'project', header: 'Project', width: { type: 'pixel', value: 90 } },
          { key: 'owner', header: 'Owner', width: { type: 'pixel', value: 80 } },
          { key: 'status', header: 'Status', width: { type: 'pixel', value: 140 } },
        ]}
      />
    </View>
    <HStack className="sc-toolbar">
      <HStack className="sc-actions">
        <Button
          label="Previous page"
          variant="secondary"
          size="sm"
          isDisabled={page === 0}
          onPress={() => workspaceView.update((s) => ({ ...s, page: page - 1 }))}
        />
        <Text>{'Page ' + (page + 1) + ' of ' + pages}</Text>
        <Button
          label="Next page"
          variant="secondary"
          size="sm"
          isDisabled={page + 1 >= pages}
          onPress={() => workspaceView.update((s) => ({ ...s, page: page + 1 }))}
        />
      </HStack>
      <HStack className="sc-actions">
        <Button
          label="Mark selected done"
          isDisabled={!view.selected.length || busy}
          pressAction={() => save(view.selected, { status: 'Done' }, false)}
        />
        <Button
          label="Reject bulk update"
          variant="secondary"
          isDisabled={!view.selected.length || busy}
          pressAction={() => save(view.selected, { status: 'Done' }, true)}
        />
      </HStack>
    </HStack>
    @if (!detail) {
      <Text id="workspace-status" className="sc-status" accessibilityLiveRegion="polite">
        {message}
      </Text>
    }
    <Text className="sc-footnote">
      240 seeded records · simulated transport · real shared query cache and optimistic transactions
    </Text>
  </View>
}

export function DataWorkspace() @{
  const reader = useQuery$(workspace.queries, workspace.records, 'all')

  <View className="sc-column">
    <View className="sc-intro sc-column">
      <Text className="sc-eyebrow">01 / DATA WORKSPACE</Text>
      <Text className="sc-title">Updates you can trust.</Text>
      <Text className="sc-lede">
        Edit one record or a whole selection. Make the request fail. Keep your place.
      </Text>
    </View>
    @if (reader) {
      @try {
        const items = reader.data$.get()

        <WorkItems
          items={items}
          refreshing={reader.state$.get().fetchStatus === 'fetching'}
          refreshFailed={!!reader.state$.get().error}
          refresh={async (fail) => {
            if (fail) {
              workspace.rejectNextRead()
            }

            await reader.refetch().catch(() => {})
          }}
        />
      } @pending {
        <Text>Opening the workspace…</Text>
      } @catch (error) {
        <Button label="Retry opening workspace" pressAction={() => reader.refetch()} />
      }
    }
  </View>
}
