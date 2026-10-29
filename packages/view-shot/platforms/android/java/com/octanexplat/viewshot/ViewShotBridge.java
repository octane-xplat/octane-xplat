package com.octanexplat.viewshot;

import android.app.Activity;
import android.content.Context;
import android.content.ContextWrapper;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Looper;
import android.util.Base64;
import android.view.SurfaceView;
import android.view.TextureView;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.WebView;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.json.JSONObject;

/** Public Android bitmap APIs with exact temporary-file ownership. */
public final class ViewShotBridge {
    private static final Map<String, File> owned = new HashMap<>();
    private ViewShotBridge() {}

    private static String reply(String key, String value) {
        try { return new JSONObject().put(key, value).toString(); }
        catch (Exception ignored) { return "{\"error\":\"Could not serialize capture result\"}"; }
    }
    private static boolean protectedSurface(View view) {
        if (view instanceof SurfaceView || view instanceof TextureView || view instanceof WebView) return true;
        if (view instanceof ViewGroup) {
            ViewGroup group = (ViewGroup) view;
            for (int index = 0; index < group.getChildCount(); index++) {
                if (protectedSurface(group.getChildAt(index))) return true;
            }
        }
        return false;
    }
    private static Activity activity(Context context) {
        for (int depth = 0; depth < 16 && context != null; depth++) {
            if (context instanceof Activity) return (Activity) context;
            if (!(context instanceof ContextWrapper)) return null;
            Context base = ((ContextWrapper) context).getBaseContext();
            if (base == context) return null;
            context = base;
        }
        return null;
    }
    public static String validate(View view) {
        if (Looper.myLooper() != Looper.getMainLooper()) return "View capture requires the main thread";
        if (view == null || !view.isAttachedToWindow()) return "View is detached";
        if (view.getWidth() <= 0 || view.getHeight() <= 0) return "View has no laid-out area";
        Activity owner = activity(view.getContext());
        if (owner != null && (owner.getWindow().getAttributes().flags & WindowManager.LayoutParams.FLAG_SECURE) != 0) return "Secure windows cannot be captured";
        View root = view.getRootView();
        if (root.getLayoutParams() instanceof WindowManager.LayoutParams &&
            ((((WindowManager.LayoutParams) root.getLayoutParams()).flags & WindowManager.LayoutParams.FLAG_SECURE) != 0)) return "Secure windows cannot be captured";
        if (protectedSurface(view)) return "Web/video/GPU surfaces are outside this capture subset";
        return null;
    }
    @SuppressWarnings("deprecation")
    private static Bitmap.CompressFormat format(String name) {
        if ("png".equals(name)) return Bitmap.CompressFormat.PNG;
        if ("jpg".equals(name)) return Bitmap.CompressFormat.JPEG;
        if ("webp".equals(name)) return Build.VERSION.SDK_INT >= 30 ? Api30.webp() : Bitmap.CompressFormat.WEBP;
        throw new IllegalArgumentException("Unsupported capture format");
    }
    private static final class Api30 {
        static Bitmap.CompressFormat webp() { return Bitmap.CompressFormat.WEBP_LOSSY; }
    }
    public static String capture(View view, String json) {
        String failure = validate(view);
        if (failure != null) return reply("error", failure);
        Bitmap bitmap = null;
        File pending = null;
        try {
            JSONObject options = new JSONObject(json);
            if (options.optBoolean("snapshotContentContainer") || options.optBoolean("handleGLSurfaceViewOnAndroid") || options.optBoolean("useRenderInContext")) throw new IllegalArgumentException("Unsupported Android capture strategy");
            String encoding = options.getString("format"), result = options.getString("result");
            Bitmap.CompressFormat compressor = format(encoding);
            if (!"tmpfile".equals(result) && !"base64".equals(result) && !"data-uri".equals(result)) throw new IllegalArgumentException("Unsupported capture result");
            double quality = options.getDouble("quality");
            if (Double.isNaN(quality) || Double.isInfinite(quality) || quality < 0 || quality > 1) throw new IllegalArgumentException("Invalid capture quality");
            double requestedWidth = options.optDouble("width", view.getWidth()), requestedHeight = options.optDouble("height", view.getHeight());
            if (Double.isNaN(requestedWidth) || Double.isInfinite(requestedWidth) || Double.isNaN(requestedHeight) || Double.isInfinite(requestedHeight) ||
                requestedWidth != Math.rint(requestedWidth) || requestedHeight != Math.rint(requestedHeight) ||
                requestedWidth <= 0 || requestedHeight <= 0 || requestedWidth > 16384 || requestedHeight > 16384 || requestedWidth * requestedHeight > 32000000) throw new IllegalArgumentException("Capture dimensions exceed the bitmap limit");
            int width = (int) requestedWidth, height = (int) requestedHeight;
            bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
            Canvas canvas = new Canvas(bitmap);
            if ("jpg".equals(encoding)) canvas.drawColor(Color.WHITE);
            canvas.scale((float) width / view.getWidth(), (float) height / view.getHeight());
            view.draw(canvas);
            int compressedQuality = (int) Math.round(quality * 100);
            if ("tmpfile".equals(result)) {
                String prefix = options.optString("fileName", "octane-view-shot");
                if (!prefix.matches("[A-Za-z0-9_-]{3,80}")) throw new IllegalArgumentException("Invalid capture file name");
                pending = new File(view.getContext().getCacheDir(), prefix + "-" + UUID.randomUUID() + "." + encoding);
                try (OutputStream stream = new FileOutputStream(pending)) {
                    if (!bitmap.compress(compressor, compressedQuality, stream)) throw new IllegalStateException("Android could not encode the capture");
                }
                String uri = Uri.fromFile(pending).toString();
                owned.put(uri, pending);
                pending = null;
                return reply("uri", uri);
            }
            byte[] encoded;
            try (ByteArrayOutputStream stream = new ByteArrayOutputStream()) {
                if (!bitmap.compress(compressor, compressedQuality, stream)) throw new IllegalStateException("Android could not encode the capture");
                encoded = stream.toByteArray();
            }
            String base64 = Base64.encodeToString(encoded, Base64.NO_WRAP);
            String mime = "jpg".equals(encoding) ? "jpeg" : encoding;
            return reply("uri", "data-uri".equals(result) ? "data:image/" + mime + ";base64," + base64 : base64);
        } catch (Exception | OutOfMemoryError error) {
            return reply("error", error.getMessage() == null ? "Android capture failed" : error.getMessage());
        } finally {
            if (bitmap != null) bitmap.recycle();
            if (pending != null) pending.delete();
        }
    }
    public static boolean remove(String uri) {
        if (Looper.myLooper() != Looper.getMainLooper()) return false;
        File file = owned.get(uri);
        if (file == null) return true;
        if (file.exists() && !file.delete()) return false;
        owned.remove(uri);
        return true;
    }
}
