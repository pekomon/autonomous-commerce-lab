package com.autonomouscommerce.android.model

data class PagedResult<T>(
    val items: List<T>,
    val hasMore: Boolean,
)
