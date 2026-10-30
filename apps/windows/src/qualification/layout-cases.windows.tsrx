/** @jsxImportSource @octane-xplat/jsx */
import { createContext, useContext, useEffect, useState } from 'octane'
import { knownFolders, File } from '@nativescript/core'
import { layoutReadout } from './readout.windows'
import { DisplayCases, displayCases, type DisplayCase } from './display-cases.windows'
import { LegacyLayout } from './legacy-layout.windows'
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

import type { LinkProps } from '@octane-xplat/ui'

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

const NavigationContext = createContext<((href: string) => void) | null>(null)

/** Exercise Link's public router-component injection without opening another app. */
function QualificationRouteLink(
	props: Pick<LinkProps, 'href' | 'onPress' | 'children'>,
): unknown @{
	const navigate = useContext(NavigationContext)

	<Pressable
		accessibilityRole="link"
		onPress={() => {
			props.onPress?.()
			navigate?.(props.href)
		}}
	>
		<Text>{props.children}</Text>
	</Pressable>
}

export function Qualification() @{
	const [revision, setRevision] = useState(0)
	const [mounted, setMounted] = useState(true)
	const [scene, setScene] = useState('layout')
	const [layoutCase, setLayoutCase] = useState<(typeof layoutCases)[number]>('text')
	const [disabled, setDisabled] = useState(false)
	const [displayCase, setDisplayCase] = useState<DisplayCase>('card')
	const [avatarImage, setAvatarImage] = useState(false)
	const [bannerDetails, setBannerDetails] = useState(false)
	const [actionCase, setActionCase] = useState('all')
	const [implicitNames, setImplicitNames] = useState(false)
	const [routedLink, setRoutedLink] = useState(false)
	const [destination, setDestination] = useState('/')
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
					case 'display-case':
						if (!displayCases.includes(command.value)) {
							throw new Error('Unknown display case')
						}

						setDisplayCase(command.value)
						break
					case 'avatar-image':
						setAvatarImage(command.value === true)
						break
					case 'banner-details':
						setBannerDetails(command.value === true)
						break
					case 'action-case':
						if (!['all', 'button', 'pressable', 'link'].includes(command.value)) {
							throw new Error('Unknown action case')
						}

						setActionCase(command.value)
						break
					case 'implicit-names':
						setImplicitNames(command.value === true)
						break
					case 'routed-link':
						setRoutedLink(command.value === true)
						setDestination('/')
						break
					case 'scene':
						if (['layout', 'actions', 'display', 'legacy-layout'].includes(command.value)) {
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

	// The Page is not a flex parent; percentages need an explicit root width.

	<VStack width="100%" gap={2} padding={4} style={{ flexGrow: 1 }}>
		<Text id="core20-status">{`Core20 ${scene} case=${layoutCase} revision=${revision} mounted=${mounted} activations=${activations}`}</Text>
		@if (scene === 'actions') {
			<Text id="core20-destination">{`Destination ${destination}`}</Text>
		}
		@if (mounted) {
			@if (scene === 'display' || scene === 'legacy-layout') {
				@try {
					@if (scene === 'display') {
						<DisplayCases
							caseName={displayCase}
							revision={revision}
							disabled={disabled}
							image={avatarImage}
							details={bannerDetails}
							onActivate={activate}
						/>
					} @else {
						<LegacyLayout revision={revision} />
					}
				} @catch (error) {
					record('render-error', { message: String(error) })
					<Text>{`Display render error: ${String(error)}`}</Text>
				}
			} @else if (scene === 'layout') {
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
								style={{ fontSize: 14, lineHeight: '20px', flexShrink: 1 }}
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
				@try {
					<>
						@if (
							actionCase === 'all' ||
							actionCase === 'button'
						) {
							<Button
								id="core20-button"
								isDisabled={disabled}
								accessibilityLabel={
									implicitNames ? undefined : `Button ${revision}`
								}
								clickAction={() => activate('button')}
							>
								{`Button content ${revision}`}
							</Button>
						}
						@if (
							actionCase === 'all' ||
							actionCase === 'pressable'
						) {
							<Pressable
								id="core20-pressable"
								disabled={disabled}
								accessibilityLabel={
									implicitNames ? undefined : `Pressable ${revision}`
								}
								onPress={() => activate('pressable')}
							>
								<Text>{`Pressable content ${revision}`}</Text>
							</Pressable>
						}
						@if (
							actionCase === 'all' ||
							actionCase === 'link'
						) {
							<NavigationContext
								value={(href: string) => {
									setDestination(href)
									record('navigation', { href })
								}}
							>
								<Link
									id="core20-link"
									as={routedLink ? QualificationRouteLink : undefined}
									href={routedLink ? '/details' : ''}
									onPress={() => activate('link')}
								>{`Link ${revision}`}</Link>
							</NavigationContext>
						}
					</>
				} @catch (error) {
					record('render-error', {
						message:
							error instanceof Error ? (error.stack ?? error.message) : String(error),
					})

					<Text>{`Action render error: ${String(error)}`}</Text>
				}
			}
		}
	</VStack>
}
