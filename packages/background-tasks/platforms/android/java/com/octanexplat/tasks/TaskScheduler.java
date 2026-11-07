package com.octanexplat.tasks;

import android.content.Context;
import androidx.work.*;
import java.util.concurrent.TimeUnit;

public class TaskScheduler {
	public static void schedule(Context context, String name, long intervalSeconds) {
		long interval = Math.max(intervalSeconds, 15 * 60); // WorkManager floor
		PeriodicWorkRequest request = new PeriodicWorkRequest.Builder(TaskWorker.class, interval, TimeUnit.SECONDS)
			.addTag("xplat:" + name)
			.build();
		WorkManager.getInstance(context.getApplicationContext())
			.enqueueUniquePeriodicWork("xplat:" + name, ExistingPeriodicWorkPolicy.UPDATE, request);
	}

	public static void cancel(Context context, String name) {
		WorkManager.getInstance(context.getApplicationContext()).cancelUniqueWork("xplat:" + name);
	}
}
