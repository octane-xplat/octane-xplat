/** @jsxImportSource @octane-xplat/jsx */
import { expect, it } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { Meter } from './Meter.macos.tsrx'
import { Meter as BarrelMeter } from '../../internal/platform/macos-extras.macos.tsrx'
import { ProgressGroup } from './ProgressGroup.macos.tsrx'

function mount(component: any, props: any) {
	const container = createObjectContainer('nativescript'), root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const render = (next: any) => { root.render(component, next); flushUniversalSync(() => {}) }
	const all = (): any[] => {
		const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]
		return container.children.flatMap(walk)
	}
	const meters = () => all().filter((node) => node.props?.accessibilityRole === 'meter')
	render(props)
	return { root, render, all, meters }
}

it('AppKit Meter uses one leaf through its existing barrel and retains supplied content', () => {
	expect(BarrelMeter).toBe(Meter)
	const env = mount(BarrelMeter, { value: 60, children: <label id="meter-content" text="60%" /> })
	try {
		expect(env.meters()).toHaveLength(1); expect(env.all().find((node) => node.props?.id === 'meter-content')?.props.text).toBe('60%')
		expect(env.meters()[0].props.style.borderWidth).toBe(3)
	} finally { env.root.unmount() }
})

it('AppKit Meter describes the normalized finite range and gives maxValue precedence', () => {
	const env = mount(Meter, { value: 50, minValue: 10, maxValue: 30, max: 90, valueLabel: 'Capacity', accessibilityLabel: 'Storage' })
	try {
		const host = env.meters()[0]
		expect(host.props.accessibilityValue).toBe('30'); expect(host.props.accessibilityMinValue).toBe(10); expect(host.props.accessibilityMaxValue).toBe(30); expect(host.props.accessibilityValueDescription).toBe('Capacity')
		env.render({ value: NaN, minValue: NaN, maxValue: Infinity }); expect(env.meters()[0]).toBe(host)
		expect(host.props.accessibilityValue).toBe('0'); expect(host.props.accessibilityMinValue).toBe(0); expect(host.props.accessibilityMaxValue).toBe(100); expect(host.props.accessibilityValueDescription).toBe('0 of 100')
	} finally { env.root.unmount() }
})

it('AppKit Meter preserves style forms and overrides while keeping finite default geometry', () => {
	const env = mount(Meter, { value: 10, size: 40, strokeWidth: 5, style: 'width:80px;opacity:0.8' })
	try {
		const host = env.meters()[0]
		expect(host.props.style).toContain('width:80px;opacity:0.8')
		env.render({ value: 10, size: 40, strokeWidth: 100, trackColor: '#123456', style: [{ width: 50 }, { width: 60 }] })
		expect(host.props.style).toMatchObject({ width: 60, height: 40, borderWidth: 40, borderColor: '#123456' })
		env.render({ value: 10, size: NaN, strokeWidth: Infinity }); expect(host.props.style).toMatchObject({ width: 24, height: 24, borderWidth: 3, borderColor: '#e1ecf7' })
	} finally { env.root.unmount() }
})

it('AppKit ProgressGroup uses the same meter range and style contract', () => {
	const env = mount(ProgressGroup, { items: [{ key: 'cpu', label: 'CPU', value: 140, max: 100 }, { key: 'memory', label: 'Memory', value: 50, max: 80 }] })
	try {
		const [cpu, memory] = env.meters()
		expect(cpu.props.accessibilityLabel).toBe('CPU'); expect(cpu.props.accessibilityValue).toBe('100'); expect(memory.props.accessibilityMaxValue).toBe(80)
		expect(cpu.props.style.borderWidth).toBe(3); expect(memory.props.style.borderWidth).toBe(3)
	} finally { env.root.unmount() }
})
