package com.autonomouscommerce.android.ui.screens

import androidx.arch.core.executor.testing.InstantTaskExecutorRule
import com.autonomouscommerce.android.data.StorefrontRepository
import com.autonomouscommerce.android.model.Category
import com.autonomouscommerce.android.model.PagedResult
import com.autonomouscommerce.android.model.ProductDetail
import com.autonomouscommerce.android.model.ProductSummary
import com.autonomouscommerce.android.model.SortOption
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Rule
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class ProductsViewModelTest {
    @get:Rule
    val instantTaskExecutorRule = InstantTaskExecutorRule()

    private val testDispatcher = StandardTestDispatcher()

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `initial load keeps empty state when repository returns no products`() = runTest {
        val repository = FakeStorefrontRepository(
            categories = listOf(Category(id = "cat-1", name = "Accessories")),
            pagedProducts = PagedResult(items = emptyList(), hasMore = false),
        )

        val viewModel = ProductsViewModel(repository)
        advanceUntilIdle()

        val state = viewModel.uiState.value
        assertFalse(state.isLoading)
        assertFalse(state.isLoadingMore)
        assertNull(state.errorMessage)
        assertFalse(state.hasMore)
        assertEquals(0, state.products.size)
    }

    private class FakeStorefrontRepository(
        private val categories: List<Category>,
        private val pagedProducts: PagedResult<ProductSummary>,
    ) : StorefrontRepository {
        override suspend fun fetchCategories(): List<Category> = categories

        override suspend fun fetchProducts(
            query: String,
            categoryId: String,
            sortOption: SortOption,
            page: Int,
            pageSize: Int,
        ): PagedResult<ProductSummary> = pagedProducts

        override suspend fun fetchProductDetail(productId: String): ProductDetail? = null
    }
}
