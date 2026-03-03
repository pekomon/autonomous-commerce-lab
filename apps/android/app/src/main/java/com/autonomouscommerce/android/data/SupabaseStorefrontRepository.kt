package com.autonomouscommerce.android.data

import com.autonomouscommerce.android.model.Category
import com.autonomouscommerce.android.model.PagedResult
import com.autonomouscommerce.android.model.ProductDetail
import com.autonomouscommerce.android.model.ProductSummary
import com.autonomouscommerce.android.model.SortOption
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.json.Json
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.OkHttpClient
import okhttp3.Request

class SupabaseStorefrontRepository(
    private val supabaseUrl: String,
    private val supabaseAnonKey: String,
    private val httpClient: OkHttpClient = OkHttpClient(),
) : StorefrontRepository {
    private val json = Json {
        ignoreUnknownKeys = true
    }

    private var cachedCategories: List<Category>? = null
    private val productsCache = mutableMapOf<String, PagedResult<ProductSummary>>()
    private val productDetailsCache = mutableMapOf<String, ProductDetail>()

    override suspend fun fetchCategories(): List<Category> = withContext(Dispatchers.IO) {
        cachedCategories?.let { return@withContext it }

        val response = getJsonArray(
            path = "categories",
            queryParams = listOf(
                "select" to "id,name",
                "order" to "name.asc",
            ),
        )

        val rows = json.decodeFromString(ListSerializer(CategoryRowDto.serializer()), response)
        val categories = rows.map { row ->
            Category(
                id = row.id,
                name = row.name,
            )
        }

        cachedCategories = categories
        categories
    }

    override suspend fun fetchProducts(
        query: String,
        categoryId: String,
        sortOption: SortOption,
        page: Int,
        pageSize: Int,
    ): PagedResult<ProductSummary> = withContext(Dispatchers.IO) {
        val cacheKey = buildProductsCacheKey(query, categoryId, sortOption, page, pageSize)
        productsCache[cacheKey]?.let { return@withContext it }

        val productIdsFilter = if (categoryId == ALL_CATEGORY_ID) {
            null
        } else {
            fetchProductIdsForCategory(categoryId)
        }

        if (productIdsFilter != null && productIdsFilter.isEmpty()) {
            val empty = PagedResult(items = emptyList<ProductSummary>(), hasMore = false)
            productsCache[cacheKey] = empty
            return@withContext empty
        }

        val productRows = fetchProductRows(query, sortOption, page, pageSize, productIdsFilter)
        if (productRows.isEmpty()) {
            val empty = PagedResult(items = emptyList<ProductSummary>(), hasMore = false)
            productsCache[cacheKey] = empty
            return@withContext empty
        }

        val productIds = productRows.take(pageSize).map { row -> row.id }
        val firstImageByProductId = fetchFirstImageByProductId(productIds)

        val paged = PagedResult(
            items = productRows
                .take(pageSize)
                .map { row ->
                    ProductSummary(
                        id = row.id,
                        title = row.title,
                        description = row.description.orEmpty(),
                        priceAmount = row.priceAmount,
                        currency = row.currency,
                        tags = row.tags ?: emptyList(),
                        createdAt = row.createdAt,
                        thumbnailUrl = firstImageByProductId[row.id],
                    )
                },
            hasMore = productRows.size > pageSize,
        )

        productsCache[cacheKey] = paged
        paged
    }

    override suspend fun fetchProductDetail(productId: String): ProductDetail? = withContext(Dispatchers.IO) {
        productDetailsCache[productId]?.let { return@withContext it }

        val productResponse = getJsonArray(
            path = "products",
            queryParams = listOf(
                "select" to "id,title,description,price_amount,currency,tags,created_at,status",
                "id" to "eq.$productId",
                "status" to "eq.active",
                "limit" to "1",
            ),
        )

        val productRows = json.decodeFromString(ListSerializer(ProductRowDto.serializer()), productResponse)
        val product = productRows.firstOrNull() ?: return@withContext null

        val categoryIds = fetchCategoryIdsForProduct(productId)
        val categoriesById = fetchCategories().associateBy { category -> category.id }
        val categories = categoryIds.mapNotNull { id -> categoriesById[id] }

        val imagesResponse = getJsonArray(
            path = "product_images",
            queryParams = listOf(
                "select" to "product_id,path,sort_order",
                "product_id" to "eq.$productId",
                "order" to "sort_order.asc",
            ),
        )
        val imageRows = json.decodeFromString(ListSerializer(ProductImageRowDto.serializer()), imagesResponse)

        val detail = ProductDetail(
            id = product.id,
            title = product.title,
            description = product.description.orEmpty(),
            priceAmount = product.priceAmount,
            currency = product.currency,
            tags = product.tags ?: emptyList(),
            createdAt = product.createdAt,
            imageUrls = imageRows.map { row -> buildPublicImageUrl(supabaseUrl, row.path) },
            categories = categories,
        )

        productDetailsCache[productId] = detail
        detail
    }

    private suspend fun fetchProductRows(
        query: String,
        sortOption: SortOption,
        page: Int,
        pageSize: Int,
        productIdsFilter: Set<String>?,
    ): List<ProductRowDto> {
        val response = getJsonArray(
            path = "products",
            queryParams = buildProductsQueryParams(
                query = query,
                sortOption = sortOption,
                page = page,
                pageSize = pageSize,
                productIdsFilter = productIdsFilter,
            ),
        )

        return json.decodeFromString(ListSerializer(ProductRowDto.serializer()), response)
    }

    private suspend fun fetchProductIdsForCategory(categoryId: String): Set<String> {
        val response = getJsonArray(
            path = "product_categories",
            queryParams = listOf(
                "select" to "product_id",
                "category_id" to "eq.$categoryId",
            ),
        )

        val rows = json.decodeFromString(ListSerializer(ProductCategoryRowDto.serializer()), response)
        return rows.map { row -> row.productId }.toSet()
    }

    private suspend fun fetchCategoryIdsForProduct(productId: String): List<String> {
        val response = getJsonArray(
            path = "product_categories",
            queryParams = listOf(
                "select" to "product_id,category_id",
                "product_id" to "eq.$productId",
            ),
        )

        val rows = json.decodeFromString(ListSerializer(ProductCategoryRowDto.serializer()), response)
        return rows.map { row -> row.categoryId }
    }

    private suspend fun fetchFirstImageByProductId(productIds: List<String>): Map<String, String> {
        if (productIds.isEmpty()) {
            return emptyMap()
        }

        val idsFilter = productIds.joinToString(",")
        val response = getJsonArray(
            path = "product_images",
            queryParams = listOf(
                "select" to "product_id,path,sort_order",
                "product_id" to "in.($idsFilter)",
                "order" to "product_id.asc,sort_order.asc",
            ),
        )

        val rows = json.decodeFromString(ListSerializer(ProductImageRowDto.serializer()), response)
        val firstImageByProductId = linkedMapOf<String, String>()
        rows.forEach { row ->
            if (firstImageByProductId[row.productId] == null) {
                firstImageByProductId[row.productId] = buildPublicImageUrl(supabaseUrl, row.path)
            }
        }

        return firstImageByProductId
    }

    private fun getJsonArray(path: String, queryParams: List<Pair<String, String>>): String {
        val baseUrl = "${supabaseUrl.trimEnd('/')}/rest/v1/$path"
        val httpUrlBuilder = baseUrl.toHttpUrlOrNull()?.newBuilder()
            ?: error("Invalid Supabase URL. Configure SUPABASE_URL in local.properties.")

        queryParams.forEach { (name, value) ->
            httpUrlBuilder.addQueryParameter(name, value)
        }

        val request = Request.Builder()
            .url(httpUrlBuilder.build())
            .header("apikey", supabaseAnonKey)
            .header("Authorization", "Bearer $supabaseAnonKey")
            .header("Accept", "application/json")
            .build()

        httpClient.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                val message = response.body?.string().orEmpty()
                error("Supabase request failed (${response.code}): $message")
            }

            return response.body?.string().orEmpty()
        }
    }

    companion object {
        const val ALL_CATEGORY_ID = "all"
    }
}
