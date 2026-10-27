package com.octanexplat.tasks;

import android.content.Context;
import androidx.work.*;
import com.tns.Runtime;

public class TaskWorker extends Worker {
	public TaskWorker(Context context, WorkerParameters params) {
		super(context, params);
	}

	@Override
	public Result doWork() {
		String name = getTags().stream()
			.filter(t -> t.startsWith("xplat:"))
			.map(t -> t.substring(6))
			.findFirst()
			.orElse(null);
		if (name == null) {
			return Result.failure();
		}
		Runtime runtime = Runtime.getCurrentRuntime();
		if (runtime == null) {
			// Cold start: the runtime isn't up — WorkManager retry re-runs us.
			return Result.retry();
		}
		final boolean[] done = { false };
		final boolean[] ok = { false };
		runtime.runOnJSThread(() -> {
			try {
				Object fn = ((com.tns.Runtime) runtime).callJSMethod(
					com.tns.Runtime.getCurrentRuntime(),
					"global.__xplatBackgroundTaskRun",
					Object.class,
					name,
					(com.tns.CompletionListener) null);
				ok[0] = !"failed".equals(String.valueOf(fn));
			} catch (Throwable ignored) {
			} finally {
				done[0] = true;
			}
		});
		long waited = 0;
		while (!done[0] && waited < 25_000) {
			try { Thread.sleep(50); } catch (InterruptedException e) { break; }
			waited += 50;
		}
		return ok[0] ? Result.success() : Result.retry();
	}
}
