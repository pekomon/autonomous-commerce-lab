package com.autonomouscommerce.android.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class ProductRowDto(
    val id: String,
    val title: String,
    val description: String? = null,
    @SerialName("price_amount") val priceAmount: Int,
    val currency: String,
    val tags: List<String>? = null,
    @SerialName("created_at") val createdAt: String,
)

@Serializable
data class CategoryRowDto(
    val id: String,
    val name: String,
)

@Serializable
data class ProductCategoryRowDto(
    @SerialName("product_id") val productId: String,
    @SerialName("category_id") val categoryId: String,
)

@Serializable
data class ProductImageRowDto(
    @SerialName("product_id") val productId: String,
    val path: String,
    @SerialName("sort_order") val sortOrder: Int,
)
