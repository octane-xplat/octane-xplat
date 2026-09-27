package com.xplat.mediaprobe

import android.content.Context
import com.swmansion.pulsar.CompatibilityMode
import com.swmansion.pulsar.ConfigPoint
import com.swmansion.pulsar.ContinuousPattern
import com.swmansion.pulsar.PatternData
import com.swmansion.pulsar.Pulsar
import com.swmansion.pulsar.ValuePoint
import java.util.WeakHashMap

object PulsarBridge {
	private val pulsars = WeakHashMap<Context, Pulsar>()

	private fun pulsar(context: Context) =
		pulsars.getOrPut(context.applicationContext) { Pulsar(context.applicationContext) }

	@JvmStatic
	fun playPreset(context: Context) {
		val sdk = pulsar(context)
		if (sdk.hapticSupport() >= CompatibilityMode.STANDARD_SUPPORT) {
			sdk.getPresets().getByName("Success")?.play()
		}
	}

	@JvmStatic
	fun playCustomPattern(context: Context) {
		val sdk = pulsar(context)
		val pattern = PatternData(
			continuousPattern = ContinuousPattern(
				amplitude = listOf(
					ValuePoint(time = 0, value = 0f),
					ValuePoint(time = 90, value = 0.8f),
					ValuePoint(time = 220, value = 0f),
				),
				frequency = listOf(
					ValuePoint(time = 0, value = 0.4f),
					ValuePoint(time = 220, value = 0.8f),
				),
			),
			discretePattern = listOf(ConfigPoint(time = 35, amplitude = 1f, frequency = 0.6f)),
		)
		pulsar(context).getPatternComposer().apply {
			parsePattern(pattern)
			play()
		}
	}

	@JvmStatic
	fun setRealtime(context: Context, amplitude: Double, frequency: Double) {
		pulsar(context).getRealtimeComposer().set(amplitude.toFloat(), frequency.toFloat())
	}

	@JvmStatic
	fun stopRealtime(context: Context) {
		pulsar(context).getRealtimeComposer().stop()
	}
}
