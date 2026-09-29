import type { PressableProps } from "./props.js";
/**  flexboxlayout, not contentview — ContentView is single-child: the driver
 *  assigns each child to `.content`, so every sibling but the last was
 *  silently dropped. Column flex matches View's shape (and the web div);
 *  tap/longPress are gesture events, they attach to any view. */
export declare function Pressable(props: PressableProps): unknown;
