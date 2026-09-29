// Adapted from @expo/ui (MIT) — Copyright 2025-present 650 Industries.
// Upstream: expo/packages/expo-ui/android/.../ui/ModalBottomSheetView.kt
// (sdk-57). The ExpoModules glue (ComposeProps records, async-function
// handles, slot views, ModifierRegistry) is replaced by the
// @nativescript/jetpack-compose provider contract: updateData(Map) + onEvent.
// The sheet's content is a registered NativeScript view hosted through
// AndroidView — XplatViewRegistry mirrors the context-menu leaf's registry
// (same mechanism, kept leaf-local while the shared-bridge question is open).

@file:OptIn(ExperimentalMaterial3Api::class)

package com.octanexplat.sheet

import android.app.Activity
import android.app.Dialog
import android.content.Context
import android.view.KeyEvent
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.InputMethodManager
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.BottomSheetDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.ModalBottomSheetProperties
import androidx.compose.material3.contentColorFor
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.window.DialogWindowProvider
import org.json.JSONObject
import java.lang.ref.WeakReference

/** id → NativeScript view registry, callable directly from JS
 *  (`com.octanexplat.sheet.XplatViewRegistry.register`). Same mechanism as
 *  the context-menu leaf's registry — the sheet content subtree embeds in
 *  the modal sheet's dialog window through AndroidView. Weak refs; JS owns
 *  the lifecycle and unregisters on unmount. */
object XplatViewRegistry {
	private val views = HashMap<String, WeakReference<View>>()

	@JvmStatic
	fun register(id: String, view: View) {
		views[id] = WeakReference(view)
	}

	@JvmStatic
	fun unregister(id: String) {
		views.remove(id)
	}

	@JvmStatic
	fun get(id: String): View? = views[id]?.get()
}

private data class SheetUiState(
	val open: Boolean = false,
	val contentId: String = "",
	val skipPartiallyExpanded: Boolean = false,
	val showDragHandle: Boolean = true,
	val sheetGesturesEnabled: Boolean = true,
	val shouldDismissOnBackPress: Boolean = true,
	val shouldDismissOnClickOutside: Boolean = true,
	val containerColor: Int? = null,
	val contentColor: Int? = null,
	val scrimColor: Int? = null,
)

private fun Any?.asBoolean(): Boolean = when (this) {
	is Boolean -> this
	is Number -> toInt() != 0
	else -> false
}

private fun Any?.asColorInt(): Int? = when (this) {
	is Number -> toInt()
	is String -> runCatching { android.graphics.Color.parseColor(this) }.getOrNull()
	else -> null
}

/** True while the input method has an active connection to a view that
 *  accepts text — ported from Expo's ModalBottomSheetView. */
private fun Activity.isAcceptingText(): Boolean {
	val inputMethodManager = getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager
	return inputMethodManager?.isAcceptingText == true
}

/** Ported: the sheet lives in its own dialog window, so key events that the
 *  activity owns (e.g. dev-menu triggers) stop reaching it while the sheet
 *  is open — forward non-dismiss keys back, skipping while a field accepts
 *  text so typing can't trigger activity shortcuts. */
@Composable
private fun ForwardKeyEventsToActivity(activity: Activity?) {
	val dialog = (LocalView.current.parent as? DialogWindowProvider)?.window?.callback as? Dialog
	if (dialog == null || activity == null) {
		return
	}
	DisposableEffect(dialog, activity) {
		dialog.setOnKeyListener { _, keyCode, event ->
			val isForwardable = event.action == KeyEvent.ACTION_UP &&
				keyCode != KeyEvent.KEYCODE_BACK &&
				keyCode != KeyEvent.KEYCODE_ESCAPE &&
				!activity.isAcceptingText()
			isForwardable && activity.onKeyUp(keyCode, event)
		}
		onDispose {
			dialog.setOnKeyListener(null)
		}
	}
}

@Composable
private fun SheetContent(state: SheetUiState, activity: Activity?, onDismiss: () -> Unit) {
	if (!state.open) {
		return
	}
	val sheetState = rememberModalBottomSheetState(state.skipPartiallyExpanded)
	val resolvedContainer = state.containerColor?.let { androidx.compose.ui.graphics.Color(it) }
		?: BottomSheetDefaults.ContainerColor
	val resolvedContent = state.contentColor?.let { androidx.compose.ui.graphics.Color(it) }
		?: contentColorFor(resolvedContainer)
	val resolvedScrim = state.scrimColor?.let { androidx.compose.ui.graphics.Color(it) }
		?: BottomSheetDefaults.ScrimColor

	// This material3 predates sheetGesturesEnabled and
	// shouldDismissOnClickOutside — only shouldDismissOnBackPress is
	// carried through properties.
	ModalBottomSheet(
		sheetState = sheetState,
		onDismissRequest = onDismiss,
		containerColor = resolvedContainer,
		contentColor = resolvedContent,
		scrimColor = resolvedScrim,
		dragHandle = if (state.showDragHandle) {
			{ BottomSheetDefaults.DragHandle() }
		} else {
			null
		},
		properties = ModalBottomSheetProperties(
			shouldDismissOnBackPress = state.shouldDismissOnBackPress,
		),
	) {
		ForwardKeyEventsToActivity(activity)
		Box(modifier = Modifier.fillMaxWidth()) {
			val contentId = state.contentId
			if (contentId.isNotEmpty()) {
				AndroidView(
					factory = { ctx ->
						XplatViewRegistry.get(contentId) ?: View(ctx).apply {
							layoutParams = ViewGroup.LayoutParams(0, 0)
						}
					},
				)
			}
		}
	}
}

class XplatSheetProvider {
	private var state by mutableStateOf(SheetUiState())
	var onEvent: ((Any) -> Unit)? = null

	fun generateComposeView(view: ComposeView) {
		view.setContent {
			androidx.compose.material3.MaterialTheme {
				SheetContent(
					state = state,
					activity = (view.context as? Activity),
					onDismiss = { onEvent?.invoke(JSONObject().put("dismissed", true)) },
				)
			}
		}
	}

	fun updateData(input: Map<Any, Any>) {
		val data = input["data"] as? Map<*, *> ?: input
		state = SheetUiState(
			open = data["open"].asBoolean(),
			contentId = data["contentId"] as? String ?: "",
			skipPartiallyExpanded = data["skipPartiallyExpanded"].asBoolean(),
			showDragHandle = if (data.containsKey("showDragHandle")) data["showDragHandle"].asBoolean() else true,
			sheetGesturesEnabled = if (data.containsKey("sheetGesturesEnabled")) data["sheetGesturesEnabled"].asBoolean() else true,
			shouldDismissOnBackPress = if (data.containsKey("shouldDismissOnBackPress")) data["shouldDismissOnBackPress"].asBoolean() else true,
			shouldDismissOnClickOutside = if (data.containsKey("shouldDismissOnClickOutside")) data["shouldDismissOnClickOutside"].asBoolean() else true,
			containerColor = data["containerColor"].asColorInt(),
			contentColor = data["contentColor"].asColorInt(),
			scrimColor = data["scrimColor"].asColorInt(),
		)
	}
}
