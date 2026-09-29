/** @jsxImportSource octane */
/**
 * styled() — decision #7. Web side: DOM codegen lowers JSX in nested
 * functions fine, so the factory is a plain component. */
export declare function styled<P extends {
    className?: any;
}, V extends Record<string, any>>(Base: (props: P) => any, def: {
    base?: any;
    variants?: V;
}): (props: P & { [K in keyof V]?: boolean; }) => import("octane/jsx-runtime").JSX.Element;
