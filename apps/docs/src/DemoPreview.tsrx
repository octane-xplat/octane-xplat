import { View, Text, Button, Link, WebView } from '@octane-xplat/ui'
import { useDemoPreview } from './docs-host'

export function DemoPreview(props: { demo: string }) @{
	const { state, attempt, launch, url, start, close, fail, frameProps } = useDemoPreview(props.demo)

	<View className="demo-preview" accessibilityLabel="Browser preview">
		<Text className="demo-description">Browser preview · no native simulator</Text>
		<Button
			className="demo-control"
			ref={launch}
			clickAction={start}
			isDisabled={state === 'loading' || state === 'ready'}
			label="Try in browser"
		/>
		<Link className="demo-control" href={url}>
			Open standalone
		</Link>
		<Text className="demo-status" accessibilityRole="status" accessibilityLiveRegion="polite">
			{state === 'loading'
				? 'Loading browser demo…'
				: state === 'error'
					? 'Preview could not load. Retry or open standalone.'
					: state === 'ready'
						? 'Browser demo ready.'
						: 'The demo loads when you choose Try in browser.'}
		</Text>
		@if (state === 'error') {
			<Button className="demo-control" clickAction={start} label="Retry" />
		}
		@if (state === 'loading' || state === 'ready') {
			<>
				<Button className="demo-control" clickAction={close} label="Close preview" />
				<WebView
					{...frameProps}
					className="demo-frame"
					key={attempt}
					accessibilityLabel={
						props.demo === 'packing-list'
							? 'Packing list browser demo'
							: 'Goal counter browser demo'
					}
					src={url}
					onError={fail}
				/>
			</>
		}
	</View>
}
