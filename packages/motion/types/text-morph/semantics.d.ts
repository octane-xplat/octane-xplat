import '../intl';
/** Renderer-independent exact-text planning. No normalization or boundary guesses. */
export declare const TEXT_MORPH_LIMITS: {
    readonly graphemes: 80;
    readonly words: 32;
    readonly operations: 10000;
};
export interface TextMorphSegment {
    segment: string;
    index: number;
    isWordLike?: boolean;
}
export interface TextMorphSegmenter {
    segment(value: string): Iterable<TextMorphSegment>;
}
export interface TextMorphSegmenters {
    grapheme: TextMorphSegmenter;
    word: TextMorphSegmenter;
}
export type TextMorphFallback = 'segmentation-unavailable' | 'segmentation-unreliable' | 'unsupported-input' | 'grapheme-limit' | 'word-limit' | 'budget-exhausted';
export interface TextMorphToken {
    readonly id: number;
    readonly text: string;
    /** UTF-16 offset into the exact supplied value. */
    readonly start: number;
    readonly kind: 'word' | 'literal' | 'space';
}
export interface TextMorphFrame {
    readonly value: string;
    readonly tokens: readonly TextMorphToken[];
    readonly nextId: number;
    readonly fallback?: TextMorphFallback;
}
export interface TextMorphPlan {
    readonly mode: 'animate' | 'static' | 'unchanged';
    readonly frame: TextMorphFrame;
    readonly outgoing: readonly TextMorphToken[];
    readonly operations: number;
    readonly fallback?: TextMorphFallback;
}
/** Lazy platform capability lookup; missing Intl never prevents module loading. */
export declare function textMorphSegmenters(): TextMorphSegmenters | null;
/** Internal seam for renderers/tests, not caller options. Matching is greedy FIFO:
 * each new token takes the first unmatched old token of identical kind and exact
 * UTF-16 text. Reordered repeats retain distinct IDs; changed words never split.
 * Literal/space spans also retain exact text, so joining tokens reconstructs value.
 * Carry the returned frame into the next update. Unsupported frames expose no
 * fragments; supported mount/recovery frames keep tokens for the next change.
 */
export declare function planTextMorph(previous: TextMorphFrame | null, value: string, options?: {
    segmenters?: TextMorphSegmenters | null;
    operationLimit?: number;
}): TextMorphPlan;
