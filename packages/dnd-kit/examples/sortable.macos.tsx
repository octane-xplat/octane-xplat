/** @jsxImportSource @xplat/macos/renderer */
import { useCallback, useRef, useState } from 'octane'
import { Text, View, useMeasure } from '@octane-xplat/ui'
import { SortableList } from '../src/index'

/** AppKit scroll ownership stays explicit; all geometry and offsets use top-down points. */
export default function SortableExample() {
	const [items, setItems] = useState(Array.from({ length: 20 }, (_, index) => `task-${index + 1}`))
	const scrollRef = useRef<any>(null)
	const offsetRef = useRef(0)
	const initialized = useRef(false)
	const measure = useMeasure()
	const bindScroll = useCallback(
		(view: any) => {
			scrollRef.current = view
			measure.bind(view?.contentView ?? null)
		},
		[measure.bind],
	)

	const top = () => {
		const scroll = scrollRef.current
		const clip = scroll?.contentView
		const content = scroll?.documentView
		if (!clip || !content) {return 0}
		const flipped =
			typeof content.isFlipped === 'function' ? content.isFlipped() : content.isFlipped

		return flipped
			? Number(clip.bounds.origin.y)
			: Number(content.frame.size.height) -
					Number(clip.bounds.size.height) -
					Number(clip.bounds.origin.y)
	}

	return (
		<View>
			<Text id="dnd-order">{items.join(',')}</Text>
			<scrollview
				id="dnd-scroll"
				style={{ height: 240 }}
				ref={bindScroll}
				onScroll={() => {
					offsetRef.current = top()
				}}
			>
				<flexboxlayout
					flexDirection="column"
					onLayoutChanged={() => {
						const scroll = scrollRef.current
						if (
							initialized.current ||
							!scroll?.window ||
							scroll.documentView.frame.size.height <= scroll.contentView.bounds.size.height
						)
							{return}

						initialized.current = true
						const content = scroll.documentView
						const flipped =
							typeof content.isFlipped === 'function' ? content.isFlipped() : content.isFlipped

						scroll.contentView.scrollToPoint({
							x: 0,
							y: flipped
								? 0
								: Math.max(0, content.frame.size.height - scroll.contentView.bounds.size.height),
						})

						scroll.reflectScrolledClipView(scroll.contentView)
						measure.bind(scroll.contentView)
						offsetRef.current = top()
					}}
				>
					<SortableList
						items={items}
						onReorder={setItems}
						dnd={{
							autoScroll: {
								bounds: () => measure.bounds,
								offsetRef,
								maxOffset: () => {
									const scroll = scrollRef.current
									return Math.max(
										0,
										Number(scroll?.documentView?.frame?.size?.height ?? 0) -
											Number(scroll?.contentView?.bounds?.size?.height ?? 0),
									)
								},
								scrollTo: (offset) => {
									const scroll = scrollRef.current
									const content = scroll.documentView
									const clip = scroll.contentView
									const flipped =
										typeof content.isFlipped === 'function'
											? content.isFlipped()
											: content.isFlipped

									const y = flipped
										? offset
										: Math.max(
												0,
												Number(content.frame.size.height) -
													Number(clip.bounds.size.height) -
													offset,
											)

									clip.scrollToPoint({ x: Number(clip.bounds.origin.x), y })
									scroll.reflectScrolledClipView(clip)
									offsetRef.current = top()
								},
							},
						}}
						renderItem={(id) => (
							<View id={`dnd-${id}`} style={{ height: 64, padding: 12 }}>
								<Text>{id}</Text>
							</View>
						)}
					/>
				</flexboxlayout>
			</scrollview>
		</View>
	)
}
