/** @jsxImportSource @nativescript-community/octane */
import { useState } from 'octane';
import type { ProbeContext } from '../../../scripts/probe/context';
import { Grid } from '../src/Grid.tsrx';
import { layoutChildProps } from '../src/layout-child';

function Composite() @{
 <masonview display="grid" id="probe-composite" row={0} col={0} colSpan={2}><label text="composite" /></masonview>
}
export function PlacementCase(props: { values: string[] }) @{
 <Grid columns="*,*,*">
  <label row={0} col={0} text="raw" />
  <Composite />
  @for (const value of props.values; key value) { <label text={value} /> }
 </Grid>
}
function ReactiveChildren(props: { capture: (fn: (values: string[]) => void) => void }) @{
 const [values, setValues] = useState(['a']);
 props.capture(setValues);
 <>
  @for (const value of values; key value) { <label id={`probe-${value}`} text={value} /> }
 </>
}
export function ReactivePlacementCase(props: { capture: (fn: (values: string[]) => void) => void }) @{
 <Grid columns="*,*"><ReactiveChildren capture={props.capture} /></Grid>
}
export function SlotCase(props: { type: string; visible: boolean }) @{
 @if (props.type === 'contentview') {
  <contentview>@if (props.visible) { <label text="late" /> }</contentview>
 } @else {
  <rootlayout>@if (props.visible) { <label text="late" /> }</rootlayout>
 }
}

export function UpdatingPlacement(props: { col?: number; span?: number }) @{
 <Grid columns="*,*,*"><label row={0} col={props.col} colSpan={props.span} text="moving" /><label text="auto" /></Grid>
}

// Optional device diagnostic; Node assertions above are the maintained regression lane.
function ProbeChildren() @{
 const [values, setValues] = useState(['a']);
 <>
  <label id="probe-toggle" text="Tap to insert/reorder/remove" onTap={() => setValues(current => current.length === 1 ? ['b', 'a', 'c'] : ['c'])} />
  @for (const value of values; key value) { <label id={`probe-${value}`} text={value} /> }
 </>
}
export default function GridPlacementProbe() @{
 <masonview display="flex" flexDirection="column">
  <label text="Composite should span two cells; automatic should be in column 2" />
  <Grid columns="*,*,*"><Composite /><label id="probe-auto" text="automatic" /></Grid>
  <Grid columns="*,*"><ProbeChildren /></Grid>
 </masonview>
}

export async function run(ctx: ProbeContext) {
 await ctx.waitFor(() => ctx.find('probe-auto') && ctx.find('probe-a'));
 const composite = ctx.find('probe-composite') as any;
 const automatic = ctx.find('probe-auto') as any;
 ctx.assert('composite row', composite.row, 0);
 ctx.assert('composite column', composite.col, 0);
 ctx.assert('composite span', composite.colSpan, 2);
 ctx.assert('automatic column', automatic.col, 2);
 await ctx.press('probe-toggle');
 await ctx.waitFor(() => (ctx.find('probe-a') as any)?.row === 1);
 ctx.assert('reordered a column', (ctx.find('probe-a') as any).col, 0);
 ctx.assert('inserted c column', (ctx.find('probe-c') as any).col, 1);
 await ctx.press('probe-toggle');
 await ctx.waitFor(() => !ctx.find('probe-a') && (ctx.find('probe-c') as any)?.row === 0);
 ctx.assert('remaining c column', (ctx.find('probe-c') as any).col, 1);
}

function ForwardingComposite(props: { col?: number; colSpan?: number }) @{
 <masonview display="grid" {...layoutChildProps(props)}><label text="composite" /></masonview>
}
export function UpdatingComposite(props: { col?: number; span?: number }) @{
 <Grid columns="*,*,*"><ForwardingComposite col={props.col} colSpan={props.span} /><label text="auto" /></Grid>
}
