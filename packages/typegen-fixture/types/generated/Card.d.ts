/** @jsxImportSource octane */
declare function CardRoot(props: {
    title: string;
}): import("octane/jsx-runtime").JSX.Element;
declare function CardHeader(props: {
    text: string;
}): import("octane/jsx-runtime").JSX.Element;
export declare const Card: typeof CardRoot & {
    Header: typeof CardHeader;
};
export {};
