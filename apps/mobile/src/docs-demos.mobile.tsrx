/** @jsxImportSource @nativescript-community/octane */
import { Application, Frame, Page } from '@nativescript/core';
import { renderNativeScriptApp } from '@nativescript-community/octane';
import { useState } from 'octane';
import { Screen, ScrollableArea, View, Pressable, Text } from '@octane-xplat/ui';
import { GoalCounter } from '@xplat/demos/GoalCounter.tsrx';
import { PackingList } from '@xplat/demos/PackingList.tsrx';
import '@octane-xplat/ui/theme/tokens.css';
import '@octane-xplat/ui/theme/chrome.css';

function DocsDemos() @{
	const [demo, setDemo] = useState('');

	<Screen className="vx-app flex-1">
		<ScrollableArea className="flex-1">
			<View className="gap-4 p-4">
				<Pressable className="btn btn-secondary" onPress={() => setDemo('')}><Text>Back to demos</Text></Pressable>
				@if (demo === 'goal') { <GoalCounter /> }
				@if (demo === 'packing') { <PackingList /> }
				@if (demo === '') {
					<View className="gap-4">
						<Text className="text-xl font-semibold">Docs demos · native runtime</Text>
						<Pressable className="btn bg-primary" onPress={() => setDemo('goal')}><Text className="text-onprimary">Goal counter</Text></Pressable>
						<Pressable className="btn bg-primary" onPress={() => setDemo('packing')}><Text className="text-onprimary">Packing list</Text></Pressable>
					</View>
				}
			</View>
		</ScrollableArea>
	</Screen>
}

Application.run({ create: () => {
	const page = new Page();
	page.actionBarHidden = true;
	renderNativeScriptApp(page, DocsDemos);
	const frame = new Frame();
	frame.navigate({ create: () => page });
	return frame;
} });
