package com.autonomouscommerce.android.ui.screens

import androidx.activity.ComponentActivity
import androidx.compose.material3.MaterialTheme
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.autonomouscommerce.android.model.SortOption
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class ProductsScreenTest {
    @get:Rule
    val composeRule = createAndroidComposeRule<ComponentActivity>()

    @Test
    fun showsEmptyStateMessageWhenNoProductsLoaded() {
        composeRule.setContent {
            MaterialTheme {
                ProductsScreenContent(
                    state = ProductsUiState(
                        isLoading = false,
                        isLoadingMore = false,
                        errorMessage = null,
                        products = emptyList(),
                        hasMore = false,
                        selectedSort = SortOption.Newest,
                    ),
                    onQueryInputChanged = {},
                    onCategoryChanged = {},
                    onSortChanged = {},
                    onRetry = {},
                    onLoadMore = {},
                    onOpenProduct = {},
                )
            }
        }

        composeRule
            .onNodeWithText("No products found. Try adjusting search, category, or sort.")
            .assertIsDisplayed()
    }

    @Test
    fun hidesEmptyStateMessageWhenErrorIsVisible() {
        composeRule.setContent {
            MaterialTheme {
                ProductsScreenContent(
                    state = ProductsUiState(
                        isLoading = false,
                        isLoadingMore = false,
                        errorMessage = "Unable to load products.",
                        products = emptyList(),
                        hasMore = false,
                        selectedSort = SortOption.Newest,
                    ),
                    onQueryInputChanged = {},
                    onCategoryChanged = {},
                    onSortChanged = {},
                    onRetry = {},
                    onLoadMore = {},
                    onOpenProduct = {},
                )
            }
        }

        composeRule
            .onAllNodesWithText("No products found. Try adjusting search, category, or sort.")
            .assertCountEquals(0)
    }
}
