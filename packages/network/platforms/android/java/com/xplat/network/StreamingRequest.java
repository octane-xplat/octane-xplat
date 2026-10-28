package com.xplat.network;

import android.os.Handler;
import android.os.Looper;
import android.util.Base64;
import java.net.URL;
import java.io.InputStream;
import java.util.concurrent.CountDownLatch;
import org.json.JSONObject;

/** One HTTP request; native reads never block the JS/main thread. */
public final class StreamingRequest {
	public interface Events { void onEvent(String json); }
	private final Handler main = new Handler(Looper.getMainLooper());
	private volatile boolean cancelled;
	private static final okhttp3.OkHttpClient client = new okhttp3.OkHttpClient.Builder()
		.followRedirects(false).followSslRedirects(false)
		.cookieJar(okhttp3.CookieJar.NO_COOKIES)
		.connectTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
		.readTimeout(30, java.util.concurrent.TimeUnit.SECONDS).build();
	private volatile okhttp3.Call call;
	private Thread worker;
	public void start(String encoded, Events events) {
		worker = new Thread(() -> {
			try {
				JSONObject options = new JSONObject(encoded);
				String url = options.getString("url");
				URL parsed = new URL(url);
				if ((!parsed.getProtocol().equals("https") && !parsed.getProtocol().equals("http")) || parsed.getUserInfo() != null) throw new Exception("Unsupported URL");
				okhttp3.Request.Builder request = new okhttp3.Request.Builder().url(url);
				JSONObject headers = options.getJSONObject("headers");
				for (java.util.Iterator<String> keys = headers.keys(); keys.hasNext();) { String key = keys.next(); request.header(key, headers.getString(key)); }
				String method = options.getString("method");
				byte[] bytes = options.has("body") ? Base64.decode(options.getString("body"), Base64.DEFAULT) : null;
				if (bytes == null && (method.equals("POST") || method.equals("PUT") || method.equals("PATCH"))) bytes = new byte[0];
				request.method(method, bytes == null ? null : okhttp3.RequestBody.create(null, bytes));
				call = client.newCall(request.build());
				if (cancelled) { call.cancel(); return; }
				try (okhttp3.Response response = call.execute()) {
					JSONObject responseHeaders = new JSONObject();
					for (String key : response.headers().names()) responseHeaders.put(key, String.join(", ", response.headers().values(key)));
					send(events, new JSONObject().put("type", "headers").put("status", response.code()).put("headers", responseHeaders));
					if (response.body() != null) try (InputStream input = response.body().byteStream()) {
						byte[] buffer = new byte[16384];
						int length;
						while (!cancelled && (length = input.read(buffer)) >= 0) {
							if (length > 0) send(events, new JSONObject().put("type", "data").put("data", Base64.encodeToString(buffer, 0, length, Base64.NO_WRAP)));
						}
					}
					send(events, new JSONObject().put("type", "end"));
				}
			} catch (Exception error) {
				try { send(events, new JSONObject().put("type", "error")); } catch (Exception ignored) { }
			} finally { call = null; }
		}, "xplat-http-stream");
		worker.start();
	}

	private void send(Events events, JSONObject event) throws InterruptedException {
		if (cancelled) return;
		String json = event.toString();
		CountDownLatch delivered = new CountDownLatch(1);
		main.post(() -> { try { if (!cancelled) events.onEvent(json); } finally { delivered.countDown(); } });
		// At most one native data callback is in flight while JS is busy/suspended.
		delivered.await();
	}
	public void cancel() {
		cancelled = true;
		if (call != null) call.cancel();
		if (worker != null) worker.interrupt();
	}
}
