package com.octanexplat.tasks;

import android.content.Context;
import androidx.work.*;
import com.tns.Runtime;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

public class TaskWorker extends Worker {
	private static final long RESULT_TIMEOUT_MS = 25_000;

	// Implemented by the JS module. Calls dispatched from Java run on the JS
	// thread through the NativeScript proxy and block until it returns.
	public interface TaskRunner {
		void run(String name, TaskOutcome outcome);
	}

	// The JS side reports the executor's settled result through onResult;
	// the first report wins and releases the waiting worker thread.
	public static class TaskOutcome {
		private final CountDownLatch done = new CountDownLatch(1);
		private volatile String result = "failed";

		public void onResult(String value) {
			if (done.getCount() == 0) {
				return;
			}
			result = value == null ? "failed" : value;
			done.countDown();
		}

		String result() {
			return result;
		}

		boolean await() throws InterruptedException {
			return done.await(RESULT_TIMEOUT_MS, TimeUnit.MILLISECONDS);
		}
	}

	private static volatile TaskRunner runner;

	// The JS module registers its runner at evaluation time — the supported
	// Java→JS bridge needs a JS-implemented object, not a global function.
	public static void setTaskRunner(TaskRunner taskRunner) {
		runner = taskRunner;
	}

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
		if (Runtime.getCurrentRuntime() == null) {
			// Cold start: the runtime isn't up — WorkManager retry re-runs us.
			return Result.retry();
		}
		TaskRunner taskRunner = runner;
		if (taskRunner == null) {
			// Warm runtime whose module evaluation never registered a runner.
			return Result.retry();
		}
		TaskOutcome outcome = new TaskOutcome();
		try {
			taskRunner.run(name, outcome);
		} catch (Throwable t) {
			return Result.retry();
		}
		try {
			if (!outcome.await()) {
				return Result.retry();
			}
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
			return Result.retry();
		}
		return "success".equals(outcome.result()) ? Result.success() : Result.retry();
	}
}
