import Foundation
import SwiftUI

private let allCategoriesId = "all"
private let productImagesBucket = "product-images"

enum ProductSortOption: String, CaseIterable, Identifiable {
    case newest
    case priceLowToHigh
    case priceHighToLow

    var id: String { rawValue }

    var label: String {
        switch self {
        case .newest:
            return "Newest"
        case .priceLowToHigh:
            return "Price low -> high"
        case .priceHighToLow:
            return "Price high -> low"
        }
    }

    var orderValue: String {
        switch self {
        case .newest:
            return "created_at.desc"
        case .priceLowToHigh:
            return "price_amount.asc"
        case .priceHighToLow:
            return "price_amount.desc"
        }
    }
}

struct Category: Identifiable, Equatable {
    let id: String
    let name: String
}

struct ProductSummary: Identifiable, Equatable {
    let id: String
    let title: String
    let description: String
    let priceAmount: Int
    let currency: String
    let tags: [String]
    let thumbnailURL: URL?
}

struct ProductDetail: Identifiable, Equatable {
    let id: String
    let title: String
    let description: String
    let priceAmount: Int
    let currency: String
    let tags: [String]
    let imageURLs: [URL]
    let categories: [Category]
}

struct PagedProducts {
    let items: [ProductSummary]
    let hasMore: Bool
}

struct SupabaseRuntimeConfig {
    let url: String
    let anonKey: String

    var validationError: String? {
        if url.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return "SUPABASE_URL is missing."
        }

        if anonKey.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return "SUPABASE_ANON_KEY is missing."
        }

        return nil
    }

    static func fromBundle(bundle: Bundle = .main) -> SupabaseRuntimeConfig {
        let url = bundle.object(forInfoDictionaryKey: "SUPABASE_URL") as? String ?? ""
        let anonKey = bundle.object(forInfoDictionaryKey: "SUPABASE_ANON_KEY") as? String ?? ""
        return SupabaseRuntimeConfig(url: url, anonKey: anonKey)
    }
}

enum APIError: LocalizedError {
    case invalidURL
    case invalidResponse
    case serverError(code: Int, body: String)
    case decodingError

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid Supabase URL."
        case .invalidResponse:
            return "Invalid server response."
        case let .serverError(code, body):
            return "Server error \(code): \(body)"
        case .decodingError:
            return "Unable to decode response from Supabase."
        }
    }
}

protocol StorefrontRepository {
    func fetchCategories() async throws -> [Category]

    func fetchProducts(
        query: String,
        categoryID: String,
        sortOption: ProductSortOption,
        page: Int,
        pageSize: Int
    ) async throws -> PagedProducts

    func fetchProductDetail(productID: String) async throws -> ProductDetail?
}

struct PostgrestQueryBuilder {
    static func buildProductsCacheKey(
        query: String,
        categoryID: String,
        sortOption: ProductSortOption,
        page: Int,
        pageSize: Int
    ) -> String {
        "\(query.trimmingCharacters(in: .whitespacesAndNewlines).lowercased())|\(categoryID)|\(sortOption.rawValue)|\(page)|\(pageSize)"
    }

    static func buildProductsQueryItems(
        query: String,
        sortOption: ProductSortOption,
        page: Int,
        pageSize: Int,
        productIDsFilter: [String]?
    ) -> [URLQueryItem] {
        let safePage = max(1, page)
        let offset = (safePage - 1) * pageSize

        var items = [
            URLQueryItem(name: "select", value: "id,title,description,price_amount,currency,tags,created_at,status"),
            URLQueryItem(name: "status", value: "eq.active"),
            URLQueryItem(name: "order", value: sortOption.orderValue),
            URLQueryItem(name: "limit", value: String(pageSize + 1)),
            URLQueryItem(name: "offset", value: String(offset)),
        ]

        let trimmedQuery = query.trimmingCharacters(in: .whitespacesAndNewlines)
        if !trimmedQuery.isEmpty {
            let escaped = sanitizeSearchQuery(trimmedQuery)
            items.append(
                URLQueryItem(
                    name: "or",
                    value: "(title.ilike.*\(escaped)*,description.ilike.*\(escaped)*)"
                )
            )
        }

        if let productIDsFilter {
            if productIDsFilter.isEmpty {
                items.append(URLQueryItem(name: "id", value: "in.()"))
            } else {
                items.append(URLQueryItem(name: "id", value: "in.(\(productIDsFilter.joined(separator: ",")))"))
            }
        }

        return items
    }

    private static func sanitizeSearchQuery(_ query: String) -> String {
        query
            .replacingOccurrences(of: "%", with: "")
            .replacingOccurrences(of: "_", with: "")
            .replacingOccurrences(of: ",", with: "")
            .replacingOccurrences(of: "(", with: "")
            .replacingOccurrences(of: ")", with: "")
    }
}

func formatPrice(amountInCents: Int, currencyCode: String) -> String {
    let formatter = NumberFormatter()
    formatter.numberStyle = .currency
    formatter.locale = Locale(identifier: "en_US")

    if let currency = CurrencyCode(rawValue: currencyCode) {
        formatter.currencyCode = currency.rawValue
    } else {
        formatter.currencyCode = CurrencyCode.usd.rawValue
    }

    return formatter.string(from: NSNumber(value: Double(amountInCents) / 100.0)) ?? "-"
}

private enum CurrencyCode: String {
    case usd = "USD"
    case eur = "EUR"
}

func buildPublicImageURL(baseURL: String, path: String) -> URL? {
    let trimmed = baseURL.trimmingCharacters(in: .whitespacesAndNewlines).trimmingCharacters(in: CharacterSet(charactersIn: "/"))
    guard !trimmed.isEmpty else {
        return nil
    }

    let encodedPath = path
        .split(separator: "/")
        .map { part in
            String(part).addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? String(part)
        }
        .joined(separator: "/")

    return URL(string: "\(trimmed)/storage/v1/object/public/\(productImagesBucket)/\(encodedPath)")
}

final class SupabaseAPIClient {
    private let baseURL: String
    private let anonKey: String
    private let session: URLSession

    init(config: SupabaseRuntimeConfig, session: URLSession = .shared) {
        baseURL = config.url.trimmingCharacters(in: .whitespacesAndNewlines).trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        anonKey = config.anonKey.trimmingCharacters(in: .whitespacesAndNewlines)
        self.session = session
    }

    func request(path: String, queryItems: [URLQueryItem]) async throws -> Data {
        guard var components = URLComponents(string: "\(baseURL)/rest/v1/\(path)") else {
            throw APIError.invalidURL
        }
        components.queryItems = queryItems

        guard let url = components.url else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(anonKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        let (data, response) = try await session.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        guard (200 ... 299).contains(httpResponse.statusCode) else {
            throw APIError.serverError(
                code: httpResponse.statusCode,
                body: String(data: data, encoding: .utf8) ?? ""
            )
        }

        return data
    }
}

final class SupabaseStorefrontRepository: StorefrontRepository {
    private let apiClient: SupabaseAPIClient
    private let config: SupabaseRuntimeConfig
    private let decoder = JSONDecoder()

    // Simple in-memory cache scoped to one app process.
    // Limitations: no TTL/invalidation and data may become stale until app restart.
    private var categoriesCache: [Category]?
    private var productsCache = [String: PagedProducts]()
    private var detailCache = [String: ProductDetail]()

    init(apiClient: SupabaseAPIClient, config: SupabaseRuntimeConfig) {
        self.apiClient = apiClient
        self.config = config
    }

    func fetchCategories() async throws -> [Category] {
        if let categoriesCache {
            return categoriesCache
        }

        let data = try await apiClient.request(
            path: "categories",
            queryItems: [
                URLQueryItem(name: "select", value: "id,name"),
                URLQueryItem(name: "order", value: "name.asc"),
            ]
        )

        let rows = try decode([CategoryRowDTO].self, from: data)
        let categories = rows.map { row in
            Category(id: row.id, name: row.name)
        }

        categoriesCache = categories
        return categories
    }

    func fetchProducts(
        query: String,
        categoryID: String,
        sortOption: ProductSortOption,
        page: Int,
        pageSize: Int
    ) async throws -> PagedProducts {
        let cacheKey = PostgrestQueryBuilder.buildProductsCacheKey(
            query: query,
            categoryID: categoryID,
            sortOption: sortOption,
            page: page,
            pageSize: pageSize
        )
        if let cached = productsCache[cacheKey] {
            return cached
        }

        let productIDsFilter: [String]?
        if categoryID == allCategoriesId {
            productIDsFilter = nil
        } else {
            productIDsFilter = try await fetchProductIDs(forCategoryID: categoryID)
        }

        if let productIDsFilter, productIDsFilter.isEmpty {
            let empty = PagedProducts(items: [], hasMore: false)
            productsCache[cacheKey] = empty
            return empty
        }

        let productsData = try await apiClient.request(
            path: "products",
            queryItems: PostgrestQueryBuilder.buildProductsQueryItems(
                query: query,
                sortOption: sortOption,
                page: page,
                pageSize: pageSize,
                productIDsFilter: productIDsFilter
            )
        )
        let productRows = try decode([ProductRowDTO].self, from: productsData)

        let pageRows = Array(productRows.prefix(pageSize))
        let hasMore = productRows.count > pageSize

        let productIDs = pageRows.map { $0.id }
        let firstImageByProductID = try await fetchFirstImagesByProductID(productIDs: productIDs)

        let products = pageRows.map { row in
            ProductSummary(
                id: row.id,
                title: row.title,
                description: row.description ?? "",
                priceAmount: row.priceAmount,
                currency: row.currency,
                tags: row.tags ?? [],
                thumbnailURL: firstImageByProductID[row.id]
            )
        }

        let pagedProducts = PagedProducts(items: products, hasMore: hasMore)
        productsCache[cacheKey] = pagedProducts
        return pagedProducts
    }

    func fetchProductDetail(productID: String) async throws -> ProductDetail? {
        if let cached = detailCache[productID] {
            return cached
        }

        let productData = try await apiClient.request(
            path: "products",
            queryItems: [
                URLQueryItem(name: "select", value: "id,title,description,price_amount,currency,tags,created_at,status"),
                URLQueryItem(name: "id", value: "eq.\(productID)"),
                URLQueryItem(name: "status", value: "eq.active"),
                URLQueryItem(name: "limit", value: "1"),
            ]
        )

        let products = try decode([ProductRowDTO].self, from: productData)
        guard let row = products.first else {
            return nil
        }

        let imageRows = try await fetchProductImages(productID: productID)
        let categoryIDs = try await fetchCategoryIDs(forProductID: productID)
        let categoryByID = Dictionary(uniqueKeysWithValues: try await fetchCategories().map { ($0.id, $0) })

        let detail = ProductDetail(
            id: row.id,
            title: row.title,
            description: row.description ?? "",
            priceAmount: row.priceAmount,
            currency: row.currency,
            tags: row.tags ?? [],
            imageURLs: imageRows.compactMap { buildPublicImageURL(baseURL: config.url, path: $0.path) },
            categories: categoryIDs.compactMap { categoryByID[$0] }
        )

        detailCache[productID] = detail
        return detail
    }

    private func fetchProductIDs(forCategoryID categoryID: String) async throws -> [String] {
        let data = try await apiClient.request(
            path: "product_categories",
            queryItems: [
                URLQueryItem(name: "select", value: "product_id"),
                URLQueryItem(name: "category_id", value: "eq.\(categoryID)"),
            ]
        )

        let rows = try decode([ProductCategoryRowDTO].self, from: data)
        return rows.map(\.productID)
    }

    private func fetchCategoryIDs(forProductID productID: String) async throws -> [String] {
        let data = try await apiClient.request(
            path: "product_categories",
            queryItems: [
                URLQueryItem(name: "select", value: "product_id,category_id"),
                URLQueryItem(name: "product_id", value: "eq.\(productID)"),
            ]
        )

        let rows = try decode([ProductCategoryRowDTO].self, from: data)
        return rows.compactMap(\.categoryID)
    }

    private func fetchProductImages(productID: String) async throws -> [ProductImageRowDTO] {
        let data = try await apiClient.request(
            path: "product_images",
            queryItems: [
                URLQueryItem(name: "select", value: "product_id,path,sort_order"),
                URLQueryItem(name: "product_id", value: "eq.\(productID)"),
                URLQueryItem(name: "order", value: "sort_order.asc"),
            ]
        )

        return try decode([ProductImageRowDTO].self, from: data)
    }

    private func fetchFirstImagesByProductID(productIDs: [String]) async throws -> [String: URL] {
        guard !productIDs.isEmpty else {
            return [:]
        }

        let data = try await apiClient.request(
            path: "product_images",
            queryItems: [
                URLQueryItem(name: "select", value: "product_id,path,sort_order"),
                URLQueryItem(name: "product_id", value: "in.(\(productIDs.joined(separator: ",")))"),
                URLQueryItem(name: "order", value: "product_id.asc,sort_order.asc"),
            ]
        )

        let rows = try decode([ProductImageRowDTO].self, from: data)
        var firstImageByProductID = [String: URL]()

        for row in rows {
            if firstImageByProductID[row.productID] == nil,
               let imageURL = buildPublicImageURL(baseURL: config.url, path: row.path)
            {
                firstImageByProductID[row.productID] = imageURL
            }
        }

        return firstImageByProductID
    }

    private func decode<T: Decodable>(_ type: T.Type, from data: Data) throws -> T {
        do {
            return try decoder.decode(type, from: data)
        } catch {
            throw APIError.decodingError
        }
    }
}

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
    @Published var errorMessage: String?

    private let repository: StorefrontRepository
    private var page = 1
    private let pageSize = 20
    private var activeQuery = ""
    private var debounceTask: Task<Void, Never>?
    private var requestID = 0

    init(repository: StorefrontRepository) {
        self.repository = repository
        Task {
            await loadInitialState()
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
        Task {
            await reloadProducts()
        }
    }

    func onSortChanged(_ sortOption: ProductSortOption) {
        guard sortOption != selectedSort else {
            return
        }

        selectedSort = sortOption
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
        Task {
            await reloadProducts()
        }
    }

    private func loadInitialState() async {
        isLoading = true
        errorMessage = nil

        do {
            categories = try await repository.fetchCategories()
        } catch {
            errorMessage = "Unable to load categories."
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
        errorMessage = nil

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

            errorMessage = "Unable to load products. Check local iOS configuration and Supabase connectivity."
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

struct ContentView: View {
    private let repository: StorefrontRepository
    @StateObject private var viewModel: ProductsListViewModel

    init(repository: StorefrontRepository) {
        self.repository = repository
        _viewModel = StateObject(wrappedValue: ProductsListViewModel(repository: repository))
    }

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 12) {
                searchAndFilterSection

                if viewModel.isLoading {
                    ProgressView("Loading products...")
                        .frame(maxWidth: .infinity, alignment: .center)
                }

                if let errorMessage = viewModel.errorMessage {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(errorMessage)
                            .foregroundStyle(.red)
                        Button("Retry") {
                            viewModel.retry()
                        }
                    }
                }

                if !viewModel.isLoading,
                   viewModel.errorMessage == nil,
                   viewModel.products.isEmpty
                {
                    Text("No products found. Try changing search, category, or sort.")
                        .foregroundStyle(.secondary)
                }

                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 12) {
                        ForEach(viewModel.products) { product in
                            NavigationLink {
                                ProductDetailView(productID: product.id, repository: repository)
                            } label: {
                                ProductRowView(product: product)
                            }
                            .buttonStyle(.plain)
                        }

                        if viewModel.isLoadingMore {
                            ProgressView("Loading more...")
                                .frame(maxWidth: .infinity)
                        }

                        if !viewModel.isLoading,
                           !viewModel.isLoadingMore,
                           viewModel.hasMore
                        {
                            Button("Load more") {
                                viewModel.onLoadMoreTapped()
                            }
                            .buttonStyle(.bordered)
                        }

                        if !viewModel.isLoading,
                           !viewModel.hasMore,
                           !viewModel.products.isEmpty
                        {
                            Text("End of results")
                                .font(.footnote)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding(.vertical, 4)
                }
            }
            .padding()
            .navigationTitle("Storefront")
        }
    }

    private var searchAndFilterSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            TextField(
                "Search products",
                text: Binding(
                    get: { viewModel.queryInput },
                    set: { value in
                        viewModel.onSearchInputChanged(value)
                    }
                )
            )
            .textFieldStyle(.roundedBorder)

            Picker("Category", selection: Binding(
                get: { viewModel.selectedCategoryID },
                set: { value in
                    viewModel.onCategoryChanged(value)
                }
            )) {
                Text("All categories").tag(allCategoriesId)
                ForEach(viewModel.categories) { category in
                    Text(category.name).tag(category.id)
                }
            }
            .pickerStyle(.menu)

            Picker("Sort", selection: Binding(
                get: { viewModel.selectedSort },
                set: { value in
                    viewModel.onSortChanged(value)
                }
            )) {
                ForEach(ProductSortOption.allCases) { option in
                    Text(option.label).tag(option)
                }
            }
            .pickerStyle(.menu)
        }
    }
}

private struct ProductRowView: View {
    let product: ProductSummary

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            AsyncImage(url: product.thumbnailURL) { phase in
                switch phase {
                case let .success(image):
                    image
                        .resizable()
                        .scaledToFill()
                default:
                    RoundedRectangle(cornerRadius: 8)
                        .fill(Color.gray.opacity(0.2))
                        .overlay {
                            Text("No image")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                }
            }
            .frame(width: 84, height: 84)
            .clipShape(RoundedRectangle(cornerRadius: 8))

            VStack(alignment: .leading, spacing: 6) {
                Text(product.title)
                    .font(.headline)
                    .foregroundStyle(.primary)
                    .multilineTextAlignment(.leading)
                Text(formatPrice(amountInCents: product.priceAmount, currencyCode: product.currency))
                    .font(.subheadline)
                    .foregroundStyle(.blue)

                if !product.description.isEmpty {
                    Text(product.description)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                }
            }

            Spacer()
        }
        .padding(10)
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }
}

private struct ProductDetailView: View {
    @StateObject private var viewModel: ProductDetailViewModel
    @State private var selectedImageIndex = 0

    init(productID: String, repository: StorefrontRepository) {
        _viewModel = StateObject(wrappedValue: ProductDetailViewModel(productID: productID, repository: repository))
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                if viewModel.loading {
                    ProgressView("Loading details...")
                } else if let errorMessage = viewModel.errorMessage {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(errorMessage)
                            .foregroundStyle(.red)
                        Button("Retry") {
                            Task {
                                await viewModel.load()
                            }
                        }
                        .buttonStyle(.bordered)
                    }
                } else if let product = viewModel.product {
                    imageGallery(images: product.imageURLs)

                    Text(product.title)
                        .font(.title2)
                        .bold()

                    Text(formatPrice(amountInCents: product.priceAmount, currencyCode: product.currency))
                        .font(.title3)
                        .foregroundStyle(.blue)

                    if !product.description.isEmpty {
                        Text(product.description)
                            .font(.body)
                    }

                    if !product.categories.isEmpty {
                        chipSection(title: "Categories", values: product.categories.map(\.name))
                    }

                    if !product.tags.isEmpty {
                        chipSection(title: "Tags", values: product.tags)
                    }
                }
            }
            .padding()
        }
        .navigationTitle("Product")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func imageGallery(images: [URL]) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            if images.isEmpty {
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.gray.opacity(0.2))
                    .frame(height: 220)
                    .overlay {
                        Text("No image")
                            .foregroundStyle(.secondary)
                    }
            } else {
                TabView(selection: $selectedImageIndex) {
                    ForEach(Array(images.enumerated()), id: \.offset) { index, url in
                        AsyncImage(url: url) { phase in
                            switch phase {
                            case let .success(image):
                                image
                                    .resizable()
                                    .scaledToFit()
                            default:
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(Color.gray.opacity(0.2))
                            }
                        }
                        .tag(index)
                    }
                }
                .frame(height: 220)
                .tabViewStyle(.page)

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(Array(images.enumerated()), id: \.offset) { index, url in
                            AsyncImage(url: url) { phase in
                                switch phase {
                                case let .success(image):
                                    image
                                        .resizable()
                                        .scaledToFill()
                                default:
                                    RoundedRectangle(cornerRadius: 8)
                                        .fill(Color.gray.opacity(0.2))
                                }
                            }
                            .frame(width: 64, height: 64)
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(selectedImageIndex == index ? Color.blue : .clear, lineWidth: 2)
                            )
                            .onTapGesture {
                                selectedImageIndex = index
                            }
                        }
                    }
                }
            }
        }
    }

    private func chipSection(title: String, values: [String]) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.headline)

            FlexibleChipView(values: values)
        }
    }
}

private struct FlexibleChipView: View {
    let values: [String]

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            ForEach(chunk(values, size: 3), id: \.self) { row in
                HStack(spacing: 8) {
                    ForEach(row, id: \.self) { value in
                        Text(value)
                            .font(.caption)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 5)
                            .background(Color(.tertiarySystemFill))
                            .clipShape(Capsule())
                    }
                    Spacer(minLength: 0)
                }
            }
        }
    }

    private func chunk(_ items: [String], size: Int) -> [[String]] {
        stride(from: 0, to: items.count, by: size).map { start in
            Array(items[start ..< min(start + size, items.count)])
        }
    }
}

private struct CategoryRowDTO: Decodable {
    let id: String
    let name: String
}

private struct ProductRowDTO: Decodable {
    let id: String
    let title: String
    let description: String?
    let priceAmount: Int
    let currency: String
    let tags: [String]?

    enum CodingKeys: String, CodingKey {
        case id
        case title
        case description
        case priceAmount = "price_amount"
        case currency
        case tags
    }
}

private struct ProductCategoryRowDTO: Decodable {
    let productID: String
    let categoryID: String?

    enum CodingKeys: String, CodingKey {
        case productID = "product_id"
        case categoryID = "category_id"
    }
}

private struct ProductImageRowDTO: Decodable {
    let productID: String
    let path: String
    let sortOrder: Int

    enum CodingKeys: String, CodingKey {
        case productID = "product_id"
        case path
        case sortOrder = "sort_order"
    }
}
