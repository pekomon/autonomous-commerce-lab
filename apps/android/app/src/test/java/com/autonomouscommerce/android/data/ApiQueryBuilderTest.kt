package com.autonomouscommerce.android.data

import com.autonomouscommerce.android.model.SortOption
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Test

class ApiQueryBuilderTest {
    @Test
    fun `buildProductsQueryParams includes pagination sort and search filters`() {
        val params = buildProductsQueryParams(
            query = "  camera  ",
            sortOption = SortOption.PriceLowToHigh,
            page = 2,
            pageSize = 20,
            productIdsFilter = linkedSetOf("prod-1", "prod-2"),
        ).toMap()

        assertEquals("price_amount.asc", params["order"])
        assertEquals("21", params["limit"])
        assertEquals("20", params["offset"])
        assertEquals("(title.ilike.*camera*,description.ilike.*camera*)", params["or"])
        assertEquals("in.(prod-1,prod-2)", params["id"])
    }

    @Test
    fun `buildProductsCacheKey normalizes query and includes page data`() {
        val first = buildProductsCacheKey(
            query = "  Summer Hat  ",
            categoryId = "all",
            sortOption = SortOption.Newest,
            page = 1,
            pageSize = 20,
        )

        val sameNormalized = buildProductsCacheKey(
            query = "summer hat",
            categoryId = "all",
            sortOption = SortOption.Newest,
            page = 1,
            pageSize = 20,
        )

        val differentPage = buildProductsCacheKey(
            query = "summer hat",
            categoryId = "all",
            sortOption = SortOption.Newest,
            page = 2,
            pageSize = 20,
        )

        assertEquals(first, sameNormalized)
        assertNotEquals(first, differentPage)
    }
}
