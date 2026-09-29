/**
 * styled() — decision #7, Tamagui-shaped but CSS-backed. base/variants are
 * class strings composed into className; the leaf decides what those classes
 * mean per platform.
 *
 *   const DangerBtn = styled(Pressable, { base: 'btn', variants: { danger: 'bg-danger' } });
 *   <DangerBtn danger />  →  className=['btn','bg-danger']
 *
 * Universal constraint (Exp 16): component elements require the
 * compiler-stamped UNIVERSAL_COMPONENT mark and JSX/`@{ }` only lowers at
 * module level — so a component factory can't be authored with JSX. This
 * leaf stamps the mark itself via defineUniversalComponent and returns
 * universalComponent(...) elements directly. If upstream exposes a blessed
 * factory path, switch to it (driver-level fix candidate). */
export declare function styled<P extends {
    className?: any;
}, V extends Record<string, any>>(Base: (props: P) => any, def: {
    base?: any;
    variants?: V;
}): import("@nativescript-community/octane").UniversalComponent<P & { [K in keyof V]?: boolean | undefined; }>;
