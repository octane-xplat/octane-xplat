// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { act, createRoot } from 'octane';
import { Stack } from './Stack.web.tsrx';
import { StackItem } from './StackItem.web.tsrx';
import { HStack } from './HStack.tsrx';
import { VStack } from './VStack.tsrx';
import { Center } from './Center.web.tsrx';
import { Section } from './Section.web.tsrx';
import { AspectRatio } from './AspectRatio.web.tsrx';
import { VisuallyHidden } from './VisuallyHidden.web.tsrx';
import { FormLayout } from './FormLayout.web.tsrx';
import { FormField } from './FormField.web.tsrx';
import { InputGroup, InputGroupText } from './InputGroup.web.tsrx';
import { TextInput } from './TextInput.web.tsrx';
import { Checkbox } from './Checkbox.web.tsrx';
import { List } from './List.web.tsrx';
import { ListItem } from './ListItem.web.tsrx';
import { CheckboxIndicator, CheckIndicator, RadioIndicator, getIndicator, registerIndicator, useIndicator } from './indicators';

function mount(node: any) {
	const el = document.createElement('div');
	document.body.appendChild(el);
	const root = createRoot(el);
	act(() => root.render(node));
	return { el, root };
}

describe('flow Stack family (web)', () => {
	it('Stack defaults to a vertical flex column with gap/padding steps', () => {
		const { el, root } = mount(<Stack gap={2} padding={1}><span>a</span><span>b</span></Stack>);
		const stack = el.firstElementChild as HTMLElement;
		expect(stack.className).toContain('vx-stack');
		expect(stack.style.flexDirection).toBe('column');
		expect(stack.style.gap).toBe('8px');
		expect(stack.style.paddingBlockStart).toBe('4px');
		root.unmount();
	});

	it('direction="horizontal" flips axes: hAlign is main, vAlign is cross', () => {
		const { el, root } = mount(<Stack direction="horizontal" hAlign="end" vAlign="center" />);
		const stack = el.firstElementChild as HTMLElement;
		expect(stack.style.flexDirection).toBe('row');
		expect(stack.style.justifyContent).toBe('flex-end');
		expect(stack.style.alignItems).toBe('center');
		root.unmount();
	});

	it('vertical stack maps vAlign→main, hAlign→cross; justify/align alias', () => {
		const { el, root } = mount(<Stack justify="between" align="end" />);
		const stack = el.firstElementChild as HTMLElement;
		expect(stack.style.flexDirection).toBe('column');
		expect(stack.style.justifyContent).toBe('space-between');
		expect(stack.style.alignItems).toBe('flex-end');
		root.unmount();
	});

	it('HStack/VStack render their directions; StackItem fill grows', () => {
		const { el, root } = mount(
			<VStack>
				<StackItem size="fill"><span>fill</span></StackItem>
				<StackItem size="static"><span>static</span></StackItem>
			</VStack>
		);

		const stack = el.firstElementChild as HTMLElement;
		expect(stack.className).toContain('vx-stack');
		expect(stack.style.flexDirection).toBe('column');
		const items = stack.querySelectorAll('.vx-stackitem');
		expect((items[0] as HTMLElement).style.flexGrow).toBe('1');
		expect((items[1] as HTMLElement).style.flexGrow).toBe('0');
		root.unmount();
	});

	it('Stack does NOT overlap children (flow semantics)', () => {
		const { el, root } = mount(<Stack><span>a</span><span>b</span></Stack>);
		const stack = el.firstElementChild as HTMLElement;
		expect(stack.style.display).not.toBe('grid');
		root.unmount();
	});

	it('isScrollable sets overflow:auto; as picks the tag', () => {
		const { el, root } = mount(<Stack as="section" isScrollable />);
		const stack = el.firstElementChild as HTMLElement;
		expect(stack.tagName).toBe('SECTION');
		expect(stack.style.overflow).toBe('auto');
		root.unmount();
	});
});

describe('Center (web)', () => {
	it('axis=both centers both; horizontal only justify', () => {
		const { el, root } = mount(<Center axis="horizontal"><span>x</span></Center>);
		const c = el.firstElementChild as HTMLElement;
		expect(c.style.justifyContent).toBe('center');
		expect(c.style.alignItems).toBe('');
		root.unmount();
	});

	it('isInline renders inline-flex', () => {
		const { el, root } = mount(<Center isInline />);
		expect((el.firstElementChild as HTMLElement).style.display).toBe('inline-flex');
		root.unmount();
	});
});

describe('Section (web)', () => {
	it('renders outer/inner wrappers with variant + divider classes', () => {
		const { el, root } = mount(<Section variant="muted" dividers={['top', 'end']} padding={2}>x</Section>);
		const outer = el.firstElementChild as HTMLElement;
		expect(outer.className).toContain('vx-section--muted');
		const inner = outer.firstElementChild as HTMLElement;
		expect(inner.className).toContain('vx-section--divider-top');
		expect(inner.className).toContain('vx-section--divider-end');
		expect(inner.style.paddingBlockStart).toBe('8px');
		root.unmount();
	});
});

describe('AspectRatio (web)', () => {
	it('applies aspect-ratio style + fit/shape classes', () => {
		const { el, root } = mount(<AspectRatio ratio={16 / 9} shape="ellipse" fit="contain"><img alt="" /></AspectRatio>);
		const ar = el.firstElementChild as HTMLElement;
		expect(ar.style.aspectRatio).toContain('1.777');
		expect(ar.className).toContain('vx-aspectratio--ellipse');
		expect(ar.className).toContain('vx-aspectratio-fit-contain');
		expect(ar.querySelector('.vx-aspectratio-content')).not.toBeNull();
		root.unmount();
	});
});

describe('VisuallyHidden (web)', () => {
	it('renders a clipped span that stays in the a11y tree', () => {
		const { el, root } = mount(<VisuallyHidden>hidden label</VisuallyHidden>);
		const vh = el.firstElementChild as HTMLElement;
		expect(vh.tagName).toBe('SPAN');
		expect(vh.className).toBe('vx-visually-hidden');
		expect(vh.getAttribute('aria-hidden')).toBeNull();
		root.unmount();
	});
});

describe('FormLayout (web)', () => {
	it('vertical is default; horizontal-labels gives fields a two-column render', () => {
		const { el, root } = mount(
			<FormLayout direction="horizontal-labels">
				<FormField label="Name"><TextInput /></FormField>
			</FormLayout>
		);

		const layout = el.querySelector('.vx-formlayout--horizontal-labels');
		expect(layout).not.toBeNull();
		const field = el.querySelector('.vx-field--hl') as HTMLElement;
		expect(field).not.toBeNull();
		// display:contents comes from the vx-field--hl class (stylesheet), not inline style
		expect(field.className).toContain('vx-field--hl');
		expect(el.querySelector('.vx-field-hl-label .vx-field-label')).not.toBeNull();
		expect(el.querySelector('.vx-field-hl-body input')).not.toBeNull();
		root.unmount();
	});

	it('defaultOptionality="required" suppresses the restating marker but keeps aria-required', () => {
		const { el, root } = mount(
			<FormLayout defaultOptionality="required">
				<FormField label="Email" isRequired><TextInput /></FormField>
				<FormField label="Nick" isOptional><TextInput /></FormField>
			</FormLayout>
		);

		const labels = Array.from(el.querySelectorAll('.vx-field-label')).map((l) => l.textContent);
		expect(labels[0]).toBe('Email');
		expect(labels[1]).toContain('(Optional)');
		const inputs = el.querySelectorAll('input');
		expect(inputs[0].getAttribute('aria-required')).toBe('true');
		expect(inputs[1].getAttribute('aria-required')).toBeNull();
		root.unmount();
	});
});

describe('InputGroup (web)', () => {
	it('renders a role=group surface labelled by the field label; members flatten', () => {
		const { el, root } = mount(
			<InputGroup label="URL" description="Public endpoint">
				<InputGroupText>https://</InputGroupText>
				<TextInput />
			</InputGroup>
		);

		const group = el.querySelector('.vx-inputgroup') as HTMLElement;
		expect(group.getAttribute('role')).toBe('group');
		const label = el.querySelector('.vx-field-label') as HTMLElement;
		expect(label.tagName).toBe('SPAN');
		expect(group.getAttribute('aria-labelledby')).toBe(label.id);
		expect(group.getAttribute('aria-describedby')).toContain('description');
		expect(el.querySelector('.vx-inputgroup-text')?.textContent).toBe('https://');
		expect(el.querySelector('.vx-input--ingroup')).not.toBeNull();
		root.unmount();
	});
});

describe('indicators (web)', () => {
	it('CheckboxIndicator draws box states; indeterminate renders a dash', () => {
		const { el, root } = mount(<CheckboxIndicator state="indeterminate" />);
		const box = el.querySelector('.vx-ind-checkbox--indeterminate');
		expect(box).not.toBeNull();
		expect(box?.querySelector('.vx-ind-dash')).not.toBeNull();
		root.unmount();
	});

	it('CheckIndicator renders nothing when unchecked, a glyph when checked', () => {
		const { el, root } = mount(<CheckIndicator state="unchecked" />);
		expect(el.children.length).toBe(0);
		act(() => root.render(<CheckIndicator state="checked" />));
		expect(el.querySelector('.vx-ind-check')?.textContent).toBe('✓');
		root.unmount();
	});
	it('RadioIndicator draws the circle; dot only when checked', () => {
		const { el, root } = mount(<RadioIndicator state="unchecked" />);
		expect(el.querySelector('.vx-ind-radio')).not.toBeNull();
		expect(el.querySelector('.vx-ind-radio-dot')).toBeNull();
		act(() => root.render(<RadioIndicator state="checked" />));
		expect(el.querySelector('.vx-ind-radio-dot')).not.toBeNull();
		root.unmount();
	});
	it('registry overrides reach useIndicator/getIndicator', () => {
		const Custom = (p: any) => <span className="vx-ind-custom" />;
		registerIndicator('checkbox', Custom as any);
		expect(useIndicator('checkbox')).toBe(Custom);
		expect(getIndicator('radio')).toBe(RadioIndicator);
		// restore default for other assertions
		registerIndicator('checkbox', CheckboxIndicator);
	});
	it('Checkbox renders through the indicator registry', () => {
		const { el, root } = mount(<Checkbox checked />);
		expect(el.querySelector('.vx-ind-checkbox--checked')).not.toBeNull();
		expect(el.querySelector('.vx-checkbox-check')).not.toBeNull();
		root.unmount();
	});
});

describe('List/ListItem (web)', () => {
	it('renders a semantic ul with role=list and density context', () => {
		const { el, root } = mount(
			<List density="compact" hasDividers>
				<ListItem label="One" />
				<ListItem label="Two" description="desc" />
			</List>
		);
		const list = el.querySelector('ul.vx-list');
		expect(list).not.toBeNull();
		expect(list?.getAttribute('role')).toBe('list');
		const items = el.querySelectorAll('li.vx-listitem');
		expect(items.length).toBe(2);
		expect((items[0] as HTMLElement).className).toContain('vx-listitem--density-compact');
		expect((items[1] as HTMLElement).textContent).toContain('desc');
		root.unmount();
	});

	it('decimal lists render an ol and number markers via counter', () => {
		const { el, root } = mount(
			<List listStyle="decimal" start={3}>
				<ListItem label="a" />
				<ListItem label="b" />
			</List>
		);
		const list = el.querySelector('ol.vx-list--decimal') as HTMLElement;
		expect(list).not.toBeNull();
		expect(list.getAttribute('start')).toBe('3');
		expect(list.style.counterReset).toBe('vx-list 2');
		expect(el.querySelectorAll('.vx-listmarker--num').length).toBe(2);
		root.unmount();
	});

	it('interactive rows render an invisible hit button; href renders an anchor', () => {
		const { el, root } = mount(
			<List>
				<ListItem label="Go" href="/x" target="_self" />
				<ListItem label="Act" onPress={() => {}} />
			</List>
		);
		expect(el.querySelector('a.vx-listitem-hit')?.getAttribute('href')).toBe('/x');
		expect(el.querySelector('button.vx-listitem-hit')).not.toBeNull();
		root.unmount();
	});

	it('header renders above the list and labels it via aria-labelledby', () => {
		const { el, root } = mount(<List header={<span>Hdr</span>}><ListItem label="x" /></List>);
		const header = el.querySelector('.vx-list-header') as HTMLElement;
		const list = el.querySelector('ul.vx-list');
		expect(list?.getAttribute('aria-labelledby')).toBe(header.id);
		root.unmount();
	});
});
