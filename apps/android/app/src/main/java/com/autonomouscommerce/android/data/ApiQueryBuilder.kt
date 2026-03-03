package com.autonomouscommerce.android.data

import com.autonomouscommerce.android.model.SortOption
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

fun buildProductsCacheKey(
    query: String,
    categoryId: String,
    sortOption: SortOption,
    page: Int,
    pageSize: Int,
): String {
    val normalizedQuery = query.trim().lowercase()
    return "$normalizedQuery|$categoryId|${sortOption.name}|$page|$pageSize"
}

fun buildProductsQueryParams(
    query: String,
    sortOption: SortOption,
    page: Int,
    pageSize: Int,
    productIdsFilter: Set<String>?,
): List<Pair<String, String>> {
    val offset = (page - 1).coerceAtLeast(0) * pageSize
    val params = mutableListOf(
        "select" to "id,title,description,price_amount,currency,tags,created_at,status",
        "status" to "eq.active",
        "order" to sortOption.apiOrder,
        "limit" to (pageSize + 1).toString(),
        "offset" to offset.toString(),
    )

    val trimmedQuery = query.trim()
    if (trimmedQuery.isNotEmpty()) {
        val escaped = escapeIlikeValue(trimmedQuery)
        params += "or" to "(title.ilike.*$escaped*,description.ilike.*$escaped*)"
    }

    if (productIdsFilter != null) {
        if (productIdsFilter.isEmpty()) {
            params += "id" to "in.()"
        } else {
            val joinedIds = productIdsFilter.joinToString(",") { id ->
                URLEncoder.encode(id, StandardCharsets.UTF_8).replace("+", "%20")
            }
            params += "id" to "in.($joinedIds)"
        }
    }

    return params
}

private fun escapeIlikeValue(value: String): String {
    return value
        .replace("%", "\\%")
        .replace("_", "\\_")
        .replace(",", "")
        .replace("(", "")
        .replace(")", "")
}
