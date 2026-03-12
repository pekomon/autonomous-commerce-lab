import Foundation

let allCategoriesId = "all"

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
        SupabaseConfigValidator.validate(url: url, anonKey: anonKey)
    }

    static func fromBundle(bundle: Bundle = .main) -> SupabaseRuntimeConfig {
        let url = bundle.object(forInfoDictionaryKey: "SUPABASE_URL") as? String ?? ""
        let anonKey = bundle.object(forInfoDictionaryKey: "SUPABASE_ANON_KEY") as? String ?? ""
        return SupabaseRuntimeConfig(url: url, anonKey: anonKey)
    }
}

func storefrontLoadErrorMessage(prefix: String, error: Error) -> String {
    let detail = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
    if detail.isEmpty {
        return prefix
    }

    return "\(prefix) \(detail)"
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
