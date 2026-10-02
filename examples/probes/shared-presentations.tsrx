import { useState } from 'octane'
import { AlertDialog, BottomSheet, Dialog, DialogHeader, Lightbox, Pressable, Screen, Text, ToastViewport, View, showToast, useImperativeDialog, useImperativeAlertDialog, useLightbox, useToast, openBottomSheet } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'

const media = [{ src: '', alt: 'Replace this source with an image from your app' }]
function SheetContent(props: { params: { title: string }; close: (result?: string) => void }) {
	return <View><Text>{props.params.title}</Text><Pressable onPress={() => props.close('done')}><Text>Done</Text></Pressable></View>
}

function Actions() {
	const [surface, setSurface] = useState<string | null>(null)
	const dialog = useImperativeDialog()
	const alertDialog = useImperativeAlertDialog()
	const lightbox = useLightbox({ media })
	const toast = useToast()
	return <View>
		<Pressable id="present-dialog" onPress={() => setSurface('dialog')}><Text>Dialog</Text></Pressable>
		<Pressable onPress={() => setSurface('alert')}><Text>Alert decision</Text></Pressable>
		<Pressable onPress={() => setSurface('sheet')}><Text>Bottom sheet</Text></Pressable>
		<Pressable onPress={() => setSurface('lightbox')}><Text>Lightbox (supply an image source)</Text></Pressable>
		<Pressable onPress={() => dialog.show(<Text>Imperative content</Text>)}><Text>Imperative dialog</Text></Pressable>
		<Pressable onPress={() => alertDialog.show({ title: 'Continue?', actionLabel: 'Continue', onAction: () => alertDialog.hide() })}><Text>Imperative alert</Text></Pressable>
		<Pressable onPress={() => lightbox.open()}><Text>Imperative lightbox</Text></Pressable>
		<Pressable onPress={() => { void openBottomSheet(SheetContent, { title: 'Choose' }, { label: 'Choose', snapPoints: ['25%', '60%'] }).catch(error => toast({ type: 'error', body: error.message })) }}><Text>Imperative sheet</Text></Pressable>
		<Pressable onPress={() => toast({ body: 'Saved', autoHideDuration: 2000 })}><Text>Viewport toast</Text></Pressable>
		<Pressable onPress={() => showToast({ body: 'Fallback toast', position: 'topEnd' })}><Text>Fallback toast</Text></Pressable>
		<Text id="presentation-status">{surface ?? 'closed'}</Text>
		<Dialog isOpen={surface === 'dialog'} onOpenChange={() => setSurface(null)}>
			<DialogHeader title="Dialog" onOpenChange={() => setSurface(null)} />
			<Text>Escape or an outside click closes this information dialog.</Text>
		</Dialog>
		<AlertDialog isOpen={surface === 'alert'} onOpenChange={() => setSurface(null)} title="Continue?" actionLabel="Continue" onAction={() => setSurface(null)} />
		<BottomSheet isOpen={surface === 'sheet'} onOpenChange={() => setSurface(null)} label="Choose" snapPoints={['25%', '60%']}>
			<Text>Drag the handle between stops.</Text>
			<Pressable onPress={() => setSurface(null)}><Text>Done</Text></Pressable>
		</BottomSheet>
		<Lightbox isOpen={surface === 'lightbox'} onOpenChange={() => setSurface(null)} media={media} />
		{dialog.element}{alertDialog.element}{lightbox.element}
	</View>
}

export default function SharedPresentations() {
	return <Screen><ToastViewport position="bottomEnd" maxVisible={3}><Actions /></ToastViewport></Screen>
}

export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('present-dialog'))
	ctx.assert('initial controlled state', ctx.inspect('presentation-status').text, 'closed')
	await ctx.press('present-dialog')
	await ctx.waitFor(() => ctx.inspect('presentation-status').text === 'dialog')
	ctx.assert('handler opens controlled dialog', ctx.inspect('presentation-status').text, 'dialog')
	ctx.record('evidence', 'Handler dispatch only; AppKit presentation/focus/lifecycle checks live in apps/macos/test/verify-overlays.mjs')
}
