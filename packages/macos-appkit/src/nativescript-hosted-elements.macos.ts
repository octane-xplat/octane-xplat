import { Image, Property, View, booleanConverter } from '@nativescript/core'
import { eventNameFor, registerElement } from '@octane-xplat/nativescript-octane'
import type { AVPlayerView, NSImageView, NSScrollView } from '@octane-xplat/platform/macos'
import { disposePagerView, makePagerView, updatePagerView } from './pager'
import { disposeVideoView, makeVideoView, syncVideoView } from './video'

const autoPlayAnimationsProperty = new Property<AppKitAnimatedImage, boolean>({
  name: 'autoPlayAnimations',
  defaultValue: true,
  valueConverter: booleanConverter,
})

class AppKitAnimatedImage extends Image {
  declare nativeViewProtected: NSImageView
  declare autoPlayAnimations: boolean

  initNativeView() {
    super.initNativeView()
    this.nativeViewProtected.animates = this.autoPlayAnimations
  }

  disposeNativeView() {
    this.nativeViewProtected.animates = false
    super.disposeNativeView()
  }

  [autoPlayAnimationsProperty.setNative](value: boolean) {
    this.nativeViewProtected.animates = value
  }
}
autoPlayAnimationsProperty.register(AppKitAnimatedImage)

type PageTargetCallback = (event: unknown) => void

const pagerItemsProperty = new Property<AppKitPager, readonly unknown[]>({ name: 'items' })
const pagerIndexProperty = new Property<AppKitPager, number>({ name: 'selectedIndex', defaultValue: 0 })
const pageTargetProperty = new Property<AppKitPager, PageTargetCallback>({ name: '__onCellTarget' })

class AppKitPager extends View {
  declare nativeViewProtected: NSScrollView
  declare items?: readonly unknown[]
  declare selectedIndex: number
  declare __onCellTarget?: PageTargetCallback

  createNativeView() {
    return makePagerView()
  }

  initNativeView() {
    super.initNativeView()
    this.sync()
  }

  disposeNativeView() {
    disposePagerView(this.nativeViewProtected)
    super.disposeNativeView()
  }

  private sync() {
    if (!this.nativeViewProtected) {
      return
    }
    const notify = (event: { eventName: string; value: number }) => {
      this.notify({ ...event, object: this })
    }
    updatePagerView(this.nativeViewProtected, {
      items: this.items,
      selectedIndex: this.selectedIndex,
      __onCellTarget: this.__onCellTarget,
      onSelectedIndexChange: notify,
      onItemLoading: notify,
      onItemDisposing: notify,
    })
  }

  [pagerItemsProperty.setNative]() {
    this.sync()
  }

  [pagerIndexProperty.setNative]() {
    this.sync()
  }

  [pageTargetProperty.setNative]() {
    this.sync()
  }
}

pagerItemsProperty.register(AppKitPager)
pagerIndexProperty.register(AppKitPager)
pageTargetProperty.register(AppKitPager)

const videoProperties = [
  'src',
  'controls',
  'headers',
  'loop',
  'autoplay',
  'muted',
  'fill',
  'observeCurrentTime',
].map((name) => new Property<AppKitVideo, unknown>({ name }))

class AppKitVideo extends View {
  declare nativeViewProtected: AVPlayerView

  createNativeView() {
    return makeVideoView()
  }

  initNativeView() {
    super.initNativeView()
    this.syncVideo()
  }

  disposeNativeView() {
    disposeVideoView(this.nativeViewProtected)
    super.disposeNativeView()
  }

  syncVideo() {
    if (!this.nativeViewProtected) {
      return
    }
    const props = Object.fromEntries(videoProperties.map(({ name }) => [name, Reflect.get(this, name)]))
    syncVideoView(this.nativeViewProtected, props, (name, payload) =>
      this.notify({ ...payload, object: this, eventName: eventNameFor(name) }),
    )
  }
}

for (const property of videoProperties) {
  property.register(AppKitVideo)
  Object.defineProperty(AppKitVideo.prototype, property.setNative, {
    value: AppKitVideo.prototype.syncVideo,
  })
}

let installed = false

export function installCoreHostedElements() {
  if (!installed) {
    installed = true
    registerElement('animatedimage', AppKitAnimatedImage)
    registerElement('pager', AppKitPager)
    registerElement('xplatvideo', AppKitVideo)
  }
}
