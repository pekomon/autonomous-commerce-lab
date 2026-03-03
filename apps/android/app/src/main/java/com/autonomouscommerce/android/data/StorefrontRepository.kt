package com.autonomouscommerce.android.data

import com.autonomouscommerce.android.model.Category
import com.autonomouscommerce.android.model.PagedResult
import com.autonomouscommerce.android.model.ProductDetail
import com.autonomouscommerce.android.model.ProductSummary
import com.autonomouscommerce.android.model.SortOption

interface StorefrontRepository {
    suspend fun fetchCategories(): List<Category>

    suspend fun fetchProducts(
        query: String,
        categoryId: String,
        sortOption: SortOption,
        page: Int,
        pageSize: Int,
    ): PagedResult<ProductSummary>

    suspend fun fetchProductDetail(productId: String): ProductDetail?
}
