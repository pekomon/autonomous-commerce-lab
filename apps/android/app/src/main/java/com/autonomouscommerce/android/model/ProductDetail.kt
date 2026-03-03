package com.autonomouscommerce.android.model

data class ProductDetail(
    val id: String,
    val title: String,
    val description: String,
    val priceAmount: Int,
    val currency: String,
    val tags: List<String>,
    val createdAt: String,
    val imageUrls: List<String>,
    val categories: List<Category>,
)
