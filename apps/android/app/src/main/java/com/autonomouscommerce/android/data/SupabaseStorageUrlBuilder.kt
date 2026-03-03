package com.autonomouscommerce.android.data

import java.net.URLEncoder
import java.nio.charset.StandardCharsets

private const val PRODUCT_IMAGES_BUCKET = "product-images"

fun buildPublicImageUrl(supabaseUrl: String, path: String): String {
    val normalizedBase = supabaseUrl.trimEnd('/')
    val encodedPath = path
        .split('/')
        .joinToString("/") { segment ->
            URLEncoder.encode(segment, StandardCharsets.UTF_8)
                .replace("+", "%20")
        }

    return "$normalizedBase/storage/v1/object/public/$PRODUCT_IMAGES_BUCKET/$encodedPath"
}
