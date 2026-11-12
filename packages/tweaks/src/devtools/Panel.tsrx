/** @jsxImportSource @octane-xplat/jsx */
// Tweaks devtools panel — the UI of the retired standalone tweaks desktop app
// ported onto the plugin API: transport is the App's devtools connection, and
// the server picker is a tweaks-backend target selector (the hub already
// scopes the panel to one dev server). Keep-on-top moved to the devtools
// desktop Shell header.
import { useEffect, useLazyRef, useRef, useState } from 'octane'
import type { CSSProperties } from 'octane/jsx-runtime'
import {
  HStack,
  NumberInput,
  Popover,
  Pressable,
  ScrollableArea,
  Selector,
  Slider,
  Switch,
  Text,
  TextInput,
  Tooltip,
  View,
  VStack,
  type TextInputHandle,
} from '@octane-xplat/ui'

import { Icon, type IconifyIcon } from '@octane-xplat/icons'
import { useStore } from '@octane-xplat/ui/data'
import type { DevtoolsPanelPluginProps } from '@octane-xplat/devtools/panel'
import type { PanelEntry, PanelStyleEntry } from '../protocol.ts'
import { displayValue, HEX_COLOR_RE, TweaksPanelModel } from './model'

import { usePanelContent } from './use-panel-content'
import * as heroicons from './icons'
import './styles'

// Pressable preserves toggle/disclosure accessibility state on both hosts.
// The shared tooltip supplies AppKit pointer hints as well as web focus hints.
function Action(props: {
  id?: string
  label: string
  icon?: IconifyIcon
  iconOnly?: boolean
  active?: boolean
  expanded?: boolean
  disabled?: boolean
  primary?: boolean
  className?: string
  anchor?: { current: any }
  onPress: () => void
}) @{
  return (
    <Tooltip
      className={['panel-action', props.iconOnly && 'panel-action--icon', props.className]}
      content={<Text>{props.label}</Text>}
      trigger={
        <Pressable
          id={props.id}
          ref={props.anchor}
          disabled={props.disabled}
          className={[
            'panel-button',
            props.active && 'panel-button--active',
            props.primary && 'panel-button--primary',
            props.disabled && 'panel-button--disabled',
          ]}
          accessibilityLabel={props.label}
          accessibilityState={{
            pressed: props.active,
            expanded: props.expanded,
            disabled: props.disabled,
          }}
          web={{ title: props.label, 'aria-expanded': props.expanded }}
          onPress={props.onPress}
        >
          <HStack className="panel-button-content">
            {props.icon ? (
              <Icon
                icon={props.icon}
                size={16}
                color={
                  props.disabled
                    ? '#98a2b3'
                    : props.primary
                      ? '#ffffff'
                      : props.active
                        ? '#2563eb'
                        : '#667085'
                }
              />
            ) : null}
            {!props.iconOnly ? <Text className="panel-button-label">{props.label}</Text> : null}
          </HStack>
        </Pressable>
      }
    />
  )
}

function TweakRow(props: {
  model: TweaksPanelModel
  entry: PanelEntry
  disabled: boolean
}) @{
  useStore(props.model.tick$)

  const model = props.model
  const e = props.entry
  const current = displayValue(e)
  const [invalidColor, setInvalidColor] = useState<string | null>(null)
  const shown = invalidColor ?? String(current)
  const validColor = e.input.type !== 'color' || HEX_COLOR_RE.test(shown)
  const fieldClass = [
    'panel-field',
    e.dirty && 'panel-field--changed',
    !validColor && 'panel-field--invalid',
  ]

  return (
    <VStack id={`row-${e.id}`} className="panel-entry">
      <HStack className="panel-row">
        <Text className="panel-property-name" maxLines={1}>
          {e.name}
        </Text>
        <HStack
          id={`control-${e.id}`}
          className={[
            'panel-control',
            e.input.type === 'boolean' && 'panel-control--boolean',
            e.dirty && 'panel-control--changed',
            !validColor && 'panel-control--invalid',
          ]}
        >
          {e.input.type === 'number' && e.input.min !== undefined && e.input.max !== undefined ? (
            <>
              <Slider
                className="panel-slider"
                value={Number(current)}
                minValue={e.input.min}
                maxValue={e.input.max}
                step={e.input.step}
                disabled={props.disabled}
                onValueChange={(v: number | [number, number]) => {
                  if (typeof v === 'number') {
                    model.set(e.id, v)
                  }
                }}
              />
              <NumberInput
                className={[fieldClass, 'panel-number-exact']}
                value={Number(current)}
                min={e.input.min}
                max={e.input.max}
                step={e.input.step}
                isDisabled={props.disabled}
                label={`${e.name} value`}
                isLabelHidden
                onValueChange={(v: number | null) => {
                  if (v !== null) {
                    model.set(e.id, v)
                  }
                }}
              />
            </>
          ) : e.input.type === 'number' ? (
            <NumberInput
              className={fieldClass}
              value={Number(current)}
              step={e.input.step}
              isDisabled={props.disabled}
              label={e.name}
              isLabelHidden
              onValueChange={(v: number | null) => {
                if (v !== null) {
                  model.set(e.id, v)
                }
              }}
            />
          ) : e.input.type === 'boolean' ? (
            <>
              <Switch
                value={Boolean(current)}
                onChange={(v: boolean) => model.set(e.id, v)}
                isDisabled={props.disabled}
                accessibilityLabel={e.name}
              />
              <Text className={['panel-value', e.dirty && 'panel-value--changed']}>
                {String(current)}
              </Text>
            </>
          ) : e.input.type === 'select' ? (
            <Selector
              className={fieldClass}
              value={String(current)}
              options={e.input.options.map((v) => ({ value: String(v) }))}
              isDisabled={props.disabled}
              label={e.name}
              isLabelHidden
              onValueChange={(v: string | null) => {
                // Select presents strings, but numeric options stay numbers on the wire.
                if (e.input.type !== 'select' || v === null) {
                  return
                }

                const option = e.input.options.find((o) => String(o) === v)

                if (option !== undefined) {
                  model.set(e.id, option)
                }
              }}
            />
          ) : (
            <>
              {e.input.type === 'color' ? (
                <View
                  id={`swatch-${e.id}`}
                  className="panel-color-swatch"
                  style={{ backgroundColor: validColor ? shown : 'transparent' }}
                />
              ) : null}
              <TextInput
                className={fieldClass}
                value={shown}
                isDisabled={props.disabled}
                accessibilityLabel={e.name}
                onChange={(v: string) => {
                  setInvalidColor(e.input.type === 'color' && !HEX_COLOR_RE.test(v) ? v : null)
                  model.set(e.id, v)
                }}
              />
            </>
          )}
        </HStack>
        {e.dirty ? (
          <Action
            id={`revert-${e.id}`}
            label={`Revert ${e.name}`}
            icon={heroicons.arrowUturnLeft}
            iconOnly
            disabled={props.disabled}
            onPress={() => {
              setInvalidColor(null)
              model.revert(e.id)
            }}
          />
        ) : (
          <View className="panel-action-slot" />
        )}
      </HStack>
      {!validColor ? <Text className="panel-error">invalid hex</Text> : null}
      {!e.writable ? (
        <Text className="panel-note">Live only — {e.reason ?? 'not a literal'}</Text>
      ) : null}
    </VStack>
  )
}

function TweakGroup(props: {
  model: TweaksPanelModel
  group: string
  entries: PanelEntry[]
  disabled: boolean
}) @{
  const [open, setOpen] = useState(true)
  const dirty = props.entries.filter((e) => e.dirty).length

  return (
    <VStack className="panel-tweak-group">
      <HStack className="panel-section-heading">
        <Action
          label={props.group}
          icon={open ? heroicons.chevronDown : heroicons.chevronRight}
          expanded={open}
          className="panel-disclosure"
          onPress={() => setOpen(!open)}
        />
        {!open && dirty ? <Text className="panel-note">{`${dirty} modified`}</Text> : null}
      </HStack>
      {open
        ? props.entries.map((entry) => (
            <TweakRow key={entry.id} model={props.model} entry={entry} disabled={props.disabled} />
          ))
        : null}
    </VStack>
  )
}

// A small set of literal defaults, augmented by names already mounted in the
// app. Unknown/custom names remain available; no Panda token schema is assumed.
const PROPERTY_DEFAULTS: Record<string, string> = {
  alignItems: 'center',
  backgroundColor: 'transparent',
  borderColor: '#000000',
  borderRadius: '0',
  borderWidth: '0',
  color: '#000000',
  display: 'flex',
  flexDirection: 'column',
  flexGrow: '1',
  flexShrink: '1',
  fontSize: '16px',
  fontWeight: '400',
  gap: '0',
  height: 'auto',
  justifyContent: 'center',
  lineHeight: '20px',
  margin: '0',
  marginBottom: '0',
  marginLeft: '0',
  marginRight: '0',
  marginTop: '0',
  maxWidth: 'none',
  minHeight: '0',
  opacity: '1',
  overflow: 'hidden',
  padding: '0',
  paddingBottom: '0',
  paddingLeft: '0',
  paddingRight: '0',
  paddingTop: '0',
  width: 'auto',
}

function AddProperty(props: {
  model: TweaksPanelModel
  site: PanelStyleEntry
  disabled: boolean
  onAdded: (path: string) => void
}) @{
  const anchor = useRef<any>(null)
  const finalFocus = useRef<any>(null)
  const [open, setOpen] = useState(false)

  return (
    <>
      <Action
        id={`style-add-${props.site.id}`}
        label="Add property"
        icon={heroicons.plus}
        anchor={anchor}
        disabled={props.disabled}
        expanded={open}
        onPress={() => {
          finalFocus.current = anchor.current
          setOpen(!open)
        }}
      />
      {open ? (
        <Popover
          anchor={anchor}
          open
          placement="bottom"
          onDismiss={() => setOpen(false)}
          finalFocusRef={finalFocus}
          className="panel-property-popover"
        >
          <PropertyChooser
            model={props.model}
            site={props.site}
            disabled={props.disabled}
            onChoose={(name, value) => {
              if (props.model.styleAdd(props.site, name, value)) {
                // Successful selection hands focus to the new row rather
                // than restoring the add button when the picker closes.
                finalFocus.current = { focus: () => props.onAdded(name) }
                props.onAdded(name)
                setOpen(false)
              }
            }}
          />
        </Popover>
      ) : null}
    </>
  )
}

function PropertyChooser(props: {
  model: TweaksPanelModel
  site: PanelStyleEntry
  disabled: boolean
  onChoose: (name: string, value: string) => void
}) @{
  const input = useRef<TextInputHandle | null>(null)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [custom, setCustom] = useState<string | null>(null)
  const [customValue, setCustomValue] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => input.current?.focus(), 0)

    return () => clearTimeout(timer)
  }, [])

  const model = props.model
  const defaults = { ...PROPERTY_DEFAULTS }

  for (const site of model.styles) {
    for (const prop of site.properties) {
      if (prop.value !== null && model.styleAddNameValid(props.site, prop.path.join('.'))) {
        defaults[prop.path.join('.')] ??= String(prop.value)
      }
    }
  }

  const existing = new Set([
    ...props.site.properties.map((p) => p.path.join('.')),
    ...model.styleAddedPaths(props.site),
  ])

  const names = Object.keys(defaults)
    .filter((n) => !existing.has(n) && n.toLowerCase().includes(query.trim().toLowerCase()))
    .sort()

  const typed = query.trim()
  const canCreate =
    typed &&
    !existing.has(typed) &&
    model.styleAddNameValid(props.site, typed) &&
    !names.includes(typed)

  const options = [...names, ...(canCreate ? [typed] : [])]
  const choose = (name: string) => {
    if (props.disabled) {
      return
    }

    if (Object.hasOwn(defaults, name)) {
      props.onChoose(name, defaults[name])
    } else {
      setCustom(name)
      setCustomValue('')
    }
  }

  return (
    <VStack className="panel-property-menu">
      <TextInput
        ref={input}
        id={`style-add-search-${props.site.id}`}
        className="panel-field"
        value={query}
        placeholder="Filter properties…"
        accessibilityLabel="Find a property to add"
        isDisabled={props.disabled}
        onChange={(v: string) => {
          setQuery(v)
          setActive(0)
          setCustom(null)
        }}
        onSubmit={() => {
          if (options[active]) {
            choose(options[active])
          }
        }}
        web={{
          role: 'combobox',
          'aria-expanded': true,
          'aria-controls': 'property-options',
          'aria-activedescendant': options[active] ? `property-option-${active}` : undefined,
          onkeydown: (event: KeyboardEvent) => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault()
              setActive(
                Math.max(
                  0,
                  Math.min(options.length - 1, active + (event.key === 'ArrowDown' ? 1 : -1)),
                ),
              )
            }
          },
        }}
      />
      {custom ? (
        <VStack className="panel-custom-property">
          <Text className="panel-code">{custom}</Text>
          <TextInput
            id={`style-add-value-${props.site.id}`}
            className="panel-field"
            accessibilityLabel={`Value for ${custom}`}
            placeholder="Value"
            value={customValue}
            isDisabled={props.disabled}
            onChange={setCustomValue}
            onSubmit={() => {
              if (customValue.trim()) {
                props.onChoose(custom, customValue)
              }
            }}
          />
          <Action
            label={`Add ${custom}`}
            icon={heroicons.plus}
            disabled={props.disabled || !customValue.trim()}
            onPress={() => props.onChoose(custom, customValue)}
          />
        </VStack>
      ) : (
        <ScrollableArea className="panel-property-options">
          <VStack id="property-options" web={{ role: 'listbox' }}>
            {options.length === 0 ? (
              <Text className="panel-note">
                {existing.has(typed) ? 'Property already exists.' : 'No matching properties.'}
              </Text>
            ) : (
              options.map((name, i) => (
                <Pressable
                  key={name}
                  id={`property-option-${i}`}
                  className={[
                    'panel-property-option',
                    i === active && 'panel-property-option--active',
                  ]}
                  disabled={props.disabled}
                  web={{ role: 'option' }}
                  accessibilityLabel={Object.hasOwn(defaults, name) ? name : `Add ${name}…`}
                  accessibilityState={{ selected: i === active }}
                  onPress={() => choose(name)}
                >
                  <HStack className="panel-option-content">
                    <Text className="panel-code">{name}</Text>
                    <Text className="panel-note">
                      {Object.hasOwn(defaults, name) ? defaults[name] : 'Custom…'}
                    </Text>
                  </HStack>
                </Pressable>
              ))
            )}
          </VStack>
        </ScrollableArea>
      )}
    </VStack>
  )
}

function StylePropRow(props: {
  model: TweaksPanelModel
  site: PanelStyleEntry
  path: string[]
  disabled: boolean
  focus: boolean
  bind: (key: string, input: TextInputHandle | null) => void
}) @{
  const input = useRef<TextInputHandle | null>(null)
  const model = props.model
  const site = props.site
  const key = props.path.join('.')
  const prop = site.properties.find((p) => p.path.join('.') === key)
  const added = !prop
  const value = model.stylePropValue(site, props.path)
  const deleted = model.stylePropDeleted(site, props.path)
  const dynamic = !!prop && !prop.editable
  const changed = key in site.draft.set && (added || site.draft.set[key] !== prop?.value)
  const editable = site.writable && !props.disabled && !dynamic && !deleted

  useEffect(() => {
    const timer = setTimeout(() => props.bind(`${site.id}:${key}`, input.current), 0)

    return () => {
      clearTimeout(timer)
      props.bind(`${site.id}:${key}`, null)
    }
  }, [])

  useEffect(() => {
    if (props.focus) {
      // Wait for the picker to close and the new field handle to mount.
      const timer = setTimeout(() => {
        if (input.current) {
          input.current.focus()
        }
      }, 0)

      return () => clearTimeout(timer)
    }
  }, [props.focus])

  return (
    <HStack className="panel-row">
      <Text
        id={`style-path-${site.id}-${key}`}
        className={['panel-property-name', deleted && 'panel-property-name--deleted']}
        maxLines={1}
      >
        {key}
      </Text>
      <HStack
        className={[
          'panel-control',
          changed && !deleted && 'panel-control--changed',
          !editable && 'panel-control--disabled',
        ]}
      >
        <TextInput
          ref={input}
          id={`style-input-${site.id}-${key}`}
          className={['panel-field', changed && !deleted && 'panel-field--changed']}
          value={dynamic ? 'dynamic' : value == null ? '' : String(value)}
          isDisabled={!editable}
          accessibilityLabel={`${key}${dynamic ? ' (dynamic, read only)' : deleted ? ' (deleted)' : added ? ' (added)' : ''}`}
          onChange={(v: string) => model.styleSet(site.id, props.path, v)}
          web={{
            onkeydown: (event: KeyboardEvent) => {
              if (!editable) {
                return
              }

              if ((event.metaKey || event.ctrlKey) && event.key === 'Backspace') {
                event.preventDefault()
                model.styleDelete(site.id, props.path)
              }

              if (
                typeof prop?.value === 'number' &&
                (event.key === 'ArrowUp' || event.key === 'ArrowDown')
              ) {
                event.preventDefault()
                model.styleSet(
                  site.id,
                  props.path,
                  String(
                    Number(value) +
                      (event.key === 'ArrowUp' ? 1 : -1) *
                        (event.shiftKey ? 10 : event.altKey ? 0.1 : 1),
                  ),
                )
              }
            },
          }}
        />
      </HStack>
      {dynamic || !site.writable ? (
        <View className="panel-action-slot" />
      ) : deleted || changed ? (
        <Action
          id={`style-undo-${site.id}-${key}`}
          label={`Restore ${key}`}
          icon={heroicons.arrowUturnLeft}
          iconOnly
          disabled={props.disabled}
          onPress={() => model.styleRestore(site.id, props.path)}
        />
      ) : (
        <Action
          id={`style-delete-${site.id}-${key}`}
          label={`Delete ${key}`}
          icon={heroicons.trash}
          iconOnly
          disabled={props.disabled}
          onPress={() => model.styleDelete(site.id, props.path)}
        />
      )}
    </HStack>
  )
}

function StyleSite(props: {
  model: TweaksPanelModel
  site: PanelStyleEntry
  query: string
  disabled: boolean
  bind: (key: string, input: TextInputHandle | null) => void
}) @{
  const [open, setOpen] = useState(true)
  const [focusPath, setFocusPath] = useState<string | null>(null)
  const model = props.model
  const site = props.site
  const paths = [
    ...site.properties.map((p) => p.path),
    ...model.styleAddedPaths(site).map((p) => p.split('.')),
  ]

  const visible = paths.filter((p) =>
    p.join('.').toLowerCase().includes(props.query.trim().toLowerCase()),
  )

  // Filtering reveals matches without overwriting the user's disclosure choice.
  const expanded = open || !!props.query.trim()

  return (
    <VStack id={`stylesite-${site.id}`} className="panel-style-site">
      <View className="panel-rule" />
      <HStack className="panel-section-heading">
        <Action
          id={`style-toggle-${site.id}`}
          label={site.label}
          icon={expanded ? heroicons.chevronDown : heroicons.chevronRight}
          expanded={expanded}
          className="panel-disclosure"
          onPress={() => setOpen(!expanded)}
        />
        <Text className="panel-note">{`${site.kind} :${site.line}`}</Text>
        {site.dirty ? (
          <Action
            id={`style-revert-${site.id}`}
            label={`Revert ${site.label}`}
            icon={heroicons.arrowUturnLeft}
            iconOnly
            disabled={props.disabled}
            onPress={() => model.revert(site.id)}
          />
        ) : null}
      </HStack>
      {expanded ? (
        <>
          {site.preview === 'unavailable' ? (
            <Text className="panel-note">Preview unavailable</Text>
          ) : null}
          {!site.writable ? <Text className="panel-note">{site.reason ?? 'Read only'}</Text> : null}
          {visible.map((path) => (
            <StylePropRow
              key={path.join('.')}
              model={props.model}
              site={site}
              path={path}
              disabled={props.disabled}
              focus={focusPath === path.join('.')}
              bind={props.bind}
            />
          ))}
          {visible.length === 0 && props.query.trim() ? (
            <Text className="panel-note">No matching properties.</Text>
          ) : null}
          {site.writable ? (
            <AddProperty
              model={props.model}
              site={site}
              disabled={props.disabled}
              onAdded={setFocusPath}
            />
          ) : null}
        </>
      ) : null}
    </VStack>
  )
}

function PanelHeader(props: { model: TweaksPanelModel }) @{
  useStore(props.model.tick$)

  const model = props.model
  const snap = model.snapshot()
  const connected = snap.status === 'connected'
  const disabled = !connected || snap.saving
  const current = model.backends.find((b) => b.targetId === model.targetId)

  return (
    <VStack className="panel-header">
      <HStack className="panel-toolbar">
        <View className="panel-server">
          {model.backends.length === 0 ? (
            <Text className="panel-note">No tweaks backend</Text>
          ) : model.backends.length === 1 ? (
            <Text className="panel-code" maxLines={1}>
              {model.targetLabel(model.backends[0])}
            </Text>
          ) : (
            <Selector
              id="target"
              className="panel-server-select"
              value={current ? model.targetLabel(current) : ''}
              options={model.backends.map((b) => ({ value: model.targetLabel(b) }))}
              accessibilityLabel="Tweaks backend"
              isDisabled={snap.saving}
              onValueChange={(label: string | null) => {
                const backend = model.backends.find((b) => model.targetLabel(b) === label)

                if (backend) {
                  model.select(backend.targetId)
                }
              }}
            />
          )}
        </View>
        <Action
          id="pick"
          label={snap.picking ? 'Cancel pick' : 'Pick element'}
          icon={heroicons.cursorArrowRays}
          iconOnly
          active={snap.picking}
          disabled={disabled || !snap.clients.some((c) => c.label === 'web')}
          onPress={() => model.pick(!snap.picking)}
        />
      </HStack>
      <HStack className="panel-status-line">
        <Text id="status" className={['panel-note', !connected && 'panel-status--offline']}>
          {connected
            ? 'Connected'
            : snap.status === 'connecting'
              ? 'Connecting…'
              : snap.status === 'idle'
                ? 'No backend'
                : 'Disconnected'}
        </Text>
        <Text id="clients" className="panel-note">
          {snap.clients.map((c) => c.label).join(', ')}
        </Text>
        <View className="panel-spacer" />
        <Text className="panel-note">{`${model.backends.length} backend${model.backends.length === 1 ? '' : 's'}`}</Text>
      </HStack>
    </VStack>
  )
}

function PanelContent(props: { model: TweaksPanelModel }) @{
  const [contentHeight, setContentHeight] = useState(0)
  const content = usePanelContent(contentHeight, setContentHeight)

  useStore(props.model.tick$)

  const model = props.model
  const [query, setQuery] = useState('')
  const inputs = useRef(new Map<string, TextInputHandle>())
  const snap = model.snapshot()
  const connected = snap.status === 'connected'
  const disabled = !connected || snap.saving
  const groups = model.groupedEntries()
  const styleGroups = model.groupedStyles()
  const bind = (key: string, input: TextInputHandle | null) => {
    if (input) {
      inputs.current.set(key, input)
    } else {
      inputs.current.delete(key)
    }
  }

  return (
    <ScrollableArea
      id="panel-scroll"
      className="panel-scroll"
      ref={content.viewportRef}
      style={
        { '--panel-content-height': `${contentHeight}px` } as CSSProperties &
          Record<`--${string}`, string>
      }
    >
      <VStack
        id="panel-content"
        className="panel-content"
        ref={content.ref}
        style={{ minHeight: contentHeight }}
      >
        {model.backends.length === 0 ? (
          <Text id="backends.empty" className="panel-note">
            No tweaks backend — run the app with `xplat dev`
          </Text>
        ) : null}
        {connected && snap.entries.length === 0 ? (
          <Text id="entries.empty" className="panel-note">
            No tweaks on screen. Open a screen that calls useTweak.
          </Text>
        ) : null}
        {groups.length ? (
          <VStack className="panel-section">
            <Text className="panel-heading">Tweaks</Text>
            {groups.map((g) => (
              <TweakGroup
                key={g.group}
                model={props.model}
                group={g.group}
                entries={g.entries}
                disabled={disabled}
              />
            ))}
          </VStack>
        ) : null}
        {snap.styles.length ? (
          <VStack id="styles.section" className="panel-section">
            <HStack className="panel-section-heading">
              <Text className="panel-heading">Styles</Text>
              <View className="panel-spacer" />
              <Text className="panel-note">{`${snap.styles.length} sites`}</Text>
            </HStack>
            <TextInput
              id="style-filter"
              className={['panel-field', 'panel-property-filter']}
              value={query}
              placeholder="Filter properties"
              accessibilityLabel="Filter properties"
              onChange={setQuery}
              onSubmit={() => {
                // The map can hold a handle whose row already unmounted —
                // focus() on it throws, so take the first live handle.
                for (const [key, handle] of inputs.current) {
                  try {
                    handle.focus()
                    break
                  } catch {
                    inputs.current.delete(key)
                  }
                }
              }}
            />
            {model.pickFilter ? (
              <HStack className="panel-filter-state">
                <Text
                  id="pick.filter"
                  className="panel-note"
                >{`${model.pickFilter.length} picked sites`}</Text>
                <View className="panel-spacer" />
                <Action
                  id="pick.clear"
                  label="Show all style sites"
                  icon={heroicons.xMark}
                  iconOnly
                  onPress={() => model.clearPickFilter()}
                />
              </HStack>
            ) : null}
            {snap.picking ? (
              <Text className="panel-note">
                Click an element in the web app to pick its styles.
              </Text>
            ) : null}
            {styleGroups.map((g) => (
              <VStack key={g.file} className="panel-file-group">
                <Text className="panel-source" maxLines={1}>
                  {g.file}
                </Text>
                {g.sites.map((site) => (
                  <StyleSite
                    key={site.id}
                    model={props.model}
                    site={site}
                    query={query}
                    disabled={disabled}
                    bind={bind}
                  />
                ))}
              </VStack>
            ))}
          </VStack>
        ) : null}
      </VStack>
    </ScrollableArea>
  )
}

function PanelFooter(props: { model: TweaksPanelModel }) @{
  useStore(props.model.tick$)

  const model = props.model
  const snap = model.snapshot()
  const dirty = model.dirtyCount()
  const connected = snap.status === 'connected'
  const disabled = !connected || snap.saving

  return (
    <VStack className="panel-footer" accessibilityLiveRegion="polite">
      <HStack className="panel-status-line">
        <Text
          id="dirty-count"
          className={['panel-note', dirty > 0 && 'panel-unsaved']}
        >{`${dirty} unsaved${snap.unmountedDirty.length ? ` (${snap.unmountedDirty.length} not on screen)` : ''}`}</Text>
        <View className="panel-spacer" />
        <Text className="panel-note">{connected ? '● Connected' : '● Offline'}</Text>
      </HStack>
      {snap.saving ? (
        <Text className="panel-note">Saving…</Text>
      ) : snap.saveResult ? (
        <Text id="save-result" className={snap.saveResult.ok ? 'panel-note' : 'panel-error'}>
          {snap.saveResult.ok
            ? `Saved ${snap.saveResult.saved.length} file(s)`
            : snap.saveResult.errors
                .map((e) => `${e.file ? `${e.file}: ` : ''}${e.message}`)
                .join('; ')}
        </Text>
      ) : null}
      <HStack className="panel-footer-actions">
        <Action
          id="revert-all"
          label="Revert all"
          icon={heroicons.arrowPath}
          disabled={disabled || dirty === 0}
          onPress={() => model.revertAll()}
        />
        <View className="panel-spacer" />
        <Action
          id="save"
          label="Save changes to source"
          icon={heroicons.arrowDownTray}
          iconOnly
          primary
          disabled={disabled || dirty === 0}
          onPress={() => model.save()}
        />
      </HStack>
    </VStack>
  )
}

export function TweaksPanel(props: DevtoolsPanelPluginProps) @{
  const modelRef = useLazyRef(() => new TweaksPanelModel(props.connection))
  const model = modelRef.current

  useEffect(() => {
    model.start()
    return () => model.dispose()
  }, [])

  <VStack id="tweaks-panel" className="tweaks-panel">
    <PanelHeader model={model} />
    <View className="panel-rule" />
    <PanelContent model={model} />
    <View className="panel-rule" />
    <PanelFooter model={model} />
  </VStack>
}
