/** Per-element transform composition for imperative writes. The DOM has a
 *  single `transform` string where native has discrete view props, so web
 *  keeps the last-written value per transform prop and re-joins them —
 *  an AnimatedValue on `rotate` and a setTranslate drag on the same
 *  element don't clobber each other. */
/** Write one transform prop without disturbing the element's other
 *  transform components (or its stylesheet/base transform). */
export declare function writeTransformProp(el: HTMLElement, prop: string, value: number): void;
