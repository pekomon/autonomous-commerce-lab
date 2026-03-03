package com.autonomouscommerce.android.model

data class ProductSummary(
    val id: String,
    val title: String,
    val description: String,
    val priceAmount: Int,
    val currency: String,
    val tags: List<String>,
    val createdAt: String,
    val thumbnailUrl: String?,
)
