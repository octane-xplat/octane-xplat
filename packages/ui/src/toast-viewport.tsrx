/** @jsxImportSource @nativescript-community/octane */
import { useEffect, useId, useMemo, useRef } from 'octane';
import type { ToastViewportProps } from './props';
import { ToastViewportProvider, type ToastViewportContextValue } from './toast-context';
import { registerToastViewport } from './toast-store';
import { registerNativeToastViewport } from './toast-service';
import { rootLayoutFor } from './root-layout';

/** Toast stack container (Astryx `ToastViewport`), native leaf. Toasts
 *  render as sibling hosts on this screen's RootLayout — the viewport
 *  owns routing config (`position`, `maxVisible`) and registers its
 *  RootLayout so `useToast` inside it docks there. `inset` and
 *  `isTopLayer` are web semantics (documented; `inset` applies as extra
 *  edge margin where noted on the service). */
export function ToastViewport(props: ToastViewportProps) @{
	const id = useId();
	const sentinel = useRef<any>(null);
	const ctx = useMemo<ToastViewportContextValue>(
		() => ({ id, position: props.position ?? 'bottomEnd', maxVisible: props.maxVisible ?? 5 }),
		[id, props.position, props.maxVisible],
	);

	useEffect(() => {
		const rl = rootLayoutFor(sentinel.current);
		if (!rl) return;
		const unregShared = registerToastViewport(id);
		const unregNative = registerNativeToastViewport(id, {
			rl,
			position: ctx.position,
			maxVisible: ctx.maxVisible,
		});

		return () => {
			unregNative();
			unregShared();
		};
	}, [id, ctx]);

	<>
		<ToastViewportProvider value={ctx}>
			{props.children}
		</ToastViewportProvider>
		<stacklayout ref={(v: any) => { sentinel.current = v; }} style={{ width: 0, height: 0 }} />
	</>
}
