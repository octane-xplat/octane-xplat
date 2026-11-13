/** @jsxImportSource @octane-xplat/jsx */
import { useEffect, useRef, useState } from 'octane'
import { Button, HStack, Text, TextInput, View } from '@octane-xplat/ui'
import { LexicalEditor, supported } from '@octane-xplat/lexical'
import type { LexicalEditorHandle } from '@octane-xplat/lexical'
import { storage } from '@octane-xplat/platform'

const INITIAL =
  '<h2>A quieter kind of launch</h2><p>Great tools stay out of your way. This workspace brings the important things together: <strong>your work, your decisions, and the context behind them.</strong></p><h3>What we are shipping</h3><ul><li>A shared place for every project.</li><li>Fast navigation that keeps your place.</li><li>Changes that remain yours, even when a request fails.</li></ul><p>Select a phrase and try the formatting tools. Edit the draft, switch experiences, and come back. You can also reload this page to recover your local draft.</p><blockquote>Confidence comes from what happens after the happy path.</blockquote>'

const DRAFT_KEY = 'showcase-document-draft-v1'
const TITLE_KEY = 'showcase-document-title-v1'

export function DocumentStudio() @{
  const editor = useRef<LexicalEditorHandle | null>(null)
  const [ready, setReady] = useState(!supported)
  const [html, setHtml, getHtml] = useState(() => storage.getString(DRAFT_KEY) ?? INITIAL)
  // The live editor owns its document. Replacements use setHTML explicitly;
  // reflecting each emitted serialization back as an input can loop on web.
  const initialHTML = useRef(html)
  const [title, setTitle, getTitle] = useState(() => storage.getString(TITLE_KEY) ?? 'Launch notes')
  const [saved, setSaved] = useState(INITIAL)
  const [savedTitle, setSavedTitle] = useState('Launch notes')
  const owner = useRef(true)

  useEffect(() => {
    owner.current = true
    return () => {
      owner.current = false
    }
  }, [])

  const [message, setMessage] = useState(
    storage.getString(DRAFT_KEY)
      ? 'Recovered your local draft.'
      : 'Drafts are saved on this device as you type.',
  )

  const [busy, setBusy] = useState(false)
  const [discard, setDiscard] = useState(false)

  useEffect(() => {
    storage.setString(DRAFT_KEY, html)
    storage.setString(TITLE_KEY, title)
  }, [html, title])

  async function save(reject: boolean) {
    const submitted = getHtml()
    const submittedTitle = getTitle()

    setBusy(true)
    setMessage('Saving this revision… You can keep writing.')
    await new Promise((resolve) => setTimeout(resolve, 900))
    if (!owner.current) {
      return
    }

    if (reject) {
      setMessage(
        'Save rejected. Your latest draft is still saved on this device. Try Save revision again.',
      )
    } else {
      setSaved(submitted)
      setSavedTitle(submittedTitle)
      setMessage(
        getHtml() === submitted && getTitle() === submittedTitle
          ? 'Revision saved in this demo session. Local draft is up to date.'
          : 'Submitted revision saved. Your newer edits remain in the local draft.',
      )
    }

    setBusy(false)
  }

  <View className="sc-column">
    <View className="sc-intro sc-column">
      <Text className="sc-eyebrow">02 / DOCUMENT STUDIO</Text>
      <Text className="sc-title">Your draft stays yours.</Text>
      <Text className="sc-lede">
        Select, format, undo. Keep writing while a save is pending. Recover the draft after a
        reload.
      </Text>
    </View>
    <View className="sc-scenario sc-column">
      <Text className="sc-scenario-title">Try this: save, then keep typing.</Text>
      <Text className="sc-muted">
        Reject a revision or edit while it is saving. Neither action replaces your newer draft.
        Reload to recover the local copy.
      </Text>
    </View>
    <View className="sc-document sc-column">
      <TextInput label="Document title" value={title} onChange={setTitle} />
      <HStack className="sc-actions">
        <Button label="Bold" variant="secondary" onPress={() => editor.current?.apply('bold')} />
        <Button
          label="Italic"
          variant="secondary"
          onPress={() => editor.current?.apply('italic')}
        />
        <Button
          label="Heading"
          variant="secondary"
          onPress={() => editor.current?.apply('heading2')}
        />
        <Button
          label="Bullets"
          variant="secondary"
          onPress={() => editor.current?.apply('bulletList')}
        />
        <Button label="Undo" variant="secondary" onPress={() => editor.current?.undo()} />
        <Button label="Redo" variant="secondary" onPress={() => editor.current?.redo()} />
      </HStack>
      @if (supported) {
        <LexicalEditor
          id="studio-editor"
          className="sc-editor"
          value={initialHTML.current}
          onChange={(next) => {
            if (next !== getHtml()) {
              setHtml(next)
            }
          }}
          onReady={() => setReady(true)}
          ref={editor}
          placeholder="Write the next chapter…"
        />
      } @else {
        <Text>Rich document editing is unavailable on this target.</Text>
      }
      <HStack className="sc-toolbar">
        <Text className="sc-muted">
          {html === saved && title === savedTitle
            ? 'Current revision saved'
            : 'Local draft · unpublished changes'}
        </Text>
        <HStack className="sc-actions">
          <Button label="Save revision" isDisabled={busy} pressAction={() => save(false)} />
          <Button
            label="Reject revision"
            variant="secondary"
            isDisabled={busy}
            pressAction={() => save(true)}
          />
          <Button
            label="Reset document"
            variant="secondary"
            isDisabled={busy}
            onPress={() => setDiscard(true)}
          />
        </HStack>
      </HStack>
      @if (discard) {
        <View className="sc-callout sc-column">
          <Text>Replace your draft with the original launch notes?</Text>
          <HStack className="sc-actions">
            <Button
              label="Keep my draft"
              variant="secondary"
              onPress={() => setDiscard(false)}
            />
            <Button
              label="Replace draft"
              variant="secondary"
              onPress={() => {
                editor.current?.setHTML(INITIAL)
                setHtml(INITIAL)
                setTitle('Launch notes')
                setSaved(INITIAL)
                setSavedTitle('Launch notes')
                setDiscard(false)
                setMessage('Original document restored.')
              }}
            />
          </HStack>
        </View>
      }
      <Text id="studio-status" className="sc-status" accessibilityLiveRegion="polite">
        {ready ? message : 'Opening editor…'}
      </Text>
    </View>
    <Text className="sc-footnote">
      Real Lexical editing on web · local draft persistence · simulated revision service
    </Text>
  </View>
}
