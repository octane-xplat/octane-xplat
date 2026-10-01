/** @jsxImportSource @nativescript-community/octane */
import { useEffect, useRef, useSyncExternalStore } from 'octane';
import type { ResizableRegion, UseResizableMultiConfig, UseResizableSingleConfig } from './props';
import { createResizableRegion, type ResizableMachine } from './resize-state';
import { nativeBasisSource as basis } from './resize-basis';

/**
 * useResizable — resizable-region state for ResizeHandle and host
 * components (SideNav). A single config yields one region; `regions`
 * yields an independent region per stable key (upstream contract: keys
 * must not change between renders).
 */
export function useResizable(config: UseResizableSingleConfig): ResizableRegion;
export function useResizable(config: UseResizableMultiConfig): Record<string, ResizableRegion>;
export function useResizable(config: UseResizableSingleConfig | UseResizableMultiConfig): any {
	const isMulti = 'regions' in config;

	const state = useRef<{ machines: Map<string, ResizableMachine>; order: string[] } | null>(null);
	if (state.current == null) {
		const machines = new Map<string, ResizableMachine>();
		if (isMulti) {
			const multi = config as UseResizableMultiConfig;
			for (const [key, regionConfig] of Object.entries(multi.regions)) {
				machines.set(
					key,
					createResizableRegion(
						{ ...regionConfig, containerRef: multi.containerRef, direction: multi.direction },
						basis,
						multi.autoSaveId ? `${multi.autoSaveId}:${key}` : undefined,
					),
				);
			}

			state.current = { machines, order: Object.keys(multi.regions) };
		} else {
			const single = config as UseResizableSingleConfig;
			machines.set('default', createResizableRegion(single, basis));
			state.current = { machines, order: ['default'] };
		}
	}

	// Push config updates between renders.
	for (const [key, machine] of state.current.machines) {
		const single = (config as UseResizableMultiConfig).regions?.[key];
		machine.update(
			isMulti
				? { ...single, containerRef: (config as UseResizableMultiConfig).containerRef, direction: (config as UseResizableMultiConfig).direction }
				: (config as UseResizableSingleConfig),
		);
	}

	// Re-render when a region's size/collapse changes.
	const snapshotRef = useRef<any[]>([]);
	useSyncExternalStore(
		(cb) => {
			const unsubs = Array.from(state.current!.machines.values()).map((m) => m.subscribe(cb));
			return () => unsubs.forEach((u) => u());
		},
		() => {
			const next = Array.from(state.current!.machines.values()).map((m) => m.getSnapshot());
			const prev = snapshotRef.current;
			if (prev.length === next.length && prev.every((p, i) => p === next[i])) {
				return prev;
			}

			snapshotRef.current = next;
			return next;
		},
	);

	// Observe the basis for changes and re-measure.
	const containerRef = (config as any).containerRef;
	const direction = (config as any).direction ?? 'horizontal';
	useEffect(() => {
		const remeasure = () => {
			for (const machine of state.current!.machines.values()) {
				machine.remeasure();
			}
		};

		remeasure();
		return basis.observe(containerRef, direction, remeasure);
	}, [containerRef, direction]);

	if (isMulti) {
		const result: Record<string, ResizableRegion> = {};
		for (const key of state.current.order) {
			result[key] = state.current.machines.get(key)!.region;
		}

		return result;
	}

	return state.current.machines.get('default')!.region;
}
