package com.octanexplat.nativepicker

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.unit.dp

private data class PickerOption(
	val value: String,
	val label: String,
	val disabled: Boolean,
)

private data class PickerState(
	val label: String = "",
	val accessibilityLabel: String = "",
	val value: String = "",
	val disabled: Boolean = false,
	val options: List<PickerOption> = emptyList(),
)

private fun Any?.asBoolean(): Boolean = when (this) {
	is Boolean -> this
	is Number -> toInt() != 0
	else -> false
}

class XplatPickerProvider {
	private var state by mutableStateOf(PickerState())
	var onEvent: ((String) -> Unit)? = null

	fun generateComposeView(view: ComposeView) {
		view.setContent {
			MaterialTheme {
				PickerContent(
					state = state,
					onValueChange = { value -> onEvent?.invoke(value) },
				)
			}
		}
	}

	fun updateData(input: Map<Any, Any>) {
		val data = input["data"] as? Map<*, *> ?: input
		val options = (data["options"] as? List<*>)			.orEmpty()
			.mapNotNull { raw ->
				val option = raw as? Map<*, *> ?: return@mapNotNull null
				val value = option["value"] as? String ?: return@mapNotNull null
				val label = option["label"] as? String ?: return@mapNotNull null
				PickerOption(value, label, option["disabled"].asBoolean())
			}

		state = PickerState(
			label = data["label"] as? String ?: "",
			accessibilityLabel = data["accessibilityLabel"] as? String ?: "",
			value = data["value"] as? String ?: options.firstOrNull()?.value.orEmpty(),
			disabled = data["disabled"].asBoolean(),
			options = options,
		)
	}
}

@Composable
private fun PickerContent(state: PickerState, onValueChange: (String) -> Unit) {
	var expanded by remember { mutableStateOf(false) }
	val selectedLabel = state.options.firstOrNull { it.value == state.value }?.label.orEmpty()

	Row(
		modifier = Modifier
			.fillMaxWidth()
			.padding(horizontal = 12.dp, vertical = 4.dp)
			.semantics { contentDescription = state.accessibilityLabel },
		horizontalArrangement = Arrangement.SpaceBetween,
		verticalAlignment = Alignment.CenterVertically,
	) {
		Text(state.label)
		Box {
			Button(onClick = { expanded = !expanded }, enabled = !state.disabled) {
				Text(selectedLabel)
			}
			DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
				state.options.forEach { option ->
					DropdownMenuItem(
						text = { Text(option.label) },
						enabled = !option.disabled,
						onClick = {
							expanded = false
							onValueChange(option.value)
						},
					)
				}
			}
		}
	}
}
