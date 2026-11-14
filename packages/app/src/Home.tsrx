/** @jsxImportSource @octane-xplat/jsx/dom */
import { useState, useEffect, useRef } from 'octane'
import {
  View,
  HStack,
  Text,
  Pressable,
  NavLink,
  TextInput,
  TextArea,
  ScrollableArea,
  Image,
  BottomSheet,
  useAnimation,
  useColorScheme,
  setThemePreference,
} from '@octane-xplat/ui'

import { openOverlay } from './platform/overlay'
import { SELF_DRIVE } from './platform/selfdrive'
import { storage } from '@octane-xplat/platform'
import { bambooCardClass } from './bamboo-styles'

const INITIAL = [
  { id: 'a', label: 'Alpha' },
  { id: 'b', label: 'Beta' },
  { id: 'c', label: 'Gamma' },
  { id: 'd', label: 'Delta' },
  { id: 'e', label: 'Epsilon' },
]

// Identity-stable — an inline arrow would change every Home render and force
// every recycled cell root to re-render on each native itemLoading refire.
const renderItem = (item: any) => <Text className="cell">{item.label}</Text>
const renderEmpty = () => <Text>No items</Text>
const ROWS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
// 1×1 red PNG — deterministic, no network. data: URIs decode via
// ImageSource.fromBase64 on native; the web leaf just hands it to <img>.
const PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

/** Home tab — the original harness surface (counter, list, input, probes). */
export function Home() @{
  const [count, setCount] = useState(0)
  // dark = manual override ?? system scheme (useColorScheme seam —
  // systemAppearanceChanged on native, prefers-color-scheme on web).
  const scheme = useColorScheme()
  const [override, setOverride] = useState<string | null>(() => {
    const saved = storage.getString('theme-preference')

    return saved === 'light' || saved === 'dark' ? saved : null
  })

  const dark = (override ?? scheme) === 'dark'

  // Push the app-level override into the theme store so imperative roots
  // (overlay/popover/toast/sheet/modal) render with the same scheme.
  useEffect(() => {
    setThemePreference((override ?? 'system') as 'light' | 'dark' | 'system')
  }, [override])

  const darkMark = useRef(0)
  const [text, setText] = useState('')
  const [bio, setBio] = useState('')
  const [items, setItems] = useState(INITIAL)
  const [modal, setModal] = useState(false)
  const x = useAnimation(0)

  console.log('[harness] Home render, items=' + items.length + ' scheme=' + scheme)

  // [self] timers drive the sink on a clock (shuffle → type → dark flip)
  // so commit seams exercise without taps. Web gates them behind
  // ?selfdrive — presenting the sink defaults to a quiet screen; native
  // keeps them always-on (demosweep/theme probes rely on the sequence).
  useEffect(() => {
    if (!SELF_DRIVE) {
      return
    }

    console.log('[harness] Home mounted')

    const t1 = setTimeout(() => {
      console.log('[self] shuffle')
      setItems([...items].reverse())
    }, 1000)

    const t2 = setTimeout(() => {
      console.log('[self] setText')
      setText('hello')
    }, 2000)

    const t3 = setTimeout(() => {
      console.log('[self] dark on')
      darkMark.current = Date.now()
      setOverride('dark')
    }, 3000)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [])

  useEffect(() => {
    // Runs post-commit: setState -> render -> native prop application ->
    // effect. darkMark is the setState timestamp.
    if (darkMark.current) {
      console.log('[probe] dark setState->commit ' + (Date.now() - darkMark.current) + 'ms')
    }
  }, [dark])

  <View className={['vx-app', 'sink-home', 'flex-1', dark ? 'dark ns-dark' : '']}>
    <HStack className="home-header justify-between items-center shrink-0">
      <View className="home-heading">
        <Text className="home-eyebrow">OCTANE XPLAT / PLAYGROUND</Text>
        <Text className="home-title">Kitchen sink</Text>
        <Text className="home-intro">Small controls. Real interactions. Try them out.</Text>
      </View>
      <HStack className="gap-3 items-center">
        <Pressable
          id="scheme-toggle"
          onPress={() => {
            const next = dark ? 'light' : 'dark'

            storage.setString('theme-preference', next)
            setOverride(next)
          }}
          className="btn btn-secondary"
        >
          <Text>{dark ? 'Light' : 'Dark'}</Text>
        </Pressable>
      </HStack>
    </HStack>

    {/* The five control sections outgrow a phone pane — keep them in
		    their own scroller (the flex-1 region) so intrinsic controls
		    never squash and the Items list keeps real estate below. */}
    <View className="home-workspace flex-1 min-h-0">
      <ScrollableArea className="home-actions flex-1 min-h-0">
        <View className="home-controls">
          <View className="sink-section home-card home-counter">
            {/* Keep diagnostic utilities separate from decorative card styles. */}
            <View id="bamboo-card" className={['vx-row', bambooCardClass]}>
              <Text className="home-card-title">Reactivity</Text>
              <Text className="home-card-description">A little state, updated instantly.</Text>
              <Text className="home-count">{'Count: ' + count}</Text>
              <HStack className="gap-3 flex-wrap items-center">
                <Pressable
                  id="a11y-btn"
                  accessible={true}
                  accessibilityLabel="Increment counter"
                  accessibilityRole="button"
                  onPress={() => setCount(count + 1)}
                  className="btn bg-primary"
                >
                  <Text className="text-onprimary">Increment</Text>
                </Pressable>
              </HStack>
            </View>
          </View>

          {/* Navigation + overlay seams (Exp 9): platform modules resolve the
				    imperative call per target. */}
          <View className="sink-section home-card">
            <Text className="home-card-title">Navigation and overlays</Text>
            <Text className="home-card-description">
              Open a page, a floating panel, or a sheet.
            </Text>
            <HStack className="gap-3 flex-wrap items-center">
              <NavLink to="/detail" search={{ from: 'home' }} className="btn bg-primary">
                <Text className="text-onprimary">Detail →</Text>
              </NavLink>
              {/* +modal route: manifest-declared presentation — NavLink pushes
						    it like any route, the leaf presents it modally. */}
              <NavLink to="/about" className="btn btn-secondary">
                <Text>About ⤴</Text>
              </NavLink>
              <Pressable id="overlay-btn" onPress={openOverlay} className="btn btn-secondary">
                <Text>Overlay</Text>
              </Pressable>
              <Pressable
                id="modal-btn"
                onPress={() => setModal(true)}
                className="btn btn-secondary"
              >
                <Text>Modal</Text>
              </Pressable>
              {/* Link seam: web renders a real anchor; native is a Pressable
						    over navigate(). */}
              <NavLink to="/detail" search={{ from: 'link' }} className="chip">
                <Text>Link →</Text>
              </NavLink>
            </HStack>
          </View>

          {/* BottomSheet seam (the shared in-window modal surface — the platform
				    showModal widgets moved to ui/ios + ui/android): declarative
				    open → shade + panel on this same root. */}
          <BottomSheet isOpen={modal} label="Modal sheet" onOpenChange={(o) => setModal(o)}>
            <View className="modal-panel">
              <Text>Modal content</Text>
              <Pressable
                id="modal-close"
                onPress={() => setModal(false)}
                className="btn btn-secondary"
              >
                <Text>Close modal</Text>
              </Pressable>
            </View>
          </BottomSheet>

          <View className="sink-section home-card">
            <Text className="home-card-title">Gestures and animation</Text>
            <Text className="home-card-description">
              Drag the surface. Set the blue square in motion.
            </Text>
            {/* Shared gesture ownership preserves nested button taps. */}
            <View
              id="pan-box"
              className="panbox"
              style={{ padding: 16 }}
              onPan={(e) => {
                const sample = e.phase === 'finish' ? e.terminal.sample : e.sample

                console.log(
                  '[probe] pan translation=' +
                    sample.translation.x +
                    ',' +
                    sample.translation.y +
                    ' phase=' +
                    e.phase,
                )
              }}
            >
              <Text className="text-sm text-muted">Pan or swipe inside this box</Text>
              <Pressable onPress={openOverlay} className="btn btn-secondary">
                <Text>Pan / swipe box</Text>
              </Pressable>
            </View>
            <HStack className="gap-4 items-center">
              {/* Animation seam (Exp 13): imperative controller writes the view's
						    translateX per rAF frame — no re-render, no worklets. */}
              <View id="anim-box" ref={x.ref} className="anim-box" />
              {/* Image seam: <image> native / <img> web; data: URI decodes
						    synchronously via ImageSource.fromBase64Sync. */}
              <Image id="img" src={PIXEL} alt="pixel" style={{ width: 24, height: 24 }} />
              <Pressable
                id="anim-btn"
                onPress={() => {
                  x.to(80, { duration: 300 })
                  setTimeout(() => x.spring(0), 700)
                }}
                className="btn btn-secondary"
              >
                <Text>Animate</Text>
              </Pressable>
            </HStack>
          </View>

          <View className="sink-section home-card">
            <Text className="home-card-title">Reordering and scrolling</Text>
            <Text className="home-card-description">The same items, in a different order.</Text>
            {/* @for keyed reorder on a plain layout parent — native driver
					    insert/move path (experiment bc3f77c4). */}
            <HStack className="gap-2 flex-wrap">
              @for (const item of items; key item.id) {
                <Text className="chip">{item.id}</Text>
              }
            </HStack>
            <HStack className="gap-3 flex-wrap">
              <Pressable
                onPress={() => {
                  const next = [...items].reverse()

                  console.log('[harness] shuffle -> ' + next.map((i) => i.id).join(','))
                  setItems(next)
                }}
                className="btn btn-secondary"
              >
                <Text>Shuffle</Text>
              </Pressable>
              <Pressable
                id="clear-btn"
                onPress={() => setItems(items.length ? [] : [...INITIAL])}
                className="btn btn-secondary"
              >
                <Text>{items.length ? 'Clear' : 'Restore'}</Text>
              </Pressable>
            </HStack>
            {/* ScrollableArea seam: NS <scrollview> hosts one child — the leaf wraps
					    children in a column layout. Probe reads scrollTop back.
					    Universal @for keys default to position when omitted (upstream
					    branch universal-for-optional-key); `key n` kept for clarity. */}
            <ScrollableArea id="scroll-box" className="scrollbox" style={{ height: 96 }}>
              @for (const n of ROWS; key n) {
                <Text className="scrollrow">{'HStack ' + n}</Text>
              }
            </ScrollableArea>
          </View>

          <View className="sink-section home-card home-inputs">
            <Text className="home-card-title">Inputs</Text>
            <Text className="home-card-description">
              Write something and see it reflected below.
            </Text>
            <TextInput
              id="probe-input"
              accessibilityLabel="Single-line input"
              value={text}
              onChange={(v) => {
                console.log('[probe] onChange ' + v)
                setText(v)
                storage.setString('draft', v)
              }}
              placeholder="Type here"
            />
            <Text className="text-sm text-muted">{'Typed: ' + text}</Text>
            {/* TextArea seam: <textarea>/<textview>; autoGrow re-fits height to
					    content on web (scrollHeight, capped at maxRows) while native's
					    TextView grows on its own — the leaf maps rows/maxRows to
					    min/maxHeight dips at the widget's measured line height. */}
            <TextArea
              id="probe-textarea"
              accessibilityLabel="Multiline composer"
              value={bio}
              onChange={(v) => {
                console.log('[probe] textareaChange ' + JSON.stringify(v))
                setBio(v)
              }}
              placeholder="Multiline composer"
              autoGrow
              maxRows={4}
            />
            <TextArea
              id="probe-textarea-uncontrolled"
              accessibilityLabel="Uncontrolled composer"
              placeholder="Uncontrolled composer"
              autoGrow
              rows={2}
              maxRows={4}
            />
            <Text className="text-sm text-muted multiline-echo">{'Bio: ' + bio}</Text>
            {/* Cascade-layer probe — app.css contests these two views across
					    layers; the harness asserts which rule actually applied. */}
            <Text id="layer-probe" className="xplat-layer-probe">
              {'Layer order'}
            </Text>
            <View
              id="layer-unlayered-probe"
              className="xplat-layer-unlayered"
              style={{ width: 8, height: 8 }}
            />
          </View>
        </View>
      </ScrollableArea>

      <View className="sink-section home-card home-items flex-1">
        <HStack className="justify-between items-center">
          <Text className="home-card-title">Items</Text>
          <Text className="home-item-count">{items.length + ' total'}</Text>
        </HStack>
        <Text className="home-card-description">
          A live view of the collection. Try Shuffle or Clear.
        </Text>
        {/* Shared surface has no List — compose ScrollableArea + map here;
			    the recycling platform widgets live in ui/ios + ui/android. */}
        <ScrollableArea id="main-list" className="list flex-1">
          {items.length > 0 ? items.map(renderItem) : renderEmpty()}
        </ScrollableArea>
      </View>
    </View>
  </View>
}
