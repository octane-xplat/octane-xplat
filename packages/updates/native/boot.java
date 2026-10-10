    // xplat-updates: native recovery runs before downloaded JavaScript.
    private static boolean otaExists(java.io.File root, String name) {
        return new java.io.File(root, name).exists();
    }
    private static String otaRead(java.io.File root, String name) throws java.io.IOException {
        try (java.io.InputStream input = new java.io.FileInputStream(new java.io.File(root, name)); java.io.ByteArrayOutputStream output = new java.io.ByteArrayOutputStream()) {
            byte[] buffer = new byte[4096];
            int size;
            while ((size = input.read(buffer)) != -1) output.write(buffer, 0, size);
            return new String(output.toByteArray(), java.nio.charset.StandardCharsets.UTF_8);
        }
    }
    private static void otaWrite(java.io.File root, String name, String text) throws java.io.IOException {
        java.io.File temporary = new java.io.File(root, name + ".tmp");
        try (java.io.FileOutputStream output = new java.io.FileOutputStream(temporary)) {
            output.write(text.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            output.getFD().sync();
        }
        if (!temporary.renameTo(new java.io.File(root, name))) throw new java.io.IOException("Cannot commit OTA state");
    }
    private static void otaDelete(java.io.File file) throws java.io.IOException {
        if (file.isDirectory()) {
            java.io.File[] children = file.listFiles();
            if (children == null) throw new java.io.IOException("Cannot list OTA directory");
            for (java.io.File child : children) otaDelete(child);
        }
        if (file.exists() && !file.delete()) throw new java.io.IOException("Cannot delete OTA file");
    }
    private static void otaMove(java.io.File from, java.io.File to) throws java.io.IOException {
        if (!to.getParentFile().isDirectory() && !to.getParentFile().mkdirs()) throw new java.io.IOException("Cannot create OTA directory");
        if (!from.renameTo(to)) throw new java.io.IOException("Cannot move OTA directory");
    }
    private void otaExtract(String asset, java.io.File destination) throws java.io.IOException {
        String[] children = getAssets().list(asset);
        if (children != null && children.length > 0) {
            if (!destination.isDirectory() && !destination.mkdirs()) throw new java.io.IOException("Cannot create embedded fallback directory");
            for (String child : children) otaExtract(asset + "/" + child, new java.io.File(destination, child));
        } else {
            try (java.io.InputStream input = getAssets().open(asset); java.io.OutputStream output = new java.io.FileOutputStream(destination)) {
                byte[] buffer = new byte[8192];
                int size;
                while ((size = input.read(buffer)) != -1) output.write(buffer, 0, size);
            }
        }
    }
    private void otaRestore(java.io.File root, java.io.File app) throws java.io.IOException {
        java.io.File previous = new java.io.File(root, "previous/app");
        boolean hasPrevious = previous.isDirectory();
        if (!hasPrevious) {
            // Android's extraction thumb will not change on an OTA rollback.
            // Recreate the immutable APK baseline ourselves before touching live app/.
            previous = new java.io.File(root, "fallback/app");
            otaDelete(new java.io.File(root, "fallback"));
            if (!previous.mkdirs()) throw new java.io.IOException("Cannot create fallback directory");
            otaExtract("app", previous);
        }
        otaDelete(app);
        otaMove(previous, app);
        if (hasPrevious && otaExists(root, "previous.json")) otaWrite(root, "current.json", otaRead(root, "previous.json"));
        else otaDelete(new java.io.File(root, "current.json"));
    }
    private void xplatOTABoot() {
        java.io.File root = new java.io.File(getFilesDir(), "xplat-ota");
        java.io.File app = new java.io.File(getFilesDir(), "app");
        try {
            if ((getApplicationInfo().flags & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0) {
                if (!root.isDirectory() && !root.mkdirs()) throw new java.io.IOException("Cannot record debug mode");
                otaWrite(root, "mode.txt", "debug");
                return;
            }
            android.content.pm.PackageInfo info = getPackageManager().getPackageInfo(getPackageName(), 0);
            String binary = info.lastUpdateTime + "-" + info.versionCode + "-" + info.versionName;
            if (otaExists(root, "native.txt") && !otaRead(root, "native.txt").equals(binary)) {
                // NativeScript's package-version extraction follows this guard.
                otaDelete(root);
                otaDelete(app);
            }
            if (!root.isDirectory() && !root.mkdirs()) throw new java.io.IOException("Cannot create OTA storage");
            otaWrite(root, "native.txt", binary);
            otaWrite(root, "mode.txt", "release");
            if (otaExists(root, "pending.txt") || otaExists(root, "rollback.txt")) {
                String rejected = otaExists(root, "pending.txt") ? otaRead(root, "pending.txt") :
                    (otaExists(root, "current.json") ? new org.json.JSONObject(otaRead(root, "current.json")).getString("sha256") : "");
                otaRestore(root, app);
                otaWrite(root, "rejected.txt", rejected);
                otaDelete(new java.io.File(root, "next"));
                otaDelete(new java.io.File(root, "pending.txt"));
                otaDelete(new java.io.File(root, "rollback.txt"));
            }
            if (otaExists(root, "next/app/package.json") && otaExists(root, "next/release.json")) {
                // No JS download ever mutates live app/. Only a native cold boot swaps it.
                String release = otaRead(root, "next/release.json");
                String sha = new org.json.JSONObject(release).getString("sha256");
                otaDelete(new java.io.File(root, "previous"));
                if (otaExists(root, "current.json")) otaWrite(root, "previous.json", otaRead(root, "current.json"));
                else otaDelete(new java.io.File(root, "previous.json"));
                otaWrite(root, "pending.txt", sha);
                if (!app.isDirectory()) throw new java.io.IOException("Embedded app was not extracted; launch the binary once before installing an update");
                otaMove(app, new java.io.File(root, "previous/app"));
                otaMove(new java.io.File(root, "next/app"), app);
                otaWrite(root, "current.json", release);
                otaDelete(new java.io.File(root, "next"));
            }
        } catch (Exception error) {
            throw new IllegalStateException("OTA boot failed before JavaScript; backup retained for next launch", error);
        }
    }
