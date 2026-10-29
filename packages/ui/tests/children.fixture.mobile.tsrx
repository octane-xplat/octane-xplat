/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../src/internal/layout/style-merge'
import { toChildArray, mapChildren } from '../src/internal/rendering/child-array'
import { List } from '../src/components/collections/List.tsrx'
import { Avatar } from '../src/components/media/Avatar.tsrx'
import { AvatarGroup } from '../src/components/media/AvatarGroup.tsrx'
import { Button } from '../src/components/actions/Button.tsrx'
import { Kbd } from '../src/components/content/Kbd.tsrx'
import { Blockquote } from '../src/components/content/Blockquote.tsrx'
import { useContext, useLayoutEffect, useState, createContext } from 'octane'
import { Carousel } from '../src/components/layout/Carousel.tsrx'
import { MetadataList } from '../src/components/content/MetadataList.tsrx'
import { OverflowList } from '../src/components/collections/OverflowList.tsrx'

export function Rows(props: any) @{
	const items = toChildArray(props.children)

	<masonview id="rows" style={mergeStyle({ flexDirection: 'column' }, { display: 'flex' })}>
		{mapChildren(items, (child: any) => (
			<masonview style={mergeStyle({ flexDirection: 'column' }, { display: 'flex' })}>
				{child}
			</masonview>
		))}
	</masonview>
}

export function OrdinaryChildren() @{
	<Rows>
		<label text="first" />
		<label text="second" />
	</Rows>
}

export function ChangingChildren(props: any) @{
	<Rows>
		<label text="first" />
		{props.values.map((value: string) => (
			<label key={value} text={value} />
		))}
		{props.last ? <label text="last" /> : null}
	</Rows>
}

export function CollectionLeaves(props: any) @{
	<masonview style={mergeStyle({ flexDirection: 'column' }, { display: 'flex' })}>
		<List id="list" listStyle="decimal" start={props.start}>
			<label text="First" />
			<label text="Second" />
		</List>
		<AvatarGroup id="avatars" max={props.max}>
			<Avatar fallback="AA" />
			<Avatar fallback="BB" />
			<Avatar fallback="CC" />
		</AvatarGroup>
		<Kbd id="key">
			{'Ctrl '}
			{props.keyName}
		</Kbd>
		<Kbd id="wrapped-key">
			<label text="Wrapped" />
		</Kbd>
		<Button>{props.keyName}</Button>
		<Blockquote id="quote">
			{'Quoted '}
			{props.keyName}
		</Blockquote>
	</masonview>
}

export const ChildContext = createContext('default')
function OwnedChild(props: any) @{
	const context = useContext(ChildContext)
	useLayoutEffect(() => {
		props.events.push(`mount:${props.name}`)
		return () => props.events.push(`cleanup:${props.name}`)
	}, [])

	<label text={`${context}:${props.name}`} />
}

export function OwnedChildren(props: any) @{
	<ChildContext value={props.context}>
		<Rows>
			<OwnedChild key="fixed" name="fixed" events={props.events} />
			{props.values.map((name: string) => (
				<OwnedChild key={name} name={name} events={props.events} />
			))}
		</Rows>
	</ChildContext>
}

export function OtherCollections() @{
	<masonview style={mergeStyle({ flexDirection: 'column' }, { display: 'flex' })}>
		<Carousel id="carousel">
			<label text="slide1" />
			<label text="slide2" />
		</Carousel>
		<MetadataList id="metadata" maxNumOfItems={1}>
			<label text="meta1" />
			<label text="meta2" />
		</MetadataList>
		<OverflowList id="overflow">
			<label text="tool1" />
			<label text="tool2" />
		</OverflowList>
	</masonview>
}

export function LimitedChildren(props: any) @{
	<AvatarGroup max={props.max}>
		<OwnedChild key="a" name="a" events={props.events} />
		<OwnedChild key="b" name="b" events={props.events} />
		<OwnedChild key="c" name="c" events={props.events} />
	</AvatarGroup>
}

export function ReactiveChildren(props: any) @{
	const [names, setNames] = useState(['a', 'b'])
	useLayoutEffect(() => {
		props.capture(setNames)
	}, [])

	<Rows>
		<label text="fixed" />
		{names.map((name: string) => (
			<OwnedChild key={name} name={name} events={props.events} />
		))}
	</Rows>
}
