import { useEffect } from 'octane'
import { Screen, View, HStack, Text, Pressable } from '@octane-xplat/ui'
import { DEMOS, RENDER, setLastDemo } from '@xplat/demos'
import { useRouter } from '@octane-xplat/ui/routing'
import type { RouteProps } from '../../routes.gen.contracts'
import { openBottomSheet } from '../../platform/sheet'
import { VirtualListBenchmark } from '../../VirtualListBenchmark.tsrx'

const renderVirtualListBenchmark = () => <VirtualListBenchmark />

/** The route contract supplies path params and the hook owns Back. */
export function DemoDetail(props: RouteProps<'/demo/:id'>) @{
	const navigation = useRouter()
	const id = props.params.id
	const title =
		id === 'vlist-perf' ? 'VirtualList performance' : (DEMOS.find((d) => d.id === id)?.title ?? id)

	const renderDemo =
		id === 'vlist-perf' ? renderVirtualListBenchmark : (RENDER[id] ?? RENDER.counter)

	useEffect(() => {
		setLastDemo(id)
	}, [])

	<Screen className="vx-app flex-1 gap-6">
		<HStack className="gap-4 items-center">
			<Pressable id="demo-back" onPress={() => navigation.back()} className="btn btn-secondary">
				<Text>← Back</Text>
			</Pressable>
			<Text className="text-xl font-semibold flex-1">{title}</Text>
			<Pressable
				id="demo-sheet"
				onPress={() => {
					openBottomSheet(renderDemo)
					console.log('[probe] bottom-sheet demo=' + id)
				}}
				className="btn btn-secondary"
			>
				<Text>In sheet</Text>
			</Pressable>
		</HStack>
		<View className="flex-1 min-h-0">{renderDemo()}</View>
	</Screen>
}
