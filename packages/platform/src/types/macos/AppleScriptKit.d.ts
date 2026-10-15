import type { NSBundle } from './Foundation'

import { NSObject } from './Runtime'



export declare class ASKPluginObject extends NSObject {
  static pluginDidLoad(bundle: NSBundle): void;
}
