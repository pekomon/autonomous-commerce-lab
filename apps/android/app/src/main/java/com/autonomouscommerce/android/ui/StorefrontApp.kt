package com.autonomouscommerce.android.ui

import androidx.compose.runtime.Composable
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.autonomouscommerce.android.data.StorefrontRepository
import com.autonomouscommerce.android.ui.screens.ProductDetailScreen
import com.autonomouscommerce.android.ui.screens.ProductDetailViewModel
import com.autonomouscommerce.android.ui.screens.ProductsScreen
import com.autonomouscommerce.android.ui.screens.ProductsViewModel

@Composable
fun StorefrontApp(repository: StorefrontRepository) {
    val navController = rememberNavController()

    NavHost(navController = navController, startDestination = "products") {
        composable(route = "products") {
            val viewModel: ProductsViewModel = viewModel(
                factory = ProductsViewModel.Factory(repository),
            )

            ProductsScreen(
                viewModel = viewModel,
                onOpenProduct = { productId ->
                    navController.navigate("product/$productId")
                },
            )
        }

        composable(
            route = "product/{productId}",
            arguments = listOf(navArgument("productId") { type = NavType.StringType }),
        ) { backStackEntry ->
            val productId = checkNotNull(backStackEntry.arguments?.getString("productId"))
            val viewModel: ProductDetailViewModel = viewModel(
                factory = ProductDetailViewModel.Factory(
                    repository = repository,
                    productId = productId,
                ),
            )

            ProductDetailScreen(
                viewModel = viewModel,
                onBack = { navController.popBackStack() },
            )
        }
    }
}
