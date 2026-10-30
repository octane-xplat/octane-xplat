export declare const GestureState: {
	UNDETERMINED: number
	FAILED: number
	BEGAN: number
	CANCELLED: number
	ACTIVE: number
	END: number
}

export declare const HandlerType: {
	PAN: string
}

export declare const GestureHandlerStateEvent = 'GestureHandlerStateEvent'
export declare const GestureHandlerTouchEvent = 'GestureHandlerTouchEvent'
export declare const handlers: any[]
export declare const Manager: {
	getInstance: () => {
		createGestureHandler(
			type: string,
			tag: number,
			options: any,
		): {
			type: string
			tag: number
			options: any
			node: any
			on: (name: string, fn: Function) => Map<string, Function>
			off: (name: string) => boolean
			attachToView(node: any): void
			detachFromView(): void
			emit: (name: string, data: any) => any
		}
	}
}
