import { MasonMaterialView } from './liquid-glass-view.ios'

/** A grouping effect shares the same Mason box and direct UIKit child host. */
export class LiquidGlassContainerView extends MasonMaterialView {
  protected get materialEffectType(): 'container' {
    return 'container'
  }
}
