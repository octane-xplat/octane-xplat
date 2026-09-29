/** Clamp a progress value to its declared range for drawing and accessibility. */
export declare function meterRange(value: number, max: number): {
    max: number;
    value: number;
    ratio: number;
};
