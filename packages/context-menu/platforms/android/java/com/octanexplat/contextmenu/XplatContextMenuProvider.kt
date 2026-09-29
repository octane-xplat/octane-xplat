// Adapted from @expo/ui (MIT) — Copyright 2025-present 650 Industries.
// Upstream: expo/packages/expo-ui/android/.../ui/menu/DropdownMenu.kt,
// DropdownMenuItem.kt, DropdownMenuRecords.kt (sdk-57).
// The ExpoModules glue (ComposeProps records, slot views, ModifierRegistry)
// is replaced by the @nativescript/jetpack-compose provider contract:
// updateData(Map) + onEvent. The trigger child is a registered
// NativeScript view hosted through AndroidView — XplatViewRegistry is the
// leaf-side counterpart of iOS's NativeScriptViewFactory-by-id.

package com.octanexplat.contextmenu

import android.view.View
import android.view.ViewGroup
import androidx.compose.foundation.layout.Box
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.viewinterop.AndroidView
import org.json.JSONObject
import java.lang.ref.WeakReference

/** id → NativeScript view registry, callable directly from JS
 *  (`com.octanexplat.contextmenu.XplatViewRegistry.register`). The leaf's
 *  TSRX wrapper registers the trigger host's android.view.View before the
 *  ComposeView reads it back inside AndroidView. Weak refs — JS owns the
 *  view's real lifecycle and unregisters on unmount. */
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

private data class ContextMenuItemSpec(
	val id: String,
	val title: String,
	val destructive: Boolean,
	val disabled: Boolean,
	val divider: Boolean,
)

private data class ContextMenuUiState(
	val triggerId: String = "",
	val expanded: Boolean = false,
	val items: List<ContextMenuItemSpec> = emptyList(),
)

private fun Any?.asBoolean(): Boolean = when (this) {
	is Boolean -> this
	is Number -> toInt() != 0
	else -> false
}

private fun Any?.asList(): List<Any?> = when (this) {
	is org.json.JSONArray -> (0 until length()).map { get(it) }
	is List<*> -> this
	else -> emptyList()
}

private fun Any?.field(key: String): Any? = when (this) {
	is org.json.JSONObject -> if (has(key)) get(key) else null
	is Map<*, *> -> this[key]
	else -> null
}

private fun parseItems(raw: Any?): List<ContextMenuItemSpec> {
	return raw.asList().mapNotNull { entry ->
		entry ?: return@mapNotNull null
		ContextMenuItemSpec(
			id = entry.field("id") as? String ?: return@mapNotNull null,
			title = entry.field("title") as? String ?: "",
			destructive = entry.field("destructive").asBoolean(),
			disabled = entry.field("disabled").asBoolean(),
			divider = entry.field("divider").asBoolean(),
		)
	}
}

@Composable
private fun ContextMenuContent(state: ContextMenuUiState, onDismiss: () -> Unit, onSelect: (String) -> Unit) {
	Box {
		val triggerId = state.triggerId
		if (triggerId.isNotEmpty()) {
			AndroidView(
				factory = { ctx ->
					XplatViewRegistry.get(triggerId) ?: View(ctx).apply {
						layoutParams = ViewGroup.LayoutParams(0, 0)
					}
				},
			)
		}

		// Expanded is controlled: activation lives in the NativeScript touch
		// layer (the embedded subtree consumes pointer input before Compose
		// gesture detection can resolve it), dismissal is reported back so
		// the JS side can close the loop.
		DropdownMenu(
			expanded = state.expanded,
			onDismissRequest = onDismiss,
		) {
			state.items.forEach { item ->
				if (item.divider) {
					HorizontalDivider()
				}
				DropdownMenuItem(
					text = { Text(item.title) },
					enabled = !item.disabled,
					onClick = {
						onSelect(item.id)
					},
				)
			}
		}
	}
}

class XplatContextMenuProvider {
	private var state by mutableStateOf(ContextMenuUiState())
	var onEvent: ((Any) -> Unit)? = null

	fun generateComposeView(view: ComposeView) {
		view.setContent {
			MaterialTheme {
				ContextMenuContent(
					state = state,
					onDismiss = { onEvent?.invoke(JSONObject().put("dismissed", true)) },
					onSelect = { id -> onEvent?.invoke(JSONObject().put("item", id)) },
				)
			}
		}
	}

	fun updateData(input: Map<Any, Any>) {
		val data = input["data"] as? Map<*, *> ?: input
		state = ContextMenuUiState(
			triggerId = data["triggerId"] as? String ?: "",
			expanded = data["expanded"].asBoolean(),
			items = parseItems(data["items"]),
		)
	}
}
