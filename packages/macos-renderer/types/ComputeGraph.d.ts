/// <reference types="@nativescript/objc-node-api" />

declare class Viewpoint {
  constructor(init?: Viewpoint);
  position: unknown /* ext vector */;
  direction: unknown /* ext vector */;
  has_position: boolean;
  has_direction: boolean;
}

declare class MouseParams {
  constructor(init?: MouseParams);
  position: unknown /* ext vector */;
  direction: unknown /* ext vector */;
  has_value: boolean;
}

