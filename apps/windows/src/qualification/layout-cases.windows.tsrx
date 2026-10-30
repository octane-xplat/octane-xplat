/** @jsxImportSource @octane-xplat/jsx */
import { useEffect, useState } from 'octane'
import { knownFolders, File } from '@nativescript/core'
import { layoutReadout } from './readout.windows'
import { PARITY as viewFixtures } from '../../../../packages/ui/src/components/layout/View.parity'
import {
	Text,
	View,
	Stack,
	VStack,
	HStack,
	Center,
	Section,
	Button,
	Pressable,
	Link,
} from '@octane-xplat/ui'

declare const __WINDOWS_QUALIFICATION_SOURCE__: { commit: string; dirty: boolean }

const shrinkFixture = viewFixtures.find((fixture) => fixture.name === 'view-shrinking-row')
if (!shrinkFixture) {
	throw new Error('The maintained shrinking-row fixture is missing')
}

const ShrinkingRow = shrinkFixture.renderer

// This private host accepts only fixture selection and props. Input activation
// comes from the external OS/UIA driver, never from dispatched callbacks.
const directory = knownFolders.documents().path
const commandPath = directory + '\\core20-command.json'
const layoutCases = [
	'text',
	'vstack',
	'hstack',
	'stack',
	'view',
	'center',
	'section',
	'shrink',
] as const

const bootId = Date.now().toString(36)
const record = (event: string, data: Record<string, unknown> = {}) =>
	console.log('[windows-core20] ' + JSON.stringify({ bootId, event, ...data }))

export function Qualification() @{
	const [revision, setRevision] = useState(0)
	const [mounted, setMounted] = useState(true)
	const [scene, setScene] = useState('layout')
	const [layoutCase, setLayoutCase] = useState<(typeof layoutCases)[number]>('text')
	const [disabled, setDisabled] = useState(false)
	const [activations, setActivations, getActivations] = useState(0)
	const activate = (source: string) => {
		const count = getActivations() + 1
		setActivations(count)
		record('activation', { source, count })
	}

	useEffect(() => {
		record('ready', { commandPath, source: __WINDOWS_QUALIFICATION_SOURCE__ })
		let sequence = ''
		let reading = false
		let disposed = false
		const timer = setInterval(async () => {
			if (reading) {
				return
			}

			reading = true
			try {
				if (!File.exists(commandPath)) {
					return
				}

				const command = JSON.parse(await File.fromPath(commandPath).readText())
				if (disposed || typeof command.sequence !== 'string' || command.sequence === sequence) {
					return
				}

				sequence = command.sequence
				switch (command.action) {
					case 'case': {
						const next = layoutCases.find((name) => name === command.value)
						if (!next) {
							throw new Error('Unknown layout case')
						}

						setLayoutCase(next)
						break
					}
					case 'snapshot':
						record('layout', { sequence, nodes: layoutReadout() })
						break
					case 'revision':
						setRevision(command.value === 1 ? 1 : 0)
						break
					case 'mounted':
						setMounted(command.value === true)
						break
					case 'disabled':
						setDisabled(command.value === true)
						break
					case 'scene':
						if (command.value === 'layout' || command.value === 'actions') {
							setScene(command.value)
						}

						break
					default:
						throw new Error('Unknown qualification command')
				}

				record('command', { sequence, action: command.action, value: command.value })
			} catch (error) {
				record('command-error', { message: String(error) })
			} finally {
				reading = false
			}
		}, 100)

		return () => {
			disposed = true
			clearInterval(timer)
		}
	}, [])

	<VStack gap={2} padding={4} style={{ flexGrow: 1 }}>
		<Text id="core20-status">{`Core20 ${scene} case=${layoutCase} revision=${revision} mounted=${mounted} activations=${activations}`}</Text>
		@if (mounted) {
			@if (scene === 'layout') {
				<View className="core20-viewport">
					@if (layoutCase === 'vstack') {
						<VStack
							id="core20-vstack"
							accessible
							accessibilityLabel={`Vertical ${revision}`}
							gap={2}
							padding={2}
						>
							<Text>Vertical first</Text>
							<Text>Vertical second</Text>
						</VStack>
					}
					@if (layoutCase === 'hstack') {
						<HStack
							id="core20-hstack"
							wrap="wrap"
							accessible
							accessibilityLabel={`Horizontal ${revision}`}
							gap={2}
							padding={2}
						>
							<Text>Horizontal first</Text>
							<Text>Horizontal second</Text>
						</HStack>
					}
					@if (layoutCase === 'stack') {
						<Stack
							id="core20-stack"
							wrap="wrap"
							accessible
							accessibilityLabel={`Stack ${revision}`}
							direction="horizontal"
							gap={2}
							padding={2}
						>
							<Text>Stack first</Text>
							<Text>Stack second</Text>
						</Stack>
					}
					@if (layoutCase === 'view') {
						<View
							id="core20-view"
							accessible
							accessibilityLabel={`View ${revision}`}
							style={{
								display: 'flex',
								width: '100%',
								maxWidth: 200,
								height: 60,
								paddingLeft: 17,
								paddingTop: 7,
								paddingRight: 13,
								paddingBottom: 11,
							}}
						>
							<Text style={{ height: 10 }}>Padded child</Text>
						</View>
					}
					@if (layoutCase === 'center') {
						<Center
							id="core20-center"
							accessible
							accessibilityLabel={`Center ${revision}`}
							style={{ width: '100%', maxWidth: 200, height: 60 }}
						>
							<Text style={{ width: 80, height: 20 }}>Centered child</Text>
						</Center>
					}
					@if (layoutCase === 'section') {
						<Section
							id="core20-section"
							accessible
							accessibilityLabel={`Section ${revision}`}
							padding={2}
						>
							<Text>Section child</Text>
						</Section>
					}
					@if (layoutCase === 'text') {
						<View
							id="core20-text-container"
							style={{
								display: 'flex',
								width: '100%',
								maxWidth: revision === 1 ? 180 : 220,
							}}
						>
							<Text
								id="core20-text"
								style={{ fontSize: 14, lineHeight: 20, flexShrink: 1 }}
							>
								{revision === 1
									? 'Updated typography should wrap within the available space.'
									: 'Shared typography should wrap within the available space.'}
							</Text>
						</View>
					}
					@if (layoutCase === 'shrink') {
						<ShrinkingRow />
					}
				</View>
			} @else {
				<>
					<Button
						isDisabled={disabled}
						accessibilityLabel={`Button ${revision}`}
						clickAction={() => activate('button')}
					>
						Button content
					</Button>
					<Pressable
						disabled={disabled}
						accessibilityLabel={`Pressable ${revision}`}
						onPress={() => activate('pressable')}
					>
						<Text>Pressable content</Text>
					</Pressable>
					<Link href="" onPress={() => activate('link')}>{`Link ${revision}`}</Link>
				</>
			}
		}
	</VStack>
}
