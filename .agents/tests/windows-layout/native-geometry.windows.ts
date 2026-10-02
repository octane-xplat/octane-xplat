import {
	Application,
	Page,
	StackLayout,
	FlexboxLayout,
	Label,
	AbsoluteLayout,
} from '@nativescript/core'

Application.run({
	create() {
		const page = new Page()
		page.actionBarHidden = true
		const host = new StackLayout()
		page.content = host
		const cases: any[] = []
		const add = (name: string, props: any, count = 1) => {
			const box = new FlexboxLayout()
			Object.assign(box, {
				width: 200,
				paddingLeft: 17,
				paddingTop: 7,
				paddingRight: 13,
				paddingBottom: 11,
				flexDirection: 'column',
				...props,
			})

			for (let i = 0; i < count; i++) {
				const label = new Label()
				label.text = name + ' ' + i
				label.height = 10
				if (props.flexDirection?.startsWith('row')) {label.width = 100}
				box.addChild(label)
			}

			host.addChild(box)
			cases.push({ name, box })
		}

		add('fixed', { height: 60 })
		add('auto', {})
		add('empty', {}, 0)
		add('row', { height: 60, flexDirection: 'row' }, 2)
		add('row-reverse', { height: 60, flexDirection: 'row-reverse' }, 2)
		add('column-reverse', { height: 60, flexDirection: 'column-reverse' }, 2)
		add('wrap', { height: 60, flexDirection: 'row', flexWrap: 'wrap' }, 2)
		add('oversized', { width: 20, height: 15 })
		add('percent', { height: 60 })
		cases[cases.length - 1].box.getChildAt(0).width = '100%'
		cases[cases.length - 1].box.getChildAt(0).height = '100%'
		add(
			'shrink-no-padding',
			{
				width: 170,
				height: 60,
				flexDirection: 'row',
				paddingLeft: 0,
				paddingTop: 0,
				paddingRight: 0,
				paddingBottom: 0,
			},
			2,
		)

		const report = (stage: string) => {
			for (const { name, box } of cases) {
				const children: any[] = []
				box.eachChildView((v: any) => {
					let offset
					try {
						offset = v.nativeViewProtected
							.TransformToVisual(box.nativeViewProtected)
							.TransformPoint({ X: 0, Y: 0 })
					} catch {}

					children.push({ size: v.getActualSize(), offset })
					return true
				})

				console.log(
					'[layout-padding-final] ' +
						JSON.stringify({ stage, name, size: box.getActualSize(), children }),
				)
			}
		}

		setTimeout(() => {
			report('initial')
			cases[0].box.paddingLeft = 23
			cases[0].box.paddingTop = 9
			cases[0].box.width = 220
			const pct = cases.find((c) => c.name === 'percent').box
			pct.paddingLeft = 23
			pct.paddingTop = 9
		}, 2000)

		setTimeout(() => report('changed'), 4000)
		const parent = new AbsoluteLayout()
		parent.width = 200
		parent.height = 100
		const child = new Label()
		child.text = 'Percent child'
		child.width = '100%'
		child.height = '100%'
		let independent = 0
		parent.on('layoutChanged', () => independent++)
		parent.addChild(child)
		host.addChild(parent)
		page.content = host
		const percentReport = (stage: string) =>
			console.log(
				'[layout-percent-final] ' +
					JSON.stringify({
						stage,
						parent: parent.getActualSize(),
						child: child.getActualSize(),
						independent,
					}),
			)

		setTimeout(() => {
			percentReport('initial')
			parent.width = 300
			parent.height = 150
		}, 1500)

		setTimeout(() => {
			percentReport('resize')
			child.width = 80
			child.height = 20
			parent.width = 240
			parent.height = 120
		}, 3000)

		setTimeout(() => {
			percentReport('numeric')
			child.width = '50%'
			child.height = '50%'
		}, 4500)

		setTimeout(() => {
			percentReport('percentage-again')
			parent.removeChild(child)
			const other = new AbsoluteLayout()
			other.width = 160
			other.height = 80
			host.addChild(other)
			other.addChild(child)
			setTimeout(
				() =>
					console.log(
						'[layout-percent-final] ' +
							JSON.stringify({
								stage: 'reparent',
								parent: other.getActualSize(),
								child: child.getActualSize(),
								independent,
							}),
					),
				1000,
			)
		}, 6000)

		return page
	},
})
