// Adapted from @expo/ui (MIT) — Copyright 2025-present 650 Industries.
// Upstream: expo/packages/expo-ui/android/.../ui/DatePickerView.kt (sdk-57).
// The ExpoModules glue (@OptimizedRecord/@OptimizedComposeProps records,
// ModifierRegistry, AsyncFunctionHandle) is replaced by the
// @nativescript/jetpack-compose provider contract: updateData(Map) + onEvent.
// Colors arrive as CSS hex strings instead of expo ColorValue ints. The
// dialog wrappers (DatePickerDialog/TimePickerDialog) are not ported; the
// inline DatePicker/TimePicker composables cover this leaf's contract.

package com.octanexplat.datepicker

import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDefaults
import androidx.compose.material3.DatePickerState
import androidx.compose.material3.DisplayMode
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.SelectableDates
import androidx.compose.material3.TimePicker
import androidx.compose.material3.TimePickerDefaults
import androidx.compose.material3.TimePickerLayoutType
import androidx.compose.material3.TimePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.LocalConfiguration
import org.json.JSONObject
import java.util.Calendar
import java.util.Date

private fun Any?.asBoolean(): Boolean = when (this) {
	is Boolean -> this
	is Number -> toInt() != 0
	else -> false
}

private fun Any?.asLong(): Long? = when (this) {
	is Number -> toLong()
	else -> null
}

private fun Any?.asColor(): Color? = when (this) {
	is String -> runCatching { Color(android.graphics.Color.parseColor(this)) }.getOrNull()
	else -> null
}

private data class SelectableRange(
	val start: Long? = null,
	val end: Long? = null,
)

private data class DatePickerUiState(
	val initialDate: Long? = null,
	val variant: String = "picker",
	val displayedComponents: String = "date",
	val showVariantToggle: Boolean = true,
	val is24Hour: Boolean = true,
	val color: Color? = null,
	val elementColors: Map<*, *> = emptyMap<Any?, Any?>(),
	val selectableDates: SelectableRange = SelectableRange(),
)

private fun toUtcDayMillis(localMillis: Long): Long {
	val cal = Calendar.getInstance()
	cal.timeInMillis = localMillis
	val utcCal = Calendar.getInstance(java.util.TimeZone.getTimeZone("UTC"))
	utcCal.set(cal.get(Calendar.YEAR), cal.get(Calendar.MONTH), cal.get(Calendar.DAY_OF_MONTH), 0, 0, 0)
	utcCal.set(Calendar.MILLISECOND, 0)
	return utcCal.timeInMillis
}

// Material3 stores selectedDateMillis as UTC-midnight epoch; emitting it raw
// makes `new Date(ms)` resolve to the previous day in negative-UTC zones.
// Convert back to local-midnight millis so the JS-side Date lands on the
// calendar day the user picked.
private fun toLocalDayMillis(utcMillis: Long): Long {
	val utcCal = Calendar.getInstance(java.util.TimeZone.getTimeZone("UTC"))
	utcCal.timeInMillis = utcMillis
	val localCal = Calendar.getInstance()
	localCal.clear()
	localCal.set(utcCal.get(Calendar.YEAR), utcCal.get(Calendar.MONTH), utcCal.get(Calendar.DAY_OF_MONTH))
	return localCal.timeInMillis
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun rememberSelectableDates(range: SelectableRange): SelectableDates {
	val start = range.start
	val end = range.end
	return remember(start, end) {
		if (start != null || end != null) {
			val startUtcDayMillis = start?.let { toUtcDayMillis(it) }
			val endUtcDayMillis = end?.let { toUtcDayMillis(it) }
			val startYear = start?.let {
				val cal = Calendar.getInstance()
				cal.timeInMillis = it
				cal.get(Calendar.YEAR)
			}
			val endYear = end?.let {
				val cal = Calendar.getInstance()
				cal.timeInMillis = it
				cal.get(Calendar.YEAR)
			}
			object : SelectableDates {
				override fun isSelectableDate(utcTimeMillis: Long): Boolean {
					if (startUtcDayMillis != null && utcTimeMillis < startUtcDayMillis) return false
					if (endUtcDayMillis != null && utcTimeMillis > endUtcDayMillis) return false
					return true
				}

				override fun isSelectableYear(year: Int): Boolean {
					if (startYear != null && year < startYear) return false
					if (endYear != null && year > endYear) return false
					return true
				}
			}
		} else {
			DatePickerDefaults.AllDates
		}
	}
}

// `selectableDates` only greys out unselectable cells; the calendar's actual
// extent (months list, year grid, range content description) comes from
// `yearRange`. Derive it from min/max so the picker reflects the constraints
// instead of always spanning the 1900..2100 default.
// https://github.com/expo/expo/issues/47206
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun rememberDatePickerYearRange(range: SelectableRange, initialDateMillis: Long): IntRange {
	val start = range.start
	val end = range.end
	return remember(start, end, initialDateMillis) {
		val defaults = DatePickerDefaults.YearRange
		val yearOf = { millis: Long ->
			Calendar.getInstance().apply { timeInMillis = millis }.get(Calendar.YEAR)
		}
		val startYear = start?.let(yearOf) ?: defaults.first
		val endYear = end?.let(yearOf) ?: defaults.last
		val initialYear = yearOf(initialDateMillis)
		minOf(startYear, initialYear)..maxOf(endYear, initialYear)
	}
}

private fun Map<*, *>.color(name: String): Color? = this[name].asColor()

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun buildDatePickerColors(
	elementColors: Map<*, *>,
	colorProp: Color?,
): androidx.compose.material3.DatePickerColors {
	val defaults = DatePickerDefaults.colors()
	return defaults.copy(
		containerColor = elementColors.color("containerColor") ?: defaults.containerColor,
		titleContentColor = elementColors.color("titleContentColor") ?: colorProp ?: defaults.titleContentColor,
		headlineContentColor = elementColors.color("headlineContentColor") ?: colorProp ?: defaults.headlineContentColor,
		weekdayContentColor = elementColors.color("weekdayContentColor") ?: defaults.weekdayContentColor,
		subheadContentColor = elementColors.color("subheadContentColor") ?: defaults.subheadContentColor,
		navigationContentColor = elementColors.color("navigationContentColor") ?: defaults.navigationContentColor,
		yearContentColor = elementColors.color("yearContentColor") ?: defaults.yearContentColor,
		disabledYearContentColor = elementColors.color("disabledYearContentColor") ?: defaults.disabledYearContentColor,
		currentYearContentColor = elementColors.color("currentYearContentColor") ?: defaults.currentYearContentColor,
		selectedYearContentColor = elementColors.color("selectedYearContentColor") ?: defaults.selectedYearContentColor,
		disabledSelectedYearContentColor = elementColors.color("disabledSelectedYearContentColor") ?: defaults.disabledSelectedYearContentColor,
		selectedYearContainerColor = elementColors.color("selectedYearContainerColor") ?: defaults.selectedYearContainerColor,
		disabledSelectedYearContainerColor = elementColors.color("disabledSelectedYearContainerColor") ?: defaults.disabledSelectedYearContainerColor,
		dayContentColor = elementColors.color("dayContentColor") ?: defaults.dayContentColor,
		disabledDayContentColor = elementColors.color("disabledDayContentColor") ?: defaults.disabledDayContentColor,
		selectedDayContentColor = elementColors.color("selectedDayContentColor") ?: defaults.selectedDayContentColor,
		disabledSelectedDayContentColor = elementColors.color("disabledSelectedDayContentColor") ?: defaults.disabledSelectedDayContentColor,
		selectedDayContainerColor = elementColors.color("selectedDayContainerColor") ?: colorProp ?: defaults.selectedDayContainerColor,
		disabledSelectedDayContainerColor = elementColors.color("disabledSelectedDayContainerColor") ?: defaults.disabledSelectedDayContainerColor,
		todayContentColor = elementColors.color("todayContentColor") ?: defaults.todayContentColor,
		todayDateBorderColor = elementColors.color("todayDateBorderColor") ?: colorProp ?: defaults.todayDateBorderColor,
		dayInSelectionRangeContentColor = elementColors.color("dayInSelectionRangeContentColor") ?: defaults.dayInSelectionRangeContentColor,
		dayInSelectionRangeContainerColor = elementColors.color("dayInSelectionRangeContainerColor") ?: defaults.dayInSelectionRangeContainerColor,
		dividerColor = elementColors.color("dividerColor") ?: defaults.dividerColor,
	)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun buildTimePickerColors(
	elementColors: Map<*, *>,
	colorProp: Color?,
): androidx.compose.material3.TimePickerColors {
	val defaults = TimePickerDefaults.colors()
	return defaults.copy(
		containerColor = elementColors.color("containerColor") ?: defaults.containerColor,
		clockDialColor = elementColors.color("clockDialColor") ?: colorProp?.copy(alpha = 0.3f) ?: defaults.clockDialColor,
		clockDialSelectedContentColor = elementColors.color("clockDialSelectedContentColor") ?: defaults.clockDialSelectedContentColor,
		clockDialUnselectedContentColor = elementColors.color("clockDialUnselectedContentColor") ?: defaults.clockDialUnselectedContentColor,
		selectorColor = elementColors.color("selectorColor") ?: colorProp ?: defaults.selectorColor,
		periodSelectorBorderColor = elementColors.color("periodSelectorBorderColor") ?: defaults.periodSelectorBorderColor,
		periodSelectorSelectedContainerColor = elementColors.color("periodSelectorSelectedContainerColor") ?: defaults.periodSelectorSelectedContainerColor,
		periodSelectorUnselectedContainerColor = elementColors.color("periodSelectorUnselectedContainerColor") ?: defaults.periodSelectorUnselectedContainerColor,
		periodSelectorSelectedContentColor = elementColors.color("periodSelectorSelectedContentColor") ?: defaults.periodSelectorSelectedContentColor,
		periodSelectorUnselectedContentColor = elementColors.color("periodSelectorUnselectedContentColor") ?: defaults.periodSelectorUnselectedContentColor,
		timeSelectorSelectedContainerColor = elementColors.color("timeSelectorSelectedContainerColor") ?: colorProp ?: defaults.timeSelectorSelectedContainerColor,
		timeSelectorUnselectedContainerColor = elementColors.color("timeSelectorUnselectedContainerColor") ?: defaults.timeSelectorUnselectedContainerColor,
		timeSelectorSelectedContentColor = elementColors.color("timeSelectorSelectedContentColor") ?: defaults.timeSelectorSelectedContentColor,
		timeSelectorUnselectedContentColor = elementColors.color("timeSelectorUnselectedContentColor") ?: defaults.timeSelectorUnselectedContentColor,
	)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ExpoDatePicker(modifier: Modifier = Modifier, state: DatePickerUiState, onDateSelected: (Long?) -> Unit) {
	val locale = LocalConfiguration.current.locales[0]
	val displayMode = if (state.variant == "input") DisplayMode.Input else DisplayMode.Picker
	val fallbackDate = remember { Date().time }
	val initialDate = state.initialDate ?: fallbackDate
	val selectableDates = rememberSelectableDates(state.selectableDates)
	val yearRange = rememberDatePickerYearRange(state.selectableDates, initialDate)

	val pickerState = remember(displayMode, initialDate, selectableDates, yearRange) {
		DatePickerState(
			initialDisplayMode = displayMode,
			locale = locale,
			initialSelectedDateMillis = state.initialDate,
			initialDisplayedMonthMillis = initialDate,
			yearRange = yearRange,
			selectableDates = selectableDates,
		)
	}

	LaunchedEffect(pickerState.selectedDateMillis) {
		onDateSelected(pickerState.selectedDateMillis)
	}

	val colors = buildDatePickerColors(state.elementColors, state.color)

	// Material3's year-selector chevron tints from the ambient
	// LocalContentColor (which defaults to black), not
	// `navigationContentColor`; bind the local so the chevron honors the
	// navigation color.
	CompositionLocalProvider(LocalContentColor provides colors.navigationContentColor) {
		DatePicker(
			modifier = modifier,
			state = pickerState,
			showModeToggle = state.showVariantToggle,
			colors = colors,
		)
	}
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ExpoTimePicker(modifier: Modifier = Modifier, state: DatePickerUiState, onDateSelected: (Long?) -> Unit) {
	val initialDate = state.initialDate

	val pickerState = remember(initialDate, state.is24Hour) {
		val cal = Calendar.getInstance()
		cal.isLenient = false
		if (initialDate != null) {
			cal.timeInMillis = initialDate
		}
		TimePickerState(
			initialHour = cal.get(Calendar.HOUR_OF_DAY),
			initialMinute = cal.get(Calendar.MINUTE),
			is24Hour = state.is24Hour,
		)
	}

	LaunchedEffect(pickerState.hour, pickerState.minute) {
		val cal = Calendar.getInstance()
		cal.isLenient = false
		if (initialDate != null) {
			cal.timeInMillis = initialDate
		}
		cal.set(Calendar.HOUR_OF_DAY, pickerState.hour)
		cal.set(Calendar.MINUTE, pickerState.minute)
		onDateSelected(cal.time.time)
	}

	TimePicker(
		modifier = modifier,
		state = pickerState,
		layoutType = TimePickerLayoutType.Vertical,
		colors = buildTimePickerColors(state.elementColors, state.color),
	)
}

class XplatDatePickerProvider {
	private var state by mutableStateOf(DatePickerUiState())
	var onEvent: ((Any) -> Unit)? = null

	fun generateComposeView(view: ComposeView) {
		view.setContent {
			MaterialTheme {
				if (state.displayedComponents == "hourAndMinute") {
					ExpoTimePicker(state = state) { millis ->
						onEvent?.invoke(JSONObject().put("date", millis ?: JSONObject.NULL))
					}
				} else {
					ExpoDatePicker(state = state) { millis ->
						onEvent?.invoke(
							JSONObject().put(
								"date",
								millis?.let { toLocalDayMillis(it) } ?: JSONObject.NULL,
							),
						)
					}
				}
			}
		}
	}

	fun updateData(input: Map<Any, Any>) {
		val data = input["data"] as? Map<*, *> ?: input
		val range = data["selectableDates"] as? Map<*, *>
		state = DatePickerUiState(
			initialDate = data["initialDate"].asLong(),
			variant = data["variant"] as? String ?: "picker",
			displayedComponents = data["displayedComponents"] as? String ?: "date",
			showVariantToggle = data["showVariantToggle"]?.asBoolean() ?: true,
			is24Hour = data["is24Hour"]?.asBoolean() ?: true,
			color = data["color"].asColor(),
			elementColors = data["elementColors"] as? Map<*, *> ?: emptyMap<Any?, Any?>(),
			selectableDates = SelectableRange(
				start = range?.get("start").asLong(),
				end = range?.get("end").asLong(),
			),
		)
	}
}
