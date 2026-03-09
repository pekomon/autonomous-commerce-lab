import Foundation
import SwiftUI

@MainActor
final class ProductsListViewModel: ObservableObject {
    @Published var queryInput = ""
    @Published var categories = [Category]()
    @Published var selectedCategoryID = allCategoriesId
    @Published var selectedSort: ProductSortOption = .newest
    @Published var products = [ProductSummary]()
    @Published var isLoading = false
    @Published var isLoadingMore = false
    @Published var hasMore = false
    @Published var categoryErrorMessage: String?
    @Published var productErrorMessage: String?

    private let repository: StorefrontRepository
    private var page = 1
    private let pageSize = 20
    private var activeQuery = ""
    private var debounceTask: Task<Void, Never>?
    private var requestID = 0

    init(repository: StorefrontRepository) {
        self.repository = repository
        Task {
            await loadInitialState(forceCategoryReload: true)
        }
    }

    func onSearchInputChanged(_ value: String) {
        queryInput = value
        debounceTask?.cancel()

        debounceTask = Task {
            try? await Task.sleep(nanoseconds: 350_000_000)
            if Task.isCancelled {
                return
            }

            activeQuery = value.trimmingCharacters(in: .whitespacesAndNewlines)
            await reloadProducts()
        }
    }

    func onCategoryChanged(_ categoryID: String) {
        guard categoryID != selectedCategoryID else {
            return
        }

        selectedCategoryID = categoryID
        commitPendingSearch()
        Task {
            await reloadProducts()
        }
    }

    func onSortChanged(_ sortOption: ProductSortOption) {
        guard sortOption != selectedSort else {
            return
        }

        selectedSort = sortOption
        commitPendingSearch()
        Task {
            await reloadProducts()
        }
    }

    func onLoadMoreTapped() {
        guard !isLoading, !isLoadingMore, hasMore else {
            return
        }

        Task {
            await fetchProducts(page: page + 1, append: true)
        }
    }

    func retry() {
        commitPendingSearch()
        Task {
            await loadInitialState(forceCategoryReload: true)
        }
    }

    func retryProducts() {
        commitPendingSearch()
        Task {
            await reloadProducts()
        }
    }

    private func commitPendingSearch() {
        debounceTask?.cancel()
        activeQuery = queryInput.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private func loadInitialState(forceCategoryReload: Bool) async {
        isLoading = true

        if forceCategoryReload || categories.isEmpty {
            do {
                categories = try await repository.fetchCategories()
                categoryErrorMessage = nil
            } catch {
                categoryErrorMessage = "Unable to load categories. Retry to load filters."
            }
        }

        await reloadProducts()
    }

    private func reloadProducts() async {
        page = 1
        await fetchProducts(page: 1, append: false)
    }

    private func fetchProducts(page requestedPage: Int, append: Bool) async {
        let startedRequestID = requestID + 1
        requestID = startedRequestID

        if append {
            isLoadingMore = true
        } else {
            isLoading = true
            products = []
        }
        productErrorMessage = nil

        do {
            let result = try await repository.fetchProducts(
                query: activeQuery,
                categoryID: selectedCategoryID,
                sortOption: selectedSort,
                page: requestedPage,
                pageSize: pageSize
            )

            guard startedRequestID == requestID else {
                return
            }

            page = requestedPage
            hasMore = result.hasMore

            if append {
                let existingIDs = Set(products.map(\.id))
                let uniqueNewItems = result.items.filter { !existingIDs.contains($0.id) }
                products += uniqueNewItems
            } else {
                products = result.items
            }
        } catch {
            guard startedRequestID == requestID else {
                return
            }

            productErrorMessage = "Unable to load products. Check local iOS configuration and Supabase connectivity."
        }

        isLoading = false
        isLoadingMore = false
    }
}

@MainActor
final class ProductDetailViewModel: ObservableObject {
    @Published var product: ProductDetail?
    @Published var loading = true
    @Published var errorMessage: String?

    private let productID: String
    private let repository: StorefrontRepository

    init(productID: String, repository: StorefrontRepository) {
        self.productID = productID
        self.repository = repository
        Task {
            await load()
        }
    }

    func load() async {
        loading = true
        errorMessage = nil

        do {
            product = try await repository.fetchProductDetail(productID: productID)
            if product == nil {
                errorMessage = "Product not found."
            }
        } catch {
            errorMessage = "Unable to load product details."
        }

        loading = false
    }
}
