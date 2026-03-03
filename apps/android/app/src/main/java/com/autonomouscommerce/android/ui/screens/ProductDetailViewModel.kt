package com.autonomouscommerce.android.ui.screens

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.autonomouscommerce.android.data.StorefrontRepository
import com.autonomouscommerce.android.model.ProductDetail
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ProductDetailUiState(
    val loading: Boolean = true,
    val errorMessage: String? = null,
    val product: ProductDetail? = null,
)

class ProductDetailViewModel(
    private val repository: StorefrontRepository,
    private val productId: String,
) : ViewModel() {
    private val _uiState = MutableStateFlow(ProductDetailUiState())
    val uiState: StateFlow<ProductDetailUiState> = _uiState.asStateFlow()

    init {
        load()
    }

    fun load() {
        _uiState.update { state -> state.copy(loading = true, errorMessage = null) }

        viewModelScope.launch {
            try {
                val product = repository.fetchProductDetail(productId)
                if (product == null) {
                    _uiState.update { state ->
                        state.copy(loading = false, errorMessage = "Product not found.")
                    }
                } else {
                    _uiState.update { state ->
                        state.copy(loading = false, product = product)
                    }
                }
            } catch (_: Exception) {
                _uiState.update { state ->
                    state.copy(loading = false, errorMessage = "Unable to load product details.")
                }
            }
        }
    }

    class Factory(
        private val repository: StorefrontRepository,
        private val productId: String,
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            return ProductDetailViewModel(repository = repository, productId = productId) as T
        }
    }
}
