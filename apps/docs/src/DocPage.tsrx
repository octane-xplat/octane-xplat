import { createContext, useContext } from 'octane'
import { View, Text, Pressable, Image } from '@octane-xplat/ui'
import { DOCS, type DocPage } from './docs'
import { MdDoc } from './MdDoc.tsrx'
import orbitUser from './assets/orbit-user.webp'
import orbitSafari from './assets/orbit-safari.webp'
import orbitFirefox from './assets/orbit-firefox.webp'
import orbitChrome from './assets/orbit-chrome.webp'
import orbitLinux from './assets/orbit-linux.webp'
import orbitApple from './assets/orbit-apple.webp'
import orbitAndroid from './assets/orbit-android.webp'
import orbitMicrosoft from './assets/orbit-microsoft.webp'
import orbitMacos from './assets/orbit-macos.webp'

const ORBIT_BADGES = [
	orbitSafari,
	orbitFirefox,
	orbitChrome,
	orbitLinux,
	orbitApple,
	orbitAndroid,
	orbitMicrosoft,
	orbitMacos,
]

export const DocNavigation = createContext({ leaving: false, selectDoc: (_slug: string) => {} })
export const DocNavigationProvider: any = DocNavigation
export function DocPageContent(props: { doc: DocPage }) @{
	const doc = props.doc
	const { leaving, selectDoc } = useContext(DocNavigation)
	const nextDoc = DOCS[DOCS.findIndex((candidate) => candidate.slug === doc.slug) + 1]

	<View key={doc.slug} className={leaving ? 'doc-page leaving' : 'doc-page'}>
		{doc.slug === DOCS[0].slug && (
			<View className="orbit" accessible={false}>
				<View className="orbit-ring">
					{ORBIT_BADGES.map((src) => (
						<View key={src} className="orbit-pos">
							<View className="orbit-spin">
								<View className="orbit-tilt">
									<Image className="orbit-badge" src={src} alt="" />
								</View>
							</View>
						</View>
					))}
				</View>
				<Image className="orbit-user" src={orbitUser} alt="" />
			</View>
		)}
		<MdDoc
			demo={doc.slug === 'goal-counter' || doc.slug === 'packing-list' ? doc.slug : undefined}
			md={doc.md}
			dir={doc.dir}
			showPageActions={doc.slug !== 'README'}
			showHomeActions={doc.slug === 'README'}
			agentPrompt={
				doc.slug === 'README'
					? 'Set up Octane Xplat for me. Fetch https://octane-xplat.goddardai.org/llms-full.txt and follow the “Create and run” guide.'
					: undefined
			}
		/>
		{nextDoc && (
			<Pressable className="doc-next" onPress={() => selectDoc(nextDoc.slug)}>
				<View className="doc-next-copy">
					<Text className="doc-next-label">Next page</Text>
					<Text className="doc-next-title">{nextDoc.title}</Text>
				</View>
				<Text className="doc-next-arrow">→</Text>
			</Pressable>
		)}
	</View>
}

export function DocRouteScreen(props: { data: DocPage }) {
	return <DocPageContent doc={props.data} />
}
