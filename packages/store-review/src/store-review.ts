// Store review — native leaf. iOS bridges SKStoreReviewController directly
// (declare-const pattern, same as platform's auth-session); Android uses the
// Play ReviewManager pulled in by platforms/android/include.gradle.
import { Application, Utils, isIOS } from '@nativescript/core'
import type { StoreReview, StoreReviewConfig } from './types'

declare const SKStoreReviewController: any
declare const UIApplication: any

let config: StoreReviewConfig = {}

function iosRequestReview(): void {
	if (typeof SKStoreReviewController === 'undefined') {
		throw new Error('unsupported: SKStoreReviewController is not available')
	}
	// iOS 14+: scene-scoped prompt. UISceneActivationStateForegroundActive === 0.
	if (
		typeof SKStoreReviewController.requestReviewInScene === 'function' &&
		typeof UIApplication !== 'undefined'
	) {
		const all = UIApplication.sharedApplication?.connectedScenes?.allObjects
		for (let i = 0; i < (all?.count ?? 0); i++) {
			const scene = all.objectAtIndex(i)
			if (scene.activationState === 0) {
				SKStoreReviewController.requestReviewInScene(scene)
				return
			}
		}
	}
	SKStoreReviewController.requestReview()
}

// `Utils.android` is a {} stub in the pinned Windows core build — resolve the
// context/activity through the same fallback chain as platform/open-url.
const androidUtils = Utils.android as any
const androidContext = () => androidUtils?.getApplicationContext?.() ?? Application.android?.context
const androidActivity = () =>
	androidUtils?.getCurrentActivity?.() ?? Application.android?.foregroundActivity

function androidPackageName(): string {
	return (
		config.androidPackageName ??
		androidUtils?.getPackageName?.() ??
		androidContext()?.getPackageName() ??
		''
	)
}

function androidHasAction(): boolean {
	try {
		const intent = new android.content.Intent(
			android.content.Intent.ACTION_VIEW,
			android.net.Uri.parse('market://details?id=' + androidPackageName()),
		)

		return intent.resolveActivity(androidContext().getPackageManager()) != null
	} catch {
		return false
	}
}

function androidRequestReview(): Promise<void> {
	return new Promise((resolve, reject) => {
		const play = (globalThis as any).com?.google?.android?.play
		const tasks = (globalThis as any).com?.google?.android?.gms?.tasks
		const ReviewManagerFactory = play?.core?.review?.ReviewManagerFactory
		if (!ReviewManagerFactory || !tasks?.OnCompleteListener) {
			reject(new Error('unsupported: com.google.android.play:review is not on the classpath'))
			return
		}
		const activity = androidActivity()
		if (!activity) {
			reject(new Error('unsupported: no foreground activity to present the review flow'))
			return
		}
		const manager = ReviewManagerFactory.create(androidContext())
		manager.requestReviewFlow().addOnCompleteListener(
			new tasks.OnCompleteListener({
				onComplete: (task: any) => {
					try {
						if (!task.isSuccessful()) {
							reject(task.getException?.() ?? new Error('unsupported: review flow request failed'))
							return
						}

						manager
							.launchReviewFlow(activity, task.getResult())
							.addOnCompleteListener(new tasks.OnCompleteListener({ onComplete: () => resolve() }))
					} catch (e) {
						reject(e)
					}
				},
			}),
		)
	})
}

export const storeReview: StoreReview = {
	supported: isIOS ? typeof SKStoreReviewController !== 'undefined' : true,

	async isAvailable(): Promise<boolean> {
		if (isIOS) {
			return typeof SKStoreReviewController !== 'undefined'
		}
		return androidHasAction()
	},

	async requestReview(): Promise<void> {
		if (isIOS) {
			iosRequestReview()
			return
		}
		return androidRequestReview()
	},

	async hasAction(): Promise<boolean> {
		if (isIOS) {
			return typeof SKStoreReviewController !== 'undefined'
		}
		return androidHasAction()
	},

	storeUrl(): string {
		if (isIOS) {
			return config.iosAppStoreId ? `https://apps.apple.com/app/id${config.iosAppStoreId}` : ''
		}
		const pkg = androidPackageName()
		return pkg ? `https://play.google.com/store/apps/details?id=${pkg}` : ''
	},

	configure(options: StoreReviewConfig): void {
		config = { ...config, ...options }
	},
}
