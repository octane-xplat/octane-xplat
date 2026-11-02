package com.octanexplat.converter;

import android.graphics.Bitmap;
import android.media.MediaCodec;
import android.media.MediaCodecInfo;
import android.media.MediaCodecList;
import android.media.MediaFormat;
import android.media.MediaMuxer;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import com.bumptech.glide.gifdecoder.GifDecoder;
import com.bumptech.glide.gifdecoder.GifHeader;
import com.bumptech.glide.gifdecoder.GifHeaderParser;
import com.bumptech.glide.gifdecoder.StandardGifDecoder;
import org.json.JSONObject;
import java.io.File;
import java.io.FileInputStream;
import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/** File-only GIF decoding and H.264 encoding; no shell or external executable. */
public final class Converter {
    public interface Callback { void onEvent(String json); }
    private final ConcurrentHashMap<String, Boolean> jobs = new ConcurrentHashMap<>();
    private final Handler main = new Handler(Looper.getMainLooper());
    private String cache;
    private static MediaCodecInfo encoder(int width, int height) {
        for (MediaCodecInfo info : new MediaCodecList(MediaCodecList.REGULAR_CODECS).getCodecInfos()) {
            if (!info.isEncoder()) continue;
            try {
                MediaCodecInfo.CodecCapabilities caps = info.getCapabilitiesForType("video/avc");
                if (width > 0 && !caps.getVideoCapabilities().isSizeSupported(width, height)) continue;
                for (int format : caps.colorFormats) if (format == 19 || format == 21) return info;
            } catch (IllegalArgumentException ignored) { /* Different MIME type. */ }
        }
        return null;
    }
    public boolean available() { return encoder(0, 0) != null; }
    public void cancel(String id) { jobs.computeIfPresent(id, (key, value) -> true); }
    private void check(String id) throws Exception {
        if (Boolean.TRUE.equals(jobs.get(id))) throw new InterruptedException("Media conversion was cancelled");
    }
    private void event(Callback callback, JSONObject value) {
        String json = value.toString(); main.post(() -> callback.onEvent(json));
    }
    public void start(String json, String directory, Callback callback) {
        try {
            JSONObject request = new JSONObject(json);
            String id = request.getString("id");
            cache = directory; jobs.put(id, false);
            new Thread(() -> {
                try { event(callback, new JSONObject().put("result", convert(request, id, directory, callback))); }
                catch (Exception error) {
                    try { event(callback, new JSONObject().put("error", error.getMessage() == null ? error.toString() : error.getMessage()).put("cancelled", error instanceof InterruptedException)); }
                    catch (Exception impossible) { throw new IllegalStateException(impossible); }
                } finally { jobs.remove(id); }
            }, "xplat-gif-converter").start();
        } catch (Exception error) { throw new IllegalArgumentException("Invalid conversion request", error); }
    }
    public boolean remove(String uri) {
        try {
            File file = new File(Uri.parse(uri).getPath()).getCanonicalFile();
            return cache != null && file.getParentFile().equals(new File(cache).getCanonicalFile()) && file.getName().startsWith("xplat-video-") && (!file.exists() || file.delete());
        } catch (Exception error) { return false; }
    }
    // Read original GCE delays: Glide deliberately clamps short delays for playback.
    // Decode remains Glide's responsibility; conversion preserves 10 ms source timing.
    private static int[] delays(byte[] bytes) throws Exception {
        int p = 13 + ((bytes[10] & 128) != 0 ? 3 * (1 << ((bytes[10] & 7) + 1)) : 0);
        int delay = 100;
        ArrayList<Integer> values = new ArrayList<>();
        while (p < bytes.length) {
            int tag = bytes[p++] & 255;
            if (tag == 0x3b) break;
            if (tag == 0x21) {
                int kind = bytes[p++] & 255;
                if (kind == 0xf9) {
                    if ((bytes[p] & 255) != 4) throw new Exception("Invalid GIF control block");
                    int raw = (bytes[p + 2] & 255) | ((bytes[p + 3] & 255) << 8);
                    delay = raw == 0 ? 100 : raw * 10;
                }
            } else if (tag == 0x2c) {
                int packed = bytes[p + 8] & 255; p += 9;
                if ((packed & 128) != 0) p += 3 * (1 << ((packed & 7) + 1));
                p++; // LZW code size.
                values.add(delay); delay = 100;
            } else throw new Exception("Invalid GIF block");
            while (true) {
                if (p >= bytes.length) throw new Exception("Truncated GIF");
                int length = bytes[p++] & 255;
                if (length == 0) break;
                p += length;
                if (p > bytes.length) throw new Exception("Truncated GIF");
            }
        }
        int[] result = new int[values.size()];
        for (int i = 0; i < result.length; i++) result[i] = values.get(i);
        return result;
    }
    private JSONObject convert(JSONObject request, String id, String directory, Callback callback) throws Exception {
        if (!request.getString("format").equals("mp4")) throw new Exception("Only GIF to MP4 is available on Android");
        String source = request.getString("source");
        String path = source.startsWith("file://") ? Uri.parse(source).getPath() : source;
        if (path == null || !path.startsWith("/")) throw new Exception("GIF source must be an absolute file path or file URL");
        File inputFile = new File(path);
        if (inputFile.length() > 64 * 1024 * 1024) throw new Exception("GIF exceeds 64 MiB");
        byte[] data;
        try (FileInputStream stream = new FileInputStream(inputFile)) {
            data = new byte[(int) inputFile.length()]; int offset = 0, read;
            while (offset < data.length && (read = stream.read(data, offset, data.length - offset)) != -1) offset += read;
            if (offset != data.length) throw new Exception("Could not read complete GIF");
        }
        if (data.length < 13 || data[0] != 'G' || data[1] != 'I' || data[2] != 'F') throw new Exception("Source must be a GIF");
        GifHeader header = new GifHeaderParser().setData(data).parseHeader();
        int rawWidth = header.getWidth(), rawHeight = header.getHeight(), count = header.getNumFrames();
        if (header.getStatus() != GifDecoder.STATUS_OK || rawWidth <= 0 || rawHeight <= 0 || (long)rawWidth * rawHeight > 4194304 || count < 1 || count > 1000) throw new Exception("GIF must have 1–1000 frames and at most 4194304 pixels");
        int[] delays = delays(data); long duration = 0;
        if (delays.length != count) throw new Exception("Invalid GIF frame count");
        for (int delay : delays) duration += delay;
        if (duration > 60000) throw new Exception("GIF traversal exceeds 60 seconds");
        int width = rawWidth + rawWidth % 2, height = rawHeight + rawHeight % 2;
        MediaCodecInfo info = encoder(width, height);
        if (info == null) throw new Exception("No H.264 byte-buffer encoder supports these dimensions");
        boolean planar = false;
        for (int format : info.getCapabilitiesForType("video/avc").colorFormats) if (format == 19) planar = true;
        MediaFormat format = MediaFormat.createVideoFormat("video/avc", width, height);
        format.setInteger(MediaFormat.KEY_COLOR_FORMAT, planar ? 19 : 21);
        format.setInteger(MediaFormat.KEY_BIT_RATE, request.getInt("bitrate"));
        format.setInteger(MediaFormat.KEY_FRAME_RATE, 30);
        format.setInteger(MediaFormat.KEY_I_FRAME_INTERVAL, 2);
        StandardGifDecoder decoder = new StandardGifDecoder(new GifDecoder.BitmapProvider() {
            public Bitmap obtain(int w, int h, Bitmap.Config config) { return Bitmap.createBitmap(w, h, config); }
            public void release(Bitmap bitmap) { bitmap.recycle(); }
            public byte[] obtainByteArray(int size) { return new byte[size]; }
            public void release(byte[] value) {}
            public int[] obtainIntArray(int size) { return new int[size]; }
            public void release(int[] value) {}
        }, header, ByteBuffer.wrap(data));
        File output = new File(directory, "xplat-video-" + UUID.randomUUID() + ".mp4");
        MediaCodec codec = null; MediaMuxer muxer = null; boolean complete = false, started = false;
        try {
            codec = MediaCodec.createByCodecName(info.getName()); codec.configure(format, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE); codec.start();
            muxer = new MediaMuxer(output.getAbsolutePath(), MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4);
            MediaCodec.BufferInfo bufferInfo = new MediaCodec.BufferInfo();
            int track = -1, frame = 0; long time = 0; boolean sentEnd = false, receivedEnd = false;
            long deadline = System.nanoTime() + 60_000_000_000L;
            int rgb = (int)Long.parseLong(request.getString("backgroundColor").substring(1), 16);
            while (!receivedEnd) {
                check(id);
                if (System.nanoTime() > deadline) throw new Exception("Video encoder timed out");
                if (!sentEnd) {
                    int slot = codec.dequeueInputBuffer(1000);
                    if (slot >= 0) {
                        if (frame == count) { codec.queueInputBuffer(slot, 0, 0, duration * 1000, MediaCodec.BUFFER_FLAG_END_OF_STREAM); sentEnd = true; }
                        else {
                            decoder.advance(); Bitmap bitmap = decoder.getNextFrame();
                            if (bitmap == null || decoder.getStatus() != GifDecoder.STATUS_OK) throw new Exception("Could not decode GIF frame");
                            byte[] yuv;
                            try { yuv = yuv(bitmap, width, height, rgb, planar); } finally { bitmap.recycle(); }
                            ByteBuffer buffer = codec.getInputBuffer(slot);
                            if (buffer == null || buffer.capacity() < yuv.length) throw new Exception("Video encoder input buffer is too small");
                            buffer.clear(); buffer.put(yuv); codec.queueInputBuffer(slot, 0, yuv.length, time * 1000, 0);
                            time += delays[frame++]; event(callback, new JSONObject().put("progress", (double)frame / count));
                        }
                    }
                }
                int slot = codec.dequeueOutputBuffer(bufferInfo, 1000);
                if (slot == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) { track = muxer.addTrack(codec.getOutputFormat()); muxer.start(); started = true; }
                else if (slot >= 0) {
                    ByteBuffer buffer = codec.getOutputBuffer(slot);
                    if ((bufferInfo.flags & MediaCodec.BUFFER_FLAG_CODEC_CONFIG) == 0 && bufferInfo.size > 0) {
                        if (!started || buffer == null) throw new Exception("Video encoder produced data before its format");
                        muxer.writeSampleData(track, buffer, bufferInfo);
                    }
                    receivedEnd = (bufferInfo.flags & MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0;
                    if (receivedEnd && started) {
                        MediaCodec.BufferInfo end = new MediaCodec.BufferInfo(); end.set(0, 0, duration * 1000, MediaCodec.BUFFER_FLAG_END_OF_STREAM);
                        muxer.writeSampleData(track, ByteBuffer.allocate(0), end);
                    }
                    codec.releaseOutputBuffer(slot, false);
                }
            }
            muxer.stop(); started = false; check(id); complete = true;
            return new JSONObject().put("uri", Uri.fromFile(output).toString()).put("width", width).put("height", height).put("duration", duration).put("mimeType", "video/mp4");
        } finally {
            try {
                decoder.clear();
            } finally {
                try {
                    if (codec != null) { try { codec.stop(); } finally { codec.release(); } }
                } finally {
                    try {
                        if (muxer != null) { try { if (started) muxer.stop(); } finally { muxer.release(); } }
                    } finally {
                        if (!complete) output.delete();
                    }
                }
            }
        }
    }
    private static int clamp(int value) { return Math.max(0, Math.min(255, value)); }
    private static byte[] yuv(Bitmap bitmap, int width, int height, int background, boolean planar) {
        int[] pixels = new int[width * height]; java.util.Arrays.fill(pixels, 0xff000000 | background);
        bitmap.getPixels(pixels, 0, width, 0, 0, bitmap.getWidth(), bitmap.getHeight());
        int size = width * height; byte[] result = new byte[size * 3 / 2];
        for (int y = 0; y < height; y++) for (int x = 0; x < width; x++) {
            int index = y * width + x, pixel = pixels[index], alpha = pixel >>> 24;
            int r = (((pixel >> 16) & 255) * alpha + ((background >> 16) & 255) * (255 - alpha) + 127) / 255;
            int g = (((pixel >> 8) & 255) * alpha + ((background >> 8) & 255) * (255 - alpha) + 127) / 255;
            int b = ((pixel & 255) * alpha + (background & 255) * (255 - alpha) + 127) / 255;
            result[index] = (byte)clamp(((66*r + 129*g + 25*b + 128) >> 8) + 16);
            if ((y & 1) == 0 && (x & 1) == 0) {
                // Average chroma over the 2×2 block after alpha compositing.
                int rr=0, gg=0, bb=0;
                for (int dy=0; dy<2; dy++) for (int dx=0; dx<2; dx++) {
                    int p=pixels[(y+dy)*width+x+dx], a=p>>>24;
                    rr+=(((p>>16)&255)*a+((background>>16)&255)*(255-a)+127)/255;
                    gg+=(((p>>8)&255)*a+((background>>8)&255)*(255-a)+127)/255;
                    bb+=((p&255)*a+(background&255)*(255-a)+127)/255;
                }
                r=rr/4; g=gg/4; b=bb/4;
                int chroma=(y/2)*(width/2)+x/2;
                int u=clamp(((-38*r-74*g+112*b+128)>>8)+128), v=clamp(((112*r-94*g-18*b+128)>>8)+128);
                if (planar) { result[size+chroma]=(byte)u; result[size+size/4+chroma]=(byte)v; }
                else { result[size+chroma*2]=(byte)u; result[size+chroma*2+1]=(byte)v; }
            }
        }
        return result;
    }
}
