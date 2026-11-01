import type { NativeNode } from '@octane-xplat/jsx/intrinsics'
import type {
	UniversalPreparedAttempt,
	UniversalRenderContext,
	UniversalRoot,
} from 'octane/universal/native'

/** Source JSX/TSRX component. The GTK preset supplies universal runtime
 * metadata when it compiles the component; source-level JSX is opaque. */
export type GtkComponent<Props = any> = (
	props: Props,
	context: UniversalRenderContext,
) => NativeNode

/** Source-facing mount methods over the unchanged Octane universal root.
 * Infer props from the component, so a mismatched props bag cannot widen it. */
export interface GtkRoot extends Omit<UniversalRoot, 'prepare' | 'render' | 'renderAsync'> {
	prepare<Props>(component: GtkComponent<Props>, props: NoInfer<Props>): UniversalPreparedAttempt
	render<Props>(component: GtkComponent<Props>, props: NoInfer<Props>): UniversalPreparedAttempt
	renderAsync<Props>(
		component: GtkComponent<Props>,
		props: NoInfer<Props>,
	): Promise<UniversalPreparedAttempt>
}
