package com.octanexplat.share;

/**
 * Dedicated FileProvider subclass so our <provider> manifest entry can never
 * collide with another library's bare androidx.core.content.FileProvider
 * element (e.g. @nativescript/camera's ${applicationId}.provider). The
 * authority (${applicationId}.xplatshare) and path rules are unchanged.
 */
public class XplatShareFileProvider extends androidx.core.content.FileProvider {
}
