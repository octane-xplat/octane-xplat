package com.octanexplat.tasks;

import android.content.Context;
import androidx.work.*;
import com.tns.Utils;
import java.util.concurrent.TimeUnit;

public class TaskScheduler {
	public static void schedule(String name, long intervalSeconds) {
		long interval = Math.max(intervalSeconds, 15 * 60); // WorkManager floor
		PeriodicWorkRequest request = new PeriodicWorkRequest.Builder(TaskWorker.class, interval, TimeUnit.SECONDS)
			.addTag("xplat:" + name)
			.build();
		WorkManager.getInstance(context())
			.enqueueUniquePeriodicWork("xplat:" + name, ExistingPeriodicWorkPolicy.UPDATE, request);
	}

	public static void cancel(String name) {
		WorkManager.getInstance(context()).cancelUniqueWork("xplat:" + name);
	}

	private static Context context() {
		return Utils.getApplicationContext();
	}
}
