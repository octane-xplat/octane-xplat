import { useEffect, useState } from 'octane'
import { Pressable, Text, View } from '@octane-xplat/ui'
import { storage } from '@octane-xplat/platform'
import { createAudioPlayer, type AudioPlayer } from '@octane-xplat/audio'
import { createHostedAuth, type HostedAuth } from '@octane-xplat/auth'
import { requestStream } from '@octane-xplat/network'
import type { ProbeContext } from '../../scripts/probe/context'

const origin = 'http://fixture.invalid'

function ListeningSettings(props: {
	player: AudioPlayer
	auth: HostedAuth
	append(): Promise<void>
}) @{
	const [audio, setAudio] = useState(props.player.snapshot())
	const [session, setSession] = useState('signed out')
	const [stream, setStream] = useState('idle')
	useEffect(() => props.player.subscribe(setAudio), [])

	const read = async () => {
		const result = await requestStream(`${origin}/records`)
		const reader = result.body.getReader()
		let text = ''
		try {
			while (!text.includes('\n')) {
				const chunk = await reader.read()
				if (chunk.done) {
					throw new Error('Stream ended before first record')
				}

				text += String.fromCharCode(...chunk.value)
			}

			if (JSON.parse(text.split('\n')[0]!).ready !== true) {
				throw new Error('Wrong fixture record')
			}

			setStream('first record')
		} finally {
			await reader.cancel()
			reader.releaseLock()
		}
	}

	<View className="p-4 gap-2">
		<Text>Listening and settings fixture</Text>
		<Pressable id="listening.play" onPress={() => props.player.play()}>
			<Text>Play</Text>
		</Pressable>
		<Pressable id="listening.pause" onPress={() => props.player.pause()}>
			<Text>Pause</Text>
		</Pressable>
		<Pressable id="listening.speed" onPress={() => props.player.setPlaybackRate(1.5)}>
			<Text>Speed 1.5</Text>
		</Pressable>
		<Pressable id="listening.gain" onPress={() => props.player.setVolume(0.5)}>
			<Text>Volume 50 percent</Text>
		</Pressable>
		<Pressable id="listening.append" onPress={props.append}>
			<Text>Append completed track</Text>
		</Pressable>
		<Text id="listening.settings">{`${audio.state} rate=${audio.playbackRate} gain=${audio.volume}`}</Text>
		<Pressable id="listening.stream" onPress={() => read().catch(() => setStream('error'))}>
			<Text>Read stream</Text>
		</Pressable>
		<Text id="listening.stream-state">{stream}</Text>
		<Pressable
			id="listening.sign-in"
			onPress={async () => {
				const result = await props.auth.signIn()
				setSession(
					result.status === 'success'
						? 'signed in'
						: result.status === 'error'
							? `error: ${result.message}`
							: result.status,
				)
			}}
		>
			<Text>Synthetic sign in</Text>
		</Pressable>
		<Text id="listening.session">{session}</Text>
	</View>
}

export async function run(ctx: ProbeContext) {
	const player = createAudioPlayer()
	const storageKey = `readiness-credentials-${Date.now()}`
	const config = {
		apiOrigin: 'https://synthetic.example.test',
		storageKey,
		authSession: {
			supported: true,
			open: async () => ({ type: 'success' as const, url: 'readiness://callback?state=synthetic' }),
		},
		flow: {
			begin: async () => ({
				url: 'https://synthetic.example.test/sign-in',
				callbackScheme: 'readiness',
				state: 'synthetic',
			}),
			complete: async () => ({
				token: 'synthetic-access',
				sessionToken: 'synthetic-session',
				expiresAt: Date.now() + 60000,
			}),
		},
	}

	const auth = createHostedAuth(config)
	ctx.assert('native hosted auth crypto available', auth.supported, true)
	let cleared = false
	ctx.onCleanup(async () => {
		player.dispose()
		if (!cleared) {
			await auth.signOut()
		}
	})

	await player.setMuted(true)
	const first = { id: 'packed-one', source: `${origin}/one.wav` }
	const second = { id: 'packed-two', source: `${origin}/two.wav` }
	await player.setQueue([first], 0, { complete: false })
	await ctx.mount(ListeningSettings, {
		player,
		auth,
		append: () => player.updateQueue([first, second], { complete: true }),
	})

	await ctx.waitFor(() => ctx.find('listening.play'), { timeout: 5000, interval: 20 })
	await ctx.press('listening.speed')
	await ctx.press('listening.gain')
	await ctx.waitFor(() => ctx.inspect('listening.settings').text.includes('rate=1.5 gain=0.5'), {
		timeout: 5000,
		interval: 20,
	})

	ctx.assert(
		'settings re-render from native subscription',
		ctx.inspect('listening.settings').text.includes('rate=1.5 gain=0.5'),
		true,
	)

	await ctx.press('listening.play')
	await ctx.waitFor(() => player.snapshot().currentTime > 0.2, { timeout: 10000, interval: 20 })
	const position = player.snapshot().currentTime
	await ctx.press('listening.append')
	ctx.assert(
		'packed preserving queue position',
		player.snapshot().currentTime >= position - 0.15,
		true,
	)

	await ctx.press('listening.stream')
	await ctx.waitFor(() => ctx.inspect('listening.stream-state').text === 'first record', {
		timeout: 5000,
		interval: 20,
	})

	const marker = await requestStream(`${origin}/state`)
	ctx.assert(
		'packed first record before server completion',
		((await marker.json()) as { finished: boolean }).finished,
		false,
	)

	await ctx.press('listening.sign-in')
	await ctx.waitFor(() => ctx.inspect('listening.session').text === 'signed in', {
		timeout: 5000,
		interval: 20,
	})

	ctx.assert(
		'native secure credential restoration',
		await createHostedAuth(config).restore(),
		'authenticated',
	)

	await auth.signOut()
	cleared = true
	ctx.assert(
		'native secure credential deletion',
		await createHostedAuth(config).restore(),
		'unauthenticated',
	)

	const accountA = `readiness-progress-A-${Date.now()}`
	const accountB = `readiness-progress-B-${Date.now()}`
	try {
		storage.setString(accountA, '42')
		storage.setString(accountB, '7')
		ctx.assert('native preference flush', storage.flush(), true)
		storage.remove(accountA)
		ctx.assert('isolated preference removal', storage.getString(accountB), '7')
	} finally {
		storage.remove(accountA)
		storage.remove(accountB)
		storage.flush()
	}

	await ctx.waitFor(() => player.snapshot().track?.id === second.id, {
		timeout: 10000,
		interval: 20,
	})

	ctx.assert('packed native queue advances', player.snapshot().track?.id, second.id)
	ctx.record(
		'boundaries',
		'Tarball services and shared UI; handler dispatch, silent WAV, synthetic ceremony. No physical input/output, real provider, process restart, or background acceptance.',
	)
}
