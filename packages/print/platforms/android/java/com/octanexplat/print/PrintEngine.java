package com.octanexplat.print;

import android.app.Activity;
import android.app.Application;
import android.content.Context;
import android.graphics.pdf.PdfRenderer;
import android.net.Uri;
import android.os.Bundle;
import android.os.CancellationSignal;
import android.os.Handler;
import android.os.Looper;
import android.os.ParcelFileDescriptor;
import android.print.PageRange;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintDocumentInfo;
import android.print.PrintManager;
import android.print.XplatPrintLayoutCallback;
import android.print.XplatPrintWriteCallback;
import android.util.Base64;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashSet;
import java.util.UUID;
import org.json.JSONObject;

/** Owns WebView, descriptor and OS-adapter lifetimes separately from returned PDF files. */
public final class PrintEngine {
    public interface Completion { void complete(String json); }
    private final HashSet<String> owned = new HashSet<>();
    private Job active;
    private final Handler main = new Handler(Looper.getMainLooper());
    private static final int LIMIT = 64 * 1024 * 1024;
    public PrintEngine() {}
    public void render(Activity activity, String json, Completion callback) { start(activity, json, true, callback); }
    public void present(Activity activity, String json, Completion callback) { start(activity, json, false, callback); }
    private void start(Activity activity, String json, boolean export, Completion callback) {
        activity.runOnUiThread(() -> {
            if (active != null) { reply(callback, false, "ERR_PRINT_BUSY"); return; }
            try {
                Job job = new Job(activity, new JSONObject(json), export, callback);
                active = job; job.start();
            } catch (Exception error) {
                if (active != null) active.fail("ERR_PRINT_FAILED");
                else reply(callback, false, "ERR_PRINT_FAILED");
            }
        });
    }
    private static void reply(Completion callback, boolean ok, String code) {
        try {
            JSONObject result = new JSONObject().put("ok", ok);
            if (!ok) result.put("code", code).put("message", code.equals("ERR_PRINT_CANCELLED") ? "Printing was canceled" : "The document could not be printed or exported");
            callback.complete(result.toString());
        } catch (org.json.JSONException impossible) { throw new IllegalStateException(impossible); }
    }
    public boolean remove(String uri) {
        if (!owned.contains(uri)) return true;
        File file = new File(Uri.parse(uri).getPath());
        if (file.exists() && !file.delete()) return false;
        owned.remove(uri); return true;
    }
    private final class Job {
        final Activity activity;
        final JSONObject options;
        final boolean export;
        final Completion callback;
        final CancellationSignal cancellation = new CancellationSignal();
        WebView web;
        PrintDocumentAdapter adapter;
        ParcelFileDescriptor descriptor;
        File output;
        File source;
        boolean done;
        boolean responded;
        boolean loaded;
        final Runnable timeout = () -> fail("ERR_PRINT_TIMEOUT");
        final Application.ActivityLifecycleCallbacks lifecycle = new Application.ActivityLifecycleCallbacks() {
            public void onActivityCreated(Activity value, Bundle state) {}
            public void onActivityStarted(Activity value) {}
            public void onActivityResumed(Activity value) {}
            public void onActivityPaused(Activity value) {}
            public void onActivityStopped(Activity value) {}
            public void onActivitySaveInstanceState(Activity value, Bundle state) {}
            public void onActivityDestroyed(Activity value) { if (value == activity) fail("ERR_PRINT_CANCELLED"); }
        };
        Job(Activity activity, JSONObject options, boolean export, Completion callback) {
            this.activity = activity; this.options = options; this.export = export; this.callback = callback;
        }
        void start() throws Exception {
            if (activity.isFinishing() || activity.isDestroyed() || options.optBoolean("useMarkupFormatter", false) || options.has("printerUrl")) throw new IllegalStateException();
            activity.getApplication().registerActivityLifecycleCallbacks(lifecycle);
            main.postDelayed(timeout, 45000);
            if (!export && options.has("uri")) { loadPDF(options.getString("uri")); return; }
            if (!export && !options.has("html")) throw new IllegalArgumentException();
            web = new WebView(activity);
            web.getSettings().setJavaScriptEnabled(false);
            web.getSettings().setAllowFileAccess(false);
            web.getSettings().setAllowContentAccess(false);
            web.getSettings().setDefaultTextEncodingName("UTF-8");
            web.getSettings().setTextZoom(options.optInt("textZoom", 100));
            web.setWebViewClient(new WebViewClient() {
                @Override public void onPageFinished(WebView view, String url) {
                    if (done || loaded) return;
                    loaded = true;
                    adapter = view.createPrintDocumentAdapter("Document");
                    try { if (export) writePDF(); else show(); }
                    catch (Exception error) { fail("ERR_PRINT_FAILED"); }
                }
                @Override public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) { if (request.isForMainFrame()) fail("ERR_PRINT_FAILED"); }
            });
            String html = options.optString("html", "");
            web.loadDataWithBaseURL(null, html.isEmpty() ? "<html><body><div style='height:1px'></div></body></html>" : html, "text/html", "UTF-8", null);
        }
        PrintAttributes attributes() throws Exception {
            double width = options.optDouble("width", 612), height = options.optDouble("height", 792);
            JSONObject margins = options.optJSONObject("margins");
            return new PrintAttributes.Builder()
                .setMediaSize(new PrintAttributes.MediaSize("xplat", "Document", (int)Math.round(width * 1000 / 72), (int)Math.round(height * 1000 / 72)))
                .setResolution(new PrintAttributes.Resolution("xplat", "Document", 72, 72))
                .setMinMargins(new PrintAttributes.Margins(mils(margins, "left"), mils(margins, "top"), mils(margins, "right"), mils(margins, "bottom")))
                .setColorMode(PrintAttributes.COLOR_MODE_COLOR).build();
        }
        int mils(JSONObject value, String key) { return value == null ? 0 : (int)Math.round(value.optDouble(key, 0) * 1000 / 72); }
        void writePDF() throws Exception {
            output = File.createTempFile("xplat-print-", ".pdf", activity.getCacheDir());
            adapter.onStart();
            adapter.onLayout(null, attributes(), cancellation, new XplatPrintLayoutCallback() {
                @Override public void onLayoutFinished(PrintDocumentInfo info, boolean changed) {
                    if (done) return;
                    try {
                        descriptor = ParcelFileDescriptor.open(output, ParcelFileDescriptor.MODE_READ_WRITE | ParcelFileDescriptor.MODE_TRUNCATE);
                        adapter.onWrite(new PageRange[]{PageRange.ALL_PAGES}, descriptor, cancellation, new XplatPrintWriteCallback() {
                            @Override public void onWriteFinished(PageRange[] pages) { main.post(() -> completePDF()); }
                            @Override public void onWriteFailed(CharSequence error) { main.post(() -> fail("ERR_PRINT_FAILED")); }
                            @Override public void onWriteCancelled() { main.post(() -> fail("ERR_PRINT_CANCELLED")); }
                        });
                    } catch (Exception error) { fail("ERR_PRINT_FAILED"); }
                }
                @Override public void onLayoutFailed(CharSequence error) { fail("ERR_PRINT_FAILED"); }
                @Override public void onLayoutCancelled() { fail("ERR_PRINT_CANCELLED"); }
            }, new Bundle());
        }
        void completePDF() {
            if (done) return;
            try {
                if (descriptor != null) { descriptor.close(); descriptor = null; }
                int count;
                try (ParcelFileDescriptor input = ParcelFileDescriptor.open(output, ParcelFileDescriptor.MODE_READ_ONLY); PdfRenderer pdf = new PdfRenderer(input)) { count = pdf.getPageCount(); }
                if (count < 1 || count > 1000) throw new IllegalStateException();
                String uri = Uri.fromFile(output).toString();
                JSONObject result = new JSONObject().put("ok", true).put("uri", uri).put("numberOfPages", count);
                if (options.optBoolean("base64", false)) {
                    if (output.length() > LIMIT) throw new IllegalStateException();
                    try (InputStream input = new FileInputStream(output); ByteArrayOutputStream bytes = new ByteArrayOutputStream()) {
                        copy(input, bytes); result.put("base64", Base64.encodeToString(bytes.toByteArray(), Base64.NO_WRAP));
                    }
                }
                owned.add(uri);
                output = null;
                dispose(); responded = true; callback.complete(result.toString());
            } catch (Exception error) { fail("ERR_PRINT_FAILED"); }
        }
        void loadPDF(String uri) {
            new Thread(() -> {
                File temporary = null;
                try {
                    temporary = File.createTempFile("xplat-print-input-", ".pdf", activity.getCacheDir());
                    try (InputStream input = open(uri); OutputStream output = new FileOutputStream(temporary)) { copy(input, output); }
                    try (ParcelFileDescriptor input = ParcelFileDescriptor.open(temporary, ParcelFileDescriptor.MODE_READ_ONLY); PdfRenderer pdf = new PdfRenderer(input)) { if (pdf.getPageCount() < 1) throw new IllegalArgumentException(); }
                    final File ready = temporary;
                    main.post(() -> {
                        if (done) { ready.delete(); return; }
                        source = ready;
                        adapter = new PrintDocumentAdapter() {
                            @Override public void onLayout(PrintAttributes oldValue, PrintAttributes newValue, CancellationSignal signal, LayoutResultCallback result, Bundle extras) {
                                if (signal.isCanceled()) result.onLayoutCancelled();
                                else result.onLayoutFinished(new PrintDocumentInfo.Builder("Document").setContentType(PrintDocumentInfo.CONTENT_TYPE_DOCUMENT).setPageCount(PrintDocumentInfo.PAGE_COUNT_UNKNOWN).build(), true);
                            }
                            @Override public void onWrite(PageRange[] ranges, ParcelFileDescriptor destination, CancellationSignal signal, WriteResultCallback result) {
                                new Thread(() -> {
                                    try (InputStream input = new FileInputStream(ready); OutputStream output = new FileOutputStream(destination.getFileDescriptor())) {
                                        copy(input, output); if (signal.isCanceled()) result.onWriteCancelled(); else result.onWriteFinished(new PageRange[]{PageRange.ALL_PAGES});
                                    } catch (Exception error) { result.onWriteFailed("Could not read the PDF"); }
                                }, "xplat-print-copy").start();
                            }
                        };
                        try { show(); } catch (Exception error) { fail("ERR_PRINT_FAILED"); }
                    });
                } catch (Exception error) {
                    if (temporary != null) temporary.delete();
                    main.post(() -> fail("ERR_PRINT_FAILED"));
                }
            }, "xplat-print-input").start();
        }
        InputStream open(String value) throws Exception {
            if (value.startsWith("data:application/pdf;base64,")) {
                String encoded = value.substring("data:application/pdf;base64,".length());
                if (encoded.length() > LIMIT * 4L / 3 + 4) throw new IllegalArgumentException();
                return new ByteArrayInputStream(Base64.decode(encoded, Base64.DEFAULT));
            }
            Uri uri = Uri.parse(value);
            if ("content".equals(uri.getScheme())) {
                InputStream input = activity.getContentResolver().openInputStream(uri);
                if (input == null) throw new IllegalArgumentException();
                return input;
            }
            if (value.startsWith("/") || "file".equals(uri.getScheme())) return new FileInputStream(value.startsWith("/") ? value : uri.getPath());
            if (!"https".equals(uri.getScheme())) throw new IllegalArgumentException();
            HttpURLConnection connection = (HttpURLConnection)new URL(value).openConnection();
            try {
                connection.setConnectTimeout(15000); connection.setReadTimeout(15000);
                if (connection.getResponseCode() != 200) throw new IllegalArgumentException();
                final InputStream input = connection.getInputStream();
                return new java.io.FilterInputStream(input) { @Override public void close() throws java.io.IOException { try { super.close(); } finally { connection.disconnect(); } } };
            } catch (Exception error) { connection.disconnect(); throw error; }
        }
        void copy(InputStream input, OutputStream output) throws Exception {
            byte[] buffer = new byte[65536]; int count; long total = 0;
            while ((count = input.read(buffer)) != -1) {
                if (cancellation.isCanceled()) throw new java.io.IOException();
                total += count; if (total > LIMIT) throw new java.io.IOException();
                output.write(buffer, 0, count);
            }
        }
        void show() throws Exception {
            PrintManager manager = (PrintManager)activity.getSystemService(Context.PRINT_SERVICE);
            if (manager == null) throw new IllegalStateException();
            final PrintDocumentAdapter document = adapter;
            PrintDocumentAdapter ownedAdapter = new PrintDocumentAdapter() {
                @Override public void onStart() { document.onStart(); }
                @Override public void onLayout(PrintAttributes oldValue, PrintAttributes newValue, CancellationSignal signal, LayoutResultCallback callback, Bundle extras) { document.onLayout(oldValue, newValue, signal, callback, extras); }
                @Override public void onWrite(PageRange[] pages, ParcelFileDescriptor destination, CancellationSignal signal, WriteResultCallback callback) { document.onWrite(pages, destination, signal, callback); }
                @Override public void onFinish() { dispose(); }
            };
            if (manager.print("Document", ownedAdapter, attributes()) == null) throw new IllegalStateException();
            main.removeCallbacks(timeout);
            responded = true;
            reply(callback, true, "");
        }
        void fail(String code) {
            if (done) return;
            cancellation.cancel(); dispose();
            if (!responded) { responded = true; reply(callback, false, code); }
        }
        void dispose() {
            if (done) return;
            done = true; main.removeCallbacks(timeout);
            activity.getApplication().unregisterActivityLifecycleCallbacks(lifecycle);
            if (descriptor != null) { try { descriptor.close(); } catch (Exception ignored) {} descriptor = null; }
            // A provider's teardown must not strand the remaining resources or JS completion.
            if (adapter != null) { try { adapter.onFinish(); } catch (Exception ignored) {} adapter = null; }
            if (web != null) { try { web.stopLoading(); } catch (Exception ignored) {} try { web.destroy(); } catch (Exception ignored) {} web = null; }
            if (output != null) { output.delete(); output = null; }
            if (source != null) { source.delete(); source = null; }
            if (active == this) active = null;
        }
    }
}
