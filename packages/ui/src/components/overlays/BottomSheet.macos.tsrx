/** @jsxImportSource @octane-xplat/jsx */
import { SheetContent } from './sheet-content.tsrx'
import { mergeStyle, styleRecord } from '../../internal/layout/style-merge'
import { useState } from 'octane'
import type { BottomSheetProps } from '../../props'

import { cx } from '@octane-xplat/lib'

import { LayerDepthProvider, useLayerDismissal } from './layer-dismissal.tsrx'
import { usePresentation } from './presentation.macos.tsrx'

function SheetPanel(props: BottomSheetProps & { dark?: boolean; layerDepth?: number }) @{
  <LayerDepthProvider value={props.layerDepth ?? 0}>
    <masonview
      id={props.id}
      className={cx('vx-sheet', 'vx-bottom-sheet', props.dark && 'ns-dark', props.className)}
      style={mergeStyle({ flexDirection: 'column' }, mergeStyle({ display: 'flex' }, props.style))}
    >
      <label className="vx-sheet-grabber" accessibilityLabel="Drag to resize sheet">
        ―
      </label>
      <scrollview>
        <SheetContent>{props.children}</SheetContent>
      </scrollview>
    </masonview>
  </LayerDepthProvider>
}

function PresentedSheet(props: BottomSheetProps) @{
  const dismissal = useLayerDismissal({
    get active() {
      return !!props.isOpen
    },
    dismiss: () => props.onOpenChange?.(false),
    get behavior() {
      return props.purpose === 'required' ? 'block' : 'close'
    },
    getFocusTarget: () => props.finalFocusRef?.current,
    restoreFocus: false,
  })

  const panelProps = { ...props, layerDepth: dismissal.depth }
  const owner = usePresentation(Boolean(props.isOpen), SheetPanel, panelProps, {
    kind: 'sheet',
    width: styleRecord(props.style).width,
    modal: props.hasScrim ?? true,
    purpose: props.purpose,
    height: props.height,
    snapPoints: props.snapPoints,
    label: props.label,
    finalFocusRef: props.finalFocusRef,
    canDismiss: () => dismissal.shouldClose(),
    onDismiss: () => props.onOpenChange?.(false),
  })

  <>{owner}</>
}

export function BottomSheet(props: BottomSheetProps): unknown @{
  const [internal, setInternal] = useState(props.defaultOpen ?? false)
  const open = props.isOpen ?? internal
  const requestChange = (isOpen: boolean) => {
    if (props.isOpen === undefined) {
      setInternal(isOpen)
    }

    props.onOpenChange?.(isOpen)
  }

  <PresentedSheet {...props} isOpen={open} onOpenChange={requestChange} />
}
