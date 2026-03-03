package com.autonomouscommerce.android.ui.screens

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.autonomouscommerce.android.data.StorefrontRepository
import com.autonomouscommerce.android.data.SupabaseStorefrontRepository
import com.autonomouscommerce.android.model.Category
import com.autonomouscommerce.android.model.ProductSummary
import com.autonomouscommerce.android.model.SortOption
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ProductsUiState(
    val queryInput: String = "",
    val categories: List<Category> = emptyList(),
    val selectedCategoryId: String = SupabaseStorefrontRepository.ALL_CATEGORY_ID,
    val selectedSort: SortOption = SortOption.Newest,
    val products: List<ProductSummary> = emptyList(),
    val isLoading: Boolean = false,
    val isLoadingMore: Boolean = false,
    val errorMessage: String? = null,
    val hasMore: Boolean = false,
)

class ProductsViewModel(
    private val repository: StorefrontRepository,
) : ViewModel() {
    private val _uiState = MutableStateFlow(ProductsUiState())
    val uiState: StateFlow<ProductsUiState> = _uiState.asStateFlow()

    private var currentPage = 1
    private var activeQuery = ""
    private var queryDebounceJob: Job? = null
    private var requestId = 0

    init {
        loadInitialData()
    }

    fun onQueryInputChanged(value: String) {
        _uiState.update { state ->
            state.copy(queryInput = value)
        }

        queryDebounceJob?.cancel()
        queryDebounceJob = viewModelScope.launch {
            delay(350)
            activeQuery = value.trim()
            reloadProducts()
        }
    }

    fun onCategoryChanged(categoryId: String) {
        _uiState.update { state ->
            state.copy(selectedCategoryId = categoryId)
        }
        reloadProducts()
    }

    fun onSortChanged(sortOption: SortOption) {
        _uiState.update { state ->
            state.copy(selectedSort = sortOption)
        }
        reloadProducts()
    }

    fun onLoadMore() {
        val state = _uiState.value
        if (state.isLoading || state.isLoadingMore || !state.hasMore) {
            return
        }

        fetchProductsPage(page = currentPage + 1, append = true)
    }

    fun onRetry() {
        reloadProducts()
    }

    private fun loadInitialData() {
        viewModelScope.launch {
            _uiState.update { state -> state.copy(isLoading = true, errorMessage = null) }

            try {
                val categories = repository.fetchCategories()
                _uiState.update { state -> state.copy(categories = categories) }
            } catch (_: Exception) {
                _uiState.update { state ->
                    state.copy(errorMessage = "Unable to load categories.")
                }
            }

            reloadProducts()
        }
    }

    private fun reloadProducts() {
        currentPage = 1
        fetchProductsPage(page = 1, append = false)
    }

    private fun fetchProductsPage(page: Int, append: Boolean) {
        val startedRequestId = ++requestId
        val state = _uiState.value

        _uiState.update { current ->
            current.copy(
                isLoading = !append,
                isLoadingMore = append,
                errorMessage = null,
                products = if (append) current.products else emptyList(),
            )
        }

        viewModelScope.launch {
            try {
                val result = repository.fetchProducts(
                    query = activeQuery,
                    categoryId = state.selectedCategoryId,
                    sortOption = state.selectedSort,
                    page = page,
                    pageSize = PAGE_SIZE,
                )

                if (startedRequestId != requestId) {
                    return@launch
                }

                currentPage = page
                _uiState.update { current ->
                    val merged = if (append) {
                        val existingIds = current.products.map { product -> product.id }.toSet()
                        current.products + result.items.filterNot { product -> existingIds.contains(product.id) }
                    } else {
                        result.items
                    }

                    current.copy(
                        products = merged,
                        isLoading = false,
                        isLoadingMore = false,
                        hasMore = result.hasMore,
                    )
                }
            } catch (_: Exception) {
                if (startedRequestId != requestId) {
                    return@launch
                }

                _uiState.update { current ->
                    current.copy(
                        isLoading = false,
                        isLoadingMore = false,
                        errorMessage = "Unable to load products. Check local Supabase configuration.",
                    )
                }
            }
        }
    }

    class Factory(
        private val repository: StorefrontRepository,
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return ProductsViewModel(repository = repository) as T
        }
    }

    companion object {
        const val PAGE_SIZE = 20
    }
}
